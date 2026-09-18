import { test, expect } from '@playwright/test';
const item = { id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3', description: 'JSON library' };
async function ready(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); await page.click('#libraries-open'); }
const result = (q, page = 1) => ({ items: [{ ...item, description: q + ':' + page }], total: 20, more: page === 1 });
test('400ms debounce, immediate Enter/button and pending request deduplication', async ({ page }) => {
  let calls = [], release;
  await page.route('**/libraries/search?*', async r => { const q = new URL(r.request().url()).searchParams.get('q'); calls.push(q); if (q === 'pending') await new Promise(resolve => release = resolve); await r.fulfill({ json: result(q) }); });
  await ready(page); await page.clock.install(); await page.clock.pauseAt(new Date());
  await page.fill('#library-query', 'Ar'); await page.clock.runFor(250); expect(calls).toEqual([]);
  await page.fill('#library-query', 'Arduino'); await page.clock.runFor(399); expect(calls).toEqual([]);
  await page.clock.runFor(1); await expect.poll(() => calls.length).toBe(1);
  await expect(page.locator('#library-results strong')).toHaveText('ArduinoJson'); await expect(page.locator('#library-query')).toBeFocused();
  expect(await page.locator('#library-query').evaluate(el => el.selectionStart)).toBe(7);
  // 説明は箱の中。どの応答が描かれたかは名前を押して確かめる。
  await page.locator('#library-results .library-item').click();
  await expect(page.locator('#library-result-detail')).toContainText('Arduino:1');
  await page.fill('#library-query', 'enter'); await page.keyboard.press('Enter'); await expect.poll(() => calls.length).toBe(2);
  await page.clock.runFor(500); expect(calls.length).toBe(2);
  await page.fill('#library-query', 'button'); await page.locator('#library-search-form button').click(); await expect.poll(() => calls.length).toBe(3);
  await page.clock.runFor(500); expect(calls.length).toBe(3);
  await page.fill('#library-query', 'pending'); await page.keyboard.press('Enter'); await expect.poll(() => Boolean(release)).toBe(true);
  await page.keyboard.press('Enter'); await page.locator('#library-search-form button').click(); await page.clock.runFor(500); expect(calls).toEqual(['Arduino', 'enter', 'button', 'pending']);
  release(); await page.locator('#library-results .library-item').click();
  await expect(page.locator('#library-result-detail')).toContainText('pending:1');
});
test('IME composition and confirming Enter wait until 400ms after commit', async ({ page }) => {
  let calls = 0; await page.route('**/libraries/search?*', r => { calls++; return r.fulfill({ json: result('日本語') }); });
  await ready(page); await page.clock.install(); await page.clock.pauseAt(new Date());
  await page.locator('#library-query').evaluate(el => {
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); el.value = 'にほん';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await page.clock.runFor(800); await page.keyboard.press('Enter'); expect(calls).toBe(0);
  const prevented = await page.locator('#library-query').evaluate(el => {
    el.value = '日本語'; el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }); el.dispatchEvent(event); return event.defaultPrevented;
  });
  expect(prevented).toBe(true); await page.keyboard.press('Enter'); await page.clock.runFor(399); expect(calls).toBe(0);
  await page.clock.runFor(1); await expect.poll(() => calls).toBe(1); await expect(page.locator('#library-query')).toBeFocused();
});
test('clear/close cancel timers and stale search/details even if abort is ignored', async ({ page }) => {
  await page.addInitScript(() => { const original = window.fetch; window.fetch = (url, options) => original(url, String(url).startsWith('/libraries/') ? { ...options, signal: undefined } : options); });
  let calls = 0, releaseSearch, releaseDetails;
  await page.route('**/libraries/search?*', async r => { calls++; const q = new URL(r.request().url()).searchParams.get('q'); if (q === 'old') await new Promise(resolve => releaseSearch = resolve); await r.fulfill({ json: result(q) }); });
  await page.route('**/libraries/details?*', async r => { await new Promise(resolve => releaseDetails = resolve); await r.fulfill({ json: { ...item, versions: ['7.4.3'], frameworks: ['*'], platforms: ['*'] } }); });
  await ready(page); await page.fill('#library-query', 'waiting'); await page.fill('#library-query', '   '); await page.waitForTimeout(500); expect(calls).toBe(0);
  await page.fill('#library-query', 'waiting'); await page.click('#libraries-close'); await page.waitForTimeout(500); expect(calls).toBe(0);
  await page.click('#libraries-open'); await page.fill('#library-query', 'old'); await page.keyboard.press('Enter'); await expect.poll(() => Boolean(releaseSearch)).toBe(true);
  await page.fill('#library-query', 'new'); await expect(page.locator('#library-results')).toBeEmpty();
  await page.locator('#library-results .library-item').click();
  await expect(page.locator('#library-result-detail')).toContainText('new:1'); releaseSearch(); await page.waitForTimeout(100); await expect(page.locator('#library-result-detail')).not.toContainText('old:1');
  await page.locator('#library-results .library-version').click(); await expect.poll(() => Boolean(releaseDetails)).toBe(true);
  await page.fill('#library-query', ''); releaseDetails(); await page.waitForTimeout(100); await expect(page.locator('#library-results')).toBeEmpty(); await expect(page.locator('#library-next')).toBeHidden();
  releaseSearch = undefined; await page.fill('#library-query', 'old'); await page.keyboard.press('Enter'); await expect.poll(() => Boolean(releaseSearch)).toBe(true);
  await page.click('#libraries-close'); const state = await page.locator('#library-status').textContent(); releaseSearch(); await page.waitForTimeout(100); expect(await page.locator('#library-status').textContent()).toBe(state);
  await page.click('#libraries-open'); await expect(page.locator('#library-results')).toBeEmpty(); await expect(page.locator('#library-query')).toHaveValue('');
});
test('candidate pagination is a fixed deduplicated snapshot; failures retry explicitly', async ({ page }) => {
  let calls = [], failed = false;
  await page.route('**/libraries/search?*', r => {
    const q = new URL(r.request().url()).searchParams.get('q'); calls.push(q);
    if(q === 'retry' && !failed) { failed = true; return r.fulfill({ status:502,json:{error:'取得失敗'} }); }
    return r.fulfill({json:{items:Array.from({length:21},(_,i)=>({...item,id:i+1,name:`${q}-${i+1}`})),scope:'candidates',total:21}});
  });
  await ready(page); await page.fill('#library-query','first'); await expect(page.locator('#library-results li')).toHaveCount(10);
  await page.click('#library-next'); await expect(page.locator('#library-results')).toContainText('first-11');
  await page.click('#library-next'); await expect(page.locator('#library-results li')).toHaveCount(1); await expect(page.locator('#library-results')).toContainText('first-21');
  await page.click('#library-prev'); await expect(page.locator('#library-results')).toContainText('first-11'); expect(calls).toEqual(['first']);
  await page.fill('#library-query','retry'); await expect(page.locator('#library-status')).toContainText('取得失敗'); await page.waitForTimeout(600); expect(calls.length).toBe(2);
  await page.keyboard.press('Enter'); await expect(page.locator('#library-results')).toContainText('retry-1'); await expect(page.locator('#library-prev')).toBeHidden();
});
test('Real Registry automatic search and compact responsive layout', async ({ page }, info) => {
  await ready(page); await page.screenshot({ path: info.outputPath('search-empty.png') }); await page.fill('#library-query', 'ArduinoJson');
  const row = page.locator('[data-library-id="64"]'); await expect(row).toContainText('bblanchon', { timeout: 30000 }); await expect(page.locator('#library-query')).toBeFocused();
  await row.locator('.library-item').click(); await row.locator('.library-version').click();
  await row.locator('select').selectOption('7.4.3'); await row.getByRole('button', { name: 'プロジェクトに追加' }).click();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 850 }); await page.locator('#libraries-dialog').evaluate(el => el.scrollTop = 0);
    await page.screenshot({ path: info.outputPath(`search-${width}.png`), timeout: 20000 });
    expect(await page.locator('#libraries-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const query = await page.locator('#library-query').boundingBox(), added = await page.locator('.library-added-section').boundingBox(); expect(query.y + query.height).toBeLessThan(added.y);
    await page.locator('#libraries-dialog').evaluate(el => el.scrollTop = 700);
    const pinned = await page.locator('#library-query').boundingBox(), dialog = await page.locator('#libraries-dialog').boundingBox();
    expect(pinned.y).toBeGreaterThanOrEqual(dialog.y); expect(pinned.y + pinned.height).toBeLessThan(dialog.y + 110);
    if (width === 320) await page.screenshot({ path: info.outputPath('search-scrolled-320.png') });
  }
});
