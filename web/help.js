// 取説（ヘルプ dialog）。型は設定 dialog と同じで、左の目次で選んだ1節だけを右に出す。
//
// この画面にボードの事実を手で書く場所は無い。「ボードとピン」と、ライブラリの節の
// 非互換表は、どちらも GET /boards が返した内容（正本は compiler/server.mjs の BOARDS、
// compiler/flash-guides.mjs、compiler/boards/*.pins.json、compiler/library-incompat.mjs）から
// ここで描く。ボードが増えれば節も増える。
//
// 見た目は app.css の共通規則だけ（.heading / .prose / .steps / .note / .table / hr.rule と、
// ボード view の出所と同じ見え方の .sources / .note-source）。ヘルプ専用の見た目は作らない。
const $ = (id) => document.getElementById(id);

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

/** 文の並びを1枚の .note にまとめる。NOTE の札はCSSが1枚につき1つだけ描く。 */
function note(lines) {
  const box = element('div', null, 'note');
  for (const line of lines) box.append(element('p', line));
  return box;
}

/** 折り返させない表を、容れ物だけ横スクロールする箱に入れる。 */
function scrollBox(table) {
  const box = element('div', null, 'table-scroll');
  box.append(table);
  return box;
}

// ピン表。列はボード view の pin-table と同じ中身で、型だけ共通規則の .table にする。
// ラベルとGPIOは .nowrap：「GPIO26」が「GPIO2/6」と割れると番号として読めない。
function pinTable(pins) {
  const table = element('table', null, 'table');
  const head = element('tr'), thead = element('thead');
  for (const [label, className] of [['ラベル', 'nowrap'], ['GPIO', 'nowrap'], ['備考', null]])
    head.append(element('th', label, className));
  thead.append(head);
  table.append(thead);
  const body = element('tbody');
  for (const pin of pins.pins) {
    const row = element('tr');
    row.append(element('td', pin.label, 'nowrap'));
    row.append(element('td', pin.gpio === null ? `— (pin ${pin.pin})` : `GPIO${pin.gpio}`, 'nowrap'));
    row.append(element('td', [...pin.functions, ...(pin.adc && pin.adc !== pin.label ? [pin.adc] : []), ...(pin.note ? [pin.note] : [])].join('、')));
    body.append(row);
  }
  for (const f of pins.unlabelledFunctions ?? []) {
    const row = element('tr');
    row.append(element('td', '—', 'nowrap'));
    // ボード view の同じ表と同じ書き方。GPIO 番号を持たない機能（Pico W の LED_BUILTIN）がある。
    row.append(element('td', f.gpio === null ? `— (pin ${f.pin})` : `GPIO${f.gpio}`, 'nowrap'));
    row.append(element('td', [f.name, 'ラベル無し', ...(f.note ? [f.note] : [])].join('、')));
    body.append(row);
  }
  table.append(body);
  return scrollBox(table);
}

// 注意点は出所付き。末尾の番号と 出所 の並びはボード view と同じ作り。
function pinNotes(notes) {
  const box = element('div', null, 'note');
  const sources = [...new Set(notes.map(n => n.source))];
  const list = element('ul');
  for (const n of notes) {
    const item = element('li', n.text);
    item.append(element('span', ` [${sources.indexOf(n.source) + 1}]`, 'note-source'));
    list.append(item);
  }
  box.append(list, element('p', '出所'));
  const origins = element('ol', null, 'sources');
  for (const source of sources) {
    const item = element('li');
    // 全体が1本の URL のものだけリンクにする。Wio Node の回路図の出所は URL で始まる「文」で、
    // 丸ごと href に入れてよいものではない（ボード view の同じ並びは今そうなっている）。
    if (/^https?:\/\/\S+$/.test(source)) {
      const link = element('a', source);
      link.href = source; link.target = '_blank'; link.rel = 'noreferrer noopener';
      item.append(link);
    } else item.textContent = source;
    origins.append(item);
  }
  box.append(origins);
  return box;
}

