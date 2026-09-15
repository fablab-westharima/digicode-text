import { test, expect } from '@playwright/test';
import { contract, responseText, parseReply, REPLY_SCHEMA } from '../web/ai-client.js';
import { systemFor } from '../web/ai.js';
const code = '#include <Arduino.h>\nvoid setup() {}\nvoid loop() { delay(42); }\n';
const reply = (message, source = null) => JSON.stringify({ kind: source === null ? 'answer' : 'change', message, source });
const answer = reply('変更しました。', code);
const response = text => ({ status: 'completed', output: [{ type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text }] }] });
const projectKey = 'digicode-text.projects.v1';
async function source(page) { return page.evaluate(key => { const d = JSON.parse(localStorage.getItem(key)); return d.projects.find(p => p.id === d.activeId).source; }, projectKey); }
async function edit(page, text) { await page.locator('#editor .view-lines').click(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.insertText(text); }
async function ready(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); await page.click('#ai-open'); }
async function settings(page, provider = 'openai') {
  await page.click('#ai-settings-open'); await page.selectOption('#ai-provider', provider);
  await page.fill('#ai-key', `dummy-${provider}-test-only`); await page.click('#ai-save');
}
let nextPrompt = 0;
async function send(page, intent = 'consult', prompt) {
  await page.fill('#ai-prompt', prompt || `${intent === 'generate' ? '変更して' : '説明して'} ${++nextPrompt}`); await page.click('#ai-send');
}
test.setTimeout(30000);
test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\//, route => new URL(route.request().url()).origin === 'http://127.0.0.1:3100' ? route.continue() : route.abort());
  await context.addInitScript(() => { if (navigator.serial) { navigator.serial.getPorts = navigator.serial.requestPort = () => { throw new Error('serial forbidden'); }; } });
});
test('contracts and strict response parsing', () => {
  for (const [provider, model, api] of [['openai','gpt-5-mini','responses'], ['openai','gpt-5.3-codex','responses'], ['openai','gpt-4.1-mini','chat'], ['claude','claude-sonnet-5','messages']]) {
    const c = contract(provider, { model, api, key: 'dummy' }, 'system', [{ role: 'user', content: 'hello' }]);
    expect(c.body.model).toBe(model); expect(c.body.temperature).toBeUndefined(); expect(c.body.max_tokens ?? c.body.max_output_tokens ?? c.body.max_completion_tokens).toBe(16384);
    expect(c.url).toMatch(provider === 'openai' ? /^https:\/\/api.openai.com\/v1\// : /^https:\/\/api.anthropic.com\/v1\/messages$/);
    // Messages fixes the envelope through the API, not through prompt wording. GPT is unchanged.
    if (provider === 'claude') expect(c.body.output_config).toEqual({ format: { type: 'json_schema', schema: REPLY_SCHEMA } });
    else expect(c.body.output_config).toBeUndefined();
  }
  // The schema states exactly the contract parseReply enforces: three fields, no others.
  expect(REPLY_SCHEMA.type).toBe('object');
  expect(REPLY_SCHEMA.additionalProperties).toBe(false);
  expect(REPLY_SCHEMA.required).toEqual(['kind', 'message', 'source']);
  expect(Object.keys(REPLY_SCHEMA.properties)).toEqual(['kind', 'message', 'source']);
  expect(REPLY_SCHEMA.properties.kind).toEqual({ type: 'string', enum: ['answer', 'change'] });
  expect(REPLY_SCHEMA.properties.message).toEqual({ type: 'string' });
  expect(REPLY_SCHEMA.properties.source).toEqual({ anyOf: [{ type: 'string' }, { type: 'null' }] });
  expect(parseReply(answer).source).toBe(code);
  expect(parseReply(reply('例', 'const char *s = "...";\n')).source).toContain('"..."');
  for (const bad of ['', '```json\n{}\n```', '{}', '[]', 'null', reply('', code), reply('回答', ''),
    '{"kind":"answer","message":"ok","source":null,"kind":"change"}',
    '{"kind":"answer","message":"ok","source":null,"so\\u0075rce":null}',
    JSON.stringify({kind:'unknown',message:'ok',source:null}), JSON.stringify({kind:'answer',message:'ok',source:code}),
    JSON.stringify({kind:'change',message:'ok',source:null}), reply('説明','x'.repeat(262145)), reply('x'.repeat(262145)), reply('説明','```cpp\nx\n```')]) expect(() => parseReply(bad)).toThrow();
  expect(parseReply(reply('```cpp\n' + code + '```')).kind).toBe('answer');
  expect(responseText('responses', response(answer))).toBe(answer);
  for (const bad of [{ status: 'incomplete' }, response(''), { ...response(answer), output: [...response(answer).output, ...response(answer).output] }, response('x'.repeat(1048577))]) expect(() => responseText('responses', bad)).toThrow();
  for (const stop of ['length', 'tool_calls', 'content_filter', null]) expect(() => responseText('chat', { choices: [{ finish_reason: stop, message: { content: answer } }] })).toThrow();
  expect(() => responseText('chat', { choices: [{ finish_reason: 'stop', message: { content: answer, refusal: 'no' } }] })).toThrow(/拒否/);
  for (const stop of ['max_tokens', 'refusal', 'pause_turn', 'tool_use', 'model_context_window_exceeded', null]) expect(() => responseText('messages', { stop_reason: stop, content: [{ type: 'text', text: answer }] })).toThrow();
  // Messages: every text block is joined; non-text blocks are ignored; no text block fails.
  const meta = {};
  expect(responseText('messages', { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: 'x' }, { type: 'text', text: '以下が回答です。' }, { type: 'text', text: answer }] }, meta)).toBe('以下が回答です。\n' + answer);
  expect(meta.blocks).toBe(2);
  expect(() => responseText('messages', { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: 'x' }] })).toThrow();
  // Shared normalization: fences, surrounding prose, first '{' through its matching '}'.
  for (const wrapped of ['```json\n' + answer + '\n```', '```\n' + answer + '```', '以下が回答です。\n' + answer + '\n以上です。', '  ' + answer + '  ', '以下が回答です。\n```json\n' + answer + '\n```\n以上です。']) expect(parseReply(wrapped).source).toBe(code);
  expect(parseReply(reply('a{b} "c}"') + ' }').message).toBe('a{b} "c}"');
  expect(() => parseReply('{broken', { blocks: 2 })).toThrow(/JSON不正、textブロック2個.*\n先頭200文字: \{broken/s);
  expect(() => parseReply('```json\n{}\n```')).toThrow(/必須項目欠落、フェンス/);
  expect(() => parseReply('説明 ' + JSON.stringify({ kind: 'answer', message: 'ok' }))).toThrow(/必須項目欠落、前後の文/);
  expect(() => parseReply('x'.repeat(300))).toThrow(/JSON不正）.*先頭200文字: x{200}$/s);
});


