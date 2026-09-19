import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { openSettings, selectBoard } from './shell.js';
import { UI_FACTS } from '../web/product-facts.js';
import { productFacts } from '../web/ai-context.js';

// 書き込み前の接続手順、AIに渡す画面の場所、ヘルプ、空状態の1行。
// 実機・USB・ドライブには触らない：ドライブ選択は rp2040-flash.spec.js と同じ作りのモック。
const UF2 = Buffer.alloc(512);
const GUIDE_KEY = 'digicode-text.flash-guide.v1';
const dialog = page => page.locator('#flash-guide-dialog');

async function ready(page, env) {
  await page.addInitScript(() => {
    const mock = { picked: 0, serialRequests: 0 };
    window.__mock = mock;
    const writable = { async write() {}, async close() {} };
    const directory = { name: 'RPI-RP2', async getFileHandle() { return { async createWritable() { return writable; } }; } };
    Object.defineProperty(window, 'showDirectoryPicker', { configurable: true, get: () => (() => { mock.picked++; return Promise.resolve(directory); }) });
    if (!('serial' in navigator)) Object.defineProperty(navigator, 'serial', { configurable: true, value: {} });
    navigator.serial.getPorts = async () => [];
    navigator.serial.requestPort = () => { mock.serialRequests++; throw new Error('port dialog blocked by the test'); };
  });
  await page.route('**/compile', route => route.fulfill({ status: 200, contentType: 'application/octet-stream', body: UF2 }));
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  if (env) await selectBoard(page, env);
}
const picked = page => page.evaluate(() => window.__mock.picked);
async function built(page) {
  await page.click('#build');
  await expect(page.locator('#flash')).toBeEnabled();
}

test('every board is served a flash guide, and every figure it names is a colourless line drawing on disk', async ({ request }) => {
  const boards = await (await request.get('/boards')).json();
  const index = await readFile(new URL('../web/figures/index.js', import.meta.url), 'utf8');
  expect(boards.map(b => b.id)).toEqual(expect.arrayContaining(['xiao_rp2040', 'pico', 'xiao_esp32c3', 'wio_node']));
  for (const b of boards) {
    expect(b.flashGuide, b.id).toBeTruthy();
    expect(b.flashGuide.steps.length, b.id).toBeGreaterThan(0);
    for (const step of b.flashGuide.steps) {
      expect(typeof step.text).toBe('string');
      expect(step.text.length).toBeGreaterThan(0);
      const svg = await readFile(new URL(`../web/figures/${step.figure}.svg`, import.meta.url), 'utf8');
      expect(svg).toContain('<svg');
      // 色はテーマ変数から与える。図のファイルに色の値は書かない。
      expect(svg, step.figure).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
      expect(index, step.figure).toContain(`'${step.figure}'`);
    }
    for (const note of b.flashGuide.notes ?? []) expect(typeof note).toBe('string');
  }
  // 手順に出てよいのは製品の操作とボードの部品だけ。外部ツールの手順はここにも書かない。
  for (const b of boards) {
    const all = [...b.flashGuide.steps.map(s => s.text), ...(b.flashGuide.notes ?? [])].join('\n');
    for (const re of [/esptool/i, /0x[0-9a-f]+/i, /zip/i, /DFU/]) expect(all, b.id).not.toMatch(re);
  }
});

test('the guide comes before the drive picker, and OK goes on to the existing flash path', async ({ page }) => {
  await ready(page, 'xiao_rp2040');
  await built(page);
  await page.click('#flash');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#flash-guide-title')).toContainText('XIAO RP2040');
  await expect(page.locator('#flash-guide-steps li')).toHaveCount(3);
  await expect(page.locator('#flash-guide-steps')).toContainText('Bボタン');
  await expect(page.locator('#flash-guide-steps')).toContainText('RPI-RP2');
  await expect(page.locator('#flash-guide-notes')).toContainText('不正な取り出し');
  // 図はモーダルの中に本物のSVGとして入っている。
  await expect(page.locator('#flash-guide-steps .flash-figure svg')).toHaveCount(3);
  expect(await page.locator('.flash-figure').first().getAttribute('data-figure')).toBe('bootsel-hold-xiao');
  expect(await picked(page)).toBe(0); // ここまでドライブ選択は開いていない
  await page.click('#flash-guide-ok');
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');
  expect(await picked(page)).toBe(1);
});