// 1ボードぶん：小見出し → 接続手順 → 書き込みの注意（＋ピン表の読み方）→ ピン表 → 注意点。
function boardBlock(board) {
  const parts = [element('h4', board.name, 'heading')];
  const steps = element('ol', null, 'steps');
  for (const step of board.flashGuide?.steps ?? []) steps.append(element('li', step.text));
  if (steps.childElementCount) parts.push(steps);
  // 書き込みの補足と、ピン表の読み方（pinTableNote）は1枚の NOTE にまとめて表の直前に置く。
  const before = [
    ...(board.hardwareVerified === false ? ['このボードはBuildと書き込みセットまで確かめてある。実機での動作はまだ確かめていない。'] : []),
    ...(board.flashGuide?.notes ?? []), ...(board.pinTableNote ? [board.pinTableNote] : [])];
  if (before.length) parts.push(note(before));
  if (board.pins) {
    parts.push(pinTable(board.pins));
    parts.push(element('p', `出所: variant「${board.pins.variant}」`, 'form-hint'));
  }
  if (board.pinNotes?.length) parts.push(pinNotes(board.pinNotes));
  return parts;
}

// 非互換表。行は各ボードの incompatibleLibraries から集め、同じライブラリはボード名をまとめる。
function incompatTable(boards) {
  const rows = new Map();
  for (const board of boards) {
    for (const row of board.incompatibleLibraries ?? []) {
      const found = rows.get(row.library) ?? { ...row, boards: [] };
      found.boards.push(board.name);
      rows.set(row.library, found);
    }
  }
  if (!rows.size) {
    const empty = element('div', null, 'prose');
    empty.append(element('p', 'いまのところ、Build ハーネスで失敗を見たライブラリはありません。'));
    return empty;
  }
  const table = element('table', null, 'table');
  const head = element('tr'), thead = element('thead');
  // ライブラリ名とボード名は .nowrap：「adafruit/Adafru」「it MQTT Library」と割れると名前にならない。
  for (const [label, className] of [['ライブラリ', 'nowrap'], ['使えないボード', 'nowrap'], ['理由と代わり', null]])
    head.append(element('th', label, className));
  thead.append(head);
  table.append(thead);
  const body = element('tbody');
  for (const row of rows.values()) {
    const tr = element('tr');
    tr.append(element('td', row.library, 'nowrap'));
    tr.append(element('td', row.boards.join('、'), 'nowrap'));
    tr.append(element('td', `${row.reason}。代わりに ${row.alternative} が使えます。`));
    body.append(tr);
  }
  table.append(body);
  return scrollBox(table);
}

/**
 * boards: app.js が持つ /boards の Map。showFlashGuide: 選択中ボードの接続手順を開く関数。
 * selectedId: いま選ばれているボードの id を返す関数。
 * 返り値の open() だけが dialog を開ける口で、閉じるのは dialog 自身（「閉じる」と Esc）。
 */
export function setupHelp(boards, showFlashGuide, selectedId) {
  const list = [...boards.values()];
  $('help-incompat').replaceChildren(incompatTable(list));

  // ボードの節は1台ずつ出す。4台を縦に並べると 5300px を超え、自分の板まで辿れない。
  // 切替は共通規則の .actions のボタン列で、選択中は aria-pressed で示す。
  let shownBoard = null;
  function renderBoards(id) {
    shownBoard = boards.has(id) ? id : list[0].id;
    const row = element('div', null, 'actions');
    for (const board of list) {
      const button = element('button', board.name, 'compact');
      button.type = 'button';
      button.dataset.boardId = board.id;
      button.setAttribute('aria-pressed', String(board.id === shownBoard));
      button.onclick = () => renderBoards(board.id);
      row.append(button);
    }
    $('help-board-list').replaceChildren(row, ...boardBlock(boards.get(shownBoard)));
  }
  renderBoards(selectedId());

  const parts = [...document.querySelectorAll('#help-dialog [data-section]')];
  function show(name) {
    for (const part of parts) {
      const current = part.dataset.section === name;
      if (part.tagName === 'BUTTON') part.setAttribute('aria-current', String(current));
      else part.hidden = !current;
    }
    $('help-content').scrollTop = 0;
  }
  for (const button of $('help-nav').children) button.onclick = () => show(button.dataset.section);
  $('help-close').onclick = () => $('help-dialog').close();
  // 接続手順は <dialog> の上にもう1枚 showModal で重ねて開く。狭い画面ではタブバーの
  // 「接続手順」が消えるので、ここが唯一の入口。
  $('help-flash-guide').onclick = showFlashGuide;

  return {
    open(section = 'first') {
      // 開くたび、ボードの節はいま選ばれているボードから始める。
      renderBoards(selectedId());
      show(section);
      if (!$('help-dialog').open) $('help-dialog').showModal();
    },
  };
}
