# 06_probe 実装 — 再現用の記録

**この文書の性格:** `03` / `04` の実測を**再現するために必要な probe コード**の保存。
**production 実装ではない** (認証・rate limit・quota・cleanup・サイズ上限がいずれも無い。`05_…md` R-1)。

**著作権上の位置づけ:** 以下は本セッションが**新規に書いたコード**であり、
donor リポジトリのコードは 1 行も含まない。donor 側で行った変更は
`src/server.ts` への **2 文の追加のみ**で、その 2 文も下記のとおり新規記述である。
donor 資産の移植ではないため、migration evidence の対象ではない (CLAUDE.md §9)。

---

## 1. donor 側への変更 (isolated clone 上のみ、production 未適用)

`src/server.ts` に追加した 2 文。既存の import 行の直後と、`const port = ...` の直前に置いた。
**既存行の変更・削除は 0。**

```ts
import { textRoutes } from './textRoutes.js'; // PROBE: additive Text route
```

```ts
app.route('/', textRoutes); // PROBE: additive Text route
```

その他に、環境 deviation **D-1** として `src/compile.ts` の `lib_deps` 1 行
(`gin66/FastAccelStepper@^0.32` → `^0.34`) を isolated clone 上でのみ読み替えている
(`01_…md` §3)。

---

## 3. `src/textRoutes.ts` (      32 行)

```ts
/**
 * PROBE CODE - NOT PRODUCTION. digicode-text Compiler Shared/Separate probe.
 *
 * textRoutes.ts - the additive surface. Everything the Text path needs to
 * reach the outside world is one Hono sub-app, so server.ts changes by
 * exactly two lines (one import, one `app.route`) and no existing route,
 * middleware or handler is edited.
 */

import { Hono } from 'hono';

import { compileTextProject, type TextCompileRequest } from './textCompile.js';

export const textRoutes = new Hono();

textRoutes.get('/api/text/health', (c) =>
  c.json({ status: 'ok', service: 'digicode-text-compile-probe', route: 'additive' }),
);

textRoutes.post('/api/compile/project', async (c) => {
  const body = (await c.req.json().catch(() => null)) as TextCompileRequest | null;
  if (!body || typeof body.board !== 'string') {
    return c.json({ success: false, error: 'invalid request body', diagnostics: [] }, 400);
  }
  const fullPackage = c.req.query('fullPackage') === 'true';
  const noCache = c.req.query('no-cache') === 'true';
  const result = await compileTextProject(body, { fullPackage, noCache });
  // Same legacy-compatible convention as the Classic route: a compile
  // failure is a 200 with success:false, so a client distinguishes
  // "the compiler ran and refused the code" from "the request was bad".
  return c.json(result, 200);
});
```

## 4. `src/textBoards.ts` (      39 行)

```ts
/**
 * PROBE CODE — NOT PRODUCTION. digicode-text Compiler Shared/Separate probe.
 *
 * textBoards.ts — a Text-side board registry that is INDEPENDENT of
 * `boards.ts`. Its purpose in this probe is to answer §9: whether a
 * Text-only board can exist without touching the Classic registry.
 *
 * It deliberately does not import FQBN_TO_PIO. The overlap (esp32dev, ...)
 * is a duplicate on purpose — the probe measures the cost of that duplicate,
 * it does not propose it as the final design.
 */

export interface TextPioTarget {
  platform: string;
  board: string;
  extraBuildFlags?: string[];
}

/** Same pioarduino pin as boards.ts — shared toolchain is the premise (§14). */
const PIOARDUINO_PLATFORM =
  'https://github.com/pioarduino/platform-espressif32/releases/download/54.03.21/platform-espressif32.zip';

export const TEXT_BOARDS: Record<string, TextPioTarget> = {
  'esp32:esp32:esp32': { platform: PIOARDUINO_PLATFORM, board: 'esp32dev' },
  'esp32:esp32:esp32s3': { platform: PIOARDUINO_PLATFORM, board: 'esp32-s3-devkitc-1' },
  'esp32:esp32:esp32c3': { platform: PIOARDUINO_PLATFORM, board: 'esp32-c3-devkitm-1' },
  // Text-only entry — exists in no Classic registry. §9 probe subject.
  'digicode-text:esp32:probe_only': {
    platform: PIOARDUINO_PLATFORM,
    board: 'esp32dev',
    extraBuildFlags: ['-DDIGICODE_TEXT_PROBE_BOARD=1'],
  },
};

export function textPioTargetFor(fqbn: string): TextPioTarget {
  const t = TEXT_BOARDS[fqbn];
  if (!t) throw new Error(`Unsupported FQBN "${fqbn}" on the text route.`);
  return t;
}
```

