import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
}
async function fits(page) {
  const size = await page.evaluate(() => ({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }));
  expect(size.sw).toBeLessThanOrEqual(size.w);
  expect(size.sh).toBeLessThanOrEqual(size.h);
  for (const id of ['env', 'build', 'panel-toggle']) {
    const r = await page.locator('#' + id).boundingBox();
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(size.w);
    expect(r.y + r.height).toBeLessThanOrEqual(size.h);
  }
}

test('Dark is fixed despite light OS and legacy preference; draft and layout survive', async ({ page }, info) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#theme-toggle')).toHaveCount(0);
  await expect(page.locator('.monaco-editor')).toHaveClass(/vs-dark/);
  await page.screenshot({ path: info.outputPath('dark-fixed.png') });
  const draft = { version: 1, source: '// existing draft', env: 'pico' };
  await page.evaluate(draft => {
    localStorage.removeItem('digicode-text.projects.v1');
    localStorage.setItem('digicode-text.theme.v1', 'light');
    localStorage.setItem('digicode-text.draft.v1', JSON.stringify(draft));
  }, draft);
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.monaco-editor')).toHaveClass(/vs-dark/);
  await expect(page.locator('.view-lines')).toContainText('existing draft');
  await expect(page.locator('#env')).toHaveValue('pico');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('digicode-text.draft.v1')))).toEqual(draft);
  expect(await page.evaluate(() => localStorage.getItem('digicode-text.theme.v1'))).toBe('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('.monaco-editor')).toHaveClass(/vs-dark/);
  await fits(page);
  await page.setViewportSize({ width: 390, height: 700 });
  await fits(page);
  await page.click('#serial-tab');
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await expect(page.locator('#monitor')).toBeVisible();
  await page.screenshot({ path: info.outputPath('narrow-serial.png') });
  await fits(page);
  await page.route('**/compile', route => route.fulfill({ status: 200, contentType: 'application/octet-stream', body: Buffer.alloc(512) }));
  await page.click('#build');
  await expect(page.locator('#download')).toBeVisible();
  await page.screenshot({ path: info.outputPath('narrow-success-mock.png') });
  for (const width of [390, 770, 800]) {
    await page.setViewportSize({ width, height: 700 });
    await fits(page);
    const download = await page.locator('#download').boundingBox();
    expect(download.x + download.width).toBeLessThanOrEqual(width);
    const build = await page.locator('#build').boundingBox();
    expect(download.y >= build.y + build.height || download.x >= build.x + build.width).toBe(true);
  }
});

test('Panel keyboard/pointer resize, tabs, collapse, long logs and error auto-open', async ({ page }, info) => {
  await ready(page);
  await page.click('#serial-tab');
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await page.screenshot({ path: info.outputPath('serial-disconnected.png') });
  const handle = page.locator('#panel-resize');
  const height = Number(await handle.getAttribute('aria-valuenow'));
  await handle.focus();
  await page.keyboard.press('ArrowUp');
  expect(Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThan(height);
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 60);
  await page.mouse.up();
  expect(Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThan(height + 24);
  await page.screenshot({ path: info.outputPath('panel-resized.png') });
  await page.locator('#serial-tab').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#build-tab')).toBeFocused();
  await expect(page.locator('#build-output')).toBeVisible();
  let release;
  const log = 'test error: ' + 'long-source-line '.repeat(250) + '\n' + 'diagnostic\n'.repeat(200);
  await page.route('**/compile', async route => {
    await new Promise(resolve => { release = resolve; });
    await route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ log }) });
  });
  await page.click('#build');
  await expect.poll(() => Boolean(release)).toBe(true);
  await expect(page.locator('#build-phase')).toContainText('実行中');
  await page.screenshot({ path: info.outputPath('building-mock.png') });
  await page.click('#panel-toggle');
  await expect(page.locator('#panel-body')).toBeHidden();
  release();
  await expect(page.locator('#build-output')).toBeVisible();
  await expect(page.locator('#status')).toContainText('Build失敗');
  const overflow = await page.locator('#log').evaluate(el => ({ x: el.scrollWidth > el.clientWidth, y: el.scrollHeight > el.clientHeight }));
  expect(overflow).toEqual({ x: true, y: true });
  await fits(page);
  // Clipboard denial must leave the full log selectable, not lose its contents.
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
  await page.click('#copy-build');
  await expect(page.locator('#ui-notice')).toContainText('選択');
  expect(await page.evaluate(() => getSelection().toString())).toContain(log.trimEnd());
  await page.click('#panel-toggle');
  await expect(page.locator('#panel-body')).toBeHidden();
  await page.click('#panel-toggle');
  await expect(page.locator('#log')).toContainText(log);
});
