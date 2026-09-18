import test from 'node:test';
import assert from 'node:assert/strict';
import { zipRead, zipWrite } from './zip.js';
import {
  safeName, stamp, uniqueName, digicodeJson,
  exportProject, exportAll, parseImportZip,
} from './project-io.js';

// この compiler が持っているボード id。env が既知かどうかを見るためだけに使う。
const BOARDS = new Set(['xiao_rp2040', 'pico', 'xiao_esp32c3', 'wio_node']);
const LIB = { id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.2' };
const project = (over = {}) => ({
  id: 'ignored', name: 'てすと', source: 'void setup() {}\n', env: 'pico',
  libraries: [LIB], revision: 7, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z', ...over,
});
const utf8 = (s) => new TextEncoder().encode(s);
const str = (b) => new TextDecoder().decode(b);
const files = async (bytes) => new Map((await zipRead(bytes)).map(e => [e.name, str(e.data)]));

test('names that cannot be file names are made safe, never empty', () => {
  assert.equal(safeName('a/b:c*d?e"f<g>h|i'), 'a_b_c_d_e_f_g_h_i');
  assert.equal(safeName('  ..  '), 'project');
  assert.equal(safeName(''), 'project');
  assert.equal(safeName('ふつうの名前'), 'ふつうの名前');
});

test('the timestamp is YYYYMMDD-HHMMSS in local time', () => {
  assert.equal(stamp(new Date(2026, 8, 18, 3, 4, 5)), '20260918-030405');
});

test('a colliding name gets (2), then (3), and stays within 80 characters', () => {
  assert.equal(uniqueName('a', new Set()), 'a');
  assert.equal(uniqueName('a', new Set(['a'])), 'a (2)');
  assert.equal(uniqueName('a', new Set(['a', 'a (2)'])), 'a (3)');
  const long = 'あ'.repeat(80);
  const result = uniqueName(long, new Set([long]));
  assert.equal([...result].length, 80);
  assert.ok(result.endsWith(' (2)'));
});

test('digicode.json has version 2, no id and no source', () => {
  const json = digicodeJson(project(), { exportedAt: '2026-09-18T00:00:00.000Z' });
  assert.deepEqual(json, {
    format: 'digicode-text-project', version: 2, name: 'てすと', env: 'pico',
    libraries: [LIB], revision: 7, exportedAt: '2026-09-18T00:00:00.000Z',
    product: { name: 'digicode-text', commit: null },
  });
  assert.equal('id' in json, false);
  assert.equal('source' in json, false);
});

test('a one-project zip holds exactly two files under the project folder', async () => {
  const { fileName, bytes } = exportProject(project(), { at: new Date(2026, 8, 18, 1, 2, 3) });
  assert.equal(fileName, 'てすと_20260918-010203.zip');
  const inside = await files(bytes);
  assert.deepEqual([...inside.keys()].sort(), ['てすと/digicode.json', 'てすと/src/main.cpp'].sort());
  assert.equal(inside.get('てすと/src/main.cpp'), 'void setup() {}\n');
});

test('every project is a folder in the all-projects zip, with an index at the root', async () => {
  const projects = [project(), project({ name: 'てすと', env: 'wio_node' }), project({ name: '別', env: 'xiao_esp32c3' })];
  const { fileName, bytes } = exportAll(projects, { at: new Date(2026, 8, 18, 1, 2, 3) });
  assert.equal(fileName, 'digicode-text_projects_20260918-010203.zip');
  const inside = await files(bytes);
  const index = JSON.parse(inside.get('digicode-projects.json'));
  assert.equal(index.format, 'digicode-text-projects');
  assert.equal(index.version, 1);
  // Colliding folder names are made unique, and the index names the folders that exist.
  assert.deepEqual(index.projects, ['てすと', 'てすと (2)', '別']);
  for (const folder of index.projects) assert.ok(inside.has(`${folder}/src/main.cpp`), folder);
  // 1 + 2 per project, and nothing else.
  assert.equal(inside.size, 1 + 3 * 2);
});

test('an exported project comes back with the same code, board, libraries and revision', async () => {
  const { bytes } = exportProject(project());
  const [back] = await parseImportZip(bytes, { zipName: 'てすと_20260918-010203.zip', boards: BOARDS });
  assert.equal(back.name, 'てすと');
  assert.equal(back.source, 'void setup() {}\n');
  assert.equal(back.env, 'pico');
  assert.deepEqual(back.libraries, [LIB]);
  assert.equal(back.revision, 7);
});

test('an all-projects zip comes back as every project it holds', async () => {
  const projects = [project(), project({ name: '二番目', env: 'xiao_rp2040', libraries: [] })];
  const { bytes } = exportAll(projects);
  const back = await parseImportZip(bytes, { zipName: 'x.zip', boards: BOARDS });
  assert.deepEqual(back.map(p => [p.name, p.env]), [['てすと', 'pico'], ['二番目', 'xiao_rp2040']]);
});

test('a zip that is not a DigiCode Text project is refused, whatever else is inside it', async () => {
  const cases = [
    [{ name: 'thing/src/main.cpp', data: utf8('int main() {}') }],
    [{ name: 'src/main.cpp', data: utf8('x') }, { name: 'notes.txt', data: utf8('x') }],
    [{ name: 'a/b/digicode.json', data: utf8('{}') }], // 深さ2以上は見ない
    [{ name: 'photo.png', data: utf8('x') }],
  ];
  for (const entries of cases) {
    await assert.rejects(parseImportZip(zipWrite(entries), { zipName: 'a.zip', boards: BOARDS }),
      /DigiCode Text のプロジェクトではありません/);
  }
});

test('a digicode.json without its src/main.cpp is refused', async () => {
  const bytes = zipWrite([
    { name: 'p/digicode.json', data: utf8(JSON.stringify({ format: 'digicode-text-project', version: 2, name: 'x', env: 'pico', libraries: [] })) },
  ]);
  await assert.rejects(parseImportZip(bytes, { zipName: 'a.zip', boards: BOARDS }), /main.cpp が見つかりません/);
});

test('a digicode.json of an unknown format or version is refused', async () => {
  for (const json of [{ format: 'something-else', version: 2 }, { format: 'digicode-text-project', version: 3 }, { nope: 1 }]) {
    const bytes = zipWrite([
      { name: 'p/digicode.json', data: utf8(JSON.stringify(json)) },
      { name: 'p/src/main.cpp', data: utf8('x') },
    ]);
    await assert.rejects(parseImportZip(bytes, { zipName: 'a.zip', boards: BOARDS }), /DigiCode Text のプロジェクトではありません/);
  }
});

test('a digicode.json of version 1 (source inside) is still read', async () => {
  const bytes = zipWrite([{
    name: 'old/digicode.json',
    data: utf8(JSON.stringify({ format: 'digicode-text-project', version: 1, name: '旧', source: 'old code', env: 'pico', libraries: [LIB] })),
  }]);
  const [back] = await parseImportZip(bytes, { zipName: 'a.zip', boards: BOARDS });
  assert.equal(back.source, 'old code');
  assert.equal(back.name, '旧');
  assert.deepEqual(back.libraries, [LIB]);
  assert.equal(back.revision, null);
});

test('a board that this compiler does not have is left for the user to choose', async () => {
  const bytes = zipWrite([
    { name: 'p/digicode.json', data: utf8(JSON.stringify({ format: 'digicode-text-project', version: 2, name: 'x', env: 'teensy41', libraries: [] })) },
    { name: 'p/src/main.cpp', data: utf8('x') },
  ]);
  const [back] = await parseImportZip(bytes, { zipName: 'a.zip', boards: BOARDS });
  assert.equal(back.env, null);
});

test('the folder name, then the zip name, stands in for a missing project name', async () => {
  const config = { format: 'digicode-text-project', version: 2, env: 'pico', libraries: [] };
  const inFolder = zipWrite([
    { name: 'フォルダ名/digicode.json', data: utf8(JSON.stringify(config)) },
    { name: 'フォルダ名/src/main.cpp', data: utf8('x') },
  ]);
  assert.equal((await parseImportZip(inFolder, { zipName: 'zip名.zip', boards: BOARDS }))[0].name, 'フォルダ名');
  const atRoot = zipWrite([
    { name: 'digicode.json', data: utf8(JSON.stringify(config)) },
    { name: 'src/main.cpp', data: utf8('x') },
  ]);
  assert.equal((await parseImportZip(atRoot, { zipName: 'zip名.zip', boards: BOARDS }))[0].name, 'zip名');
});

test('a main.cpp over 1 MiB is refused, with the same limit and wording as the JSON path', async () => {
  const config = JSON.stringify({ format: 'digicode-text-project', version: 2, name: 'x', env: 'pico', libraries: [] });
  const withConfig = zipWrite([
    { name: 'p/digicode.json', data: utf8(config) },
    { name: 'p/src/main.cpp', data: utf8('x'.repeat(1024 * 1024 + 1)) },
  ]);
  await assert.rejects(parseImportZip(withConfig, { zipName: 'a.zip', boards: BOARDS }), /コードは1 MiB以内にしてください/);
  // ちょうど 1 MiB は通る。
  const exact = zipWrite([
    { name: 'r/digicode.json', data: utf8(config) },
    { name: 'r/src/main.cpp', data: utf8('y'.repeat(1024 * 1024)) },
  ]);
  const [ok] = await parseImportZip(exact, { zipName: 'c.zip', boards: BOARDS });
  assert.equal(ok.source.length, 1024 * 1024);
});
