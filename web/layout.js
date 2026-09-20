// The VS Code style shell: activity bar, sidebar views, editor column, right AI panel, status bar.
// Everything here is placement and persistence — no Build, flash, serial or AI behaviour lives in
// this file. The sidebar's Libraries section keeps the ids and the open/close protocol that
// libraries.js was written against, so that module is untouched. Settings and Help are real
// <dialog>s in index.html, opened from app.js, so they need nothing here.
const $ = (id) => document.getElementById(id);

export const LAYOUT_KEY = 'digicode-text.layout.v1';
const NARROW = 900; // below this the sidebar and the AI panel float over the editor column
const ACTIVITY = 56; // the activity bar's width in app.css; a floating panel never covers it
const LIMITS = { sidebarWidth: [320, 640], aiWidth: [320, 720], panelHeight: [100, 500] };
const DEFAULTS = { sidebarOpen: true, sidebarView: 'explorer', sidebarWidth: 320, panelOpen: false, panelHeight: 220, aiOpen: false, aiWidth: 420, sidebarPinned: false, aiPinned: false };
// ピン留めの対象（data-pin の値）と、それが指す state のキー。
const PINS = { sidebar: 'sidebarPinned', ai: 'aiPinned' };
// タイトル行のピン留めボタンの説明（title と aria-label に同じ文を出す）。
const PIN_TITLE = {
  sidebar: { on: 'ピン留めを外す', off: 'サイドバーをピン留めする（不意に畳まれないようにする）' },
  ai: { on: 'ピン留めを外す', off: 'AIパネルをピン留めする（不意に畳まれないようにする）' },
};
// Views whose element answers the <dialog> protocol (open / showModal() / close() / 'close' event),
// because libraries.js drives its section through exactly that interface.
const DIALOG_VIEWS = { libraries: 'libraries-dialog' };
const VIEWS = ['explorer', 'libraries', 'boards'];

const clamp = (value, [min, max]) => Math.round(Math.max(min, Math.min(max, value)));

function readState() {
  const state = { ...DEFAULTS };
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (typeof saved.sidebarOpen === 'boolean') state.sidebarOpen = saved.sidebarOpen;
      // Libraries is prepared by its own module when its button is pressed, so it is never the
      // view a reload opens on; the explorer is. A stored 'settings' or 'help' is no longer a
      // view at all, so a layout saved before either became a dialog falls back to the explorer.
      if (VIEWS.includes(saved.sidebarView) && !DIALOG_VIEWS[saved.sidebarView]) state.sidebarView = saved.sidebarView;
      if (typeof saved.sidebarPinned === 'boolean') state.sidebarPinned = saved.sidebarPinned;
      if (typeof saved.aiPinned === 'boolean') state.aiPinned = saved.aiPinned;
      if (typeof saved.panelOpen === 'boolean') state.panelOpen = saved.panelOpen;
      if (typeof saved.aiOpen === 'boolean') state.aiOpen = saved.aiOpen;
      for (const key of ['sidebarWidth', 'aiWidth', 'panelHeight']) {
        if (Number.isFinite(saved[key])) state[key] = clamp(saved[key], LIMITS[key]);
      }
    }
  } catch { /* a broken layout record is replaced by the defaults; nothing else depends on it */ }
  return state;
}

