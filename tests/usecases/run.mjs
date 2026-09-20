#!/usr/bin/env node
/**
 * DigiCode Text — compile ユースケース ハーネス
 *
 * tests/usecases/<board>/<NN>-<slug>.cpp を走査し、各ファイル先頭のヘッダ宣言に従って
 * 稼働中の compiler サーバー (既定 http://127.0.0.1:3100) の POST /compile へ投げ、
 * 結果を JSON と summary に残す。製品コード (compiler/ web/ shared/) は読むだけで変更しない。
 * summary は --board X 指定時が summary-X.md、指定なしが summary.md + board 別 summary-<board>.md。
 *
 * ヘッダ宣言 (ファイル先頭の // コメント行のみ。最初の非コメント行で打ち切り):
 *   // @board xiao_esp32c3          必須。1 ファイル 1 board。
 *   // @lib owner/Name@1.2.3        0 回以上。version は具体版のみ (^ ~ latest 等は不可)。
 *   // @desc 何を試すケースか        任意。
 *   // @skip 理由                    あれば compile せず skip に集計。
 *
 * ライブラリは GET /libraries/details?owner=&name= で数値 id と実在 version を解決してから
 * /compile に渡す。解決できない場合は compile せず ng として記録する:
 *   version-not-in-registry  … 宣言 version が Registry の versions に無い
 *   library-lookup-failed    … /libraries/details 自体が失敗した
 *
 * 同時実行は 2 (CONCURRENCY) だが、これはクライアント側の上限にすぎない。
 * compiler サーバーは compile を内部 queue で直列化しているため、実際の build は常に 1 件ずつ
 * 順に走る。同時実行 2 で短縮されるのは Registry 問い合わせと待ち行列への投入だけで、
 * 総所要時間はおおむね全ケースの build 時間の合計になる。
 *
 * 使い方:
 *   node tests/usecases/run.mjs                        全件実行 (新しい results dir を作る)
 *   node tests/usecases/run.mjs --board pico           board で絞る
 *   node tests/usecases/run.mjs --lib ArduinoJson      ライブラリ名の部分一致で絞る
 *   node tests/usecases/run.mjs --limit 3              先頭 N 件だけ
 *   node tests/usecases/run.mjs --results latest       既存 dir を再開 (結果があるものは飛ばす)
 *   node tests/usecases/run.mjs --results latest --rerun   既存結果を無視して再実行
 *
 * 終了コード: ng が 1 件でもあれば 1、それ以外は 0。
 */
