import { createHash } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const key = 'digicode-text.projects.v1';
const sample = new URL('../examples/xiao-esp32c3-wifi.digicode.json', import.meta.url);
async function ready(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); }
async function open(page) { await page.click('#projects-open'); }
async function saved(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }

test('C3 menu keyboard, restore, duplicate, import/export, narrow layout and stale artifacts (mock)', async ({ page }, info) => {
  await ready(page); await expect(page.locator('#save-retry')).toBeHidden();
  await page.locator('#projects-open').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#file-menu')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#file-menu')).toBeHidden();
  await page.selectOption('#env', 'xiao_esp32c3'); await page.reload();
  await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
  await open(page); await page.click('#project-duplicate'); await page.fill('#name-input', 'C3 無線テスト ' + '長い名前'.repeat(12));
  await page.locator('#name-form button[type=submit]').click();
  await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
  await open(page);
  const downloading = page.waitForEvent('download'); await page.click('#project-export');
  const download = await downloading; const exported = info.outputPath('c3-project.json'); await download.saveAs(exported);
  expect(JSON.parse(await readFile(exported,'utf8')).env).toBe('xiao_esp32c3');
  await page.locator('#project-file').setInputFiles(exported);
  await expect(page.locator('#project-notice')).toContainText('読み込みました');
  expect((await saved(page)).projects).toHaveLength(3);
  await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
  let release;
  await page.route('**/compile', async route => { await new Promise(r => { release = r; }); await route.fulfill({ status: 200, contentType:'application/zip',body:Buffer.from('mock zip') }); });
  await page.click('#build'); await expect.poll(() => Boolean(release)).toBe(true);
  await page.selectOption('#env','pico'); release();
  await expect(page.locator('#status')).toContainText('再Build'); await expect(page.locator('#download')).toBeHidden();
  await page.selectOption('#env','xiao_esp32c3'); release = undefined; await page.click('#build');
  await expect.poll(() => Boolean(release)).toBe(true); release(); await expect(page.locator('#download')).toContainText('BINセット');
  await page.selectOption('#env','pico'); await expect(page.locator('#download')).toBeHidden();
  await page.selectOption('#env','xiao_esp32c3');
  await page.click('#panel-toggle');
  for (const width of [1440, 1100, 390]) {
    await page.setViewportSize({width,height:850});
    await page.screenshot({path:info.outputPath(`workspace-${width}.png`)});
    const box = await page.locator('#build').boundingBox(); expect(box.x+box.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await open(page); await page.screenshot({path:info.outputPath(`menu-${width}.png`)});
    for (const id of ['project-new','project-open-list','project-rename','project-duplicate','project-delete','project-import','project-export']) {
      await expect(page.locator('#'+id)).toBeVisible(); const r = await page.locator('#'+id).boundingBox(); expect(r.x+r.width).toBeLessThanOrEqual(width);
    }
    await page.keyboard.press('Escape');
  }
});

test('Actual C3 hello and WiFi builds, ZIP metadata and binary equality', async ({ page }, info) => {
  test.setTimeout(900000);
  const main = new URL('../compiler/pio-esp32c3/src/main.cpp', import.meta.url);
  const original = await readFile(main);
  try {
    await ready(page); await page.selectOption('#env','xiao_esp32c3');
    for (const kind of ['hello','wifi']) {
      if (kind === 'wifi') { await page.locator('#project-file').setInputFiles(sample.pathname); await expect(page.locator('#project-notice')).toContainText('読み込みました'); }
      await page.reload(); await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
      const response = page.waitForResponse(r => r.url().endsWith('/compile'));
      await page.click('#build');
      await expect(page.locator('#download')).toBeVisible({timeout:600000});
      const res=await response; expect(res.status()).toBe(200); expect(res.headers()['content-type']).toBe('application/zip');
      expect(res.headers()['content-disposition']).toContain('firmware-xiao_esp32c3.zip');
      const downloading=page.waitForEvent('download'); await page.click('#download'); const download=await downloading;
      expect(download.suggestedFilename()).toBe('firmware-xiao_esp32c3.zip');
      const path=info.outputPath(kind+'.zip'); await download.saveAs(path);
      expect(createHash('sha256').update(await readFile(path)).digest('hex')).toBe(res.headers()['x-artifact-sha256']);
      const result=execFileSync('python3',[new URL('./verify-c3.py',import.meta.url).pathname,path],{encoding:'utf8'});
      console.log(kind+': '+result.trim());
      await page.screenshot({path:info.outputPath('real-c3-'+kind+'.png')});
    }
  } finally { await writeFile(main,original); }
});
