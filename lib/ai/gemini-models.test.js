import test from 'node:test';
import assert from 'node:assert/strict';
import { selectGeminiModels } from './gemini-models.js';

const model = (name, methods = ['generateContent']) => ({
  name: `models/${name}`,
  supportedGenerationMethods: methods,
});

test('prefers configured stable Flash model when it is actually advertised', () => {
  const result = selectGeminiModels([
    model('gemini-2.0-flash-preview'),
    model('gemini-2.5-flash'),
    model('gemini-2.0-flash'),
  ], 'models/gemini-2.0-flash');
  assert.deepEqual(result, ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-preview']);
});

test('excludes non-generation, non-Flash, and unrelated model families', () => {
  const result = selectGeminiModels([
    model('gemini-2.5-pro'),
    model('gemini-2.5-flash', ['embedContent']),
    model('gemini-2.5-flash-image'),
    model('gemini-2.5-flash'),
  ]);
  assert.deepEqual(result, ['gemini-2.5-flash']);
});

test('returns no models when provider advertises no eligible Flash model', () => {
  assert.deepEqual(selectGeminiModels([model('gemini-2.5-pro')]), []);
});

test('caps model attempts at five', () => {
  const models = Array.from({ length: 8 }, (_, index) => model(`gemini-${index + 1}.0-flash`));
  assert.equal(selectGeminiModels(models).length, 5);
});
