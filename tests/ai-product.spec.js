import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { PRODUCT_INFO, RESPONSE_RULES, projectContext, systemFor } from '../web/ai-context.js';
import { validateContent, setBoards } from '../web/projects.js';
import { validateLibraries } from '../shared/libraries.js';
const read = name => readFile(new URL('../' + name, import.meta.url), 'utf8');

// Read the compiler's literal board table only; never import/start the server from here.
async function compilerBoards() {
  const server = await read('compiler/server.mjs');
  const table = server.match(/const BOARDS = (new Map\([\s\S]*?\n\]\));/)[1];
  const consts = Object.fromEntries([...server.matchAll(/^const (RP2040_FLASH|ESP_FLASH) = ('.*');$/gm)].map(m => [m[1], vm.runInNewContext(m[2])]));
  return vm.runInNewContext(table, { path, here: '/compiler', RP2040_PROJECT: '/compiler/pio-rp2040', ...consts });
}
const NOT_IN_GUIDANCE = [/zip/i, /esptool/i, /0x[0-9a-f]+/i, /manifest/i, /DFU/];

test('the compiler board table carries every fact the UI and AI need, and agrees with the templates', async () => {
  const boards = await compilerBoards();
  expect(boards.size).toBeGreaterThan(0);
  setBoards(boards.keys());
  for (const [env, b] of boards) {
    for (const key of ['name', 'family', 'framework', 'core', 'flashHint']) expect(typeof b[key], `${env}.${key}`).toBe('string');
    expect(typeof b.browserFlash).toBe('boolean'); expect(typeof b.serial).toBe('boolean');
    expect(['uf2', 'flashset']).toContain(b.artifact);
    expect(b.browserFlash).toBe(b.artifact === 'flashset'); // the flash button exists exactly for flash-set boards (app.js)
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
  for (const file of ['bootloader', 'partitions', 'boot_app0', 'firmware', 'flashset.json']) expect(packager).toContain(file);
  expect(validateLibraries([{ id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3' }])[0].version).toBe('7.4.3');
  for (const invalid of [{url:'https://example.com/library.zip'}, {id:64,owner:'bblanchon',name:'ArduinoJson',version:'latest'}]) expect(() => validateLibraries([invalid])).toThrow();
  expect(RESPONSE_RULES).not.toMatch(/2[–〜-]3|3[–〜-]5/);
});

test('the system prompt names no external flashing procedure and no board facts of its own', () => {
  const system = systemFor();
  for (const re of NOT_IN_GUIDANCE) expect(system).not.toMatch(re);
  for (const word of ['browserFlashing', 'usbVendorId', 'XIAO', 'Pico', 'RP2040', 'ESP32']) expect(system).not.toContain(word);
  expect(system).toContain('boardDetails');
});

test('projectContext passes the /boards entry through unchanged and nothing else about the board', () => {
  const board = { id: 'xiao_esp32c3', name: 'XIAO ESP32C3', family: 'esp', framework: 'Arduino', core: 'Arduino ESP32', artifact: 'flashset', browserFlash: true, serial: true, flashHint: 'x' };
  const source = '// Earlier example: 0x1000 bootloader.bin; Compile verified\nvoid setup(){}\nvoid loop(){}';
  const context = projectContext({ env: 'xiao_esp32c3', source, board, libraries: [], manifest: { images: 'not supplied by app' } }, { stage: 'compile', log: 'old command: 0x0 boot_app0.bin' }, 'auto');
  expect(context.source).toBe(source);
  expect(context.boardDetails).toBe(board);
  expect(context.framework).toBe('Arduino');
  expect(context).not.toHaveProperty('artifactContext');
  expect(context).not.toHaveProperty('manifest');
  expect(() => projectContext({ env: 'pico', source, board, libraries: [] }, null, 'auto')).toThrow('ボード情報');
  expect(() => projectContext({ env: 'pico', source, libraries: [] }, null, 'auto')).toThrow('ボード情報');
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
        if (board.browserFlash) { await expect(page.locator('#flash')).toBeEnabled(); await expect(page.locator('#download')).toBeHidden(); }
        else { await expect(page.locator('#download')).toBeVisible(); await expect(page.locator('#download')).toHaveAttribute('download',`firmware-${env}.${board.artifact}`); await expect(page.locator('#flash')).toBeHidden(); }
      }
      const saved = await page.evaluate(() => localStorage.getItem('digicode-text.projects.v1'));
      await page.fill('#ai-prompt',prompts[i]); await page.click('#ai-send'); await expect(page.locator('#ai-status')).toContainText('コードは変更していません');
      expect(requests).toHaveLength(i+1);
      const body = requests[i], system = api === 'responses' ? body.instructions : api === 'chat' ? body.messages[0].content : body.system;
      expect(system).toBe(systemFor()); expect(system).toContain(JSON.stringify(PRODUCT_INFO));
      for (const re of NOT_IN_GUIDANCE) expect(system).not.toMatch(re);
      const messages = api === 'responses' ? body.input : api === 'chat' ? body.messages.slice(1) : body.messages;
      expect(messages).toHaveLength(1); // Actual clear action below removes both display and resend history.
      const payload = JSON.parse(messages[0].content);
      expect(payload.userMessage).toBe(prompts[i]);
      // The board facts the AI receives are exactly the compiler's /boards entry.
      expect(payload.contextData).toEqual({application:'DigiCode Text',file:'main.cpp',source,board:env,framework:board.framework,boardDetails:board,
        directDependencyStatus:'configured; acquisition, Build and hardware verification status not provided',libraries,codeChangeApplication:mode});
      expect(JSON.stringify(body)).not.toContain('dummy-product-test-only');
      expect(await page.evaluate(() => localStorage.getItem('digicode-text.projects.v1'))).toBe(saved);
      if (i > 0) await expect(page.locator(board.browserFlash ? '#flash' : '#download')).toBeVisible();
      await page.click('#ai-context'); const preview = JSON.parse(await page.locator('#ai-context-text').textContent()); expect(preview).toEqual(payload.contextData); await page.click('#ai-context-close');
      await page.click('#ai-clear'); await expect(page.locator('.ai-turn')).toHaveCount(0);
    }
  });
}
