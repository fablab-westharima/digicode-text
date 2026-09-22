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

test('URL は下書き：入力を離れると /health を確かめ、保存は footer の2つが決める', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await openCompilerSection(page);

  // 届かない先：error の知らせ。入力を離れただけでは保存しない（直しに戻れるように、入力は消さない）。
  await page.fill('#compiler-url', DEAD);
  await page.locator('#compiler-url').blur();
  await expect(page.locator('#compiler-status')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#compiler-status')).toContainText('compile サーバーに届きません');
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBeNull();

  // 生きている先：ok の知らせ。末尾の / はその場で落とす。
  await page.fill('#compiler-url', 'http://127.0.0.1:3100/');
  await page.locator('#compiler-url').blur();
  await expect(page.locator('#compiler-status')).toHaveAttribute('data-state', 'ok');
  await expect(page.locator('#compiler-status')).toContainText('接続できました');
  await expect(page.locator('#compiler-url')).toHaveValue('http://127.0.0.1:3100');
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBeNull();

  // http(s) でないものは footer が断る：dialog は開いたまま、断った節が出て、保存値も増えない。
  await page.fill('#compiler-url', 'example.com');
  await page.click('#ai-save');
  await expect(page.locator('#ai-settings')).toBeVisible();
  await expect(page.locator('#settings-compiler')).toBeVisible();
  await expect(page.locator('#compiler-status')).toHaveAttribute('data-state', 'error');
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBeNull();

  // 「保存せず使う」：閉じるが、このブラウザには書かない。
  await page.fill('#compiler-url', 'http://127.0.0.1:3100');
  await page.click('#ai-use');
  await expect(page.locator('#ai-settings')).toBeHidden();
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBeNull();

  // 開き直すと、いま効いている値が下書きに入っている。「保存して閉じる」で初めて保存する。
  await openCompilerSection(page);
  await expect(page.locator('#compiler-url')).toHaveValue('http://127.0.0.1:3100');
  await page.click('#ai-save');
  await expect(page.locator('#ai-settings')).toBeHidden();
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBe('http://127.0.0.1:3100');

  // 空にして保存すると同じオリジンへ戻り、保存値も消える。
  await openCompilerSection(page);
  await page.fill('#compiler-url', '');
  await page.click('#ai-save');
  await expect(page.locator('#ai-settings')).toBeHidden();
  expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBeNull();

  // 保存した先は、そのあとの fetch が使う。
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

test('ボード一覧を取れなくても保存済みプロジェクトはそのまま開き、壊れ扱いにしない', async ({ page }) => {
  const KEY_PROJECTS = 'digicode-text.projects.v1';
  const source = '// saved while the compile server was up\n';
  const saved = {
    version: 1, activeId: 'p1', migration: 'none',
    projects: [{ id: 'p1', name: '保存済み', source, env: 'pico', libraries: [], revision: 3,
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z' }],
  };
  await page.addInitScript(({ k, v }) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(v)); }, { k: KEY_PROJECTS, v: saved });
  await page.route('**/boards', route => route.abort('connectionrefused'));
  await page.goto('/');

  // compile 節の error はこれまでどおり出る。
  await expect(page.locator('#compiler-status')).toHaveAttribute('data-state', 'error');
  await page.keyboard.press('Escape');

  // 保存済みの内容がそのまま載り、「読み込めません」「上書きを停止」は出ない。
  await expect(page.locator('.monaco-editor')).toBeVisible();
  await expect(page.locator('.monaco-editor .view-lines')).toContainText('saved while the compile server was up');
  await expect(page.locator('#save-status')).not.toContainText('読み込めません');
  await expect(page.locator('#save-status')).not.toContainText('上書きを停止');
  await page.screenshot({ path: 'test-results/boards-down-keeps-saved-project.png' });

  // localStorage は新規プロジェクトに置き換わっていない。
  const after = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY_PROJECTS);
  expect(after.projects.map(p => p.id)).toEqual(['p1']);
  expect(after.projects[0].source).toBe(source);
  expect(after.projects[0].env).toBe('pico');
});
