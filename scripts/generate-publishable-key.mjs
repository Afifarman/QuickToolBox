#!/usr/bin/env node
// Generate a new publishable API key for QuickToolBox
// Usage:
//   node scripts/generate-publishable-key.mjs              -> live key (default)
//   node scripts/generate-publishable-key.mjs --env=test   -> test key
//   node scripts/generate-publishable-key.mjs --env=live --json -> json output
//   node scripts/generate-publishable-key.mjs --update-env       -> append to .env.local

import { randomBytes, createHash } from 'crypto';
import { writeFileSync, existsSync, readFileSync, appendFileSync } from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const pref = `--${name}=`;
  const hit = args.find((a) => a.startsWith(pref));
  return hit ? hit.slice(pref.length) : def;
};
const hasFlag = (name) => args.includes(`--${name}`);

const env = getArg('env', 'live');
if (!['live', 'test'].includes(env)) {
  console.error('Invalid --env. Use live or test');
  process.exit(1);
}
const bytes = parseInt(getArg('bytes', '32'), 10);
const asJson = hasFlag('json');
const updateEnv = hasFlag('update-env');
const prefix = 'qpk';
const randomPart = randomBytes(bytes).toString('base64url');
const key = `${prefix}_${env}_${randomPart}`;
const id = `qtb_${randomBytes(4).toString('hex')}`;
const hash = createHash('sha256').update(key).digest('hex');
const preview = `${key.slice(0, 12)}...${key.slice(-4)}`;
const createdAt = new Date().toISOString();

const result = { key, id, env, prefix: `${prefix}_${env}_`, hash, preview, createdAt };

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('\n✓ New publishable API key generated\n');
  console.log(`  Key:       ${key}`);
  console.log(`  ID:        ${id}`);
  console.log(`  Env:       ${env}`);
  console.log(`  Preview:   ${preview}`);
  console.log(`  Hash (sha256): ${hash}`);
  console.log(`  Created:   ${createdAt}`);
  console.log('\n  This is a PUBLISHABLE key — safe to expose client-side (NEXT_PUBLIC_).');
  console.log('  Store the hash server-side if you need to verify it later.\n');
  console.log('  Add to env:');
  console.log(`    NEXT_PUBLIC_QTB_PUBLISHABLE_KEY=${key}\n`);
  console.log('  Supabase publishable key? See: https://supabase.com/dashboard/project/_/settings/api');
  console.log('  Then set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel.\n');
}

if (updateEnv) {
  const envPath = path.join(process.cwd(), '.env.local');
  const line = `NEXT_PUBLIC_QTB_PUBLISHABLE_KEY=${key}\n`;
  if (existsSync(envPath) && readFileSync(envPath, 'utf8').includes('NEXT_PUBLIC_QTB_PUBLISHABLE_KEY')) {
    console.log(`⚠ .env.local already contains NEXT_PUBLIC_QTB_PUBLISHABLE_KEY — not overwriting.`);
    console.log(`  New key: ${key}`);
  } else {
    appendFileSync(envPath, (existsSync(envPath) && !readFileSync(envPath, 'utf8').endsWith('\n') ? '\n' : '') + line);
    console.log(`✓ Appended to ${envPath}`);
  }
  // Also save a non-env record for reference (gitignored)
  const recordPath = path.join(process.cwd(), '.publishable-key.json');
  writeFileSync(recordPath, JSON.stringify(result, null, 2));
  console.log(`✓ Saved metadata to ${recordPath} (add to .gitignore if needed)`);
}
