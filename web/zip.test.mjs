import test from 'node:test';
import assert from 'node:assert/strict';
import { zipWrite, zipRead, crc32 } from './zip.js';

const utf8 = (s) => new TextEncoder().encode(s);
const str = (b) => new TextDecoder().decode(b);

test('CRC-32 matches the standard check value', () => {
  assert.equal(crc32(utf8('123456789')), 0xcbf43926);
  assert.equal(crc32(new Uint8Array(0)), 0);
});

test('what zipWrite stores, zipRead gives back byte for byte', async () => {
  const entries = [
    { name: 'プロジェクト/src/main.cpp', data: utf8('#include <Arduino.h>\nvoid setup() {}\n') },
    { name: 'プロジェクト/digicode.json', data: utf8('{"format":"digicode-text-project"}') },
    { name: 'プロジェクト/empty.txt', data: new Uint8Array(0) },
  ];
  const back = await zipRead(zipWrite(entries));
  assert.deepEqual(back.map(e => e.name), entries.map(e => e.name));
  for (let i = 0; i < entries.length; i++) assert.deepEqual([...back[i].data], [...entries[i].data]);
});

test('names are stored as UTF-8 with general purpose bit 11 set', async () => {
  const bytes = zipWrite([{ name: '日本語の名前.txt', data: utf8('x') }]);
  const view = new DataView(bytes.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint16(6, true) & 0x0800, 0x0800); // bit 11
  assert.equal(view.getUint16(8, true), 0);               // method 0: stored
  const nameLength = view.getUint16(26, true);
  assert.equal(str(bytes.subarray(30, 30 + nameLength)), '日本語の名前.txt');
});

test('every stored entry carries the CRC of its own bytes', async () => {
  const data = utf8('hello zip');
  const bytes = zipWrite([{ name: 'a.txt', data }]);
  assert.equal(new DataView(bytes.buffer).getUint32(14, true), crc32(data));
});

// A deflate-raw member, built by hand, is what other zip tools produce.
async function deflateRaw(bytes) {
  const stream = new ReadableStream({ start(c) { c.enqueue(bytes); c.close(); } })
    .pipeThrough(new CompressionStream('deflate-raw'));
  const chunks = [];
  const reader = stream.getReader();
  for (;;) { const { value, done } = await reader.read(); if (done) break; chunks.push(value); }
  return new Uint8Array(chunks.flatMap(c => [...c]));
}

async function handBuilt(name, data, { method = 8, flags = 0x0800, crc, payload } = {}) {
  const body = payload ?? (method === 8 ? await deflateRaw(data) : data);
  const nameBytes = utf8(name);
  const local = new Uint8Array(30 + nameBytes.length + body.length);
  const lv = new DataView(local.buffer);
  lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, flags, true);
  lv.setUint16(8, method, true); lv.setUint32(14, crc ?? crc32(data), true);
  lv.setUint32(18, body.length, true); lv.setUint32(22, data.length, true);
  lv.setUint16(26, nameBytes.length, true);
  local.set(nameBytes, 30); local.set(body, 30 + nameBytes.length);

  const central = new Uint8Array(46 + nameBytes.length);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
  cv.setUint16(8, flags, true); cv.setUint16(10, method, true);
  cv.setUint32(16, crc ?? crc32(data), true);
  cv.setUint32(20, body.length, true); cv.setUint32(24, data.length, true);
  cv.setUint16(28, nameBytes.length, true); cv.setUint32(42, 0, true);
  central.set(nameBytes, 46);

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, 1, true); ev.setUint16(10, 1, true);
  ev.setUint32(12, central.length, true); ev.setUint32(16, local.length, true);

  const out = new Uint8Array(local.length + central.length + eocd.length);
  out.set(local, 0); out.set(central, local.length); out.set(eocd, local.length + central.length);
  return out;
}

test('a deflate-raw (method 8) member is expanded on read', async () => {
  const data = utf8('void loop() { Serial.println("hello"); }\n'.repeat(40));
  const back = await zipRead(await handBuilt('src/main.cpp', data));
  assert.equal(back.length, 1);
  assert.equal(str(back[0].data), str(data));
});

test('a zip with no end-of-central-directory record is rejected', async () => {
  await assert.rejects(zipRead(utf8('this is not a zip at all')), /末尾の目録が見つかりません/);
  await assert.rejects(zipRead(new Uint8Array(4)), /末尾の目録が見つかりません/);
});

test('a wrong CRC is rejected instead of silently imported', async () => {
  const bytes = zipWrite([{ name: 'a.txt', data: utf8('hello') }]);
  const view = new DataView(bytes.buffer);
  view.setUint32(14, 0xdeadbeef, true); // local header CRC
  const central = bytes.length - 22 - (46 + 5);
  view.setUint32(central + 16, 0xdeadbeef, true);
  await assert.rejects(zipRead(bytes), /CRC が一致しません/);
});

test('an unknown compression method is rejected', async () => {
  const data = utf8('x'.repeat(10));
  await assert.rejects(zipRead(await handBuilt('a.txt', data, { method: 9, payload: data })),
    /対応していない圧縮方式/);
});

test('an encrypted member is rejected', async () => {
  const data = utf8('secret');
  await assert.rejects(zipRead(await handBuilt('a.txt', data, { method: 0, flags: 0x0801, payload: data })),
    /パスワード付き/);
});

test('a truncated body is rejected', async () => {
  const bytes = zipWrite([{ name: 'a.txt', data: utf8('hello') }]);
  const view = new DataView(bytes.buffer);
  view.setUint32(18, 9999, true);
  const central = bytes.length - 22 - (46 + 5);
  view.setUint32(central + 20, 9999, true);
  await assert.rejects(zipRead(bytes), /途中で切れています/);
});

test('a broken local header signature is rejected', async () => {
  const bytes = zipWrite([{ name: 'a.txt', data: utf8('hello') }]);
  new DataView(bytes.buffer).setUint32(0, 0x01020304, true);
  await assert.rejects(zipRead(bytes), /署名が一致しません/);
});

test('directory entries are skipped, files are kept', async () => {
  const bytes = zipWrite([
    { name: 'project/', data: new Uint8Array(0) },
    { name: 'project/a.txt', data: utf8('a') },
  ]);
  const back = await zipRead(bytes);
  assert.deepEqual(back.map(e => e.name), ['project/a.txt']);
});
