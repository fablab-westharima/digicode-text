import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const lib = { id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3' };
const item = { ...lib, description: 'JSON serialization library', frameworks: ['*'], platforms: ['*'] };
const key = 'digicode-text.projects.v1';
const source = '#include <Arduino.h>\n#include <ArduinoJson.h>\nvoid setup(){ Serial.begin(115200); }\nvoid loop(){ JsonDocument doc; doc["message"]="DigiCode library test"; doc["value"]=42; serializeJson(doc, Serial); Serial.println(); delay(1000); }\n';
async function ready(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); }
async function saved(page) { return page.evaluate(key => { const d = JSON.parse(localStorage.getItem(key)); return d.projects.find(p => p.id === d.activeId); }, key); }
async function menu(page, id) { await page.click('#projects-open'); await page.click('#project-' + id); }
async function named(page, action, name) { await menu(page, action); await page.fill('#name-input', name); await page.locator('#name-form button[type=submit]').click(); }
async function edit(page, text) { await page.locator('.monaco-editor .view-lines').click(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.insertText(text); }
async function mocks(page) {
  await page.route('**/libraries/search?*', r => r.fulfill({ json: { items: [item], total: 1, more: false } }));
  await page.route('**/libraries/details?*', r => r.fulfill({ json: { ...item, versions: ['7.4.3', '7.4.2'] } }));
}
async function add(page, version = '7.4.3') {
  await page.click('#libraries-open'); await page.fill('#library-query', 'ArduinoJson'); await page.locator('#library-search-form button').click();
  const row = page.locator('[data-library-id="64"]'); await row.getByRole('button', { name: 'バージョンを選択' }).click();
  await row.locator('select').selectOption(version); await row.getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(page.locator('#library-added')).toContainText(version);
}
test('library CRUD, revision, reload, duplicate independence, switch, JSON and legacy', async ({ page }, info) => {
  await mocks(page); await ready(page); const first = await saved(page);
  await add(page, '7.4.2'); expect((await saved(page)).revision).toBe(first.revision + 1);
  const row = page.locator('[data-library-id="64"]'); await row.getByRole('button', { name: '追加済み · 版を変更' }).click();
  await row.getByRole('button', { name: 'このバージョンへ変更' }).click();
  expect((await saved(page)).libraries).toHaveLength(1);
  await row.locator('select').selectOption('7.4.3'); await row.getByRole('button', { name: 'このバージョンへ変更' }).click();
  await page.keyboard.press('Escape'); await expect(page.locator('#libraries-open')).toBeFocused();
  await page.reload(); await expect(page.locator('#build')).toBeEnabled(); expect((await saved(page)).libraries).toEqual([lib]);
  await named(page, 'rename', 'Library A'); expect((await saved(page)).id).toBe(first.id);
  await named(page, 'duplicate', 'Library B'); expect((await saved(page)).libraries).toEqual([lib]);
  const downloading = page.waitForEvent('download'); await menu(page, 'export'); const file = info.outputPath('roundtrip.json'); await (await downloading).saveAs(file);
  await page.click('#libraries-open'); await page.locator('#library-added button').click(); await page.click('#libraries-close');
  expect((await saved(page)).libraries).toEqual([]);
  await menu(page, 'open-list'); await page.locator('.project-item').filter({ hasText: 'Library A' }).click(); expect((await saved(page)).libraries).toEqual([lib]);
  await page.locator('#project-file').setInputFiles(file); await expect(page.locator('#project-notice')).toContainText('読み込みました'); expect((await saved(page)).libraries).toEqual([lib]);
  expect((await saved(page)).id).not.toBe(first.id);
  await named(page, 'new', 'empty'); expect((await saved(page)).libraries).toEqual([]);
  const exported = JSON.parse(await readFile(file, 'utf8')); delete exported.libraries;
  await page.locator('#project-file').setInputFiles({ name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
  await expect(page.locator('#project-name')).toHaveText('Library B'); expect((await saved(page)).libraries).toEqual([]);
  for (const bad of [null, [lib, lib], [{ ...lib, version: 'latest' }], [{ ...lib, name: '../evil' }]]) {
    const id = (await saved(page)).id;
    await page.locator('#project-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...exported, libraries: bad })) });
    await expect(page.locator('#project-notice')).not.toContainText('読み込みました'); expect((await saved(page)).id).toBe(id);
  }
});
test('search failure, no results, stale response, typing has no requests, focus and widths', async ({ page }, info) => {
  await ready(page); let release, calls = 0;
  await page.route('**/libraries/search?*', async route => {
    calls++; const q = new URL(route.request().url()).searchParams.get('q');
    if (q === 'old') await new Promise(r => { release = r; });
    await route.fulfill(q === 'fail' ? { status: 502, json: { error: 'Registry接続失敗' } } : { json: { items: q === 'none' ? [] : [{ ...item, description: q }], total: q === 'none' ? 0 : 1 } });
  });
  await page.click('#libraries-open'); await expect(page.locator('#library-query')).toBeFocused();
  await page.fill('#library-query', 'typing'); expect(calls).toBe(0);
  for (const [q, expected] of [['fail', 'Registry接続失敗'], ['none', '該当する']]) {
    await page.fill('#library-query', q); await page.keyboard.press('Enter'); await expect(page.locator('#library-status')).toContainText(expected);
  }
  await page.fill('#library-query', 'old'); await page.keyboard.press('Enter'); await expect.poll(() => Boolean(release)).toBe(true);
  await page.fill('#library-query', 'new'); await page.keyboard.press('Enter'); await expect(page.locator('#library-results')).toContainText('new'); release();
  await expect(page.locator('#library-results')).not.toContainText('old');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 850 }); await page.screenshot({ path: info.outputPath(`libraries-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect(await page.locator('#libraries-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
  await page.keyboard.press('Escape'); await expect(page.locator('#libraries-open')).toBeFocused();
});
test('library edits invalidate completed and in-flight artifacts and snapshot dependencies', async ({ page }) => {
  await mocks(page); await ready(page); let release, sent, delayed = false;
  await page.route('**/compile', async r => { sent = r.request().postDataJSON(); if (delayed) await new Promise(resolve => { release = resolve; }); await r.fulfill({ body: Buffer.alloc(512) }); });
  await page.click('#build'); await expect(page.locator('#download')).toBeVisible(); await add(page);
  await page.click('#libraries-close'); await expect(page.locator('#download')).toBeHidden();
  delayed = true; await page.click('#build'); await expect.poll(() => Boolean(release)).toBe(true); expect(sent.libraries).toEqual([lib]); expect(sent.projectId).toBe((await saved(page)).id);
  await page.click('#libraries-open'); await page.locator('#library-added button').click(); await page.click('#libraries-close');
  release(); await expect(page.locator('#status')).toContainText('以前の内容'); await expect(page.locator('#download')).toBeHidden();
});
test('library save failure and second tab preserve rescue JSON', async ({ page, context }, info) => {
  await mocks(page); await ready(page); const second = await context.newPage(); await mocks(second); await ready(second);
  await add(second); await second.click('#libraries-close'); await expect(second.locator('#save-status')).toContainText('別のタブ');
  const download = second.waitForEvent('download'); await menu(second, 'export'); const dest = info.outputPath('rescue.json'); await (await download).saveAs(dest);
  expect(JSON.parse(await readFile(dest, 'utf8')).libraries).toEqual([lib]); expect((await saved(page)).libraries).toEqual([]);
  second.on('dialog', d => d.accept()); await second.close();
  await page.evaluate(() => { window.set = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await add(page); await page.click('#libraries-close'); await expect(page.locator('#save-status')).toContainText('保存できません');
  await named(page, 'new', 'blocked'); await expect(page.locator('#name-error')).toContainText('操作を止めました'); await page.click('#name-cancel');
  await page.evaluate(() => { Storage.prototype.setItem = window.set; }); await page.click('#save-retry'); expect((await saved(page)).libraries).toEqual([lib]);
});
test('server rejects malformed dependencies before compilation', async ({ request }) => {
  for (const libraries of [null, {}, [lib, lib], Array(33).fill(lib), [{ ...lib, id: '64' }], [{ ...lib, owner: 'https://x' }], [{ ...lib, name: 'x\nextra_scripts=evil' }], [{ ...lib, version: '^7.0.0' }], [{ ...lib, version: 'file:///tmp/x' }], [{ ...lib, extra_scripts: 'x' }]]) {
    const res = await request.post('/compile', { data: { source, env: 'xiao_rp2040', libraries } }); expect(res.status()).toBe(400);
  }
  const res = await request.post('/compile', { data: { source, env: 'xiao_rp2040', libraries: [{ ...lib, id: 65 }] } });
  expect(res.status()).toBe(422); expect((await res.json()).stage).toBe('dependencies');
});
test('Actual Registry add, RP2040 and C3 builds/downloads, deletion and concurrent project isolation', async ({ page, request }, info) => {
  test.setTimeout(1_200_000); await ready(page); await edit(page, source); await add(page); await page.click('#libraries-close');
  for (const env of ['xiao_rp2040', 'xiao_esp32c3']) {
    await page.selectOption('#env', env); await page.click('#build'); await expect(page.locator('#download')).toBeVisible({ timeout: 600_000 });
    const downloading = page.waitForEvent('download'); await page.click('#download'); const download = await downloading;
    const dest = info.outputPath(download.suggestedFilename()); await download.saveAs(dest); const bytes = await readFile(dest);
    if (env === 'xiao_rp2040') { expect(bytes.length % 512).toBe(0); for (let i=0;i<bytes.length;i+=512) { expect(bytes.readUInt32LE(i)).toBe(0x0a324655); expect(bytes.readUInt32LE(i+508)).toBe(0x0ab16f30); } }
    else console.log(execFileSync('python3', ['tests/verify-c3.py', dest], { encoding: 'utf8' }));
    console.log(env, bytes.length); await page.screenshot({ path: info.outputPath(`real-${env}.png`) });
  }
  await page.click('#libraries-open'); await page.locator('#library-added button').click(); await page.click('#libraries-close');
  await page.click('#build'); await expect(page.locator('#status')).toContainText('Build失敗（422）', { timeout: 600_000 }); await expect(page.locator('#log')).toContainText('ArduinoJson.h');
  const [a, b] = await Promise.all([
    request.post('/compile', { data: { source, env: 'xiao_rp2040', libraries: [lib], projectId: 'A' }, timeout: 600_000 }),
    request.post('/compile', { data: { source, env: 'xiao_rp2040', libraries: [], projectId: 'B' }, timeout: 600_000 }),
  ]);
  expect(a.status()).toBe(200); expect(b.status()).toBe(422); expect((await b.json()).log).toContain('ArduinoJson.h');
});