test('キャンセルでは書き込みも設定の保存もしない', async ({ page }) => {
  await ready(page, 'pico');
  await built(page);
  await page.click('#flash');
  await expect(page.locator('#flash-guide-steps')).toContainText('BOOTSELボタン');
  // 基板の図はボード別。Picoの手順にXIAOの図は出ない。
  expect(await page.locator('.flash-figure').first().getAttribute('data-figure')).toBe('bootsel-hold-pico');
  await page.click('#flash-guide-cancel');
  await expect(dialog(page)).toBeHidden();
  expect(await picked(page)).toBe(0);
  await expect(page.locator('#flash-status')).toBeHidden();
  expect(await page.evaluate(k => localStorage.getItem(k), GUIDE_KEY)).toBe(null);
  await expect(page.locator('#flash')).toBeEnabled();
  // Escapeも同じ扱い。
  await page.click('#flash');
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  expect(await picked(page)).toBe(0);
});

test('「次回から表示しない」はボード別に保存され、「接続手順」から出し直せる', async ({ page }) => {
  await ready(page, 'xiao_rp2040');
  await built(page);
  await page.click('#flash');
  await page.check('#flash-guide-skip');
  await page.click('#flash-guide-ok');
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), GUIDE_KEY)).toEqual({ xiao_rp2040: true });

  // このボードでは次から出ない：書き込みがそのまま走る。
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  await built(page);
  await page.click('#flash');
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');
  expect(await picked(page)).toBe(1); // reloadでモックの数え直し。この読み込みでは1回だけ開いた

  // それでもタブバーの「接続手順」から開ける。開いても書き込みは始まらない。
  await page.click('#flash-guide-open');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#flash-guide-skip')).toBeChecked();
  await expect(page.locator('#flash-guide-cancel')).toBeHidden();
  await page.uncheck('#flash-guide-skip');
  await page.click('#flash-guide-ok');
  expect(await picked(page)).toBe(1); // 手順を見ただけではドライブ選択は開かない
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), GUIDE_KEY)).toEqual({});

  // 保存はボードごと：別のボードでは出る。
  await page.evaluate(k => localStorage.setItem(k, JSON.stringify({ xiao_rp2040: true })), GUIDE_KEY);
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  await selectBoard(page, 'xiao_esp32c3');
  await page.route('**/compile', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ format: 'digicode-text-flash-set', version: 2, board: 'seeed_xiao_esp32c3', chip: 'esp32c3', flashMode: 'dio', flashFrequency: '80m', flashSize: '4MB', images: [{ file: 'firmware.bin', address: '0x10000', size: 4, sha256: '', data: Buffer.from('mock').toString('base64') }] }) }));
  await built(page);
  await page.click('#flash');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#flash-guide-steps')).toContainText('USB-C');
  await page.click('#flash-guide-cancel');
  expect(await page.evaluate(() => window.__mock.serialRequests)).toBe(0);
});

test('閲覧モードで「次回から表示しない」を外すと、次の書き込みでまたガイドが出る', async ({ page }) => {
  await ready(page, 'xiao_rp2040');
  await built(page);
  await page.click('#flash');
  await page.check('#flash-guide-skip');
  await page.click('#flash-guide-ok');
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), GUIDE_KEY)).toEqual({ xiao_rp2040: true });

  // 閲覧モードでも保存値のままのチェックが出て、外して閉じれば解除される。
  await page.click('#flash-guide-open');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#flash-guide-skip')).toBeChecked();
  await page.uncheck('#flash-guide-skip');
  await page.click('#flash-guide-ok');
  await expect(dialog(page)).toBeHidden();
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), GUIDE_KEY)).toEqual({});

  // 解除したので、書き込みボタンでまた手順が出る。
  await built(page);
  await page.click('#flash');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#flash-guide-skip')).not.toBeChecked();
  await page.click('#flash-guide-cancel');
  expect(await picked(page)).toBe(1); // 最初の1回だけ書き込んだ
});