## 5. `src/textProject.ts` (     120 行)

```ts
/**
 * PROBE CODE - NOT PRODUCTION. digicode-text Compiler Shared/Separate probe.
 *
 * textProject.ts - materialize an arbitrary multi-file project on disk.
 *
 * This is the piece `projectStore.ts` cannot do: `writeMainIno()` writes
 * exactly one file, `src/main.ino`. Nothing here imports projectStore, so
 * the Classic materializer is untouched.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export interface TextFile {
  /** Project-relative POSIX path, e.g. `src/main.cpp`, `include/sensor.h`. */
  path: string;
  content: string;
}

/** Directories a request is allowed to write into. Everything else is refused. */
const ALLOWED_ROOTS = ['src', 'include', 'lib'];
const PATH_RE = /^[A-Za-z0-9._][A-Za-z0-9._/-]*$/;

export class TextProjectError extends Error {}

/**
 * Refuse anything that could escape the project dir or collide with the
 * files we own (platformio.ini, .pio/). Path traversal is the whole risk
 * surface of accepting client-named files, so it is checked before any I/O.
 */
export function validateFiles(files: TextFile[]): void {
  if (!Array.isArray(files) || files.length === 0) {
    throw new TextProjectError('files must be a non-empty array');
  }
  const seen = new Set<string>();
  let hasSrc = false;
  for (const f of files) {
    if (!f || typeof f.path !== 'string' || typeof f.content !== 'string') {
      throw new TextProjectError('each file needs {path: string, content: string}');
    }
    const p = f.path;
    if (p.startsWith('/') || p.includes('\\') || p.includes('..') || !PATH_RE.test(p)) {
      throw new TextProjectError(`illegal file path: ${JSON.stringify(p)}`);
    }
    const root = p.split('/')[0];
    if (!ALLOWED_ROOTS.includes(root)) {
      throw new TextProjectError(`file path must start with one of ${ALLOWED_ROOTS.join('/')}: ${p}`);
    }
    if (seen.has(p)) throw new TextProjectError(`duplicate file path: ${p}`);
    seen.add(p);
    if (root === 'src') hasSrc = true;
  }
  if (!hasSrc) throw new TextProjectError('at least one file under src/ is required');
}

/** Stable manifest string - the cache key input. Order-independent. */
export function manifestOf(files: TextFile[]): string {
  return [...files]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((f) => `${f.path}\n${f.content}`)
    .join('\n---\n');
}

/** `projectId` becomes a directory name and a lock key - sanitize hard. */
export function sanitizeProjectId(id: string | undefined, fallback: string): string {
  if (!id) return fallback;
  const s = id.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 64);
  return s.length > 0 ? s : fallback;
}

export interface TextProjectInit {
  key: string;
  projectDir: string;
}

export function ensureTextProject(
  textProjectsRoot: string,
  projectId: string,
  iniContent: string,
  files: TextFile[],
): TextProjectInit {
  const projectDir = path.join(textProjectsRoot, projectId);
  mkdirSync(projectDir, { recursive: true });

  const iniPath = path.join(projectDir, 'platformio.ini');
  let needWrite = true;
  if (existsSync(iniPath)) {
    try {
      needWrite = readFileSync(iniPath, 'utf-8') !== iniContent;
    } catch {
      needWrite = true;
    }
  }
  if (needWrite) writeFileSync(iniPath, iniContent);

  // Wipe the source roots before writing: a file the client removed between
  // two requests must disappear from the build, otherwise a stale .cpp keeps
  // getting compiled and linked. `.pio/` is deliberately NOT touched - that
  // is the incremental build state this design depends on.
  for (const root of ALLOWED_ROOTS) {
    rmSync(path.join(projectDir, root), { recursive: true, force: true });
  }
  for (const f of files) {
    const abs = path.join(projectDir, f.path);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, f.content);
  }
  return { key: projectId, projectDir };
}

/** Best-effort source scrub, mirroring the Classic post-compile cleanup. */
export function scrubTextSources(projectDir: string, files: TextFile[]): void {
  for (const f of files) {
    try {
      writeFileSync(path.join(projectDir, f.path), '');
    } catch {
      /* best-effort: never fail a compile result on cleanup */
    }
  }
}
```

## 6. `src/textCompile.ts` (     402 行)

