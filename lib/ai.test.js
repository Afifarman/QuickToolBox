import test from 'node:test';
import assert from 'node:assert/strict';
import { extractModelText } from './ai.js';
import { classifyProviderError, logProviderFailure } from './ai/provider-diagnostics.js';

test('extractModelText reads OpenAI-compatible chat completions', () => {
  assert.equal(extractModelText({ choices: [{ message: { content: 'Hello from Groq' } }] }), 'Hello from Groq');
});

test('extractModelText joins text content arrays', () => {
  assert.equal(extractModelText({ choices: [{ message: { content: [{ text: 'Hello ' }, { text: 'world' }] } }] }), 'Hello world');
});

test('extractModelText reads Gemini candidate parts', () => {
  assert.equal(extractModelText({ candidates: [{ content: { parts: [{ text: 'Gemini reply' }] } }] }), 'Gemini reply');
});

test('extractModelText reads output_text responses', () => {
  assert.equal(extractModelText({ output_text: 'Response API reply' }), 'Response API reply');
});

test('extractModelText returns empty text for unusable provider payloads', () => {
  assert.equal(extractModelText(null), '');
  assert.equal(extractModelText({ choices: [{ message: { content: '' } }] }), '');
  assert.equal(extractModelText({ candidates: [{ content: { parts: [] } }] }), '');
});

test('provider error classification distinguishes model, quota and auth failures', () => {
  assert.equal(classifyProviderError({ status: 404 }), 'model_not_found');
  assert.equal(classifyProviderError({ status: 429 }), 'rate_limit');
  assert.equal(classifyProviderError({ status: 401 }), 'authentication');
  assert.equal(classifyProviderError({ status: 403 }), 'permission');
});

test('provider error classification identifies timeouts and network errors', () => {
  assert.equal(classifyProviderError({ timedOut: true }), 'timeout');
  assert.equal(classifyProviderError({ error: new TypeError('fetch failed') }), 'network');
  assert.equal(classifyProviderError({ status: 503 }), 'provider_server_error');
});

test('provider diagnostics logs only a sanitized model identifier and safe metadata', () => {
  const original = console.error;
  let logged;
  console.error = (...args) => { logged = args; };
  try {
    logProviderFailure('gemini', { status: 404, category: 'model_not_found', model: 'models/gemini-2.5-flash' });
  } finally {
    console.error = original;
  }
  assert.equal(logged[0], '[QuickToolBox AI provider failure]');
  assert.deepEqual(logged[1], {
    provider: 'gemini',
    model: 'models/gemini-2.5-flash',
    status: 404,
    category: 'model_not_found',
  });
  assert.equal(JSON.stringify(logged).includes('API_KEY'), false);
});
