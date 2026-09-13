import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { BOARD_INFO, PRODUCT_INFO, RESPONSE_RULES, projectContext, systemFor } from '../web/ai-context.js';
import { validateContent } from '../web/projects.js';
import { validateLibraries } from '../shared/libraries.js';
const read = name => readFile(new URL('../' + name, import.meta.url), 'utf8');

// Read the existing compiler's literal board table only; never import/start the server.
test('product metadata agrees with compiler templates, artifacts, project schema and serial restrictions', async () => {
  const server = await read('compiler/server.mjs');
  const table = server.match(/const BOARDS = (new Map\([\s\S]*?\n\]\));/)[1];
  const compilerBoards = vm.runInNewContext(table, { path, here: '/compiler', RP2040_PROJECT: '/compiler/pio-rp2040' });
  expect([...compilerBoards.keys()]).toEqual(Object.keys(BOARD_INFO));
  for (const [env, info] of Object.entries(BOARD_INFO)) {
    const target = compilerBoards.get(env);
    const ini = await read('compiler/' + path.basename(target.project) + '/platformio.ini');
    const section = ini.split(`[env:${env}]`)[1]?.split(/\n\[env:/)[0];
    expect(section).toBeDefined();
    const setting = key => section.match(new RegExp('^' + key.replaceAll('.', '\\.') + '\\s*=\\s*(.+)$', 'm'))?.[1].trim();
    expect(info.platform).toBe(setting('platform'));
    expect(info.framework.toLowerCase()).toBe(setting('framework'));
    expect(info.artifact).toBe(target.extension);
    expect(info.coreVersion).toBeNull();
    expect(info.platformVersion).toBe(info.platform.match(/@(.+)$/)?.[1] ?? null);
    if (env === 'xiao_rp2040') expect(info.core).toContain(setting('board_build.core'));
    if (env === 'pico') expect(ini).toContain('mbed-based Arduino core');
    expect(() => validateContent({ name: 'test', env, source: '', libraries: [] })).not.toThrow();
  }
  const serial = await read('web/serial.js');
  expect(serial).toContain(`usbVendorId: ${PRODUCT_INFO.serial.usbVendorId}`);
  expect(serial).toContain(`baudRate: ${PRODUCT_INFO.serial.baudRate}`);
  expect(PRODUCT_INFO.browserFlashing).toBe(false);
  const packager = await read('compiler/pio-esp32c3/package_firmware.py');
  for (const file of ['bootloader', 'partitions', 'boot_app0', 'firmware', 'manifest.json', 'README.txt']) expect(packager).toContain(file);
  expect(validateLibraries([{ id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3' }])[0].version).toBe('7.4.3');
  for (const invalid of [{url:'https://example.com/library.zip'}, {id:64,owner:'bblanchon',name:'ArduinoJson',version:'latest'}]) expect(() => validateLibraries([invalid])).toThrow();
  expect(RESPONSE_RULES).not.toMatch(/2[–〜-]3|3[–〜-]5/);
});

test('artifact evidence is absent rather than inferred from source, board or Build logs', () => {
  const source = '// Earlier example: 0x1000 bootloader.bin; Compile verified\nvoid setup(){}\nvoid loop(){}';
  const context = projectContext({ env: 'xiao_esp32c3', source, libraries: [], manifest: { images: 'not supplied by app' } }, { stage: 'compile', log: 'old command: 0x0 boot_app0.bin' }, 'auto');
  expect(context.source).toBe(source);
  expect(context.artifactContext).toMatchObject({ format: 'zip', manifest: null, readme: null });
  expect(context.artifactContext.evidence).toContain('不足値を推測で補わない');
  expect(context.boardDetails.serialMonitor.guidance).toBe('do_not_offer');
  expect(context.boardDetails.bootMode.name).toContain('ROM download mode');
  expect(context.boardDetails.bootMode.instructions).toContain('DFUとは呼ばない');
  for (const env of ['pico', 'xiao_rp2040']) {
    const rp = projectContext({ env, source, libraries: [] }, null, 'review');
    expect(rp.artifactContext).toMatchObject({ format: 'uf2', manifest: null, readme: null });
    expect(rp.boardDetails.serialMonitor.guidance).toBe('conditional');
    expect(rp.boardDetails.bootMode).toBeUndefined();
  }
  expect(PRODUCT_INFO.flashing).toContain('「一般例」「manifestを優先」「後で置換」と添えても推測値は提示しない');
  expect(PRODUCT_INFO.flashing).toContain('Build→ZIP取得');
  // No flash offset table in static information, including the previously correct offsets.
  expect(JSON.stringify({ boards: BOARD_INFO, product: PRODUCT_INFO }).match(/0x[0-9a-f]+/gi)).toEqual(['0x2e8a']);
});

for (const [provider, model, api] of [['openai','gpt-5-mini','responses'], ['openai','gpt-4.1-mini','chat'], ['claude','claude-sonnet-5','messages']]) {
  test(`actual UI sends rules, product reference and snapshot through ${api}`, async ({ page, context }) => {
    await context.route(/^https?:\/\//, route => {
      const request = route.request();
      return new URL(request.url()).origin === 'http://127.0.0.1:3100' && request.method() === 'GET' ? route.continue() : route.abort();
    });
    await context.addInitScript(() => { if (navigator.serial) navigator.serial.getPorts = navigator.serial.requestPort = () => { throw new Error('serial forbidden'); }; });
    const requests = [];
    await page.route(provider === 'openai' ? 'https://api.openai.com/**' : 'https://api.anthropic.com/**', route => {
      requests.push(route.request().postDataJSON());
      const text = JSON.stringify({kind:'answer',message:'模擬応答。品質評価には使用しません。',source:null});
      const json = api === 'responses' ? {status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text}]}]} : api === 'chat' ? {choices:[{finish_reason:'stop',message:{content:text}}]} : {stop_reason:'end_turn',content:[{type:'text',text}]};
      return route.fulfill({json});
    });
    await page.route('**/compile', route => route.fulfill({body:Buffer.alloc(512)})); // download UI only; no real Build
    await page.goto('/'); await expect(page.locator('#build')).toBeEnabled();
    expect(await page.locator('#env option').evaluateAll(options => options.map(o => o.value))).toEqual(Object.keys(BOARD_INFO));
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
      const env = envs[i]; await page.selectOption('#env',env);
      const mode = i === 1 ? 'review' : 'auto'; await page.selectOption('#ai-mode',mode);
      if (i > 0) {
        await page.click('#build'); await expect(page.locator('#download')).toBeVisible();
        await expect(page.locator('#download')).toHaveAttribute('download',`firmware-${env}.${BOARD_INFO[env].artifact}`);
      }
      const saved = await page.evaluate(() => localStorage.getItem('digicode-text.projects.v1'));
      await page.fill('#ai-prompt',prompts[i]); await page.click('#ai-send'); await expect(page.locator('#ai-status')).toContainText('コードは変更していません');
      expect(requests).toHaveLength(i+1);
      const body = requests[i], system = api === 'responses' ? body.instructions : api === 'chat' ? body.messages[0].content : body.system;
      expect(system).toBe(systemFor()); expect(system).toContain(JSON.stringify(PRODUCT_INFO));
      const messages = api === 'responses' ? body.input : api === 'chat' ? body.messages.slice(1) : body.messages;
      expect(messages).toHaveLength(1); // Actual clear action below removes both display and resend history.
      const payload = JSON.parse(messages[0].content);
      expect(payload.userMessage).toBe(prompts[i]);
      expect(payload.contextData).toMatchObject({source,board:env,framework:BOARD_INFO[env].framework,boardDetails:BOARD_INFO[env],libraries,codeChangeApplication:mode});
      expect(payload.contextData.artifactContext).toMatchObject({format: BOARD_INFO[env].artifact, manifest: null, readme: null});
      expect(payload.contextData.artifactContext.evidence).toContain('AIへ自動送信していない');
      expect(payload.contextData.boardDetails.serialMonitor.guidance).toBe(i < 2 ? 'do_not_offer' : 'conditional');
      if (i < 2) {
        expect(payload.contextData.boardDetails.bootMode.instructions).toContain('DFUとは呼ばない');
        expect(payload.contextData.boardDetails.bootMode.sources[0]).toBe('https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/#troubleshooting');
      } else expect(payload.contextData.boardDetails.bootMode).toBeUndefined();
      expect(payload.contextData.directDependencyStatus).toContain('configured'); expect(payload.contextData.directDependencyStatus).toContain('not provided');
      expect(JSON.stringify(body)).not.toContain('dummy-product-test-only');
      expect(await page.evaluate(() => localStorage.getItem('digicode-text.projects.v1'))).toBe(saved);
      if (i > 0) await expect(page.locator('#download')).toBeVisible();
      await page.click('#ai-context'); const preview = JSON.parse(await page.locator('#ai-context-text').textContent()); expect(preview).toEqual(payload.contextData); await page.click('#ai-context-close');
      await page.click('#ai-clear'); await expect(page.locator('.ai-turn')).toHaveCount(0);
    }
  });
}
