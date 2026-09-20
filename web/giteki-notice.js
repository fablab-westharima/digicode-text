// 無線を使えるボードを選んだときに一度だけ出す、技適の確認をうながす注意。ボードの選択は
// この前に成立していて、ここは止めない：OK で閉じるだけで、書き込みにも Build にも触らない。
// 事実と出所は取説の「技適について」にあり、この画面はその入口を持つだけ。
//
// 日本かどうかはブラウザ自身の設定だけで決める。外部へは何も問い合わせない。非表示の保存は
// flash-guide.js と同じ形（localStorage に { [boardId]: true }、壊れた記録は毎回表示に倒す）で、
// キーだけ別にする。
const $ = (id) => document.getElementById(id);
export const GITEKI_KEY = 'digicode-text.giteki-notice.v1';

/** 日本のブラウザか。時間帯と表示言語のどちらかが日本なら日本として扱う。 */
export function isJapan({ timeZone, language }) {
  return timeZone === 'Asia/Tokyo' || String(language ?? '').toLowerCase().startsWith('ja');
}
const browserLocale = () => ({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, language: navigator.language });

function readSkipped() {
  try {
    const saved = JSON.parse(localStorage.getItem(GITEKI_KEY) || 'null');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch { return {}; } // 壊れた記録は「毎回表示」に倒す
}

/** openHelp: 取説を節を指定して開く関数。locale: 差し替えられるようにした、ブラウザの設定の読み口。 */
export function setupGitekiNotice(openHelp, locale = browserLocale) {
  let skipped = readSkipped();
  let shown = null; // いま表示しているボード

  function persist(board, skip) {
    skipped = { ...skipped, [board.id]: skip };
    if (!skip) delete skipped[board.id];
    try { localStorage.setItem(GITEKI_KEY, JSON.stringify(skipped)); }
    catch { /* 表示の設定は保存できなくても、選んだボードはそのまま使える */ }
  }

  // OK のときだけ保存する。Esc で閉じたときは何も残さない（接続手順の dialog と同じ扱い）。
  $('giteki-ok').onclick = () => {
    if (shown) persist(shown, $('giteki-skip').checked);
    $('giteki-dialog').close();
  };
  // 取説はこの dialog の上にもう1枚重ねて開く。閉じればこの注意に戻る。
  $('giteki-help').onclick = () => openHelp('giteki');
  $('giteki-dialog').addEventListener('close', () => { shown = null; });

  return {
    /** ボードを選んだ直後に。無線を持たないボード、日本以外のブラウザ、非表示のボードでは何もしない。 */
    notice(board) {
      if (!board?.wireless || skipped[board.id] || !isJapan(locale())) return;
      shown = board;
      $('giteki-title').textContent = `${board.name} の無線について`;
      $('giteki-skip').checked = false;
      $('giteki-dialog').showModal();
    },
    /** 設定の「技適の注意の非表示をすべて解除」から。全ボードの保存値を消す。 */
    resetSkipped() {
      skipped = {};
      try { localStorage.removeItem(GITEKI_KEY); }
      catch { /* 消せなくても、この読み込みの間は毎回出す */ }
      if (shown) $('giteki-skip').checked = false; // 開いたまま解除したときの見た目も合わせる
    },
  };
}
