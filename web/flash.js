// Browser flashing for ESP-family boards via esptool-js + Web Serial.
// Skeleton follows the donor usbFirmwareService (115200 fixed, no eraseAll, hard_reset after),
// but every address and image comes from the build's own flash set — nothing is hard-coded.
import { ESPLoader, Transport } from 'esptool-js';
import { disconnectSerial } from './serial.js';

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
export async function flashEsp(flashSet, onProgress) {
  if (!('serial' in navigator)) throw new Error('このブラウザはWeb Serialに対応していません。ChromeまたはEdgeを使用してください');
  const report = (stage, percent, message) => onProgress({ stage, percent, message });
  report('connecting', 0, 'ポートを選択してください…');
  const port = await navigator.serial.requestPort({ filters: ESP_VENDOR_IDS.map(usbVendorId => ({ usbVendorId })) });
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
    report('complete', 100, `書き込み完了（${chipName}、${flashSet.images.length} イメージ、${total} bytes）`);
  } catch (error) {
    const detail = lines.filter(Boolean).slice(-5).join('\n');
    throw new Error(`書き込みに失敗しました: ${error?.message ?? error}${detail ? '\n' + detail : ''}`);
  } finally {
    try { await transport.disconnect(); } catch {}
  }
}
