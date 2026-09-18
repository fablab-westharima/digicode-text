import { test, expect } from '@playwright/test';
import { openBoards, openExplorer, openAI } from './shell.js';

const LAYOUT = 'digicode-text.layout.v1';
const PROJECTS = 'digicode-text.projects.v1';

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
}
const box = (page, selector) => page.locator(selector).boundingBox();
const layout = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), LAYOUT);

test('Activity bar switches sidebar views, marks the selected one and collapses on a repeat click', async ({ page }, info) => {
  await ready(page);
  // Explorer is the view a first visit opens on.
  await expect(page.locator('#explorer-view')).toBeVisible();
  await expect(page.locator('#view-explorer')).toHaveAttribute('aria-pressed', 'true');

  await page.click('#view-boards'); // step off Explorer so the loop below always switches views
  const views = [
    ['#view-explorer', '#explorer-view'],
    ['#libraries-open', '#libraries-dialog'],
    ['#view-boards', '#boards-view'],
    ['#view-settings', '#ai-settings'],
    ['#view-help', '#help-view'],
  ];
  for (const [button, view] of views) {
    await page.click(button);
    await expect(page.locator(view)).toBeVisible();
    for (const [otherButton, other] of views) {
      if (other === view) continue;
      await expect(page.locator(other)).toBeHidden();
      await expect(page.locator(otherButton)).toHaveAttribute('aria-pressed', 'false');
    }
    await expect(page.locator(button)).toHaveAttribute('aria-pressed', 'true');
  }
  await page.screenshot({ path: info.outputPath('sidebar-help.png') });

  // The same button again folds the sidebar away; the editor takes the space back.
  const wide = (await box(page, '#editor-column')).width;
  await page.click('#view-help');
  await expect(page.locator('#sidebar')).toBeHidden();
  expect((await box(page, '#editor-column')).width).toBeGreaterThan(wide);
  await page.click('#view-help');
  await expect(page.locator('#help-view')).toBeVisible();

  // AI支援 is the right panel's toggle and leaves the sidebar selection alone.
  await page.click('#ai-open');
  await expect(page.locator('#ai-pane')).toBeVisible();
  await expect(page.locator('#help-view')).toBeVisible();
  await expect(page.locator('#view-help')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#ai-open');
  await expect(page.locator('#ai-pane')).toBeHidden();
});

test('Layout state is saved and restored: view, widths, panel height, AI panel, and reset', async ({ page }) => {
  await ready(page);
  expect(await layout(page)).toMatchObject({ sidebarOpen: true, sidebarView: 'explorer', sidebarWidth: 320, panelOpen: false, aiOpen: false });

  await page.click('#view-boards');
  await openAI(page);
  await page.click('#panel-toggle');
  await page.locator('#sidebar-resize').focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight'); // 320 -> 392
  await page.locator('#ai-resize').focus();
  for (let i = 0; i < 2; i++) await page.keyboard.press('ArrowLeft'); // 420 -> 468
  await page.locator('#panel-resize').focus();
  await page.keyboard.press('ArrowUp'); // taller output panel

  const saved = await layout(page);
  expect(saved.sidebarView).toBe('boards');
  expect(saved.sidebarWidth).toBe(392);
  expect(saved.aiWidth).toBe(468);
  expect(saved.aiOpen).toBe(true);
  expect(saved.panelOpen).toBe(true);
  expect(saved.panelHeight).toBeGreaterThan(220);
  expect(Math.round((await box(page, '#sidebar')).width)).toBe(392);
  expect(Math.round((await box(page, '#ai-pane')).width)).toBe(468);

  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  expect(await layout(page)).toEqual(saved);
  await expect(page.locator('#boards-view')).toBeVisible();
  await expect(page.locator('#ai-pane')).toBeVisible();
  await expect(page.locator('#panel-body')).toBeVisible();
  expect(Math.round((await box(page, '#sidebar')).width)).toBe(392);
  expect(Math.round((await box(page, '#ai-pane')).width)).toBe(468);
  expect(Math.round((await box(page, '#panel-body')).height)).toBe(saved.panelHeight);

  // レイアウトを初期化 puts every one of those back to the default.
  await page.click('#view-settings');
  await page.click('#layout-reset');
  expect(await layout(page)).toMatchObject({ sidebarOpen: true, sidebarView: 'explorer', sidebarWidth: 320, panelOpen: false, panelHeight: 220, aiOpen: false, aiWidth: 420 });
  await expect(page.locator('#panel-body')).toBeHidden();
  await expect(page.locator('#ai-pane')).toBeHidden();

  // A damaged record is replaced by the defaults instead of breaking the page.
  await page.evaluate(key => localStorage.setItem(key, '{broken'), LAYOUT);
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  await expect(page.locator('#explorer-view')).toBeVisible();
  expect(Math.round((await box(page, '#sidebar')).width)).toBe(320);
});

test('The output panel stays inside the editor column, beside the sidebar and the AI panel', async ({ page }, info) => {
  await ready(page);
  await openAI(page);
  await page.click('#panel-toggle');
  await expect(page.locator('#panel-body')).toBeVisible();

  const panel = await box(page, '#panel');
  const column = await box(page, '#editor-column');
  const sidebar = await box(page, '#sidebar');
  const ai = await box(page, '#ai-pane');
  const editor = await box(page, '#editor');

  // Inside the editor column, horizontally and vertically.
  expect(panel.x).toBeGreaterThanOrEqual(column.x);
  expect(panel.x + panel.width).toBeLessThanOrEqual(column.x + column.width + 1);
  expect(panel.y + panel.height).toBeLessThanOrEqual(column.y + column.height + 1);
  // Never under the sidebar, never under the AI panel.
  expect(panel.x).toBeGreaterThanOrEqual(sidebar.x + sidebar.width);
  expect(panel.x + panel.width).toBeLessThanOrEqual(ai.x + 1);
  // The AI panel keeps its full height while the panel is open: it is not cut from below.
  expect(ai.y + ai.height).toBeGreaterThan(panel.y + panel.height - 1);
  expect(editor.y + editor.height).toBeLessThanOrEqual(panel.y + 1);
  await page.screenshot({ path: info.outputPath('panel-in-column.png') });
});

test('The sidebar ad slot reserves a 300x250 frame and folds away with the sidebar', async ({ page }) => {
  await ready(page);
  const sidebar = await box(page, '#sidebar');
  const slot = await box(page, '#ad-slot');
  const inner = await box(page, '#ad-slot-inner');
  expect(Math.abs(slot.width - sidebar.width)).toBeLessThanOrEqual(1); // the sidebar's 1px border
  expect(Math.round(slot.height)).toBe(250);
  expect(Math.round(inner.width)).toBe(300);
  expect(Math.round(inner.height)).toBe(250);
  // At the bottom of the sidebar, centred, and above the status bar.
  expect(Math.round(slot.y + slot.height)).toBe(Math.round(sidebar.y + sidebar.height));
  expect(Math.round(inner.x - slot.x)).toBe(Math.round(slot.x + slot.width - inner.x - inner.width));
  // A placeholder only: no ad code, no frame, no outbound request.
  expect(await page.locator('#ad-slot iframe, #ad-slot script, #ad-slot img').count()).toBe(0);
  await page.click('#view-explorer');
  await expect(page.locator('#ad-slot')).toBeHidden();
});

test('The Boards view shows exactly what /boards reports for the selected board', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  await ready(page);
  await openBoards(page);
  for (const board of boards) {
    await page.selectOption('#env', board.id);
    await expect(page.locator('#board-facts')).toContainText(board.name);
    await expect(page.locator('#board-facts')).toContainText(board.core);
    await expect(page.locator('#board-facts')).toContainText(board.flashHint);
    await expect(page.locator('#status-board')).toHaveText(board.name);

    // pinTableNote is shown, and only when the board has one.
    await expect(page.locator('.board-warning')).toHaveCount(board.pinTableNote ? 1 : 0);
    if (board.pinTableNote) await expect(page.locator('.board-warning')).toHaveText(board.pinTableNote);

    // The pin table is the compiler's own table: same rows, same order, same GPIO numbers.
    const rows = await page.locator('.pin-table tbody tr').evaluateAll(list =>
      list.map(tr => [...tr.children].map(td => td.textContent)));
    const expected = [
      ...board.pins.pins.map(p => [p.label, p.gpio === null ? `— (pin ${p.pin})` : `GPIO${p.gpio}`,
        [...p.functions, ...(p.adc && p.adc !== p.label ? [p.adc] : []), ...(p.note ? [p.note] : [])].join('、')]),
      ...(board.pins.unlabelledFunctions ?? []).map(f => ['—', `GPIO${f.gpio}`,
        [f.name, 'ラベル無し', ...(f.note ? [f.note] : [])].join('、')]),
    ];
    expect(rows).toEqual(expected);
    await expect(page.locator('#board-facts')).toContainText(board.pins.variant);

    // Every sourced note, with its source listed once and linked when it is a URL.
    const notes = await page.locator('.board-notes li').allTextContents();
    const sources = [...new Set(board.pinNotes.map(n => n.source))];
    expect(notes).toEqual(board.pinNotes.map(n => `${n.text} [${sources.indexOf(n.source) + 1}]`));
    expect(await page.locator('.board-sources li').allTextContents()).toEqual(sources);
    expect(await page.locator('.board-sources a').count()).toBe(sources.filter(s => /^https?:\/\//.test(s)).length);
    // Facts only; the view never offers a way to edit them.
    expect(await page.locator('#board-facts input, #board-facts textarea, #board-facts button').count()).toBe(0);
  }
});

test('Projects, libraries and AI settings saved by the old UI open unchanged in the new one', async ({ page }) => {
  // Exactly the records the previous layout wrote: same keys, same shapes, no layout record.
  const project = {
    id: '11111111-2222-3333-4444-555555555555', name: '旧UIのプロジェクト',
    source: '// saved by the old toolbar UI\nvoid setup() {}\nvoid loop() {}\n',
    env: 'pico', libraries: [{ id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3' }],
    createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z', revision: 7,
  };
  const stored = { version: 1, activeId: project.id, migration: 'none', projects: [project] };
  await page.addInitScript(({ stored }) => {
    localStorage.setItem('digicode-text.projects.v1', JSON.stringify(stored));
    localStorage.setItem('digicode-text.ai.openai.v1', JSON.stringify({ key: 'dummy-legacy-key', model: 'gpt-4.1-mini', api: 'chat' }));
    localStorage.setItem('digicode-text.ai.default.v1', JSON.stringify({ provider: 'openai', model: 'gpt-4.1-mini', api: 'chat' }));
    localStorage.setItem('digicode-text.ai-ui.v1', JSON.stringify({ mode: 'review' }));
  }, { stored });
  await ready(page);

  await expect(page.locator('#save-status')).toContainText('保存済み');
  await expect(page.locator('#project-name')).toHaveText('旧UIのプロジェクト');
  await expect(page.locator('.view-lines')).toContainText('saved by the old toolbar UI');
  await expect(page.locator('#env')).toHaveValue('pico');
  await expect(page.locator('#ai-mode')).toHaveValue('review');
  await expect(page.locator('#ai-connection')).toHaveText('OpenAI / GPT-4.1 Mini · キー設定あり');

  await page.click('#libraries-open');
  // 行は名前と版だけ。提供者は名前を押して開く箱の中。
  await expect(page.locator('#library-added')).toContainText('ArduinoJson');
  await expect(page.locator('#library-added')).toContainText('7.4.3');
  if (await page.locator('#library-added-toggle').getAttribute('aria-expanded') === 'false') await page.click('#library-added-toggle'); // 追加済みは初期状態で閉じている
  await page.locator('#library-added .library-item').click();
  await expect(page.locator('#library-added-detail')).toContainText('bblanchon');
  await openExplorer(page);
  await expect(page.locator('.project-item[aria-current="true"]')).toContainText('旧UIのプロジェクト');

  // Opening it did not rewrite the record.
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), PROJECTS)).toEqual(stored);
});
