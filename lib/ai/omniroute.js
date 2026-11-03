/**
 * Server-only OmniRoute client.
 * Requires an explicitly configured model ID so "auto" cannot silently route
 * to a billable provider. Keep gateway credentials in server environment only.
 */
export function getOmniRouteConfig() {
  const apiKey = String(process.env.OMNIROUTE_API_KEY || '').trim();
  const rawBaseUrl = String(process.env.OMNIROUTE_BASE_URL || '').trim().replace(/\/+$/, '');
  const model = String(process.env.OMNIROUTE_MODEL || '').trim();
  if (!apiKey || !rawBaseUrl || !model) return null;

  // Accept either an origin or an already versioned OpenAI-compatible endpoint.
  const baseUrl = /\/v1$/i.test(rawBaseUrl) ? rawBaseUrl : `${rawBaseUrl}/v1`;
  return { apiKey, baseUrl, model };
}

export async function requestOmniRouteChat({
  messages,
  tools,
  toolChoice,
  maxTokens,
  temperature = 0.5,
}) {
  const config = getOmniRouteConfig();
  if (!config) return null;
  const requestedTokens = Number(maxTokens || process.env.OMNIROUTE_MAX_OUTPUT_TOKENS || 1600);
  const safeMaxTokens = Math.max(128, Math.min(4096, Math.floor(requestedTokens)));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: safeMaxTokens,
        temperature,
        ...(Array.isArray(tools) && tools.length ? { tools, tool_choice: toolChoice || 'auto' } : {}),
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(
        response.status === 429
          ? 'OmniRoute provider quota or rate limit reached.'
          : response.status === 401 || response.status === 403
            ? 'OmniRoute gateway authentication failed.'
            : 'OmniRoute gateway could not complete the request.',
      );
      error.status = response.status;
      throw error;
    }
    return { data, model: config.model };
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeout = new Error('OmniRoute request timed out.');
      timeout.status = 504;
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
