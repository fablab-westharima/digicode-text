import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/editor/editor.all.js';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js';
import './app.css';
import { monitorPort, disconnectForFlash } from './serial.js';
import { setupPlotter } from './plotter.js';
import { parseFlashSet, flashEsp, flashUf2, ESP_VENDOR_IDS } from './flash.js';
import { setupFlashGuide } from './flash-guide.js';
import { setupLibraries } from './libraries.js';
import { incompatibleDependencies } from './library-incompat.js';
import { setupAI } from './ai.js';
import { setupUI } from './ui.js';
import { setupLayout } from './layout.js';
import { setupThemes, THEMES } from './themes/duotone.js';
import { renderBoardFacts } from './boards.js';
import { openProjects, makeProject, validName, parseProject, setBoards, MAX_FILE } from './projects.js';

self.MonacoEnvironment = {
  getWorker() { return new Worker('/assets/editor.worker.js', { type: 'module' }); },
};

const $ = (id) => document.getElementById(id);
const layout = setupLayout();
const themes = setupThemes(monaco);
const ui = setupUI(layout);
setupPlotter(); // 出力パネルのプロッタタブ。シリアルモニタの受信テキストを自分で受け取る。
const HELLO = `#include <Arduino.h>

void setup() {
  Serial.begin(115200);
}

void loop() {
  Serial.println("hello");
  delay(1000);
}
`;
function saveStatus(message, error = false) {
  $('save-status').textContent = `このブラウザに自動保存：${message}`;
  $('save-status').title = message;
  $('save-status').dataset.error = String(error);
  $('save-retry').hidden = !error;
  $('project-save-message').textContent = error ? message : '';
}

// Appearance and layout controls live in the Settings view, next to the API settings.
$('theme-select').replaceChildren(...THEMES.map(t => new Option(t.name, t.id)));
$('theme-select').value = themes.current;
$('theme-select').onchange = () => themes.apply($('theme-select').value, { save: true });
$('layout-reset').onclick = () => { layout.reset(); ui.applyPanel(); $('theme-select').focus(); };

// The compiler's board table is the only board list: select options, project validation
// and the AI's boardDetails are generated from it.
const boardsRes = await fetch('/boards');
if (!boardsRes.ok) throw new Error('ボード一覧を取得できません');
const BOARDS = new Map((await boardsRes.json()).map(b => [b.id, b]));
setBoards(BOARDS.keys());
$('env').replaceChildren(...[...BOARDS.values()].map(b => Object.assign(document.createElement('option'), { value: b.id, textContent: b.name })));
// ヘルプの対応ボードもボード表から書く。ボード一覧を手で書く場所はどこにも作らない。
$('help-boards').textContent = [...BOARDS.values()].map(b => b.name).join(' / ');
// 書き込み前の接続手順。手順文と図の指定は各ボードの /boards の項目にある。
const flashGuide = setupFlashGuide();
const showFlashGuide = () => flashGuide.show(BOARDS.get($('env').value));
$('flash-guide-open').onclick = showFlashGuide;
$('help-flash-guide').onclick = showFlashGuide;
// 設定から、ボードごとに保存した「次回から表示しない」をまとめて解除する。
$('flash-guide-reset').onclick = () => flashGuide.resetSkipped();
const store = await openProjects(HELLO, saveStatus);
$('env').value = store.current.env;
const editor = monaco.editor.create($('editor'), {
  value: store.current.source,
  language: 'cpp',
  automaticLayout: true,
  fontSize: 13,
  lineHeight: 20,
  fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
  padding: { top: 12, bottom: 12 },
  smoothScrolling: false,
  cursorBlinking: 'solid',
  lineNumbers: 'on',
  autoIndent: 'full',
  tabSize: 2,
  insertSpaces: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'all',
  ariaLabel: 'main.cpp コードエディタ',
});

editor.onDidChangeCursorPosition(({ position }) => {
  $('cursor-position').textContent = `行 ${position.lineNumber}、列 ${position.column}`;
});

// One tab today, drawn from a list so a second file only needs another entry.
const TABS = [{ id: 'main.cpp', label: 'main.cpp', kind: 'C++', labelId: 'editor-label' }];
function renderTabs(activeId = TABS[0].id) {
  $('tab-strip').replaceChildren(...TABS.map(tab => {
    const button = document.createElement('button');
    button.className = 'tab';
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(tab.id === activeId));
    const kind = document.createElement('span');
    kind.className = 'file-kind'; kind.textContent = tab.kind; kind.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    if (tab.labelId) label.id = tab.labelId;
    label.textContent = tab.label;
    button.append(kind, label);
    button.onclick = () => editor.focus();
    return button;
  }));
}
renderTabs();
$('file-main').onclick = () => editor.focus();

