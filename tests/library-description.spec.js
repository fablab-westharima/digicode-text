import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await page.click('#libraries-open');
}

test('descriptions are readable text without active markup or resource requests', async ({ page }) => {
  const samples = [
    ['Plain C++: std::vector<int>, #include <Arduino.h>, a < b && b > c.', 'Plain C++: std::vector<int>, #include <Arduino.h>, a < b && b > c.'],
    ['one<br>two<br/>three<BR />four', 'one\ntwo\nthree\nfour'],
    ['<p>First <b>bold</b> paragraph.</p><div>Next</div><ul><li>A</li><li>B</li></ul>', 'First bold paragraph.\n\nNext\n\nA\n\nB'],
    ['&amp; &lt; &gt; &quot; &apos; &copy; &hellip; &#65; &#x1F600; A&nbsp; B', '& < > " \' © … A 😀 A B'],
    ['  a \t b <br><br><br><br> c  ', 'a b\n\nc'],
    ['before<script>window.descriptionExecuted = true; fetch("https://description.invalid/script")</script><style>@import "https://description.invalid/style";</style>after', 'before after'],
    ['<img src="https://description.invalid/image" onerror="window.descriptionExecuted=true"><p onclick="window.descriptionExecuted=true">Click</p><iframe src="https://description.invalid/frame"></iframe><a href="javascript:window.descriptionExecuted=true">link</a>', 'Click\nlink'],
    ['&lt;img src=&quot;https://description.invalid/encoded&quot;&gt; <code>std::vector&lt;int&gt;</code>', '<img src="https://description.invalid/encoded"> std::vector<int>'],
    ['<!-- hidden -->Keep<script>truncated script', 'Keep'],
    ['<span title="a > b">Text</span><style>truncated CSS', 'Text'],
  ];
  const requests = [];
  page.on('request', request => { if (request.url().includes('description.invalid')) requests.push(request.url()); });
  await page.route('https://description.invalid/**', route => route.abort());
  await page.route('**/libraries/search?*', route => route.fulfill({ json: {
    items: samples.map(([description], i) => ({ id: i + 1, owner: 'test', name: `Example ${i}`, version: '1.0.0', description })),
    scope: 'candidates', total: samples.length,
  } }));
  await open(page);
  await page.fill('#library-query', 'example');
  const descriptions = page.locator('.library-description');
  await expect(descriptions).toHaveCount(samples.length);
  expect(await descriptions.allTextContents()).toEqual(samples.map(([, expected]) => expected));
  expect(await descriptions.evaluateAll(nodes => nodes.every(node => node.children.length === 0))).toBe(true);
  await descriptions.nth(6).click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.descriptionExecuted)).toBeUndefined();
  expect(requests).toEqual([]);
  await expect(descriptions.first()).toHaveCSS('white-space', 'pre-line');
});

test('real Registry Servo description uses line breaks at desktop and narrow widths', async ({ page }, info) => {
  let source;
  page.on('response', async response => {
    if (response.url().includes('/libraries/search?') && response.ok()) source = await response.json();
  });
  await open(page);
  await page.fill('#library-query', 'servo');
  const row = page.locator('[data-library-id="883"]');
  await expect(row).toBeVisible({ timeout: 30000 });
  await expect.poll(() => Boolean(source)).toBe(true);
  const original = source.items.find(item => item.id === 883);
  expect(original.owner).toBe('arduino-libraries');
  expect(original.name).toBe('Servo');
  // Prove the real response contains the markup this regression fixes.
  expect(original.description).toMatch(/<br\s*\/?\s*>/i);
  const description = row.locator('.library-description');
  expect(await description.textContent()).not.toMatch(/<br\s*\/?\s*>/i);
  expect(await description.textContent()).toContain('\n');
  await info.attach('registry-servo-description', { body: JSON.stringify(original, null, 2), contentType: 'application/json' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 850 });
    await row.scrollIntoViewIfNeeded();
    expect(await page.locator('#libraries-dialog').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await description.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`servo-description-${width}.png`) });
  }
});
