import { test, expect } from '@playwright/test';
import { installSerialMock, serial, send } from './serial-mock.js';
import { flash, selectBoard } from './shell.js';

// 実ポートには触らない。navigator.serial は tests/serial-mock.js がページ読み込み前に差し替える。
const mockSet = JSON.stringify({ format: 'digicode-text-flash-set', version: 2, board: 'seeed_xiao_esp32c3', chip: 'esp32c3', flashMode: 'dio', flashFrequency: '80m', flashSize: '4MB',
  images: [{ file: 'bootloader.bin', address: '0x0', size: 4, sha256: '', data: Buffer.from('mock').toString('base64') }] });

async function ready(page) {
  await installSerialMock(page);
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await page.click('#serial-tab');
}
async function connect(page) {
  await page.click('#monitor');
  await expect(page.locator('#serial-status')).toHaveText('接続中');
}

test('接続・切断・再接続。切断は cancel → releaseLock → close の順で、閉じたポートを開き直せる', async ({ page }) => {
  await ready(page);
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await expect(page.locator('#stop')).toBeHidden();
  await connect(page);
  await expect(page.locator('#monitor')).toBeHidden();
  await expect(page.locator('#stop')).toBeVisible();
  await expect(page.locator('#status-serial')).toHaveText('Serial: 接続中');
  expect((await serial(page)).opened).toBe(true);
  expect(await page.evaluate(() => window.__serial.options)).toEqual({ baudRate: 115200 });
  // ベンダIDのフィルタはそのまま渡っている（列挙されるポートを絞る唯一の仕組み）。
  expect((await page.evaluate(() => window.__serial.filters)).length).toBeGreaterThan(0);
  await send(page, 'hello\n');
  await expect(page.locator('#serial-log')).toContainText('hello');

  await page.click('#stop');
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await expect(page.locator('#monitor')).toBeVisible();
  const closed = await serial(page);
  expect(closed.calls).toEqual(['p1.open', 'p1.cancel', 'p1.releaseLock', 'p1.close']);
  expect(closed.opened).toBe(false);
  expect(closed.locked).toBe(false); // ロックを返さないと close は InvalidStateError で失敗する
  await expect(page.locator('#serial-log')).not.toContainText('InvalidStateError');

  // 同じポートを選び直しても、閉じてあるので開き直せる。これが再現していた不具合そのもの。
  await connect(page);
  const again = await serial(page);
  expect(again.requests).toBe(2);
  expect(again.calls.filter(c => c === 'p1.open')).toHaveLength(2);
  await expect(page.locator('#serial-log')).not.toContainText('already open');
  await send(page, 'second session\n');
  await expect(page.locator('#serial-log')).toContainText('second session');
});

test('open 中に open を呼ばない。接続の途中はボタンを押せない', async ({ page }) => {
  await ready(page);
  await connect(page);
  // 接続中に接続ボタンの handler をもう一度叩いても、ポートは開き直されない。
  await page.evaluate(() => document.getElementById('monitor').click());
  await page.evaluate(() => document.getElementById('monitor').click());
  expect((await serial(page)).requests).toBe(1);
  expect((await serial(page)).calls).toEqual(['p1.open']);
  await page.click('#stop');
  await expect(page.locator('#serial-status')).toHaveText('未接続');

  // ポート選択が返ってこない間は opening。接続・切断・解除のどれも押せない。
  await page.evaluate(() => { window.__serial.hold = true; });
  await page.click('#monitor');
  await expect(page.locator('#serial-status')).toHaveText('接続しています…');
  await expect(page.locator('#monitor')).toBeHidden();
  await expect(page.locator('#stop')).toBeDisabled();
  await expect(page.locator('#serial-forget')).toBeDisabled();
  await page.evaluate(() => { window.__serial.hold = false; window.__serial.release(); });
  await expect(page.locator('#serial-status')).toHaveText('接続中');
  expect((await serial(page)).requests).toBe(2);
});

test('ポート選択の取り消しと open の失敗は1行出して未接続に戻り、次の接続を妨げない', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => { window.__serial.cancelRequest = true; });
  await page.click('#monitor');
  await expect(page.locator('#serial-status')).toHaveText('接続エラー');
  await expect(page.locator('#serial-log')).toContainText('No port selected by the user.');
  await expect(page.locator('#monitor')).toBeVisible();
  await expect(page.locator('#monitor')).toBeEnabled();

  await page.evaluate(() => { window.__serial.cancelRequest = false; window.__serial.failOpen = 'device busy'; });
  await page.click('#monitor');
  await expect(page.locator('#serial-log')).toContainText('device busy');
  await expect(page.locator('#serial-status')).toHaveText('接続エラー');
  expect((await serial(page)).opened).toBe(false);
  await connect(page); // 失敗のあとも普通に接続できる
});

