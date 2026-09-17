const $ = (id) => document.getElementById(id);
const log = (s) => { $('serial-log').textContent += s + '\n'; $('serial-log').scrollTop = $('serial-log').scrollHeight; };

// USB-serial vendor IDs accepted by the monitor: Raspberry Pi (RP2040) plus the ESP-family
// bridges (CP210x, CH340, FTDI, Espressif USB JTAG/serial). Web Serial only lists matching ports.
export const SERIAL_VENDOR_IDS = [0x2e8a, 0x10c4, 0x1a86, 0x0403, 0x303a];
export const serialFilters = () => SERIAL_VENDOR_IDS.map(usbVendorId => ({ usbVendorId }));

// Web Serial monitor. Only the Human connects a device; nothing here runs on its own.
//
// One state machine owns the port — idle → opening → open → closing → idle — and it is the only
// thing in the app that opens or closes one. open() is reached from `idle` alone, so a port that
// is already open is never opened again. The reader is taken from port.readable directly (not
// through pipeTo, which locks the stream for good and makes port.close() reject with
// InvalidStateError, leaving the port open behind our back).
let state = 'idle';
let port, reader, writer, closing, lastPort;
const STATUS = { idle: '未接続', opening: '接続しています…', open: '接続中', closing: '切断しています…' };
const listeners = new Set();

/** Receive the monitor's decoded text. Returns an unsubscribe function. */
export function onSerialData(handler) { listeners.add(handler); return () => listeners.delete(handler); }
export function serialConnected() { return state === 'open'; }

// The baud rate is one global setting; it can only change while nothing is open.
const SERIAL_KEY = 'digicode-text.serial.v1';
export const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
const DEFAULT_BAUD = 115200;
const baudRate = () => Number($('serial-baud').value);
{
  let saved;
  try { saved = JSON.parse(localStorage.getItem(SERIAL_KEY) || 'null')?.baudRate; } catch {}
  for (const rate of BAUD_RATES) $('serial-baud').add(new Option(`${rate} bps`, rate));
  $('serial-baud').value = BAUD_RATES.includes(saved) ? saved : DEFAULT_BAUD;
  $('serial-baud').onchange = () => { try { localStorage.setItem(SERIAL_KEY, JSON.stringify({ baudRate: baudRate() })); } catch {} };
}

function setState(next) {
  state = next;
  $('serial-status').textContent = STATUS[next];
  $('monitor').hidden = next !== 'idle';
  $('stop').hidden = next === 'idle';
  // Nothing may be pressed while the port is half open or half closed.
  const busy = next === 'opening' || next === 'closing';
  $('monitor').disabled = $('stop').disabled = $('serial-forget').disabled = busy;
  $('serial-baud').disabled = next !== 'idle'; // 切断してから変える
  if (next !== 'idle') $('serial-empty').hidden = true;
}

// Close in this order — reader.cancel() → reader.releaseLock() → writer close/releaseLock →
// port.close() — go on to the next step whatever fails, and drop every reference at the end so
// the next connect starts from nothing. Problems are reported as one line in the Serial tab.
async function teardown() {
  setState('closing');
  const problems = [];
  const step = async (what, run) => { try { await run(); } catch (e) { problems.push(`${what}: ${e}`); } };
  await step('cancel', () => reader?.cancel());
  await step('releaseLock', () => reader?.releaseLock());
  // Nothing sends today, so there is no writer; when something does, it closes here in this order.
  await step('writer.close', () => writer?.close());
  await step('writer.releaseLock', () => writer?.releaseLock());
  await step('close', () => port?.close());
  port = undefined; reader = undefined; writer = undefined;
  setState('idle');
  if (problems.length) log('serial: 切断時のエラー: ' + problems.join(' / '));
}

/** Disconnect, joining a close that is already running. A port that is not open is left alone. */
export async function disconnectSerial() {
  if (state === 'closing') return closing;
  if (state !== 'open') return;
  closing = teardown().finally(() => { closing = undefined; });
  return closing;
}