```ts
/**
 * PROBE CODE - NOT PRODUCTION. digicode-text Compiler Shared/Separate probe.
 *
 * textCompile.ts - full-source / multi-file compile path.
 *
 * Deliberate constraints of this probe:
 *   - imports NOTHING from compile.ts / inject.ts / projectStore.ts / boards.ts
 *     -> the Classic path cannot change behaviour because this file exists;
 *   - own lib_deps set        (probes the global lib_deps question, section 8)
 *   - own board registry      (probes the board question, section 9)
 *   - own project root        (probes workspace isolation, section 7)
 *   - own cache namespace     (probes cache collision, section 7)
 *   - own lock key namespace  (probes lock collision, section 7)
 *   - SHARED PlatformIO home, platform packages and build_cache_dir
 *     (that sharing is the whole point of Option B, section 17)
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { textPioTargetFor, type TextPioTarget } from './textBoards.js';
import {
  ensureTextProject,
  manifestOf,
  sanitizeProjectId,
  scrubTextSources,
  validateFiles,
  type TextFile,
} from './textProject.js';
import { withLock } from './projectLock.js';

const execP = promisify(exec);

export interface TextCompileRequest {
  board: string;
  files: TextFile[];
  /** Editing-session identity. One workspace per id; keeps incremental builds. */
  projectId?: string;
  /** Text-side dependency set. Absent = the Text default set below. */
  libDeps?: string[];
  extraBuildFlags?: string[];
}

export interface TextDiagnostic {
  file: string;
  line: number;
  column: number | null;
  severity: 'error' | 'warning' | 'note';
  message: string;
}

export interface TextCompileSuccess {
  success: true;
  firmware: string;
  bootloader?: string;
  partitions?: string;
  bootApp0?: string;
  durationMs: number;
  pioBoard: string;
  projectId: string;
  cached: boolean;
  diagnostics: TextDiagnostic[];
}

export interface TextCompileFailure {
  success: false;
  error: string;
  stderr?: string;
  durationMs: number;
  projectId?: string;
  diagnostics: TextDiagnostic[];
}

export type TextCompileResult = TextCompileSuccess | TextCompileFailure;

export interface TextEnv {
  pioBin: string;
  pioHome: string;
  /** Text project root - separate from PROJECTS_DIR by default. */
  textProjectsDir: string;
  /** Text cache root - separate from CACHE_DIR by default. */
  textCacheDir: string;
  /** Vendored libs already inside the image (shared, read-only). */
  libsDir: string;
  /** Extra lib roots for probe-only test libraries. */
  extraLibsDir: string;
  /** Shared SCons object cache. Sharing this is Option B's premise. */
  buildCacheDir: string;
  timeoutMs: number;
  fullPackage: boolean;
  noCache: boolean;
}

const DEFAULT_TEXT_ENV: TextEnv = {
  pioBin: process.env.PIO_BIN ?? 'pio',
  pioHome: process.env.PIO_HOME ?? path.join(process.env.HOME ?? '', '.platformio'),
  textProjectsDir:
    process.env.TEXT_PROJECTS_DIR ??
    path.join(process.env.PROJECTS_DIR ?? '/opt/digicode-compile/projects', 'text'),
  textCacheDir:
    process.env.TEXT_CACHE_DIR ??
    path.join(process.env.CACHE_DIR ?? '/opt/digicode-compile/cache', 'text'),
  libsDir: process.env.LIBS_DIR ?? '/opt/digicode-compile/libs',
  extraLibsDir: process.env.TEXT_EXTRA_LIBS_DIR ?? '',
  buildCacheDir: process.env.TEXT_BUILD_CACHE_DIR ?? '/root/.platformio/build-cache',
  timeoutMs: Number(process.env.COMPILE_TIMEOUT_MS ?? 900_000),
  fullPackage: false,
  noCache: false,
};

/**
 * The Text default dependency set.
 *
 * It is intentionally NOT `buildLibDeps()`. The Classic set is 57 entries
 * and every one of them is resolved on every build; a Text project that
 * needs one library should not drag the other 56 through its build, and a
 * library added for Text must not appear in a Classic build. Keeping the
 * two functions separate is what makes both statements true.
 */
export function buildTextLibDeps(env: TextEnv, req: TextCompileRequest): string[] {
  if (req.libDeps && req.libDeps.length > 0) return req.libDeps;
  return [`file://${env.libsDir}/Adafruit_NeoPixel`];
}

