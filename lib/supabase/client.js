import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL } from './config';

export function createClient() {
  const url = SUPABASE_URL;
  // Prefer the verified legacy anon key: its JWT project ref matches SUPABASE_URL.
  // The configured publishable key may be stale or belong to another Supabase project.
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).');
  }

  return createBrowserClient(url, key);
}
