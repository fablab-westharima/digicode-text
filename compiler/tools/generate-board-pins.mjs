// Generates compiler/boards/<env>.pins.json from the PlatformIO install this machine builds with.
//
//   node compiler/tools/generate-board-pins.mjs          # write the JSON files
//   node compiler/tools/generate-board-pins.mjs --check   # exit 1 if a file is out of date
//
// Nothing here runs at request time: the server reads only the committed JSON.
// The chain followed for every env is the one PlatformIO itself follows:
//   compiler/pio-*/platformio.ini  [env:<env>] platform + board
//     -> ~/.platformio/platforms/<platform>/boards/<board>.json  build.variant + build.core
//     -> ~/.platformio/packages/<framework package>/variants/<variant>/pins_arduino.h
// The framework package is platform.json frameworks.arduino.package where the manifest names
// one; pioarduino's espressif32 names none, so its first installed framework package is used.
// The exception is build.core "earlephilhower", which the community platform's builder
// resolves to framework-arduinopico (builder/frameworks/arduino/arduino.py).
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
export const COMPILER_DIR = path.join(here, '..');
export const OUT_DIR = path.join(COMPILER_DIR, 'boards');
export const PIO_HOME = process.env.PLATFORMIO_CORE_DIR ?? path.join(os.homedir(), '.platformio');
// Each env and the PlatformIO project template that defines it (compiler/server.mjs BOARDS).
export const ENVS = [
  { env: 'xiao_esp32c3', project: 'pio-esp32c3' },
  { env: 'wio_node', project: 'pio-esp8266' },
  { env: 'xiao_rp2040', project: 'pio-rp2040' },
  { env: 'pico', project: 'pio-rp2040' },
];
// Labels read out of the variant header. Digital/analog labels become rows; the rest become
// functions attached to the row that carries the same GPIO number.
const DIGITAL = /^D(\d{1,2})$/;
const ANALOG = /^A(\d{1,2})$/;
const FUNCTIONS = ['LED_BUILTIN', 'SDA', 'SCL', 'TX', 'RX', 'MOSI', 'MISO', 'SCK', 'SS'];
// Some cores expose a function only through its PIN_* macro; these are tried when the plain
// Arduino name is absent from the variant header.
const FALLBACK = {
  LED_BUILTIN: ['PIN_LED'],
  SDA: ['PIN_WIRE_SDA', 'PIN_WIRE0_SDA'], SCL: ['PIN_WIRE_SCL', 'PIN_WIRE0_SCL'],
  TX: ['PIN_SERIAL1_TX', 'PIN_SERIAL_TX'], RX: ['PIN_SERIAL1_RX', 'PIN_SERIAL_RX'],
  MOSI: ['PIN_SPI_MOSI', 'PIN_SPI0_MOSI'], MISO: ['PIN_SPI_MISO', 'PIN_SPI0_MISO'],
  SCK: ['PIN_SPI_SCK', 'PIN_SPI0_SCK'], SS: ['PIN_SPI_SS', 'PIN_SPI0_SS'],
};

const exists = async p => { try { await access(p); return true; } catch { return false; } };

async function readJson(file) { return JSON.parse(await readFile(file, 'utf8')); }