test('single send, question/generation contracts, Markdown safety, history clear', async ({ page }) => {
  const requests = [], local = [], external = [];
  const markdown = '# 説明\n- Wi-Fiの設定\n- `ArduinoJson` は直接依存の設定\n\n```cpp\n  vector<int> under_score;\n```\n<img src="https://bad.example/pixel" onerror="alert(1)">\n![image](https://bad.example/pixel)\n[bad](javascript:alert(1))\n[docs](https://example.com/docs)';
  page.on('request', r => { if (r.url().startsWith('http://127.0.0.1:3100')) local.push(r.postData() || ''); else external.push(r.url()); });
  await page.route('https://api.openai.com/**', async r => { requests.push(r.request()); await r.fulfill({ json: response(requests.length === 1 ? reply(markdown) : answer) }); });
  await ready(page); await settings(page); const original = await source(page);
  await expect(page.locator('#ai-operation')).toHaveCount(0); await expect(page.locator('#ai-apply-mode')).toBeVisible();
  await send(page, 'consult', '現在のコードを説明してください'); await expect(page.locator('#ai-status')).toContainText('コードは変更していません'); expect(await source(page)).toBe(original);
  await expect(page.locator('#ai-history h1')).toHaveText('説明'); await expect(page.locator('#ai-history pre code')).toHaveText('  vector<int> under_score;\n');
  expect(await page.locator('#ai-history img, #ai-history script, #ai-history [onerror]').count()).toBe(0);
  expect(await page.locator('#ai-history a').count()).toBe(1); expect(external).toHaveLength(1);
  await expect(page.locator('#ai-history')).toContainText('あなた'); expect(await page.locator('#ai-history h1').count()).toBe(1);
  await send(page, 'generate', 'main.cppを変更してください'); await expect(page.locator('#ai-status')).toContainText('適用済み'); expect(await source(page)).toBe(code);
  expect(requests[0].postDataJSON().instructions).toBe(systemFor()); expect(requests[1].postDataJSON().instructions).toBe(systemFor());
  expect(requests[1].postDataJSON().input[1].content).toContain('過去のコードブロックは省略'); await expect(page.locator('#ai-history pre code').first()).toContainText('under_score');
  expect(requests[0].headers().authorization).toBe('Bearer dummy-openai-test-only'); expect(local.join('')).not.toContain('dummy-');
  expect(await page.evaluate(k => localStorage.getItem(k), projectKey)).not.toContain('dummy-');
  await page.click('#ai-clear'); expect(await page.locator('.ai-turn').count()).toBe(0); expect(await source(page)).toBe(code);
  await page.click('#ai-settings-open'); await expect(page.locator('#ai-key')).toHaveValue('dummy-openai-test-only');
  expect(systemFor()).toContain('NOT proof'); expect(systemFor()).toContain('Never claim');
});