import { readdir, readFile, writeFile, mkdir, symlink, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const RESULTS_ROOT = path.join(HERE, 'results');
const SERVER = process.env.DIGICODE_COMPILER ?? 'http://127.0.0.1:3100';
const BOARDS = ['xiao_rp2040', 'pico', 'pico_w', 'xiao_esp32c3', 'xiao_esp32s3', 'xiao_esp32c5', 'esp32_c5_devkitc_1', 'esp32_devkitc_v4', 'wio_node'];
const CONCURRENCY = 2;
const COMPILE_TIMEOUT_MS = 15 * 60 * 1000;
const DETAILS_TIMEOUT_MS = 60 * 1000;
const ERROR_HEAD_LINES = 20;

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const opts = { board: null, lib: null, limit: null, results: null, rerun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const need = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} に値が必要です`);
      return v;
    };
    if (a === '--board') opts.board = need();
    else if (a === '--lib') opts.lib = need();
    else if (a === '--limit') {
      opts.limit = Number(need());
      if (!Number.isSafeInteger(opts.limit) || opts.limit < 1) throw new Error('--limit は 1 以上の整数です');
    } else if (a === '--results') opts.results = need();
    else if (a === '--rerun') opts.rerun = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else throw new Error(`不明な引数: ${a}`);
  }
  return opts;
}

// ---------------------------------------------------------------- header parsing

// 具体版のみ許可する。範囲指定 (^ ~ > < * x) と latest を弾く。
// 3 桁 semver かどうかまでは runner では判定しない (Registry には 2 桁版の
// ライブラリが実在するため、実在判定は /libraries/details に任せる)。
function isConcreteVersion(v) {
  return /^[0-9][0-9A-Za-z.+-]*$/.test(v) && !/[\^~><*\s]/.test(v) && v.toLowerCase() !== 'latest';
}

function parseHeader(text, casePath) {
  const header = { board: null, libs: [], desc: '', skip: null };
  const errors = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '') continue;
    if (!line.startsWith('//')) break; // 宣言はファイル先頭のコメント塊のみ
    const m = /^\/\/\s*@([A-Za-z]+)\s*(.*)$/.exec(line);
    if (!m) continue; // 普通のコメント行は読み飛ばす
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'board') {
      if (header.board) errors.push('@board が複数あります');
      else if (!BOARDS.includes(value)) errors.push(`未知の @board: ${value}`);
      else header.board = value;
    } else if (key === 'lib') {
      const at = value.lastIndexOf('@');
      const slash = value.indexOf('/');
      if (at < 0 || slash < 0 || slash > at) {
        errors.push(`@lib の形式が不正です (owner/Name@version): ${value}`);
        continue;
      }
      const owner = value.slice(0, slash).trim();
      const name = value.slice(slash + 1, at).trim();
      const version = value.slice(at + 1).trim();
      if (!owner || !name || !version) errors.push(`@lib の形式が不正です: ${value}`);
      else if (!isConcreteVersion(version)) errors.push(`@lib の version は具体版のみです: ${value}`);
      else header.libs.push({ declared: value, owner, name, version });
    } else if (key === 'desc') header.desc = value;
    else if (key === 'skip') header.skip = value || '(理由未記載)';
    else errors.push(`未知の宣言: @${key}`);
  }
  if (!header.board && header.skip === null) errors.push('@board がありません');
  return { ...header, errors, casePath };
}

async function collectCases(opts) {
  const cases = [];
  for (const board of BOARDS) {
    const dir = path.join(HERE, board);
    let names;
    try {
      names = (await readdir(dir)).filter(n => n.endsWith('.cpp')).sort();
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
    for (const name of names) {
      const file = path.join(dir, name);
      const text = await readFile(file, 'utf8');
      const header = parseHeader(text, path.relative(REPO_ROOT, file));
      cases.push({
        id: name.replace(/\.cpp$/, ''),
        dir: board,
        file,
        source: text,
        ...header,
        // ディレクトリと @board の食い違いは宣言側を正とし、警告として残す。
        dirMismatch: header.board !== null && header.board !== board,
      });
    }
  }
  let selected = cases;
  if (opts.board) selected = selected.filter(c => c.board === opts.board || c.dir === opts.board);
  if (opts.lib) {
    const needle = opts.lib.toLowerCase();
    selected = selected.filter(c => c.libs.some(l => `${l.owner}/${l.name}`.toLowerCase().includes(needle)));
  }
  if (opts.limit) selected = selected.slice(0, opts.limit);
  return { all: cases, selected };
}

// ---------------------------------------------------------------- http

async function getJson(url, timeoutMs) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* 非 JSON はそのまま扱う */ }
  return { status: res.status, body, text };
}

const detailsCache = new Map();
function libraryDetails(owner, name) {
  const key = `${owner}/${name}`;
  if (!detailsCache.has(key)) {
    const url = `${SERVER}/libraries/details?owner=${encodeURIComponent(owner)}&name=${encodeURIComponent(name)}`;
    detailsCache.set(key, getJson(url, DETAILS_TIMEOUT_MS).catch(err => ({ status: 0, body: null, text: String(err) })));
  }
  return detailsCache.get(key);
}

// 宣言された @lib を Registry の数値 id つきの /compile 用 payload に解決する。
async function resolveLibraries(libs) {
  const resolved = [];
  for (const lib of libs) {
    const { status, body, text } = await libraryDetails(lib.owner, lib.name);
    if (status !== 200 || !body || typeof body.id !== 'number') {
      const detail = body && body.error ? body.error : text.slice(0, 200);
      return { problem: { kind: 'library-lookup-failed', lib: lib.declared, httpStatus: status, detail } };
    }
    if (!Array.isArray(body.versions) || !body.versions.includes(lib.version)) {
      return {
        problem: {
          kind: 'version-not-in-registry',
          lib: lib.declared,
          httpStatus: status,
          detail: `Registry の versions に ${lib.version} がありません: ${(body.versions || []).slice(0, 10).join(', ')}`,
        },
      };
    }
    // /compile 側は Registry の正式表記と厳密一致を要求するため、解決結果の owner/name を送る。
    resolved.push({ id: body.id, owner: body.owner, name: body.name, version: lib.version });
  }
  return { resolved };
}

// ---------------------------------------------------------------- log extraction

// ログ末尾側から error 行を探し、その少し手前を先頭にして 20 行を切り出す。
//
// PlatformIO のログは必ず "*** [...] Error 1" と失敗サマリで終わるため、単純に末尾から
// 探すとその定型句に当たってしまい、原因になったコンパイラ診断が窓から外れる。
// そこで実際の診断行 (error: / fatal error: / undefined reference) を優先して錨にし、
// 見つからないときだけ末尾側の error 行、それも無ければログ末尾を使う。
const DIAGNOSTIC = /(?:\bfatal error:|\berror:|undefined reference to|#error\b)/i;
const ANY_ERROR = /(?:\berror\b|\bfatal\b|undefined reference|\*\*\* \[|Compilation failed|not found)/i;

function errorHead(log) {
  if (!log) return [];
  const lines = String(log).split(/\r?\n/).filter(l => l.trim() !== '');
  let anchor = lines.findIndex(l => DIAGNOSTIC.test(l));
  if (anchor < 0) {
    for (let i = lines.length - 1; i >= 0; i--) if (ANY_ERROR.test(lines[i])) { anchor = i; break; }
  }
  if (anchor < 0) return lines.slice(-ERROR_HEAD_LINES);
  const start = Math.max(0, anchor - 2);
  return lines.slice(start, start + ERROR_HEAD_LINES);
}

function gist(result) {
  if (result.problem) return `${result.problem.kind}: ${result.problem.lib} — ${result.problem.detail}`;
  const head = result.errorHead || [];
  const pick = head.find(l => DIAGNOSTIC.test(l)) || head.find(l => ANY_ERROR.test(l)) || head[0] || '';
  return pick.trim().slice(0, 240) || `HTTP ${result.httpStatus}`;
}

// ---------------------------------------------------------------- one case

async function runCase(c) {
  const base = {
    case: c.casePath,
    board: c.board,
    desc: c.desc,
    libs: c.libs.map(l => l.declared),
    ok: false,
    httpStatus: null,
    stage: null,
    durationMs: null,
    wallMs: null,
    errorHead: [],
    problem: null,
    classification: '', // 後で人が付ける
    ranAt: new Date().toISOString(),
  };
  if (c.errors.length) {
    return { ...base, problem: { kind: 'header-invalid', lib: '', httpStatus: null, detail: c.errors.join(' / ') } };
  }

  const started = Date.now();
  const { resolved, problem } = await resolveLibraries(c.libs);
  if (problem) return { ...base, problem, wallMs: Date.now() - started };

  let res;
  try {
    res = await fetch(`${SERVER}/compile`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ env: c.board, source: c.source, libraries: resolved }),
      signal: AbortSignal.timeout(COMPILE_TIMEOUT_MS),
    });
  } catch (err) {
    return {
      ...base,
      wallMs: Date.now() - started,
      problem: { kind: 'request-failed', lib: '', httpStatus: null, detail: String((err && err.message) || err) },
    };
  }

  const wallMs = Date.now() - started;
  const headerMs = Number(res.headers.get('x-compile-duration-ms'));

  if (res.ok) {
    const bytes = (await res.arrayBuffer()).byteLength;
    return {
      ...base,
      ok: true,
      httpStatus: res.status,
      stage: null,
      durationMs: Number.isFinite(headerMs) ? headerMs : null,
      wallMs,
      artifactBytes: bytes,
      artifactSha256: res.headers.get('x-artifact-sha256'),
    };
  }

  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* ignore */ }
  return {
    ...base,
    httpStatus: res.status,
    stage: body && body.stage ? body.stage : null,
    durationMs: body && Number.isFinite(body.durationMs) ? body.durationMs : (Number.isFinite(headerMs) ? headerMs : null),
    wallMs,
    error: body && body.error ? body.error : text.slice(0, 200),
    errorHead: errorHead(body && body.log ? body.log : text),
  };
}

// ---------------------------------------------------------------- summary

function fmtSec(ms) {
  return Number.isFinite(ms) ? `${(ms / 1000).toFixed(1)}s` : '-';
}

function buildSummary(rows, skipped, resultsDir, opts) {
  const ok = rows.filter(r => r.ok);
  const ng = rows.filter(r => !r.ok);
  const L = [];
  L.push('# compile ユースケース結果');
  L.push('');
  L.push(`- 実行: ${new Date().toISOString()}`);
  L.push(`- サーバー: ${SERVER}`);
  L.push(`- results: ${path.relative(REPO_ROOT, resultsDir)}`);
  const filters = [opts.board && `--board ${opts.board}`, opts.lib && `--lib ${opts.lib}`,
    opts.limit && `--limit ${opts.limit}`, opts.rerun && '--rerun'].filter(Boolean);
  L.push(`- 絞り込み: ${filters.length ? filters.join(' ') : 'なし'}`);
  L.push('');
  L.push(`**ok ${ok.length} / ng ${ng.length} / skip ${skipped.length}**`);
  L.push('');

  L.push('## board 別');
  L.push('');
  L.push('| board | ok | ng | 平均所要 |');
  L.push('| --- | ---: | ---: | ---: |');
  for (const board of BOARDS) {
    const mine = rows.filter(r => r.board === board);
    if (!mine.length) continue;
    const times = mine.map(r => r.durationMs ?? r.wallMs).filter(n => Number.isFinite(n));
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : NaN;
    L.push(`| ${board} | ${mine.filter(r => r.ok).length} | ${mine.filter(r => !r.ok).length} | ${fmtSec(avg)} |`);
  }
  L.push('');

  // ライブラリ別 ng: 同じエラー要点は 1 行にまとめて件数を付ける。
  L.push('## ライブラリ別 ng');
  L.push('');
  const byLib = new Map();
  for (const r of ng) {
    const libs = r.libs.length ? r.libs : ['(ライブラリなし)'];
    const g = gist(r);
    for (const lib of libs) {
      const key = `${lib} >>> ${g}`;
      const entry = byLib.get(key) || { lib, gist: g, count: 0, cases: [] };
      entry.count++;
      entry.cases.push(r.case);
      byLib.set(key, entry);
    }
  }
  if (!byLib.size) L.push('なし');
  else {
    L.push('| ライブラリ | 件数 | エラー要点 | case |');
    L.push('| --- | ---: | --- | --- |');
    for (const e of [...byLib.values()].sort((a, b) => b.count - a.count)) {
      L.push(`| ${e.lib} | ${e.count} | ${e.gist.replace(/\|/g, '\\|')} | ${e.cases.join('<br>')} |`);
    }
  }
  L.push('');

  L.push('## ng 一覧');
  L.push('');
  if (!ng.length) L.push('なし');
  for (const r of ng) {
    L.push(`### ${r.case}`);
    L.push('');
    L.push(`- board: ${r.board}`);
    L.push(`- libs: ${r.libs.length ? r.libs.join(', ') : 'なし'}`);
    L.push(`- HTTP: ${r.httpStatus ?? '-'} / stage: ${r.stage ?? '-'} / 所要: ${fmtSec(r.durationMs ?? r.wallMs)}`);
    L.push(`- 要点: ${gist(r)}`);
    if (r.errorHead && r.errorHead.length) {
      L.push('');
      L.push('```');
      L.push(...r.errorHead);
      L.push('```');
    }
    L.push('');
  }

  L.push('## ok 一覧');
  L.push('');
  if (!ok.length) L.push('なし');
  else {
    L.push('| case | board | libs | 所要 |');
    L.push('| --- | --- | --- | ---: |');
    for (const r of ok) L.push(`| ${r.case} | ${r.board} | ${r.libs.join(', ') || '-'} | ${fmtSec(r.durationMs ?? r.wallMs)} |`);
  }
  L.push('');

  if (skipped.length) {
    L.push('## skip (対象外)');
    L.push('');
    for (const s of skipped) L.push(`- ${s.casePath} — ${s.skip}`);
    L.push('');
  }
  return L.join('\n');
}

