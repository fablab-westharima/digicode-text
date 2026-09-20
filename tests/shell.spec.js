import { test, expect } from '@playwright/test';
import { openBoards, selectBoard, openExplorer, openAI } from './shell.js';

const LAYOUT = 'digicode-text.layout.v1';
const PROJECTS = 'digicode-text.projects.v1';
// The ids the settings dialog carried before it became a <dialog>: the hooks app.js and
// ai-settings.js bind to. The restructure moved them between sections; it must not have
// duplicated or dropped one.
const SETTINGS_IDS = ['ai-settings', 'ai-settings-title', 'ai-settings-close',
  'theme-select', 'layout-reset', 'flash-guide-reset',
  'ai-provider', 'ai-key', 'ai-model-choice', 'ai-advanced', 'ai-model', 'ai-api-info', 'ai-api', 'ai-api-help',
  'ai-settings-status', 'ai-save', 'ai-use', 'ai-default', 'ai-delete'];

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
  await page.screenshot({ path: info.outputPath('sidebar-boards.png') });

  // The same button again folds the sidebar away; the editor takes the space back.
  const wide = (await box(page, '#editor-column')).width;
  await page.click('#view-boards');
  await expect(page.locator('#sidebar')).toBeHidden();
  expect((await box(page, '#editor-column')).width).toBeGreaterThan(wide);
  await page.click('#view-boards');
  await expect(page.locator('#boards-view')).toBeVisible();

  // ヘルプは sidebar の view ではなく <dialog>。設定と同じで、押しても sidebar が出している
  // view も、活動バーの選択（aria-pressed）も動かない。
  await page.click('#view-help');
  await expect(page.locator('#help-dialog')).toBeVisible();
  await expect(page.locator('#boards-view')).toBeVisible();
  await expect(page.locator('#view-boards')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#view-help')).toHaveAttribute('aria-pressed', 'false');
  await page.click('#help-close');
  await expect(page.locator('#help-dialog')).toBeHidden();

  // AI支援 is the right panel's toggle and leaves the sidebar selection alone.
  await page.click('#ai-open');
  await expect(page.locator('#ai-pane')).toBeVisible();
  await expect(page.locator('#boards-view')).toBeVisible();
  await expect(page.locator('#view-boards')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#ai-open');
  await expect(page.locator('#ai-pane')).toBeHidden();
});

test('Settings opens as a modal dialog over the shell and leaves the sidebar selection alone', async ({ page }, info) => {
  await ready(page);
  await page.click('#view-boards');
  await expect(page.locator('#boards-view')).toBeVisible();

  await page.click('#view-settings');
  await expect(page.locator('#ai-settings')).toBeVisible();
  // A real <dialog>, shown modally — not a sidebar view wearing the dialog protocol.
  expect(await page.locator('#ai-settings').evaluate(el => el.tagName)).toBe('DIALOG');
  expect(await page.locator('#ai-settings').evaluate(el => el.matches(':modal'))).toBe(true);
  // The sidebar keeps showing whatever it was showing; 設定 is not one of its views.
  await expect(page.locator('#boards-view')).toBeVisible();
  await expect(page.locator('#view-boards')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#view-settings')).toHaveAttribute('aria-pressed', 'false');

  // Opened from the activity bar, the first section is 外観; the table of contents marks it.
  await expect(page.locator('#settings-appearance')).toBeVisible();
  await expect(page.locator('#settings-ai')).toBeHidden();
  await expect(page.locator('#settings-nav button[data-section="appearance"]')).toHaveAttribute('aria-current', 'true');
  await page.screenshot({ path: info.outputPath('settings-dialog.png') });

  // 節は「外観」「AI」の2つだけ。「保存」の節は解体され、その中身は AI の節の中にある。
  expect(await page.locator('#settings-nav button').count()).toBe(2);
  expect(await page.locator('#settings-storage').count()).toBe(0);
  expect(await page.locator('#settings-nav button[data-section="storage"]').count()).toBe(0);
  for (const id of ['ai-default', 'ai-delete'])
    expect(await page.locator(`#settings-ai #${id}`).count(), id).toBe(1);

  // The table of contents shows one section at a time, and aria-current follows.
  for (const section of ['ai', 'appearance']) {
    await page.click(`#settings-nav button[data-section="${section}"]`);
    for (const other of ['appearance', 'ai']) {
      await expect(page.locator(`#settings-${other}`))[other === section ? 'toBeVisible' : 'toBeHidden']();
      await expect(page.locator(`#settings-nav button[data-section="${other}"]`))
        .toHaveAttribute('aria-current', String(other === section));
    }
    // 受入条件（1100x850、詳細設定は閉じたまま）: どの節も縦に収まり、右側はスクロールしない。
    expect(await page.locator('#ai-advanced').evaluate(el => el.open)).toBe(false);
    const fits = await page.locator('#settings-content').evaluate(el => el.scrollHeight <= el.clientHeight);
    expect(fits, `${section} の節が #settings-content に収まらない`).toBe(true);
  }

  // A control inside the dialog acts without closing it.
  await page.click('#layout-reset');
  await expect(page.locator('#ai-settings')).toBeVisible();
  // A click on the backdrop does not close it either; 閉じる and Escape do.
  await page.mouse.click(4, 4);
  await expect(page.locator('#ai-settings')).toBeVisible();
  await page.click('#ai-settings-close');
  await expect(page.locator('#ai-settings')).toBeHidden();
  await page.click('#view-settings');
  await expect(page.locator('#ai-settings')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ai-settings')).toBeHidden();
});

test('The section a settings dialog opens on is the one the opener asks for, and every id is there once', async ({ page }) => {
  await ready(page);
  // The AI panel's connection line opens the same dialog on AI API設定.
  await openAI(page);
  await page.click('#ai-settings-open');
  await expect(page.locator('#settings-ai')).toBeVisible();
  await expect(page.locator('#settings-appearance')).toBeHidden();
  await expect(page.locator('#settings-nav button[data-section="ai"]')).toHaveAttribute('aria-current', 'true');
  for (const id of SETTINGS_IDS) expect(await page.locator(`#${id}`).count(), id).toBe(1);

  // Each opener decides again, in either order: the previous section is not carried over.
  await page.click('#ai-settings-close');
  await page.click('#view-settings');
  await expect(page.locator('#settings-appearance')).toBeVisible();
  await expect(page.locator('#settings-ai')).toBeHidden();
  await page.click('#ai-settings-close');
  await page.click('#ai-settings-open');
  await expect(page.locator('#settings-ai')).toBeVisible();
  await expect(page.locator('#settings-appearance')).toBeHidden();
  await page.click('#ai-settings-close');
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
    await selectBoard(page, board.id);
    // 行は名前だけ。実機で確かめていない板は、名前のうしろに印が付く。
    await expect(page.locator(`#board-list li[data-board-id="${board.id}"] .board-item`))
      .toHaveText(board.name + (board.hardwareVerified === false ? '実機確認待ち' : ''));
    await expect(page.locator('#board-detail')).toContainText(board.core);
    // The pin table and the notes are the lower stage of the box; it starts closed.
    await expect(page.locator('#board-facts')).toBeHidden();
    await page.click('#board-pins-toggle');
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
