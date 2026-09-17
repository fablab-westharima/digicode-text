// シリアルの受信テキストからプロッタの系列を取り出す純関数。DOM も Canvas も触らない。
// 読む行は 2 通りだけ:
//   1. 数値の並び        「12, 34 56」          — 行頭が -?数字 のとき。区切りはカンマ・空白・タブ。
//                                                 名前が無いので CH1, CH2, … を順に当てる。
//   2. label:value の並び「temp:25.5 hum:40」  — 区切りは同じ。名前はそのまま系列名になる。
// どちらにも当てはまらない行(混在・文章・空行)は null。プロッタは捨て、モニタにはそのまま出る。
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const PAIR = /^([^:]+):([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)$/;

/** 1 行を [{ label, value }] にする。読めない行は null。 */
export function parseSample(line) {
  const text = String(line).trim();
  if (!text) return null;
  if (/^-?\d/.test(text)) {
    const tokens = text.split(/[\s,]+/).filter(Boolean);
    if (!tokens.every(token => NUMBER.test(token))) return null;
    return tokens.map((token, i) => ({ label: `CH${i + 1}`, value: Number(token) }));
  }
  const samples = [];
  for (const token of text.split(/[\s,]+/).filter(Boolean)) {
    const pair = PAIR.exec(token);
    if (!pair) return null;
    const value = Number(pair[2]);
    if (!Number.isFinite(value)) return null;
    samples.push({ label: pair[1], value });
  }
  return samples.length ? samples : null;
}

// 受信は行の途中で切れて届く。完成した行だけ返し、残りは次のチャンクの頭に付ける。
// 改行が来ないまま延々と届くデータで溜め込まないよう、残りには上限を置く。
const MAX_REST = 4096;

/** @returns {{ lines: string[], rest: string }} */
export function splitLines(buffer, chunk) {
  const parts = (buffer + chunk).split(/\r\n|\r|\n/);
  const rest = parts.pop();
  return { lines: parts, rest: rest.length > MAX_REST ? '' : rest };
}
