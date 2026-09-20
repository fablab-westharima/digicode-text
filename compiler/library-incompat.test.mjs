import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LIBRARY_INCOMPAT, findIncompat, incompatFor } from './library-incompat.mjs';

const MQTT = 'adafruit/Adafruit MQTT Library';
const ONEWIRE = 'paulstoffregen/OneWire';
// The board argument every lookup takes: { id, platform } as the board table declares them.
const C3 = { id: 'xiao_esp32c3', platform: 'esp32' };
const C5 = { id: 'xiao_esp32c5', platform: 'esp32' };
const C5_DEVKITC = { id: 'esp32_c5_devkitc_1', platform: 'esp32' };
const C5_ESPR = { id: 'espr_developer_c5', platform: 'esp32' };
const S3 = { id: 'xiao_esp32s3', platform: 'esp32' };
const DEVKITC = { id: 'esp32_devkitc_v4', platform: 'esp32' };
const PICO_W = { id: 'pico_w', platform: 'rp2040' };
const WIO = { id: 'wio_node', platform: 'esp8266' };
const base = 'http://127.0.0.1:3100';
// The HTTP checks run against the compiler this machine is serving; where it is not up there is
// nothing to check, so they are skipped rather than passed.
const reachable = await fetch(base + '/health').then(r => r.ok, () => false);
const details = params => fetch(base + '/libraries/details?' + new URLSearchParams(params)).then(r => r.json());

test('every row names a library, the platforms or boards it fails on, a reason, an alternative and its evidence', () => {
  assert.ok(LIBRARY_INCOMPAT.length > 0);
  const seen = new Set();
  for (const row of LIBRARY_INCOMPAT) {
    assert.match(row.library, /^[^/\s][^/]*\/[^/]+$/, 'library is owner/name');
    // A row says who it speaks for with platforms, with boards, or with both — never with neither,
    // which would be a row that applies to nothing.
    for (const field of ['platforms', 'boards'])
      if (field in row) assert.ok(Array.isArray(row[field]) && row[field].length > 0, `${row.library}.${field}`);
    assert.ok((row.platforms?.length ?? 0) + (row.boards?.length ?? 0) > 0, row.library);
    for (const platform of row.platforms ?? []) assert.match(platform, /^[a-z0-9]+$/);
    for (const board of row.boards ?? []) assert.match(board, /^[a-z0-9_]+$/);
    for (const field of ['reason', 'alternative', 'evidence']) {
      assert.equal(typeof row[field], 'string', `${row.library}.${field}`);
      assert.ok(row[field].length > 0, `${row.library}.${field}`);
    }
    // A row is about the library, not about one of its versions: a version would turn into a
    // claim that some other version works, which no harness case has shown.
    assert.ok(!('version' in row) && !('versions' in row), row.library);
    assert.ok(!row.library.includes('@'), row.library);
    // The alternative has to be a real coordinate the user can add, not a sentence.
    assert.match(row.alternative, /^[^/\s][^/]*\/[^/]+$/);
    for (const target of [...(row.platforms ?? []), ...(row.boards ?? [])]) {
      const pair = `${row.library.toLowerCase()} ${target}`;
      assert.ok(!seen.has(pair), `duplicate row: ${pair}`);
      seen.add(pair);
    }
  }
});

