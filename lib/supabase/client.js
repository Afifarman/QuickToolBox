import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase credentials are present, so pages can degrade gracefully. */
export function isSupabaseConfigured() {
  return Boolean(url && key);
}

export const AUTH_NOT_CONFIGURED =
  'Accounts are not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your Vercel Environment Variables to enable login. All tools work without an account.';

/**
 * Returns a Supabase browser client, or null when the project has no
 * credentials. Callers must handle null instead of crashing the page.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(url, key);
}
