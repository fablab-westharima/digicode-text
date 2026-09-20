// The Boards sidebar view: the list of boards, and the same board facts the AI is given.
// Everything rendered here comes from GET /boards — nothing is written by hand in this file.
const $ = (id) => document.getElementById(id);

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

/** 折り返させない表を、容れ物だけ横スクロールする箱に入れる（取説のピン表と同じ作り）。 */
function scrollBox(table) {
  const box = element('div', null, 'table-scroll');
  box.append(table);
  return box;
}

// ピン表。型は共通規則の .table で、ラベルと GPIO は .nowrap：
// 「GPIO26」が「GPIO2/6」と割れると番号として読めない（取説の同じ表と同じ作り）。
// pin-table / pin-label / pin-gpio は目印として残す（等幅で読ませる指定だけがこの view の事情）。
function pinTable(pins) {
  const table = element('table', null, 'table pin-table');
  const head = element('tr'), thead = element('thead');
  for (const [label, className] of [['ラベル', 'nowrap'], ['GPIO', 'nowrap'], ['備考', null]])
    head.append(element('th', label, className));
  thead.append(head);
  table.append(thead);
  const body = element('tbody');
  for (const pin of pins.pins) {
    const row = element('tr');
    row.append(element('td', pin.label, 'nowrap pin-label'));
    row.append(element('td', pin.gpio === null ? `— (pin ${pin.pin})` : `GPIO${pin.gpio}`, 'nowrap pin-gpio'));
    const extra = [...pin.functions, ...(pin.adc && pin.adc !== pin.label ? [pin.adc] : []), ...(pin.note ? [pin.note] : [])];
    row.append(element('td', extra.join('、')));
    body.append(row);
  }
  for (const f of pins.unlabelledFunctions ?? []) {
    const row = element('tr');
    row.append(element('td', '—', 'nowrap pin-label'));
    row.append(element('td', `GPIO${f.gpio}`, 'nowrap pin-gpio'));
    row.append(element('td', [f.name, 'ラベル無し', ...(f.note ? [f.note] : [])].join('、')));
    body.append(row);
  }
  table.append(body);
  return scrollBox(table);
}

// /boards の artifact は機械向けの値なので、箱に出すときだけ言い換える。
const ARTIFACT_LABELS = { uf2: 'UF2', flashset: '書き込みセット' };

// The lower stage of the box: facts only, so nothing in here is a control.
function renderBoardFacts(root, board) {
  // pinTableNote comes before the table because it says how to read it.
  if (board.pinTableNote) root.append(element('p', board.pinTableNote, 'note board-warning'));

  if (board.pins) {
    root.append(element('h3', 'ピン', 'heading view-section-title'));
    root.append(pinTable(board.pins));
    root.append(element('p', `出所: variant「${board.pins.variant}」`, 'form-hint board-variant'));
  }

  if (board.pinNotes?.length) {
    root.append(element('h3', '注意点', 'heading view-section-title'));
    // 注意点は 1 枚の NOTE の箱に入れる（取説の同じ並びと同じ作り）。ul 自身は目印として
    // .board-notes のまま：接続手順 dialog の #flash-guide-notes も同じ class を使う。
    const box = element('div', null, 'note');
    const list = element('ul', null, 'board-notes');
    const sources = [...new Set(board.pinNotes.map(n => n.source))];
    for (const note of board.pinNotes) {
      const item = element('li', note.text);
      item.append(element('span', ` [${sources.indexOf(note.source) + 1}]`, 'note-source'));
      list.append(item);
    }
    box.append(list);
    root.append(box);
    root.append(element('h3', '出所', 'heading view-section-title'));
    const origins = element('ol', null, 'sources board-sources');
    for (const source of sources) {
      const item = element('li');
      // Only http(s) sources become links; the Wio Node schematic entry is a sentence, not a URL.
      if (/^https?:\/\//.test(source)) {
        const link = element('a', source);
        link.href = source; link.target = '_blank'; link.rel = 'noreferrer noopener';
        item.append(link);
      } else item.textContent = source;
      origins.append(item);
    }
    root.append(origins);
  }

  root.append(element('h3', '書き込み', 'heading view-section-title'));
  root.append(element('p', board.flashHint, 'prose board-flash-hint'));
}