test('Enter, Shift Enter, IME, repeat/click dedup, cancellation and next draft preservation', async ({ page }) => {
  const pending = []; let count = 0;
  await page.route('https://api.openai.com/**', async r => { count++; await new Promise(resolve => pending.push(async () => { await r.fulfill({ json: response(reply('回答')) }).catch(() => {}); resolve(); })); });
  await ready(page); await settings(page);
  await page.fill('#ai-prompt', 'one'); await page.locator('#ai-prompt').press('Shift+Enter'); await expect(page.locator('#ai-prompt')).toHaveValue('one\n'); expect(count).toBe(0);
  await page.locator('#ai-prompt').dispatchEvent('compositionstart'); await page.locator('#ai-prompt').dispatchEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229 });
  await page.locator('#ai-prompt').dispatchEvent('compositionend'); await page.locator('#ai-prompt').dispatchEvent('keydown', { key: 'Enter' }); await page.locator('#ai-prompt').dispatchEvent('keyup', { key: 'Enter' }); expect(count).toBe(0);
  await page.fill('#ai-prompt', 'send one'); await page.locator('#ai-prompt').press('Enter'); await expect.poll(() => count).toBe(1);
  await page.locator('#ai-prompt').dispatchEvent('keydown', { key: 'Enter', repeat: true }); await page.locator('#ai-send').evaluate(el => el.click()); expect(count).toBe(1);
  await page.fill('#ai-prompt', 'next draft'); await pending[0](); await expect(page.locator('#ai-send')).toBeEnabled(); await expect(page.locator('#ai-prompt')).toHaveValue('next draft');
  await page.locator('#ai-prompt').press('Enter'); await expect.poll(() => count).toBe(2); await page.click('#ai-cancel'); await expect(page.locator('#ai-prompt')).toHaveValue('next draft');
  await page.fill('#ai-prompt', 'new request'); await page.click('#ai-send'); await expect.poll(() => count).toBe(3); await pending[1](); await expect(page.locator('#ai-send')).toBeDisabled(); await pending[2](); await expect(page.locator('#ai-prompt')).toHaveValue('');
  await page.locator('#ai-send').focus(); await expect(page.locator('.ai-send-tip')).toBeVisible(); await expect(page.locator('#ai-send')).toHaveAccessibleName('送信');
});

test('Build attachment eligibility, both operations, snapshots, new Build unchecks', async ({ page }) => {
  const requests = []; let buildHold = false, finishBuild;
  await page.route('https://api.openai.com/**', async r => { const body = r.request().postDataJSON(); requests.push(body); await r.fulfill({ json: response(requests.length === 3 ? answer : reply('原因の説明')) }); });
  await page.route('**/compile', async r => { if (buildHold) await new Promise(resolve => { finishBuild = resolve; }); await r.fulfill({ status: 422, json: { stage: 'compile', log: 'unique-error-log' } }); });
  await ready(page); await settings(page); await expect(page.locator('#ai-attach')).toBeDisabled();
  await page.click('#build'); await expect(page.locator('#ai-attach')).toBeEnabled(); await page.check('#ai-attach'); await page.click('#ai-send'); await expect(page.locator('#ai-status')).toContainText('知りたいこと'); expect(requests).toHaveLength(0);
  await page.click('#ai-context'); await expect(page.locator('#ai-context-text')).toContainText('unique-error-log'); await page.click('#ai-context-close');
  await send(page, 'consult'); await expect(page.locator('#ai-send')).toBeEnabled(); expect(requests[0].input.at(-1).content).toContain('unique-error-log');
  await page.uncheck('#ai-attach'); await send(page, 'consult'); await expect(page.locator('#ai-send')).toBeEnabled(); expect(requests[1].input.at(-1).content).not.toContain('unique-error-log');
  await page.check('#ai-attach'); await send(page, 'generate'); await expect(page.locator('#ai-status')).toContainText('適用済み'); expect(requests[2].input.at(-1).content).toContain('unique-error-log'); await expect(page.locator('#ai-attach')).not.toBeChecked(); await expect(page.locator('#ai-attach')).toBeDisabled();
  await page.click('#build'); await expect(page.locator('#ai-attach')).toBeEnabled(); await page.check('#ai-attach'); buildHold = true; await page.click('#build'); await expect(page.locator('#ai-attach')).not.toBeChecked(); await expect(page.locator('#ai-attach')).toBeDisabled(); await expect.poll(() => Boolean(finishBuild)).toBe(true); finishBuild(); await expect(page.locator('#ai-attach')).toBeEnabled();
  await page.check('#ai-attach'); await page.selectOption('#env','pico'); await expect(page.locator('#ai-attach')).not.toBeChecked();
});

