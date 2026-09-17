// DigiCode Text compiler — minimal first slice.
// POST /compile  { env: "xiao_rp2040" | "pico", source: "<main.cpp>" }
//   -> 200 UF2 bytes for RP2040/Pico; JSON flash set (manifest + base64 images) for ESP boards
//   -> 422 application/json { error, log }            on compile failure
// GET  /          -> web/index.html
// GET  /libraries/incompat -> the compiler's library incompatibility table (compiler/library-incompat.mjs)
// GET  /boards    -> [{ id, name, family, platform, framework, core, artifact, browserFlash, serial, flashHint,
//                       flashGuide (the steps shown before flashing; compiler/flash-guides.mjs),
//                       pins (generated from the PlatformIO variant header), pinTableNote (how to read
//                       that table, where the variant is generic), pinNotes (sourced board notes),
//                       incompatibleLibraries (rows of the incompatibility table for this platform) }]
// GET  /health    -> { ok: true }
//
// No dependencies. Runs `pio run` in the project-local PlatformIO project
// templates. Requests are serialised, each in a fresh temporary project directory.

import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { validateLibraries } from '../shared/libraries.js';
import { searchLibraries, libraryDetails, verifyLibraries } from './registry.mjs';
import { LIBRARY_INCOMPAT, findIncompat, incompatFor } from './library-incompat.mjs';
import { FLASH_GUIDES } from './flash-guides.mjs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const RP2040_PROJECT = path.join(here, 'pio-rp2040');
const ESP_SHARED = path.join(here, 'pio-esp'); // build scripts shared by every ESP-family project
// Sources for the hand-written pin notes below. Only the board vendor's own wiki and the
// silicon vendor's own datasheet are used; every note was read there before being written here.
const SEEED_XIAO_RP2040 = 'https://wiki.seeedstudio.com/XIAO-RP2040/';
const SEEED_XIAO_ESP32C3 = 'https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/';
// The Wio Node schematic is the only document that gives the board's own GPIO assignments; the
// wiki page links it under Resources -> Hardware. The link target is on files.seeedstudio.com,
// so the page that carries the link is named here, with the link's own text.
const SEEED_WIO_NODE_SCHEMATIC = 'https://wiki.seeedstudio.com/Wio_Node/ の Resources → Hardware → Schematic File in PDF（Wio Node v1.0）';
const RPI_PICO_DATASHEET = 'https://datasheets.raspberrypi.com/pico/pico-datasheet.pdf';
const ESP32C3_DATASHEET = 'https://documentation.espressif.com/esp32-c3_datasheet_en.pdf';
const ESP8266_DATASHEET = 'https://documentation.espressif.com/0a-esp8266ex_datasheet_en.pdf';
const RP2040_FLASH = 'BOOTSELを押したままUSBに接続するとRPI-RP2ドライブが現れる（Macでは「NO NAME」と表示される場合がある）。Build成功後に「書き込み」ボタンを押してそのドライブを選ぶと書き込まれ、完了後にボードは自動で再起動する。';
const ESP_FLASH = 'Build成功後に「書き込み」ボタンを押し、USB接続したボードのポートをブラウザのダイアログで選ぶ。';
// Wio Node is flashed through the Grove USB-serial adapter, which carries no auto-reset line,
// so the board is put into its flashing mode by hand before and after the same browser button.
const WIO_NODE_FLASH = 'GroveのUSBシリアルで接続し、書き込み前にFUNCを押したままRSTを押して書き込みモードに入れる。Build成功後に「書き込み」ボタンを押してポートを選び、完了後にRSTを押す。';
// The only board definition. The UI select, project validation and the AI's board facts
// are all generated from this table via GET /boards; nothing else lists boards.
// pinNotes hold what no header states: one sentence each, with the URL it was read from.
const BOARDS = new Map([
  ['xiao_rp2040', { project: RP2040_PROJECT, family: 'rp2040', platform: 'rp2040', extension: 'uf2', contentType: 'application/octet-stream',
    name: 'XIAO RP2040', framework: 'Arduino', core: 'earlephilhower arduino-pico', artifact: 'uf2', browserFlash: true, serial: true, flashHint: RP2040_FLASH, flashGuide: FLASH_GUIDES.xiao_rp2040,
    pinNotes: [
      { text: 'MCUの動作電圧は3.3Vで、汎用I/Oピンに3.3Vより高い電圧を入力するとチップが破損することがある', source: SEEED_XIAO_RP2040 },
      { text: 'USBとVIN/5Vピンから入れた5Vは基板上のDC-DCで3.3Vに落とされるため、5Vを受けられるのは電源ピンだけ', source: SEEED_XIAO_RP2040 },
      { text: 'オンボードRGB LEDは赤がGPIO17、緑がGPIO16、青がGPIO25で、点灯させるにはピンをLowに引く', source: SEEED_XIAO_RP2040 },
      { text: 'WS2812Bのデータ線GPIO12と電源イネーブルGPIO11は、wikiのピンマップではXIAO RP2040 Plusの列にだけ載っている', source: SEEED_XIAO_RP2040 },
      { text: 'アナログ入力はA0からA3（GPIO26からGPIO29）の4本', source: SEEED_XIAO_RP2040 },
      { text: '14ピンのフットプリントに引き出されているGPIOは11本', source: SEEED_XIAO_RP2040 },
      { text: 'BootボタンはRP2040_BOOTに接続されbootloaderモードへの移行に使う。GPIO番号はwikiに載っていない', source: SEEED_XIAO_RP2040 },
    ] }],
  ['pico', { project: RP2040_PROJECT, family: 'rp2040', platform: 'rp2040', extension: 'uf2', contentType: 'application/octet-stream',
    name: 'Raspberry Pi Pico', framework: 'Arduino', core: 'earlephilhower arduino-pico', artifact: 'uf2', browserFlash: true, serial: true, flashHint: RP2040_FLASH, flashGuide: FLASH_GUIDES.pico,
    pinNotes: [
      { text: 'GPIOは基板上の3.3Vレールから給電されるため3.3V固定', source: RPI_PICO_DATASHEET },
      { text: 'RP2040の30本のうち26本がヘッダに出ており、GPIO0からGPIO22はデジタル専用、GPIO26からGPIO28はデジタルにもADC入力にも使える', source: RPI_PICO_DATASHEET },
      { text: 'GPIO29はADC3としてVSYS/3の測定、GPIO25はユーザーLED、GPIO24はVBUS検出、GPIO23はオンボードSMPSのPower Save制御に基板内部で使われている', source: RPI_PICO_DATASHEET },
      { text: 'ADCに使えるGPIO26からGPIO29はIOVDD（3V3）への内部逆方向ダイオードを持ち、入力電圧はIOVDDより約300mV高い値を超えてはならない', source: RPI_PICO_DATASHEET },
      { text: 'デジタル専用のGPIO0からGPIO25とデバッグピンにはその制限がなく、RP2040が無給電でも電圧をかけて差し支えない', source: RPI_PICO_DATASHEET },
      { text: 'BOOTSELを押したまま電源を入れるとUSBマスストレージとして現れ、uf2ファイルを置くとFlashに書かれて再起動する', source: RPI_PICO_DATASHEET },
      { text: 'テストポイントTP4（GPIO23）は外部から使う想定がなく、TP5（GPIO25）はLEDの順方向電圧までしか振れないため使用は勧められていない', source: RPI_PICO_DATASHEET },
    ] }],
  ['xiao_esp32c3', { project: path.join(here, 'pio-esp32c3'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'XIAO ESP32C3', framework: 'Arduino', core: 'Arduino ESP32', artifact: 'flashset', browserFlash: true, serial: true, flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.xiao_esp32c3,
    pinNotes: [
      { text: 'GPIO2、GPIO8、GPIO9はストラッピングピンで、起動時のレベルによってブートモードが変わる', source: ESP32C3_DATASHEET },
      { text: 'ADC1はGPIO0からGPIO4（ADC1_CH0からADC1_CH4）、ADC2はGPIO5（ADC2_CH0）に割り当てられている', source: ESP32C3_DATASHEET },
      { text: 'ADC1は工場校正済みだがADC2は校正されておらず、一部のチップリビジョンではADC2が動作しない', source: ESP32C3_DATASHEET },
      { text: 'A3（GPIO5）はADC2を使うため誤ったサンプリングで使えなくなることがあり、確実に読むならADC1側のA0/A1/A2を使う', source: SEEED_XIAO_ESP32C3 },
      { text: 'アナログ入力として使えるのはD0からD3（GPIO2からGPIO5）の4本', source: SEEED_XIAO_ESP32C3 },
      { text: 'このボードにLED_BUILTINは無い', source: SEEED_XIAO_ESP32C3 },
      { text: 'BootボタンはGPIO9、ResetボタンはCHIP_ENに接続されている', source: SEEED_XIAO_ESP32C3 },
      { text: 'I/OのHighレベル入力電圧の最大はVDDより0.3V高い値、電源ピンの絶対最大定格は3.6Vなので、5Vを直接加えると定格を超える', source: ESP32C3_DATASHEET },
    ] }],
  ['wio_node', { project: path.join(here, 'pio-esp8266'), family: 'esp', platform: 'esp8266', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'Wio Node', framework: 'Arduino', core: 'Arduino ESP8266', artifact: 'flashset', browserFlash: true, serial: true, flashHint: WIO_NODE_FLASH, flashGuide: FLASH_GUIDES.wio_node,
    // Read before the pin table, because the table's own labels are the trap on this board.
    pinTableNote: 'ピン表のD0からD10はNodeMCU汎用variantのマクロで、Wio Node基板の表記ではない。基板のPORT0（UART/I2C0/D0）とPORT1（Analog/I2C1/D1）にあるD0/D1はコネクタの名前であり、コードのD0/D1マクロ（GPIO16とGPIO5）とは別物。コードではGPIO番号を直接書くこと。',
    pinNotes: [
      { text: '左のGroveコネクタPORT0（回路図のJ3）は、pin1（黄）がGPIO3（U0RXD）、pin2（白）がGPIO1（U0TXD）、pin3が3V3B、pin4がGND', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: '右のGroveコネクタPORT1（回路図のJ6）は、pin1（黄）がGPIO5、pin2（白）がGPIO4、pin3が3V3B、pin4がGND。上のピン表でSCLはGPIO5、SDAはGPIO4なので、I2CはこのPORT1に出ている', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: 'A0はPORT1 pin1から100k二本を直列に通してTOUTへ入り、TOUTは100kでGNDに落ちている。1/3の分圧なのでPORT1 pin1が3.3VのときA0の入力は約1.1V。PORT0側にアナログ入力は無い', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: 'GroveコネクタへのVCCである3V3Bは、GPIO15をHIGHにするとONになる。GPIO15は10kでプルダウンされているため、HIGHにしない限りGroveコネクタに電源は来ない', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: '青のLEDは3V3から2kを通してGPIO2に入っているのでGPIO2をLOWにすると点灯する（GPIO2は10kプルアップ）。赤のLEDは3V3B直結でGroveへの給電表示', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: 'FUNCボタンはGPIO0（10kプルアップ）、RSTボタンはRSTに繋がる。GPIO16は100ΩでRSTに接続されていてdeep sleepからの復帰に使う', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: 'micro USBは給電専用で、UARTもUSBシリアル変換チップも載っていない。GPIO12、GPIO13、GPIO14はテストパッド行きで利用者が使える端子ではない', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: '動作電圧は2.5Vから3.6V、I/O 1本あたりのDC電流は最大12mA、High入力電圧の最大は3.6Vなので5Vを直接加えると定格を超える。GPIO0、GPIO2、GPIO15はブートモードの選択にも使われ、U0TXD（GPIO1）は電源投入時に外部からLowに引いてはならない。A0のTOUTは入力専用で、外部接続時の入力電圧範囲は0Vから1.0V', source: ESP8266_DATASHEET },
    ] }],
]);
// Pin labels are not written by hand: compiler/tools/generate-board-pins.mjs reads them out of the
// PlatformIO variant header this machine builds with and writes compiler/boards/<env>.pins.json.
// Only the committed JSON is read here, so a request never touches the PlatformIO install.
const boardPins = env => JSON.parse(readFileSync(path.join(here, 'boards', `${env}.pins.json`), 'utf8'));
// Public board facts (no paths). Same object shape the browser hands to the AI as boardDetails.
// incompatibleLibraries is the browser's only copy of the table: the Libraries view, the Build
// output and the AI's board sentence all read it from the selected board's entry here.
const PUBLIC_BOARDS = [...BOARDS].map(([id, b]) => ({ id, name: b.name, family: b.family, platform: b.platform, framework: b.framework, core: b.core,
  artifact: b.artifact, browserFlash: b.browserFlash, serial: b.serial, flashHint: b.flashHint, flashGuide: b.flashGuide,
  pins: boardPins(id), pinTableNote: b.pinTableNote ?? null, pinNotes: b.pinNotes,
  incompatibleLibraries: incompatFor(b.platform).map(({ library, reason, alternative }) => ({ library, reason, alternative })) }));
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
      if (board.family === 'esp') {
        for (const script of ['portable_paths.py', 'package_firmware.py'])
          await copyFile(path.join(ESP_SHARED, script), path.join(project, script));
      }
      const { code, log } = await runPio(env, project);
      const durationMs = Date.now() - started;
      if (code !== 0) return { ok: false, log: publicLog(log, project),
        stage: /(?:PackageException|UnknownPackageError|HTTPClientError|Could not install|Could not find the package)/i.test(log) ? 'dependencies' : 'compile', durationMs };
      const artifact = await readFile(path.join(project, '.pio', 'build', env, board.family === 'esp' ? 'flashset.json' : `firmware.${board.extension}`));
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
      try {
        const details = await libraryDetails(url.searchParams.get('owner'), url.searchParams.get('name'));
        // board is optional. Without it, or where no row names that board's platform, the
        // response is exactly what it has always been; the key is never added empty.
        const board = BOARDS.get(url.searchParams.get('board'));
        const row = board && findIncompat(details, board.platform);
        return json(res, 200, row ? { ...details, incompatible: { reason: row.reason, alternative: row.alternative } } : details);
      }
      catch (error) { return json(res, 502, { error: error.message }); }
    }
    if (req.method === 'GET' && url.pathname === '/libraries/incompat') return json(res, 200, LIBRARY_INCOMPAT);
    if (req.method === 'GET' && req.url === '/boards') return json(res, 200, PUBLIC_BOARDS);
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
        // UF2 is downloaded by the browser; the ESP flash set is internal data for browser flashing.
        ...(r.board.family === 'rp2040' ? { 'content-disposition': `attachment; filename="firmware-${env}.${r.board.extension}"` } : {}),
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
