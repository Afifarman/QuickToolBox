/**
 * Safe AI provider diagnostics.
 *
 * Log only provider name, HTTP status, and a coarse error category.
 * Never pass prompts, API keys, authorization headers, or raw provider bodies here.
 */

const SAFE_CATEGORIES = new Set([
  'authentication',
  'permission',
  'rate_limit',
  'model_not_found',
  'invalid_request',
  'provider_server_error',
  'timeout',
  'network',
  'invalid_response',
  'unknown',
]);

export function classifyProviderError({ status, error, timedOut = false } = {}) {
  if (timedOut || error?.name === 'AbortError') return 'timeout';

  if (typeof status === 'number') {
    if (status === 401) return 'authentication';
    if (status === 403) return 'permission';
    if (status === 404) return 'model_not_found';
    if (status === 429) return 'rate_limit';
    if (status === 400 || status === 422) return 'invalid_request';
    if (status >= 500) return 'provider_server_error';
    if (status >= 400) return 'invalid_request';
  }

  if (error instanceof TypeError || error?.name === 'TypeError') return 'network';
  return 'unknown';
}

export function logProviderFailure(provider, details = {}) {
  const category = SAFE_CATEGORIES.has(details.category)
    ? details.category
    : classifyProviderError(details);

  const safeStatus = Number.isInteger(details.status) ? details.status : undefined;

  // Intentionally do not log error.message, response bodies, prompts, or credentials.
  console.error('[QuickToolBox AI provider failure]', {
    provider: String(provider || 'unknown').slice(0, 40),
    ...(safeStatus === undefined ? {} : { status: safeStatus }),
    category,
  });
}
