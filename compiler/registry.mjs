import { collectCandidates, searchTerms } from './library-search.mjs';
import { validateLibraries } from '../shared/libraries.js';
// Public endpoints used by PlatformIO Core 6.1.19 RegistryClient.
const root = 'https://api.registry.platformio.org';
async function get(endpoint) {
  try {
    const response = await fetch(root + endpoint, { signal: AbortSignal.timeout(20_000), redirect: 'error' });
    if (!response.ok) throw new Error();
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error();
    return JSON.parse(text);
  } catch { throw new Error('Registryから取得できませんでした。接続を確認して再試行してください'); }
}
function item(p) {
  validateLibraries([{ id: p.id, owner: p.owner?.username, name: p.name, version: p.version?.name }]);
  return { id: p.id, owner: p.owner.username, name: p.name, version: p.version.name,
    description: String(p.description || '').slice(0, 500),
    frameworks: Array.isArray(p.frameworks) ? p.frameworks.map(String) : [],
    platforms: Array.isArray(p.platforms) ? p.platforms.map(String) : [] };
}
// Cache only completed candidate snapshots; in-flight duplicates share a promise.
const searches = new Map();
export async function searchLibraries(query, page) {
  const { text } = searchTerms(query);
  if (page !== 1) throw new Error('新しい検索は1ページ目から実行してください');
  const key = text.toLowerCase(), now = Date.now();
  for (const [k, entry] of searches) if (entry.expires <= now) searches.delete(k);
  if (searches.has(key)) return searches.get(key).promise;
  if (searches.size >= 64) searches.delete(searches.keys().next().value);
  const entry = { expires: now + 60_000 };
  entry.promise = collectCandidates(text, async params => {
    const data = await get('/v3/search?' + new URLSearchParams(params));
    if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total)) throw new Error('Registryの応答形式が不正です');
    // A candidate we cannot represent is dropped, but never silently: it is logged and reported.
    const excluded = [];
    const items = data.items.slice(0, 10).filter(p => p.type === 'library').flatMap(p => {
      try { return [item(p)]; }
      catch (error) {
        const owner = String(p?.owner?.username ?? '').slice(0, 100), name = String(p?.name ?? '').slice(0, 100);
        console.warn(`[libraries/search] 候補を除外: ${owner}/${name} — ${error.message}`);
        excluded.push({ owner, name, reason: error.message });
        return [];
      }
    });
    return { total: data.total, items, excluded };
  }).catch(error => {
    if (searches.get(key) === entry) searches.delete(key);
    throw new Error('候補検索の一部または全部を取得できませんでした。再試行してください。' + error.message);
  });
  searches.set(key, entry);
  return entry.promise;
}
export async function libraryDetails(owner, name) {
  // Coordinates only: the version here is a placeholder so the shared owner/name checks can run.
  validateLibraries([{ id: 1, owner, name, version: '1.0.0' }]);
  const data = await get(`/v3/packages/${encodeURIComponent(owner)}/library/${encodeURIComponent(name)}`);
  if (data.type !== 'library') throw new Error('Registryのライブラリではありません');
  const result = item(data);
  // The Registry's own version strings, verbatim and unnormalised ("2.8" stays "2.8"); only
  // strings that fail the shared safety check are dropped.
  result.versions = [...new Set([data.version?.name, ...(data.versions || []).map(v => v.name)])].filter(version => {
    try { validateLibraries([{ id: result.id, owner: result.owner, name: result.name, version }]); return true; } catch { return false; }
  });
  return result;
}
export async function verifyLibraries(libraries) {
  for (const p of libraries) {
    const actual = await libraryDetails(p.owner, p.name);
    if (actual.id !== p.id || actual.owner !== p.owner || actual.name !== p.name)
      throw new Error(`Registryの識別情報が一致しません: ${p.owner}/${p.name}`);
    // Exact string match against the Registry's list: ranges ("^7.4"), aliases ("latest") and
    // versions that do not exist are simply not in the list.
    if (!actual.versions.includes(p.version))
      throw new Error(`${p.owner}/${p.name}@${p.version} の版がRegistryの版一覧に見つかりません（利用可能: ${actual.versions.slice(0, 10).join(', ')}）`);
  }
}