function showBoard() {
  const board = BOARDS.get($('env').value);
  renderBoardFacts(board);
  $('status-board').textContent = board?.name ?? '';
  $('status-board').title = `ボード: ${board?.name ?? ''}`;
}
$('status-board').onclick = () => layout.showView('boards');

// The status bar mirrors what the Serial panel and the AI panel already say, so those modules
// keep owning their own text and nothing here duplicates their logic.
function mirror(from, to, format) {
  const update = () => { $(to).textContent = format($(from).textContent); };
  new MutationObserver(update).observe($(from), { childList: true, characterData: true, subtree: true });
  update();
}
mirror('serial-status', 'status-serial', text => `Serial: ${text}`);
mirror('ai-connection', 'status-model', text => text);

let revision = 0;
let building = false;
let ai;
let libs;
let lastBuildFailure = null;
let downloadUrl;
let flashSet = null; // ESP flash set of the last successful build; cleared with the download on any edit
let uf2 = null; // UF2 bytes of the last successful build, for writing to the BOOTSEL drive
let flashing = false;
function invalidateDownload() {
  $('download').hidden = true;
  $('download').removeAttribute('href');
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = undefined;
  flashSet = null;
  uf2 = null;
  $('flash').hidden = true;
  $('flash').disabled = true;
  $('build-incompat').textContent = '';
  $('build-incompat').hidden = true;
}
// 「ビルド結果」がまだ空のときの1行。Buildを始めると消え、ログが空に戻ると出る。
const buildEmpty = (show) => { $('build-empty').hidden = !show; };
function flashStatus(message, state = '') {
  $('flash-status').textContent = message;
  $('flash-status').dataset.state = state;
  $('flash-status').hidden = !message;
}
let switching = false;
function changed() {
  if (switching) return;
  revision++;
  lastBuildFailure = null;
  ui.setBuildState(building ? 'building' : 'changed');
  invalidateDownload();
  $('status').textContent = building
    ? 'Build中に編集されました。完了後に再Buildしてください'
    : '変更あり：Buildしてください';
  store.edit(editor.getValue(), $('env').value);
  renderProjects();
  ai?.changed();
}
editor.onDidChangeModelContent(changed);
$('env').addEventListener('change', () => { showBoard(); changed(); libs?.boardChanged(); });
$('build').disabled = false;
$('status').textContent = 'Buildできます';

