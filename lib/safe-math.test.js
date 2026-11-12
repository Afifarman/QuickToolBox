import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSafeMath } from './safe-math.js';

test('evaluates basic arithmetic and parentheses', () => {
  assert.equal(evaluateSafeMath('(2 + 3) * 4'), 20);
});
test('evaluates powers and unary operators', () => {
  assert.equal(evaluateSafeMath('2^3 + -2'), 6);
});
test('supports approved scientific functions and constants', () => {
  assert.equal(evaluateSafeMath('sqrt(81) + sin(0)'), 9);
  assert.ok(Math.abs(evaluateSafeMath('pi * 2') - Math.PI * 2) < 1e-12);
});
test('rejects identifiers and JavaScript execution attempts', () => {
  assert.throws(() => evaluateSafeMath('globalThis.process.exit()'));
  assert.throws(() => evaluateSafeMath('alert(1)'));
});
test('rejects malformed and non-finite expressions', () => {
  assert.throws(() => evaluateSafeMath('2 +'));
  assert.throws(() => evaluateSafeMath('1 / 0'));
});
