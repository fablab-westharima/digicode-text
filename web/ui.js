const $ = (id) => document.getElementById(id);

export function setupUI(monaco) {
  monaco.editor.defineTheme('digicode-dark', {
    base: 'vs-dark', inherit: true, rules: [], colors: {
      'editor.background': '#17212C', 'editor.foreground': '#DBE5EF',
      'editorLineNumber.foreground': '#718396', 'editorLineNumber.activeForeground': '#52D6B8',
      'editor.lineHighlightBackground': '#1D2936', 'editor.lineHighlightBorder': '#1D2936',
      'editor.selectionBackground': '#28534E', 'editorCursor.foreground': '#52D6B8',
    },
  });
  monaco.editor.setTheme('digicode-dark');

  let panelOpen = false;
  let activeTab = 'build';
  let height = 230;
  function resize(next = height) {
    const reserved = document.querySelector('.toolbar').offsetHeight
      + document.querySelector('.file-header').offsetHeight
      + document.querySelector('.status-bar').offsetHeight + 130;
    const max = Math.max(100, Math.min(innerHeight * .6, innerHeight - reserved));
    height = Math.round(Math.max(100, Math.min(next, max)));
    $('panel-body').style.setProperty('--panel-height', `${height}px`);
    $('panel-resize').setAttribute('aria-valuemax', String(Math.round(max)));
    $('panel-resize').setAttribute('aria-valuenow', String(height));
  }
  function setOpen(open) {
    panelOpen = open;
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
  $('panel-toggle').onclick = () => setOpen(!panelOpen);
  const handle = $('panel-resize');
  handle.onkeydown = e => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    resize(e.key === 'Home' ? 100 : e.key === 'End' ? innerHeight : height + (e.key === 'ArrowUp' ? 24 : -24));
  };
  let drag;
  handle.onpointerdown = e => {
    if (e.button !== 0) return;
    drag = { y: e.clientY, height };
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
    handle.focus();
  };
  handle.onpointermove = e => { if (drag) resize(drag.height + drag.y - e.clientY); };
  handle.onpointerup = handle.onpointercancel = () => { drag = undefined; };
  window.addEventListener('resize', () => resize());
  resize();

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
    setBuildState(state) {
      $('build-phase').dataset.state = state;
      $('build-phase').textContent = { ready: '待機', changed: '未Build', building: '実行中', success: '✓ 成功', error: '! 失敗' }[state];
      $('status').dataset.state = state;
      $('build').innerHTML = state === 'building' ? '<span aria-hidden="true">◷</span> Build中' : '<span aria-hidden="true">▷</span> Build';
    },
  };
}