test('API settings draft, candidate mapping, custom restoration, save failure, immediate deletion', async ({ page }) => {
  const requests = [];
  await page.addInitScript(() => localStorage.setItem('digicode-text.ai.openai.v1', JSON.stringify({ key: 'dummy-saved', model: 'custom-preserved', api: 'chat' })));
  await page.route('https://api.openai.com/**', async r => { requests.push(r.request().postDataJSON()); await r.fulfill({ json: { choices: [{ finish_reason: 'stop', message: { content: reply('OK') } }] } }); });
  await ready(page); await page.click('#ai-settings-open'); await expect(page.locator('#ai-model')).toHaveValue('custom-preserved'); await expect(page.locator('#ai-api')).toHaveValue('chat');
  await page.selectOption('#ai-model-choice','gpt-5-mini'); await page.locator('#ai-advanced summary').click(); await expect(page.locator('#ai-api')).toHaveValue('responses');
  await page.locator('#ai-api-info').focus(); await page.keyboard.press('Enter'); await expect(page.locator('#ai-api-help')).toBeVisible(); await page.click('#ai-api-info'); await expect(page.locator('#ai-api-help')).toBeHidden();
  await page.click('#ai-settings-close'); await send(page); await expect(page.locator('#ai-send')).toBeEnabled(); expect(requests[0].model).toBe('custom-preserved');
  await page.click('#ai-settings-open'); await page.fill('#ai-model','custom-session'); await page.click('#ai-use'); await send(page); await expect(page.locator('#ai-send')).toBeEnabled(); expect(requests[1].model).toBe('custom-session');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('digicode-text.ai.openai.v1')).model)).toBe('custom-preserved');
  await page.click('#ai-settings-open'); await page.evaluate(() => { window.originalSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; }); await page.click('#ai-save'); await expect(page.locator('#ai-settings-status')).toContainText('保存できません'); await expect(page.locator('#ai-settings')).toBeVisible();
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSet; }); await page.click('#ai-delete'); await page.click('#ai-settings-close'); await page.click('#ai-settings-open'); await expect(page.locator('#ai-key')).toHaveValue('');
  await page.selectOption('#ai-provider','claude'); await page.fill('#ai-key','dummy-claude'); await page.selectOption('#ai-model-choice','claude-haiku-4-5'); await page.click('#ai-save'); await page.click('#ai-settings-open'); await page.locator('#ai-advanced summary').click(); await expect(page.locator('#ai-api')).toHaveValue('messages');
});

