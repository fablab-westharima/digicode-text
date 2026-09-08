import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const key = 'digicode-text.draft.v1';
async function ready(page) {
  await page.goto('/');
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await expect(page.locator('#build')).toBeEnabled();
}
async function edit(page, source) {
  await page.locator('.monaco-editor .view-lines').click();
  await page.keyboard.press('ControlOrMeta+A');
  if (source) await page.keyboard.insertText(source);
  else await page.keyboard.press('Backspace');
}
async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
}

test('Monaco editing, indentation, undo/redo, resize, draft/board/empty restoration', async ({ page }) => {
  const external = [], errors = [];
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:3100/') && !r.url().startsWith('blob:')) external.push(r.url()); });
  page.on('pageerror', e => errors.push(String(e)));
  await ready(page);
  await expect(page.locator('.line-numbers').first()).toHaveText('1');
  await edit(page, 'void setup() {');
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft'); // Monaco auto-closes the brace; enter inside it.
  await page.keyboard.press('Enter');
  expect((await saved(page)).source).toMatch(/\n  /);
  await edit(page, '// retained draft');
  await page.keyboard.press('End');
  await page.keyboard.type(' xyz');
  const beforeUndo = (await saved(page)).source;
  await page.keyboard.press('ControlOrMeta+Z');
  expect((await saved(page)).source).not.toBe(beforeUndo);
  await page.keyboard.press('ControlOrMeta+Shift+Z');
  expect((await saved(page)).source).toBe(beforeUndo);
  await page.selectOption('#env', 'pico');
  await page.reload();
  await expect(page.locator('#save-status')).toContainText('復元');
  await expect(page.locator('#env')).toHaveValue('pico');
  await expect(page.locator('.view-lines')).toContainText('// retained draft xyz');
  await page.setViewportSize({ width: 480, height: 650 });
  await expect.poll(async () => (await page.locator('.monaco-editor').boundingBox()).width).toBeLessThanOrEqual(480);
  await edit(page, '');
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  expect((await saved(page)).source).toBe('');
  await expect(page.locator('.view-lines')).not.toContainText('hello');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

for (const failure of ['invalid-json', 'invalid-schema', 'quota', 'read-denied']) {
  test(`Storage ${failure} keeps editor and Build usable`, async ({ page }) => {
    await page.addInitScript(({ key, failure }) => {
      if (failure === 'invalid-json') localStorage.setItem(key, '{broken');
      if (failure === 'invalid-schema') localStorage.setItem(key, JSON.stringify({ version: 1, source: 7, env: 'unknown' }));
      if (failure === 'quota') Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
      if (failure === 'read-denied') {
        Storage.prototype.getItem = () => { throw new DOMException('denied', 'SecurityError'); };
        Storage.prototype.setItem = () => { throw new DOMException('denied', 'SecurityError'); };
      }
    }, { key, failure });
    await ready(page);
    if (failure.startsWith('invalid') || failure === 'read-denied') await expect(page.locator('#save-status')).toContainText('読み込めません');
    if (failure === 'invalid-json') expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('{broken');
    let sent;
    await page.route('**/compile', async route => {
      sent = route.request().postDataJSON();
      await route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ log: 'test compile error' }) });
    });
    await edit(page, '// build despite storage failure');
    if (failure === 'quota' || failure === 'read-denied') await expect(page.locator('#save-status')).toContainText('保存できません');
    await page.click('#build');
    await expect(page.locator('#status')).toContainText('Build失敗（422）');
    expect(sent.source).toBe('// build despite storage failure');
    await expect(page.locator('#build')).toBeEnabled();
  });
}

