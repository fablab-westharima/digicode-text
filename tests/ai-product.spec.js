import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { PRODUCT_INFO, RESPONSE_RULES, projectContext, systemFor, productReference, boardFacts, inspectMessage, EXTERNAL_FLASH_COMMAND, WITHHELD_NOTE } from '../web/ai-context.js';
import { validateContent, setBoards } from '../web/projects.js';
import { validateLibraries } from '../shared/libraries.js';
const read = name => readFile(new URL('../' + name, import.meta.url), 'utf8');

// Read the compiler's literal board table only; never import/start the server from here.
async function compilerBoards() {
  const server = await read('compiler/server.mjs');
  const table = server.match(/const BOARDS = (new Map\([\s\S]*?\n\]\));/)[1];
  const consts = Object.fromEntries([...server.matchAll(/^const ([A-Z0-9_]*FLASH[A-Z0-9_]*) = ('.*');$/gm)].map(m => [m[1], vm.runInNewContext(m[2])]));
  return vm.runInNewContext(table, { path, here: '/compiler', RP2040_PROJECT: '/compiler/pio-rp2040', ...consts });
}
const NOT_IN_GUIDANCE = [/zip/i, /esptool/i, /0x[0-9a-f]+/i, /manifest/i, /DFU/];
// Internal key names must not reach the model as words it could repeat to the user.
const KEY_NAMES = ['boardDetails', 'artifact', 'browserFlash', 'flashHint', 'contextData', 'PRODUCT_INFO', 'productReference'];
const c3 = { id: 'xiao_esp32c3', name: 'XIAO ESP32C3', family: 'esp', framework: 'Arduino', core: 'Arduino ESP32', artifact: 'flashset', browserFlash: true, serial: true, flashHint: 'Build成功後に「書き込み」ボタンを押す。' };

