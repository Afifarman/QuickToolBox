/**
 * Auth callback helpers. Production should use NEXT_PUBLIC_SITE_URL while
 * Vercel previews can use NEXT_PUBLIC_VERCEL_URL automatically.
 */
export const AUTH_CALLBACK_PATH = '/auth/callback';

export const PRODUCTION_SITE_HOSTS = [
  'quick-tool-box-gamma.vercel.app',
  'quick-tool-box-gfr1-armanarif852-2879s-projects.vercel.app',
];

export const SUPABASE_REDIRECT_ALLOWLIST = [
  'http://localhost:3000/**',
  'https://quick-tool-box-gamma.vercel.app/auth/callback',
  'https://quick-tool-box-gamma.vercel.app/reset-password',
  'https://quick-tool-box-gfr1-armanarif852-2879s-projects.vercel.app/auth/callback',
  'https://quick-tool-box-gfr1-armanarif852-2879s-projects.vercel.app/reset-password',
  'https://*-armanarif852-2879s-projects.vercel.app/**',
];

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function normalizeOrigin(value) {
  const raw = stripTrailingSlash(value);
  if (!raw) return '';
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
}

/** Origin the browser is actually on. */
export function getBrowserOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return normalizeOrigin(
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    ''
  );
}

/** Exact callback URL for signInWithOAuth / signUp. */
export function getAuthCallbackUrl() {
  const origin = getBrowserOrigin();
  return origin ? `${origin}${AUTH_CALLBACK_PATH}` : AUTH_CALLBACK_PATH;
}

export function getPasswordResetUrl() {
  const origin = getBrowserOrigin();
  return origin ? `${origin}/reset-password` : '/reset-password';
}

export function getRequestOrigin(request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`;
  }

  const envSite = normalizeOrigin(
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    ''
  );

  if (envSite) return envSite;
  return requestUrl.origin;
}
