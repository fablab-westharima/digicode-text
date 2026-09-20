import { test, expect } from '@playwright/test';
import { openBoards } from './shell.js';

// ボード view を、エクスプローラ・ライブラリと同じ「一覧は名前だけ・押すと詳細の箱」に揃えたことの確認。
async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await openBoards(page);
}
const item = (page, id) => page.locator(`#board-list li[data-board-id="${id}"]`);
const rowOf = (page, id) => item(page, id).locator('.board-item');

test('一覧は /boards の行で名前だけ（実機確認待ちの印は付く）、選択中の行はハイライト、初期は箱なし', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  await ready(page);
  // 行の文字は名前だけ。実機確認待ちの板だけ、名前のうしろに印が付く。
  const label = b => b.name + (b.hardwareVerified === false ? '実機確認待ち' : '');
  expect((await page.locator('#board-list .board-item').allTextContents()).sort()).toEqual(boards.map(label).sort());
  await expect(page.locator('#board-list .board-item')).toHaveCount(boards.length);
  await expect(page.locator('#board-detail')).toHaveCount(0);
  await expect(page.locator('#board-facts')).toHaveCount(0);
  await expect(page.locator('#env')).toBeHidden();
  // 選択中の印はエクスプローラと同じハイライトで、選択中の 1 行だけ。✓ は使わない。
  await expect(page.locator('.board-item[aria-current="true"]')).toHaveCount(1);
  await expect(rowOf(page, 'xiao_rp2040')).toHaveAttribute('aria-current', 'true');
  await expect(rowOf(page, 'pico')).toHaveAttribute('aria-current', 'false');
  const style = locator => locator.evaluate(el => { const s = getComputedStyle(el); return { bg: s.backgroundColor, border: s.borderTopColor, mark: getComputedStyle(el.querySelector('strong'), '::before').content }; });
  const current = await style(rowOf(page, 'xiao_rp2040')), other = await style(rowOf(page, 'pico'));
  expect(current.bg).not.toBe(other.bg);
  expect(current.border).not.toBe(other.border);
  // 印の枠は共通規則の .list-row が全行に確保する（content: ''）。✓ は「追加済み」の印なので、
  // 選択中の行にも付かない。
  expect(current.mark).not.toContain('✓');
  expect(other.mark).toBe(current.mark);
  // エクスプローラの選択中プロジェクトと同じ色。
  await page.click('#view-explorer');
  const project = await page.locator('.project-item[aria-current="true"]').evaluate(el => { const s = getComputedStyle(el); return { bg: s.backgroundColor, border: s.borderTopColor }; });
  expect({ bg: current.bg, border: current.border }).toEqual(project);
  await page.click('#view-boards');
  // 常時表示の説明文は置かない。
  await expect(page.locator('#boards-view .storage-hint')).toHaveCount(0);
});

test('行を押すと箱に要約と 2 つのボタンが出て、別の行で前の箱が閉じ、もう一度押すと閉じる', async ({ page }) => {
  await ready(page);
  await rowOf(page, 'wio_node').click();
  await expect(rowOf(page, 'wio_node')).toHaveAttribute('aria-expanded', 'true');
  await expect(rowOf(page, 'wio_node')).toBeFocused();
  const box = item(page, 'wio_node').locator('#board-detail');
  await expect(box).toHaveClass(/detail-box/);
  expect(await box.locator('dt').allTextContents()).toEqual(['framework', 'core', '成果物', 'ブラウザから書き込み', 'Serialモニタ']);
  expect(await box.locator('dd').allTextContents()).toEqual(['Arduino', 'Arduino ESP8266', '書き込みセット', '対応', '利用できる']);
  await expect(box.locator('#board-select')).toHaveText('このボードを選ぶ');
  await expect(box.locator('#board-pins-toggle')).toHaveAttribute('aria-expanded', 'false');
  // 行を押しただけではボードは変わらない。
  await expect(page.locator('#env')).toHaveValue('xiao_rp2040');

  await rowOf(page, 'xiao_rp2040').click();
  await expect(page.locator('#board-detail')).toHaveCount(1);
  await expect(rowOf(page, 'wio_node')).toHaveAttribute('aria-expanded', 'false');
  const current = item(page, 'xiao_rp2040').locator('#board-detail');
  await expect(current.locator('dd').nth(2)).toHaveText('UF2');
  // 選択中の箱にはボタンの代わりに「選択中」。
  await expect(current.locator('#board-select')).toHaveCount(0);
  await expect(current.locator('.board-current')).toHaveText('選択中');

  await rowOf(page, 'xiao_rp2040').click();
  await expect(page.locator('#board-detail')).toHaveCount(0);
  await expect(rowOf(page, 'xiao_rp2040')).toBeFocused();

  // view を開き直したら閉じている。
  await rowOf(page, 'pico').click();
  await page.click('#view-explorer'); await page.click('#view-boards');
  await expect(page.locator('#board-detail')).toHaveCount(0);
});

