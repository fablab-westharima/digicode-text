// DigiCode Text のプロジェクトを持ち出す／持ち込むための zip。ここは純関数だけを置く
// （DOM も localStorage も触らない）。UI との結線は app.js、zip のバイト列は zip.js。
import { validateLibraries } from '../shared/libraries.js';
import { validateSource } from './projects.js';
import { zipWrite, zipRead } from './zip.js';

export const PROJECT_FORMAT = 'digicode-text-project';
export const PROJECTS_FORMAT = 'digicode-text-projects';
export const MAX_ZIP = 16 * 1024 * 1024; // zip は JSON より大きくなりうるので別枠

// ファイル名・フォルダ名に使えない文字を落とす。既存の書き出し（app.js）と同じ文字集合。
export function safeName(name) {
  const cleaned = String(name ?? '')
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 80);
  return cleaned || 'project';
}

export function stamp(date = new Date()) {
  const p = (n, width = 2) => String(n).padStart(width, '0');
  return `${p(date.getFullYear(), 4)}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
}

// 保存済みの名前と衝突したら「 (2)」「 (3)」…。名前は1〜80文字なので、付け足す分だけ先頭を詰める。
export function uniqueName(name, taken) {
  if (!taken.has(name)) return name;
  for (let n = 2; ; n++) {
    const suffix = ` (${n})`;
    const base = [...name].slice(0, 80 - suffix.length).join('');
    const candidate = base + suffix;
    if (!taken.has(candidate)) return candidate;
  }
}

export function digicodeJson(project, { exportedAt = new Date().toISOString(), commit = null } = {}) {
  return {
    format: PROJECT_FORMAT,
    version: 2,
    name: project.name,
    env: project.env,
    libraries: project.libraries,
    revision: project.revision,
    exportedAt,
    product: { name: 'digicode-text', commit },
  };
}

const utf8 = (text) => new TextEncoder().encode(text);

// 1プロジェクト分のファイル（フォルダ名つき）。全件書き出しは同じものを並べる。
export function projectEntries(project, folder, options = {}) {
  return [
    { name: `${folder}/digicode.json`, data: utf8(JSON.stringify(digicodeJson(project, options), null, 2) + '\n') },
    { name: `${folder}/src/main.cpp`, data: utf8(project.source) },
  ];
}

export function exportProject(project, options = {}) {
  const at = options.at ?? new Date();
  const folder = safeName(project.name);
  const entries = projectEntries(project, folder, { exportedAt: at.toISOString(), commit: options.commit ?? null });
  return { fileName: `${folder}_${stamp(at)}.zip`, bytes: zipWrite(entries, at) };
}

export function exportAll(projects, options = {}) {
  const at = options.at ?? new Date();
  const exportedAt = at.toISOString();
  const taken = new Set();
  const folders = [];
  const entries = [];
  for (const project of projects) {
    const folder = uniqueName(safeName(project.name), taken);
    taken.add(folder);
    folders.push(folder);
    entries.push(...projectEntries(project, folder, { exportedAt, commit: options.commit ?? null }));
  }
  const index = { format: PROJECTS_FORMAT, version: 1, exportedAt, projects: folders };
  entries.unshift({ name: 'digicode-projects.json', data: utf8(JSON.stringify(index, null, 2) + '\n') });
  return { fileName: `digicode-text_projects_${stamp(at)}.zip`, bytes: zipWrite(entries, at) };
}

// ---- 取り込み ----------------------------------------------------------------

const text = (data) => new TextDecoder('utf-8', { fatal: false }).decode(data);

// zip の項目を「フォルダ → そのフォルダ内の相対パス」で引けるようにする。
// キー '' はルートで、そこにはパスをそのまま入れる（ルート直下の src/main.cpp を引けるように）。
// 1階層下のフォルダは、そのフォルダからの相対パスで入れる。深さ2以上のフォルダは作らない。
function folderMap(entries) {
  const byFolder = new Map([['', new Map()]]);
  for (const entry of entries) {
    byFolder.get('').set(entry.name, entry.data);
    const slash = entry.name.indexOf('/');
    if (slash === -1) continue;
    const folder = entry.name.slice(0, slash);
    if (!byFolder.has(folder)) byFolder.set(folder, new Map());
    byFolder.get(folder).set(entry.name.slice(slash + 1), entry.data);
  }
  return byFolder;
}

// digicode.json の中身を1プロジェクトぶんに直す。version 1（source を持つ）と 2 の両方を受ける。
// env がこの compiler の知らない board なら null にして、利用者に選んでもらう。
function fromDigicodeJson(json, source, boardIds) {
  if (json?.format !== PROJECT_FORMAT || (json.version !== 1 && json.version !== 2)) {
    throw new Error('このファイルは DigiCode Text のプロジェクトではありません');
  }
  const body = json.version === 1 ? json.source : source;
  if (typeof body !== 'string') throw new Error('zip の中に main.cpp が見つかりません');
  return {
    name: typeof json.name === 'string' && json.name.trim() ? json.name.trim() : null,
    source: validateSource(body),
    env: boardIds.has(json.env) ? json.env : null,
    libraries: validateLibraries(json.libraries ?? []),
    revision: Number.isSafeInteger(json.revision) && json.revision >= 0 ? json.revision : null,
  };
}

function analyseFolder(files, boardIds) {
  const config = files.get('digicode.json');
  if (config === undefined) throw new Error('このファイルは DigiCode Text のプロジェクトではありません');
  let json;
  try { json = JSON.parse(text(config)); }
  catch { throw new Error('このファイルは DigiCode Text のプロジェクトではありません'); }
  const source = files.get('src/main.cpp');
  return fromDigicodeJson(json, source === undefined ? undefined : text(source), boardIds);
}

// zip のバイト列 -> 取り込み候補の配列。boards は board id を持つ Map か Set
// （env がこの compiler にある board かどうかを見るためだけに使う）。
export async function parseImportZip(bytes, { zipName = '', boards }) {
  const boardIds = boards instanceof Set ? boards : new Set(boards.keys());
  const entries = await zipRead(bytes);
  if (!entries.length) throw new Error('zip の中身が空です');
  const byFolder = folderMap(entries);
  const root = byFolder.get('');
  const fallback = safeName(zipName.replace(/\.zip$/i, '')) || 'project';

  const indexFile = root.get('digicode-projects.json');
  if (indexFile !== undefined) {
    let index;
    try { index = JSON.parse(text(indexFile)); } catch { index = null; }
    if (index?.format !== PROJECTS_FORMAT || index.version !== 1 || !Array.isArray(index.projects)) {
      throw new Error('このファイルは DigiCode Text のプロジェクトではありません');
    }
    const found = [];
    for (const folder of index.projects) {
      const files = byFolder.get(folder);
      if (!files) continue;
      const project = analyseFolder(files, boardIds);
      found.push({ ...project, name: project.name ?? folder, folder });
    }
    if (!found.length) throw new Error('zip の中にプロジェクトが1件も見つかりません');
    return found;
  }

  // 単体: digicode.json をルート直下、無ければ1階層下のフォルダで探す。深さ2以上は見ない。
  if (root.has('digicode.json')) {
    const project = analyseFolder(root, boardIds);
    return [{ ...project, name: project.name ?? fallback, folder: '' }];
  }
  for (const folder of [...byFolder.keys()].filter(f => f !== '')) {
    if (!byFolder.get(folder).has('digicode.json')) continue;
    const project = analyseFolder(byFolder.get(folder), boardIds);
    return [{ ...project, name: project.name ?? folder, folder }];
  }
  throw new Error('このファイルは DigiCode Text のプロジェクトではありません');
}
