import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocalAIErrorMessage } from './local-ai-errors.js';

test('explains WebGPU shader compilation failures in Bengali', () => {
  assert.match(getLocalAIErrorMessage(new Error("ShaderModule with '' label is invalid")), /GPU shader/);
});

test('explains GPU memory failures', () => {
  assert.match(getLocalAIErrorMessage('Out of memory allocating buffer'), /GPU memory/);
});

test('explains model download failures', () => {
  assert.match(getLocalAIErrorMessage('Network fetch failed'), /download/);
});

test('preserves unknown provider error details', () => {
  assert.equal(getLocalAIErrorMessage('Unknown runtime failure'), 'Unknown runtime failure');
});
