const $ = (id) => document.getElementById(id);

const PHASE = { ready: '待機', changed: '未Build', building: '実行中', success: '✓ 成功', error: '! 失敗' };

// The output panel lives inside the editor column, so opening it never narrows the editor and the
// AI panel keeps its own full height. Height, open state and the active tab are owned here; the
// persisted numbers live in layout.js.
export function setupUI(layout) {
  let activeTab = 'build';

  function resize(next = layout.panelHeight) {
    const column = $('editor-column').clientHeight;
    const max = Math.max(100, Math.min(innerHeight * 0.6, column - 35 - 35 - 80));
    layout.panelHeight = Math.max(100, Math.min(next, max));
    $('panel-resize').setAttribute('aria-valuemax', String(Math.round(max)));
    $('panel-resize').setAttribute('aria-valuenow', String(layout.panelHeight));
  }
  function setOpen(open) {
    layout.panelOpen = open;
    $('panel').dataset.open = String(open);
    $('panel-body').hidden = !open;
    $('panel-resize').hidden = !open;
    $('panel-toggle').setAttribute('aria-expanded', String(open));
    $('panel-toggle').textContent = open ? '閉じる ⌄' : '開く ⌃';
    resize();
  }
  function openPanel(tab = activeTab) {
    activeTab = tab;
    for (const name of ['build', 'serial']) {
      $(name + '-tab').setAttribute('aria-selected', String(name === tab));
      $(name + '-tab').tabIndex = name === tab ? 0 : -1;
      $(name + '-output').hidden = name !== tab;
    }
    setOpen(true);
  }
  for (const name of ['build', 'serial']) {
    $(name + '-tab').onclick = () => openPanel(name);
    $(name + '-tab').onkeydown = e => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const tab = e.key === 'Home' ? 'build' : e.key === 'End' ? 'serial' : name === 'build' ? 'serial' : 'build';
      openPanel(tab);
      $(tab + '-tab').focus();
    };
  }
  $('panel-toggle').onclick = () => setOpen(!layout.panelOpen);

  const handle = $('panel-resize');
  handle.onkeydown = e => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    resize(e.key === 'Home' ? 100 : e.key === 'End' ? innerHeight : layout.panelHeight + (e.key === 'ArrowUp' ? 24 : -24));
  };
  let drag;
  handle.onpointerdown = e => {
    if (e.button !== 0) return;
    drag = { y: e.clientY, height: layout.panelHeight };
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
    handle.focus();
  };
  handle.onpointermove = e => { if (drag) resize(drag.height + drag.y - e.clientY); };
  handle.onpointerup = handle.onpointercancel = () => { drag = undefined; };
  layout.onResize(() => resize());
  addEventListener('resize', () => resize());
  setOpen(layout.panelOpen);

  for (const name of ['build', 'serial']) {
    $(`copy-${name}`).onclick = async () => {
      const output = $(name === 'build' ? 'log' : 'serial-log');
      try {
        await navigator.clipboard.writeText(output.textContent);
        $('ui-notice').textContent = 'ログをコピーしました';
      } catch {
        const selection = getSelection();
        const range = document.createRange();
        range.selectNodeContents(output);
        selection.removeAllRanges(); selection.addRange(range);
        $('ui-notice').textContent = 'ログを選択しました。⌘C / Ctrl+Cでコピーできます';
      }
    };
  }
  return {
    openPanel,
    applyPanel: () => setOpen(layout.panelOpen),
    setBuildState(state) {
      $('build-phase').dataset.state = state;
      $('build-phase').textContent = PHASE[state];
      $('status').dataset.state = state;
      $('status-build').dataset.state = state;
      $('status-build').textContent = `Build: ${PHASE[state]}`;
      $('build').innerHTML = state === 'building' ? '<span aria-hidden="true">◷</span> Build中' : '<span aria-hidden="true">▷</span> Build';
    },
  };
}
