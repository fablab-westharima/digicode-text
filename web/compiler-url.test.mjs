import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBase, getCompilerBase, compilerUrl } from './compiler-url.js';

// node には localStorage も esbuild の __COMPILER_BASE__ も無い。このファイルが動くこと自体が、
// 保存値も build 時定数も無い場面で壊れないことの確認になっている。

test('空は「同じオリジン」の意味で通す', () => {
  assert.equal(normalizeBase(''), '');
  assert.equal(normalizeBase('   '), '');
  assert.equal(normalizeBase(undefined), '');
  assert.equal(normalizeBase(null), '');
});

test('末尾の / を落とし、前後の空白を取る', () => {
  assert.equal(normalizeBase('https://example.com'), 'https://example.com');
  assert.equal(normalizeBase('https://example.com/'), 'https://example.com');
  assert.equal(normalizeBase('https://example.com///'), 'https://example.com');
  assert.equal(normalizeBase('  https://example.com/  '), 'https://example.com');
  assert.equal(normalizeBase('http://127.0.0.1:3100/'), 'http://127.0.0.1:3100');
  // path を持つ URL も指せる（リバースプロキシの下に置いた場合）。
  assert.equal(normalizeBase('https://example.com/compiler/'), 'https://example.com/compiler');
  // うしろに '/boards' を継ぐ使い方に入らない ? 以降・# 以降は捨てる。
  assert.equal(normalizeBase('https://example.com/?a=1'), 'https://example.com');
  assert.equal(normalizeBase('https://example.com/compiler#top'), 'https://example.com/compiler');
});

test('http(s) 以外と、URL として読めないものは拒否する', () => {
  for (const bad of ['example.com', '/compile', 'ftp://example.com', 'javascript:alert(1)',
    'file:///etc/passwd', 'ws://example.com', 'https://', 'データ']) {
    assert.throws(() => normalizeBase(bad), Error, bad);
  }
});

test('保存値も build 時定数も無ければ同一オリジン', () => {
  assert.equal(getCompilerBase(), '');
  assert.equal(compilerUrl('/boards'), '/boards');
  assert.equal(compilerUrl('/compile'), '/compile');
});