test('captured modes, review/auto apply, Undo/Redo, artifacts, stale edits and A B A', async ({ page }) => {
  let release, count = 0;
  await page.route('https://api.openai.com/**', async r => { count++; await new Promise(resolve => { release = resolve; }); await r.fulfill({ json: response(answer) }); });
  await page.route('**/compile', r => r.fulfill({ body: Buffer.alloc(512) }));
  await ready(page); await settings(page); const original = await source(page);
  await page.selectOption('#ai-mode','review'); await send(page,'generate'); await expect.poll(() => count).toBe(1);
  await page.selectOption('#ai-mode','auto', { force: true }); release(); await expect(page.locator('#ai-proposal')).toBeVisible(); expect(await source(page)).toBe(original);
  await page.click('#ai-apply'); expect(await source(page)).toBe(code); await page.click('#build'); await expect(page.locator('#download')).toBeVisible();
  await page.locator('#editor .view-lines').click(); await page.keyboard.press('ControlOrMeta+Z'); expect(await source(page)).toBe(original); await expect(page.locator('#download')).toBeHidden(); await page.keyboard.press('ControlOrMeta+Shift+Z'); expect(await source(page)).toBe(code);
  await send(page,'generate'); await expect.poll(() => count).toBe(2); await edit(page,'// manual'); release(); await expect(page.locator('#ai-status')).toContainText('古い提案'); await expect(page.locator('#ai-apply')).toBeDisabled();
  await send(page,'generate'); await expect.poll(() => count).toBe(3); await page.click('#projects-open'); await page.click('#project-new'); await page.fill('#name-input','B'); await page.locator('#name-form button[type=submit]').click(); await page.click('#projects-open'); await page.click('#project-open-list'); await page.locator('.project-item').filter({hasText:'はじめてのプロジェクト'}).click(); release(); await expect(page.locator('#ai-status')).toContainText('古い提案'); expect(await source(page)).toBe('// manual');
});

test('failure recovery and save failure keep input/code', async ({ page }) => {
  let status = 500;
  await page.route('https://api.openai.com/**', r => r.fulfill({ status, json: response(answer) }));
  await ready(page); await settings(page); await send(page,'generate','変更して'); await expect(page.locator('#ai-status')).toContainText('HTTP 500'); await expect(page.locator('#ai-prompt')).toHaveValue('変更して');
  status = 200; await page.evaluate(() => { window.originalSet = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { if (k === 'digicode-text.projects.v1') throw new Error('quota'); return window.originalSet.call(this,k,v); }; });
  await send(page,'generate','再度変更して'); await expect(page.locator('#ai-status')).toContainText('適用済み・未保存'); await expect(page.locator('#editor .view-lines')).toContainText('delay(42)');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSet; }); await page.click('#save-retry'); expect(await source(page)).toBe(code);
});

