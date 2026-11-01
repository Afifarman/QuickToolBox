/**
 * QuickToolBox has one public canonical origin. Preview deployments must never
 * become canonical URLs, sitemap hosts, or OAuth redirect destinations.
 */
const CANONICAL_SITE_URL = 'https://quicktoolbox-bd.vercel.app';
const DEAD_HOSTS = new Set([
  'quick-tool-box-vercel.app',
  'www.quick-tool-box-vercel.app',
]);

export function normalizeSiteUrl(value) {
  const raw = String(value || '').trim().replace(/\\/+$/, '');
  if (!raw) return '';
  const normalized = raw.startsWith('http://') || raw.startsWith('https://')
    ? raw
    : `https://${raw}`;
  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol) || DEAD_HOSTS.has(parsed.host)) return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

export const SITE_URL = CANONICAL_SITE_URL;
export const SITE_HOST = new URL(SITE_URL).host;

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}
