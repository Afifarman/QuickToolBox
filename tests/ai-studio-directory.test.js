import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/AiPlatformHub.js', import.meta.url), 'utf8');

test('AI Studio lists all nine requested third-party services', () => {
  for (const name of ['Nano Banana', 'Consensus', 'Hedra', 'Cursor', 'Stable Diffusion', 'PhotoRoom', 'Hailuo AI', 'Publer', 'Udio']) {
    assert.ok(component.includes(name), `Missing AI service: ${name}`);
  }
});

test('AI Studio provides direct links to official services in safe new tabs', () => {
  assert.match(component, /href={tool\.url} target="_blank" rel="noopener noreferrer"/);
  for (const url of ['https://gemini.google.com/', 'https://consensus.app/', 'https://www.hedra.com/', 'https://cursor.com/', 'https://github.com/CompVis/stable-diffusion', 'https://www.photoroom.com/', 'https://hailuoai.video/', 'https://publer.com/', 'https://www.udio.com/']) {
    assert.ok(component.includes(url), `Missing official destination: ${url}`);
  }
});

test('AI Studio exposes existing QuickToolBox workspaces without claiming third-party API integration', () => {
  for (const route of ['/ai', '/ai/local', '/ai-photo-editor']) assert.ok(component.includes(route));
  assert.match(component, /No verified free image API tier/);
  assert.match(component, /not automatically mean a free API/);
});

test('AI Studio supports search, category filtering and saved items', () => {
  assert.match(component, /setQuery/);
  assert.match(component, /setCategory/);
  assert.match(component, /qtb_ai_studio_saved/);
  assert.match(component, /setShowSaved/);
});
