import { test, expect } from '@playwright/test';
import { openSettings } from './shell.js';

// 設定の「compile サーバー」。Text 本体を別オリジンに置いたときに、Build を頼む先を指す。
const KEY = 'digicode-text.compiler.v1';
// つながらない先。127.0.0.1 の閉じた port なので、外へは 1 件も出ない。
const DEAD = 'http://127.0.0.1:3199';

const openCompilerSection = async (page) => {
  await openSettings(page);
  await page.click('#settings-nav button[data-section="compiler"]');
};

test('設定が無ければ、これまでどおり同じオリジンの compile サーバーを使う', async ({ page }) => {
  const asked = [];
  page.on('request', r => { if (new URL(r.url()).pathname === '/boards') asked.push(r.url()); });
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();

  expect(asked).toEqual(['http://127.0.0.1:3100/boards']);
  expect(await page.locator('#env option').count()).toBeGreaterThan(0);
  // 保存値は書かれない。空欄は「このページと同じサーバー」の意味。
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBeNull();
  await openCompilerSection(page);
  await expect(page.locator('#compiler-url')).toHaveValue('');
  await expect(page.locator('#compiler-status')).toHaveText('');
});

test('URL を入れるとその場で保存し、/health の結果を出す', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await openCompilerSection(page);

  // 届かない先：error の知らせ。保存はされる（直しに戻れるように、入力は消さない）。
  await page.fill('#compiler-url', DEAD);
  await page.locator('#compiler-url').blur();
  await expect(page.locator('#compiler-status')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#compiler-status')).toContainText('compile サーバーに届きません');
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBe(DEAD);

  // 生きている先：ok の知らせ。末尾の / は落として保存する。
  await page.fill('#compiler-url', 'http://127.0.0.1:3100/');
  await page.locator('#compiler-url').blur();
  await expect(page.locator('#compiler-status')).toHaveAttribute('data-state', 'ok');
  await expect(page.locator('#compiler-status')).toContainText('接続できました');
  await expect(page.locator('#compiler-url')).toHaveValue('http://127.0.0.1:3100');
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBe('http://127.0.0.1:3100');

  // http(s) でないものは拒否し、保存値は前のまま。
  await page.fill('#compiler-url', 'example.com');
  await page.locator('#compiler-url').blur();
  await expect(page.locator('#compiler-status')).toHaveAttribute('data-state', 'error');
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBe('http://127.0.0.1:3100');

  // 空にすると同じオリジンへ戻り、保存値も消える。
  await page.fill('#compiler-url', '');
  await page.locator('#compiler-url').blur();
  await expect(page.locator('#compiler-status')).toHaveAttribute('data-state', 'ok');
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBeNull();

  // 保存した先は、そのあとの fetch が使う。/boards は読み込み直したときに取る。
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, 'http://127.0.0.1:3100']);
  const asked = [];
  page.on('request', r => { if (new URL(r.url()).pathname === '/boards') asked.push(r.url()); });
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  expect(asked).toEqual(['http://127.0.0.1:3100/boards']);
});

test('ボード一覧を取れなくても本体は開き、compile サーバーの節が error つきで開く', async ({ page }) => {
  // 3100 が止まっている状態と同じにする：/boards を落とす。
  await page.route('**/boards', route => route.abort('connectionrefused'));
  await page.goto('/');

  // 設定の dialog が「compile サーバー」の節で開いている。
  await expect(page.locator('#ai-settings')).toBeVisible();
  await expect(page.locator('#settings-compiler')).toBeVisible();
  await expect(page.locator('#settings-nav button[data-section="compiler"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#compiler-status')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#compiler-status')).toContainText('compile サーバーに届きません');

  // 本体は開いている：エディタが載り、ボードの選択肢は空。
  await page.keyboard.press('Escape');
  await expect(page.locator('#ai-settings')).toBeHidden();
  await expect(page.locator('.monaco-editor')).toBeVisible();
  expect(await page.locator('#env option').count()).toBe(0);
  await expect(page.locator('#status')).toContainText('compile サーバーに届きません');

  // 取説も開ける（ボードの節は空のまま）。
  await page.click('#view-help');
  await expect(page.locator('#help-dialog')).toBeVisible();
  await page.click('#help-nav button[data-section="boards"]');
  await expect(page.locator('#help-board-list')).toBeEmpty();
});
