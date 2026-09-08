const $ = (id) => document.getElementById(id);
const log = (s) => { $('serial-log').textContent += s + '\n'; $('serial-log').scrollTop = $('serial-log').scrollHeight; };

// Web Serial monitor. Not exercised in this slice (no device may be touched yet).
let port, reader, keepReading = false;
$('monitor').onclick = async () => {
  if (!('serial' in navigator)) { log('Web Serial is not available in this browser'); return; }
  try {
    port = await navigator.serial.requestPort({ filters: [{ usbVendorId: 0x2e8a }] }); // Raspberry Pi VID
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
$('stop').onclick = async () => {
  keepReading = false;
  try { await reader?.cancel(); await port?.close(); } catch {}
  $('serial-status').textContent = '未接続';
  $('monitor').hidden = false; $('stop').hidden = true;
};
