import { test, expect } from '@playwright/test';
import { contract, responseText, codeCandidate } from '../web/ai-client.js';
const code = '#include <Arduino.h>\nvoid setup() {}\nvoid loop() { delay(42); }\n';
const answer = '変更しました。\n```cpp\n' + code + '```';
const response = text => ({ status: 'completed', output: [{ type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text }] }] });
const projectKey = 'digicode-text.projects.v1';
async function source(page) { return page.evaluate(key => { const d = JSON.parse(localStorage.getItem(key)); return d.projects.find(p => p.id === d.activeId).source; }, projectKey); }
async function edit(page, text) { await page.locator('#editor .view-lines').click(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.insertText(text); }
async function settings(page, provider = 'openai', model) {
  await page.click('#ai-settings-open'); await page.selectOption('#ai-provider', provider);
  await page.fill('#ai-key', provider === 'openai' ? 'dummy-openai-test-only' : 'dummy-claude-test-only');
  if (model) await page.fill('#ai-model', model);
  await page.click('#ai-save'); await page.click('#ai-settings-close');
}
async function ready(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); await page.click('#ai-open'); await settings(page); await page.fill('#ai-prompt', 'LEDを点滅させる'); }
test.beforeEach(async ({ context }) => {
  // All external HTTP traffic is denied unless a test-specific route fulfills it.
  await context.route(/^https?:\/\//, route => new URL(route.request().url()).origin === 'http://127.0.0.1:3100' ? route.continue() : route.abort());
  await context.addInitScript(() => {
    if (navigator.serial) {
      navigator.serial.getPorts = () => { throw new Error('serial forbidden'); };
      navigator.serial.requestPort = () => { throw new Error('serial forbidden'); };
    }
  });
});

test('contracts and strict response parsing', () => {
  for (const [provider, model, api] of [['openai','gpt-5-mini','responses'], ['openai','gpt-5.3-codex','responses'], ['openai','gpt-4.1-mini','chat'], ['claude','claude-sonnet-5','messages']]) {
    const c = contract(provider, { model, api, key: 'dummy' }, 'system', [{ role: 'user', content: 'hello' }]);
    expect(c.body.model).toBe(model); expect(c.body.temperature).toBeUndefined(); expect(c.body.max_tokens ?? c.body.max_output_tokens ?? c.body.max_completion_tokens).toBe(16384);
    expect(c.url).toMatch(provider === 'openai' ? /^https:\/\/api.openai.com\/v1\// : /^https:\/\/api.anthropic.com\/v1\/messages$/);
  }
  expect(codeCandidate(answer).source).toBe(code);
  expect(codeCandidate('```cpp\nconst char *s = "...";\n```').source).toContain('"..."');
  for (const bad of ['', '```cpp\nx', '```cpp\nx\n```\n```cpp\ny\n```', '```json\n{}\n```']) expect(() => codeCandidate(bad)).toThrow();
  expect(responseText('responses', response(answer))).toBe(answer);
  for (const bad of [{ status: 'incomplete' }, response(''), { ...response(answer), output: [...response(answer).output, ...response(answer).output] }, response('x'.repeat(262145))]) expect(() => responseText('responses', bad)).toThrow();
  for (const stop of ['length', 'tool_calls', 'content_filter', null]) expect(() => responseText('chat', { choices: [{ finish_reason: stop, message: { content: answer } }] })).toThrow();
  expect(() => responseText('chat', { choices: [{ finish_reason: 'stop', message: { content: answer, refusal: 'no' } }] })).toThrow(/拒否/);
  for (const stop of ['max_tokens', 'refusal', 'pause_turn', 'tool_use', 'model_context_window_exceeded', null]) expect(() => responseText('messages', { stop_reason: stop, content: [{ type: 'text', text: answer }] })).toThrow();
  expect(() => responseText('messages', { stop_reason: 'end_turn', content: [{ type: 'text', text: answer }, { type: 'text', text: answer }] })).toThrow();
});

test('direct routes, provider-separated storage, consultation to generation, auto apply and Undo/Redo invalidate Build', async ({ page }) => {
  const requests = [];
  await page.route('https://api.openai.com/**', async route => { requests.push(route.request()); await route.fulfill({ json: response(requests.length === 1 ? '相談の回答 <img src=x onerror=alert(1)>' : answer) }); });
  await page.route('https://api.anthropic.com/**', async route => { requests.push(route.request()); await route.fulfill({ json: { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Claude回答' }] } }); });
  const localBodies = []; page.on('request', r => { if (r.url().startsWith('http://127.0.0.1:3100')) localBodies.push(r.postData() || ''); });
  await ready(page); expect(requests).toHaveLength(0);
  const original = await source(page);
  await page.click('#ai-consult'); await expect(page.locator('#ai-status')).toContainText('回答完了'); expect(await source(page)).toBe(original);
  expect(await page.locator('#ai-result img').count()).toBe(0);
  await page.click('#ai-generate'); await expect(page.locator('#ai-status')).toContainText('適用済み'); expect(await source(page)).toBe(code);
  expect(requests[1].postDataJSON().input[1].content).toContain('相談の回答');
  expect(requests[0].headers().authorization).toBe('Bearer dummy-openai-test-only');
  expect(requests[0].url()).toBe('https://api.openai.com/v1/responses');
  await page.route('**/compile', route => route.fulfill({ body: Buffer.alloc(50), contentType: 'application/octet-stream' }));
  await page.click('#build'); await expect(page.locator('#download')).toBeVisible();
  await page.locator('#editor .view-lines').click(); await page.keyboard.press('ControlOrMeta+Z'); expect(await source(page)).toBe(original); await expect(page.locator('#download')).toBeHidden();
  await page.click('#build'); await expect(page.locator('#download')).toBeVisible();
  await page.locator('#editor .view-lines').click(); await page.keyboard.press('ControlOrMeta+Shift+Z'); expect(await source(page)).toBe(code); await expect(page.locator('#download')).toBeHidden();
  await settings(page, 'claude'); await page.click('#ai-consult'); await expect(page.locator('#ai-result')).toHaveText('Claude回答');
  expect(requests[2].headers()['x-api-key']).toBe('dummy-claude-test-only'); expect(requests[2].headers().authorization).toBeUndefined(); expect(requests[2].headers()['anthropic-dangerous-direct-browser-access']).toBe('true');
  expect(requests[2].postData()).not.toContain('相談の回答');
  expect(localBodies.join('')).not.toContain('dummy-');
  expect(await page.evaluate(k => localStorage.getItem(k), projectKey)).not.toContain('dummy-');
  await page.locator('#ai-pane summary').click(); await page.click('#ai-clear'); expect(await source(page)).toBe(code);
  await page.reload(); await expect(page.locator('#build')).toBeEnabled(); await page.click('#ai-open');
  await page.click('#ai-settings-open'); await expect(page.locator('#ai-key')).toHaveValue('dummy-openai-test-only');
  await page.selectOption('#ai-provider','claude'); await expect(page.locator('#ai-key')).toHaveValue('dummy-claude-test-only');
  await page.click('#ai-delete'); await expect(page.locator('#ai-key')).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('digicode-text.ai.claude.v1'))).toBeNull();
});

test('review diff, captured mode, late edit, cancel and stale finally', async ({ page }, info) => {
  let release; let count = 0;
  await page.route('https://api.openai.com/**', async route => { count++; await new Promise(r => { release = r; }); await route.fulfill({ json: response(answer) }).catch(() => {}); });
  await ready(page); const original = await source(page);
  await page.selectOption('#ai-mode','review'); await page.click('#ai-generate'); await expect.poll(() => count).toBe(1);
  await page.selectOption('#ai-mode','auto'); await page.click('#ai-close'); await page.click('#ai-open');
  await page.locator('#ai-prompt').press('Enter'); expect(count).toBe(1);
  release(); await expect(page.locator('#ai-proposal')).toBeVisible(); expect(await source(page)).toBe(original);
  await page.screenshot({ path: info.outputPath('ai-desktop-diff.png') });
  await page.click('#ai-apply'); expect(await source(page)).toBe(code);
  await page.locator('#editor .view-lines').click(); await page.keyboard.press('ControlOrMeta+Z'); expect(await source(page)).toBe(original);
  await page.keyboard.press('ControlOrMeta+Shift+Z'); expect(await source(page)).toBe(code);
  await page.selectOption('#ai-mode','review'); await page.click('#ai-generate'); await expect.poll(() => count).toBe(2); release(); await expect(page.locator('#ai-proposal')).toBeVisible();
  await edit(page, '// manual edit'); await expect(page.locator('#ai-apply')).toBeDisabled(); await expect(page.locator('#ai-proposal-note')).toContainText('古い提案'); expect(await source(page)).toBe('// manual edit');
  await page.click('#ai-generate'); await expect.poll(() => count).toBe(3); const oldRelease = release; await page.click('#ai-cancel');
  await page.click('#ai-generate'); await expect.poll(() => count).toBe(4); oldRelease(); await expect(page.locator('#ai-generate')).toBeDisabled(); release(); await expect(page.locator('#ai-generate')).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: info.outputPath('ai-narrow.png') });
  await page.locator('#ai-apply').scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath('ai-narrow-diff.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.reload(); await expect(page.locator('#build')).toBeEnabled(); await page.click('#ai-open'); await expect(page.locator('#ai-mode')).toHaveValue('review');
  await page.click('#ai-settings-open'); await page.screenshot({ path: info.outputPath('ai-settings-narrow.png') });
});

test('pending edits, board changes, A→B→A and settings invalidation never overwrite', async ({ page }) => {
  let release, count = 0;
  await page.route('https://api.openai.com/**', async route => { count++; await new Promise(r => { release = r; }); await route.fulfill({ json: response(answer) }).catch(() => {}); });
  await ready(page);
  for (const change of [async () => edit(page, '// changed'), async () => page.selectOption('#env', 'pico'), async () => {
    await page.click('#projects-open'); await page.click('#project-new'); await page.fill('#name-input', 'B'); await page.locator('#name-form button[type=submit]').click();
    await page.click('#projects-open'); await page.click('#project-open-list'); await page.locator('.project-item').filter({ hasText: 'はじめてのプロジェクト' }).click();
  }]) {
    const expected = count + 1; await page.click('#ai-generate'); await expect.poll(() => count).toBe(expected); await change(); const before = await source(page); release(); await expect(page.locator('#ai-status')).toContainText('古い提案'); expect(await source(page)).toBe(before);
  }
  await page.click('#ai-generate'); await expect.poll(() => count).toBe(4); await page.click('#ai-settings-open'); await page.click('#ai-delete'); await page.click('#ai-settings-close'); release(); await expect(page.locator('#ai-generate')).toBeEnabled(); expect(await source(page)).toBe('// changed');
});

test('HTTP errors, malformed output, timeout and save failure recover without retry', async ({ page }) => {
  let status = 401, payload = response(answer), count = 0, hold = false;
  await page.route('https://api.openai.com/**', async route => { count++; if (hold) return; await route.fulfill({ status, json: payload }); });
  await ready(page); const original = await source(page);
  for (const code of [400,401,403,404,429,500]) { status = code; await page.click('#ai-generate'); await expect(page.locator('#ai-status')).toContainText(`HTTP ${code}`); await expect(page.locator('#ai-generate')).toBeEnabled(); }
  status = 200;
  for (const bad of [response(''), { status: 'incomplete' }, response('```cpp\nunfinished'), { ...response(answer), output: [] }]) { payload = bad; await page.click('#ai-generate'); await expect(page.locator('#ai-generate')).toBeEnabled(); expect(await source(page)).toBe(original); }
  expect(count).toBe(10);
  await page.clock.install(); hold = true; await page.click('#ai-generate'); await expect.poll(() => count).toBe(11); await page.clock.fastForward(180001); await expect(page.locator('#ai-status')).toContainText('タイムアウト');
  hold = false; payload = response(answer);
  await page.evaluate(() => { window.savedSet = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { if (k === 'digicode-text.projects.v1') throw new Error('quota'); return window.savedSet.call(this,k,v); }; });
  await page.click('#ai-generate'); await expect(page.locator('#ai-status')).toContainText('適用済み・未保存'); await expect(page.locator('#editor .view-lines')).toContainText('delay(42)'); expect(await source(page)).toBe(original);
  await page.evaluate(() => { Storage.prototype.setItem = window.savedSet; }); await page.click('#save-retry'); expect(await source(page)).toBe(code);
});

test('Build failure snapshot, context, and IME', async ({ page }) => {
  const requests = [];
  await page.route('https://api.openai.com/**', async route => { requests.push(route.request().postDataJSON()); await route.fulfill({ json: response('依存を確認してください') }); });
  await page.route('**/compile', route => route.fulfill({ status: 422, json: { stage: 'dependencies', error: '取得失敗', log: 'unique-build-error' } }));
  await ready(page); await page.click('#ai-build-help'); await expect(page.locator('#ai-status')).toContainText('一致するBuild失敗がありません'); expect(requests).toHaveLength(0);
  await page.click('#build'); await expect(page.locator('#status')).toContainText('Build失敗'); await page.click('#ai-build-help'); await expect(page.locator('#ai-status')).toContainText('回答完了');
  expect(requests[0].input.at(-1).content).toContain('unique-build-error'); expect(requests[0].input.at(-1).content).toContain('dependencies');
  await edit(page, '// newer'); await page.click('#ai-build-help'); expect(requests).toHaveLength(1);
  await page.click('#ai-context'); await expect(page.locator('#ai-context-text')).toContainText('// newer'); await expect(page.locator('#ai-context-text')).not.toContainText('unique-build-error'); await page.click('#ai-context-close');
  await page.locator('#ai-prompt').dispatchEvent('compositionstart'); await page.click('#ai-consult'); expect(requests).toHaveLength(1); await page.locator('#ai-prompt').dispatchEvent('compositionend');
  await page.locator('#ai-prompt').press('Enter'); expect(requests).toHaveLength(1);
});

test('Chat adapter, free model ID, key storage failures, network recovery and library conflict', async ({ page }) => {
  let count = 0, release, delay = false, networkFailure = false;
  const requests = [];
  await page.route('https://api.openai.com/**', async r => {
    count++; requests.push(r.request());
    if (networkFailure) return r.abort('failed');
    if (delay) await new Promise(resolve => { release = resolve; });
    await r.fulfill({ json: { choices: [{ finish_reason: 'stop', message: { content: answer } }] } });
  });
  await ready(page); await settings(page, 'openai', 'gpt-4.1-mini');
  await page.click('#ai-generate'); await expect(page.locator('#ai-status')).toContainText('適用済み');
  expect(requests[0].url()).toBe('https://api.openai.com/v1/chat/completions');
  await page.click('#ai-settings-open'); await page.fill('#ai-model', 'user-selected-model-id'); await page.selectOption('#ai-api', 'chat');
  await page.evaluate(() => { window.originalStorage = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.click('#ai-save'); await expect(page.locator('#ai-settings-status')).toContainText('保存できません');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalStorage; }); await page.click('#ai-settings-close');
  networkFailure = true; await page.click('#ai-consult'); await expect(page.locator('#ai-status')).toContainText('直接接続に失敗'); expect(requests[1].postDataJSON().model).toBe('user-selected-model-id'); expect(count).toBe(2);
  networkFailure = false; delay = true;
  const lib = { id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3' };
  await page.route('**/libraries/search?*', r => r.fulfill({ json: { items: [lib], total: 1, more: false } }));
  await page.route('**/libraries/details?*', r => r.fulfill({ json: { ...lib, frameworks: ['*'], platforms: ['*'], versions: ['7.4.3'] } }));
  await page.click('#ai-generate'); await expect.poll(() => count).toBe(3);
  await page.click('#libraries-open'); await page.fill('#library-query', 'ArduinoJson'); await page.locator('#library-search-form button').click();
  const row = page.locator('[data-library-id="64"]'); await row.getByRole('button', { name: 'バージョンを選択' }).click(); await row.getByRole('button', { name: 'プロジェクトに追加' }).click(); await page.click('#libraries-close');
  release(); await expect(page.locator('#ai-status')).toContainText('古い提案'); await expect(page.locator('#ai-apply')).toBeDisabled();
  delay = false; await page.click('#ai-consult'); await expect(page.locator('#ai-status')).toContainText('回答完了'); expect(requests[3].postData()).toContain('7.4.3');
});