test('このボードを選ぶでハイライトが移り、#env と status bar が変わり、Build 状態が changed になる', async ({ page }) => {
  await ready(page);
  await expect(page.locator('#status-build')).toHaveAttribute('data-state', 'ready');
  await rowOf(page, 'xiao_esp32c3').click();
  await page.click('#board-select');
  await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
  await expect(page.locator('#status-board')).toHaveText('XIAO ESP32C3');
  await expect(page.locator('.board-item[aria-current="true"]')).toHaveText('XIAO ESP32C3');
  await expect(page.locator('#status-build')).toHaveAttribute('data-state', 'changed');
  // 箱は開いたままで、表示が「選択中」に替わる。
  await expect(item(page, 'xiao_esp32c3').locator('.board-current')).toHaveText('選択中');
  await expect(page.locator('#board-select')).toHaveCount(0);
  // 保存されている: 読み込み直しても同じボード。
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
});

test('ピン表と注意点で #board-facts が箱の中に出て variant を含み、もう一度押すと閉じる', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  const board = boards.find(b => b.id === 'xiao_rp2040');
  await ready(page);
  await rowOf(page, board.id).click();
  const facts = page.locator('#board-detail #board-facts');
  await expect(facts).toBeHidden();
  await page.click('#board-pins-toggle');
  await expect(page.locator('#board-pins-toggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(facts).toBeVisible();
  await expect(facts.locator('.pin-table tbody tr')).toHaveCount(board.pins.pins.length + (board.pins.unlabelledFunctions ?? []).length);
  await expect(facts.locator('.board-variant')).toHaveText(`出所: variant「${board.pins.variant}」`);
  await expect(facts.locator('.board-flash-hint')).toHaveText(board.flashHint);
  expect(await facts.locator('button, input, textarea').count()).toBe(0);
  // 箱がサイドバーからはみ出さない。
  const overflow = await page.locator('#boards-view').evaluate(el => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.click('#board-pins-toggle');
  await expect(facts).toBeHidden();
});

test('一覧は vendor の小見出しで括られ、vendor 名→ボード名の順。#env の option は /boards の順のまま', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  await ready(page);
  const vendors = [...new Set(boards.map(b => b.vendor))].sort((a, b) => a.localeCompare(b));
  expect(await page.locator('#board-list > h4.board-vendor').allTextContents()).toEqual(vendors);
  expect(vendors).toEqual(['Espressif', 'Raspberry Pi', 'Seeed Studio']);
  const label = b => b.name + (b.hardwareVerified === false ? '実機確認待ち' : '');
  // 見出しのすぐ下の ul に、その vendor のボードが名前順で入る。
  for (const vendor of vendors) {
    const names = await page.locator('#board-list > h4.board-vendor', { hasText: vendor }).locator('xpath=following-sibling::ul[1]').locator('.board-item').allTextContents();
    expect(names).toEqual(boards.filter(b => b.vendor === vendor).sort((a, b) => a.name.localeCompare(b.name)).map(label));
  }
  expect(await page.locator('#board-list .board-item').allTextContents())
    .toEqual(['ESP32-DevKitC V4実機確認待ち', 'Raspberry Pi Pico', 'Wio Node', 'XIAO ESP32C3', 'XIAO ESP32S3実機確認待ち', 'XIAO RP2040']);
  expect(await page.locator('#env option').evaluateAll(list => list.map(o => o.value))).toEqual(boards.map(b => b.id));
  // 小見出しは view の見出しより一段小さい。
  const size = sel => page.locator(sel).first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(await size('.board-vendor')).toBeLessThan(await size('.view-section-title'));
});
