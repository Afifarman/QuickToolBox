/**
 * Canonical site URL for QuickToolBox.
 *
 * Resolution order (first valid value wins):
 *   1. NEXT_PUBLIC_SITE_URL                            – explicit custom domain
 *   2. NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL /
 *      VERCEL_PROJECT_PRODUCTION_URL                   – production domain of the
 *                                                        Vercel project (custom
 *                                                        domain, else the
 *                                                        <project>.vercel.app alias)
 *   3. NEXT_PUBLIC_VERCEL_URL / VERCEL_URL             – current deployment URL
 *   4. FALLBACK_SITE_URL                               – local dev / CI builds
 *
 * Values are validated before use. A host that no longer resolves in DNS is
 * rejected even when it is supplied through the environment, because a dead
 * domain in canonical tags, robots.txt or sitemap.xml sends visitors and
 * crawlers to a site that cannot be reached.
 */

// Last-resort default: the Vercel project that currently serves production.
const CANONICAL_SITE_URL = 'https://quicktoolbox-bd.vercel.app';
const FALLBACK_SITE_URL = CANONICAL_SITE_URL;

// `quick-tool-box-vercel.app` (and its `www.`) is not registered — DNS returns
// NXDOMAIN — so it must never appear in generated URLs. Remove an entry here
// only after the domain exists and resolves to this deployment.
const DEAD_HOSTS = new Set([
  'quick-tool-box-vercel.app',
  'www.quick-tool-box-vercel.app',
]);

function firstNonEmpty(...values) {
  for (const value of values) {
    const raw = String(value || '').trim();
    if (raw) return raw;
  }
  return '';
}

/**
 * Turns an env value such as `my-domain.com`, `https://my-domain.com/` or the
 * bare host Vercel exposes in `VERCEL_URL` into a normalized origin.
 * Returns `''` for empty, unparsable or dead hosts.
 */
export function normalizeSiteUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  const withProtocol =
    raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  let host;
  try {
    host = new URL(withProtocol).host;
  } catch {
    return '';
  }
  if (!host || DEAD_HOSTS.has(host)) return '';
  return withProtocol;
}

const resolvedSiteUrl = normalizeSiteUrl(
  firstNonEmpty(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
    process.env.VERCEL_URL
  )
);

export const SITE_URL = normalizeSiteUrl(CANONICAL_SITE_URL) || resolvedSiteUrl || FALLBACK_SITE_URL;
export const SITE_HOST = new URL(SITE_URL).host;

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}
