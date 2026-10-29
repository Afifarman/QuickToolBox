import { createBrowserClient } from '@supabase/ssr';

const EXPECTED_SUPABASE_URL = 'https://cfwjmfaqtsuffemcltyd.supabase.co';

export function createClient() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  // Pin the browser client to the intended project so a stale build-time
  // NEXT_PUBLIC_SUPABASE_URL cannot send Google OAuth to the retired project.
  const url = configuredUrl === EXPECTED_SUPABASE_URL ? configuredUrl : EXPECTED_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  }

  return createBrowserClient(url, key);
}
