import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openExplorer, selectBoard } from './shell.js';
import { zipRead, zipWrite } from '../web/zip.js';
const key = 'digicode-text.projects.v1';
const old = 'digicode-text.draft.v1';
// The project list is part of the Explorer view now, so there is no list dialog to close.
async function closeList() {}
async function openMenu(page) { await openExplorer(page); if (!await page.locator('#file-menu').isVisible()) await page.click('#projects-open'); }
async function action(page, id) { await openMenu(page); await page.click('#' + id); }

async function ready(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); }
async function data(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
async function edit(page, text) {
  await page.locator('.monaco-editor .view-lines').click();
  await page.keyboard.press('ControlOrMeta+A');
  if (text) await page.keyboard.insertText(text); else await page.keyboard.press('Backspace');
}
async function name(page, action, value) {
  await openMenu(page); await page.click('#project-' + action);
  await page.fill('#name-input', value); await page.locator('#name-form button[type=submit]').click();
}
async function select(page, name) {
  await action(page, 'project-open-list');
  await page.locator('.project-item').filter({ has: page.locator('span', { hasText: new RegExp('^' + name + '$') }) }).click();
}
// 持ち出しは zip 1 本。中身を開いて、いままで JSON で見ていたものと同じ事実を見る。
async function exportFile(page, info, id = 'project-export') {
  const wait = page.waitForEvent('download'); await action(page, id);
  const download = await wait; const path = info.outputPath('export.zip'); await download.saveAs(path);
  const entries = await zipRead(new Uint8Array(await readFile(path)));
  const files = new Map(entries.map(e => [e.name, new TextDecoder().decode(e.data)]));
  const folder = [...files.keys()].find(n => n.endsWith('/digicode.json')).split('/')[0];
  return { path, files, folder,
    source: files.get(`${folder}/src/main.cpp`),
    names: [...files.keys()],
    config: JSON.parse(files.get(`${folder}/digicode.json`)) };
}
async function importFile(page, value) {
  await page.locator('#project-file').setInputFiles({ name: 'project.json', mimeType: 'application/json', buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)) });
}
for (const source of ['', '// old draft']) test(`migration preserved without duplicates: ${source || 'empty'}`, async ({ page }) => {
  await page.addInitScript(({ old, source }) => { if (!localStorage.getItem(old)) localStorage.setItem(old, JSON.stringify({ version: 1, source, env: 'pico' })); }, { old, source });
  await ready(page); const first = await data(page);
  expect(first.projects[0].source).toBe(source); expect(first.migration).toBe('draft-v1');
  await page.reload(); await expect(page.locator('#build')).toBeEnabled();
  expect((await data(page)).projects).toEqual(first.projects);
  expect(await page.evaluate(old => JSON.parse(localStorage.getItem(old)).source, old)).toBe(source);
});
test('CRUD, duplicate independence, same names, board restoration, model undo isolation, last delete', async ({ page }, info) => {
  await ready(page); const originalId = (await data(page)).activeId;
  await name(page, 'rename', '点滅テスト'); await closeList(page);
  expect((await data(page)).activeId).toBe(originalId);
  await edit(page, '// project A'); await selectBoard(page, 'pico');
  await name(page, 'duplicate', '点滅テスト');
  const duplicateId = (await data(page)).activeId; expect(duplicateId).not.toBe(originalId);
  await edit(page, '// independent duplicate');
  expect((await data(page)).projects.find(p => p.id === originalId).source).toBe('// project A');
  await name(page, 'rename', '複製'); await closeList(page);
  await name(page, 'new', '新規 hello');
  await expect(page.locator('.view-lines')).toContainText('hello'); await expect(page.locator('#env')).toHaveValue('xiao_rp2040');
  await select(page, '点滅テスト');
  await page.keyboard.press('ControlOrMeta+Z');
  await expect(page.locator('.view-lines')).toContainText('// project A');
  await page.reload(); await expect(page.locator('#env')).toHaveValue('pico');
  expect((await data(page)).activeId).toBe(originalId);
  await openMenu(page);
  await action(page, 'project-open-list');
  await page.screenshot({ path: info.outputPath('projects-desktop.png') });
  await action(page, 'project-rename'); await page.fill('#name-input', '   '); await page.locator('#name-form button[type=submit]').click();
  await expect(page.locator('#name-error')).toContainText('1〜80');
  await page.fill('#name-input', 'a'.repeat(81)); await page.locator('#name-form button[type=submit]').click();
  await expect(page.locator('#name-error')).toContainText('1〜80'); await page.click('#name-cancel');
  page.on('dialog', dialog => { expect(dialog.message()).toContain('削除'); dialog.accept(); });
  for (let i = 0; i < 3; i++) await action(page, 'project-delete');
  expect((await data(page)).projects).toHaveLength(1);
  await expect(page.locator('.view-lines')).toContainText('hello');
});
test('export/import roundtrip, validation, HTML inert', async ({ page }, info) => {
  await ready(page); await edit(page, '// <script>alert(1)</script>'); await selectBoard(page, 'pico');
  await name(page, 'rename', '<img src=x onerror=alert(1)>'); await closeList(page);
  const first = (await data(page)).activeId; const exported = await exportFile(page, info);
  expect(Object.keys(exported.config).sort()).toEqual(['env','exportedAt','format','libraries','name','product','revision','version']);
  expect(exported.config.version).toBe(2);
  expect(exported.source).toBe('// <script>alert(1)</script>'); // 本文は src/main.cpp にそのまま入る
  expect(exported.config.env).toBe('pico');
  expect(exported.names.sort()).toEqual([`${exported.folder}/digicode.json`, `${exported.folder}/src/main.cpp`].sort());
  // 書き出した zip をそのまま読み込む。名前が衝突するので 2 件目は「 (2)」になる。
  await page.locator('#project-file').setInputFiles(exported.path);
  await expect(page.locator('#project-notice')).toContainText('読み込みました');
  expect((await data(page)).activeId).not.toBe(first); expect((await data(page)).projects).toHaveLength(2);
  expect((await data(page)).projects[1].name).toBe(exported.config.name + ' (2)');
  expect((await exportFile(page, info)).source).toBe(exported.source);
  expect(await page.locator('#project-name img').count()).toBe(0);
  // 旧 .digicode.json（version 1）も引き続き読める。
  const v1 = { format: 'digicode-text-project', version: 1, name: '旧形式', source: '// v1', env: 'pico', libraries: [] };
  await importFile(page, v1); await expect(page.locator('#project-notice')).toContainText('読み込みました');
  expect((await data(page)).projects).toHaveLength(3);
  const value = v1;
  for (const bad of ['{', {...value, version: 3}, {...value, env: 'esp32'}, {...value, source: 3}, {...value, name: ''}, {...value, name: 'x'.repeat(81)}, {...value, source: 'x'.repeat(1024*1024+1)}, ' '.repeat(2*1024*1024+1)]) {
    await importFile(page, bad); await expect(page.locator('#project-notice')).not.toContainText('読み込みました');
    expect((await data(page)).projects).toHaveLength(3);
  }
});
test('quota failure retains edits, blocks switching/new/delete and allows export then retry', async ({ page }, info) => {
  await ready(page); await name(page, 'new', 'second');
  await page.evaluate(() => { window.originalSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); }; });
  await edit(page, '// rescue this'); await selectBoard(page, 'pico');
  await expect(page.locator('#save-status')).toContainText('保存できません');
  expect((await exportFile(page, info)).source).toBe('// rescue this');
  await select(page, 'はじめてのプロジェクト'); await expect(page.locator('#project-name')).toHaveText('second');
  await action(page, 'project-new'); await page.fill('#name-input', 'blocked'); await page.locator('#name-form button[type=submit]').click();
  await expect(page.locator('#name-error')).toContainText('操作を止めました'); await page.click('#name-cancel');
  page.once('dialog', d => d.accept()); await action(page, 'project-delete');
  expect((await data(page)).projects).toHaveLength(2);
  await closeList(page);
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSet; }); await page.click('#save-retry');
  await expect(page.locator('#save-status')).toContainText('保存済み');
  await page.reload(); await expect(page.locator('.view-lines')).toContainText('rescue this'); await expect(page.locator('#env')).toHaveValue('pico');
});
test('multiple tabs block writes, notify external changes and recover after owner closes', async ({ page, context }, info) => {
  await ready(page); const second = await context.newPage(); await ready(second);
  await expect(second.locator('#save-status')).toContainText('別のタブ');
  await edit(second, '// unsaved tab B');
  await edit(page, '// owner A');
  await expect(second.locator('#save-status')).toContainText('上書きを停止');
  expect((await exportFile(second, info)).source).toBe('// unsaved tab B');
  expect((await data(page)).projects[0].source).toBe('// owner A');
  await page.close();
  second.once('dialog', d => d.accept()); await second.reload(); await expect(second.locator('#save-status')).toContainText('保存済み');
  await expect(second.locator('.view-lines')).toContainText('owner A'); await edit(second, '// new owner');
  expect((await data(second)).projects[0].source).toBe('// new owner');
});
for (const status of [200, 422]) test(`Build switching discards foreign result ${status}`, async ({ page }) => {
  await ready(page); let release;
  await page.route('**/compile', async route => { await new Promise(r => { release = r; }); await route.fulfill({ status, contentType: status === 200 ? 'application/octet-stream' : 'application/json', body: status === 200 ? Buffer.alloc(512) : JSON.stringify({ log: 'foreign error' }) }); });
  await page.click('#build'); await expect.poll(() => Boolean(release)).toBe(true);
  await name(page, 'new', '別プロジェクト'); await expect(page.locator('#build')).toBeDisabled();
  release(); await expect(page.locator('#status')).toContainText('以前の内容');
  await expect(page.locator('#download')).toBeHidden(); await expect(page.locator('#log')).not.toContainText('foreign error');
  await expect(page.locator('#build')).toBeEnabled();
});
test('completed UF2 cleared on switch; desktop and narrow screenshots', async ({ page }, info) => {
  await ready(page); await page.route('**/compile', route => route.fulfill({ status: 200, body: Buffer.alloc(512) }));
  await page.click('#build'); await expect(page.locator('#download')).toBeVisible();
  await name(page, 'new', '温度ログの準備'); await expect(page.locator('#download')).toBeHidden();
  await page.click('#panel-toggle');
  await page.screenshot({ path: info.outputPath('workspace-desktop.png') });
  await page.setViewportSize({ width: 390, height: 700 });
  await page.screenshot({ path: info.outputPath('workspace-narrow.png') });
  await openMenu(page); await action(page, 'project-open-list'); await page.screenshot({ path: info.outputPath('projects-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
test('failed migration keeps old draft; successful retry completes migration once', async ({ page }) => {
  await page.addInitScript(old => {
    if (!localStorage.getItem(old)) localStorage.setItem(old, JSON.stringify({ version: 1, source: '', env: 'pico' }));
    window.originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('quota'); };
  }, old);
  await ready(page); expect(await data(page)).toBeNull();
  expect(await page.evaluate(old => JSON.parse(localStorage.getItem(old)).source, old)).toBe('');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSet; }); await page.click('#save-retry');
  expect((await data(page)).migration).toBe('draft-v1'); expect((await data(page)).projects[0].source).toBe('');
});
// 画面と同じ書式（秒なし）に直した、保存済みの更新日時。
async function stamp(page, projectName) {
  return page.evaluate(([k, n]) => {
    const d = JSON.parse(localStorage.getItem(k));
    return new Date(d.projects.find(p => p.name === n).updatedAt)
      .toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }, [key, projectName]);
}
// このアプリの zip ではない、ただのソース入り zip（tests/project-io.spec.js の stranger.zip と同じ）。
const strangerZip = () => Buffer.from(zipWrite([
  { name: 'thing/src/main.cpp', data: new TextEncoder().encode('int main() {}') },
  { name: 'thing/notes.txt', data: new TextEncoder().encode('hello') },
]));
async function rejectImport(page) {
  await page.locator('#project-file').setInputFiles({ name: 'stranger.zip', mimeType: 'application/zip', buffer: strangerZip() });
  await expect(page.locator('#project-notice')).toContainText('DigiCode Text のプロジェクトではありません');
}
test('詳細の箱は選択中の行の真下に1つだけ開き、切り替えると付いていく', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  const boardName = id => boards.find(b => b.id === id).name;
  await ready(page);
  await name(page, 'rename', '一つめ');
  await selectBoard(page, 'pico');
  await name(page, 'new', '二つめ'); // 新規は既定の xiao_rp2040、ライブラリは空
  await openExplorer(page);
  // 起動直後は閉じているので、選択中の名前を押して開く。
  await page.locator('#project-list .project-item[aria-current="true"]').click();
  // DOM 上で、選択中の行のすぐ次が箱。箱は常に1つだけ。
  const afterCurrent = () => page.evaluate(() =>
    document.querySelector('#project-list .project-item[aria-current="true"]')?.nextElementSibling?.id ?? null);
  await expect(page.locator('#project-detail')).toHaveCount(1);
  expect(await afterCurrent()).toBe('project-detail');
  await expect(page.locator('#project-detail-board')).toHaveText(boardName('xiao_rp2040'));
  await expect(page.locator('#project-detail-libs')).toHaveText('なし');
  await expect(page.locator('#project-detail-updated')).toHaveText(await stamp(page, '二つめ'));
  // 押した行は名前だけのまま。
  await expect(page.locator('.project-item[aria-current="true"]')).toHaveText('二つめ');
  // 切り替えると箱も移る。
  await select(page, '一つめ');
  await openExplorer(page);
  await expect(page.locator('#project-detail')).toHaveCount(1);
  expect(await afterCurrent()).toBe('project-detail');
  await expect(page.locator('#project-detail-board')).toHaveText(boardName('pico'));
  await expect(page.locator('#project-detail-updated')).toHaveText(await stamp(page, '一つめ'));
  await expect(page.locator('.project-item[aria-current="true"]')).toHaveText('一つめ');
});
test('ライブラリを追加すると、詳細の件数がついてくる', async ({ page }) => {
  const item = { id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3', description: 'JSON serialization library', frameworks: ['*'], platforms: ['*'] };
  await page.route('**/libraries/search?*', r => r.fulfill({ json: { items: [item], total: 1, more: false } }));
  await page.route('**/libraries/details?*', r => r.fulfill({ json: { ...item, versions: ['7.4.3', '7.4.2'] } }));
  await ready(page);
  await openExplorer(page);
  await page.locator('#project-list .project-item[aria-current="true"]').click(); // 起動直後は閉じている
  await expect(page.locator('#project-detail-libs')).toHaveText('なし');
  // ライブラリ画面から本当に追加する（changed() 経由で一覧が描き直される道）。
  await page.click('#libraries-open');
  await page.fill('#library-query', 'ArduinoJson');
  await page.locator('#library-search-form button').click();
  const row = page.locator('[data-library-id="64"]');
  await row.getByRole('button', { name: 'バージョンを選択' }).click();
  await row.locator('select').selectOption('7.4.3');
  await row.getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(page.locator('#library-added')).toContainText('7.4.3');
  await openExplorer(page);
  await expect(page.locator('#project-detail-libs')).toHaveText('1 件');
});
// 開閉の印は CSS の ::after で描くので、行の字ではなくそちらを見る。
const marker = page => page.evaluate(() =>
  getComputedStyle(document.querySelector('#project-list .project-item[aria-current="true"]'), '::after').content);
test('選択中の名前を押すと詳細の箱が開き、もう一度押すと閉じる', async ({ page }) => {
  await ready(page);
  await name(page, 'new', '二つめ');
  await openExplorer(page);
  const current = page.locator('#project-list .project-item[aria-current="true"]');
  const box = page.locator('#project-detail');
  // 起動直後は閉じている。
  await expect(box).toHaveCount(0);
  await expect(current).toHaveAttribute('aria-expanded', 'false');
  expect(await marker(page)).toContain('▸');
  // 押すと開く。行を作り直してもフォーカスは押した行に残る。
  await current.click();
  await expect(box).toHaveCount(1);
  await expect(current).toHaveAttribute('aria-expanded', 'true');
  expect(await marker(page)).toContain('▾');
  await expect(current).toBeFocused();
  // もう一度押すと閉じ、箱は DOM から消える。
  await current.click();
  await expect(box).toHaveCount(0);
  await expect(current).toHaveAttribute('aria-expanded', 'false');
  await expect(current).toBeFocused();
  // 閉じたまま別のプロジェクトを選ぶと、新しい選択行も閉じたまま。
  await select(page, 'はじめてのプロジェクト');
  await openExplorer(page);
  await expect(current).toHaveText('はじめてのプロジェクト');
  await expect(current).toHaveAttribute('aria-expanded', 'false');
  await expect(box).toHaveCount(0);
  await current.click();
  await expect(box).toHaveCount(1);
  await expect(current).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#project-detail-board')).toHaveCount(1);
});
test('一覧の名前は、選択中でもそうでなくても同じ左端から始まる', async ({ page }) => {
  await ready(page);
  await name(page, 'rename', '短い');
  await name(page, 'new', 'こちらはずっと長い名前のプロジェクト');
  await openExplorer(page);
  const nameOf = row => page.locator(`#project-list .project-item[aria-current="${row}"] > span`);
  const selected = await nameOf('true').boundingBox();
  const other = await nameOf('false').boundingBox();
  expect(other.x).toBe(selected.x);
  // 行の左端からの距離も同じ（中央寄せに戻っていないこと）。
  const rowX = await page.locator('#project-list .project-item').first().boundingBox();
  expect(Math.round(selected.x - rowX.x)).toBeLessThanOrEqual(12);
});
test('知らせのカードは×で消える', async ({ page }) => {
  await ready(page);
  await openExplorer(page);
  const notice = page.locator('#project-notice');
  await rejectImport(page);
  await expect(notice).toHaveAttribute('data-state', 'error');
  await expect(notice).toBeVisible();
  await page.click('#project-notice-close');
  await expect(notice).toHaveText('');
  await expect(notice).toBeHidden(); // 空になれば :empty でカードごと消える
});
test('知らせが出ても消えても、一覧の行は上下に動かない', async ({ page }) => {
  await ready(page);
  await name(page, 'new', '二つめ');
  await select(page, 'はじめてのプロジェクト'); // 先頭行と選択行を別にする
  await openExplorer(page);
  const rowY = async () => [
    (await page.locator('#project-list .project-item').first().boundingBox()).y,
    (await page.locator('.project-item[aria-current="true"]').boundingBox()).y,
  ];
  const before = await rowY();
  await rejectImport(page);
  expect(await rowY()).toEqual(before);
  await page.click('#project-notice-close');
  await expect(page.locator('#project-notice')).toHaveText('');
  expect(await rowY()).toEqual(before);
});
test('invalid new storage and external replacement are never overwritten', async ({ page, context }) => {
  await ready(page); const second = await context.newPage(); await ready(second);
  await second.evaluate(key => localStorage.setItem(key, '{broken'), key);
  await edit(page, '// keep in memory'); await expect(page.locator('#save-status')).toContainText('上書きを停止');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('{broken');
  await second.close();
  page.once('dialog', d => d.accept()); await page.reload(); await expect(page.locator('#build')).toBeEnabled();
  await expect(page.locator('#save-status')).toContainText('読み込めません');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('{broken');
});