test('開いた直後に readable が取れなくても opening のまま固まらない', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => { window.__serial.failReader = true; });
  await page.click('#monitor');
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await expect(page.locator('#serial-log')).toContainText('the readable is gone');
  await expect(page.locator('#monitor')).toBeEnabled();
  const after = await serial(page);
  expect(after.opened).toBe(false); // 開きっぱなしにはしない
  expect(after.calls).toEqual(['p1.open', 'p1.close']);
  await connect(page); // そのまま接続し直せる
});

test('close が失敗しても参照を捨てて未接続に戻り、エラーは1行だけ出る', async ({ page }) => {
  await ready(page);
  await connect(page);
  await page.evaluate(() => { window.__serial.failClose = true; });
  await page.click('#stop');
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await expect(page.locator('#monitor')).toBeVisible();
  await expect(page.locator('#serial-log')).toContainText('serial: 切断時のエラー');
  const lines = (await page.locator('#serial-log').textContent()).split('\n').filter(l => l.startsWith('serial:'));
  expect(lines).toHaveLength(1);
  expect((await serial(page)).calls).toEqual(['p1.open', 'p1.cancel', 'p1.releaseLock', 'p1.close']);
});

test('「USBポートを解除」は切断してから forget を呼び、選び直しを促す', async ({ page }) => {
  await ready(page);
  await connect(page);
  await page.click('#serial-forget');
  await expect(page.locator('#serial-log')).toContainText('次回接続時にポートを選び直してください');
  const after = await serial(page);
  expect(after.calls).toEqual(['p1.open', 'p1.cancel', 'p1.releaseLock', 'p1.close', 'p1.forget']);
  expect(after.forgotten).toBe(true);
  expect(after.opened).toBe(false);
  await expect(page.locator('#serial-status')).toHaveText('未接続');
});

test('未接続でも解除でき、許可が無ければそう言う', async ({ page }) => {
  await ready(page);
  await page.click('#serial-forget'); // 一度も接続していない：getPorts が返したポートを手放す
  await expect(page.locator('#serial-log')).toContainText('次回接続時にポートを選び直してください');
  expect((await serial(page)).calls).toEqual(['p1.forget']);
  await page.click('#serial-forget'); // もう許可は残っていない
  await expect(page.locator('#serial-log')).toContainText('解除できるポートがありません');
});

test('解除の confirm をやめれば何も起きない', async ({ page }) => {
  await installSerialMock(page);
  page.removeAllListeners('dialog');
  page.on('dialog', dialog => dialog.dismiss());
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await page.click('#serial-tab');
  await connect(page);
  await page.click('#serial-forget');
  await expect(page.locator('#serial-status')).toHaveText('接続中');
  expect((await serial(page)).calls).toEqual(['p1.open']);
});

test('RP2040 の書き込みはシリアルに触らない', async ({ page }) => {
  await ready(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showDirectoryPicker', { configurable: true, value: () => Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' })) });
  });
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  await page.route('**/compile', route => route.fulfill({ status: 200, contentType: 'application/octet-stream', body: Buffer.alloc(512) }));
  await selectBoard(page, 'xiao_rp2040');
  await page.click('#serial-tab');
  await connect(page);
  await page.click('#build');
  await expect(page.locator('#flash')).toBeEnabled();
  await flash(page);
  await expect(page.locator('#flash-status')).toContainText('中止');
  await expect(page.locator('#log')).not.toContainText('シリアルを切断して書き込みます');
  await expect(page.locator('#serial-log')).not.toContainText('書き込みのため切断しました');
  await expect(page.locator('#serial-status')).toHaveText('接続中');
  expect((await serial(page)).calls).toEqual(['p1.open']);
});

// 書き込み本体（esptool-js）の代役。渡されたポート（無ければ選択）を開いて閉じる。
const fakeFlash = (page) => page.evaluate(() => {
  window.__flashEsp = async (set, report, held) => {
    window.__serial.flashGot = held ? 'held' : 'chooser';
    const port = held ?? await navigator.serial.requestPort();
    window.__serial.openedAtFlash = port.opened;
    await port.open({ baudRate: 115200 }); await port.close();
    report({ stage: 'complete', percent: 100, message: '書き込み完了' });
  };
});
async function buildEsp(page) {
  await page.route('**/compile', route => route.fulfill({ status: 200, contentType: 'application/json', body: mockSet }));
  await selectBoard(page, 'xiao_esp32c3');
  await page.click('#build');
  await expect(page.locator('#flash')).toBeEnabled();
}
const flashInfo = page => page.evaluate(() => ({ got: window.__serial.flashGot, openedAtFlash: window.__serial.openedAtFlash }));

