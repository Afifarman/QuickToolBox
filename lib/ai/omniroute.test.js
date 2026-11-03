import test from 'node:test';
import assert from 'node:assert/strict';
import { clampOutputTokens, getOmniRouteConfig } from './omniroute.js';

const keys = ['OMNIROUTE_API_KEY', 'OMNIROUTE_BASE_URL', 'OMNIROUTE_MODEL'];

function withEnv(values, callback) {
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  try { callback(); }
  finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test('OmniRoute remains disabled unless URL, server key and explicit model are configured', () => {
  withEnv({ OMNIROUTE_API_KEY: 'secret', OMNIROUTE_BASE_URL: 'https://gateway.example', OMNIROUTE_MODEL: '' }, () => {
    assert.equal(getOmniRouteConfig(), null);
  });
});

test('normalizes an OmniRoute origin to the OpenAI-compatible v1 endpoint', () => {
  withEnv({
    OMNIROUTE_API_KEY: 'server-secret',
    OMNIROUTE_BASE_URL: 'https://gateway.example/',
    OMNIROUTE_MODEL: 'provider/free-model',
  }, () => {
    assert.deepEqual(getOmniRouteConfig(), {
      apiKey: 'server-secret',
      baseUrl: 'https://gateway.example/v1',
      model: 'provider/free-model',
    });
  });
});

test('does not append a duplicate v1 path', () => {
  withEnv({
    OMNIROUTE_API_KEY: 'server-secret',
    OMNIROUTE_BASE_URL: 'https://gateway.example/v1',
    OMNIROUTE_MODEL: 'provider/free-model',
  }, () => {
    assert.equal(getOmniRouteConfig().baseUrl, 'https://gateway.example/v1');
  });
});

test('clamps configurable output tokens to the supported safe range', () => {
  assert.equal(clampOutputTokens(2048), 2048);
  assert.equal(clampOutputTokens(99999), 4096);
  assert.equal(clampOutputTokens(1), 128);
  assert.equal(clampOutputTokens('not-a-number'), 2048);
});
