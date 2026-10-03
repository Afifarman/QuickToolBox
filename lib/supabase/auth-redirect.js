import { SITE_URL } from '../site-config';

export const AUTH_CALLBACK_PATH = '/auth/callback';

function normalizeOrigin(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return SITE_URL;
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
}

export function getBrowserOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL);
}

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
  if (forwardedHost) return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`;
  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || requestUrl.origin);
}
