import { validateLibraries } from '../shared/libraries.js';
export const PROJECT_KEY = 'digicode-text.projects.v1';
export const DRAFT_KEY = 'digicode-text.draft.v1';
export const MAX_FILE = 2 * 1024 * 1024;
// Board ids come from the compiler's GET /boards; app.js sets them before opening projects.
const boards = new Set();
export function setBoards(ids) { boards.clear(); for (const id of ids) boards.add(id); }
export function validName(name) {
  if (typeof name !== 'string' || !name.trim() || [...name].length > 80) throw new Error('名前は1〜80文字で入力してください（空白だけは使えません）');
  return name.trim();
}
// main.cpp 本体の検査だけを切り出したもの。ボードがまだ決まっていない取り込み途中
// （zip から読んだが env を利用者に選んでもらう前）でも、同じ上限・同じ文言で掛けられる。
export function validateSource(source, limitSize = true) {
  if (typeof source !== 'string') throw new Error('main.cppのコードは文字列で指定してください');
  if (limitSize && new TextEncoder().encode(source).length > 1024 * 1024) throw new Error('コードは1 MiB以内にしてください');
  return source;
}
export function validateContent(value, limitSize = true) {
  validName(value?.name);
  validateLibraries(value?.libraries);
  validateSource(value.source, limitSize);
  if (!boards.has(value.env)) throw new Error('未対応のboardです');
}
export function parseProject(text) {
  if (new TextEncoder().encode(text).length > MAX_FILE) throw new Error('JSONファイルは2 MiB以内にしてください');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('JSONの形式が正しくありません'); }
  // version 1 は書き出しJSONそのもの（source を持つ）。version 2 は zip の digicode.json で、
  // コードは src/main.cpp にある。単体のJSONとして渡された version 2 は source を持たないので、
  // このあとの validateContent が「main.cppのコードが無い」と言って止める。
  if (value?.format !== 'digicode-text-project' || (value.version !== 1 && value.version !== 2)) throw new Error('未対応のファイル形式・バージョンです');
  validateContent(value);
  return { name: validName(value.name), source: value.source, env: value.env, libraries: validateLibraries(value.libraries) };
}
export function makeProject(name, source, env = 'xiao_rp2040', libraries = []) {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name: validName(name), source, env, libraries: validateLibraries(libraries), createdAt: now, updatedAt: now, revision: 0 };
}

// One writer per origin, held for the document lifetime. Saves themselves are synchronous,
// so a last keystroke cannot be left in a debounce queue when navigating away.
export async function openProjects(hello, status) {
  let writer = false;
  try {
    await new Promise((resolve, reject) => {
      navigator.locks.request(PROJECT_KEY, { ifAvailable: true }, lock => {
        writer = Boolean(lock);
        resolve();
        if (lock) return new Promise(() => {});
      }).catch(reject);
    });
  } catch { /* Fail closed if locks are unavailable. */ }
  let baseline = null, blocked = false, dirty = false, notice = '';
  let data;
  try {
    baseline = localStorage.getItem(PROJECT_KEY);
    if (baseline !== null) {
      data = JSON.parse(baseline);
      if (data?.version !== 1 || !Array.isArray(data.projects) || !data.projects.length ||
          !data.projects.some(p => p.id === data.activeId)) throw new Error();
      const ids = new Set();
      for (const p of data.projects) {
        validateContent(p, false);
        if (typeof p.id !== 'string' || !p.id || ids.has(p.id) || !Number.isSafeInteger(p.revision) || p.revision < 0 ||
            typeof p.createdAt !== 'string' || !Number.isFinite(Date.parse(p.createdAt)) ||
            typeof p.updatedAt !== 'string' || !Number.isFinite(Date.parse(p.updatedAt))) throw new Error();
        p.libraries = validateLibraries(p.libraries);
        ids.add(p.id);
      }
    }
  } catch {
    data = undefined; blocked = true;
    notice = '保存内容を読み込めません。上書きを停止しました。編集内容は書き出しで退避してください';
  }
  if (!data) {
    let source = hello, env = 'xiao_rp2040', migrated = false;
    if (!blocked) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw !== null) {
          const old = JSON.parse(raw);
          if (old?.version !== 1 || typeof old.source !== 'string' || !boards.has(old.env)) throw new Error();
          source = old.source; env = old.env; migrated = true;
        }
      } catch {
        blocked = true;
        notice = '旧下書きを読み込めません。旧データを保持し、保存を停止しました。編集内容は書き出しで退避してください';
      }
    }
    const project = makeProject(migrated ? '引き継いだ下書き' : 'はじめてのプロジェクト', source, env);
    data = { version: 1, activeId: project.id, migration: migrated ? 'draft-v1' : 'none', projects: [project] };
    dirty = true;
  }
  function save(restored = false) {
    if (!writer || blocked) {
      status(notice || '別のタブが開いているため保存停止中。書き出しで退避後、他のタブを閉じて再読み込みしてください', true);
      return false;
    }
    status('保存中…');
    try {
      if (localStorage.getItem(PROJECT_KEY) !== baseline) {
        blocked = true;
        notice = '別のタブで保存内容が変わりました。上書きを停止しました。書き出しで退避してください';
        status(notice, true); return false;
      }
      const raw = JSON.stringify(data);
      localStorage.setItem(PROJECT_KEY, raw);
      baseline = raw; dirty = false;
      status(restored ? '復元・保存済み' : '保存済み');
      return true;
    } catch {
      status('保存できません（容量・ブラウザ設定）。編集は保持しています。書き出しで退避してください', true);
      return false;
    }
  }
  const store = {
    get data() { return data; },
    get current() { return data.projects.find(p => p.id === data.activeId); },
    get dirty() { return dirty; },
    save,
    edit(source, env, libraries = store.current.libraries) {
      Object.assign(store.current, { source, env, libraries: validateLibraries(libraries), revision: store.current.revision + 1, updatedAt: new Date().toISOString() });
      dirty = true; save();
    },
    transact(change) {
      // Never replace in-memory edits when persistence is unavailable.
      if (!save()) return false;
      const previous = structuredClone(data);
      change(data);
      dirty = true;
      if (save()) return true;
      data = previous; dirty = false;
      return false;
    },
  };
  window.addEventListener('storage', event => {
    if ((event.key === PROJECT_KEY || event.key === null) && event.newValue !== baseline) {
      blocked = true;
      notice = '別のタブで保存内容が変わりました。上書きを停止しました。書き出しで退避後、再読み込みしてください';
      status(notice, true);
    }
  });
  window.addEventListener('beforeunload', event => {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });
  save(true);
  return store;
}
