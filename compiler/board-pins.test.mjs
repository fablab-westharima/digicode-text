import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { ENVS, PIO_HOME, OUT_DIR, generate, outFile, serialise } from './tools/generate-board-pins.mjs';

// The committed pin files must be exactly what the generator produces from this machine's
// PlatformIO install. A stale file would let the AI be told pin numbers the compiler does not use.
// Skipped, not passed, where PlatformIO is absent: nothing can be checked there.
const installed = await access(PIO_HOME).then(() => true, () => false);

test('every board has a committed pin file and the server can read it', async () => {
  assert.ok(ENVS.length >= 4);
  for (const { env } of ENVS) {
    const data = JSON.parse(await readFile(outFile(env), 'utf8'));
    assert.equal(data.env, env);
    assert.ok(data.pins.length > 0, `${env} has no pins`);
    assert.equal(path.dirname(outFile(env)), OUT_DIR);
    for (const pin of data.pins) {
      assert.match(pin.label, /^[AD]\d{1,2}$/);
      assert.ok(Number.isInteger(pin.pin) && pin.pin >= 0);
      assert.ok(pin.gpio === null || Number.isInteger(pin.gpio));
      assert.ok(Array.isArray(pin.functions));
    }
    // GPIO numbers reach the user as decimal, never as a hex address.
    assert.doesNotMatch(JSON.stringify(data.pins), /0x/i);
  }
});

test('re-running the generator reproduces the committed pin files byte for byte', { skip: installed ? false : `no PlatformIO install at ${PIO_HOME}` }, async () => {
  for (const spec of ENVS) {
    const committed = await readFile(outFile(spec.env), 'utf8');
    assert.equal(serialise(await generate(spec)), committed, `${spec.env}.pins.json is out of date; run node compiler/tools/generate-board-pins.mjs`);
  }
});

test('each pin file names the platformio.ini env and the variant header it came from', { skip: installed ? false : 'no PlatformIO install' }, async () => {
  for (const { env, project } of ENVS) {
    const data = JSON.parse(await readFile(outFile(env), 'utf8'));
    assert.equal(data.sources.platformioIni, `compiler/${project}/platformio.ini`);
    const ini = await readFile(new URL(`./${project}/platformio.ini`, import.meta.url), 'utf8');
    assert.ok(ini.includes(`[env:${env}]`));
    assert.ok(ini.includes(data.board), `${env}: board ${data.board} is not in its platformio.ini`);
    assert.match(data.sources.variantHeader, new RegExp(`^packages/${data.frameworkPackage}/variants/.*/pins_arduino\\.h$`));
    assert.ok(data.sources.variantHeader.includes(data.variant));
    await access(path.join(PIO_HOME, data.sources.variantHeader));
    await access(path.join(PIO_HOME, data.sources.boardDefinition));
  }
});
