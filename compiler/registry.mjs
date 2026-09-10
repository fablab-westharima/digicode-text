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
export async function searchLibraries(query, page) {
  if (typeof query !== 'string' || !query.trim() || query.length > 120 || /[\x00-\x1f]/.test(query) || !Number.isInteger(page) || page < 1 || page > 100) throw new Error('検索語は1〜120文字、ページは1〜100で指定してください');
  const data = await get('/v3/search?' + new URLSearchParams({ query: 'type:library ' + query, page }));
  if (!Array.isArray(data.items)) throw new Error('Registryの応答形式が不正です');
  return { items: data.items.filter(p => p.type === 'library').flatMap(p => { try { return [item(p)]; } catch { return []; } }),
    page, total: data.total, more: page * data.limit < data.total && page < 100 };
}
export async function libraryDetails(owner, name) {
  validateLibraries([{ id: 1, owner, name, version: '1.0.0' }]);
  const data = await get(`/v3/packages/${encodeURIComponent(owner)}/library/${encodeURIComponent(name)}`);
  if (data.type !== 'library') throw new Error('Registryのライブラリではありません');
  const result = item(data);
  result.versions = [...new Set([data.version?.name, ...(data.versions || []).map(v => v.name)])].filter(version => {
    try { validateLibraries([{ id: result.id, owner: result.owner, name: result.name, version }]); return true; } catch { return false; }
  });
  return result;
}
export async function verifyLibraries(libraries) {
  for (const p of libraries) {
    const actual = await libraryDetails(p.owner, p.name);
    if (actual.id !== p.id || actual.owner !== p.owner || actual.name !== p.name || !actual.versions.includes(p.version))
      throw new Error(`Registryの識別情報またはバージョンが一致しません: ${p.owner}/${p.name}@${p.version}`);
  }
}