export function setupLayout() {
  const state = readState();
  const shell = $('shell'), sidebar = $('sidebar'), aiPane = $('ai-pane');
  let panelResizeHandler = () => {};

  function persist() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(state)); }
    catch { /* layout is a convenience; losing it must never block editing */ }
  }

  // Which view element is currently showing, for the dialog-protocol 'close' event.
  const dialogElement = (view) => DIALOG_VIEWS[view] ? $(DIALOG_VIEWS[view]) : null;
  let shown = null;
  // A window too narrow for three columns puts the sidebar over the editor. A browsing view
  // (explorer / boards) steps aside on the way in and comes back when the window widens;
  // Libraries stays, because it is the task that replaced a modal dialog.
  let wasNarrow = null, hiddenByNarrow = null;

  // ピン留めは「不意に畳まれる」操作、つまり活動バーの同じボタンをもう一度押すこと（表示中の
  // view のボタン、AI パネルでは AI ボタン）だけを止める。明示的に閉じる操作（ライブラリの
  // 「閉じる」、AI パネルの「閉じる」、Escape）と「レイアウトを初期化」はピン留め中も効く。
  // 幅のドラッグは LIMITS の最小（320px）で止まり、もともと畳むことがないので何も足さない。
  // 狭い画面では両方とも編集画面の上に浮く。サイドバーのエクスプローラとボードには「閉じる」が
  // 無く、ピン留めを効かせると戻れなくなる。AI パネルには「閉じる」があるが、両者で読み方が
  // 変わらないよう揃えて、狭い画面では効かせず、ボタンも出さない（状態そのものは残る）。
  const pinButtons = [...document.querySelectorAll('.pin-toggle')];
  const pinActive = (target) => state[PINS[target]] && innerWidth >= NARROW;

  function render() {
    const narrow = innerWidth < NARROW;
    if (narrow !== wasNarrow) {
      if (narrow && state.sidebarOpen && !DIALOG_VIEWS[state.sidebarView]) { hiddenByNarrow = state.sidebarView; state.sidebarOpen = false; }
      else if (!narrow && hiddenByNarrow) { state.sidebarOpen = true; state.sidebarView = hiddenByNarrow; hiddenByNarrow = null; }
      wasNarrow = narrow;
    }
    shell.dataset.narrow = String(narrow);
    shell.style.setProperty('--sidebar-width', `${narrow ? Math.min(state.sidebarWidth, innerWidth - ACTIVITY) : state.sidebarWidth}px`);
    shell.style.setProperty('--ai-width', `${narrow ? Math.min(state.aiWidth, innerWidth - ACTIVITY) : state.aiWidth}px`);
    shell.style.setProperty('--panel-height', `${state.panelHeight}px`);
    sidebar.hidden = !state.sidebarOpen;
    $('sidebar-resize').hidden = !state.sidebarOpen;
    $('sidebar-resize').setAttribute('aria-valuenow', String(state.sidebarWidth));
    for (const view of VIEWS) {
      const element = document.querySelector(`.sidebar-view[data-view="${view}"]`);
      if (element) element.hidden = !(state.sidebarOpen && state.sidebarView === view);
      const button = document.querySelector(`.activity-item[data-view="${view}"]`);
      if (button) {
        const selected = state.sidebarOpen && state.sidebarView === view;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('selected', selected);
      }
    }
    for (const button of pinButtons) {
      const target = button.dataset.pin;
      const pinned = state[PINS[target]];
      button.hidden = narrow;
      button.setAttribute('aria-pressed', String(pinned));
      const label = pinned ? PIN_TITLE[target].on : PIN_TITLE[target].off;
      button.title = label;
      button.setAttribute('aria-label', label);
    }
    aiPane.hidden = !state.aiOpen;
    $('ai-resize').hidden = !state.aiOpen;
    $('ai-resize').setAttribute('aria-valuenow', String(state.aiWidth));
    $('ai-open').setAttribute('aria-expanded', String(state.aiOpen));
    $('ai-open').classList.toggle('selected', state.aiOpen);
    // A view that just stopped showing gets the 'close' its module listens for.
    const active = state.sidebarOpen ? state.sidebarView : null;
    if (shown !== active) {
      const previous = dialogElement(shown);
      shown = active;
      previous?.dispatchEvent(new Event('close'));
    }
    panelResizeHandler();
  }

  function showView(view) {
    if (!VIEWS.includes(view)) return;
    hiddenByNarrow = null;
    state.sidebarOpen = true;
    state.sidebarView = view;
    render(); persist();
  }
  function collapseSidebar() {
    hiddenByNarrow = null;
    state.sidebarOpen = false;
    render(); persist();
  }
  function toggleView(view) {
    if (state.sidebarOpen && state.sidebarView === view) { if (!pinActive('sidebar')) collapseSidebar(); }
    else showView(view);
  }
  function setPinned(target, pinned) {
    state[PINS[target]] = pinned;
    render(); persist();
  }
  function setAI(open) {
    state.aiOpen = open;
    render(); persist();
  }
  // 活動バーの AI ボタン。開いているときのもう一度の押下が「不意に畳む」経路なので、そこだけ
  // ピン留めが止める。パネル内の「閉じる」は setAI(false) を直に呼ぶので、ピン留め中も効く。
  function toggleAI() {
    if (state.aiOpen && pinActive('ai')) return;
    setAI(!state.aiOpen);
  }

  // Activity bar. AI支援 only toggles the right panel; it never changes the sidebar selection.
  for (const view of VIEWS) {
    const button = document.querySelector(`.activity-item[data-view="${view}"]`);
    if (!button) continue;
    // Libraries is opened by its own module (which prepares the inputs first), so that button
    // delegates instead of switching the view behind the module's back.
    if (view === 'libraries') continue;
    button.onclick = () => toggleView(view);
  }
  // 設定（#view-settings）とヘルプ（#view-help）のボタンはここには無い。どちらも sidebar の
  // view ではなく本物の <dialog> で、どの節から開くかを決める必要があるため、開く口は app.js が
  // 持つ。sidebar の選択状態も変えない。
  // Pressing the showing view's own button folds the sidebar away — including Libraries, whose
  // button otherwise belongs to libraries.js. Capturing on the bar keeps the click from reaching
  // that module at all, so it never re-opens what the user just closed.
  $('activity-bar').addEventListener('click', (event) => {
    const button = event.target instanceof Element && event.target.closest('.activity-item[data-view="libraries"]');
    if (!button || !state.sidebarOpen || state.sidebarView !== 'libraries') return;
    event.stopPropagation();
    event.preventDefault();
    // ピン留め中は畳まない。クリックは libraries.js にも渡さない（渡すと検索がやり直しになる）。
    if (!pinActive('sidebar')) collapseSidebar();
  }, true);

  // サイドバーのピン留めボタンは view ごとのタイトル行に3つあるが、押す先は1つの状態。
  // AI パネルのボタンは1つで、押す先は AI 側の状態。どちらを指すかは data-pin が持つ。
  for (const button of pinButtons) {
    const target = button.dataset.pin;
    button.onclick = () => setPinned(target, !state[PINS[target]]);
  }

  // The <dialog> protocol the sidebar's Libraries view answers to.
  for (const [view, id] of Object.entries(DIALOG_VIEWS)) {
    const element = $(id);
    Object.defineProperty(element, 'open', { get: () => state.sidebarOpen && state.sidebarView === view, configurable: true });
    element.showModal = () => showView(view);
    element.close = () => { if (state.sidebarOpen && state.sidebarView === view) collapseSidebar(); };
  }

  // Escape closes the sidebar, the way the dialog it replaces used to close. The editor, the AI
  // panel and the remaining real dialogs keep their own Escape handling.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || !state.sidebarOpen) return;
    if (!DIALOG_VIEWS[state.sidebarView]) return; // only the view that replaced a modal dialog
    const target = event.target;
    if (!(target instanceof Element)) { collapseSidebar(); return; }
    if (target.closest('#editor') || target.closest('#ai-pane') || target.closest('dialog')) return;
    if (!target.closest('#sidebar') && target !== document.body) return;
    collapseSidebar();
  });

  // Drag / keyboard resizers. Widths are stored as the user set them; the narrow layout only
  // caps what is rendered, so going back to a wide window restores the chosen width.
  function dragHandle(handle, read, write, step, direction) {
    handle.onkeydown = (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') write(-Infinity);
      else if (event.key === 'End') write(Infinity);
      else write(read() + direction * (event.key === 'ArrowLeft' ? -step : step));
    };
    let drag;
    handle.onpointerdown = (event) => {
      if (event.button !== 0) return;
      drag = { x: event.clientX, start: read() };
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
      handle.focus();
    };
    handle.onpointermove = (event) => { if (drag) write(drag.start + direction * (event.clientX - drag.x)); };
    handle.onpointerup = handle.onpointercancel = () => { drag = undefined; };
  }
  // The sidebar grows when its handle is dragged right; the AI panel, being on the right, grows
  // when its handle is dragged left.
  dragHandle($('sidebar-resize'), () => state.sidebarWidth,
    (next) => { state.sidebarWidth = clamp(next, LIMITS.sidebarWidth); render(); persist(); }, 24, 1);
  dragHandle($('ai-resize'), () => state.aiWidth,
    (next) => { state.aiWidth = clamp(next, LIMITS.aiWidth); render(); persist(); }, 24, -1);

  addEventListener('resize', render);
  render();

  return {
    showView, collapseSidebar, toggleView, setAI, toggleAI,
    get aiOpen() { return state.aiOpen; },
    get sidebarOpen() { return state.sidebarOpen; },
    get sidebarView() { return state.sidebarView; },
    get panelOpen() { return state.panelOpen; },
    set panelOpen(open) { state.panelOpen = open; persist(); },
    get panelHeight() { return state.panelHeight; },
    set panelHeight(height) { state.panelHeight = clamp(height, LIMITS.panelHeight); shell.style.setProperty('--panel-height', `${state.panelHeight}px`); persist(); },
    onResize(handler) { panelResizeHandler = handler; },
    reset() {
      Object.assign(state, DEFAULTS);
      hiddenByNarrow = null;
      render(); persist();
    },
  };
}
