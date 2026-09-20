import { test, expect } from '@playwright/test';
import { openBoardBox, openSettings } from './shell.js';

// 無線を使えるボードを選んだときの技適の注意と、取説の「技適について」の節。
// 判定はブラウザの時間帯と言語だけで行うので、ここも context の locale / timezoneId で作る。
// 外部へは何も問い合わせない：日本判定のテストでは 127.0.0.1 以外への要求が 0 件であることも見る。
const KEY = 'digicode-text.giteki-notice.v1';
const dialog = page => page.locator('#giteki-dialog');

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
}
/** ボードを選ぶ。注意は閉じないので、出たかどうかをそのまま見られる。 */
async function choose(page, env) {
  await openBoardBox(page, env);
  await page.click('#board-select');
}

test.describe('日本のブラウザ', () => {
  test.use({ locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });

  test('無線のボードを選ぶと注意が中央に出て、OK で閉じるだけで選択は残る', async ({ page }) => {
    const outside = [];
    page.on('request', r => { const u = r.url(); if (/^https?:/.test(u) && !u.startsWith('http://127.0.0.1:')) outside.push(u); });
    await ready(page);
    await choose(page, 'xiao_esp32c3');
    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('#giteki-title')).toHaveText('XIAO ESP32C3 の無線について');
    await expect(dialog(page)).toContainText('技適マーク');
    await expect(dialog(page)).toContainText('Wi-Fi');
    // 止めない：ボードの選択はこの前に成立している。
    await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
    await page.click('#giteki-ok');
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
    // チェックを付けずに閉じたので、このボードは非表示に入らない（接続手順の保存と同じ形）。
    expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY)).toEqual({});
    expect(outside).toEqual([]);
  });

  test('注意から取説の「技適について」を開ける', async ({ page }) => {
    await ready(page);
    await choose(page, 'pico_w');
    await expect(dialog(page)).toBeVisible();
    await page.click('#giteki-help');
    await expect(page.locator('#help-giteki')).toBeVisible();
    await page.click('#help-close');
    // 取説を閉じると注意が残っていて、OK で閉じられる。
    await expect(dialog(page)).toBeVisible();
    await page.click('#giteki-ok');
    await expect(dialog(page)).toBeHidden();
  });

  test('無線を持たないボードでは出ない', async ({ page }) => {
    await ready(page);
    for (const env of ['pico', 'xiao_rp2040']) {
      await choose(page, env);
      await expect(dialog(page)).toBeHidden();
      await expect(page.locator('#env')).toHaveValue(env);
    }
  });

  test('「このボードでは次回から表示しない」はボード別に効く', async ({ page }) => {
    await ready(page);
    await choose(page, 'xiao_esp32c3');
    await page.check('#giteki-skip');
    await page.click('#giteki-ok');
    expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY)).toEqual({ xiao_esp32c3: true });

    // 別の無線のボードでは出る。
    await choose(page, 'xiao_esp32s3');
    await expect(dialog(page)).toBeVisible();
    await page.click('#giteki-ok');

    // 読み込み直しても、そのボードでは出ない。
    await page.reload();
    await expect(page.locator('#build')).toBeEnabled();
    await choose(page, 'xiao_esp32c3');
    await expect(dialog(page)).toBeHidden();

    // 設定の「技適の注意の非表示をすべて解除」で戻る。
    await openSettings(page);
    await page.click('#giteki-reset');
    expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBe(null);
    await page.click('#ai-settings-close');
    await choose(page, 'pico');
    await choose(page, 'xiao_esp32c3');
    await expect(dialog(page)).toBeVisible();
    await page.click('#giteki-ok');
  });
});

test.describe('日本以外のブラウザ', () => {
  test.use({ locale: 'en-US', timezoneId: 'America/New_York' });

  test('無線のボードを選んでも注意は出ない', async ({ page }) => {
    await ready(page);
    await choose(page, 'xiao_esp32c3');
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('#env')).toHaveValue('xiao_esp32c3');
  });

  test('取説の「技適について」は、日本判定でなくても出所つきで読める', async ({ page }) => {
    await ready(page);
    await page.click('#view-help');
    await page.click('#help-nav button[data-section="giteki"]');
    await expect(page.locator('#help-giteki')).toBeVisible();
    await expect(page.locator('#help-giteki')).toContainText('電波法令で定めている技術基準に適合している無線機');
    await expect(page.locator('#help-giteki')).toContainText('技適未取得機器を用いた実験等の特例制度');
    await expect(page.locator('#help-giteki')).toContainText('180 日以内');
    await expect(page.locator('#help-giteki')).toContainText('法的助言ではありません');
    // 出所は総務省のページで、外部リンクの出し方は取説のほかの出所と同じ。
    const links = page.locator('#help-giteki .sources a');
    expect(await links.evaluateAll(list => list.map(a => a.href))).toEqual([
      'https://www.tele.soumu.go.jp/j/adm/monitoring/summary/qa/giteki_mark/',
      'https://www.tele.soumu.go.jp/j/sys/others/exp-sp/',
      'https://www.tele.soumu.go.jp/horei/law_honbun/71ab7244.html',
      'https://www.denpa.soumu.go.jp/index.html',
      'https://www.denpa.soumu.go.jp/guide/app_t/GUDS0055/index.html',
    ]);
    expect(await links.evaluateAll(list => list.map(a => [a.target, a.rel]))).toEqual(
      Array(5).fill(['_blank', 'noreferrer noopener']));
  });
});