$('build').onclick = async () => {
  if (building) return;
  building = true;
  lastBuildFailure = null;
  ai?.buildChanged();
  ui.setBuildState('building');
  ui.openPanel('build');
  $('build').disabled = true;
  invalidateDownload();
  const snapshot = { projectId: store.current.id, name: store.current.name, source: editor.getValue(), env: $('env').value, libraries: structuredClone(store.current.libraries), revision, projectRevision: store.current.revision };
  // What the compiler's table says about this board and these dependencies. It is evidence from
  // the harness, not a check on this build, so the Build goes ahead and reports whatever happens.
  const board = BOARDS.get(snapshot.env);
  const unusable = incompatibleDependencies(board, snapshot.libraries);
  $('build-incompat').textContent = unusable.map(r => `${r.library} は ${board.name} で使えません: ${r.reason}。代替: ${r.alternative}`).join('\n');
  $('build-incompat').hidden = !unusable.length;
  const sameProject = () => store.current.id === snapshot.projectId && revision === snapshot.revision;
  const obsolete = () => {
    ui.setBuildState('changed');
    $('status').textContent = `「${snapshot.name}」の以前の内容のBuild結果です。現在の内容で再Buildしてください`;
    $('log').textContent = `対象: ${snapshot.name} / ${snapshot.projectId} / ${snapshot.env} / revision ${snapshot.projectRevision}。切り替え・編集されたため成果物は破棄しました。`;
  };
  $('status').textContent = 'Build中…';
  $('log').textContent = '';
  buildEmpty(false);
  const t0 = performance.now();
  try {
    const res = await fetch('/compile', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: snapshot.source, env: snapshot.env, libraries: snapshot.libraries, projectId: snapshot.projectId, projectRevision: snapshot.projectRevision }),
    });
    if (res.ok) {
      let size, summary;
      if (BOARDS.get(snapshot.env).artifact === 'flashset') {
        // ESP family: the server returns the build's flash set; the browser flashes it via esptool-js.
        const set = parseFlashSet(await res.json());
        if (!sameProject()) { obsolete(); return; }
        flashSet = set;
        size = set.images.reduce((n, i) => n + i.data.length, 0);
        summary = set.images.map(i => `${i.file} @ 0x${i.address.toString(16)} (${i.data.length} bytes)`).join(', ');
        $('flash').hidden = false;
        $('flash').disabled = false;
        flashStatus('');
      } else {
        const blob = await res.blob();
        const bytes = new Uint8Array(await blob.arrayBuffer()); // read here so the flash click can stay synchronous
        if (!sameProject()) { obsolete(); return; }
        downloadUrl = URL.createObjectURL(blob);
        const a = $('download');
        a.href = downloadUrl;
        a.download = `firmware-${snapshot.env}.uf2`;
        a.textContent = '↓ UF2 ダウンロード';
        a.hidden = false;
        uf2 = bytes;
        $('flash').hidden = false;
        $('flash').disabled = false;
        flashStatus('');
        size = blob.size;
        summary = `${size} bytes`;
      }
      ui.setBuildState('success');
      $('status').textContent = `Build成功：${size} bytes（${((performance.now() - t0) / 1000).toFixed(1)}秒）`;
      $('log').textContent = `対象: ${snapshot.name} / ${snapshot.projectId} / revision ${snapshot.projectRevision}\nbuild OK: ${snapshot.env}, ${summary} (${res.headers.get('x-compile-duration-ms')} ms on server)`;
    } else {
      const j = await res.json().catch(() => ({}));
      if (!sameProject()) { obsolete(); return; }
      ui.setBuildState('error');
      ui.openPanel('build');
      $('status').textContent = `Build失敗（${res.status}）${revision !== snapshot.revision ? '：編集前のコードの結果です' : ''}`;
      $('log').textContent = `対象: ${snapshot.name} / ${snapshot.projectId} / ${snapshot.env} / revision ${snapshot.projectRevision}\n` + ([j.error, j.log].filter(Boolean).join('\n') || 'エラー内容を取得できませんでした');
      lastBuildFailure = { ...snapshot, stage: j.stage === 'dependencies' ? 'dependencies' : j.stage === 'compile' ? 'compile' : 'request', log: $('log').textContent.slice(0, 24000) };
      // Bring the first compiler diagnostic into view, past PlatformIO's preamble.
      const errorLine = $('log').textContent.split('\n').findIndex(line => /(?:fatal )?error:/i.test(line));
      $('log').scrollTop = Math.max(0, errorLine - 2) * parseFloat(getComputedStyle($('log')).lineHeight);
    }
  } catch (e) {
    if (!sameProject()) { obsolete(); return; }
    ui.setBuildState('error');
    ui.openPanel('build');
    $('status').textContent = 'Build通信に失敗しました。再実行できます';
    $('log').textContent = String(e);
    lastBuildFailure = { ...snapshot, stage: 'network', log: 'ローカルBuildサーバーとの通信に失敗しました' };
  } finally {
    building = false;
    $('build').disabled = false;
    ai?.buildChanged();
  }
};

// Flash the last build: ESP boards through esptool-js, RP2040 boards by writing the UF2 to the
// BOOTSEL drive the user picks. Disabled again by any edit (invalidateDownload). Not async:
// showDirectoryPicker needs this click's user gesture, so nothing may be awaited before it.
// The connection guide runs first: it either calls startFlash straight away (this board is set to
// skip it) or from its own OK click, which is a user gesture again. flash.js itself is untouched.
$('flash').onclick = () => {
  if (flashing || !(flashSet || uf2)) return;
  flashGuide.confirm(BOARDS.get($('env').value), startFlash);
};
function startFlash() {
  if (flashing || !(flashSet || uf2)) return;
  flashing = true;
  const set = flashSet, image = uf2;
  $('flash').disabled = true;
  $('build').disabled = true;
  ui.openPanel('build');
  const report = ({ stage, percent, message }) => flashStatus(percent === null ? message : `書き込み ${percent}%：${message}`, stage);
  // ESP系は書き込みもモニタも同じポートを使う。モニタが持っているポートがあれば選択なしでそれへ書き、
  // 開いていれば先に切断を待つ（黙って切れたように見えないようビルド結果とシリアルタブに1行ずつ）。
  // 書き込み後は自動でつながない。ブラウザがポートを握ると PlatformIO monitor などが開けなくなる。
  // window.__flashEsp はテスト専用の差し替え口（esptool-js の成功経路はモックのポートでは通せない）。
  const esp = async () => {
    const held = monitorPort(ESP_VENDOR_IDS);
    const buildLog = $('log');
    if (await disconnectForFlash()) buildLog.textContent += (buildLog.textContent && !buildLog.textContent.endsWith('\n') ? '\n' : '') + 'シリアルを切断して書き込みます\n';
    await (window.__flashEsp ?? flashEsp)(set, report, held);
  };
  (set ? esp() : flashUf2(image, report))
    .catch(error => flashStatus(String(error?.message ?? error), 'error'))
    .finally(() => {
      flashing = false;
      $('build').disabled = building;
      $('flash').disabled = set ? flashSet !== set : uf2 !== image; // keep enabled unless the build was invalidated meanwhile
    });
}

