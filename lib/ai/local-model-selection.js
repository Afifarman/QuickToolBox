export const FAST_QWEN_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
export const COMPAT_QWEN_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';

export function getQwenModelCandidates(hasShaderF16, modelList = []) {
  const available = new Set(modelList.map((record) => record?.model_id).filter(Boolean));
  const preferred = hasShaderF16
    ? [FAST_QWEN_MODEL_ID, COMPAT_QWEN_MODEL_ID]
    : [COMPAT_QWEN_MODEL_ID];
  return preferred.filter((modelId) => available.has(modelId));
}

export function isWebGPUShaderError(cause) {
  const message = String(cause?.message || cause || '');
  return /shader|wgsl|ShaderModule|pipeline/i.test(message);
}
