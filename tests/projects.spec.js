import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const key = 'digicode-text.projects.v1';
const old = 'digicode-text.draft.v1';
async function closeList(page) { if (await page.locator('#projects-dialog').isVisible()) await page.click('#projects-close'); }
async function openMenu(page) { await closeList(page); if (!await page.locator('#file-menu').isVisible()) await page.click('#projects-open'); }
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
  if (!await page.locator('#projects-dialog').isVisible()) await openMenu(page);
  await action(page, 'project-open-list');
  await page.locator('.project-item').filter({ has: page.locator('span', { hasText: new RegExp('^' + name + '$') }) }).click();
}
async function exportFile(page, info) {
  if (!await page.locator('#projects-dialog').isVisible()) await openMenu(page);
  const wait = page.waitForEvent('download'); await action(page, 'project-export');
  const download = await wait; const path = info.outputPath('project.json'); await download.saveAs(path);
  await closeList(page);
  return JSON.parse(await readFile(path, 'utf8'));
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
  await edit(page, '// project A'); await page.selectOption('#env', 'pico');
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
  for (let i = 0; i < 3; i++) {
    if (!await page.locator('#projects-dialog').isVisible()) await openMenu(page);
    await action(page, 'project-delete');
  }
  expect((await data(page)).projects).toHaveLength(1);
  await expect(page.locator('.view-lines')).toContainText('hello');
});
test('export/import roundtrip, validation, HTML inert', async ({ page }, info) => {
  await ready(page); await edit(page, '// <script>alert(1)</script>'); await page.selectOption('#env', 'pico');
  await name(page, 'rename', '<img src=x onerror=alert(1)>'); await closeList(page);
  const first = (await data(page)).activeId; const value = await exportFile(page, info);
  expect(Object.keys(value).sort()).toEqual(['env','format','name','source','version']);
  await importFile(page, value); await expect(page.locator('#project-notice')).toContainText('読み込みました');
  expect((await data(page)).activeId).not.toBe(first); expect((await data(page)).projects).toHaveLength(2);
  expect(await exportFile(page, info)).toEqual(value);
  expect(await page.locator('#project-name img').count()).toBe(0);
  for (const bad of ['{', {...value, version: 2}, {...value, env: 'esp32'}, {...value, source: 3}, {...value, name: ''}, {...value, name: 'x'.repeat(81)}, {...value, source: 'x'.repeat(1024*1024+1)}, ' '.repeat(2*1024*1024+1)]) {
    await importFile(page, bad); await expect(page.locator('#project-notice')).not.toContainText('読み込みました');
    expect((await data(page)).projects).toHaveLength(2);
  }
});
test('quota failure retains edits, blocks switching/new/delete and allows export then retry', async ({ page }, info) => {
  await ready(page); await name(page, 'new', 'second');
  await page.evaluate(() => { window.originalSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); }; });
  await edit(page, '// rescue this'); await page.selectOption('#env', 'pico');
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
