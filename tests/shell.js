// Shell helpers for the VS Code style layout: the board select lives in the Boards sidebar view
// and the project list plus the file menu live in the Explorer view, so a test has to bring the
// right view forward before driving those controls. Clicking an activity button that is already
// showing collapses the sidebar, which is why each helper checks first.

export async function openExplorer(page) {
  if (!await page.locator('#projects-open').isVisible()) await page.click('#view-explorer');
}

export async function openBoards(page) {
  if (!await page.locator('#env').isVisible()) await page.click('#view-boards');
}

/** Select a build board, the way a user does: Boards view, then the select. */
export async function selectBoard(page, env) {
  await openBoards(page);
  await page.selectOption('#env', env);
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
