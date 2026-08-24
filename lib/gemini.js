const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse';
const DEFAULT_MODEL = 'gemini-3.7-flash';
const REQUEST_TIMEOUT_MS = 45_000;

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

export function geminiConfigured() {
  return Boolean(getApiKey());
}

export async function createGeminiStream(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini is not configured. Add GEMINI_API_KEY to the server environment.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        input: prompt.slice(0, 12_000),
        tools: [{ type: 'url_context' }],
        generation_config: {
          temperature: 0.7,
          max_output_tokens: 2_000,
          top_p: 0.95,
          thinking_level: process.env.GEMINI_THINKING_LEVEL || 'high',
        },
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Gemini API ${response.status}: ${message.slice(0, 800)}`);
    }

    if (!response.body) throw new Error('Gemini returned an empty stream.');
    return response.body;
  } finally {
    clearTimeout(timeout);
  }
}