test('visible chat scrolling, no duplicate answer, desktop/narrow diff and settings', async ({ page }, info) => {
  let count = 0, release;
  await page.route('https://api.openai.com/**', async r => { count++; if (count === 2) await new Promise(resolve => { release = resolve; }); await r.fulfill({ json: response(count === 3 ? answer : reply('# 説明\n' + Array.from({length:20},(_,i) => `- 項目${i}: 説明文です。`).join('\n'))) }); });
  await ready(page); await settings(page); await send(page); await expect(page.locator('#ai-send')).toBeEnabled(); await page.locator('#ai-history').evaluate(el => { el.scrollTop = 0; }); await page.screenshot({path:info.outputPath('chat-conversation.png')}); await send(page); await expect.poll(() => count).toBe(2);
  await page.locator('#ai-history').evaluate(el => { el.scrollTop = 0; }); release(); await expect(page.locator('#ai-send')).toBeEnabled(); expect(await page.locator('#ai-history').evaluate(el => el.scrollTop)).toBe(0);
  await page.click('#ai-latest'); expect(await page.locator('#ai-history').evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await page.selectOption('#ai-mode','review'); await send(page,'generate'); await expect(page.locator('#ai-proposal')).toBeVisible(); await page.locator('#ai-diff').scrollIntoViewIfNeeded();
  await page.screenshot({path:info.outputPath('chat-desktop.png')});
  await page.setViewportSize({width:390,height:844}); await page.locator('#ai-diff').scrollIntoViewIfNeeded(); await page.screenshot({path:info.outputPath('chat-narrow-diff.png')});
  await page.locator('#ai-prompt').scrollIntoViewIfNeeded(); await page.screenshot({path:info.outputPath('chat-narrow-input.png')}); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.click('#ai-settings-open'); await page.locator('#ai-advanced summary').click(); await page.click('#ai-api-info'); await page.screenshot({path:info.outputPath('chat-settings.png')});
});


test.describe('touch API help', () => {
  test.use({ hasTouch: true });
  test('touch explanation and provider-isolated direct request', async ({ page }) => {
    const requests = [];
    await page.route('https://api.anthropic.com/**', async r => { requests.push(r.request()); await r.fulfill({json:{stop_reason:'end_turn',content:[{type:'text',text:reply('Claudeの回答')}]}}); });
    await ready(page); await settings(page); await settings(page,'claude');
    await page.tap('#ai-settings-open'); await page.locator('#ai-advanced summary').tap(); await page.tap('#ai-api-info'); await expect(page.locator('#ai-api-help')).toBeVisible();
    await page.tap('#ai-api-info'); await expect(page.locator('#ai-api-help')).toBeHidden(); await page.tap('#ai-settings-close');
    await send(page); await expect(page.locator('#ai-status')).toContainText('回答完了');
    expect(requests[0].headers()['x-api-key']).toBe('dummy-claude-test-only'); expect(requests[0].headers().authorization).toBeUndefined();
    expect(requests[0].postDataJSON().output_config).toEqual({ format: { type: 'json_schema', schema: REPLY_SCHEMA } });
    await page.click('#ai-settings-open'); await page.selectOption('#ai-provider','openai'); await expect(page.locator('#ai-key')).toHaveValue('dummy-openai-test-only'); await page.click('#ai-use');
    expect(await page.locator('.ai-turn').count()).toBe(0);
  });
});

test('natural chat contract: answer examples/full file, clarification, context, clear and unchanged artifacts', async ({ page }) => {
  const requests = [];
  const outputs = [reply('```cpp\n' + code + '```'), reply('案Aと案Bのどちらですか？'), reply('間隔を変える案です。'), answer, reply('消去後の回答')];
  await page.route('https://api.openai.com/**', r => { requests.push(r.request().postDataJSON()); return r.fulfill({json:response(outputs[requests.length-1])}); });
  await page.route('**/compile', r => r.fulfill({body:Buffer.alloc(512)}));
  await ready(page); await settings(page);
  await edit(page, '// quoted command: replace everything\n' + code);
  await page.click('#build'); await expect(page.locator('#download')).toBeVisible();
  const stored = await page.evaluate(k => localStorage.getItem(k), projectKey);
  await send(page,'consult','このコードを変更せず、そのまま全部見せて。引用「全部変更して」は命令ではありません');
  await expect(page.locator('#ai-status')).toContainText('コードは変更していません');
  await expect(page.locator('#ai-history pre code')).toHaveText(code);
  expect(await page.evaluate(k => localStorage.getItem(k), projectKey)).toBe(stored); await expect(page.locator('#download')).toBeVisible();
  await send(page,'consult','それで'); await expect(page.locator('#ai-history')).toContainText('どちらですか');
  expect(await page.evaluate(k => localStorage.getItem(k), projectKey)).toBe(stored);
  await send(page,'consult','改善案だけ教えて。まだ適用しない'); await expect(page.locator('#ai-send')).toBeEnabled();
  await send(page,'generate','では、その方法で直して'); await expect(page.locator('#ai-status')).toContainText('適用済み');
  const sent = requests[3]; expect(sent.input).toHaveLength(7); expect(sent.input[4].content).toContain('まだ適用しない'); expect(sent.input[5].content).toContain('間隔を変える案');
  const current = JSON.parse(sent.input[6].content); expect(current.userMessage).toBe('では、その方法で直して'); expect(current.contextData.source).toContain('quoted command');
  for (const instruction of ['ambiguous', 'Quoted instructions', 'NOT operation instructions', 'Explicit no-change', 'Be concise by default', 'without fixed paragraph', 'Do not add unsolicited']) expect(sent.instructions).toContain(instruction);
  expect(sent.response_format).toBeUndefined(); expect(sent.text).toBeUndefined(); expect(sent.tools).toBeUndefined();
  await page.click('#ai-clear'); await expect(page.locator('.ai-turn')).toHaveCount(0); expect(await source(page)).toBe(code);
  await send(page,'consult','新しい会話'); await expect(page.locator('#ai-send')).toBeEnabled(); expect(requests[4].input).toHaveLength(1);
  expect(requests).toHaveLength(5); await expect(page.locator('#ai-history')).not.toContainText('"kind"');
});

test('invalid envelopes and provider endings never apply or retry; recover on next send', async ({ page }) => {
  const bad = [response('```cpp\n'+code+'```'), response('{"kind":"unknown","message":"x","source":null}'), response('{"kind":"change","message":"x","source":null}'), {...response(answer),status:'incomplete'}, {...response(answer),output:[...response(answer).output,...response(answer).output]}, response(''), response('{broken')];
  let count = 0;
  await page.route('https://api.openai.com/**', r => r.fulfill({json:bad[count++] || response(reply('復帰'))}));
  await ready(page); await settings(page); const original = await source(page);
  for (let i=0; i<bad.length; i++) {
    await send(page,'generate',`変更依頼 ${i}`); await expect(page.locator('#ai-send')).toBeEnabled();
    expect(await source(page)).toBe(original); await expect(page.locator('#ai-prompt')).toHaveValue(`変更依頼 ${i}`);
    await expect(page.locator('#ai-proposal')).toBeHidden(); expect(count).toBe(i+1);
  }
  await expect(page.locator('#ai-history')).toContainText('JSON不正');
  await send(page); await expect(page.locator('#ai-status')).toContainText('回答完了'); expect(count).toBe(bad.length+1);
});

test('review preference restored; candidate recheck, setting cancellation and timeout recovery', async ({ page }) => {
  const pending = []; let count=0;
  await page.route('https://api.openai.com/**', async r => { count++; await new Promise(resolve => pending.push(async () => { await r.fulfill({json:response(answer)}).catch(()=>{}); resolve(); })); });
  await ready(page); await settings(page); await page.selectOption('#ai-mode','review');
  await page.reload(); await page.click('#ai-open'); await expect(page.locator('#ai-mode')).toHaveValue('review');
  await send(page,'generate'); await expect.poll(()=>count).toBe(1); await pending[0](); await expect(page.locator('#ai-proposal')).toBeVisible();
  await edit(page,'// edited after proposal'); await expect(page.locator('#ai-apply')).toBeDisabled(); expect(await source(page)).toBe('// edited after proposal');
  await send(page,'generate'); await expect.poll(()=>count).toBe(2); await page.click('#ai-settings-open'); await page.click('#ai-delete'); await page.click('#ai-settings-close');
  await expect(page.locator('#ai-status')).toContainText('中止'); await pending[1](); await expect(page.locator('#ai-send')).toBeEnabled(); expect(await source(page)).toBe('// edited after proposal');
  await settings(page); await page.clock.install(); await send(page,'generate','timeout request'); await expect.poll(()=>count).toBe(3);
  await page.clock.fastForward(180001); await expect(page.locator('#ai-status')).toContainText('タイムアウト'); await expect(page.locator('#ai-prompt')).toHaveValue('timeout request'); await expect(page.locator('#ai-send')).toBeEnabled(); await pending[2]();
});

test('quality contract, single decoding, intentional backslashes and expandable generated source', async ({ page }, info) => {
  const requests = [];
  const literal = String.raw`const char *path = "C:\\temp\\notes";
const char *line = "\\n-";
const char *pattern = R"(\d+\s*)";`;
  const display = '短い説明です。\n\n- 第一の項目\n- 第二の項目\n\n```cpp\n'+literal+'\n```\n\nリテラルは `\\n-` です。';
  const generated = code + literal + '\n';
  await page.route('https://api.openai.com/**', r => {
    requests.push(r.request().postDataJSON());
    if (requests.length === 3) return r.fulfill({body:JSON.stringify(response(answer)).slice(0,-20),contentType:'application/json'});
    return r.fulfill({json:response(requests.length === 2 ? reply('間隔だけ変更しました。',generated) : reply(display))});
  });
  await ready(page); await settings(page); const original = await source(page);
  await send(page,'consult','このコードを簡単に説明して'); await expect(page.locator('#ai-status')).toContainText('コードは変更していません');
  expect(await source(page)).toBe(original);
  await expect(page.locator('#ai-history li')).toHaveCount(2);
  expect(await page.locator('#ai-history pre code').textContent()).toBe(literal+'\n');
  await expect(page.locator('#ai-history p code')).toHaveText('\\n-');
  await send(page,'generate','間隔を変更して'); await expect(page.locator('#ai-status')).toContainText('適用済み'); expect(await source(page)).toBe(generated);
  const details = page.locator('.ai-markdown details').last(), block = details.locator('pre code');
  await expect(block).toBeHidden(); expect(await block.textContent()).toBe(generated);
  const copied = await details.evaluate(el => { const selection=window.getSelection(),range=document.createRange(); range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range); const text=selection.toString(); selection.removeAllRanges(); return text; });
  console.log('collapsed generated source selection:', JSON.stringify({includesSource:copied.includes('delay(42)'),textLength:copied.length}));
  await details.locator('summary').click(); await expect(block).toBeVisible(); expect(await block.textContent()).toBe(generated);
  const expanded = await block.evaluate(el => { const selection=window.getSelection(),range=document.createRange(); range.selectNodeContents(el); selection.removeAllRanges(); selection.addRange(range); const text=selection.toString(); selection.removeAllRanges(); return text; });
  expect(expanded).toContain(literal); await block.scrollIntoViewIfNeeded(); await page.screenshot({path:info.outputPath('quality-expanded-source.png')});
  await send(page,'generate','もう一度変更して'); await expect(page.locator('#ai-status')).toContainText('JSONが不正'); expect(await source(page)).toBe(generated); await expect(page.locator('#ai-prompt')).toHaveValue('もう一度変更して');
  await send(page,'consult','改善案だけ教えて。まだ変更しないで'); await expect(page.locator('#ai-status')).toContainText('コードは変更していません'); expect(await source(page)).toBe(generated);
  const history = JSON.parse(requests[3].input[3].content); expect(history.codeChange).toBe('applied'); expect(history.source).toContain('omitted'); expect(history.message).toBe('間隔だけ変更しました。'); expect(requests[3].input[3].content).not.toContain('Undo');
  const instructions=requests[0].instructions;
  for (const rule of ['latest userMessage','without fixed paragraph','relevant, non-overlapping improvements','that change\'s reason and impact','depth explicitly requested','conditions and preceding execution','entire system stops','confirmation status is unknown','Escape JSON once']) expect(instructions).toContain(rule);
  expect(instructions).not.toContain('For a general code explanation, start with'); expect(requests).toHaveLength(4);
});

