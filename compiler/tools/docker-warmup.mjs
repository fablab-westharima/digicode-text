// Docker image ウォームアップ兼検証。image build の中で 1 度だけ走る。
// サーバーを起こして全ボードに hello を投げ、1 つでも失敗したら image build を失敗させる。
// ここで落ちるのは「実行時に取りに行く package がまだ image に無い」ということなので、
// image の不備をそのまま build 失敗にする（`pio pkg install` だけでは足りない: 実際の build は
// install とは別の spec で package を解決することがある）。
// image の外で使うものではない。
import { spawn } from 'node:child_process';
import { request } from 'node:http';

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

// fetch は使わない。Node の fetch はヘッダが 300 秒返らないと切る（undici の既定）が、
// 初回の ESP32 系 build は 4 コア機で 5 分を超える（ML30 で 2026-09-22 に実測）。
function post(path, payload) {
  return new Promise((resolve, reject) => {
    const req = request(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, timeout: 20 * 60 * 1000 }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('timeout', () => req.destroy(new Error('no response within 20 minutes')));
    req.on('error', reject);
    req.end(JSON.stringify(payload));
  });
}

async function compile(id) {
  const started = Date.now();
  const res = await post('/compile', { env: id, source: HELLO, libraries: [] });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  if (res.status === 200) { console.log(`warmup OK  ${id} ${secs}s ${res.body.byteLength}B`); return true; }
  const text = res.body.toString('utf8');
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
