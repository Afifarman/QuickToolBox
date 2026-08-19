import { randomBytes, createHash } from 'crypto';

/**
 * QuickToolBox Publishable API Key utilities
 *
 * Format: qpk_<env>_<base64url 43 chars>
 *   env: live | test
 *   example: qpk_live_Sos0V8jZHkkgw3ruh6tvIjhzJn_7s3dbCxQFzmHHIMY
 *
 * Also supports Supabase-style sb_publishable_ prefix for compatibility.
 * The raw key is publishable (safe to expose client-side). The hash is
 * what you'd store server-side if you need to verify it later.
 */

const PREFIX = 'qpk';
const ENVIRONMENTS = ['live', 'test'];

function base64UrlRandom(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function generatePublishableKey({ env = 'live', bytes = 32 } = {}) {
  if (!ENVIRONMENTS.includes(env)) {
    throw new Error(`Invalid env "${env}". Use: ${ENVIRONMENTS.join(', ')}`);
  }
  const randomPart = base64UrlRandom(bytes);
  const key = `${PREFIX}_${env}_${randomPart}`;
  const id = `qtb_${randomBytes(4).toString('hex')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const preview = `${key.slice(0, 12)}...${key.slice(-4)}`;
  const createdAt = new Date().toISOString();
  return {
    key,
    id,
    env,
    prefix: `${PREFIX}_${env}_`,
    hash,
    preview,
    createdAt,
  };
}

export function validatePublishableKey(key) {
  if (typeof key !== 'string') return false;
  // qpk_live_43chars or qpk_test_43chars
  return /^qpk_(live|test)_[A-Za-z0-9_-]{43}$/.test(key.trim());
}

export function getKeyEnv(key) {
  if (!validatePublishableKey(key)) return null;
  return key.split('_')[1]; // live or test
}

export function hashKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

// Supabase helpers: the repo already supports NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// This just documents the new Supabase key format.
export const SUPABASE_KEY_HELP = {
  dashboardUrl: (projectRef) =>
    projectRef
      ? `https://supabase.com/dashboard/project/${projectRef}/settings/api`
      : 'https://supabase.com/dashboard/project/_/settings/api',
  instructions: [
    '1. Open Supabase Dashboard → your Project → Settings → API → API Keys',
    '2. Under "Publishable key" click "Create new publishable key" or "Reveal"',
    '3. Copy the key that starts with sb_publishable_',
    '4. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<that key> in Vercel → Environment Variables (Production + Preview)',
    '5. Keep NEXT_PUBLIC_SUPABASE_URL unchanged. Redeploy.',
  ],
};
