// Hard reset through RTS (EN), in the order esptool.py uses: DTR low, RTS high, 100 ms, RTS low.
// esptool-js 0.6.1's own HardReset only ever writes RTS=false, so after the USB-JTAG bootloader
// entry (which ends in RTS=0) there is no edge and an ESP32-C3 stays in the download mode until
// someone presses reset. `transport` is esptool-js's Transport (setDTR / setRTS).
export async function hardResetPulse(transport, sleep = (ms) => new Promise(r => setTimeout(r, ms))) {
  await transport.setDTR(false);
  await transport.setRTS(true);
  await sleep(100);
  await transport.setRTS(false);
}