// The list of boards. A row only opens its box; the board changes through the button inside
// the box, which hands the id to `select` (app.js puts it on #env and fires its change).
export function setupBoardList(boards, selectedId, select) {
  let openId = null, pinsOpen = false;
  // View を開き直したら箱は閉じている。
  function reset() { openId = null; pinsOpen = false; render(); }
  function render(focusId) {
    const root = $('board-list');
    root.replaceChildren();
    // vendor ごとに括る。並びは vendor 名→ボード名で、/boards の順（#env の option の順）とは別。
    const sorted = [...boards.values()].sort((a, b) => a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name));
    let list, vendor;
    for (const board of sorted) {
      if (board.vendor !== vendor) {
        vendor = board.vendor;
        list = element('ul', null, 'board-group');
        root.append(element('h4', vendor, 'board-vendor'), list);
      }
      const item = element('li');
      item.dataset.boardId = board.id;
      const row = element('button', '', 'list-row board-item');
      row.type = 'button';
      row.setAttribute('aria-expanded', String(openId === board.id));
      // 選択中の行はエクスプローラの選択中プロジェクトと同じハイライト。
      row.setAttribute('aria-current', String(selectedId() === board.id));
      row.append(element('strong', board.name));
      // 実機で動かして確かめたかどうかは、この repo の事実。build と書き込みセットまでは
      // 実測しているが板が手元に無いボードに印を付ける（説明はホバーへ）。
      if (board.hardwareVerified === false) {
        const badge = element('span', '実機確認待ち', 'board-badge');
        badge.title = 'このボードはBuildと書き込みセットまで確かめてあり、実機での動作はまだ確かめていない';
        row.append(badge);
      }
      row.onclick = () => { openId = openId === board.id ? null : board.id; pinsOpen = false; render(board.id); };
      item.append(row);
      if (openId === board.id) item.append(detailBox(board));
      list.append(item);
      if (focusId === board.id) row.focus();
    }
  }
  function detailBox(board) {
    const box = element('dl', null, 'detail-box');
    box.id = 'board-detail';
    for (const [term, value] of [
      ['framework', board.framework], ['core', board.core], ['成果物', ARTIFACT_LABELS[board.artifact] ?? board.artifact],
      ['ブラウザから書き込み', board.browserFlash ? '対応' : '非対応'],
      ['Serialモニタ', board.serial ? '利用できる' : '利用できない'],
    ]) box.append(element('dt', term), element('dd', value));
    const actions = element('div', null, 'detail-actions');
    if (selectedId() === board.id) actions.append(element('span', '選択中', 'board-current'));
    else {
      const choose = element('button', 'このボードを選ぶ');
      choose.type = 'button'; choose.id = 'board-select';
      choose.onclick = () => { select(board.id); render(board.id); };
      actions.append(choose);
    }
    const pins = element('button', 'ピン表と注意点');
    pins.type = 'button'; pins.id = 'board-pins-toggle';
    pins.setAttribute('aria-expanded', String(pinsOpen));
    pins.setAttribute('aria-controls', 'board-facts');
    const facts = element('div');
    facts.id = 'board-facts'; facts.hidden = !pinsOpen;
    if (pinsOpen) renderBoardFacts(facts, board);
    pins.onclick = () => {
      pinsOpen = !pinsOpen;
      pins.setAttribute('aria-expanded', String(pinsOpen));
      facts.hidden = !pinsOpen;
      facts.replaceChildren();
      if (pinsOpen) renderBoardFacts(facts, board);
    };
    actions.append(pins);
    box.append(actions, facts);
    return box;
  }
  // The layout hides a view by its `hidden` attribute; that is the moment the box closes.
  new MutationObserver(() => { if ($('boards-view').hidden && openId !== null) reset(); })
    .observe($('boards-view'), { attributes: true, attributeFilter: ['hidden'] });
  render();
  return { render };
}