async function pump() {
  const decoder = new TextDecoder();
  while (state === 'open') {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    const text = decoder.decode(value, { stream: true });
    if (!text) continue;
    $('serial-log').textContent += text;
    $('serial-log').scrollTop = $('serial-log').scrollHeight;
    for (const handler of listeners) handler(text);
  }
}

// The one way into `open`, and only the Human's 「接続」 reaches it: after a flash the port is left
// closed on purpose, so that other programs (PlatformIO monitor, scripts) can open it.
async function connect(pick) {
  if (state !== 'idle') return false;
  if (!('serial' in navigator)) { log('Web Serial is not available in this browser'); return false; }
  setState('opening');
  try {
    port = await pick();
    await port.open({ baudRate: baudRate() });
  } catch (e) {
    port = undefined;
    setState('idle');
    log('serial: ' + e);
    $('serial-status').textContent = '接続エラー'; // the idle text, replaced by why it is idle
    return false;
  }
  // Chrome's open() leaves DTR low. TinyUSB CDC (Pico) sends nothing until the host raises it, and
  // RTS=1/DTR=0 left over from a flasher is a reset request on the ESP32-C3's USB Serial/JTAG. So
  // every open ends in DTR=1, RTS=0. A port
  // that refuses still gets monitored.
  try { await port.setSignals({ dataTerminalReady: true, requestToSend: false }); }
  catch (e) { log('serial: DTRを設定できませんでした: ' + e); }
  lastPort = port; // kept after the close, so 「USBポートを解除」 knows which permission to drop
  setState('open');
  session();
  return true;
}

async function session() {
  // getReader() itself can fail (a readable that is gone or already locked). That is a failure of
  // this session, not a reason to stay in `opening` with every button disabled, so it lands in the
  // same catch as a read error and the finally below brings the state back to idle.
  try { reader = port.readable.getReader(); await pump(); }
  catch (e) { if (state === 'open') log('serial: ' + e); }
  // The loop also ends when the device goes away on its own; that still has to reach idle.
  finally { if (state === 'open') await disconnectSerial(); }
}

$('monitor').onclick = () => connect(() => navigator.serial.requestPort({ filters: serialFilters() }));

const vendorOf = (p) => { try { return p.getInfo().usbVendorId; } catch { return undefined; } };

/** The port the monitor holds (open or kept from the last session), if it is one of `vendors`. */
export function monitorPort(vendors) {
  const held = port ?? lastPort;
  return held && vendors.includes(vendorOf(held)) ? held : undefined;
}

/** Before a flash: close the monitor if it is open and say so. Resolves to whether it was open. */
export async function disconnectForFlash() {
  if (state !== 'open' && state !== 'closing') return false;
  await disconnectSerial();
  log('書き込みのため切断しました。出力を見るには「接続」を押してください');
  return true;
}

$('stop').onclick = () => disconnectSerial();

// Give the port's permission back. The port is closed first, so nothing is left open on the way out.
$('serial-forget').onclick = async () => {
  if (state === 'opening' || state === 'closing') return;
  if (!('serial' in navigator)) { log('Web Serial is not available in this browser'); return; }
  if (!confirm('シリアルを切断し、選んだUSBポートの許可を解除します。よろしいですか？')) return;
  await disconnectSerial();
  let targets = [];
  // forget() only drops the permission; it does not touch the device. Without a port from this
  // session, every port this browser granted earlier is offered back instead.
  try { targets = lastPort ? [lastPort] : await navigator.serial.getPorts(); } catch (e) { log('serial: ' + e); }
  let forgotten = 0;
  for (const target of targets) {
    try { await target.forget(); forgotten++; } catch (e) { log('serial: ' + e); }
  }
  lastPort = undefined;
  log(forgotten ? '次回接続時にポートを選び直してください' : '解除できるポートがありません');
};

setState('idle');
