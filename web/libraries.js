import { nearbyNames } from './library-suggestions.js';
import { descriptionText } from './library-description.js';
import { incompatibleRow } from './library-incompat.js';
import { validateLibraries } from '../shared/libraries.js';
const $ = id => document.getElementById(id);
// Which libraries the selected board cannot build is the compiler's statement, carried on the
// board's /boards entry. Whether the user wants to see them at all is a per-browser convenience.
const UI_KEY = 'digicode-text.libs-ui.v1';
function element(tag, text, className) {
  const node = document.createElement(tag); node.textContent = text;
  if (className) node.className = className;
  return node;
}
export function setupLibraries(store, change, boards) {
  const dialog = $('libraries-dialog'), input = $('library-query'), results = $('library-results');
  const showUnusable = $('library-show-incompatible');
  const board = () => boards.get(store.current.env);
  const unusable = p => incompatibleRow(board(), p);
  let generation = 0, controller, page = 1, query = '', items = [], shown = 0;
  let candidates = [];
  const seen = new Map();
  let timer, pending, composing = false, compositionEnded = -Infinity;
  function cancel() {
    clearTimeout(timer); timer = undefined;
    generation++; controller?.abort(); pending = undefined;
  }
  function message(text, state = '') {
    $('library-status').textContent = text; $('library-status').dataset.state = state;
  }
  function clearResults() {
    items = []; candidates = []; $('library-suggestions').replaceChildren(); renderResults(); results.setAttribute('aria-busy', 'false');
    $('library-next').hidden = $('library-prev').hidden = true;
  }
  function inputChanged() {
    cancel(); clearResults(); page = 1;
    message(input.value.trim() ? '' : '名前・キーワードを入力');
    if (!composing && input.value.trim() && dialog.open) timer = setTimeout(() => search(), 400);
  }
  function apply(next, text) {
    try { change(validateLibraries(next)); renderAdded(); renderResults(); message(text + ' 実パッケージはBuild時に取得します。'); }
    catch (error) { message(error.message); }
  }
  function renderAdded() {
    $('library-target').textContent = store.current.name;
    // Everything this view hides or flags is the selected board's statement, so the view says
    // which board it is talking about, right next to the project it is editing.
    $('library-board').textContent = board() ? ` · ${board().name}` : '';
    const list = $('library-added'); list.replaceChildren();
    $('library-added-label').textContent = store.current.libraries.length ? '追加済み' : '追加済み：なし';
    for (const p of store.current.libraries) {
      const row = element('li', '', 'library-row');
      const title = element('div', `${p.owner}/${p.name} · ${p.version}`, 'library-title');
      const blocked = unusable(p);
      if (blocked) title.append(element('p', `${board()?.name ?? 'このボード'}では使えません：${blocked.reason}。代替: ${blocked.alternative}`, 'library-incompatible'));
      row.append(title);
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
      controls.append(select, add); area.append(controls); if (document.activeElement === button) select.focus();
    } catch (error) {
      if (current === generation && error.name !== 'AbortError') area.replaceChildren(element('p', error.message, 'library-error'));
    } finally { if (current === generation) button.disabled = false; }
  }
  // The count states what is on screen, so it is taken from the rows this render actually makes:
  // a row hidden as unusable is not a candidate the user can see.
  function resultsMessage() {
    message(`取得候補 ${shown}件 · ${page}/${Math.ceil(candidates.length / 10)}ページ（全件ではありません）`);
  }
  function renderResults() {
    results.replaceChildren();
    shown = 0;
    for (const p of items) {
      const blocked = unusable(p);
      if (blocked && !showUnusable.checked) continue;
      const row = element('li', '', 'library-result'); row.dataset.libraryId = p.id;
      if (blocked) row.classList.add('library-unusable');
      const heading = element('div', '', 'library-row');
      const info = element('div', '', 'library-info');
      info.append(element('strong', p.name));
      if (blocked) info.append(element('span', '使えません', 'library-badge'));
      info.append(element('small', `提供者：${p.owner} · Registry #${p.id}`));
      const added = store.current.libraries.find(x => x.id === p.id);
      const button = element('button', added ? '追加済み · 版を変更' : 'バージョンを選択');
      const area = element('div', '', 'library-detail');
      button.onclick = () => details(p, area, button);
      heading.append(info, button); row.append(heading, element('p', descriptionText(p.description), 'library-description'));
      // Shown, not withheld: the reason and the alternative are here, and the add button stays.
      if (blocked) row.append(element('p', `${blocked.reason}。代替: ${blocked.alternative}`, 'library-unusable-reason'));
      row.append(area); results.append(row); shown++;
    }
    // A checkbox or board change re-renders without a new search, and the count follows it.
    if (candidates.length) resultsMessage();
  }
  function showPage(nextPage) {
    if (nextPage !== page) { cancel(); controller = new AbortController(); dialog.scrollTop = 0; }
    page = nextPage; items = candidates.slice((page - 1) * 10, page * 10); renderResults(); // sets the count
    if (!candidates.length) message('今回の候補取得では見つかりませんでした');
    $('library-next').hidden = page * 10 >= candidates.length; $('library-prev').hidden = page <= 1;
    if (!candidates.length) {
      const suggestions = nearbyNames(query, seen.values());
      if (suggestions.length) {
        const box = $('library-suggestions'); box.append(element('p', 'もしかして（この画面で取得済みの名前）', 'storage-hint'));
        for (const p of suggestions) {
          const button = element('button', p.name); button.title = `${p.owner}/${p.name} · Registry #${p.id}`;
          button.onclick = () => { input.value = p.name; search(); input.focus(); };
          box.append(button);
        }
      }
    }
  }
  async function search(nextPage = 1) {
    clearTimeout(timer); timer = undefined;
    if (!dialog.open || composing) return;
    const nextQuery = input.value.trim();
    if (pending?.query === nextQuery && pending.page === nextPage) return;
    cancel(); clearResults();
    query = nextQuery; page = nextPage;
    if (!query) { message('名前・キーワードを入力'); return; }
    controller = new AbortController(); const current = generation;
    pending = { query, page };
    message('検索中…', 'loading'); results.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/libraries/search?' + new URLSearchParams({ q: query, page }), { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '検索に失敗しました');
      if (current !== generation || !dialog.open) return;
      candidates = data.items;
      for (const p of candidates) { seen.delete(p.id); seen.set(p.id, p); if (seen.size > 200) seen.delete(seen.keys().next().value); }
      showPage(1);
    } catch (error) { if (current === generation && error.name !== 'AbortError') message(error.message, 'error'); }
    finally { if (current === generation) { pending = undefined; results.setAttribute('aria-busy', 'false'); } }
  }
  input.oninput = event => {
    if (event.isComposing) composing = true;
    inputChanged();
  };
  input.addEventListener('compositionstart', () => { composing = true; inputChanged(); });
  input.addEventListener('compositionend', () => {
    composing = false; compositionEnded = performance.now(); inputChanged();
  });
  // Some IMEs end composition just before the confirming Enter keydown.
  input.onkeydown = event => {
    if (event.key === 'Enter' && (composing || event.isComposing || event.keyCode === 229 || performance.now() - compositionEnded < 50)) event.preventDefault();
  };
  $('library-search-form').onsubmit = event => {
    event.preventDefault();
    if (!composing) search();
  };
  $('library-next').onclick = () => showPage(page + 1);
  $('library-prev').onclick = () => showPage(page - 1);
  $('libraries-open').onclick = () => {
    cancel(); composing = false; compositionEnded = -Infinity; page = 1; input.value = ''; renderAdded(); clearResults();
    message('名前・キーワードを入力'); dialog.showModal(); input.focus();
  };
  $('libraries-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { cancel(); $('libraries-open').focus(); });
  try { showUnusable.checked = Boolean(JSON.parse(localStorage.getItem(UI_KEY))?.showIncompatible); }
  catch { /* an unreadable preference simply leaves the default: unusable libraries are hidden */ }
  showUnusable.onchange = () => {
    try { localStorage.setItem(UI_KEY, JSON.stringify({ showIncompatible: showUnusable.checked })); }
    catch { /* the preference is a convenience; failing to store it must not stop the view */ }
    renderResults();
  };
  // Both lists state something about the selected board, so a board change re-evaluates them.
  return { boardChanged() { renderAdded(); renderResults(); } };
}
