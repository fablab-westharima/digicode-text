// The Boards sidebar view: the same board facts the AI is given, shown to the user.
// Everything rendered here comes from GET /boards — nothing is written by hand in this file.
const $ = (id) => document.getElementById(id);

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function pinTable(pins) {
  const table = element('table', null, 'pin-table');
  const head = element('tr'), thead = element('thead');
  for (const label of ['ラベル', 'GPIO', '備考']) head.append(element('th', label));
  thead.append(head);
  table.append(thead);
  const body = element('tbody');
  for (const pin of pins.pins) {
    const row = element('tr');
    row.append(element('td', pin.label, 'pin-label'));
    row.append(element('td', pin.gpio === null ? `— (pin ${pin.pin})` : `GPIO${pin.gpio}`, 'pin-gpio'));
    const extra = [...pin.functions, ...(pin.adc && pin.adc !== pin.label ? [pin.adc] : []), ...(pin.note ? [pin.note] : [])];
    row.append(element('td', extra.join('、')));
    body.append(row);
  }
  for (const f of pins.unlabelledFunctions ?? []) {
    const row = element('tr');
    row.append(element('td', '—', 'pin-label'));
    row.append(element('td', `GPIO${f.gpio}`, 'pin-gpio'));
    row.append(element('td', [f.name, 'ラベル無し', ...(f.note ? [f.note] : [])].join('、')));
    body.append(row);
  }
  table.append(body);
  return table;
}

export function renderBoardFacts(board) {
  const root = $('board-facts');
  root.replaceChildren();
  if (!board) return;
  root.append(element('h3', board.name, 'view-section-title'));
  const summary = element('dl', null, 'board-summary');
  for (const [term, value] of [
    ['framework', board.framework], ['core', board.core], ['成果物', board.artifact],
    ['ブラウザから書き込み', board.browserFlash ? '対応' : '非対応'],
    ['Serialモニタ', board.serial ? '利用できる' : '利用できない'],
  ]) { summary.append(element('dt', term), element('dd', value)); }
  root.append(summary);

  // pinTableNote comes before the table because it says how to read it.
  if (board.pinTableNote) root.append(element('p', board.pinTableNote, 'board-warning'));

  if (board.pins) {
    root.append(element('h3', 'ピン', 'view-section-title'));
    root.append(element('p', `coreのvariant「${board.pins.variant}」の定義から生成しています。`, 'storage-hint'));
    root.append(pinTable(board.pins));
  }

  if (board.pinNotes?.length) {
    root.append(element('h3', '注意点', 'view-section-title'));
    const list = element('ul', null, 'board-notes');
    const sources = [...new Set(board.pinNotes.map(n => n.source))];
    for (const note of board.pinNotes) {
      const item = element('li', note.text);
      item.append(element('span', ` [${sources.indexOf(note.source) + 1}]`, 'note-source'));
      list.append(item);
    }
    root.append(list);
    root.append(element('h3', '出所', 'view-section-title'));
    const origins = element('ol', null, 'board-sources');
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

  root.append(element('h3', '書き込み', 'view-section-title'));
  root.append(element('p', board.flashHint, 'board-flash-hint'));
}
