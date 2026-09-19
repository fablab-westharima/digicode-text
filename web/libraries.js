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
  let generation = 0, controller, page = 1, query = '', items = [];
  let candidates = [];
  // どの行の詳細を開いているか。一覧ごとに1つだけ、初期は閉。ビューを開き直すと閉に戻る。
  let openResult = null, openAdded = null;
  // 「追加済み」の一覧そのものの開閉。初期は閉で、保存はしない。追加・削除・版変更では変わらない。
  let addedOpen = false;
  const seen = new Map();
  let timer, pending, composing = false, compositionEnded = -Infinity;
  function cancel() {
    clearTimeout(timer); timer = undefined;
    generation++; controller?.abort(); pending = undefined;
  }
  // カードの知らせ（追加・削除・失敗）にだけ閉じる×を付ける。記号は CSS の ::before が描くので文は text だけ。
  const statusClose = element('button', '', 'notice-close');
  statusClose.id = 'library-status-close'; statusClose.type = 'button';
  statusClose.setAttribute('aria-label', '知らせを閉じる');
  statusClose.onclick = () => message('');
  let statusTimer;
  function message(text, state = '') {
    clearTimeout(statusTimer);
    $('library-status').textContent = text; $('library-status').dataset.state = state;
    if (text && (state === 'ok' || state === 'error')) $('library-status').append(statusClose);
    // うまくいった知らせは数秒で引っ込める。失敗は次の操作まで残す（エクスプローラの知らせと同じ）。
    if (text && state === 'ok') statusTimer = setTimeout(() => message(''), 6000);
  }
  function clearResults() {
    items = []; candidates = []; openResult = null;
    $('library-suggestions').replaceChildren(); renderResults(); results.setAttribute('aria-busy', 'false');
    $('library-next').hidden = $('library-prev').hidden = true;
  }
  function inputChanged() {
    cancel(); clearResults(); page = 1;
    message(input.value.trim() ? '' : '名前・キーワードを入力');
    if (!composing && input.value.trim() && dialog.open) timer = setTimeout(() => search(), 400);
  }
  function apply(next, text) {
    try { change(validateLibraries(next)); renderAdded(); renderResults(); message(text + ' 実パッケージはBuild時に取得します。', 'ok'); }
    catch (error) { message(error.message, 'error'); }
  }
  // 一覧の1行。字は名前だけで、右端に控えめな副題（提供者または版）と、使えないときだけバッジ。
  // 押すと真下の箱が開き、もう一度押すと閉じる。開閉の印は CSS の ::after が描く。
  function entryRow(p, meta, blocked, expanded, toggle) {
    const button = element('button', '', 'library-item');
    button.type = 'button';
    button.setAttribute('aria-expanded', String(expanded));
    // 追加済みの印 ✓ は CSS の ::before が描く。名前の文字列には入れない。
    if (store.current.libraries.some(x => x.id === p.id)) button.dataset.added = 'true';
    button.append(element('strong', p.name));
    if (blocked) button.append(element('span', '使えません', 'library-badge'));
    button.append(element('span', meta, 'library-meta'));
    button.onclick = toggle;
    return button;
  }
  function labelled(box, label, value, className) {
    box.append(element('dt', label));
    box.append(element('dd', value, className));
  }
  function renderAdded() {
    $('library-target').textContent = store.current.name;
    // Everything this view hides or flags is the selected board's statement, so the view says
    // which board it is talking about, right next to the project it is editing.
    $('library-board').textContent = board() ? ` · ${board().name}` : '';
    const list = $('library-added'); list.replaceChildren();
    $('library-added-count').textContent = String(store.current.libraries.length);
    $('library-added-toggle').setAttribute('aria-expanded', String(addedOpen));
    list.hidden = !addedOpen;
    if (!store.current.libraries.some(p => p.id === openAdded)) openAdded = null;
    for (const p of store.current.libraries) {
      // 検索結果の行と同じ属性名にすると、どちらを指しているのか分からなくなる。
      const row = element('li', '', 'library-entry'); row.dataset.addedId = p.id;
      const blocked = unusable(p);
      row.append(entryRow(p, p.version, blocked, openAdded === p.id, () => {
        openAdded = openAdded === p.id ? null : p.id;
        renderAdded(); // 行を作り直すので、押した行へフォーカスを戻す
        list.querySelector(`[data-added-id="${p.id}"] .library-item`)?.focus();
      }));
      if (openAdded === p.id) row.append(addedDetail(p, blocked));
      list.append(row);
    }
  }
  // 行とは別の面。使えない理由と代替はここにあり、行にはバッジだけが出る。
  function addedDetail(p, blocked) {
    const box = document.createElement('dl');
    box.id = 'library-added-detail'; box.className = 'detail-box';
    labelled(box, '提供者', p.owner);
    labelled(box, 'Registry', `#${p.id}`);
    if (blocked) labelled(box, 'このボード', `${board()?.name ?? 'このボード'}では使えません：${blocked.reason}。代替: ${blocked.alternative}`, 'library-incompatible');
    const actions = element('div', '', 'detail-actions');
    const remove = element('button', '削除');
    remove.type = 'button';
    remove.setAttribute('aria-label', `${p.owner}/${p.name} を削除`);
    remove.onclick = () => { apply(store.current.libraries.filter(x => x.id !== p.id), 'プロジェクトから削除しました。'); input.focus(); };
    actions.append(remove); box.append(actions);
    return box;
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
        results.querySelector(`[data-library-id="${p.id}"] .library-version`)?.focus();
      };
      controls.append(select, add); area.append(controls); if (document.activeElement === button) select.focus();
    } catch (error) {
      if (current === generation && error.name !== 'AbortError') area.replaceChildren(element('p', error.message, 'library-error'));
    } finally { if (current === generation) button.disabled = false; }
  }
  // The pager states where the user is in the candidates that were obtained; it is not a claim
  // about the Registry's whole catalogue.
  function renderPager() {
    const pages = Math.ceil(candidates.length / 10);
    $('library-page').textContent = pages ? `${page} / ${pages}` : '';
    $('library-pager').hidden = !pages;
    $('library-results-label').hidden = !pages; // 候補が無ければ見出しも出さない
  }
  function renderResults() {
    results.replaceChildren();
    let open = false;
    for (const p of items) {
      const blocked = unusable(p);
      if (blocked && !showUnusable.checked) continue;
      const row = element('li', '', 'library-result'); row.dataset.libraryId = p.id;
      if (blocked) row.classList.add('library-unusable');
      const expanded = openResult === p.id;
      open ||= expanded;
      row.append(entryRow(p, p.owner, blocked, expanded, () => {
        openResult = openResult === p.id ? null : p.id;
        renderResults(); // 行を作り直すので、押した行へフォーカスを戻す
        results.querySelector(`[data-library-id="${p.id}"] .library-item`)?.focus();
      }));
      if (expanded) row.append(resultDetail(p, blocked));
      results.append(row);
    }
    // チェックボックスやボードの変更で消えた行の詳細は、開いたままにしない。
    if (!open) openResult = null;
    renderPager();
  }
  // Shown, not withheld: the reason and the alternative are here, and the add button stays.
  function resultDetail(p, blocked) {
    const box = document.createElement('dl');
    box.id = 'library-result-detail'; box.className = 'detail-box';
    labelled(box, 'Registry', `#${p.id}`);
    labelled(box, '説明', descriptionText(p.description), 'library-description');
    if (blocked) labelled(box, 'このボード', `${blocked.reason}。代替: ${blocked.alternative}`, 'library-unusable-reason');
    const actions = element('div', '', 'detail-actions');
    const added = store.current.libraries.find(x => x.id === p.id);
    const button = element('button', added ? '追加済み · 版を変更' : 'バージョンを選択', 'library-version');
    button.type = 'button';
    const area = element('div', '', 'library-detail');
    button.onclick = () => details(p, area, button);
    actions.append(button, area); box.append(actions);
    return box;
  }
  function showPage(nextPage) {
    if (nextPage !== page) { cancel(); controller = new AbortController(); dialog.scrollTop = 0; }
    openResult = null; // ページを変えたら、前のページで開いていた詳細は残らない
    page = nextPage; items = candidates.slice((page - 1) * 10, page * 10); renderResults(); // sets the pager
    message(candidates.length ? '' : '今回の候補取得では見つかりませんでした');
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
  $('library-added-toggle').onclick = () => { addedOpen = !addedOpen; renderAdded(); $('library-added-toggle').focus(); };
  $('library-next').onclick = () => showPage(page + 1);
  $('library-prev').onclick = () => showPage(page - 1);
  $('libraries-open').onclick = () => {
    cancel(); composing = false; compositionEnded = -Infinity; page = 1; input.value = '';
    openAdded = null; renderAdded(); clearResults(); // 開くたびに、どちらの詳細も閉じた状態から始める
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
