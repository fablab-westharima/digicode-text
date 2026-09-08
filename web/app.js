import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/editor/editor.all.js';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js';
import './app.css';
import './serial.js';
import { setupUI } from './ui.js';

self.MonacoEnvironment = {
  getWorker() { return new Worker('/assets/editor.worker.js', { type: 'module' }); },
};

const $ = (id) => document.getElementById(id);
const ui = setupUI(monaco);
const STORAGE_KEY = 'digicode-text.draft.v1';
const ENVS = new Set(['xiao_rp2040', 'pico']);
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
}

// Restore before creating the model or registering change listeners. Empty is valid.
let draft = { source: HELLO, env: 'xiao_rp2040' };
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== null) {
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1 || typeof saved.source !== 'string' || !ENVS.has(saved.env)) {
      throw new Error('invalid draft');
    }
    draft = saved;
    saveStatus('保存内容を復元しました');
  } else {
    saveStatus('未保存（編集すると保存します）');
  }
} catch {
  saveStatus('保存内容を読み込めません。編集・Buildは利用できます', true);
}
$('env').value = draft.env;
const editor = monaco.editor.create($('editor'), {
  value: draft.source,
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
let downloadUrl;
function invalidateDownload() {
  $('download').hidden = true;
  $('download').removeAttribute('href');
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = undefined;
}
function changed() {
  revision++;
  ui.setBuildState(building ? 'building' : 'changed');
  invalidateDownload();
  $('status').textContent = building
    ? 'Build中に編集されました。完了後に再Buildしてください'
    : '変更あり：Buildしてください';
  try {
    // Single-file drafts are small: save synchronously on every edit, including empty.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1, source: editor.getValue(), env: $('env').value,
    }));
    saveStatus('保存済み');
  } catch {
    saveStatus('保存できません（容量・ブラウザ設定）。編集・Buildは利用できます', true);
  }
}
editor.onDidChangeModelContent(changed);
$('env').addEventListener('change', changed);
$('build').disabled = false;
$('status').textContent = 'Buildできます';

$('build').onclick = async () => {
  if (building) return;
  building = true;
  ui.setBuildState('building');
  ui.openPanel('build');
  $('build').disabled = true;
  invalidateDownload();
  const snapshot = { source: editor.getValue(), env: $('env').value, revision };
  $('status').textContent = 'Build中…';
  $('log').textContent = '';
  const t0 = performance.now();
  try {
    const res = await fetch('/compile', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: snapshot.source, env: snapshot.env }),
    });
    if (res.ok) {
      const blob = await res.blob();
      if (revision !== snapshot.revision) {
        ui.setBuildState('changed');
        $('status').textContent = '以前の内容のBuildが完了しました。現在の内容で再Buildしてください';
        $('log').textContent = `Build成功（${snapshot.env}）。途中で編集されたためUF2は破棄しました。`;
        return;
      }
      ui.setBuildState('success');
      downloadUrl = URL.createObjectURL(blob);
      const a = $('download');
      a.href = downloadUrl;
      a.download = `firmware-${snapshot.env}.uf2`;
      a.hidden = false;
      $('status').textContent = `Build成功：${blob.size} bytes（${((performance.now() - t0) / 1000).toFixed(1)}秒）`;
      $('log').textContent = `build OK: ${snapshot.env}, ${blob.size} bytes (${res.headers.get('x-compile-duration-ms')} ms on server)`;
    } else {
      const j = await res.json().catch(() => ({}));
      ui.setBuildState('error');
      ui.openPanel('build');
      $('status').textContent = `Build失敗（${res.status}）${revision !== snapshot.revision ? '：編集前のコードの結果です' : ''}`;
      $('log').textContent = j.log ?? j.error ?? 'エラー内容を取得できませんでした';
      // Bring the first compiler diagnostic into view, past PlatformIO's preamble.
      const errorLine = $('log').textContent.split('\n').findIndex(line => /(?:fatal )?error:/i.test(line));
      $('log').scrollTop = Math.max(0, errorLine - 2) * parseFloat(getComputedStyle($('log')).lineHeight);
    }
  } catch (e) {
    ui.setBuildState('error');
    ui.openPanel('build');
    $('status').textContent = 'Build通信に失敗しました。再実行できます';
    $('log').textContent = String(e);
  } finally {
    building = false;
    $('build').disabled = false;
  }
};