test('UF2 links invalidated by code/board changes, including edits during Build', async ({ page }) => {
  await ready(page);
  let release, sent, calls = 0;
  let delayed = false;
  await page.route('**/compile', async route => {
    calls++;
    sent = route.request().postDataJSON();
    if (delayed) await new Promise(resolve => { release = resolve; });
    await route.fulfill({ status: 200, contentType: 'application/octet-stream', body: Buffer.alloc(512) });
  });
  await page.click('#build');
  await expect(page.locator('#download')).toBeVisible();
  await edit(page, '// changed');
  await expect(page.locator('#download')).toBeHidden();
  await expect(page.locator('#download')).not.toHaveAttribute('href');
  await page.click('#build');
  await expect(page.locator('#download')).toBeVisible();
  await page.selectOption('#env', 'pico');
  await expect(page.locator('#download')).toBeHidden();
  delayed = true;
  for (const change of ['code', 'board']) {
    release = undefined;
    await page.selectOption('#env', 'xiao_rp2040');
    await page.click('#build');
    await expect.poll(() => Boolean(release)).toBe(true);
    await expect(page.locator('#build')).toBeDisabled();
    const count = calls;
    await page.locator('#build').evaluate(el => el.click());
    expect(calls).toBe(count);
    expect(sent.env).toBe('xiao_rp2040');
    if (change === 'code') await edit(page, '// changed during build');
    else await page.selectOption('#env', 'pico');
    release();
    await expect(page.locator('#status')).toContainText('再Build');
    await expect(page.locator('#build')).toBeEnabled();
    await expect(page.locator('#download')).toBeHidden();
    await expect(page.locator('#download')).not.toHaveAttribute('href');
  }
});

test('Actual edited XIAO build, browser download, UF2 validation, gcc error display', async ({ page }, testInfo) => {
  const main = new URL('../compiler/pio-rp2040/src/main.cpp', import.meta.url);
  const original = await readFile(main);
  try {
    await ready(page);
    await edit(page, original.toString().replace('"hello"', '"hello Monaco"'));
    await page.reload();
    await expect(page.locator('#save-status')).toContainText('復元');
    await expect(page.locator('.view-lines')).toContainText('hello Monaco');
    await page.click('#build');
    await expect(page.locator('#download')).toBeVisible({ timeout: 100_000 });
    await expect(page.locator('#status')).toContainText('Build成功');
    const downloading = page.waitForEvent('download');
    await page.click('#download');
    const download = await downloading;
    expect(download.suggestedFilename()).toBe('firmware-xiao_rp2040.uf2');
    const destination = testInfo.outputPath('firmware-xiao_rp2040.uf2');
    await download.saveAs(destination);
    const bytes = await readFile(destination);
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes.length % 512).toBe(0);
    for (let offset = 0; offset < bytes.length; offset += 512) {
      expect(bytes.readUInt32LE(offset)).toBe(0x0a324655);
      expect(bytes.readUInt32LE(offset + 4)).toBe(0x9e5d5157);
      expect(bytes.readUInt32LE(offset + 8)).toBe(0x2000);
      expect(bytes.readUInt32LE(offset + 12)).toBe(0x10000000 + offset / 2);
      expect(bytes.readUInt32LE(offset + 16)).toBe(256);
      expect(bytes.readUInt32LE(offset + 20)).toBe(offset / 512);
      expect(bytes.readUInt32LE(offset + 24)).toBe(bytes.length / 512);
      expect(bytes.readUInt32LE(offset + 28)).toBe(0xe48bff56);
      expect(bytes.readUInt32LE(offset + 508)).toBe(0x0ab16f30);
    }
    expect(bytes.equals(await readFile(new URL('../compiler/pio-rp2040/.pio/build/xiao_rp2040/firmware.uf2', import.meta.url)))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('build-success.png'), fullPage: true });
    await edit(page, '#include <Arduino.h>\nvoid setup(){ Serial.begin(115200) }\nvoid loop(){}\n');
    await page.click('#build');
    await expect(page.locator('#status')).toContainText('Build失敗（422）', { timeout: 100_000 });
    await expect(page.locator('#log')).toContainText('error:');
    expect(await page.locator('#log').evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await expect(page.locator('#download')).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath('compile-error.png'), fullPage: true });
  } finally {
    await writeFile(main, original);
  }
});