export function buildTextPlatformioIni(
  target: TextPioTarget,
  libDeps: string[],
  env: TextEnv,
  extraBuildFlags: string[],
): string {
  const deps = libDeps.map((d) => `    ${d}`).join('\n');
  const flags = [
    '-DDIGICODE_TEXT_COMPILE_API',
    '-Wno-error',
    '-Wno-deprecated-declarations',
    '-Wno-unused-but-set-variable',
    '-Wno-unused-variable',
    ...(target.extraBuildFlags ?? []),
    ...extraBuildFlags,
  ]
    .map((f) => `    ${f}`)
    .join('\n');
  const extraDirs = env.extraLibsDir ? `lib_extra_dirs = ${env.extraLibsDir}\n` : '';
  return `[platformio]
build_cache_dir = ${env.buildCacheDir}

[env:${target.board}]
platform = ${target.platform}
board = ${target.board}
framework = arduino
board_build.partitions = min_spiffs.csv
lib_ldf_mode = chain
${extraDirs}lib_deps =
${deps}
build_flags =
${flags}
`;
}

export function computeTextCacheKey(
  manifest: string,
  target: TextPioTarget,
  libDeps: string[],
  extraBuildFlags: string[],
): string {
  const h = createHash('sha256');
  // Distinct prefix: a Text entry can never be served to a Classic request
  // and vice versa, even if every other input coincided.
  h.update('digicode-text-v1\n');
  h.update(`platform=${target.platform}\n`);
  h.update(`board=${target.board}\n`);
  h.update(`libDeps=${createHash('sha256').update(libDeps.join('\n')).digest('hex')}\n`);
  h.update(`flags=${[...(target.extraBuildFlags ?? []), ...extraBuildFlags].sort().join(',')}\n`);
  h.update(manifest);
  return h.digest('hex');
}

function entryDir(cacheDir: string, key: string): string {
  return path.join(cacheDir, key.slice(0, 2), key);
}

function textCacheGet(cacheDir: string, key: string): Partial<TextCompileSuccess> | null {
  const dir = entryDir(cacheDir, key);
  const fw = path.join(dir, 'firmware.bin');
  if (!existsSync(fw)) return null;
  try {
    const out: Partial<TextCompileSuccess> = {
      firmware: readFileSync(fw).toString('base64'),
    };
    for (const [name, field] of [
      ['bootloader.bin', 'bootloader'],
      ['partitions.bin', 'partitions'],
      ['boot_app0.bin', 'bootApp0'],
    ] as const) {
      const p = path.join(dir, name);
      if (existsSync(p)) (out as Record<string, string>)[field] = readFileSync(p).toString('base64');
    }
    return out;
  } catch {
    return null;
  }
}

function textCachePut(cacheDir: string, key: string, r: TextCompileSuccess): void {
  const dir = entryDir(cacheDir, key);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'firmware.bin'), Buffer.from(r.firmware, 'base64'));
  if (r.bootloader) {
    writeFileSync(path.join(dir, 'bootloader.bin'), Buffer.from(r.bootloader, 'base64'));
  }
  if (r.partitions) {
    writeFileSync(path.join(dir, 'partitions.bin'), Buffer.from(r.partitions, 'base64'));
  }
  if (r.bootApp0) {
    writeFileSync(path.join(dir, 'boot_app0.bin'), Buffer.from(r.bootApp0, 'base64'));
  }
}

/**
 * gcc / clang diagnostic line -> structured record, with the absolute
 * container path folded back to the project-relative path the editor knows.
 * This is the section 12 question: can the compiler side hand an editor a
 * file + line to jump to, for a file that is not main.
 */
const DIAG_RE = /^(.+?):(\d+)(?::(\d+))?:\s+(error|warning|note):\s+(.*)$/;

export function parseDiagnostics(output: string, projectDir: string): TextDiagnostic[] {
  const out: TextDiagnostic[] = [];
  for (const rawLine of output.split('\n')) {
    const line = rawLine.trim();
    const m = DIAG_RE.exec(line);
    if (!m) continue;
    let file = m[1].trim();
    if (file.startsWith(projectDir)) {
      file = path.relative(projectDir, file);
    }
    out.push({
      file,
      line: Number(m[2]),
      column: m[3] ? Number(m[3]) : null,
      severity: m[4] as TextDiagnostic['severity'],
      message: m[5],
    });
  }
  return out;
}