test('接続したまま書き込む: 切断を待ってから保持ポートへ選択なしで書き、書き込み後は未接続のまま', async ({ page }) => {
  await ready(page); await buildEsp(page); await page.click('#serial-tab'); await connect(page);
  await fakeFlash(page);
  const before = (await serial(page)).requests;
  await flash(page);
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');
  await expect(page.locator('#log')).toContainText('シリアルを切断して書き込みます');
  await expect(page.locator('#serial-log')).toContainText('書き込みのため切断しました。出力を見るには「接続」を押してください');
  expect(await flashInfo(page)).toEqual({ got: 'held', openedAtFlash: false }); // 切断が終わってから書き込みに入った
  await page.waitForTimeout(500);
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  const after = await serial(page);
  expect(after.requests).toBe(before); // 選択ダイアログは出ない
  expect(after.opened).toBe(false);    // 他のプログラムが開けるよう、ポートは閉じたまま
  expect(after.calls).toEqual(['p1.open', 'p1.cancel', 'p1.releaseLock', 'p1.close', 'p1.open', 'p1.close']);
  await page.click('#serial-tab'); await connect(page); // 手動の接続は通る
  await send(page, 'hello3\n');
  await expect(page.locator('#serial-log')).toContainText('hello3');
});

test('未接続で書き込むとシリアルには何もしない。ポートを持っていなければ選択は書き込みの1回だけ', async ({ page }) => {
  await ready(page); await buildEsp(page);
  await fakeFlash(page);
  await flash(page);
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');
  await page.waitForTimeout(500);
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await expect(page.locator('#serial-log')).toHaveText('');
  await expect(page.locator('#log')).not.toContainText('シリアルを切断');
  expect((await flashInfo(page)).got).toBe('chooser');
  const after = await serial(page);
  expect(after.requests).toBe(1);
  expect(after.calls).toEqual(['p1.open', 'p1.close']);
});

test('一度つないで切断したあとの書き込みは、保持しているポートを選択なしで使う。別系統のポートは使わない', async ({ page }) => {
  await ready(page); await buildEsp(page); await page.click('#serial-tab'); await connect(page);
  await page.click('#stop');
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await fakeFlash(page);
  const before = (await serial(page)).requests;
  await flash(page);
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');
  expect((await flashInfo(page)).got).toBe('held');
  expect((await serial(page)).requests).toBe(before);
  // 保持ポートが RP2040 のもの（ESP の書き込み先になりえない）なら選択を出す
  await page.evaluate(() => { window.__serial.vendorId = 0x2e8a; });
  await flash(page);
  await expect.poll(async () => (await flashInfo(page)).got).toBe('chooser');
});

test('ボーレートは選んだ値で open され、保存され、接続中は変えられない', async ({ page }) => {
  await ready(page);
  const baud = page.locator('#serial-baud');
  await expect(baud).toHaveValue('115200');
  expect(await baud.locator('option').evaluateAll(o => o.map(x => Number(x.value)))).toEqual([9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]);
  await baud.selectOption('9600');
  expect(await page.evaluate(() => localStorage.getItem('digicode-text.serial.v1'))).toBe('{"baudRate":9600}');
  await connect(page);
  expect(await page.evaluate(() => window.__serial.options)).toEqual({ baudRate: 9600 });
  await expect(baud).toBeDisabled();
  await page.click('#stop');
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await expect(baud).toBeEnabled();
  await page.reload();
  await expect(page.locator('#serial-baud')).toHaveValue('9600');
});

test('open のあと DTR=true・RTS=false を立てる。立てられなくても接続は続く', async ({ page }) => {
  await ready(page);
  await connect(page);
  expect((await serial(page)).signals).toEqual([{ dataTerminalReady: true, requestToSend: false }]);
  await page.click('#stop');
  await expect(page.locator('#serial-status')).toHaveText('未接続');
  await page.evaluate(() => { window.__serial.failSignals = true; });
  await connect(page);
  await expect(page.locator('#serial-log')).toContainText('DTRを設定できませんでした');
  await send(page, 'still here\n');
  await expect(page.locator('#serial-log')).toContainText('still here');
});
