import { NextResponse } from 'next/server';
import { AI_SYSTEM_PROMPT, extractModelText, localAI } from '../../../lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PROMPT_LIMIT = 8000;
const PROVIDER_TIMEOUT_MS = 12000;

function configuredProviders() {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
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
    const { response, data } = await fetchJson('https://api.openai.com/v1/chat/completions', {
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
    if (response.ok && text) return { text, source: 'openai', model };
  }

  const { response, data } = await fetchJson('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: `${AI_SYSTEM_PROMPT}\n\n${prompt}`,
      max_output_tokens: 900,
    }),
  });
  const text = extractModelText(data);
  if (response.ok && text) return { text, source: 'openai', model: process.env.OPENAI_MODEL || 'gpt-4o-mini' };
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
    const { response, data } = await fetchJson('https://api.groq.com/openai/v1/chat/completions', {
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
    if (response.ok && text) return { text, source: 'groq', model };
  }
  return null;
}

async function geminiChat(prompt) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;

  const models = unique([
    process.env.GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest',
  ]);

  for (const model of models) {
    const { response, data } = await fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${AI_SYSTEM_PROMPT}\n\n${prompt}` }] }],
          generationConfig: { maxOutputTokens: 900, temperature: 0.6 },
        }),
      }
    );
    const text = extractModelText(data);
    if (response.ok && text) return { text, source: 'gemini', model };
  }
  return null;
}

async function openrouterChat(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const { response, data } = await fetchJson('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://quick-tool-box-gamma.vercel.app',
      'X-Title': 'QuickToolBox',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 900,
    }),
  });
  const text = extractModelText(data);
  if (response.ok && text) return { text, source: 'openrouter', model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini' };
  return null;
}

export async function GET() {
  return NextResponse.json({ ok: true, providers: configuredProviders() });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim();
    if (!prompt) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });

    const clipped = prompt.slice(0, PROMPT_LIMIT);
    const runners = [openaiChat, groqChat, geminiChat, openrouterChat];

    for (const run of runners) {
      try {
        const result = await run(clipped);
        if (result?.text) return NextResponse.json(result);
      } catch {
        // Try the next provider. The local fallback always answers.
      }
    }

    return NextResponse.json({ text: localAI(clipped), source: 'local' });
  } catch {
    return NextResponse.json({ text: localAI('Give a short helpful answer.'), source: 'local' });
  }
}
