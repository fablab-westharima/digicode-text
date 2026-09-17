import { test, expect } from '@playwright/test';
import { installSerialMock, send } from './serial-mock.js';

// プロッタはシリアルモニタの受信テキストをそのまま貰う。ポートはモック(実機には触らない)。
async function ready(page) {
  await installSerialMock(page);
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await page.click('#serial-tab');
  await page.click('#monitor');
  await expect(page.locator('#serial-status')).toHaveText('接続中');
  await page.click('#plotter-tab');
  await expect(page.locator('#plotter-output')).toBeVisible();
}
const legend = page => page.locator('#plot-legend .plot-series');
// Canvas に線が引かれたか。透明でないピクセルが1つでもあれば描かれている。
const painted = page => page.locator('#plot-canvas').evaluate(canvas => {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  let n = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
  return n;
});

test('タブが切り替わり、数値の行だけがグラフになる', async ({ page }, info) => {
  await ready(page);
  await expect(page.locator('#serial-output')).toBeHidden();
  await expect(page.locator('#plot-status')).toContainText('数値の行を待っています');
  expect(await painted(page)).toBe(0);

  await send(page, '1, 2\n3, 4\n');
  await expect(legend(page)).toHaveCount(2);
  await expect(legend(page).nth(0)).toHaveText('CH1 3');
  await expect(legend(page).nth(1)).toHaveText('CH2 4');
  await expect(page.locator('#plot-status')).toContainText('最小 1 / 最大 4');
  await expect(page.locator('#plot-status')).toContainText('2 / 500 サンプル');
  expect(await painted(page)).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('plotter-numbers.png') });

  // 読めない行はモニタには出るが、系列は増えない。
  await send(page, 'Serial ready.\n');
  await expect(legend(page)).toHaveCount(2);
  await page.click('#serial-tab');
  await expect(page.locator('#serial-log')).toContainText('Serial ready.');
  await page.click('#plotter-tab');
  await expect(page.locator('#plotter-output')).toBeVisible();
  await expect(legend(page)).toHaveCount(2);

  // label:value は名前がそのまま系列名になる。
  await send(page, 'temp:25.5 hum:40\n');
  await expect(legend(page)).toHaveCount(4);
  await expect(legend(page).nth(2)).toHaveText('temp 25.5');
  await expect(legend(page).nth(3)).toHaveText('hum 40');
  await expect(page.locator('#plot-status')).toContainText('最小 1 / 最大 40');
  await page.screenshot({ path: info.outputPath('plotter-labels.png') });
});

test('系列は8本まで、直近サンプル数は設定でき、一時停止とクリアが効く', async ({ page }, info) => {
  await ready(page);
  await send(page, '1,2,3,4,5,6,7,8,9,10\n');
  await expect(legend(page)).toHaveCount(8); // 9本目からは無視する
  await expect(legend(page).nth(7)).toHaveText('CH8 8');
  await expect(page.locator('#plot-status')).toContainText('最小 1 / 最大 8');

  // 一時停止のあいだは積まない。再開すれば続きから入る。
  await page.click('#plot-pause');
  await expect(page.locator('#plot-pause')).toHaveText('再開');
  await expect(page.locator('#plot-status')).toContainText('一時停止中');
  await send(page, '90,90,90,90,90,90,90,90\n');
  await expect(legend(page).nth(0)).toHaveText('CH1 1');
  await expect(page.locator('#plot-status')).toContainText('最大 8');
  await page.screenshot({ path: info.outputPath('plotter-paused.png') });
  await page.click('#plot-pause');
  await expect(page.locator('#plot-pause')).toHaveText('一時停止');
  await send(page, '90,90,90,90,90,90,90,90\n');
  await expect(legend(page).nth(0)).toHaveText('CH1 90');
  await expect(page.locator('#plot-status')).toContainText('最大 90');

  // 直近サンプル数は 100〜5000。範囲外は丸める。
  await page.fill('#plot-samples', '100');
  await expect(page.locator('#plot-status')).toContainText('/ 100 サンプル');
  await page.fill('#plot-samples', '99999');
  await expect(page.locator('#plot-status')).toContainText('/ 5000 サンプル');
  await page.fill('#plot-samples', '1');
  await expect(page.locator('#plot-status')).toContainText('/ 100 サンプル');

  await page.click('#plot-clear');
  await expect(legend(page)).toHaveCount(0);
  await expect(page.locator('#plot-status')).toContainText('数値の行を待っています');
  expect(await painted(page)).toBe(0);
  // クリアのあとも受信は続く。
  await send(page, '5\n');
  await expect(legend(page)).toHaveCount(1);
  await expect(legend(page).nth(0)).toHaveText('CH1 5');
});

test('古いサンプルは捨てられ、平らな信号でも線が出る', async ({ page }) => {
  await ready(page);
  await page.fill('#plot-samples', '100');
  await send(page, Array.from({ length: 150 }, (_, i) => `${i}\n`).join(''));
  await expect(legend(page).nth(0)).toHaveText('CH1 149');
  // 直近100本だけなので、最小は 50 まで上がっている。
  await expect(page.locator('#plot-status')).toContainText('最小 50 / 最大 149');
  await expect(page.locator('#plot-status')).toContainText('100 / 100 サンプル');
  expect(await painted(page)).toBeGreaterThan(0);

  await page.click('#plot-clear');
  await send(page, '7\n7\n7\n');
  await expect(page.locator('#plot-status')).toContainText('最小 6 / 最大 8'); // 定数でも上下に余白を取る
  expect(await painted(page)).toBeGreaterThan(0);
});

test('行の途中で切れたチャンクはつながる', async ({ page }) => {
  await ready(page);
  await send(page, '12,3');
  await expect(legend(page)).toHaveCount(0);
  await send(page, '4\n');
  await expect(legend(page)).toHaveCount(2);
  await expect(legend(page).nth(1)).toHaveText('CH2 34');
});
