import { SITE_URL, normalizeSiteUrl } from '../site-config';

export const AUTH_CALLBACK_PATH = '/auth/callback';

export function getBrowserOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return SITE_URL;
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
  return normalizeSiteUrl(requestUrl.origin) || SITE_URL;
}
