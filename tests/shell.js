// Shell helpers for the VS Code style layout: the board list lives in the Boards sidebar view
// and the project list plus the file menu live in the Explorer view, so a test has to bring the
// right view forward before driving those controls. Clicking an activity button that is already
// showing collapses the sidebar, which is why each helper checks first.

export async function openExplorer(page) {
  if (!await page.locator('#projects-open').isVisible()) await page.click('#view-explorer');
}

export async function openBoards(page) {
  if (!await page.locator('#boards-view').isVisible()) await page.click('#view-boards');
}

/** Open one board's box in the Boards view (a second click on an open row would close it). */
export async function openBoardBox(page, env) {
  await openBoards(page);
  const row = page.locator(`#board-list li[data-board-id="${env}"] .board-item`);
  if (await row.getAttribute('aria-expanded') !== 'true') await row.click();
}

/** Select a build board, the way a user does: Boards view, the board's row, then the button in its box. */
export async function selectBoard(page, env) {
  await openBoardBox(page, env);
  // The box of the board that is already the build target has no button to press.
  if (await page.locator('#board-select').count()) await page.click('#board-select');
  // 無線のボードを日本語環境で選ぶと技適の注意が重なる。利用者と同じく OK で閉じる
  // （チェックは付けないので、次の選択でもまた出る）。
  if (await page.locator('#giteki-dialog').isVisible()) await page.click('#giteki-ok');
}

/** Open the file menu in the Explorer view and choose one of its items (`project-new`, …). */
export async function fileMenu(page, id) {
  await openExplorer(page);
  if (!await page.locator('#file-menu').isVisible()) await page.click('#projects-open');
  await page.click('#' + id);
}

/** Show the Settings view (theme, layout reset and the AI API settings). */
export async function openSettings(page) {
  if (!await page.locator('#ai-settings').isVisible()) await page.click('#view-settings');
}

/** Press 書き込み the way a user does: the connection guide comes first, and OK goes on to flash. */
export async function flash(page) {
  await page.click('#flash');
  if (await page.locator('#flash-guide-dialog').isVisible()) await page.click('#flash-guide-ok');
}

/** Show the AI panel. Its open state is part of the saved layout, so #ai-open is a toggle. */
export async function openAI(page) {
  if (!await page.locator('#ai-pane').isVisible()) await page.click('#ai-open');
}
