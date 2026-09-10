import { validateLibraries } from '../shared/libraries.js';
const $ = id => document.getElementById(id);
function element(tag, text, className) {
  const node = document.createElement(tag); node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function setupLibraries(store, change) {
  const dialog = $('libraries-dialog'), input = $('library-query'), results = $('library-results');
  let generation = 0, controller, page = 1, query = '', items = [];
  function cancel() { generation++; controller?.abort(); }
  function message(text) { $('library-status').textContent = text; }
  function apply(next, text) {
    try { change(validateLibraries(next)); renderAdded(); renderResults(); message(text + ' 実パッケージはBuild時に取得します。'); }
    catch (error) { message(error.message); }
  }
  function renderAdded() {
    $('library-target').textContent = store.current.name;
    const list = $('library-added'); list.replaceChildren();
    if (!store.current.libraries.length) list.append(element('p', '外部ライブラリはありません', 'storage-hint'));
    for (const p of store.current.libraries) {
      const row = element('li', '', 'library-row');
      row.append(element('div', `${p.owner}/${p.name} · ${p.version}`, 'library-title'));
      const remove = element('button', '削除');
      remove.setAttribute('aria-label', `${p.owner}/${p.name} を削除`);
      remove.onclick = () => { apply(store.current.libraries.filter(x => x.id !== p.id), 'プロジェクトから削除しました。'); input.focus(); };
      row.append(remove); list.append(row);
    }
  }
  async function details(p, area, button) {
    const current = generation;
    button.disabled = true;
    area.replaceChildren(element('p', 'バージョン取得中…', 'storage-hint'));
    try {
      const response = await fetch('/libraries/details?' + new URLSearchParams({ owner: p.owner, name: p.name }), { signal: controller?.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'バージョンを取得できませんでした');
      if (current !== generation || !dialog.open) return;
      if (data.id !== p.id || data.owner !== p.owner || data.name !== p.name) throw new Error('Registryの識別情報が一致しません');
      area.replaceChildren();
      area.append(element('p', `登録情報：framework ${data.frameworks.join(', ') || '不明'} / platform ${data.platforms.join(', ') || '不明'}（動作保証ではありません）`, 'storage-hint'));
      const controls = element('div', '', 'library-controls');
      const select = element('select', ''); select.setAttribute('aria-label', `${p.owner}/${p.name} のバージョン`);
      for (const version of data.versions) select.append(new Option(version, version));
      const added = store.current.libraries.find(x => x.id === p.id);
      if (added && data.versions.includes(added.version)) select.value = added.version;
      const add = element('button', added ? 'このバージョンへ変更' : 'プロジェクトに追加');
      add.onclick = () => {
        const existing = store.current.libraries.find(x => x.id === p.id);
        const value = { id: p.id, owner: p.owner, name: p.name, version: select.value };
        if (existing?.version === value.version) { message('このバージョンは追加済みです'); return; }
        apply(existing ? store.current.libraries.map(x => x.id === p.id ? value : x) : [...store.current.libraries, value], existing ? 'バージョンを変更しました。' : 'プロジェクトに追加しました。');
        results.querySelector(`[data-library-id="${p.id}"] button`)?.focus();
      };
      controls.append(select, add); area.append(controls); select.focus();
    } catch (error) {
      if (current === generation && error.name !== 'AbortError') area.replaceChildren(element('p', error.message, 'library-error'));
    } finally { if (current === generation) button.disabled = false; }
  }
  function renderResults() {
    results.replaceChildren();
    for (const p of items) {
      const row = element('li', '', 'library-result'); row.dataset.libraryId = p.id;
      const heading = element('div', '', 'library-row');
      const info = element('div', '', 'library-info');
      info.append(element('strong', p.name), element('small', `提供者：${p.owner} · Registry #${p.id}`));
      const added = store.current.libraries.find(x => x.id === p.id);
      const button = element('button', added ? '追加済み · 版を変更' : 'バージョンを選択');
      const area = element('div', '', 'library-detail');
      button.onclick = () => details(p, area, button);
      heading.append(info, button); row.append(heading, element('p', p.description, 'library-description'), area); results.append(row);
    }
  }
  async function search(nextPage = 1) {
    cancel(); controller = new AbortController(); const current = generation;
    query = input.value.trim(); page = nextPage; items = []; renderResults();
    $('library-next').hidden = $('library-prev').hidden = true;
    if (!query) { message('名前やキーワードを入力して検索してください'); return; }
    message('検索中…'); results.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/libraries/search?' + new URLSearchParams({ q: query, page }), { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '検索に失敗しました');
      if (current !== generation || !dialog.open) return;
      items = data.items; renderResults();
      message(items.length ? `${data.total}件中 ${page}ページ目。提供者とバージョンを確認してください。` : '該当するライブラリはありません');
      $('library-next').hidden = !data.more; $('library-prev').hidden = page <= 1;
    } catch (error) { if (current === generation && error.name !== 'AbortError') message(error.message); }
    finally { if (current === generation) results.setAttribute('aria-busy', 'false'); }
  }
  input.oninput = () => {
    cancel(); items = []; renderResults(); results.setAttribute('aria-busy', 'false');
    $('library-next').hidden = $('library-prev').hidden = true;
    message('検索ボタンまたはEnterで検索してください');
  };
  $('library-search-form').onsubmit = event => { event.preventDefault(); search(); };
  $('library-next').onclick = () => search(page + 1);
  $('library-prev').onclick = () => search(page - 1);
  $('libraries-open').onclick = () => {
    cancel(); items = []; input.value = ''; renderAdded(); renderResults();
    $('library-next').hidden = $('library-prev').hidden = true;
    message('名前やキーワードを入力して検索してください'); dialog.showModal(); input.focus();
  };
  $('libraries-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { cancel(); $('libraries-open').focus(); });
}
