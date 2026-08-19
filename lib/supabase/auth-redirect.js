/**
 * Production Google / email auth must return to a URL that is present on the
 * Supabase Auth Redirect URLs allowlist (Authentication → URL Configuration).
 *
 * Keep this path exact. Do not append query params here — extra query strings
 * fail an exact allowlist entry such as https://<host>/auth/callback.
 * The callback route already defaults `next` to /dashboard.
 */
export const AUTH_CALLBACK_PATH = '/auth/callback';

export const PRODUCTION_SITE_HOSTS = [
  'quick-tool-box-gamma.vercel.app',
  'quick-tool-box-gfr1-armanarif852-2879s-projects.vercel.app',
];

/** URLs that must be listed (or covered by a wildcard) in Supabase Redirect URLs. */
export const SUPABASE_REDIRECT_ALLOWLIST = [
  'http://localhost:3000/auth/callback',
  'http://localhost:3000/reset-password',
  'https://quick-tool-box-gamma.vercel.app/auth/callback',
  'https://quick-tool-box-gamma.vercel.app/reset-password',
  'https://quick-tool-box-gfr1-armanarif852-2879s-projects.vercel.app/auth/callback',
  'https://quick-tool-box-gfr1-armanarif852-2879s-projects.vercel.app/reset-password',
  'https://*-armanarif852-2879s-projects.vercel.app/**',
];

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

/**
 * Origin the browser is actually on. PKCE cookies are host-scoped, so OAuth
 * redirectTo must stay on this origin rather than a different canonical host.
 */
export function getBrowserOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  const fromEnv = stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || '');
  if (fromEnv) {
    return fromEnv.startsWith('http') ? fromEnv : `https://${fromEnv}`;
  }

  return '';
}

/** Exact allowlist-friendly callback URL for signInWithOAuth / signUp. */
export function getAuthCallbackUrl() {
  const origin = getBrowserOrigin();
  if (!origin) return AUTH_CALLBACK_PATH;
  return `${origin}${AUTH_CALLBACK_PATH}`;
}

export function getPasswordResetUrl() {
  const origin = getBrowserOrigin();
  if (!origin) return '/reset-password';
  return `${origin}/reset-password`;
}

export function getRequestOrigin(request) {
  const requestOrigin = new URL(request.url).origin;
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`;
  }

  if (requestOrigin && requestOrigin !== 'null') {
    return requestOrigin;
  }

  const envSite = stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || '');
  if (envSite) {
    return envSite.startsWith('http') ? envSite : `https://${envSite}`;
  }

  return requestOrigin;
}
