import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/editor/editor.all.js';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js';
import './app.css';
import './serial.js';
import { setupLibraries } from './libraries.js';
import { setupAI } from './ai.js';
import { setupUI } from './ui.js';
import { openProjects, makeProject, validName, parseProject, MAX_FILE } from './projects.js';

self.MonacoEnvironment = {
  getWorker() { return new Worker('/assets/editor.worker.js', { type: 'module' }); },
};

const $ = (id) => document.getElementById(id);
const ui = setupUI(monaco);
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
  $('save-status').dataset.error = String(error);
  $('save-retry').hidden = !error;
  $('project-save-message').textContent = error ? message : '';
}

const store = await openProjects(HELLO, saveStatus);
$('env').value = store.current.env;
const editor = monaco.editor.create($('editor'), {
  value: store.current.source,
  language: 'cpp',
  automaticLayout: true,
  fontSize: 14,
  lineHeight: 23,
  fontFamily: 'SFMono-Regular, Menlo, Consolas, monospace',
  padding: { top: 18, bottom: 18 },
  smoothScrolling: false,
  cursorBlinking: 'solid',
  lineNumbers: 'on',
  autoIndent: 'full',
  tabSize: 2,
  insertSpaces: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  ariaLabel: 'main.cpp コードエディタ',
});

editor.onDidChangeCursorPosition(({ position }) => {
  $('cursor-position').textContent = `行 ${position.lineNumber}、列 ${position.column}`;
});

let revision = 0;
let building = false;
let ai;
let lastBuildFailure = null;
let downloadUrl;
function invalidateDownload() {
  $('download').hidden = true;
  $('download').removeAttribute('href');
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = undefined;
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
$('env').addEventListener('change', changed);
$('build').disabled = false;
$('status').textContent = 'Buildできます';

$('build').onclick = async () => {
  if (building) return;
  building = true;
  lastBuildFailure = null;
  ui.setBuildState('building');
  ui.openPanel('build');
  $('build').disabled = true;
  invalidateDownload();
  const snapshot = { projectId: store.current.id, name: store.current.name, source: editor.getValue(), env: $('env').value, libraries: structuredClone(store.current.libraries), revision, projectRevision: store.current.revision };
  const sameProject = () => store.current.id === snapshot.projectId && revision === snapshot.revision;
  const obsolete = () => {
    ui.setBuildState('changed');
    $('status').textContent = `「${snapshot.name}」の以前の内容のBuild結果です。現在の内容で再Buildしてください`;
    $('log').textContent = `対象: ${snapshot.name} / ${snapshot.projectId} / ${snapshot.env} / revision ${snapshot.projectRevision}。切り替え・編集されたため成果物は破棄しました。`;
  };
  $('status').textContent = 'Build中…';
  $('log').textContent = '';
  const t0 = performance.now();
  try {
    const res = await fetch('/compile', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: snapshot.source, env: snapshot.env, libraries: snapshot.libraries, projectId: snapshot.projectId, projectRevision: snapshot.projectRevision }),
    });
    if (res.ok) {
      const blob = await res.blob();
      if (!sameProject()) { obsolete(); return; }
      ui.setBuildState('success');
      downloadUrl = URL.createObjectURL(blob);
      const a = $('download');
      a.href = downloadUrl;
      const extension = snapshot.env === 'xiao_esp32c3' ? 'zip' : 'uf2';
      a.download = `firmware-${snapshot.env}.${extension}`;
      a.textContent = extension === 'zip' ? '↓ BINセット ダウンロード' : '↓ UF2 ダウンロード';
      a.hidden = false;
      $('status').textContent = `Build成功：${blob.size} bytes（${((performance.now() - t0) / 1000).toFixed(1)}秒）`;
      $('log').textContent = `対象: ${snapshot.name} / ${snapshot.projectId} / revision ${snapshot.projectRevision}\nbuild OK: ${snapshot.env}, ${blob.size} bytes (${res.headers.get('x-compile-duration-ms')} ms on server)`;
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
  }
};

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
      if (p.id === store.current.id) { $('projects-dialog').close(); return; }
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
  switching = false;
  revision++;
  lastBuildFailure = null;
  invalidateDownload();
  ui.setBuildState(building ? 'building' : 'ready');
  $('status').textContent = building ? '以前のプロジェクトをBuild中です' : 'Buildできます';
  $('log').textContent = '';
  renderProjects();
  $('projects-dialog').close();
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
$('project-open-list').onclick = () => { renderProjects(); $('projects-dialog').showModal(); };
for (const id of ['projects-dialog', 'name-dialog']) {
  $(id).addEventListener('close', () => {
    if (document.activeElement === document.body || document.activeElement === menuButton) menuButton.focus();
  });
}
$('projects-close').onclick = () => $('projects-dialog').close();
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

setupLibraries(store, libraries => { store.current.libraries = libraries; changed(); });

function aiSnapshot() {
  const model = editor.getModel();
  return { projectId: store.current.id, projectRevision: store.current.revision, revision,
    modelIdentity: model, modelVersion: model.getVersionId(), source: editor.getValue(),
    env: $('env').value, libraries: structuredClone(store.current.libraries) };
}
function matchesAI(s) {
  const now = aiSnapshot();
  return ['projectId', 'projectRevision', 'revision', 'modelIdentity', 'modelVersion', 'source', 'env'].every(key => now[key] === s[key])
    && JSON.stringify(now.libraries) === JSON.stringify(s.libraries);
}
ai = setupAI(monaco, {
  snapshot: aiSnapshot, matches: matchesAI, dirty: () => store.dirty,
  failure: s => lastBuildFailure && lastBuildFailure.projectId === s.projectId && lastBuildFailure.revision === s.revision && lastBuildFailure.projectRevision === s.projectRevision ? lastBuildFailure : null,
  apply: source => {
    editor.pushUndoStop();
    editor.executeEdits('ai-main-cpp', [{ range: editor.getModel().getFullModelRange(), text: source, forceMoveMarkers: true }]);
    editor.pushUndoStop();
  },
});
