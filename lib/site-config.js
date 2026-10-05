const DEFAULT_SITE_URL = 'https://www.quick-tool-box-vercel.app';

function normalizeSiteUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return DEFAULT_SITE_URL;
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_HOST = new URL(SITE_URL).host;

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}
