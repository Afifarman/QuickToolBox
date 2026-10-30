import { NextResponse } from 'next/server';
import { AI_SYSTEM_PROMPT, extractModelText } from '../../../lib/ai';
import { getClientKey, rateLimit } from '../../../lib/security/rate-limit';
import { classifyProviderError, logProviderFailure as logSafeProviderFailure } from '../../../lib/ai/provider-diagnostics';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PROMPT_LIMIT = 8000;
const PROVIDER_TIMEOUT_MS = 20000;

function configuredProviders() {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
  };
}

// Emit only provider name, HTTP status, and a coarse category. Never log prompts,
// credentials, headers, raw provider messages, or response bodies.
function logProviderFailure(provider, details = {}) {
  const error = details.error || (details.errorName ? { name: details.errorName } : undefined);
  const timedOut = details.timedOut === true || details.errorName === 'AbortError' || /timeout|timed out|abort/i.test(String(details.errorMessage || ''));
  logSafeProviderFailure(provider, {
    status: details.status,
    category: classifyProviderError({ status: details.status, error, timedOut }),
  });
}

function errorDetails(error) {
  return {
    errorName: error?.name || 'Error',
    errorMessage: String(error?.message || 'Unknown provider error').slice(0, 200),
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

  const { response, data } = await fetchJson(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
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

  logProviderFailure(source, {
    model,
    status: response.status,
    errorMessage: typeof data?.error?.message === 'string'
      ? data.error.message.slice(0, 200)
      : (text ? 'Provider returned an unexpected response format' : 'Provider returned no usable text'),
  });
  return null;
}

async function openaiChat(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const models = unique([process.env.OPENAI_MODEL, 'gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o', 'gpt-5-mini']);
  for (const model of models) {
    const result = await openaiCompatibleChat({ key, baseUrl: 'https://api.openai.com/v1', model, source: 'openai' }, prompt);
    if (result) return result;
  }
  return null;
}

async function groqChat(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const models = unique([process.env.GROQ_MODEL, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.1-70b-versatile']);
  for (const model of models) {
    const result = await openaiCompatibleChat({ key, baseUrl: 'https://api.groq.com/openai/v1', model, source: 'groq' }, prompt);
    if (result) return result;
  }
  return null;
}

async function geminiChat(prompt) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  // Discover models available to this exact API key instead of assuming a
  // hard-coded model is enabled for every Google AI project.
  let availableModels = [];
  try {
    const { response: listResponse, data: listData } = await fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000`,
      { method: 'GET', headers: { 'x-goog-api-key': key.trim() } },
      8000,
    );
    if (listResponse.ok && Array.isArray(listData.models)) {
      availableModels = listData.models
        .filter(item => Array.isArray(item.supportedGenerationMethods) && item.supportedGenerationMethods.includes('generateContent'))
        .map(item => String(item.name || '').replace(/^models\//, ''))
        .filter(name => /flash/i.test(name) && !/audio|image|tts|embedding|robotics|computer-use|live/i.test(name));
    } else {
      logProviderFailure('gemini-model-list', { status: listResponse.status });
    }
  } catch (error) {
    logProviderFailure('gemini-model-list', errorDetails(error));
  }

  const models = unique([
    process.env.GEMINI_MODEL,
    ...availableModels.filter(name => /flash/i.test(name) && /latest|stable|2\.5|2\.0|3\./i.test(name)),
    ...availableModels,
  ]).slice(0, 4);

  if (!models.length) {
    console.warn('[QuickToolBox AI] Gemini API key could not list any generateContent Flash models.');
    return null;
  }

  for (const model of models) {
    const { response, data } = await fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key.trim(),
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${AI_SYSTEM_PROMPT}\n\n${prompt}` }] }],
          generationConfig: { maxOutputTokens: 900, temperature: 0.6 },
        }),
      }
    );
    const text = extractModelText(data);
    if (response.ok && text) return { text, source: 'gemini', model };

    logProviderFailure('gemini', {
      model,
      status: response.status,
      errorMessage: typeof data?.error?.message === 'string'
        ? data.error.message.slice(0, 200)
        : (text ? 'Provider returned an unexpected response format' : 'Provider returned no usable text'),
    });

    // Retry another model only for likely model-specific configuration errors.
    // On overload, quota errors, or server errors, move to the next provider.
    if (response.status === 429 || response.status >= 500) return null;
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

export async function GET() {
  return NextResponse.json({ ok: true, available: Object.values(configuredProviders()).some(Boolean) });
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
    // Prefer OpenAI, then fall back to Gemini. Optional providers remain
    // available after these two if their keys are configured.
    const runners = [
      ['openai', openaiChat],
      ['gemini', geminiChat],
      ['groq', groqChat],
      ['openrouter', openrouterChat],
    ];
    const providerFailures = [];

    for (const [provider, run] of runners) {
      try {
        const result = await run(clipped);
        if (result?.text) return NextResponse.json(result);
      } catch (error) {
        const details = errorDetails(error);
        logProviderFailure(provider, details);
        providerFailures.push({ provider, reason: /abort|timeout/i.test(`${details.errorName} ${details.errorMessage}`) ? 'timeout' : 'request_failed' });
      }
    }

    const available = Object.entries(configuredProviders()).filter(([, configured]) => configured).map(([provider]) => provider);
    console.warn('[QuickToolBox AI] No configured provider returned a usable response.', { configuredProviders: available, failures: providerFailures });
    const failureHint = providerFailures.some(item => item.reason === 'timeout')
      ? 'An AI provider timed out. Please retry shortly.'
      : 'AI providers rejected the request or are unavailable. Verify the key, model access, and quota in the provider dashboard.';
    return NextResponse.json(
      { error: available.length ? failureHint : 'No AI provider is configured. Add a valid provider API key in Vercel Environment Variables.' },
      { status: available.length ? 502 : 503 },
    );
  } catch (error) {
    logProviderFailure('request', errorDetails(error));
    return NextResponse.json({ error: 'The AI request could not be completed. Please try again later.' }, { status: 500 });
  }
}