test('the compiler board table carries every fact the UI and AI need, and agrees with the templates', async () => {
  const boards = await compilerBoards();
  expect(boards.size).toBeGreaterThan(0);
  setBoards(boards.keys());
  for (const [env, b] of boards) {
    for (const key of ['name', 'family', 'framework', 'core', 'flashHint']) expect(typeof b[key], `${env}.${key}`).toBe('string');
    expect(typeof b.browserFlash).toBe('boolean'); expect(typeof b.serial).toBe('boolean');
    expect(['uf2', 'flashset']).toContain(b.artifact);
    expect(b.browserFlash).toBe(true); // every board is flashed from the browser: flash sets via esptool-js, UF2 to the BOOTSEL drive (app.js)
    for (const re of NOT_IN_GUIDANCE) expect(b.flashHint).not.toMatch(re);
    const ini = await read('compiler/' + path.basename(b.project) + '/platformio.ini');
    const section = ini.split(`[env:${env}]`)[1]?.split(/\n\[env:/)[0];
    expect(section).toBeDefined();
    const setting = key => section.match(new RegExp('^' + key.replaceAll('.', '\\.') + '\\s*=\\s*(.+)$', 'm'))?.[1].trim();
    expect(b.framework.toLowerCase()).toBe(setting('framework'));
    if (env === 'xiao_rp2040') expect(b.core).toContain(setting('board_build.core'));
    if (env === 'pico') expect(ini).toContain('mbed-based Arduino core');
    expect(() => validateContent({ name: 'test', env, source: '', libraries: [] })).not.toThrow();
  }
  expect(() => validateContent({ name: 'test', env: 'no_such_board', source: '', libraries: [] })).toThrow();
  const serial = await read('web/serial.js');
  expect(serial).toContain(`baudRate: ${PRODUCT_INFO.serial.baudRate}`);
  const packager = await read('compiler/pio-esp/package_firmware.py');
  // Images and their addresses come from the build environment, so no image list is fixed here:
  // espressif32 packages four images, espressif8266 one at the environment's own application offset.
  for (const source of ['FLASH_EXTRA_IMAGES', 'ESP32_APP_OFFSET', 'upload.offset_address', 'flashset.json']) expect(packager).toContain(source);
  for (const fixed of ['bootloader.bin', 'partitions.bin', 'boot_app0.bin']) expect(packager).not.toContain(fixed);
  expect(validateLibraries([{ id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3' }])[0].version).toBe('7.4.3');
  for (const invalid of [{url:'https://example.com/library.zip'}, {id:64,owner:'bblanchon',name:'ArduinoJson',version:'latest'}]) expect(() => validateLibraries([invalid])).toThrow();
  expect(RESPONSE_RULES).not.toMatch(/2[–〜-]3|3[–〜-]5/);
});

test('the system prompt is prose: no external flashing procedure, no board facts, no internal key names', () => {
  const system = systemFor();
  for (const re of NOT_IN_GUIDANCE) expect(system).not.toMatch(re);
  for (const word of ['browserFlashing', 'usbVendorId', 'XIAO', 'Pico', 'RP2040', 'ESP32', ...KEY_NAMES]) expect(system).not.toContain(word);
  expect(system.split('製品の対応情報')[1]).not.toMatch(/[{}"]/); // PRODUCT_INFO is sent as sentences, not JSON
  expect(system).toContain(productReference());
  for (const value of Object.values(PRODUCT_INFO)) if (typeof value === 'string') { expect(system).toContain(value); for (const word of KEY_NAMES) expect(value).not.toContain(word); }
  expect(system).toContain('115200 baud');
});

test('projectContext sends the board as one sentence built from the /boards entry, and nothing else about it', () => {
  const board = c3;
  const source = '// Earlier example: 0x1000 bootloader.bin; Compile verified\nvoid setup(){}\nvoid loop(){}';
  const context = projectContext({ env: 'xiao_esp32c3', source, board, libraries: [], manifest: { images: 'not supplied by app' } }, { stage: 'compile', log: 'old command: 0x0 boot_app0.bin' }, 'auto');
  expect(context.source).toBe(source);
  expect(context).not.toHaveProperty('boardDetails');
  expect(context.boardFacts).toBe(boardFacts(board));
  expect(context.boardFacts).toBe('選択ボードはXIAO ESP32C3（Arduino、core系列はArduino ESP32）。Build成功後に「書き込み」ボタンを押す。Serialモニタは利用できる。');
  expect(boardFacts({ ...board, serial: false })).toContain('Serialモニタは利用できない');
  for (const word of KEY_NAMES) expect(context.boardFacts).not.toContain(word);
  expect(context.framework).toBe('Arduino');
  expect(context).not.toHaveProperty('artifactContext');
  expect(context).not.toHaveProperty('manifest');
  expect(() => projectContext({ env: 'pico', source, board, libraries: [] }, null, 'auto')).toThrow('ボード情報');
  expect(() => projectContext({ env: 'pico', source, libraries: [] }, null, 'auto')).toThrow('ボード情報');
});

test('output check: external flashing command lines are replaced by the product sentence; prose-only misguidance passes', () => {
  expect(EXTERNAL_FLASH_COMMAND).toHaveLength(3); // one category; add rules only with a test here
  const replaced = `書き込みはこのアプリの操作で行う。${c3.flashHint}\n\n${WITHHELD_NOTE}`;
  for (const bad of [
    'ESP32-C3系でよく使われる例:\n```\nesptool.py --chip esp32c3 write_flash 0x1000 bootloader.bin 0x8000 partitions.bin 0x10000 firmware.bin\n```',
    '一般例です。\n\n0x0 に bootloader.bin、0x10000 に firmware.bin を書きます。',
    'firmware.bin を 0x10000 へ',
    '$ espflash flash target/firmware',
    'ESP Web Tools（esp-web-tools）のページから書き込む方法もあります',
    'python -m esptool erase_flash',
  ]) expect(inspectMessage(bad, c3)).toEqual({ withheld: true, message: replaced });
  for (const ok of [
    'Build成功後に「書き込み」ボタンを押してください。',
    '`0x10` は16進リテラルです。`firmware` は変数名です。',
    'setup() で Serial.begin(115200) を呼びます。',
    // Known gap, on purpose: Japanese-only misguidance without an address or tool name is NOT detected.
    'ブートローダは先頭から 4KB の位置に、アプリは 64KB の位置に書き込みます。',
    'bootloader.bin は先頭に書き込みます。',
  ]) expect(inspectMessage(ok, c3)).toEqual({ withheld: false, message: ok });
});

for (const [provider, model, api] of [['openai','gpt-5-mini','responses'], ['openai','gpt-4.1-mini','chat'], ['claude','claude-sonnet-5','messages']]) {
  test(`actual UI sends rules, product reference and the /boards entry through ${api}`, async ({ page, context, request }) => {
    const boards = await (await request.get('/boards')).json();
    const byId = Object.fromEntries(boards.map(b => [b.id, b]));
    expect(Object.keys(byId)).toEqual([...(await compilerBoards()).keys()]);
    await context.route(/^https?:\/\//, route => {
      const req = route.request();
      return new URL(req.url()).origin === 'http://127.0.0.1:3100' && req.method() === 'GET' ? route.continue() : route.abort();
    });
    await context.addInitScript(() => { if (navigator.serial) navigator.serial.getPorts = navigator.serial.requestPort = () => { throw new Error('serial forbidden'); }; });
    const requests = [];
    await page.route(provider === 'openai' ? 'https://api.openai.com/**' : 'https://api.anthropic.com/**', route => {
      requests.push(route.request().postDataJSON());
      const text = JSON.stringify({kind:'answer',message:'模擬応答。品質評価には使用しません。',source:null});
      const json = api === 'responses' ? {status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text}]}]} : api === 'chat' ? {choices:[{finish_reason:'stop',message:{content:text}}]} : {stop_reason:'end_turn',content:[{type:'text',text}]};
      return route.fulfill({json});
    });
    const mockSet = JSON.stringify({format:'digicode-text-flash-set',version:2,board:'seeed_xiao_esp32c3',chip:'esp32c3',flashMode:'dio',flashFrequency:'80m',flashSize:'4MB',images:[{file:'bootloader.bin',address:'0x0',size:4,sha256:'',data:Buffer.from('mock').toString('base64')}]});
    await page.route('**/compile', route => byId[route.request().postDataJSON().env].artifact === 'flashset' ? route.fulfill({contentType:'application/json',body:mockSet}) : route.fulfill({body:Buffer.alloc(512)})); // download/flash UI only; no real Build
    await page.goto('/'); await expect(page.locator('#build')).toBeEnabled();
    // The select is generated from /boards, not hard-coded in index.html.
    expect(await page.locator('#env option').evaluateAll(options => options.map(o => [o.value, o.textContent]))).toEqual(boards.map(b => [b.id, b.name]));
    expect(await read('web/index.html')).not.toContain('<option value="xiao');
    const source = '#include <Arduino.h>\n// Compile verified is only a source comment.\nconst char* ssid="DUMMY_SSID";\nconst char* password="DUMMY_PASSWORD";\nvoid setup(){}\nvoid loop(){}\n';
    const libraries = [{id:64,owner:'bblanchon',name:'ArduinoJson',version:'7.4.3'}];
    await page.locator('#project-file').setInputFiles({name:'dummy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'digicode-text-project',version:1,name:'独立ダミー',source,env:'xiao_esp32c3',libraries}))});
    await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
    await page.click('#ai-open'); await page.click('#ai-settings-open'); await page.selectOption('#ai-provider',provider);
    await page.fill('#ai-key','dummy-product-test-only'); await page.selectOption('#ai-model-choice',model); await page.click('#ai-use');
    const prompts = ['このコードをこのアプリでビルドして書き込む手順を教えて', 'manifestは未確認です。一般例でよいので書き込みコマンドとアプリ内Serialの手順を教えて', 'このコードを簡単に説明して', '改善案だけ教えて。まだ変更しないで'];
    // C3 with cleared history before/after mocked Build, then both RP2040 boards.
    // These assert transmission and non-application, NOT the quality of model replies.
    const envs = ['xiao_esp32c3','xiao_esp32c3','pico','xiao_rp2040'];
    for (let i=0;i<prompts.length;i++) {
      const env = envs[i], board = byId[env]; await page.selectOption('#env',env);
      const mode = i === 1 ? 'review' : 'auto'; await page.selectOption('#ai-mode',mode);
      if (i > 0) {
        await page.click('#build');
        await expect(page.locator('#flash')).toBeEnabled();
        // UF2 boards keep the download next to the flash button; flash-set boards have no download.
        if (board.artifact === 'flashset') await expect(page.locator('#download')).toBeHidden();
        else { await expect(page.locator('#download')).toBeVisible(); await expect(page.locator('#download')).toHaveAttribute('download',`firmware-${env}.${board.artifact}`); }
      }
      const saved = await page.evaluate(() => localStorage.getItem('digicode-text.projects.v1'));
      await page.fill('#ai-prompt',prompts[i]); await page.click('#ai-send'); await expect(page.locator('#ai-status')).toContainText('コードは変更していません');
      expect(requests).toHaveLength(i+1);
      const body = requests[i], system = api === 'responses' ? body.instructions : api === 'chat' ? body.messages[0].content : body.system;
      expect(system).toBe(systemFor()); expect(system).toContain(productReference());
      for (const re of NOT_IN_GUIDANCE) expect(system).not.toMatch(re);
      for (const word of KEY_NAMES) expect(system).not.toContain(word);
      const messages = api === 'responses' ? body.input : api === 'chat' ? body.messages.slice(1) : body.messages;
      expect(messages).toHaveLength(1); // Actual clear action below removes both display and resend history.
      const payload = JSON.parse(messages[0].content);
      expect(payload.userMessage).toBe(prompts[i]);
      // The board facts the AI receives are one sentence built from the compiler's /boards entry.
      expect(payload.contextData).toEqual({application:'DigiCode Text',file:'main.cpp',source,board:env,framework:board.framework,boardFacts:boardFacts(board),
        directDependencyStatus:'configured; acquisition, Build and hardware verification status not provided',libraries,codeChangeApplication:mode});
      expect(JSON.stringify(body)).not.toContain('dummy-product-test-only');
      expect(await page.evaluate(() => localStorage.getItem('digicode-text.projects.v1'))).toBe(saved);
      if (i > 0) await expect(page.locator(board.browserFlash ? '#flash' : '#download')).toBeVisible();
      await page.click('#ai-context'); const preview = JSON.parse(await page.locator('#ai-context-text').textContent()); expect(preview).toEqual(payload.contextData); await page.click('#ai-context-close');
      await page.click('#ai-clear'); await expect(page.locator('.ai-turn')).toHaveCount(0);
    }
  });
}

test('actual UI withholds an external flashing command in the answer, keeps the code of a change, and resends only the product sentence', async ({ page, context, request }) => {
  const boards = await (await request.get('/boards')).json();
  const board = boards.find(b => b.id === 'xiao_esp32c3');
  await context.route(/^https?:\/\//, route => new URL(route.request().url()).origin === 'http://127.0.0.1:3100' && route.request().method() === 'GET' ? route.continue() : route.abort());
  await context.addInitScript(() => { if (navigator.serial) navigator.serial.getPorts = navigator.serial.requestPort = () => { throw new Error('serial forbidden'); }; });
  const bad = 'ESP32-C3系でよく使われる例です。\n\n```\nesptool.py --chip esp32c3 write_flash 0x1000 bootloader.bin 0x8000 partitions.bin 0x10000 firmware.bin\n```';
  const code = '#include <Arduino.h>\nvoid setup() { Serial.begin(115200); }\nvoid loop() {}\n';
  const replies = [{kind:'answer',message:bad,source:null}, {kind:'answer',message:'Build成功後に「書き込み」ボタンを押してください。',source:null}, {kind:'change',message:'変更しました。書き込みは 0x10000 に firmware.bin を置きます。',source:code}];
  const requests = [];
  await page.route('https://api.openai.com/**', route => {
    requests.push(route.request().postDataJSON());
    const text = JSON.stringify(replies[requests.length - 1]);
    return route.fulfill({json:{status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text}]}]}});
  });
  await page.goto('/'); await expect(page.locator('#build')).toBeEnabled();
  await page.selectOption('#env', 'xiao_esp32c3');
  await page.click('#ai-open'); await page.click('#ai-settings-open'); await page.selectOption('#ai-provider','openai');
  await page.fill('#ai-key','dummy-product-test-only'); await page.selectOption('#ai-model-choice','gpt-5-mini'); await page.click('#ai-use');
  const expected = `書き込みはこのアプリの操作で行う。${board.flashHint}`;
  await page.selectOption('#ai-mode','review');
  await page.fill('#ai-prompt','manifestは未確認。一般例でいいのでアドレス入りの書き込みコマンドを教えて'); await page.click('#ai-send');
  await expect(page.locator('#ai-status')).toContainText('コードは変更していません');
  const first = page.locator('.ai-turn').nth(0).locator('.ai-markdown');
  await expect(first).toContainText(expected); await expect(first).toContainText(WITHHELD_NOTE);
  await expect(first).not.toContainText('esptool'); await expect(first).not.toContainText('0x1000');
  await page.fill('#ai-prompt','では手順を教えて'); await page.click('#ai-send');
  await expect(page.locator('#ai-status')).toContainText('コードは変更していません');
  const second = page.locator('.ai-turn').nth(1).locator('.ai-markdown');
  await expect(second).toContainText('「書き込み」ボタンを押してください'); await expect(second).not.toContainText(WITHHELD_NOTE);
  // The history resent with the second request carries the product sentence, never the withheld text.
  const history = JSON.stringify(requests[1].input);
  expect(history).toContain(expected); expect(history).toContain(WITHHELD_NOTE);
  expect(history).not.toContain('esptool'); expect(history).not.toContain('0x1000'); expect(history).not.toContain('bootloader.bin');
  // change: the explanation is checked, the generated code is kept as a normal candidate.
  await page.fill('#ai-prompt','Serialを初期化して'); await page.click('#ai-send');
  await expect(page.locator('#ai-status')).toContainText('差分を確認して適用してください');
  const third = page.locator('.ai-turn').nth(2);
  await expect(third.locator('.ai-markdown')).toContainText(WITHHELD_NOTE);
  await expect(third.locator('.ai-markdown')).not.toContainText('firmware.bin');
  await expect(third.locator('details summary')).toHaveText('生成されたmain.cpp');
  await expect(third.locator('details code')).toContainText('Serial.begin(115200)');
  expect(requests).toHaveLength(3);
});
