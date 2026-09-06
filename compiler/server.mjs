// DigiCode Text compiler — minimal first slice.
// POST /compile  { env: "xiao_rp2040" | "pico", source: "<main.cpp>" }
//   -> 200 application/octet-stream (firmware.uf2)   on success
//   -> 422 application/json { error, log }            on compile failure
// GET  /          -> web/index.html
// GET  /health    -> { ok: true }
//
// No dependencies. Runs `pio run` in the project-local PlatformIO project
// (compiler/pio-rp2040). Requests are serialised with a simple queue because
// the project dir is shared.

import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PIO_PROJECT = path.join(here, 'pio-rp2040');
const WEB_DIR = path.join(here, '..', 'web');
const PIO_BIN = process.env.PIO_BIN ?? path.join(process.env.HOME ?? '', '.local', 'bin', 'pio');
const PORT = Number(process.env.PORT ?? 3000);
const TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS ?? 600_000);
const ENVS = new Set(['xiao_rp2040', 'pico']);
const MAX_SOURCE = 256 * 1024;

let queue = Promise.resolve();
function serialised(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

function runPio(env) {
  return new Promise((resolve) => {
    const child = spawn(PIO_BIN, ['run', '-e', env], { cwd: PIO_PROJECT });
    let log = '';
    const onData = (d) => { log += d.toString(); if (log.length > 1_000_000) log = log.slice(-500_000); };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const timer = setTimeout(() => { child.kill('SIGKILL'); log += `\n[timeout after ${TIMEOUT_MS} ms]`; }, TIMEOUT_MS);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, log }); });
    child.on('error', (err) => { clearTimeout(timer); resolve({ code: -1, log: log + '\n' + String(err) }); });
  });
}

async function compile(env, source) {
  return serialised(async () => {
    await writeFile(path.join(PIO_PROJECT, 'src', 'main.cpp'), source, 'utf8');
    const started = Date.now();
    const { code, log } = await runPio(env);
    const durationMs = Date.now() - started;
    if (code !== 0) return { ok: false, log, durationMs };
    const uf2 = await readFile(path.join(PIO_PROJECT, '.pio', 'build', env, 'firmware.uf2'));
    return { ok: true, uf2, log, durationMs };
  });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true });
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      const html = await readFile(path.join(WEB_DIR, 'index.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    if (req.method === 'POST' && req.url === '/compile') {
      const body = JSON.parse(await readBody(req, MAX_SOURCE + 4096));
      const env = String(body.env ?? 'xiao_rp2040');
      const source = String(body.source ?? '');
      if (!ENVS.has(env)) return json(res, 400, { error: `unknown env: ${env}` });
      if (!source.trim()) return json(res, 400, { error: 'source is empty' });
      const r = await compile(env, source);
      if (!r.ok) return json(res, 422, { error: 'compile failed', log: r.log.slice(-20_000), durationMs: r.durationMs });
      res.writeHead(200, {
        'content-type': 'application/octet-stream',
        'content-disposition': `attachment; filename="firmware-${env}.uf2"`,
        'x-compile-duration-ms': String(r.durationMs),
      });
      return res.end(r.uf2);
    }
    json(res, 404, { error: 'not found' });
  } catch (err) {
    json(res, 500, { error: String(err?.message ?? err) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`digicode-text compiler listening on http://127.0.0.1:${PORT}  (pio: ${PIO_BIN})`);
});
