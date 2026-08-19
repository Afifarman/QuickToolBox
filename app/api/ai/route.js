import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/** Pull plain text out of either the Responses API or Chat Completions shape. */
function extractText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();

  const fromResponses = (data?.output || [])
    .flatMap((item) => item?.content || [])
    .filter((c) => c?.type === 'output_text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('\n')
    .trim();
  if (fromResponses) return fromResponses;

  const fromChat = data?.choices?.[0]?.message?.content;
  if (typeof fromChat === 'string' && fromChat.trim()) return fromChat.trim();

  return '';
}

async function callOpenAI(key, prompt) {
  // Try the Responses API first, fall back to Chat Completions for older keys/models.
  const attempts = [
    {
      url: 'https://api.openai.com/v1/responses',
      body: { model: MODEL, input: prompt, max_output_tokens: 900 },
    },
    {
      url: 'https://api.openai.com/v1/chat/completions',
      body: {
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are QuickToolBox AI, a concise and helpful writing assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 900,
      },
    },
  ];

  let lastError = 'AI request failed.';
  let lastStatus = 502;

  for (const attempt of attempts) {
    let response;
    try {
      response = await fetch(attempt.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(attempt.body),
      });
    } catch {
      lastError = 'Could not reach the AI provider.';
      continue;
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const text = extractText(data);
      if (text) return { ok: true, text };
      lastError = 'The AI returned an empty response. Try rephrasing your prompt.';
      lastStatus = 502;
      continue;
    }

    lastStatus = response.status;
    lastError = data?.error?.message || `AI request failed (${response.status}).`;

    // Auth / quota problems will not be fixed by trying the other endpoint.
    if (response.status === 401 || response.status === 403 || response.status === 429) break;
  }

  return { ok: false, error: lastError, status: lastStatus };
}

export async function POST(request) {
  let prompt;
  try {
    ({ prompt } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }
  if (prompt.length > 8000) {
    return NextResponse.json({ error: 'Prompt is too long (max 8000 characters).' }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          'AI is not configured yet. Add an OPENAI_API_KEY in your Vercel project settings (Settings → Environment Variables), then redeploy. Every other tool on the site works without it.',
        configured: false,
      },
      { status: 503 }
    );
  }

  try {
    const result = await callOpenAI(key, prompt.trim());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ text: result.text });
  } catch {
    return NextResponse.json({ error: 'Unable to process the AI request.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.OPENAI_API_KEY), model: MODEL });
}
