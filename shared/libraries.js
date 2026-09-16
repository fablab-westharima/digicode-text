// Shared browser/server validation: exact Registry package coordinates only.
export function validateLibraries(value = []) {
  if (!Array.isArray(value) || value.length > 32) throw new Error('ライブラリは32件以内の配列で指定してください');
  const ids = new Set(), names = new Set();
  return value.map(p => {
    if (!p || typeof p !== 'object' || Array.isArray(p) ||
        Object.keys(p).some(k => !['id', 'owner', 'name', 'version'].includes(k)) ||
        !Number.isSafeInteger(p.id) || p.id < 1 ||
        typeof p.owner !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(p.owner) ||
        typeof p.name !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_. -]{0,99}$/.test(p.name) || p.name.trim() !== p.name ||
        // The version's SHAPE is not checked here: the Registry is the only authority on which
        // version strings exist ("2.8" and "1.0.0-rc1" are both real). The browser cannot ask the
        // Registry, so this keeps only the minimum needed for safety — a non-empty, bounded string
        // with no whitespace or control characters, so it cannot inject lines into platformio.ini.
        // Existence ("latest", "^7.4", "9.9.9" are not real versions) is checked server-side in
        // verifyLibraries against the Registry's own version list.
        typeof p.version !== 'string' || !p.version || p.version.length > 64 || /[\s\p{Cc}]/u.test(p.version)) {
      throw new Error('不正なライブラリ指定です。RegistryのID・提供者・正式名・バージョン文字列が必要です');
    }
    const name = `${p.owner}/${p.name}`.toLowerCase();
    if (ids.has(p.id) || names.has(name)) throw new Error('同じライブラリを重複追加できません');
    ids.add(p.id); names.add(name);
    return { id: p.id, owner: p.owner, name: p.name, version: p.version };
  });
}
