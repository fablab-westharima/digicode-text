// Cloudflare Pages へ配る。やることは 3 つだけ:
//   1. COMPILER_BASE_URL を埋めて build:web(画面から出る fetch を ML30 の compile サーバーへ向ける)
//   2. web/index.html と web/dist を、compile サーバーと同じ形(/ と /assets/)で 1 つの出力先に並べる
//   3. wrangler pages deploy でその出力先を上げる
// wrangler は PATH にあるもの(npm i -g wrangler)を使い、login 済みであること。
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const COMPILER_BASE_URL = process.env.COMPILER_BASE_URL ?? 'https://text-compile.fablab-westharima.jp';
const PROJECT = process.env.PAGES_PROJECT ?? 'digicode-text';

const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.error) throw r.error;
  if (r.status !== 0) { process.exitCode = r.status ?? 1; throw new Error(`${cmd} ${args.join(' ')} が ${r.status} で終わりました`); }
};

run(process.execPath, ['scripts/build-web.mjs'], { COMPILER_BASE_URL });

const out = await mkdtemp(path.join(tmpdir(), 'digicode-text-pages-'));
try {
  await cp(path.join(ROOT, 'web/index.html'), path.join(out, 'index.html'));
  await mkdir(path.join(out, 'assets'));
  await cp(path.join(ROOT, 'web/dist'), path.join(out, 'assets'), { recursive: true });
  console.log(`deploy: ${out} → Pages project "${PROJECT}" (compile サーバー: ${COMPILER_BASE_URL || '同じオリジン'})`);
  run('wrangler', ['pages', 'deploy', out, '--project-name', PROJECT, '--commit-dirty=true']);
} finally {
  await rm(out, { recursive: true, force: true });
}
