import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSample, splitLines } from './plotter-parse.js';

const values = (line) => parseSample(line)?.map(s => s.value) ?? null;
const labels = (line) => parseSample(line)?.map(s => s.label) ?? null;

test('数値の行はカンマ・空白・タブで区切られ、CH1 から順に系列になる', () => {
  assert.deepEqual(parseSample('12'), [{ label: 'CH1', value: 12 }]);
  assert.deepEqual(values('12, 34 56'), [12, 34, 56]);
  assert.deepEqual(labels('12, 34 56'), ['CH1', 'CH2', 'CH3']);
  assert.deepEqual(values('12\t34\t56'), [12, 34, 56]);
  assert.deepEqual(values('  7 , 8  '), [7, 8]);
  assert.deepEqual(values('-1.5,2.,0.25'), [-1.5, 2, 0.25]);
  assert.deepEqual(values('1e3 -2E-2'), [1000, -0.02]);
  assert.deepEqual(values('0'), [0]);
  // 行頭が数字でも、あとに数値でないものが混ざれば行ごと捨てる。
  assert.equal(parseSample('12, abc'), null);
  assert.equal(parseSample('1 2 3 hello'), null);
});

test('label:value の行はラベルがそのまま系列名になる', () => {
  assert.deepEqual(parseSample('temp:25.5'), [{ label: 'temp', value: 25.5 }]);
  assert.deepEqual(labels('temp:25.5 hum:40'), ['temp', 'hum']);
  assert.deepEqual(values('temp:25.5 hum:40'), [25.5, 40]);
  assert.deepEqual(values('temp:-3,hum:+4'), [-3, 4]);
  assert.deepEqual(values('a:1\tb:2'), [1, 2]);
  assert.deepEqual(labels('温度:25 湿度:40'), ['温度', '湿度']);
  // 値が数値でないもの、ラベルだけのものは行ごと捨てる。
  assert.equal(parseSample('temp:'), null);
  assert.equal(parseSample('temp:abc'), null);
  assert.equal(parseSample('temp'), null);
  assert.equal(parseSample('a:1:2'), null);
});

test('2つの形の混在、空行、文章は読まない', () => {
  assert.equal(parseSample('temp:25.5 30'), null); // label:value と裸の数値の混在
  assert.equal(parseSample('30 temp:25.5'), null); // 行頭が数値でも同じ
  assert.equal(parseSample(''), null);
  assert.equal(parseSample('   '), null);
  assert.equal(parseSample('\t'), null);
  assert.equal(parseSample('hello'), null);
  assert.equal(parseSample('Serial ready.'), null);
  assert.equal(parseSample('.5'), null); // 行頭が -?数字 ではない
  assert.equal(parseSample('NaN'), null);
  assert.equal(parseSample('-'), null);
});

test('同じ数値の行を繰り返しても同じ結果になる（状態を持たない）', () => {
  const line = '1, 2, 3';
  assert.deepEqual(parseSample(line), parseSample(line));
});

test('行の途中で切れたチャンクは次のチャンクの頭に付く', () => {
  assert.deepEqual(splitLines('', '1,2\n3,4\n'), { lines: ['1,2', '3,4'], rest: '' });
  assert.deepEqual(splitLines('', '1,2\n3,'), { lines: ['1,2'], rest: '3,' });
  assert.deepEqual(splitLines('3,', '4\n'), { lines: ['3,4'], rest: '' });
  assert.deepEqual(splitLines('', 'a\r\nb\rc\nd'), { lines: ['a', 'b', 'c'], rest: 'd' });
  assert.deepEqual(splitLines('', 'no newline'), { lines: [], rest: 'no newline' });
  // 改行の来ないデータで溜め込まない。
  assert.deepEqual(splitLines('', 'x'.repeat(5000)), { lines: [], rest: '' });
});
