// compile サーバーの置き場所。画面から出る fetch（/boards・/compile・/libraries/*）は
// すべてここを通る。Text 本体を別オリジン（Cloudflare Pages など）に置いても、Build は
// ML30 の compile サーバーに頼めるようにするための 1 か所。
//
// 優先順位は「設定で『保存せず使う』を押した値 > このブラウザに保存された値 > build 時に埋めた
// 既定 > 空（＝同じオリジン）」。空文字は「このページを配っているのと同じサーバー」という意味で、
// 正しい値として扱う。
//
// __COMPILER_BASE__ は scripts/build-web.mjs の esbuild define が埋める定数。
// esbuild を通さない場面（node --test）でも壊れないよう、typeof で見てから読む。

export const COMPILER_KEY = 'digicode-text.compiler.v1';
const HEALTH_TIMEOUT_MS = 4000;

const buildBase = () => (typeof __COMPILER_BASE__ !== 'undefined' ? __COMPILER_BASE__ : '');

/**
 * 入力を base URL の形にそろえる。空（未入力）は '' ＝同じオリジン。
 * http/https 以外と、URL として読めないものは拒否する（throw）。
 */
export function normalizeBase(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  let url;
  try { url = new URL(text); } catch { throw new Error('URL の形式が正しくありません'); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('http:// または https:// で始まる URL を入力してください');
  // 末尾の / を落とす。path を持つ URL（https://例/compiler）も指せるようにするので origin だけに
  // 切り詰めはしないが、? 以降と # 以降は捨てる：base のうしろに '/boards' を継ぐ使い方に入らない。
  return (url.origin + url.pathname).replace(/\/+$/, '');
}

function readStored() {
  try { return localStorage.getItem(COMPILER_KEY); }
  catch { return null; } // localStorage が無い・読めない場面（node、サイトデータ拒否）
}

// 設定の「保存せず使う」で入った、開いているこのページにだけ効かせる値。null は「その指定は無い」
// という意味で、空文字（＝同じオリジン）とは別物。保存すると要らなくなるので null に戻す。
let sessionBase = null;

/** いま使う base。壊れた保存値は無視して build 時の既定に戻す。 */
export function getCompilerBase() {
  if (sessionBase !== null) return sessionBase;
  const stored = readStored();
  if (stored !== null) {
    try { return normalizeBase(stored); } catch { /* 壊れた記録は既定に倒す */ }
  }
  try { return normalizeBase(buildBase()); } catch { return ''; }
}

/** base を保存する。戻り値はそろえたあとの値。拒否・保存失敗はどちらも throw。 */
export function setCompilerBase(value) {
  const base = normalizeBase(value); // 形が違えばここで止まり、保存もしない
  try {
    if (base) localStorage.setItem(COMPILER_KEY, base);
    else localStorage.removeItem(COMPILER_KEY); // 空は「同じオリジン」。既定に戻すのではなく空を意味する
  } catch { throw new Error('このブラウザに保存できませんでした'); }
  sessionBase = null; // 保存したので、このページだけの値は用が済んだ
  return base;
}

/** base を保存せず、開いているこのページにだけ効かせる。戻り値はそろえたあとの値。 */
export function useCompilerBase(value) {
  sessionBase = normalizeBase(value); // 形が違えばここで止まる
  return sessionBase;
}

/** compile サーバーへの URL。path は '/boards' のように / で始める。 */
export function compilerUrl(path) {
  return getCompilerBase() + path;
}

/** GET /health。届けば { ok: true }、届かなければ { ok: false, error }。 */
export async function checkCompilerHealth(base) {
  try {
    const res = await fetch((base ?? '') + '/health', { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    if (!res.ok) return { ok: false, error: `応答が ${res.status} でした` };
    const body = await res.json();
    if (body?.ok !== true) return { ok: false, error: 'compile サーバーの応答ではありません' };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.name === 'TimeoutError' ? '応答がありません（時間切れ）' : String(error?.message ?? error) };
  }
}