export async function compileTextProject(
  req: TextCompileRequest,
  envOverride: Partial<TextEnv> = {},
): Promise<TextCompileResult> {
  const env = { ...DEFAULT_TEXT_ENV, ...envOverride };
  const start = Date.now();

  try {
    validateFiles(req.files);
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - start,
      diagnostics: [],
    };
  }

  let target: TextPioTarget;
  try {
    target = textPioTargetFor(req.board);
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - start,
      diagnostics: [],
    };
  }

  const manifest = manifestOf(req.files);
  const libDeps = buildTextLibDeps(env, req);
  const extraFlags = req.extraBuildFlags ?? [];
  const cacheKey = computeTextCacheKey(manifest, target, libDeps, extraFlags);
  const projectId = sanitizeProjectId(req.projectId, `anon-${cacheKey.slice(0, 16)}`);

  if (!env.noCache) {
    const hit = textCacheGet(env.textCacheDir, cacheKey);
    if (hit?.firmware) {
      const res: TextCompileSuccess = {
        success: true,
        firmware: hit.firmware,
        durationMs: Date.now() - start,
        pioBoard: target.board,
        projectId,
        cached: true,
        diagnostics: [],
      };
      if (env.fullPackage) {
        if (hit.bootloader) res.bootloader = hit.bootloader;
        if (hit.partitions) res.partitions = hit.partitions;
        if (hit.bootApp0) res.bootApp0 = hit.bootApp0;
      }
      return res;
    }
  }

  // Lock namespace is `text:` - it can never equal a Classic lock key,
  // which is `${pioBoard}_${templateName}`.
  return withLock(`text:${projectId}`, async () => {
    const ini = buildTextPlatformioIni(target, libDeps, env, extraFlags);
    mkdirSync(env.textProjectsDir, { recursive: true });
    const { projectDir } = ensureTextProject(env.textProjectsDir, projectId, ini, req.files);

    try {
      const result = await runTextPio(projectDir, target, env, start, projectId);
      if (result.success && !env.noCache) {
        textCachePut(env.textCacheDir, cacheKey, result);
      }
      return result;
    } finally {
      scrubTextSources(projectDir, req.files);
    }
  });
}

async function runTextPio(
  projectDir: string,
  target: TextPioTarget,
  env: TextEnv,
  start: number,
  projectId: string,
): Promise<TextCompileResult> {
  try {
    const { stdout, stderr } = await execP(`${env.pioBin} run`, {
      cwd: projectDir,
      timeout: env.timeoutMs,
      maxBuffer: 32 * 1024 * 1024,
    });
    const durationMs = Date.now() - start;
    const diagnostics = parseDiagnostics(`${stdout}\n${stderr}`, projectDir);

    const buildDir = path.join(projectDir, '.pio', 'build', target.board);
    const firmwarePath = path.join(buildDir, 'firmware.bin');
    if (!existsSync(firmwarePath)) {
      return {
        success: false,
        error: 'firmware.bin not produced',
        stderr: stderr?.slice(-4000),
        durationMs,
        projectId,
        diagnostics,
      };
    }
    const res: TextCompileSuccess = {
      success: true,
      firmware: readFileSync(firmwarePath).toString('base64'),
      durationMs,
      pioBoard: target.board,
      projectId,
      cached: false,
      diagnostics,
    };
    const bootloaderPath = path.join(buildDir, 'bootloader.bin');
    const partitionsPath = path.join(buildDir, 'partitions.bin');
    const bootApp0Path = path.join(
      env.pioHome,
      'packages',
      'framework-arduinoespressif32',
      'tools',
      'partitions',
      'boot_app0.bin',
    );
    if (existsSync(bootloaderPath)) res.bootloader = readFileSync(bootloaderPath).toString('base64');
    if (existsSync(partitionsPath)) res.partitions = readFileSync(partitionsPath).toString('base64');
    if (existsSync(bootApp0Path)) res.bootApp0 = readFileSync(bootApp0Path).toString('base64');
    return res;
  } catch (e) {
    const err = e as Error & { stderr?: string; stdout?: string; signal?: string };
    const durationMs = Date.now() - start;
    const combined = `${err.stdout ?? ''}\n${err.stderr ?? ''}`;
    const diagnostics = parseDiagnostics(combined, projectDir);
    if (err.signal === 'SIGTERM') {
      return {
        success: false,
        error: `timeout after ${env.timeoutMs}ms`,
        stderr: err.stderr?.slice(-4000),
        durationMs,
        projectId,
        diagnostics,
      };
    }
    return {
      success: false,
      error: err.message.split('\n')[0],
      stderr: err.stderr?.slice(-6000),
      durationMs,
      projectId,
      diagnostics,
    };
  }
}
```
