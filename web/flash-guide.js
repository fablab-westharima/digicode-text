// 書き込み前に出す接続手順のモーダル。手順文・図の識別子・補足はすべて GET /boards の
// flashGuide（正本は compiler/flash-guides.mjs）から来る。この画面は書き込み自体を行わない：
// OK で app.js が持つ既存の書き込み処理をそのまま呼ぶだけで、flash.js には触れない。
//
// OK のクリックはそれ自体が利用者の操作なので、showDirectoryPicker を必要とする RP2040 の経路も
// そのまま動く。confirm() は「表示しない」保存済みのボードでは同期的に proceed を呼ぶ。
import { FIGURES } from './figures/index.js';

const $ = (id) => document.getElementById(id);
export const FLASH_GUIDE_KEY = 'digicode-text.flash-guide.v1';

function readSkipped() {
  try {
    const saved = JSON.parse(localStorage.getItem(FLASH_GUIDE_KEY) || 'null');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch { return {}; } // 壊れた記録は「毎回表示」に倒す
}

export function setupFlashGuide() {
  let skipped = readSkipped();
  let proceed = null; // OK のときだけ呼ぶ、この回の書き込み処理

  function persist(board, skip) {
    skipped = { ...skipped, [board.id]: skip };
    if (!skip) delete skipped[board.id];
    try { localStorage.setItem(FLASH_GUIDE_KEY, JSON.stringify(skipped)); }
    catch { /* 表示の設定は保存できなくても書き込みは続けられる */ }
  }

  function render(board, flashing) {
    const guide = board.flashGuide;
    $('flash-guide-title').textContent = `${board.name} の接続手順`;
    $('flash-guide-lead').textContent = flashing
      ? '書き込みの前に、ボードを次のように接続してください。'
      : '書き込みの前に必要な接続です。';
    const steps = $('flash-guide-steps');
    steps.replaceChildren();
    for (const step of guide.steps) {
      const item = document.createElement('li');
      const figure = FIGURES[step.figure];
      if (figure) {
        const box = document.createElement('div');
        box.className = 'flash-figure';
        box.dataset.figure = step.figure;
        box.innerHTML = figure; // 自分の repo の web/figures/*.svg だけを入れる
        item.append(box);
      }
      const text = document.createElement('p');
      text.textContent = step.text;
      item.append(text);
      steps.append(item);
    }
    const notes = $('flash-guide-notes');
    notes.replaceChildren();
    for (const note of guide.notes ?? []) {
      const item = document.createElement('li');
      item.textContent = note;
      notes.append(item);
    }
    notes.hidden = !notes.childElementCount;
    $('flash-guide-skip').checked = Boolean(skipped[board.id]);
    $('flash-guide-ok').textContent = flashing ? 'OK（書き込みへ）' : '閉じる';
    $('flash-guide-cancel').hidden = !flashing;
  }

  let shown = null; // いま表示しているボード
  function open(board, flashing) {
    shown = board;
    render(board, flashing);
    $('flash-guide-dialog').showModal();
  }
  $('flash-guide-ok').onclick = () => {
    if (shown) persist(shown, $('flash-guide-skip').checked);
    const run = proceed;
    proceed = null;
    $('flash-guide-dialog').close();
    run?.(); // このクリックの操作のまま、既存の書き込み処理へ
  };
  // キャンセルと Esc は何もしない：書き込みも、表示設定の保存もしない。
  $('flash-guide-cancel').onclick = () => $('flash-guide-dialog').close();
  $('flash-guide-dialog').addEventListener('close', () => { proceed = null; shown = null; });

  return {
    /** 書き込みボタンから。表示しない設定のボードでは同期的に run() を呼ぶ。 */
    confirm(board, run) {
      if (!board?.flashGuide || skipped[board.id]) { run(); return; }
      proceed = run;
      open(board, true);
    },
    /** 「接続手順」リンクから。書き込みはしない。閲覧でもチェックの保存値をそのまま出す。 */
    show(board) {
      if (!board?.flashGuide) return;
      proceed = null;
      open(board, false);
    },
    /** 設定の「接続手順の非表示をすべて解除」から。全ボードの保存値を消す。 */
    resetSkipped() {
      skipped = {};
      try { localStorage.removeItem(FLASH_GUIDE_KEY); }
      catch { /* 消せなくても、この読み込みの間は毎回出す */ }
      if (shown) $('flash-guide-skip').checked = false; // 開いたまま解除したときの見た目も合わせる
    },
  };
}