test('the platforms and boards named are ones the board table actually declares', async () => {
  // Read the server's text rather than importing it: importing would start a second listener.
  const server = await readFile(new URL('./server.mjs', import.meta.url), 'utf8');
  const platforms = new Set([...server.matchAll(/\bplatform: '([a-z0-9]+)'/g)].map(m => m[1]));
  const boards = new Set([...server.matchAll(/^\s*\['([a-z0-9_]+)', \{ project:/gm)].map(m => m[1]));
  assert.ok(platforms.size >= 3, [...platforms].join(', '));
  assert.ok(boards.size >= 6, [...boards].join(', '));
  for (const row of LIBRARY_INCOMPAT) {
    for (const platform of row.platforms ?? [])
      assert.ok(platforms.has(platform), `${row.library}: no board declares platform ${platform}`);
    // A board row must not silently outlive a board id being renamed or dropped.
    for (const board of row.boards ?? [])
      assert.ok(boards.has(board), `${row.library}: the board table has no board ${board}`);
  }
});

test('lookup is by owner/name without case, and only for the platforms the row names', () => {
  const row = findIncompat(MQTT, C3);
  assert.ok(row);
  assert.equal(row.alternative, 'knolleary/PubSubClient');
  assert.deepEqual(findIncompat({ owner: 'adafruit', name: 'Adafruit MQTT Library' }, C3), row);
  assert.deepEqual(findIncompat('ADAFRUIT/adafruit mqtt library', C3), row);
  // A platform row covers every board on that platform, whatever its id.
  for (const board of [C5, S3, DEVKITC]) assert.deepEqual(findIncompat(MQTT, board), row, board.id);
  // rp2040 fails the same way: harness pico_w/39-adafruit-mqtt-skip pulls the same
  // WiFiNINA fork over the core's WiFi.h. The row is per platform, so all three RP2040
  // boards carry it, including the two without a radio, which have no case of their own.
  assert.deepEqual(findIncompat(MQTT, PICO_W), row);
  for (const id of ['pico', 'xiao_rp2040']) assert.deepEqual(findIncompat(MQTT, { id, platform: 'rp2040' }), row, id);
  // ESP8266 builds this library: harness wio_node/42-adafruit-mqtt-publish is ok.
  // 'esp' is a family, never a platform value, so it matches nothing.
  for (const board of [WIO, { id: 'no_such_board', platform: 'esp' }, {}, null, undefined])
    assert.equal(findIncompat(MQTT, board), null, JSON.stringify(board));
  assert.equal(findIncompat('knolleary/PubSubClient', C3), null);
  assert.equal(findIncompat(null, C3), null);
  assert.equal(findIncompat({ owner: 'adafruit' }, C3), null);
  assert.deepEqual(incompatFor(WIO), []);
  assert.deepEqual(incompatFor(PICO_W), [row]);
  assert.deepEqual(incompatFor(undefined), []);
  // A bare platform string is not a board and is refused, so a stale call site cannot quietly
  // turn into "this board has no unusable libraries".
  for (const bad of ['esp32', 'xiao_esp32c5'])
    assert.throws(() => incompatFor(bad), TypeError, bad);
});

test('a board row applies to that board alone, while the other boards of its platform stay clear', () => {
  const row = findIncompat(ONEWIRE, C5);
  assert.ok(row);
  assert.equal(row.alternative, 'pstolarz/OneWireNg');
  assert.deepEqual(row.boards, ['xiao_esp32c5', 'esp32_c5_devkitc_1', 'espr_developer_c5']);
  assert.ok(!('platforms' in row));
  // Every C5 board carries it: the failure is the chip's register layout, not one board's wiring.
  for (const board of [C5_DEVKITC, C5_ESPR]) assert.equal(findIncompat(ONEWIRE, board), row, board.id);
  // The same platform, the boards that are not C5: harness 09/10/29/31 are ok on each of them.
  for (const board of [C3, S3, DEVKITC]) assert.equal(findIncompat(ONEWIRE, board), null, board.id);
  for (const board of [PICO_W, WIO]) assert.equal(findIncompat(ONEWIRE, board), null, board.id);
  // C5 carries both rows: the platform one it shares with the other ESP32 boards, and its own.
  assert.deepEqual(incompatFor(C5), [findIncompat(MQTT, C5), row]);
  assert.deepEqual(incompatFor(C5_DEVKITC), [findIncompat(MQTT, C5_DEVKITC), row]);
  assert.deepEqual(incompatFor(C5_ESPR), [findIncompat(MQTT, C5_ESPR), row]);
  assert.deepEqual(incompatFor(C3), [findIncompat(MQTT, C3)]);
  assert.deepEqual(incompatFor(DEVKITC), [findIncompat(MQTT, DEVKITC)]);
});

test('GET /libraries/incompat serves the table as written', async t => {
  if (!reachable) return t.skip('コンパイラサーバーへ接続できないためスキップ');
  const response = await fetch(base + '/libraries/incompat');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), LIBRARY_INCOMPAT);
});

test('details adds incompatible only for a board whose platform the row names', async t => {
  if (!reachable) return t.skip('コンパイラサーバーへ接続できないためスキップ');
  const coordinates = { owner: 'adafruit', name: 'Adafruit MQTT Library' };
  const plain = await details(coordinates);
  if (plain.error) return t.skip('Registryへ接続できないためスキップ: ' + plain.error);
  // No board: exactly the response this endpoint has always sent, with no extra key.
  assert.ok(!('incompatible' in plain));
  assert.equal(plain.owner, 'adafruit');
  assert.ok(Array.isArray(plain.versions) && plain.versions.length > 0);

  const c3 = await details({ ...coordinates, board: 'xiao_esp32c3' });
  assert.deepEqual(c3.incompatible, {
    reason: findIncompat(MQTT, C3).reason,
    alternative: findIncompat(MQTT, C3).alternative,
  });
  assert.deepEqual({ ...c3, incompatible: undefined }, { ...plain, incompatible: undefined });

  // The ESP8266 board shares family 'esp' with the C3 but builds this library, so it gets the
  // untouched response — the same bytes as no board at all. An unknown board too.
  for (const board of ['wio_node', 'no_such_board'])
    assert.deepEqual(await details({ ...coordinates, board }), plain, board);
  // Every RP2040 board carries the rp2040 row, measured on pico_w.
  for (const board of ['pico_w', 'pico', 'xiao_rp2040'])
    assert.deepEqual((await details({ ...coordinates, board })).incompatible, {
      reason: findIncompat(MQTT, PICO_W).reason,
      alternative: findIncompat(MQTT, PICO_W).alternative,
    }, board);

  // A library no row names is untouched on every board.
  const other = await details({ owner: 'knolleary', name: 'PubSubClient' });
  if (other.error) return;
  assert.deepEqual(await details({ owner: 'knolleary', name: 'PubSubClient', board: 'xiao_esp32c3' }), other);
});

test('details carries a board row only for that board, not for its platform', async t => {
  if (!reachable) return t.skip('コンパイラサーバーへ接続できないためスキップ');
  const coordinates = { owner: 'paulstoffregen', name: 'OneWire' };
  const plain = await details(coordinates);
  if (plain.error) return t.skip('Registryへ接続できないためスキップ: ' + plain.error);
  assert.ok(!('incompatible' in plain));

  assert.deepEqual((await details({ ...coordinates, board: 'xiao_esp32c5' })).incompatible, {
    reason: findIncompat(ONEWIRE, C5).reason,
    alternative: findIncompat(ONEWIRE, C5).alternative,
  });
  // The other boards on the same platform build it, so their response is the untouched one.
  for (const board of ['xiao_esp32c3', 'xiao_esp32s3', 'esp32_devkitc_v4', 'wio_node', 'pico_w'])
    assert.deepEqual(await details({ ...coordinates, board }), plain, board);
});
