// Docker image ウォームアップ兼検証。image build の中で 1 度だけ走る。
// サーバーを起こして全ボードに hello を投げ、1 つでも失敗したら image build を失敗させる。
// ここで落ちるのは「実行時に取りに行く package がまだ image に無い」ということなので、
// image の不備をそのまま build 失敗にする（`pio pkg install` だけでは足りない: 実際の build は
// install とは別の spec で package を解決することがある）。
// image の外で使うものではない。
import { spawn } from 'node:child_process';

const APP = process.env.WARMUP_APP ?? '/app';
const PORT = process.env.WARMUP_PORT ?? '3100';
const JOBS = Number(process.env.WARMUP_JOBS ?? 1);
const HELLO = `#include <Arduino.h>

void setup() {
  Serial.begin(115200);
}

void loop() {
  Serial.println("hello");
  delay(1000);
}
`;

const server = spawn('node', [`${APP}/compiler/server.mjs`], {
  stdio: 'inherit',
  env: { ...process.env, BIND_HOST: '127.0.0.1', PORT },
});
const base = `http://127.0.0.1:${PORT}`;

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`${base}/health`); if (r.ok) return; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('server did not become ready');
}

async function compile(id) {
  const started = Date.now();
  const res = await fetch(`${base}/compile`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ env: id, source: HELLO, libraries: [] }),
    signal: AbortSignal.timeout(20 * 60 * 1000),
  });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  if (res.ok) { const b = await res.arrayBuffer(); console.log(`warmup OK  ${id} ${secs}s ${b.byteLength}B`); return true; }
  const text = await res.text();
  let body = null; try { body = JSON.parse(text); } catch {}
  console.log(`warmup NG  ${id} ${secs}s ${body?.error ?? ''}`);
  console.log((body?.log ?? text).split('\n').slice(-25).join('\n'));
  return false;
}

async function sweep(ids, jobs) {
  const queue = [...ids];
  const bad = [];
  await Promise.all(Array.from({ length: jobs }, async () => {
    for (;;) {
      const id = queue.shift();
      if (!id) return;
      if (!await compile(id)) bad.push(id);
    }
  }));
  return bad;
}

await waitReady();
const boards = await (await fetch(`${base}/boards`)).json();
const ids = boards.map(b => b.id);
console.log(`warmup: ${ids.length} boards, jobs=${JOBS}`);
let bad = await sweep(ids, JOBS);
// 1 周目は jobs=1。実行時に package を入れ直す build が走ると、同時に走っている別の build の
// PATH からコンパイラが消えて Error 127 になるため（2026-09-22 に実測）。2 周目は 3 並列で、
// 全部入った後なら同時 build が壊れないことと、ESP8266 の後でも ESP32 系が建つことを確かめる。
if (!bad.length) bad = await sweep(['xiao_esp32c3', 'xiao_esp32s3', 'esp32_devkitc_v4'], 3);
server.kill('SIGKILL');
if (bad.length) { console.error('warmup failed for: ' + bad.join(', ')); process.exit(1); }
console.log('warmup: all boards built');
