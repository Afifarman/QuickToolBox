// Supabase project URL is public configuration. Keep the application pinned to
// the active project so a stale Vercel NEXT_PUBLIC_SUPABASE_URL cannot route
// browser OAuth requests to the retired project.
const ACTIVE_PROJECT_REF = 'cfwjmfaqtsuffemcltyd';
const ACTIVE_SUPABASE_URL = `https://${ACTIVE_PROJECT_REF}.supabase.co`;

function normalizeSupabaseUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  try {
    const url = new URL(raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.origin;
  } catch {
    return '';
  }
}

function projectRefFromUrl(value) {
  try {
    return new URL(value).host.split('.')[0];
  } catch {
    return '';
  }
}

const configuredUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Only accept the environment URL when it belongs to the active project.
// This keeps the app on the project whose anon key and OAuth settings are live.
export const SUPABASE_URL =
  configuredUrl && projectRefFromUrl(configuredUrl) === ACTIVE_PROJECT_REF
    ? configuredUrl
    : ACTIVE_SUPABASE_URL;
