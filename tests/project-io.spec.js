import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileMenu, openExplorer, selectBoard } from './shell.js';
import { zipRead, zipWrite } from '../web/zip.js';
import { UI_FACTS } from '../web/product-facts.js';

const key = 'digicode-text.projects.v1';
const lib = { id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3' };
const utf8 = (s) => new TextEncoder().encode(s);
const str = (b) => new TextDecoder().decode(b);

async function ready(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); }
async function saved(page) { return page.evaluate(k => JSON.parse(localStorage.getItem(k)), key); }
async function edit(page, text) {
  await page.locator('.monaco-editor .view-lines').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(text);
}
async function rename(page, value) {
  await fileMenu(page, 'project-rename');
  await page.fill('#name-input', value);
  await page.locator('#name-form button[type=submit]').click();
}
async function newProject(page, value) {
  await fileMenu(page, 'project-new');
  await page.fill('#name-input', value);
  await page.locator('#name-form button[type=submit]').click();
}
async function addLibrary(page) {
  await page.evaluate(l => {
    const data = JSON.parse(localStorage.getItem('digicode-text.projects.v1'));
    data.projects.find(p => p.id === data.activeId).libraries = [l];
    localStorage.setItem('digicode-text.projects.v1', JSON.stringify(data));
  }, lib);
  await page.reload(); await expect(page.locator('#build')).toBeEnabled();
}
// 「書き出す」を押して、落ちてきた zip を開く。
async function exportZip(page, info, id, name) {
  const downloading = page.waitForEvent('download');
  await fileMenu(page, id);
  const download = await downloading;
  const path = info.outputPath(name);
  await download.saveAs(path);
  const entries = await zipRead(new Uint8Array(await readFile(path)));
  return { path, suggested: download.suggestedFilename(), files: new Map(entries.map(e => [e.name, str(e.data)])) };
}
async function importPath(page, path) {
  await openExplorer(page);
  await page.locator('#project-file').setInputFiles(path);
}

test('書き出した zip の中身が、いま編集しているプロジェクトそのものになっている', async ({ page }, info) => {
  await ready(page);
  await rename(page, 'ジェイソン');
  await selectBoard(page, 'xiao_esp32c3');
  await addLibrary(page);
  await edit(page, '// export me\n');
  const revision = (await saved(page)).projects[0].revision;
  const { files, suggested } = await exportZip(page, info, 'project-export', 'one.zip');
  expect(suggested).toMatch(/^ジェイソン_\d{8}-\d{6}\.zip$/);
  // zip に入るのは digicode.json と src/main.cpp の2つだけ。
  expect([...files.keys()].sort()).toEqual(['ジェイソン/digicode.json', 'ジェイソン/src/main.cpp'].sort());
  expect(files.get('ジェイソン/src/main.cpp')).toBe('// export me\n');
  const config = JSON.parse(files.get('ジェイソン/digicode.json'));
  expect(config.format).toBe('digicode-text-project');
  expect(config.version).toBe(2);
  expect(config.env).toBe('xiao_esp32c3');
  expect(config.libraries).toEqual([lib]);
  expect(config.revision).toBe(revision);
  expect(config.name).toBe('ジェイソン');
  expect(config.source).toBeUndefined();
  expect(config.id).toBeUndefined();
  expect(new Date(config.exportedAt).toString()).not.toBe('Invalid Date');
  expect(config.product).toEqual({ name: 'digicode-text', commit: null });
  // APIキーのような秘密は zip に入らない。
  for (const text of files.values()) expect(text).not.toMatch(/sk-|api[_-]?key/i);
});

test('書き出した zip を読み込むと復元され、そのプロジェクトが選ばれ、名前の衝突は (2) になる', async ({ page }, info) => {
  await ready(page);
  await rename(page, '往復');
  await selectBoard(page, 'pico');
  await edit(page, '// roundtrip\n');
  const { path } = await exportZip(page, info, 'project-export', 'roundtrip.zip');
  const before = await saved(page);

  await importPath(page, path);
  await expect(page.locator('#project-notice')).toContainText('読み込みました');
  const after = await saved(page);
  expect(after.projects).toHaveLength(2);
  const added = after.projects.find(p => p.id !== before.activeId);
  expect(added.name).toBe('往復 (2)');          // 同じ名前は増やさず、番号を付ける
  expect(added.source).toBe('// roundtrip\n');
  expect(added.env).toBe('pico');
  expect(added.revision).toBe(before.projects[0].revision);
  expect(after.activeId).toBe(added.id);        // 読み込んだものが編集対象になる
  await expect(page.locator('#project-name')).toHaveText('往復 (2)');
  await expect(page.locator('.view-lines')).toContainText('// roundtrip');
  await expect(page.locator('#env')).toHaveValue('pico');

  // もう一度読み込めば (3)。
  await importPath(page, path);
  await expect(page.locator('#project-name')).toHaveText('往復 (3)');
});

