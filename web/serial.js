const $ = (id) => document.getElementById(id);
const log = (s) => { $('serial-log').textContent += s + '\n'; $('serial-log').scrollTop = $('serial-log').scrollHeight; };

// USB-serial vendor IDs accepted by the monitor: Raspberry Pi (RP2040) plus the ESP-family
// bridges (CP210x, CH340, FTDI, Espressif USB JTAG/serial). Web Serial only lists matching ports.
export const SERIAL_VENDOR_IDS = [0x2e8a, 0x10c4, 0x1a86, 0x0403, 0x303a];
export const serialFilters = () => SERIAL_VENDOR_IDS.map(usbVendorId => ({ usbVendorId }));

// Web Serial monitor. Only the Human connects a device; nothing here runs on its own.
let port, reader, keepReading = false;
export function serialConnected() { return Boolean(port); }
export async function disconnectSerial() {
  keepReading = false;
  try { await reader?.cancel(); } catch {}
  try { await port?.close(); } catch {}
  port = undefined; reader = undefined;
  $('serial-status').textContent = '未接続';
  $('monitor').hidden = false; $('stop').hidden = true;
}
$('monitor').onclick = async () => {
  if (!('serial' in navigator)) { log('Web Serial is not available in this browser'); return; }
  try {
    port = await navigator.serial.requestPort({ filters: serialFilters() });
    await port.open({ baudRate: 115200 });
    $('serial-status').textContent = '接続中';
    $('serial-empty').hidden = true;
    $('monitor').hidden = true; $('stop').hidden = false; keepReading = true;
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) $('serial-log').textContent += value, $('serial-log').scrollTop = $('serial-log').scrollHeight;
    }
  } catch (e) { log('serial: ' + e); $('serial-status').textContent = '接続エラー'; }
};
$('stop').onclick = disconnectSerial;
