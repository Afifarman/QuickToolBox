/**
 * Production-safe Supabase OAuth redirect helpers.
 *
 * Google OAuth redirectTo must match a Supabase Redirect URLs allowlist
 * entry exactly — no trailing slash, no extra query string. The callback
 * route handles the PKCE code exchange and writes session cookies.
 *
 * PKCE (Proof Key for Code Exchange) is the default flow with @supabase/ssr.
 * It adds a layer of security by using a cryptographic challenge instead
 * of a client secret, preventing authorisation code interception attacks.
 */

/** Path for the OAuth callback route — must match the file location. */
export const AUTH_CALLBACK_PATH = '/auth/callback';

/** Known production Vercel hostnames (for origin validation). */
export const PRODUCTION_SITE_HOSTS = [
  'quick-tool-box-gamma.vercel.app',
  'quick-tool-box-gfr1-armanarif852-2879s-projects.vercel.app',
];

/**
 * URLs that must be registered in Supabase → Authentication →
 * URL Configuration → Redirect URLs.
 */
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
 * Origin the browser is currently on.
 *
 * On the client this reads window.location.origin so the callback URL
 * always matches the host the user sees, which is critical for PKCE
 * cookie scoping. Falls back to NEXT_PUBLIC_SITE_URL for SSR / build.
 */
export function getBrowserOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    // Never return a non-standard port in production
    if (
      process.env.NODE_ENV === 'production' &&
      origin.includes(':') &&
      !origin.startsWith('http://localhost')
    ) {
      const url = new URL(origin);
      return `${url.protocol}//${url.hostname}`;
    }
    return origin;
  }

  const fromEnv = stripTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL || ''
  );
  if (fromEnv) {
    return fromEnv.startsWith('http') ? fromEnv : `https://${fromEnv}`;
  }

  // Last resort — try to reconstruct from Vercel headers
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return '';
}

/**
 * Exact allowlist-friendly callback URL for signInWithOAuth / signUp.
 *
 * Returns a full URL (e.g. "https://example.com/auth/callback") or a
 * relative path if the origin cannot be determined. Supabase requires
 * the full URL in the allowlist, so the relative fallback will only
 * work on localhost where Supabase allows "*" or has http://localhost
 * entries.
 */
export function getAuthCallbackUrl() {
  const origin = getBrowserOrigin();
  if (!origin) return AUTH_CALLBACK_PATH;
  return `${origin}${AUTH_CALLBACK_PATH}`;
}

/**
 * Full password-reset redirect URL.
 */
export function getPasswordResetUrl() {
  const origin = getBrowserOrigin();
  if (!origin) return '/reset-password';
  return `${origin}/reset-password`;
}

/**
 * OAuth options object to pass to signInWithOAuth.
 *
 * Sets PKCE flow, offline access, and allowlist-safe redirectTo.
 */
export function getOAuthOptions() {
  return {
    redirectTo: getAuthCallbackUrl(),
    queryParams: {
      access_type: 'offline',
      prompt: 'select_account',
    },
    // PKCE is the default for @supabase/ssr, but we assert it explicitly
    // for defence-in-depth.
    flowType: 'pkce',
  };
}

/**
 * Determine the origin for the server-side callback handler.
 *
 * Respects Vercel reverse-proxy headers (x-forwarded-host, x-forwarded-proto)
 * and falls back to the request URL origin or NEXT_PUBLIC_SITE_URL.
 */
export function getRequestOrigin(request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto =
    request.headers.get('x-forwarded-proto') || 'https';

  if (forwardedHost) {
    // x-forwarded-host may contain a comma-separated list; take the first
    const host = forwardedHost.split(',')[0].trim();
    return `${forwardedProto}://${host}`;
  }

  if (requestOrigin && requestOrigin !== 'null') {
    return requestOrigin;
  }

  const envSite = stripTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL || ''
  );
  if (envSite) {
    return envSite.startsWith('http') ? envSite : `https://${envSite}`;
  }

  return requestOrigin;
}

/**
 * Validate that a redirect target is safe (same-origin or relative).
 * Prevents open-redirect vulnerabilities.
 */
export function isSafeRedirect(target, requestOrigin) {
  if (!target) return false;
  if (target.startsWith('/') && !target.startsWith('//')) return true;

  try {
    const targetUrl = new URL(target);
    const allowedOrigin = requestOrigin || getBrowserOrigin();
    if (!allowedOrigin) return false;
    return targetUrl.origin === allowedOrigin;
  } catch {
    return false;
  }
}

/**
 * Safely parse the `next` query param — only allow same-origin paths.
 */
export function safeNextPath(value) {
  return value && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/dashboard';
}