test('すべて書き出して、全部消してから読み込むと、件数と中身が戻る', async ({ page }, info) => {
  await ready(page);
  await rename(page, '一つ目'); await edit(page, '// one\n');
  await newProject(page, '二つ目'); await edit(page, '// two\n'); await selectBoard(page, 'pico');
  await newProject(page, '三つ目'); await edit(page, '// three\n'); await selectBoard(page, 'wio_node');
  expect((await saved(page)).projects).toHaveLength(3);

  const { path, files, suggested } = await exportZip(page, info, 'project-export-all', 'all.zip');
  expect(suggested).toMatch(/^digicode-text_projects_\d{8}-\d{6}\.zip$/);
  const index = JSON.parse(files.get('digicode-projects.json'));
  expect(index.format).toBe('digicode-text-projects');
  expect(index.version).toBe(1);
  expect(index.projects).toEqual(['一つ目', '二つ目', '三つ目']);

  // 全部消す（最後の1件を消すと空の新規が1件だけ残る）。
  page.on('dialog', d => d.accept());
  for (let i = 0; i < 3; i++) await fileMenu(page, 'project-delete');
  expect((await saved(page)).projects).toHaveLength(1);

  await importPath(page, path);
  await expect(page.locator('#project-notice')).toContainText('3件');
  const after = await saved(page);
  expect(after.projects).toHaveLength(4); // 残っていた1件 + 3件
  expect(after.projects.slice(1).map(p => [p.name, p.env, p.source])).toEqual([
    ['一つ目', 'xiao_rp2040', '// one\n'],
    ['二つ目', 'pico', '// two\n'],
    ['三つ目', 'wio_node', '// three\n'],
  ]);
  expect(after.activeId).toBe(after.projects[3].id); // 一括の最後の1件が選ばれる
  await expect(page.locator('#project-name')).toHaveText('三つ目');
});

