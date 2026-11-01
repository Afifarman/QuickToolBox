import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMathExpression } from './evaluate-expression.js';

test('evaluates arithmetic with conventional precedence', () => {
  assert.equal(evaluateMathExpression('2 + 3 * 4'), 14);
  assert.equal(evaluateMathExpression('(2 + 3) * 4'), 20);
  assert.equal(evaluateMathExpression('2^3^2'), 512);
  assert.equal(evaluateMathExpression('-2^2'), -4);
});
test('supports scientific functions and constants', () => {
  assert.equal(evaluateMathExpression('sqrt(81)'), 9);
  assert.equal(evaluateMathExpression('sin(pi/2)'), 1);
  assert.equal(evaluateMathExpression('abs(-7)'), 7);
});
test('rejects code injection and invalid arithmetic', () => {
  assert.throws(() => evaluateMathExpression('globalThis.process.exit()'));
  assert.throws(() => evaluateMathExpression('1/0'));
  assert.throws(() => evaluateMathExpression('sqrt(-1)'));
  assert.throws(() => evaluateMathExpression('2 ** 3'));
});
