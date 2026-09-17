// Browser flashing for ESP-family boards via esptool-js + Web Serial.
// Skeleton follows the donor usbFirmwareService (115200 fixed, no eraseAll, hard_reset after),
// but every address and image comes from the build's own flash set — nothing is hard-coded.
import { ESPLoader, Transport } from 'esptool-js';
import { disconnectSerial } from './serial.js';
import { hardResetPulse } from './esp-reset.js';

// Same vendor filter as the donor: CP210x, CH340, FTDI, Espressif USB JTAG/serial.
export const ESP_VENDOR_IDS = [0x10c4, 0x1a86, 0x0403, 0x303a];

export function parseFlashSet(json) {
  if (!json || json.format !== 'digicode-text-flash-set' || !Array.isArray(json.images) || !json.images.length) throw new Error('書き込みデータの形式が不正です');
  const images = json.images.map(image => {
    const address = Number(image.address);
    if (!Number.isInteger(address) || address < 0 || typeof image.data !== 'string') throw new Error('書き込みデータの形式が不正です');
    const data = Uint8Array.from(atob(image.data), c => c.charCodeAt(0));
    if (data.length !== image.size) throw new Error(`書き込みデータのサイズが一致しません: ${image.file}`);
    return { file: image.file, address, data };
  });
  return { chip: json.chip, board: json.board, flashMode: json.flashMode, flashFrequency: json.flashFrequency, flashSize: json.flashSize, images };
}

// Must be called from a user gesture (requestPort). Reports through onProgress({ stage, percent, message }).
export async function flashEsp(flashSet, onProgress, heldPort) {
  if (!('serial' in navigator)) throw new Error('このブラウザはWeb Serialに対応していません。ChromeまたはEdgeを使用してください');
  const report = (stage, percent, message) => onProgress({ stage, percent, message });
  // A port the monitor already holds is reused, so the chooser only appears when there is none.
  if (!heldPort) report('connecting', 0, 'ポートを選択してください…');
  const port = heldPort ?? await navigator.serial.requestPort({ filters: ESP_VENDOR_IDS.map(usbVendorId => ({ usbVendorId })) });
  await disconnectSerial(); // the monitor may hold the same port
  const transport = new Transport(port, false);
  const lines = [];
  const terminal = { clean() {}, writeLine: (t) => lines.push(t), write: (t) => lines.push(t) };
  try {
    report('connecting', 10, 'チップと接続中…（115200 bps）');
    const loader = new ESPLoader({ transport, baudrate: 115200, terminal });
    const chipName = await loader.main();
    report('connecting', 20, `接続: ${chipName}`);
    const fileArray = flashSet.images.map(({ data, address }) => ({ data, address }));
    const total = flashSet.images.reduce((n, i) => n + i.data.length, 0);
    const before = flashSet.images.map((_, i) => flashSet.images.slice(0, i).reduce((n, x) => n + x.data.length, 0));
    await loader.writeFlash({
      fileArray, flashSize: 'keep', flashMode: 'keep', flashFreq: 'keep', eraseAll: false, compress: true,
      reportProgress(fileIndex, written, size) {
        const image = flashSet.images[fileIndex];
        const percent = 20 + Math.floor(((before[fileIndex] + Math.min(written, size)) / total) * 70);
        report('flashing', percent, `${image.file} を 0x${image.address.toString(16)} へ書き込み中… ${Math.floor((written / size) * 100)}%`);
      },
    });
    report('resetting', 95, 'ボードをリセット中…');
    await loader.after('hard_reset');
    await hardResetPulse(transport); // esptool-js's hard reset leaves RTS untouched; this is the pulse that restarts the board
    report('complete', 100, `書き込み完了（${chipName}、${flashSet.images.length} イメージ、${total} bytes）`);
  } catch (error) {
    const detail = lines.filter(Boolean).slice(-5).join('\n');
    throw new Error(`書き込みに失敗しました: ${error?.message ?? error}${detail ? '\n' + detail : ''}`);
  } finally {
    try { await transport.disconnect(); } catch {}
  }
}

// RP2040 boards expose the BOOTSEL drive as mass storage, so there is nothing to talk to:
// the browser just writes the UF2 into the folder the user picks. showDirectoryPicker needs
// the click's user gesture, so it is called before any await — callers must not await first.
export const UF2_NAME = 'firmware.uf2';
export const UF2_MARKER = 'INFO_UF2.TXT';

export function flashUf2(bytes, onProgress) {
  const report = (stage, percent, message) => onProgress({ stage, percent, message });
  if (typeof window.showDirectoryPicker !== 'function') {
    report('error', null, 'このブラウザはドライブへの書き込みに対応していません。ChromeまたはEdgeを使うか、「UF2 ダウンロード」でUF2を保存してRPI-RP2ドライブへコピーしてください');
    return Promise.resolve(false);
  }
  return writeUf2(window.showDirectoryPicker({ mode: 'readwrite' }), bytes, report);
}

async function writeUf2(picked, bytes, report) {
  let dir;
  try { dir = await picked; }
  catch (error) {
    if (error?.name === 'AbortError') { report('', null, 'ドライブが選ばれなかったため書き込みを中止しました'); return false; }
    throw new Error(`ドライブを選べませんでした: ${error?.message ?? error}`);
  }
  report('connecting', 0, `${dir.name} を確認中…（Macでは RPI-RP2 が「NO NAME」と表示される場合があります）`);
  try { await dir.getFileHandle(UF2_MARKER); }
  catch (error) {
    if (error?.name === 'NotFoundError') throw new Error(`「${dir.name}」はRPI-RP2ドライブではありません。BOOTSELを押したままUSBを接続し直し、現れたRPI-RP2ドライブを選んでください`);
    throw new Error(`ドライブを確認できませんでした: ${error?.message ?? error}`);
  }
  report('flashing', 10, `${UF2_NAME} を書き込み中…（${bytes.length} bytes）`);
  let written = 0;
  let writable;
  try {
    const handle = await dir.getFileHandle(UF2_NAME, { create: true });
    writable = await handle.createWritable();
  } catch (error) { throw new Error(`書き込みを開始できませんでした: ${error?.message ?? error}`); }
  try { await writable.write(bytes); written = bytes.length; }
  catch (error) {
    try { await writable.close(); } catch {}
    throw new Error(`書き込みに失敗しました: ${error?.message ?? error}`);
  }
  // The board reboots the moment it has the whole UF2, so the drive can vanish before close()
  // returns. Every byte was already written, so that failure is the expected end, not an error.
  try { await writable.close(); }
  catch (error) { if (written < bytes.length) throw new Error(`書き込みに失敗しました: ${error?.message ?? error}`); }
  report('complete', 100, `書き込み完了（${bytes.length} bytes）。ボードは再起動しました。Macで「ディスクの不正な取り出し」の通知が出ますが正常です。Serialタブで接続できます`);
  return true;
}
