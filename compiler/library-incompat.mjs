// Libraries the compile harness actually saw fail to build on a platform, with the alternative
// that built in the same run. Nothing here is inferred: every row names the harness case it was
// read from, and a row is only written after that case has been run.
//
// No versions. A row says the library does not build on the platform at all, so a newer version
// is never silently treated as fixed; removing a row needs a harness case that passes.
//
// `platforms` holds the board table's `platform` values (compiler/server.mjs), NOT its `family`.
// The two ESP boards share family 'esp', and the same Adafruit MQTT Library that fails on the
// ESP32 board builds on the ESP8266 one (harness wio_node/42-adafruit-mqtt-publish, ok, 200).
export const LIBRARY_INCOMPAT = [
  {
    library: 'adafruit/Adafruit MQTT Library',
    platforms: ['esp32'],
    reason: 'このライブラリの依存宣言（WiFiNINA fork）が ESP32 の WiFi.h を別実装で覆うため Build が失敗します',
    alternative: 'knolleary/PubSubClient',
    // A platform row covers every board on that platform, so a new esp32 board does not inherit
    // this row on trust: the same case was run on it before the row was allowed to apply.
    evidence: 'harness 2026-09-17 xiao_esp32c3/45-adafruit-mqtt-publish, 2026-09-20 esp32_devkitc_v4/45-adafruit-mqtt-publish',
  },
];

// "owner/name", compared without regard to case. Accepts the string or an { owner, name } pair.
function key(library) {
  if (typeof library === 'string') return library.toLowerCase();
  if (library && typeof library.owner === 'string' && typeof library.name === 'string')
    return `${library.owner}/${library.name}`.toLowerCase();
  return null;
}

/** The row for one library on one platform, or null. */
export function findIncompat(library, platform) {
  const wanted = key(library);
  if (!wanted || !platform) return null;
  return LIBRARY_INCOMPAT.find(row => key(row.library) === wanted && row.platforms.includes(platform)) ?? null;
}

/** Every row that applies to one platform. An unknown platform has none. */
export function incompatFor(platform) {
  return platform ? LIBRARY_INCOMPAT.filter(row => row.platforms.includes(platform)) : [];
}
