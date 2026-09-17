import { test, expect } from '@playwright/test';
import { openExplorer } from './shell.js';

test('File dropdown order, keyboard, dismissal, focus and viewport placement', async ({page}, info) => {
  await page.goto('/'); await expect(page.locator('#build')).toBeEnabled();
  const trigger=page.locator('#projects-open'), menu=page.locator('#file-menu');
  await expect(trigger).toContainText('ファイル');
  await trigger.focus(); await page.keyboard.press('ArrowDown');
  await expect(page.locator('#project-new')).toBeFocused();
  expect(await menu.locator('[role=menuitem]').allTextContents()).toEqual([
    '新規プロジェクト…','プロジェクトを開く…','名前を変更…','複製…','ファイルから読み込む…','ファイルへ書き出す','プロジェクトを削除…'
  ]);
  await expect(menu.locator('hr')).toHaveCount(3);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.keyboard.press('ArrowUp'); await expect(page.locator('#project-delete')).toBeFocused();
  await page.keyboard.press('Home'); await expect(page.locator('#project-new')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  // 「プロジェクトを開く…」 now brings the Explorer's own list forward instead of a dialog.
  await expect(menu).toBeHidden(); await expect(page.locator('#project-list .project-item').first()).toBeFocused();
  await trigger.focus();
  await page.keyboard.press('Enter'); await page.keyboard.press('End'); await expect(page.locator('#project-delete')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await expect(menu).toBeHidden();
  await trigger.click(); await page.locator('#build').focus(); await expect(menu).toBeHidden();
  await trigger.click(); await page.locator('#explorer-title').click(); await expect(menu).toBeHidden(); await expect(trigger).toBeFocused();
  for (const [width,height] of [[1440,850],[390,700],[320,350]]) {
    await page.setViewportSize({width,height});
    // 幅を変えた直後はシェルの resize ハンドラがまだ走っていないことがある。走る前に Explorer を
    // 見に行くと「今は見えている」で素通りし、直後に狭いレイアウトがサイドバーを畳んで
    // #projects-open が消え、click が待ち続ける。ui.spec.js の fits() と同じ待ち方で揃える。
    await expect(page.locator('#shell')).toHaveAttribute('data-narrow', String(width<900));
    await openExplorer(page); await trigger.click();
    const a=await trigger.boundingBox(), b=await menu.boundingBox();
    expect(b.y).toBeGreaterThanOrEqual(a.y+a.height);
    expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x+b.width).toBeLessThanOrEqual(width);
    expect(b.y+b.height).toBeLessThanOrEqual(height);
    await page.keyboard.press('End'); await expect(page.locator('#project-delete')).toBeInViewport();
    await page.screenshot({path:info.outputPath(`file-menu-${width}.png`)});
    await page.keyboard.press('Escape');
  }
});
