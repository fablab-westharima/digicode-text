// 最小の zip 読み書き。外部ライブラリは使わない。
// 書き込みは method 0（STORE）だけ。読み込みは method 0 と 8（deflate-raw）だけを受け、
// それ以外の圧縮方式・暗号化・壊れたファイルは例外で拒否する。
// 例外のメッセージはそのまま利用者に出せる日本語 1 文にしてある。

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
const UTF8_FLAG = 0x0800; // general purpose bit 11: the name is UTF-8
const encoder = new TextEncoder();

// MS-DOS date/time. Before 1980 the format cannot represent the date, so it clamps.
function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

class Writer {
  constructor() { this.parts = []; this.length = 0; }
  bytes(value) { this.parts.push(value); this.length += value.length; }
  u16(value) { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, value, true); this.bytes(b); }
  u32(value) { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, value >>> 0, true); this.bytes(b); }
  join() {
    const out = new Uint8Array(this.length);
    let offset = 0;
    for (const part of this.parts) { out.set(part, offset); offset += part.length; }
    return out;
  }
}

// entries: [{ name: 'dir/file.txt', data: Uint8Array }]。名前は UTF-8 のまま格納する。
export function zipWrite(entries, at = new Date()) {
  const { time, date } = dosDateTime(at);
  const body = new Writer();
  const central = new Writer();
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);
    const offset = body.length;
    body.u32(LOCAL_SIG);
    body.u16(20);          // version needed
    body.u16(UTF8_FLAG);
    body.u16(0);           // method 0: stored
    body.u16(time); body.u16(date);
    body.u32(crc);
    body.u32(data.length); // compressed size
    body.u32(data.length); // uncompressed size
    body.u16(name.length);
    body.u16(0);           // extra field length
    body.bytes(name);
    body.bytes(data);

    central.u32(CENTRAL_SIG);
    central.u16(20);       // version made by
    central.u16(20);       // version needed
    central.u16(UTF8_FLAG);
    central.u16(0);
    central.u16(time); central.u16(date);
    central.u32(crc);
    central.u32(data.length);
    central.u32(data.length);
    central.u16(name.length);
    central.u16(0);        // extra
    central.u16(0);        // comment
    central.u16(0);        // disk number
    central.u16(0);        // internal attributes
    central.u32(0);        // external attributes
    central.u32(offset);
    central.bytes(name);
  }
  const out = new Writer();
  out.bytes(body.join());
  const centralBytes = central.join();
  out.bytes(centralBytes);
  out.u32(EOCD_SIG);
  out.u16(0); out.u16(0);
  out.u16(entries.length); out.u16(entries.length);
  out.u32(centralBytes.length);
  out.u32(body.length);
  out.u16(0);             // comment length
  return out.join();
}

async function inflateRaw(bytes) {
  let stream;
  try {
    stream = new ReadableStream({ start(c) { c.enqueue(bytes); c.close(); } })
      .pipeThrough(new DecompressionStream('deflate-raw'));
  } catch { throw new Error('このブラウザは圧縮された zip を展開できません'); }
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value); total += value.length;
    }
  } catch { throw new Error('zip の中身が壊れています（展開できませんでした）'); }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
  return out;
}

function findEocd(view, length) {
  // The comment may be up to 65535 bytes, so the record starts at most 65557 bytes from the end.
  const earliest = Math.max(0, length - 22 - 65535);
  for (let i = length - 22; i >= earliest; i--) {
    if (view.getUint32(i, true) === EOCD_SIG) return i;
  }
  throw new Error('zip ファイルとして読めません（末尾の目録が見つかりません）');
}

// Uint8Array -> [{ name, data }]。ディレクトリ項目（名前が / で終わる）は読み飛ばす。
export async function zipRead(bytes) {
  if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
  if (bytes.length < 22) throw new Error('zip ファイルとして読めません（末尾の目録が見つかりません）');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEocd(view, bytes.length);
  const count = view.getUint16(eocd + 10, true);
  let pointer = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (pointer + 46 > bytes.length || view.getUint32(pointer, true) !== CENTRAL_SIG) {
      throw new Error('zip ファイルとして読めません（内部の署名が一致しません）');
    }
    const flags = view.getUint16(pointer + 8, true);
    const method = view.getUint16(pointer + 10, true);
    const crc = view.getUint32(pointer + 16, true);
    const compressedSize = view.getUint32(pointer + 20, true);
    const size = view.getUint32(pointer + 24, true);
    const nameLength = view.getUint16(pointer + 28, true);
    const extraLength = view.getUint16(pointer + 30, true);
    const commentLength = view.getUint16(pointer + 32, true);
    const localOffset = view.getUint32(pointer + 42, true);
    const name = decoder.decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength));
    pointer += 46 + nameLength + extraLength + commentLength;
    if (flags & 0x0001) throw new Error('パスワード付きの zip は読み込めません');
    if (method !== 0 && method !== 8) throw new Error('この zip は対応していない圧縮方式です');
    if (name.endsWith('/')) continue;
    if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== LOCAL_SIG) {
      throw new Error('zip ファイルとして読めません（内部の署名が一致しません）');
    }
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    if (start + compressedSize > bytes.length) throw new Error('zip ファイルとして読めません（内容が途中で切れています）');
    const raw = bytes.subarray(start, start + compressedSize);
    const data = method === 8 ? await inflateRaw(raw) : raw.slice();
    if (data.length !== size) throw new Error('zip の中身が壊れています（大きさが一致しません）');
    if (crc32(data) !== crc) throw new Error('zip の中身が壊れています（CRC が一致しません）');
    entries.push({ name, data });
  }
  return entries;
}