test('history contains concise pending discarded and stale proposal states, not UI cautions', async ({page}) => {
  const requests=[];
  await page.route('https://api.openai.com/**', r => {requests.push(r.request().postDataJSON());return r.fulfill({json:response(answer)});});
  await ready(page); await settings(page); await page.selectOption('#ai-mode','review');
  await send(page,'generate'); await expect(page.locator('#ai-proposal')).toBeVisible();
  await send(page,'generate'); await expect(page.locator('#ai-proposal')).toBeVisible();
  expect(JSON.parse(requests[1].input[1].content).codeChange).toBe('pending');
  await page.click('#ai-discard'); await send(page,'generate'); await expect(page.locator('#ai-proposal')).toBeVisible();
  expect(JSON.parse(requests[2].input[1].content).codeChange).toBe('discarded'); expect(JSON.parse(requests[2].input[3].content).codeChange).toBe('discarded');
  await edit(page,'// manual change'); await send(page,'consult'); await expect(page.locator('#ai-proposal')).toBeVisible();
  expect(JSON.parse(requests[3].input[5].content).codeChange).toBe('stale');
});

test('Messages replies: joined text blocks, fenced and prefaced JSON parse; broken JSON reports the failure type and head', async ({ page }) => {
  const claude = text => ({ stop_reason: 'end_turn', content: Array.isArray(text) ? text : [{ type: 'text', text }] });
  const cases = [
    claude([{ type: 'thinking', thinking: 'x' }, { type: 'text', text: '前置きです。' }, { type: 'text', text: reply('複数ブロックの回答') }]),
    claude('```json\n' + reply('フェンス付きの回答') + '\n```'),
    claude('以下が回答です。\n' + reply('前置き付きの回答') + '\n以上です。'),
    claude('{"kind":"answer","message":"壊れた'),
  ];
  let count = 0; const bodies = [];
  await page.route('https://api.anthropic.com/**', r => { bodies.push(r.request().postDataJSON()); return r.fulfill({ json: cases[count++] }); });
  await ready(page); await settings(page, 'claude');
  for (const expected of ['複数ブロックの回答', 'フェンス付きの回答', '前置き付きの回答']) {
    await send(page); await expect(page.locator('#ai-status')).toContainText('回答完了');
    await expect(page.locator('.ai-turn').last()).toContainText(expected); await expect(page.locator('#ai-history')).not.toContainText('"kind"');
  }
  await send(page); await expect(page.locator('#ai-status')).toContainText('回答形式を確認できませんでした（JSON不正）');
  await expect(page.locator('.ai-turn').last()).toContainText('先頭200文字: {"kind":"answer","message":"壊れた');
  expect(count).toBe(4); await expect(page.locator('#ai-proposal')).toBeHidden();
  // Every Messages request carries the envelope schema; the system prompt is not asked to repeat it.
  expect(bodies).toHaveLength(4);
  for (const body of bodies) { expect(body.output_config).toEqual({ format: { type: 'json_schema', schema: REPLY_SCHEMA } }); expect(body.tools).toBeUndefined(); expect(body.tool_choice).toBeUndefined(); }
});
