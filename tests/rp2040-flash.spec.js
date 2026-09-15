import { test, expect } from '@playwright/test';

// RP2040 boards are flashed by writing the build's UF2 into the BOOTSEL drive the user picks.
// Every test replaces window.showDirectoryPicker with a mock directory handle before the page
// loads and blocks the serial port dialog, so no real drive, port or USB device is touched.
const UF2 = Buffer.alloc(1024);
for (let i = 0; i < UF2.length; i++) UF2[i] = (i * 7) % 256;
// Same shape as the server's ESP flash set; used only by the last test, to show the ESP path is untouched.
const mockSet = JSON.stringify({ format: 'digicode-text-flash-set', version: 2, board: 'seeed_xiao_esp32c3', chip: 'esp32c3', flashMode: 'dio', flashFrequency: '80m', flashSize: '4MB',
  images: [{ file: 'bootloader.bin', address: '0x0', size: 4, sha256: '', data: Buffer.from('mock').toString('base64') }] });

// window.__mock records what the page asked the drive to do and lets a test change the
// drive's behaviour (missing marker, cancel, failing write/close, unsupported browser).
async function ready(page, env) {
  await page.addInitScript(() => {
    const mock = { supported: true, marker: true, abort: false, failWrite: false, failClose: false,
      picked: 0, options: null, requested: [], written: [], closed: 0, serialRequests: 0 };
    window.__mock = mock;
    const fail = (name, message) => Object.assign(new Error(message), { name });
    const writable = {
      async write(data) {
        if (mock.failWrite) throw fail('InvalidStateError', 'drive removed mid write');
        mock.written.push([...new Uint8Array(data)]);
      },
      async close() {
        if (mock.failClose) throw fail('NotFoundError', 'drive disappeared after the reboot');
        mock.closed++;
      },
    };
    const directory = {
      name: 'RPI-RP2',
      async getFileHandle(name, options) {
        mock.requested.push([name, Boolean(options?.create)]);
        if (name === 'INFO_UF2.TXT' && !mock.marker) throw fail('NotFoundError', 'no such file');
        return { name, async createWritable() { return writable; } };
      },
    };
    function picker(options) {
      mock.picked++;
      mock.options = options;
      if (mock.abort) return Promise.reject(fail('AbortError', 'the user aborted a request'));
      return Promise.resolve(directory);
    }
    Object.defineProperty(window, 'showDirectoryPicker', { configurable: true, get: () => mock.supported ? picker : undefined });
    // No port dialog may open in a test; the ESP path must fail here instead.
    if (!('serial' in navigator)) Object.defineProperty(navigator, 'serial', { configurable: true, value: {} });
    navigator.serial.getPorts = async () => [];
    navigator.serial.requestPort = () => { mock.serialRequests++; throw new Error('port dialog blocked by the test'); };
  });
  await page.route('**/compile', route => route.request().postDataJSON().env === 'xiao_esp32c3'
    ? route.fulfill({ status: 200, contentType: 'application/json', body: mockSet })
    : route.fulfill({ status: 200, contentType: 'application/octet-stream', body: UF2 }));
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await page.selectOption('#env', env);
}
const mock = page => page.evaluate(() => window.__mock);
async function built(page) {
  await page.click('#build');
  await expect(page.locator('#flash')).toBeEnabled();
}

test('a folder without INFO_UF2.TXT is refused and nothing is written', async ({ page }) => {
  await ready(page, 'xiao_rp2040');
  await page.evaluate(() => { window.__mock.marker = false; });
  await built(page);
  await page.click('#flash');
  await expect(page.locator('#flash-status')).toContainText('RPI-RP2ドライブではありません');
  await expect(page.locator('#flash-status')).toHaveAttribute('data-state', 'error');
  const m = await mock(page);
  expect(m.picked).toBe(1);
  expect(m.options).toEqual({ mode: 'readwrite' });
  expect(m.requested).toEqual([['INFO_UF2.TXT', false]]); // firmware.uf2 was never opened
  expect(m.written).toEqual([]);
  await expect(page.locator('#flash')).toBeEnabled(); // the build is still there; the user can retry
  // Cancelling the picker ends quietly, without an error state.
  await page.evaluate(() => { window.__mock.abort = true; });
  await page.click('#flash');
  await expect(page.locator('#flash-status')).toContainText('中止');
  await expect(page.locator('#flash-status')).toHaveAttribute('data-state', '');
  expect((await mock(page)).written).toEqual([]);
});

test('the build artifact is written to firmware.uf2 byte for byte', async ({ page }) => {
  await ready(page, 'pico');
  await built(page);
  await page.click('#flash');
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');
  await expect(page.locator('#flash-status')).toContainText('Serialタブで接続できます');
  await expect(page.locator('#flash-status')).toHaveAttribute('data-state', 'complete');
  const m = await mock(page);
  expect(m.requested).toEqual([['INFO_UF2.TXT', false], ['firmware.uf2', true]]);
  expect(m.written).toHaveLength(1);
  expect(Buffer.from(m.written[0]).equals(UF2)).toBe(true);
  expect(m.closed).toBe(1);
});

test('close() failing after the whole image was written counts as success', async ({ page }) => {
  await ready(page, 'xiao_rp2040');
  await page.evaluate(() => { window.__mock.failClose = true; });
  await built(page);
  await page.click('#flash');
  await expect(page.locator('#flash-status')).toContainText('書き込み完了');
  await expect(page.locator('#flash-status')).toHaveAttribute('data-state', 'complete');
  const m = await mock(page);
  expect(Buffer.from(m.written[0]).equals(UF2)).toBe(true);
  expect(m.closed).toBe(0);
});

test('a write that fails part way through is reported as a failure', async ({ page }) => {
  await ready(page, 'xiao_rp2040');
  await page.evaluate(() => { window.__mock.failWrite = true; });
  await built(page);
  await page.click('#flash');
  await expect(page.locator('#flash-status')).toContainText('書き込みに失敗しました');
  await expect(page.locator('#flash-status')).toContainText('drive removed mid write');
  await expect(page.locator('#flash-status')).toHaveAttribute('data-state', 'error');
  expect((await mock(page)).written).toEqual([]);
});

test('a browser without showDirectoryPicker gets the download instead', async ({ page }) => {
  await ready(page, 'xiao_rp2040');
  await page.evaluate(() => { window.__mock.supported = false; });
  await built(page);
  await page.click('#flash');
  await expect(page.locator('#flash-status')).toContainText('ChromeまたはEdge');
  await expect(page.locator('#flash-status')).toContainText('UF2 ダウンロード');
  expect((await mock(page)).picked).toBe(0);
  await expect(page.locator('#download')).toBeVisible();
  await expect(page.locator('#download')).toHaveAttribute('download', 'firmware-xiao_rp2040.uf2');
  const downloading = page.waitForEvent('download');
  await page.click('#download');
  expect((await downloading).suggestedFilename()).toBe('firmware-xiao_rp2040.uf2');
});

test('an ESP board still takes the port path, never the directory picker', async ({ page }) => {
  await ready(page, 'xiao_esp32c3');
  await built(page);
  await expect(page.locator('#download')).toBeHidden();
  await page.click('#flash');
  await expect(page.locator('#flash-status')).toContainText('port dialog blocked by the test');
  const m = await mock(page);
  expect(m.serialRequests).toBe(1);
  expect(m.picked).toBe(0);
  expect(m.requested).toEqual([]);
});
