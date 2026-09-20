// Libraries the compile harness actually saw fail to build, with the alternative that built on
// the same board. Nothing here is inferred: every row names the harness case it was read from,
// and a row is only written after that case has been run.
//
// No versions. A row says the library does not build there at all, so a newer version is never
// silently treated as fixed; removing a row needs a harness case that passes.
//
// A row says which boards it speaks for with `platforms`, with `boards`, or with both; at least
// one of the two is non-empty. `platforms` holds the board table's `platform` values
// (compiler/server.mjs), NOT its `family`: the two ESP boards share family 'esp', and the same
// Adafruit MQTT Library that fails on the ESP32 board builds on the ESP8266 one (harness
// wio_node/42-adafruit-mqtt-publish, ok, 200). `boards` holds board ids, for a library that the
// harness saw fail on one board while the other boards on the same platform built it.
export const LIBRARY_INCOMPAT = [
  {
    library: 'adafruit/Adafruit MQTT Library',
    // 同じ原因が rp2040 でも出た。pico_w のケースの build ログに
    // 「Compiling .../WiFiNINA_-_Adafruit_Fork/WiFiClient.cpp.o」が出たうえで、
    // ESP32 のときと同じ 'class WiFiClass' has no member named 'mode' で落ちている。
    // 無線を持たない pico と xiao_rp2040 にはこのライブラリのケースが無く（skip）、
    // platform 単位の行なので、この 2 台にも同じ行が出る。
    platforms: ['esp32', 'rp2040'],
    reason: 'このライブラリの依存宣言（WiFiNINA fork）が core の WiFi.h を別実装で覆うため Build が失敗します',
    alternative: 'knolleary/PubSubClient',
    // A platform row covers every board on that platform, so a new esp32 board does not inherit
    // this row on trust: the same case was run on it before the row was allowed to apply.
    evidence: 'harness 2026-09-17 xiao_esp32c3/45-adafruit-mqtt-publish, 2026-09-20 esp32_devkitc_v4/45-adafruit-mqtt-publish, 2026-09-20 xiao_esp32s3/45-adafruit-mqtt-publish, 2026-09-20 pico_w/39-adafruit-mqtt-skip',
  },
  {
    library: 'paulstoffregen/OneWire',
    // A board row, not a platform row. The other three esp32 boards build this library: the same
    // four cases are ok on xiao_esp32c3, xiao_esp32s3 and esp32_devkitc_v4. Only the C5 fails,
    // because OneWire's util/OneWire_direct_gpio.h reads and writes GPIO.in / GPIO.out_w1tc as
    // plain 32-bit registers, while the C5's soc/gpio_struct.h declares them as bit-field structs.
    boards: ['xiao_esp32c5'],
    reason: 'このライブラリがGPIOレジスタを直接読み書きする部分が、このボードのcoreのレジスタ定義と合わないためBuildが失敗します',
    alternative: 'pstolarz/OneWireNg',
    evidence: 'harness 2026-09-21 xiao_esp32c5/09-onewire-dallas, 2026-09-21 xiao_esp32c5/10-dallas-legacy-version, 2026-09-21 xiao_esp32c5/29-modbus-dallas-json, 2026-09-21 xiao_esp32c5/31-dallas-ssd1306（ng）、同じ4件が 2026-09-21 xiao_esp32c3 では ok。代替は 2026-09-21 xiao_esp32c5/62-onewireng-ds18b20 が ok',
  },
];

// "owner/name", compared without regard to case. Accepts the string or an { owner, name } pair.
function key(library) {
  if (typeof library === 'string') return library.toLowerCase();
  if (library && typeof library.owner === 'string' && typeof library.name === 'string')
    return `${library.owner}/${library.name}`.toLowerCase();
  return null;
}

// A row speaks for a board when it names that board's platform or the board itself. Both lists
// are optional on a row, so a missing one is read as empty rather than as "everything".
function covers(row, board) {
  return (row.platforms ?? []).includes(board.platform) || (row.boards ?? []).includes(board.id);
}

// Callers pass the board, never a bare platform: a row can now be about one board, so a platform
// alone cannot answer the question. A string is refused loudly rather than answered with "none",
// which would quietly drop rows.
function boardOf(board) {
  if (board == null) return null;
  if (typeof board !== 'object') throw new TypeError(`board must be { id, platform }, got ${typeof board}`);
  return board;
}

/** The row for one library on one board, or null. `board` is { id, platform } from the board table. */
export function findIncompat(library, board) {
  const wanted = key(library);
  if (!wanted) return null;
  return incompatFor(board).find(row => key(row.library) === wanted) ?? null;
}

/** Every row that applies to one board. An unknown board has none. */
export function incompatFor(board) {
  const b = boardOf(board);
  return b ? LIBRARY_INCOMPAT.filter(row => covers(row, b)) : [];
}