// ---------------------------------------------------------------- main

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function resolveResultsDir(opts) {
  if (opts.results) {
    // 区切りを含むならそのまま解決、含まないなら results/ 直下の名前として扱う。
    const dir = opts.results.includes(path.sep) || opts.results.startsWith('.')
      ? path.resolve(process.cwd(), opts.results)
      : path.join(RESULTS_ROOT, opts.results);
    if (!await exists(dir)) throw new Error(`results dir がありません: ${dir}`);
    return { dir, fresh: false };
  }
  const d = new Date();
  const p2 = n => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
  const dir = path.join(RESULTS_ROOT, stamp);
  await mkdir(dir, { recursive: true });
  const link = path.join(RESULTS_ROOT, 'latest');
  await rm(link, { force: true, recursive: false }).catch(() => {});
  await symlink(stamp, link, 'dir').catch(err => console.warn(`latest シンボリックリンクを更新できません: ${err.message}`));
  return { dir, fresh: true };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    const self = await readFile(fileURLToPath(import.meta.url), 'utf8');
    console.log(self.slice(0, self.indexOf('*/') + 2));
    return 0;
  }

  const health = await getJson(`${SERVER}/health`, 10_000).catch(err => ({ status: 0, body: null, text: String(err) }));
  if (health.status !== 200 || !health.body || health.body.ok !== true) {
    console.error(`compiler サーバーに繋がりません (${SERVER}/health): ${health.status} ${health.text}`);
    return 2;
  }

  const { selected } = await collectCases(opts);
  if (!selected.length) {
    console.error('対象のケースがありません');
    return 2;
  }

  const { dir: resultsDir, fresh } = await resolveResultsDir(opts);
  console.log(`results: ${resultsDir}${fresh ? ' (新規)' : ' (再開)'}`);

  const skipped = selected.filter(c => c.skip !== null);
  for (const s of skipped) console.log(`skip  ${s.casePath} — ${s.skip}`);

  const targets = selected.filter(c => c.skip === null);
  for (const c of targets) {
    if (c.dirMismatch) console.warn(`警告 ${c.casePath}: ディレクトリ ${c.dir} と @board ${c.board} が違います (@board を使います)`);
  }

  const rows = [];
  const queue = [];
  for (const c of targets) {
    const out = path.join(resultsDir, c.board, `${c.id}.json`);
    if (!opts.rerun && await exists(out)) {
      try {
        rows.push(JSON.parse(await readFile(out, 'utf8')));
        console.log(`再開  ${c.casePath} (既存結果を使用)`);
        continue;
      } catch { /* 壊れていれば流して実行しなおす */ }
    }
    queue.push({ c, out });
  }

  let next = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (next < queue.length) {
      const { c, out } = queue[next++];
      console.log(`start ${c.casePath} (${c.board})`);
      let result;
      try {
        result = await runCase(c);
      } catch (err) {
        result = {
          case: c.casePath, board: c.board, desc: c.desc, libs: c.libs.map(l => l.declared),
          ok: false, httpStatus: null, stage: null, durationMs: null, wallMs: null,
          errorHead: [], problem: { kind: 'runner-error', lib: '', httpStatus: null, detail: String((err && err.stack) || err) },
          classification: '', ranAt: new Date().toISOString(),
        };
      }
      await mkdir(path.dirname(out), { recursive: true });
      await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8');
      rows.push(result);
      console.log(`${result.ok ? 'ok   ' : 'NG   '} ${c.casePath} ${fmtSec(result.durationMs ?? result.wallMs)}${result.ok ? '' : ' — ' + gist(result)}`);
    }
  });
  await Promise.all(workers);

  rows.sort((a, b) => a.case.localeCompare(b.case));

  // summary の出し分け:
  //   --board X あり … その board 分だけなので summary-X.md 1 本
  //   --board なし   … 全体の summary.md に加え、board ごとの summary-<board>.md
  const summaryPaths = [];
  const writeSummary = async (name, theRows, theSkipped, theOpts) => {
    const p = path.join(resultsDir, name);
    await writeFile(p, buildSummary(theRows, theSkipped, resultsDir, theOpts), 'utf8');
    summaryPaths.push(p);
  };

  if (opts.board) {
    await writeSummary(`summary-${opts.board}.md`, rows, skipped, opts);
  } else {
    await writeSummary('summary.md', rows, skipped, opts);
    for (const board of BOARDS) {
      const boardRows = rows.filter(r => r.board === board);
      const boardSkipped = skipped.filter(s => (s.board ?? s.dir) === board);
      if (!boardRows.length && !boardSkipped.length) continue;
      await writeSummary(`summary-${board}.md`, boardRows, boardSkipped, { ...opts, board });
    }
  }

  const ngCount = rows.filter(r => !r.ok).length;
  console.log(`\nok ${rows.length - ngCount} / ng ${ngCount} / skip ${skipped.length}`);
  for (const p of summaryPaths) console.log(`summary: ${p}`);
  return ngCount > 0 ? 1 : 0;
}

main().then(code => { process.exitCode = code; }, err => {
  console.error((err && err.stack) || String(err));
  process.exitCode = 2;
});
