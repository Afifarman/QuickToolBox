import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAST_QWEN_MODEL_ID,
  COMPAT_QWEN_MODEL_ID,
  getQwenModelCandidates,
  isWebGPUShaderError,
} from './local-model-selection.js';

const modelList = [
  { model_id: FAST_QWEN_MODEL_ID },
  { model_id: COMPAT_QWEN_MODEL_ID },
];

test('prefers FP16 when shader-f16 is available and keeps FP32 as fallback', () => {
  assert.deepEqual(getQwenModelCandidates(true, modelList), [FAST_QWEN_MODEL_ID, COMPAT_QWEN_MODEL_ID]);
});

test('uses FP32 compatibility model when shader-f16 is unavailable', () => {
  assert.deepEqual(getQwenModelCandidates(false, modelList), [COMPAT_QWEN_MODEL_ID]);
});

test('does not select models absent from the installed WebLLM catalog', () => {
  assert.deepEqual(getQwenModelCandidates(true, [{ model_id: FAST_QWEN_MODEL_ID }]), [FAST_QWEN_MODEL_ID]);
  assert.deepEqual(getQwenModelCandidates(false, []), []);
});

test('recognizes WebGPU shader compilation errors', () => {
  assert.equal(isWebGPUShaderError(new Error("ShaderModule with '' label is invalid")), true);
  assert.equal(isWebGPUShaderError(new Error('WGSL compilation failed')), true);
  assert.equal(isWebGPUShaderError(new Error('Network request failed')), false);
});