test('設定の「接続手順の非表示をすべて解除」で、保存した非表示が全部消える', async ({ page }) => {
  await ready(page);
  await page.evaluate(k => localStorage.setItem(k, JSON.stringify({ xiao_rp2040: true, pico: true })), GUIDE_KEY);
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  await selectBoard(page, 'xiao_rp2040');
  await built(page);
  await page.click('#flash'); // 非表示の設定が残っているので、手順は出ずに書き込む
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');

  await openSettings(page);
  await page.click('#flash-guide-reset');
  expect(await page.evaluate(k => localStorage.getItem(k), GUIDE_KEY)).toBe(null);
  await page.click('#ai-settings-close'); // 設定は modal dialog。閉じないと後ろの書き込みを押せない。

  await built(page);
  await page.click('#flash');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#flash-guide-skip')).not.toBeChecked();
  await page.click('#flash-guide-cancel');
  // 別のボードの分も消えている。
  await selectBoard(page, 'pico');
  await built(page);
  await page.click('#flash');
  await expect(dialog(page)).toBeVisible();
  await page.click('#flash-guide-cancel');
});

test('Wio Nodeの手順はGroveのUSBシリアルとFUNC/RSTを図つきで出す', async ({ page }) => {
  await ready(page, 'wio_node');
  await page.click('#flash-guide-open');
  await expect(page.locator('#flash-guide-title')).toContainText('Wio Node');
  await expect(page.locator('#flash-guide-steps')).toContainText('PORT0');
  await expect(page.locator('#flash-guide-steps')).toContainText('FUNC');
  await expect(page.locator('#flash-guide-notes')).toContainText('給電専用');
  expect(await page.locator('.flash-figure').evaluateAll(els => els.map(e => e.dataset.figure)))
    .toEqual(['grove-serial-port0', 'func-rst', 'port-dialog-ft234x']);
});

// 図に書いてよいのは、その画面で利用者が実際に読む文字列だけ。説明文は手順文の側に書く。
test('図に書く文字は、画面で実際に見える文字列だけ', async () => {
  const dir = new URL('../web/figures/', import.meta.url);
  const allowed = new Set([
    'B', 'BOOTSEL', 'FUNC', 'RST', 'PORT0', 'PORT1', // ボードに印字されているボタン名・コネクタ名
    'RPI-RP2', 'NO NAME', 'USB JTAG/serial debug unit', 'FT234X', // PC側の画面に出る名前
  ]);
  const files = (await readdir(dir)).filter(f => f.endsWith('.svg'));
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const svg = await readFile(new URL(file, dir), 'utf8');
    for (const [, body] of svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) {
      expect(allowed.has(body.trim()), `${file}: ${body}`).toBe(true);
    }
  }
});

test('AIに渡す画面の場所は、実在する要素だけを指している', async ({ page }) => {
  await ready(page);
  const facts = productFacts();
  for (const fact of UI_FACTS) {
    expect(facts).toContain(fact.text);
    expect(fact.ids.length).toBeGreaterThan(0);
    for (const id of fact.ids) expect(await page.locator('#' + id).count(), `${id} は画面に無い`).toBe(1);
  }
  // 文であって、内部のキー名やJSONではない。
  expect(facts).not.toMatch(/[{}"]/);
  for (const word of ['flashGuide', 'UI_FACTS', 'productFacts', 'ids']) expect(facts).not.toContain(word);
});

test('ヘルプは10行以内で、対応ボードはボード表から出て、接続手順を開ける', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  await ready(page, 'pico');
  await page.click('#view-help');
  await expect(page.locator('#help-view')).toBeVisible();
  const lines = await page.locator('#help-view').evaluate(el => el.innerText.split('\n').map(s => s.trim()).filter(Boolean));
  expect(lines.length, lines.join(' / ')).toBeLessThanOrEqual(10);
  await expect(page.locator('#help-boards')).toHaveText(boards.map(b => b.name).join(' / '));
  await expect(page.locator('#help-view')).toContainText('Chrome');
  await expect(page.locator('#help-view')).toContainText('AI に聞けます');
  await page.click('#help-flash-guide');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#flash-guide-title')).toContainText('Raspberry Pi Pico');
});

test('ビルド結果が空のときだけ、次にすることが1行出る', async ({ page }) => {
  await ready(page);
  await page.click('#panel-toggle');
  await expect(page.locator('#build-empty')).toBeVisible();
  await expect(page.locator('#build-empty')).toHaveText('Build → 書き込み → シリアルで確認。困ったら右の AI へ');
  await built(page);
  await expect(page.locator('#build-empty')).toBeHidden();
  await expect(page.locator('#log')).toContainText('build OK');
});