// [env:<name>] section of a platformio.ini, as a key -> value map.
export function iniSection(ini, env) {
  const body = ini.split(`[env:${env}]`)[1]?.split(/\n\[/)[0];
  if (body === undefined) throw new Error(`[env:${env}] not found`);
  return Object.fromEntries([...body.matchAll(/^\s*([\w.]+)\s*=\s*(.+)$/gm)].map(m => [m[1], m[2].trim()]));
}

// Directory under ~/.platformio/platforms for a platformio.ini "platform =" value.
async function platformDir(spec) {
  const dirs = await readdir(path.join(PIO_HOME, 'platforms'));
  const full = name => path.join(PIO_HOME, 'platforms', name);
  if (/^(https?|git)[:+]/.test(spec)) {
    const want = spec.replace(/\.git$/, '');
    for (const name of dirs) {
      // An archive install records the URL it came from in .piopm; a git checkout has no
      // .piopm at all, so its origin remote is the only thing that names the source.
      const meta = await readJson(path.join(full(name), '.piopm')).catch(() => null);
      if (meta?.spec?.uri?.replace(/\.git$/, '') === want) return full(name);
      if (!await exists(path.join(full(name), '.git'))) continue;
      const { stdout } = await run('git', ['-C', full(name), 'remote', 'get-url', 'origin']).catch(() => ({ stdout: '' }));
      if (stdout.trim().replace(/\.git$/, '') === want) return full(name);
    }
    throw new Error(`no installed platform from ${spec}`);
  }
  const [name, version] = spec.split('@');
  const candidates = dirs.filter(d => d === spec || d === name || d.startsWith(name + '@'));
  for (const dir of candidates) {
    if (!version) { if (dir === name) return full(dir); continue; }
    if (dir === spec) return full(dir);
    const meta = await readJson(path.join(full(dir), '.piopm')).catch(() => null);
    if (meta?.name === name && meta.version === version) return full(dir);
  }
  throw new Error(`platform ${spec} is not installed under ${PIO_HOME}/platforms`);
}

// Directory under ~/.platformio/packages for one of a platform's packages. A package whose
// manifest version is a URL is unpacked into "<name>@src-<hash>", so the name alone is not the
// directory; the .piopm of the candidates carries the URL the manifest asked for. Two platforms
// installed side by side can name the same package from different sources, so the URL is what
// tells their directories apart.
async function packageDir(pkg, platformMeta) {
  const source = platformMeta.packages?.[pkg]?.version ?? '';
  const under = name => path.join(PIO_HOME, 'packages', name);
  if (!/^(https?|git|file)[:+]/.test(source)) return under(pkg);
  for (const name of (await readdir(path.join(PIO_HOME, 'packages'))).filter(d => d === pkg || d.startsWith(pkg + '@'))) {
    const meta = await readJson(path.join(under(name), '.piopm')).catch(() => null);
    // A git checkout carries no .piopm; nothing else records where that directory came from,
    // so the plain <name> one is taken. A directory whose .piopm names a different source was
    // installed for another platform and is never used, however it is named.
    if (meta ? meta.name === pkg && meta.spec?.uri === source : name === pkg) return under(name);
  }
  throw new Error(`package ${pkg} from ${source} is not installed under ${PIO_HOME}/packages`);
}

// The package that carries the Arduino core's variants, as the platform's builder resolves it:
// the manifest's own name for it where there is one (espressif8266), otherwise the platform's
// first installed framework package (pioarduino's espressif32 arduino entry has only a script).
async function arduinoPackage(platformMeta) {
  const named = platformMeta.frameworks?.arduino?.package;
  if (named) return named;
  for (const [name, options] of Object.entries(platformMeta.packages ?? {})) {
    if (options.type !== 'framework') continue;
    const dir = await packageDir(name, platformMeta).catch(() => null);
    if (dir && await exists(dir)) return name;
  }
  return null;
}

// Strip block comments; keep each line's trailing // comment so "not pinned out" style
// notes written by the core authors survive into the JSON.
function preprocess(text) {
  const noBlocks = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
  return noBlocks.split('\n').map(line => {
    const at = line.indexOf('//');
    return at < 0 ? { code: line, note: '' } : { code: line.slice(0, at), note: line.slice(at + 2).trim() };
  });
}

const NUMBER = /^-?\d+$/;
function normalise(value) {
  let v = value.trim();
  while (/^\(.*\)$/.test(v) && v.slice(1, -1).indexOf('(') === -1) v = v.slice(1, -1).trim();
  const bare = v.replace(/^(\d+)[uUlL]{0,3}$/, '$1');
  if (NUMBER.test(bare)) return { number: Number(bare) };
  if (/^[A-Za-z_]\w*$/.test(v)) return { alias: v };
  return null;
}

// Collect "#define NAME value" and "static const uintN_t NAME = value;" from a variant header,
// following relative includes. Every definition of a name is kept in source order; the first one
// that resolves to a number wins. That is what the two idioms these cores use both mean:
//   #ifndef NAME / #define NAME <value>            -> the earlier definition is the effective one
//   #ifdef  GUARD / NAME = GUARD / #else / NAME = <default>   (arduino-pico generic/common.h)
//     -> when GUARD is not defined anywhere in the chain the #else default is the effective one.
// Conditionals are not evaluated, so a header that defines the same name in two mutually
// exclusive branches (common.h's RP2040 vs RP2350B blocks) yields the first branch's value.
async function collectSymbols(file, seen = new Set(), out = new Map()) {
  const resolved = path.resolve(file);
  if (seen.has(resolved)) return out;
  seen.add(resolved);
  const lines = preprocess(await readFile(resolved, 'utf8'));
  const includes = [];
  for (const { code, note } of lines) {
    const inc = code.match(/^\s*#\s*include\s+"([^"]+)"/);
    if (inc) { includes.push(path.resolve(path.dirname(resolved), inc[1])); continue; }
    const def = code.match(/^\s*#\s*define\s+([A-Za-z_]\w*)(?!\()\s+(\S.*?)\s*$/);
    const con = code.match(/^\s*static\s+const\s+u?int\d+_t\s+([A-Za-z_]\w*)\s*=\s*([^;]+);/);
    const m = def ?? con;
    if (!m) continue;
    const value = normalise(m[2]);
    if (!value) continue;
    if (!out.has(m[1])) out.set(m[1], []);
    out.get(m[1]).push({ ...value, note, file: resolved });
  }
  for (const inc of includes) if (await exists(inc)) await collectSymbols(inc, seen, out);
  return out;
}

function resolveSymbol(symbols, name, depth = 0) {
  const entries = symbols.get(name);
  if (!entries || depth > 8) return null;
  for (const entry of entries) {
    if (entry.number !== undefined) return { gpio: entry.number, note: entry.note, via: name, file: entry.file };
    const next = resolveSymbol(symbols, entry.alias, depth + 1);
    // Keep every comment on the chain: the "not pinned out" style note is often on the PIN_* macro.
    if (next) return { ...next, note: [entry.note, next.note].filter(Boolean).join(' / '), via: name };
  }
  return null;
}

// Cores without D0..Dn defines (Arduino mbed) carry the digital pin order in variant.cpp's
// g_APinDescription table instead: entry i is digital pin i.
async function digitalFromVariantCpp(variantDir) {
  const file = path.join(variantDir, 'variant.cpp');
  if (!await exists(file)) return [];
  const text = (await readFile(file, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, ' ');
  const table = text.split(/PinDescription\s+g_APinDescription\s*\[\s*\]\s*=\s*\{/)[1]?.split(/\n\s*\}\s*;/)[0];
  if (!table) return [];
  return [...table.matchAll(/\{\s*p(\d+)\s*,/g)].map((m, index) => ({ label: `D${index}`, pin: index, gpio: Number(m[1]) }));
}

export async function generate(spec) {
  const ini = await readFile(path.join(COMPILER_DIR, spec.project, 'platformio.ini'), 'utf8');
  const section = iniSection(ini, spec.env);
  const platform = await platformDir(section.platform);
  const boardFile = path.join(platform, 'boards', `${section.board}.json`);
  const boardDef = await readJson(boardFile);
  const core = section['board_build.core'] ?? boardDef.build.core;
  const platformMeta = await readJson(path.join(platform, 'platform.json'));
  const pkg = core === 'earlephilhower' ? 'framework-arduinopico' : await arduinoPackage(platformMeta);
  if (!pkg) throw new Error(`${spec.env}: no arduino framework package for platform ${section.platform}`);
  const pkgDir = await packageDir(pkg, platformMeta);
  const variantDir = path.join(pkgDir, 'variants', boardDef.build.variant);
  const header = path.join(variantDir, 'pins_arduino.h');
  if (!await exists(header)) throw new Error(`${spec.env}: ${header} is missing`);
  const symbols = await collectSymbols(header);
  const pkgVersion = (await readJson(path.join(pkgDir, 'package.json')).catch(() => ({}))).version ?? null;

  // Digital and analog labels first: they define the rows.
  const labels = [];
  for (const [name] of symbols) {
    if (!DIGITAL.test(name) && !ANALOG.test(name)) continue;
    const r = resolveSymbol(symbols, name);
    if (r) labels.push({ label: name, pin: r.gpio, note: r.note });
  }
  // How many pins of each kind this board's own header says it has.
  const digitalCount = resolveSymbol(symbols, 'NUM_DIGITAL_PINS')?.gpio ?? null;
  const analogCount = resolveSymbol(symbols, 'NUM_ANALOG_INPUTS')?.gpio ?? null;
  let digital = labels.filter(l => DIGITAL.test(l.label));
  let analog = labels.filter(l => ANALOG.test(l.label));
  // A Dn/An label past the board's own count is not a pin of this board: arduino-pico's shared
  // common.h also carries the wider RP2350B block (D30..D47, A4..A7), which this MCU does not have.
  if (digitalCount !== null) digital = digital.filter(l => l.pin < digitalCount);
  if (analogCount !== null) analog = analog.filter(l => Number(ANALOG.exec(l.label)[1]) < analogCount);
  const digitalFrom = digital.length ? 'pins_arduino.h' : 'variant.cpp';
  if (!digital.length) digital = await digitalFromVariantCpp(variantDir);

  // Every other named function, resolved to its GPIO number.
  const functions = [];
  for (const name of FUNCTIONS) {
    let r = resolveSymbol(symbols, name);
    if (!r) for (const alt of FALLBACK[name] ?? []) { r = r ?? resolveSymbol(symbols, alt); }
    if (r) functions.push({ name, pin: r.gpio, via: r.via === name ? null : r.via, note: r.note || null });
  }

  // The Arduino pin number written in a sketch is the GPIO number on all four cores, except
  // where the header's own NUM_DIGITAL_PINS shows the number is an index past the GPIO range
  // (the ESP8266 core numbers its dedicated ADC input that way). No GPIO is claimed there.
  const gpioOf = pin => (digitalCount !== null && pin >= digitalCount ? null : pin);
  const order = (a, b) => a.pin - b.pin || a.label.localeCompare(b.label);
  const rows = new Map();
  for (const d of [...digital].sort(order)) {
    if (!rows.has(d.pin)) rows.set(d.pin, { label: d.label, pin: d.pin, gpio: d.gpio ?? gpioOf(d.pin), functions: [], adc: null, note: d.note || null });
    else rows.get(d.pin).functions.push(d.label);
  }
  for (const a of [...analog].sort(order)) {
    const row = rows.get(a.pin);
    if (row) row.adc = row.adc ?? a.label;
    else rows.set(a.pin, { label: a.label, pin: a.pin, gpio: gpioOf(a.pin), functions: [], adc: a.label, note: a.note || null });
  }
  const unlabelled = [];
  for (const f of functions) {
    const row = rows.get(f.pin);
    if (row) row.functions.push(f.name);
    else unlabelled.push({ name: f.name, pin: f.pin, gpio: gpioOf(f.pin), note: f.note });
  }
  return {
    env: spec.env,
    platform: section.platform,
    board: section.board,
    mcu: boardDef.build.mcu,
    core,
    variant: boardDef.build.variant,
    frameworkPackage: pkg,
    frameworkVersion: pkgVersion,
    // Paths inside the PlatformIO install, recorded so the generated file can be traced back.
    sources: {
      platformioIni: `compiler/${spec.project}/platformio.ini`,
      boardDefinition: path.relative(PIO_HOME, boardFile),
      variantHeader: path.relative(PIO_HOME, header),
      digitalLabelsFrom: digitalFrom,
    },
    pins: [...rows.values()].sort((a, b) => a.pin - b.pin),
    unlabelledFunctions: unlabelled,
  };
}

export const outFile = env => path.join(OUT_DIR, `${env}.pins.json`);
export const serialise = data => JSON.stringify(data, null, 2) + '\n';

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const spec of ENVS) {
    const text = serialise(await generate(spec));
    const file = outFile(spec.env);
    const current = await readFile(file, 'utf8').catch(() => null);
    if (current === text) { console.log(`ok       ${path.relative(COMPILER_DIR, file)}`); continue; }
    if (check) { stale++; console.log(`STALE    ${path.relative(COMPILER_DIR, file)}`); continue; }
    await writeFile(file, text);
    console.log(`written  ${path.relative(COMPILER_DIR, file)}`);
  }
  if (stale) process.exit(1);
}
