// Bounded search over documented Registry syntax; never crawl the registry.
export function searchTerms(query) {
  if (typeof query !== 'string' || !query.trim() || query.length > 120 || /[\x00-\x1f"\\]/.test(query))
    throw new Error('検索語は1〜120文字で入力してください（引用符・バックスラッシュ・制御文字は使用できません）');
  const text = query.trim();
  const words = text.match(/[\p{L}\p{N}]+/gu) || [];
  return { text, phrase: `"${text}"`, wildcard: words.map(word => word + '*').join(' ') };
}
export function nameRank(name, query) {
  name = name.toLowerCase(); query = query.toLowerCase();
  return name === query ? 0 : name.startsWith(query) ? 1 : name.includes(query) ? 2 : 3;
}
export async function collectCandidates(query, request) {
  const { text, phrase, wildcard } = searchTerms(query);
  const requests = new Map();
  const run = (condition, sort = 'relevance') => {
    const key = JSON.stringify([condition, sort]);
    if (!requests.has(key)) requests.set(key, request({ query: 'type:library ' + condition, sort, page: 1 }));
    return requests.get(key);
  };
  const initial = await Promise.all([run('name:' + phrase), run(phrase), ...(wildcard ? [run(wildcard), run(wildcard, 'popularity')] : [])]);
  // Complete a prefix only from a real retrieved name, then broaden that term once.
  // Example: the Registry can return a longer name whose text also finds embedded names.
  const completion = initial.flatMap(x => x.items).filter(p => nameRank(p.name, text) === 1)
    .sort((a,b) => a.name.length - b.name.length || a.name.localeCompare(b.name) || a.id - b.id)[0];
  if (completion) {
    const expanded = searchTerms(completion.name).wildcard;
    if (expanded && expanded !== wildcard) initial.push(await run(expanded, 'popularity'));
  }
  const unique = new Map();
  for (const data of initial) for (const p of data.items) if (!unique.has(p.id)) unique.set(p.id, p);
  const items = [...unique.values()].sort((a,b) => nameRank(a.name,text) - nameRank(b.name,text) ||
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()) || a.owner.localeCompare(b.owner) || a.id-b.id);
  return { items, total: items.length, scope: 'candidates', requestCount: requests.size,
    limited: initial.some(data => data.total > data.items.length) };
}
