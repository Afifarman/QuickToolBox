import { NextResponse } from 'next/server';
import { AI_SYSTEM_PROMPT, extractModelText, localAI } from '../../../lib/ai';
import { getClientKey, rateLimit } from '../../../lib/security/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PROMPT_LIMIT = 8000;
const PROVIDER_TIMEOUT_MS = 7000;
const GEMINI_TIMEOUT_MS = 5000;

function configuredProviders() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    alibaba: Boolean(process.env.DASHSCOPE_API_KEY),
  };
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

async function fetchJson(url, options, timeoutMs = PROVIDER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    return { response, data };
  } finally {
    clearTimeout(timer);
  }
}

async function openaiCompatibleChat({ key, baseUrl, model, source }, prompt) {
  if (!key) return null;

  const { response, data } = await fetchJson(`${baseUrl.replace(/\\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 900,
      temperature: 0.6,
    }),
  });

  const text = extractModelText(data);
  if (response.ok && text) return { text, source, model };

  const message = String(data?.error?.message || 'Provider returned no usable text')
    .replaceAll(key, '[REDACTED]')
    .slice(0, 240);
  console.error('[AI] Compatible provider request failed:', {
    provider: source,
    model,
    status: response.status,
    message,
  });
  return null;
}

async function geminiChat(prompt) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    console.warn('[AI] Gemini is not configured for this deployment.');
    return null;
  }

  // Current Gemini Flash models first. GEMINI_MODEL can override the first attempt.
  const models = unique([
    process.env.GEMINI_MODEL,
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
  ]);

  for (const model of models) {
    try {
      const { response, data } = await fetchJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 900, temperature: 0.6 },
          }),
        },
        GEMINI_TIMEOUT_MS,
      );

      const text = extractModelText(data);
      if (response.ok && text) {
        console.info('[AI] Gemini request succeeded:', { model });
        return { text, source: 'gemini', model };
      }

      const providerMessage = String(
        data?.error?.message || (text ? 'Unexpected Gemini response' : 'No text returned')
      ).replaceAll(key, '[REDACTED]').slice(0, 300);

      console.error('[AI] Gemini request failed:', {
        model,
        status: response.status,
        message: providerMessage,
      });

      // Authentication, permission, or quota failures will not be fixed by changing models.
      if ([400, 401, 403, 429].includes(response.status)) break;
    } catch (error) {
      const message = String(error?.message || 'Gemini network request failed')
        .replaceAll(key, '[REDACTED]')
        .slice(0, 240);

      console.error('[AI] Gemini request threw an error:', { model, message });
    }
  }

  return null;
}

async function openaiChat(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const models = unique([
    process.env.OPENAI_MODEL,
    'gpt-4o-mini',
    'gpt-4.1-mini',
    'gpt-4o',
    'gpt-5-mini',
  ]);

  for (const model of models) {
    const result = await openaiCompatibleChat({
      key, baseUrl: 'https://api.openai.com/v1', model, source: 'openai',
    }, prompt);
    if (result) return result;
  }
  return null;
}

async function groqChat(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const models = unique([
    process.env.GROQ_MODEL,
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama-3.1-70b-versatile',
  ]);

  for (const model of models) {
    const result = await openaiCompatibleChat({
      key, baseUrl: 'https://api.groq.com/openai/v1', model, source: 'groq',
    }, prompt);
    if (result) return result;
  }
  return null;
}

async function openrouterChat(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  return openaiCompatibleChat({
    key,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    source: 'openrouter',
  }, prompt);
}

async function alibabaChat(prompt) {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) return null;

  const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
  const models = unique([
    process.env.DASHSCOPE_MODEL,
    'qwen-plus',
    'qwen-turbo',
  ]);

  for (const model of models) {
    const result = await openaiCompatibleChat({
      key, baseUrl, model, source: 'alibaba',
    }, prompt);
    if (result) return result;
  }
  return null;
}

export async function GET() {
  const providers = configuredProviders();
  return NextResponse.json({
    ok: true,
    available: Object.values(providers).some(Boolean),
    providers,
    preferredProvider: 'gemini',
  });
}

export async function POST(request) {
  const limit = rateLimit(getClientKey(request, 'ai'), { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many AI requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim();
    if (!prompt) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });

    const clipped = prompt.slice(0, PROMPT_LIMIT);
    // Prefer Gemini first so the configured Gemini API is actually tested and used.
    const runners = [geminiChat, alibabaChat, openaiChat, groqChat, openrouterChat];

    for (const run of runners) {
      try {
        const result = await run(clipped);
        if (result?.text) return NextResponse.json(result);
      } catch (error) {
        console.error('[AI] Provider threw an error:', {
          provider: run.name,
          message: String(error?.message || 'Unknown error').slice(0, 240),
        });
      }
    }

    console.error('[AI] No configured provider returned a response; using local fallback.');
    return NextResponse.json({ text: localAI(clipped), source: 'local' });
  } catch {
    return NextResponse.json({ text: localAI('Give a short helpful answer.'), source: 'local' });
  }
}