function renderProjects() {
  $('project-name').textContent = store.current.name;
  $('project-name').title = store.current.name;
  $('project-target').textContent = store.current.name;
  const list = $('project-list');
  list.replaceChildren();
  for (const p of [...store.data.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    const button = document.createElement('button');
    button.className = 'project-item';
    button.setAttribute('aria-current', String(p.id === store.current.id));
    const name = document.createElement('span');
    name.textContent = p.name;
    const date = document.createElement('small');
    date.textContent = `${p.id === store.current.id ? '編集中 · ' : ''}${new Date(p.updatedAt).toLocaleString('ja-JP')}`;
    button.append(name, date);
    button.onclick = () => {
      if (p.id === store.current.id) return;
      if (store.transact(data => { data.activeId = p.id; })) activate();
    };
    list.append(button);
  }
}
function activate() {
  switching = true;
  const previous = editor.getModel();
  editor.setModel(monaco.editor.createModel(store.current.source, 'cpp'));
  previous.dispose();
  $('env').value = store.current.env;
  showBoard();
  switching = false;
  revision++;
  lastBuildFailure = null;
  invalidateDownload();
  ui.setBuildState(building ? 'building' : 'ready');
  $('status').textContent = building ? '以前のプロジェクトをBuild中です' : 'Buildできます';
  $('log').textContent = '';
  buildEmpty(!building);
  renderProjects();
  editor.focus();
  ai?.changed();
}
let nameAction;
function askName(action, title, value) {
  nameAction = action;
  $('name-title').textContent = title;
  $('name-input').value = value;
  $('name-error').textContent = '';
  $('name-dialog').showModal();
  $('name-input').focus(); $('name-input').select();
}
const menu = $('file-menu');
const menuButton = $('projects-open');
const menuItems = [...menu.querySelectorAll('[role="menuitem"]')];
function closeMenu(returnFocus = true) {
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  if (returnFocus) menuButton.focus();
}
function positionMenu() {
  const rect = menuButton.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - menu.offsetWidth - 8))}px`;
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.maxHeight = `${Math.max(40, innerHeight - rect.bottom - 12)}px`;
}
function openMenu(last = false) {
  menu.hidden = false;
  menuButton.setAttribute('aria-expanded', 'true');
  positionMenu();
  menuItems[last ? menuItems.length - 1 : 0].focus();
}
menuButton.onclick = () => menu.hidden ? openMenu() : closeMenu();
menuButton.onkeydown = event => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault(); openMenu(event.key === 'ArrowUp');
  }
};
menu.onkeydown = event => {
  const index = menuItems.indexOf(document.activeElement);
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? menuItems.length - 1 :
      (index + (event.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length;
    menuItems[next].focus();
  } else if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
  else if (event.key === 'Tab') closeMenu();
};
// Close before a chosen action opens its dialog, so that focus returns to the trigger.
menu.addEventListener('click', event => {
  if (event.target.closest('[role="menuitem"]')) closeMenu();
}, true);
document.addEventListener('click', event => {
  if (!menu.hidden && !menu.contains(event.target) && !menuButton.contains(event.target)) {
    closeMenu(document.activeElement === document.body || menu.contains(document.activeElement));
  }
});
document.addEventListener('focusin', event => {
  if (!menu.hidden && !menu.contains(event.target) && event.target !== menuButton) closeMenu(false);
});
window.addEventListener('resize', () => { if (!menu.hidden) positionMenu(); });
$('project-open-list').onclick = () => { renderProjects(); layout.showView('explorer'); $('project-list').querySelector('.project-item')?.focus(); };
$('name-dialog').addEventListener('close', () => {
  if (document.activeElement === document.body || document.activeElement === menuButton) menuButton.focus();
});
$('name-cancel').onclick = () => $('name-dialog').close();
$('project-new').onclick = () => askName('new', '新しいプロジェクト', '新しいプロジェクト');
$('project-rename').onclick = () => askName('rename', '名前を変更', store.current.name);
$('project-duplicate').onclick = () => askName('duplicate', 'プロジェクトを複製', [...store.current.name].slice(0, 75).join('') + ' のコピー');
$('name-form').onsubmit = event => {
  event.preventDefault();
  try {
    const name = validName($('name-input').value);
    const ok = store.transact(data => {
      if (nameAction === 'rename') {
        store.current.name = name; store.current.updatedAt = new Date().toISOString();
      } else {
        const p = makeProject(name, nameAction === 'new' ? HELLO : store.current.source, nameAction === 'new' ? 'xiao_rp2040' : store.current.env, nameAction === 'new' ? [] : store.current.libraries);
        data.projects.push(p); data.activeId = p.id;
      }
    });
    if (!ok) { $('name-error').textContent = '保存できないため操作を止めました。現在の編集を書き出して退避してください。'; return; }
    $('name-dialog').close();
    if (nameAction === 'rename') renderProjects(); else activate();
  } catch (error) { $('name-error').textContent = error.message; }
};
$('project-delete').onclick = () => {
  if (!confirm(`「${store.current.name}」を削除しますか？この操作は元に戻せません。`)) return;
  if (store.transact(data => {
    data.projects = data.projects.filter(p => p.id !== data.activeId);
    if (!data.projects.length) data.projects.push(makeProject('はじめてのプロジェクト', HELLO));
    data.activeId = data.projects[0].id;
  })) activate();
};
$('project-export').onclick = () => {
  const p = store.current;
  const blob = new Blob([JSON.stringify({ format: 'digicode-text-project', version: 1, name: p.name, source: editor.getValue(), env: $('env').value, libraries: p.libraries }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = p.name.replace(/[\/:*?"<>|\x00-\x1f]/g, '_') + '.digicode.json';
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('project-import').onclick = () => $('project-file').click();
$('project-file').onchange = async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > MAX_FILE) throw new Error('JSONファイルは2 MiB以内にしてください');
    const value = parseProject(await file.text());
    if (store.transact(data => {
      const p = makeProject(value.name, value.source, value.env, value.libraries);
      data.projects.push(p); data.activeId = p.id;
    })) { activate(); $('project-notice').textContent = '新しいプロジェクトとして読み込みました'; }
    else $('project-notice').textContent = '保存できないため読み込みを止めました。現在の編集を書き出して退避してください';
  } catch (error) { $('project-notice').textContent = error.message; }
};
$('save-retry').onclick = () => store.save();
renderProjects();
showBoard();

libs = setupLibraries(store, libraries => { store.current.libraries = libraries; changed(); }, BOARDS);

function aiSnapshot() {
  const model = editor.getModel();
  return { projectId: store.current.id, projectRevision: store.current.revision, revision,
    modelIdentity: model, modelVersion: model.getVersionId(), source: editor.getValue(),
    env: $('env').value, board: BOARDS.get($('env').value), libraries: structuredClone(store.current.libraries) };
}
function matchesAI(s) {
  const now = aiSnapshot();
  return ['projectId', 'projectRevision', 'revision', 'modelIdentity', 'modelVersion', 'source', 'env'].every(key => now[key] === s[key])
    && JSON.stringify(now.libraries) === JSON.stringify(s.libraries);
}
ai = setupAI(monaco, {
  snapshot: aiSnapshot, matches: matchesAI, dirty: () => store.dirty,
  toggleAI: () => layout.toggleAI(),
  setAI: (open) => layout.setAI(open),
  failure: s => lastBuildFailure && lastBuildFailure.projectId === s.projectId && lastBuildFailure.revision === s.revision && lastBuildFailure.projectRevision === s.projectRevision ? lastBuildFailure : null,
  apply: source => {
    editor.pushUndoStop();
    editor.executeEdits('ai-main-cpp', [{ range: editor.getModel().getFullModelRange(), text: source, forceMoveMarkers: true }]);
    editor.pushUndoStop();
  },
});