test('旧 .digicode.json（version 1）も引き続き読み込める', async ({ page }) => {
  await ready(page);
  const old = { format: 'digicode-text-project', version: 1, name: '旧形式のプロジェクト', source: '// from v1\n', env: 'pico', libraries: [lib] };
  await openExplorer(page);
  await page.locator('#project-file').setInputFiles({ name: 'old.digicode.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(old)) });
  await expect(page.locator('#project-notice')).toContainText('読み込みました');
  const after = await saved(page);
  expect(after.projects).toHaveLength(2);
  expect(after.projects[1].name).toBe('旧形式のプロジェクト');
  expect(after.projects[1].source).toBe('// from v1\n');
  expect(after.projects[1].libraries).toEqual([lib]);
  expect(after.projects[1].revision).toBe(0); // 版数が無ければ新規と同じ 0 から
});

// このアプリが知らないボードで書き出された zip。env をそのまま採れないので利用者に選ばせる。
const unknownBoardZip = (name = 'よそのボード') => zipWrite([
  { name: `${name}/digicode.json`, data: utf8(JSON.stringify({ format: 'digicode-text-project', version: 2, name, env: 'teensy41', libraries: [], revision: 3 })) },
  { name: `${name}/src/main.cpp`, data: utf8('// from another board\n') },
]);

test('対応していないボードの zip は、利用者に選ばせてから取り込む', async ({ page }) => {
  await ready(page);
  await openExplorer(page);
  await page.locator('#project-file').setInputFiles({ name: 'other.zip', mimeType: 'application/zip', buffer: Buffer.from(unknownBoardZip()) });
  await expect(page.locator('#board-dialog')).toBeVisible();
  await expect(page.locator('#board-dialog-message')).toContainText('ボードが分かりません');
  await page.selectOption('#board-dialog-select', 'pico');
  await page.locator('#board-dialog-form button[type=submit]').click();
  await expect(page.locator('#project-notice')).toContainText('読み込みました');
  const after = await saved(page);
  expect(after.projects).toHaveLength(2);
  expect(after.projects[1].name).toBe('よそのボード');
  expect(after.projects[1].env).toBe('pico');
  expect(after.projects[1].source).toBe('// from another board\n');
  expect(after.projects[1].revision).toBe(3);
  await expect(page.locator('#env')).toHaveValue('pico');
});

test('ボード選択をキャンセルすると、そのプロジェクトは取り込まれない', async ({ page }) => {
  await ready(page);
  await openExplorer(page);
  await page.locator('#project-file').setInputFiles({ name: 'other.zip', mimeType: 'application/zip', buffer: Buffer.from(unknownBoardZip()) });
  await expect(page.locator('#board-dialog')).toBeVisible();
  await page.click('#board-dialog-cancel');
  await expect(page.locator('#project-notice')).toContainText('取り込みませんでした');
  expect((await saved(page)).projects).toHaveLength(1);
});

test('壊れた zip と中身の違う zip は、理由を1行出して拒否する', async ({ page }) => {
  await ready(page);
  await openExplorer(page);
  const cases = [
    ['broken.zip', Buffer.from('this is not a zip at all'), '末尾の目録が見つかりません'],
    // このアプリの zip ではない、ただのソース入り zip。
    ['stranger.zip', Buffer.from(zipWrite([
      { name: 'thing/src/main.cpp', data: utf8('int main() {}') },
      { name: 'thing/notes.txt', data: utf8('hello') },
    ])), 'DigiCode Text のプロジェクトではありません'],
    // digicode.json はあるが中身が別物。
    ['wrongformat.zip', Buffer.from(zipWrite([
      { name: 'p/digicode.json', data: utf8('{"format":"something-else","version":9}') },
      { name: 'p/src/main.cpp', data: utf8('x') },
    ])), 'DigiCode Text のプロジェクトではありません'],
    // digicode.json はこの製品のものだが、肝心の本体が入っていない。
    ['nomain.zip', Buffer.from(zipWrite([
      { name: 'p/digicode.json', data: utf8('{"format":"digicode-text-project","version":2,"name":"x","env":"pico","libraries":[]}') },
    ])), 'main.cpp が見つかりません'],
  ];
  for (const [name, buffer, reason] of cases) {
    await page.locator('#project-file').setInputFiles({ name, mimeType: 'application/zip', buffer });
    await expect(page.locator('#project-notice')).toContainText(reason);
    expect((await saved(page)).projects).toHaveLength(1);
  }
  // CRC を壊した zip も受け取らない（local header と目録の両方を書き換える）。
  const name = 'p/src/main.cpp';
  const bytes = zipWrite([{ name, data: utf8('hello') }]);
  const view = new DataView(bytes.buffer);
  view.setUint32(14, 0xdeadbeef, true);
  view.setUint32(bytes.length - 22 - (46 + name.length) + 16, 0xdeadbeef, true);
  await page.locator('#project-file').setInputFiles({ name: 'crc.zip', mimeType: 'application/zip', buffer: Buffer.from(bytes) });
  await expect(page.locator('#project-notice')).toContainText('壊れています');
  expect((await saved(page)).projects).toHaveLength(1);
});

test('拒否の理由はタイマーでは消えず、次の操作で消える。うまくいった知らせは数秒で消える', async ({ page }, info) => {
  await ready(page);
  await openExplorer(page);
  await page.locator('#project-file').setInputFiles({ name: 'broken.zip', mimeType: 'application/zip', buffer: Buffer.from('not a zip') });
  await expect(page.locator('#project-notice')).toContainText('末尾の目録が見つかりません');
  // 成功文を消す 6 秒のタイマーが、断り文には掛かっていないこと。
  await page.waitForTimeout(6500);
  await expect(page.locator('#project-notice')).toContainText('末尾の目録が見つかりません');
  // 次の操作（ファイルメニューの項目を選ぶ）で消える。
  await fileMenu(page, 'project-rename');
  await expect(page.locator('#project-notice')).toHaveText('');
  await page.click('#name-cancel');

  // 一方、書き出せたという知らせは 6 秒で引っ込む。
  await exportZip(page, info, 'project-export', 'notice.zip');
  await expect(page.locator('#project-notice')).toContainText('書き出しました');
  await expect(page.locator('#project-notice')).toHaveText('', { timeout: 9000 });
});

test('エクスプローラへの zip のドラッグ＆ドロップでも読み込める', async ({ page }, info) => {
  await ready(page);
  await rename(page, 'ドロップ');
  await edit(page, '// dropped\n');
  const { path } = await exportZip(page, info, 'project-export', 'drop.zip');
  const buffer = await readFile(path);
  await openExplorer(page);
  // DataTransfer を組み立てて、エクスプローラの上に落とす。
  const handle = await page.evaluateHandle(async ({ bytes, name }) => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(bytes)], name, { type: 'application/zip' }));
    return dt;
  }, { bytes: [...buffer], name: 'drop.zip' });
  await page.dispatchEvent('#explorer-view', 'dragover', { dataTransfer: handle });
  await expect(page.locator('#explorer-view')).toHaveClass(/drop-target/);
  await page.dispatchEvent('#explorer-view', 'drop', { dataTransfer: handle });
  await expect(page.locator('#project-notice')).toContainText('読み込みました');
  const after = await saved(page);
  expect(after.projects).toHaveLength(2);
  expect(after.projects[1].source).toBe('// dropped\n');
  await expect(page.locator('#explorer-view')).not.toHaveClass(/drop-target/);
});

test('AI に渡す画面の場所のうち、書き出し・読み込みの行が指す要素が実在する', async ({ page }) => {
  await ready(page);
  const io = UI_FACTS.filter(f => f.ids.some(id => ['project-export', 'project-export-all', 'project-import'].includes(id)));
  expect(io).toHaveLength(3);
  for (const fact of io) {
    for (const id of fact.ids) expect(await page.locator('#' + id).count(), `${id} は画面に無い`).toBe(1);
    expect(fact.text).toContain('zip');
  }
});
