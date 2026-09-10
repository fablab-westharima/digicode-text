// DigiCode Text compiler — minimal first slice.
// POST /compile  { env: "xiao_rp2040" | "pico", source: "<main.cpp>" }
//   -> 200 UF2 for RP2040, ZIP flash set for XIAO ESP32C3 on success
//   -> 422 application/json { error, log }            on compile failure
// GET  /          -> web/index.html
// GET  /health    -> { ok: true }
//
// No dependencies. Runs `pio run` in the project-local PlatformIO project
// templates. Requests are serialised, each in a fresh temporary project directory.

import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { validateLibraries } from '../shared/libraries.js';
import { searchLibraries, libraryDetails, verifyLibraries } from './registry.mjs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const RP2040_PROJECT = path.join(here, 'pio-rp2040');
const BOARDS = new Map([
  ['xiao_rp2040', { project: RP2040_PROJECT, extension: 'uf2', contentType: 'application/octet-stream' }],
  ['pico', { project: RP2040_PROJECT, extension: 'uf2', contentType: 'application/octet-stream' }],
  ['xiao_esp32c3', { project: path.join(here, 'pio-esp32c3'), extension: 'zip', contentType: 'application/zip' }],
]);
const WEB_DIR = path.join(here, '..', 'web');
const PIO_BIN = process.env.PIO_BIN ?? path.join(process.env.HOME ?? '', '.local', 'bin', 'pio');
const PORT = Number(process.env.PORT ?? 3100);
const TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS ?? 600_000);

const MAX_SOURCE = 256 * 1024;

let queue = Promise.resolve();
function serialised(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

function runPio(env, project) {
  return new Promise((resolve) => {
    const child = spawn(PIO_BIN, ['run', '-e', env], { cwd: project });
    let log = '';
    const onData = (d) => { log += d.toString(); if (log.length > 1_000_000) log = log.slice(-500_000); };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const timer = setTimeout(() => { child.kill('SIGKILL'); log += `\n[timeout after ${TIMEOUT_MS} ms]`; }, TIMEOUT_MS);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, log }); });
    child.on('error', (err) => { clearTimeout(timer); resolve({ code: -1, log: log + '\n' + String(err) }); });
  });
}

function publicLog(log, project = '') {
  for (const prefix of [project, here, process.env.HOME].filter(Boolean)) log = log.split(prefix).join('[local]');
  return log.replace(/https?:\/\/[^\s)]+/g, '[URL]').slice(-20_000);
}
async function compile(env, source, libraries) {
  return serialised(async () => {
    const board = BOARDS.get(env);
    const started = Date.now();
    try { await verifyLibraries(libraries); }
    catch (error) { return { ok: false, log: error.message, stage: 'dependencies', durationMs: Date.now() - started }; }
    // A fresh source/config/libdeps/build tree for every request, including zero dependencies.
    // Only PlatformIO's package download cache and toolchains are shared.
    const project = await mkdtemp(path.join(os.tmpdir(), 'digicode-build-'));
    try {
      await mkdir(path.join(project, 'src'));
      await writeFile(path.join(project, 'src', 'main.cpp'), source, 'utf8');
      const template = await readFile(path.join(board.project, 'platformio.ini'), 'utf8');
      const config = '[platformio]\nlib_dir = lib\ngloballib_dir = global-lib\nlibdeps_dir = .pio/libdeps\n\n[env]\nlib_deps =\n' +
        libraries.map(p => `    ${p.owner}/${p.name}@${p.version}`).join('\n') + '\n\n' + template;
      await writeFile(path.join(project, 'platformio.ini'), config);
      if (env === 'xiao_esp32c3') for (const file of ['portable_paths.py', 'package_firmware.py'])
        await copyFile(path.join(board.project, file), path.join(project, file));
      const { code, log } = await runPio(env, project);
      const durationMs = Date.now() - started;
      if (code !== 0) return { ok: false, log: publicLog(log, project),
        stage: /(?:PackageException|UnknownPackageError|HTTPClientError|Could not install|Could not find the package)/i.test(log) ? 'dependencies' : 'compile', durationMs };
      const artifact = await readFile(path.join(project, '.pio', 'build', env, `firmware.${board.extension}`));
      return { ok: true, artifact, board, durationMs };
    } finally { await rm(project, { recursive: true, force: true }); }
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
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/libraries/search') {
      try { return json(res, 200, await searchLibraries(url.searchParams.get('q'), Number(url.searchParams.get('page') || 1))); }
      catch (error) { return json(res, 502, { error: error.message }); }
    }
    if (req.method === 'GET' && url.pathname === '/libraries/details') {
      try { return json(res, 200, await libraryDetails(url.searchParams.get('owner'), url.searchParams.get('name'))); }
      catch (error) { return json(res, 502, { error: error.message }); }
    }
    if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true });
    if (req.method === 'GET' && req.url.startsWith('/assets/')) {
      const name = req.url.slice('/assets/'.length);
      // Only generated flat assets are public; never expose the repo or node_modules.
      if (!/^[a-zA-Z0-9_.-]+\.(js|css|ttf)$/.test(name)) return json(res, 404, { error: 'not found' });
      try {
        const asset = await readFile(path.join(WEB_DIR, 'dist', name));
        const types = { '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf' };
        res.writeHead(200, { 'content-type': types[path.extname(name)], 'cache-control': 'no-cache' });
        return res.end(asset);
      } catch (err) {
        if (err.code === 'ENOENT') return json(res, 404, { error: 'asset missing; run npm run build:web' });
        throw err;
      }
    }
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      const html = await readFile(path.join(WEB_DIR, 'index.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    if (req.method === 'POST' && req.url === '/compile') {
      let body, libraries;
      try {
        body = JSON.parse(await readBody(req, MAX_SOURCE + 16_384));
        if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.source !== 'string' ||
            (body.env !== undefined && typeof body.env !== 'string') ||
            (body.projectId !== undefined && (typeof body.projectId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.projectId))) ||
            (body.projectRevision !== undefined && (!Number.isSafeInteger(body.projectRevision) || body.projectRevision < 0))) throw new Error('不正なBuild要求です');
        libraries = validateLibraries(body.libraries);
      } catch (error) { return json(res, 400, { error: error instanceof SyntaxError ? '不正なJSONです' : error.message }); }
      const env = body.env ?? 'xiao_rp2040', source = body.source;
      if (!BOARDS.has(env)) return json(res, 400, { error: 'unknown env' });
      if (!source.trim() || Buffer.byteLength(source) > MAX_SOURCE) return json(res, 400, { error: 'source is empty or exceeds 256 KiB' });
      const r = await compile(env, source, libraries);
      if (!r.ok) return json(res, 422, { error: r.stage === 'dependencies' ? 'ライブラリ取得・確認に失敗しました' : 'コンパイルに失敗しました', stage: r.stage, log: r.log, durationMs: r.durationMs });
      res.writeHead(200, {
        'content-type': r.board.contentType,
        'content-disposition': `attachment; filename="firmware-${env}.${r.board.extension}"`,
        'x-compile-duration-ms': String(r.durationMs),
        'x-artifact-sha256': createHash('sha256').update(r.artifact).digest('hex'),
      });
      return res.end(r.artifact);
    }
    json(res, 404, { error: 'not found' });
  } catch (err) {
    json(res, 500, { error: 'サーバー処理に失敗しました。再試行してください' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`digicode-text compiler listening on http://127.0.0.1:${PORT}  (pio: ${PIO_BIN})`);
});
