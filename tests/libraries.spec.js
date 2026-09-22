import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileMenu, selectBoard } from './shell.js';
import { zipRead } from '../web/zip.js';
const lib = { id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3' };
const item = { ...lib, description: 'JSON serialization library', frameworks: ['*'], platforms: ['*'] };
const key = 'digicode-text.projects.v1';
const source = '#include <Arduino.h>\n#include <ArduinoJson.h>\nvoid setup(){ Serial.begin(115200); }\nvoid loop(){ JsonDocument doc; doc["message"]="DigiCode library test"; doc["value"]=42; serializeJson(doc, Serial); Serial.println(); delay(1000); }\n';
async function ready(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); }
async function saved(page) { return page.evaluate(key => { const d = JSON.parse(localStorage.getItem(key)); return d.projects.find(p => p.id === d.activeId); }, key); }
async function menu(page, id) { await fileMenu(page, 'project-' + id); }
async function named(page, action, name) { await menu(page, action); await page.fill('#name-input', name); await page.locator('#name-form button[type=submit]').click(); }
async function edit(page, text) { await page.locator('.monaco-editor .view-lines').click(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.insertText(text); }
async function mocks(page) {
  await page.route('**/libraries/search?*', r => r.fulfill({ json: { items: [item], total: 1, more: false } }));
  await page.route('**/libraries/details?*', r => r.fulfill({ json: { ...item, versions: ['7.4.3', '7.4.2'] } }));
}
async function add(page, version = '7.4.3') {
  await page.click('#libraries-open'); await page.fill('#library-query', 'ArduinoJson'); await page.locator('#library-search-form button').click();
  const row = page.locator('[data-library-id="64"]');
  await row.locator('.library-item').click(); // 名前を押して詳細の箱を開く
  await row.getByRole('button', { name: 'バージョンを選択' }).click();
  await row.locator('select').selectOption(version); await row.getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(page.locator('#library-added')).toContainText(version);
}
/** 追加済みの1件を、名前を押して箱を開いてから削除する。 */
async function removeAdded(page) {
  if (await page.locator('#library-added-toggle').getAttribute('aria-expanded') === 'false') await page.click('#library-added-toggle'); // 追加済みは初期状態で閉じている
  await page.locator('#library-added .library-item').first().click();
  await page.locator('#library-added-detail').getByRole('button', { name: /を削除$/ }).click();
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
  const downloading = page.waitForEvent('download'); await menu(page, 'export'); const file = info.outputPath('roundtrip.zip'); await (await downloading).saveAs(file);
  await page.click('#libraries-open'); await removeAdded(page); await page.click('#libraries-close');
  expect((await saved(page)).libraries).toEqual([]);
  await menu(page, 'open-list'); await page.locator('.project-item').filter({ hasText: 'Library A' }).click(); expect((await saved(page)).libraries).toEqual([lib]);
  await page.locator('#project-file').setInputFiles(file); await expect(page.locator('#project-notice')).toContainText('読み込みました'); expect((await saved(page)).libraries).toEqual([lib]);
  expect((await saved(page)).id).not.toBe(first.id);
  await named(page, 'new', 'empty'); expect((await saved(page)).libraries).toEqual([]);
  // 依存を持たない旧 .digicode.json（version 1）。書き出した zip の中身から同じ内容で組み立てる。
  const inside = new Map((await zipRead(new Uint8Array(await readFile(file)))).map(e => [e.name.split('/').slice(1).join('/'), new TextDecoder().decode(e.data)]));
  const config = JSON.parse(inside.get('digicode.json'));
  const exported = { format: 'digicode-text-project', version: 1, name: config.name, source: inside.get('src/main.cpp'), env: config.env };
  await page.locator('#project-file').setInputFiles({ name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
  // 同名が既にあるので「 (2)」「 (3)」が付く。
  await expect(page.locator('#project-name')).toHaveText(/^Library B( \(\d+\))?$/); expect((await saved(page)).libraries).toEqual([]);
  // The browser cannot ask the Registry, so an import only rejects unusable coordinates and
  // unsafe version strings; a non-existent version such as "latest" is caught at Build time.
  for (const bad of [null, [lib, lib], [{ ...lib, version: '' }], [{ ...lib, version: '7.4.3\nextra_scripts=evil' }], [{ ...lib, name: '../evil' }]]) {
    const id = (await saved(page)).id;
    await page.locator('#project-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...exported, libraries: bad })) });
    await expect(page.locator('#project-notice')).not.toContainText('読み込みました'); expect((await saved(page)).id).toBe(id);
  }
});
test('search failure, no results, stale response, typing automatically searches, focus and widths', async ({ page }, info) => {
  await ready(page); let release, calls = 0;
  await page.route('**/libraries/search?*', async route => {
    calls++; const q = new URL(route.request().url()).searchParams.get('q');
    if (q === 'old') await new Promise(r => { release = r; });
    await route.fulfill(q === 'fail' ? { status: 502, json: { error: 'Registry接続失敗' } } : { json: { items: q === 'none' ? [] : [{ ...item, description: q }], total: q === 'none' ? 0 : 1 } });
  });
  await page.click('#libraries-open'); await expect(page.locator('#library-query')).toBeFocused();
  // 説明は行ではなく箱の中なので、応答がどれかは名前を押して確かめる。
  await page.fill('#library-query', 'typing'); await page.locator('#library-results .library-item').click();
  await expect(page.locator('#library-result-detail')).toContainText('typing'); expect(calls).toBe(1);
  for (const [q, expected] of [['fail', 'Registry接続失敗'], ['none', '見つかりません']]) {
    await page.fill('#library-query', q); await page.keyboard.press('Enter'); await expect(page.locator('#library-status')).toContainText(expected);
  }
  await page.fill('#library-query', 'old'); await page.keyboard.press('Enter'); await expect.poll(() => Boolean(release)).toBe(true);
  await page.fill('#library-query', 'new'); await page.keyboard.press('Enter');
  await page.locator('#library-results .library-item').click();
  await expect(page.locator('#library-result-detail')).toContainText('new'); release();
  await expect(page.locator('#library-result-detail')).not.toContainText('old');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 850 }); await page.screenshot({ path: info.outputPath(`libraries-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect(await page.locator('#libraries-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
  await page.keyboard.press('Escape'); await expect(page.locator('#libraries-open')).toBeFocused();
});
// 行の 2 段（1 段目 名前、2 段目 提供者）と、view の見出しの 1 行（プロジェクト名 · ボード名）。
// どちらも「長い名前を入れても、隣の字が読めなくならない」ことだけを見る。
test('行は名前と提供者の2段で、長いプロジェクト名でもボード名は潰れない', async ({ page }, info) => {
  await mocks(page); await ready(page);
  await named(page, 'rename', 'ながい名前のプロジェクト'.repeat(6)); // 72 文字
  await page.click('#libraries-open');

  // ボード名は縮めない：字が全部入っている（scrollWidth が clientWidth を超えない）。
  const board = page.locator('#library-board');
  await expect(board).toHaveText(' · XIAO RP2040');
  expect(await board.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(80);
  expect(await board.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  // 縮んで省略されるのはプロジェクト名の側。
  expect(await page.locator('#library-target').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);

  // 行は2段：提供者は名前より下の段にあり、段いっぱいの幅を持つ。
  await page.fill('#library-query', 'ArduinoJson'); await page.locator('#library-search-form button').click();
  const row = page.locator('[data-library-id="64"] .library-item');
  await expect(row.locator('.library-meta')).toHaveText('bblanchon');
  const box = await row.evaluate(el => {
    const r = (node) => { const b = node.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, width: b.width }; };
    return { row: r(el), name: r(el.querySelector('strong')), meta: r(el.querySelector('.library-meta')) };
  });
  expect(box.meta.top).toBeGreaterThanOrEqual(box.name.bottom);
  expect(box.meta.width).toBeGreaterThan(box.row.width - 16); // 行の左右の余白（padding 6px ＋ 枠 1px）を引いた幅いっぱい
  await page.screenshot({ path: info.outputPath('library-list-two-line.png') });
});
test('library edits invalidate completed and in-flight artifacts and snapshot dependencies', async ({ page }) => {
  await mocks(page); await ready(page); let release, sent, delayed = false;
  await page.route('**/compile', async r => { sent = r.request().postDataJSON(); if (delayed) await new Promise(resolve => { release = resolve; }); await r.fulfill({ body: Buffer.alloc(512) }); });
  await page.click('#build'); await expect(page.locator('#download')).toBeVisible(); await add(page);
  await page.click('#libraries-close'); await expect(page.locator('#download')).toBeHidden();
  delayed = true; await page.click('#build'); await expect.poll(() => Boolean(release)).toBe(true); expect(sent.libraries).toEqual([lib]); expect(sent.projectId).toBe((await saved(page)).id);
  await page.click('#libraries-open'); await removeAdded(page); await page.click('#libraries-close');
  release(); await expect(page.locator('#status')).toContainText('以前の内容'); await expect(page.locator('#download')).toBeHidden();
});
test('library save failure and second tab preserve rescue JSON', async ({ page, context }, info) => {
  await mocks(page); await ready(page); const second = await context.newPage(); await mocks(second); await ready(second);
  await add(second); await second.click('#libraries-close'); await expect(second.locator('#save-status')).toContainText('別のタブ');
  const download = second.waitForEvent('download'); await menu(second, 'export'); const dest = info.outputPath('rescue.zip'); await (await download).saveAs(dest);
  // 保存できないタブからでも、いま画面にある依存ごと zip で退避できる。
  const rescued = new Map((await zipRead(new Uint8Array(await readFile(dest)))).map(e => [e.name.split('/').slice(1).join('/'), new TextDecoder().decode(e.data)]));
  expect(JSON.parse(rescued.get('digicode.json')).libraries).toEqual([lib]); expect((await saved(page)).libraries).toEqual([]);
  second.on('dialog', d => d.accept()); await second.close();
  await page.evaluate(() => { window.set = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await add(page); await page.click('#libraries-close'); await expect(page.locator('#save-status')).toContainText('保存できません');
  await named(page, 'new', 'blocked'); await expect(page.locator('#name-error')).toContainText('操作を止めました'); await page.click('#name-cancel');
  await page.evaluate(() => { Storage.prototype.setItem = window.set; }); await page.click('#save-retry'); expect((await saved(page)).libraries).toEqual([lib]);
});
test('server rejects malformed dependencies before compilation', async ({ request }) => {
  for (const libraries of [null, {}, [lib, lib], Array(33).fill(lib), [{ ...lib, id: '64' }], [{ ...lib, owner: 'https://x' }], [{ ...lib, name: 'x\nextra_scripts=evil' }], [{ ...lib, version: '' }], [{ ...lib, version: '7.4.3 extra' }], [{ ...lib, version: '7.4.3\nextra_scripts=evil' }], [{ ...lib, extra_scripts: 'x' }]]) {
    const res = await request.post('/compile', { data: { source, env: 'xiao_rp2040', libraries } }); expect(res.status()).toBe(400);
  }
  // Ranges, aliases, URLs and invented versions are safe strings that simply are not in the
  // Registry's version list: they are refused before the build, with the real versions named.
  for (const version of ['^7.0.0', 'file:///tmp/x', 'latest', '99.0.0']) {
    const res = await request.post('/compile', { data: { source, env: 'xiao_rp2040', libraries: [{ ...lib, version }] } });
    expect(res.status(), version).toBe(422);
    const body = await res.json();
    expect(body.stage).toBe('dependencies');
    expect(body.log).toContain('版がRegistryの版一覧に見つかりません');
    expect(body.log).toContain('利用可能: 7.4.3');
  }
  const res = await request.post('/compile', { data: { source, env: 'xiao_rp2040', libraries: [{ ...lib, id: 65 }] } });
  expect(res.status()).toBe(422); expect((await res.json()).stage).toBe('dependencies');
});
test('two-part Registry versions survive the search and details endpoints', async ({ request }) => {
  const details = await request.get('/libraries/details?owner=knolleary&name=PubSubClient');
  expect(details.status()).toBe(200);
  const body = await details.json();
  expect(body.id).toBe(89);
  expect(body.versions).toContain('2.8'); // verbatim; never rewritten to 2.8.0
  const search = await request.get('/libraries/search?q=PubSubClient');
  expect(search.status()).toBe(200);
  const found = await search.json();
  expect(found.items.map(p => `${p.owner}/${p.name}`)).toContain('knolleary/PubSubClient');
  expect(Array.isArray(found.excluded)).toBe(true); // dropped candidates are reported, not lost
});
test('Actual Registry add, RP2040 and C3 builds/downloads, deletion and concurrent project isolation', async ({ page, request }, info) => {
  test.setTimeout(1_200_000); await ready(page); await edit(page, source); await add(page); await page.click('#libraries-close');
  for (const env of ['xiao_rp2040', 'xiao_esp32c3']) {
    await selectBoard(page, env);
    const response = page.waitForResponse(r => r.url().endsWith('/compile'), { timeout: 600_000 });
    await page.click('#build');
    let bytes;
    if (env === 'xiao_rp2040') {
      await expect(page.locator('#download')).toBeVisible({ timeout: 600_000 });
      const downloading = page.waitForEvent('download'); await page.click('#download'); const download = await downloading;
      const dest = info.outputPath(download.suggestedFilename()); await download.saveAs(dest); bytes = await readFile(dest);
      expect(bytes.length % 512).toBe(0); for (let i=0;i<bytes.length;i+=512) { expect(bytes.readUInt32LE(i)).toBe(0x0a324655); expect(bytes.readUInt32LE(i+508)).toBe(0x0ab16f30); }
    } else {
      // ESP boards: the flash set stays in the browser for esptool-js; inspect the server response instead.
      await expect(page.locator('#flash')).toBeEnabled({ timeout: 600_000 }); await expect(page.locator('#download')).toBeHidden();
      bytes = await (await response).body(); const dest = info.outputPath('flashset-' + env + '.json'); await writeFile(dest, bytes);
      console.log(execFileSync('python3', ['tests/verify-c3.py', dest], { encoding: 'utf8' }));
    }
    console.log(env, bytes.length); await page.screenshot({ path: info.outputPath(`real-${env}.png`) });
  }
  await page.click('#libraries-open'); await removeAdded(page); await page.click('#libraries-close');
  await page.click('#build'); await expect(page.locator('#status')).toContainText('Build失敗（422）', { timeout: 600_000 }); await expect(page.locator('#log')).toContainText('ArduinoJson.h');
  const [a, b] = await Promise.all([
    request.post('/compile', { data: { source, env: 'xiao_rp2040', libraries: [lib], projectId: 'A' }, timeout: 600_000 }),
    request.post('/compile', { data: { source, env: 'xiao_rp2040', libraries: [], projectId: 'B' }, timeout: 600_000 }),
  ]);
  expect(a.status()).toBe(200); expect(b.status()).toBe(422); expect((await b.json()).log).toContain('ArduinoJson.h');
});
