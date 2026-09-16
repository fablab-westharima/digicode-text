import { createHash } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { selectBoard } from './shell.js';

// Wio Node (ESP8266) runs the same browser path as the C3: one flash set from the server,
// flashed by esptool-js. Only the flash set differs (one image at 0x0), so this test asserts
// the UI treats it like any other flash-set board and the packaged images are what the env says.
test('Actual Wio Node hello build, flash set metadata and image checks', async ({ page }, info) => {
  test.setTimeout(900000);
  await page.goto('/'); await expect(page.locator('#build')).toBeEnabled();
  await selectBoard(page, 'wio_node'); await page.reload();
  await expect(page.locator('#env')).toHaveValue('wio_node');
  const response = page.waitForResponse(r => r.url().endsWith('/compile'));
  await page.click('#build');
  await expect(page.locator('#flash')).toBeEnabled({ timeout: 600000 });
  await expect(page.locator('#download')).toBeHidden();
  const res = await response; expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/json');
  expect(res.headers()['content-disposition']).toBeUndefined();
  const body = await res.body();
  expect(createHash('sha256').update(body).digest('hex')).toBe(res.headers()['x-artifact-sha256']);
  const path = info.outputPath('wio-node.flashset.json'); await writeFile(path, body);
  await expect(page.locator('#log')).toContainText('firmware.bin @ 0x0');
  const result = execFileSync('python3', [new URL('./verify-wio-node.py', import.meta.url).pathname, path], { encoding: 'utf8' });
  console.log('wio_node: ' + result.trim());
  await page.screenshot({ path: info.outputPath('real-wio-node.png') });
  // Switching away invalidates the artifact for this board too; nothing here is board-specific in the UI.
  await selectBoard(page, 'pico'); await expect(page.locator('#flash')).toBeHidden();
});
