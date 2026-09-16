import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LIBRARY_INCOMPAT, findIncompat, incompatFor } from './library-incompat.mjs';

const MQTT = 'adafruit/Adafruit MQTT Library';
const base = 'http://127.0.0.1:3100';
// The HTTP checks run against the compiler this machine is serving; where it is not up there is
// nothing to check, so they are skipped rather than passed.
const reachable = await fetch(base + '/health').then(r => r.ok, () => false);
const details = params => fetch(base + '/libraries/details?' + new URLSearchParams(params)).then(r => r.json());

test('every row names a library, the platforms it fails on, a reason, an alternative and its evidence', () => {
  assert.ok(LIBRARY_INCOMPAT.length > 0);
  const seen = new Set();
  for (const row of LIBRARY_INCOMPAT) {
    assert.match(row.library, /^[^/\s][^/]*\/[^/]+$/, 'library is owner/name');
    assert.ok(Array.isArray(row.platforms) && row.platforms.length > 0, row.library);
    for (const platform of row.platforms) assert.match(platform, /^[a-z0-9]+$/);
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
    for (const platform of row.platforms) {
      const pair = `${row.library.toLowerCase()} ${platform}`;
      assert.ok(!seen.has(pair), `duplicate row: ${pair}`);
      seen.add(pair);
    }
  }
});

test('the platforms named are platforms the board table actually declares', async () => {
  // Read the server's text rather than importing it: importing would start a second listener.
  const server = await readFile(new URL('./server.mjs', import.meta.url), 'utf8');
  const declared = new Set([...server.matchAll(/\bplatform: '([a-z0-9]+)'/g)].map(m => m[1]));
  assert.ok(declared.size >= 3, [...declared].join(', '));
  for (const row of LIBRARY_INCOMPAT)
    for (const platform of row.platforms)
      assert.ok(declared.has(platform), `${row.library}: no board declares platform ${platform}`);
});

test('lookup is by owner/name without case, and only for the platforms the row names', () => {
  const row = findIncompat(MQTT, 'esp32');
  assert.ok(row);
  assert.equal(row.alternative, 'knolleary/PubSubClient');
  assert.deepEqual(findIncompat({ owner: 'adafruit', name: 'Adafruit MQTT Library' }, 'esp32'), row);
  assert.deepEqual(findIncompat('ADAFRUIT/adafruit mqtt library', 'esp32'), row);
  // ESP8266 builds this library: harness wio_node/42-adafruit-mqtt-publish is ok.
  for (const platform of ['esp8266', 'rp2040', 'esp', '', null, undefined])
    assert.equal(findIncompat(MQTT, platform), null, String(platform));
  assert.equal(findIncompat('knolleary/PubSubClient', 'esp32'), null);
  assert.equal(findIncompat(null, 'esp32'), null);
  assert.equal(findIncompat({ owner: 'adafruit' }, 'esp32'), null);
  assert.deepEqual(incompatFor('esp32'), [findIncompat(MQTT, 'esp32')]);
  assert.deepEqual(incompatFor('esp8266'), []);
  assert.deepEqual(incompatFor('rp2040'), []);
  assert.deepEqual(incompatFor(undefined), []);
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
    reason: findIncompat(MQTT, 'esp32').reason,
    alternative: findIncompat(MQTT, 'esp32').alternative,
  });
  assert.deepEqual({ ...c3, incompatible: undefined }, { ...plain, incompatible: undefined });

  // The ESP8266 board shares family 'esp' with the C3 but builds this library, so it gets the
  // untouched response — the same bytes as no board at all.
  for (const board of ['wio_node', 'pico', 'xiao_rp2040', 'no_such_board'])
    assert.deepEqual(await details({ ...coordinates, board }), plain, board);

  // A library no row names is untouched on every board.
  const other = await details({ owner: 'knolleary', name: 'PubSubClient' });
  if (other.error) return;
  assert.deepEqual(await details({ owner: 'knolleary', name: 'PubSubClient', board: 'xiao_esp32c3' }), other);
});
