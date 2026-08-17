import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'AI is not configured yet. Add OPENAI_API_KEY in Vercel Environment Variables.' }, { status: 503 });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-5-mini', input: prompt, max_output_tokens: 800 })
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || 'AI request failed.' }, { status: response.status });

    const text = data.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n') || 'No response generated.';
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: 'Unable to process the AI request.' }, { status: 500 });
  }
}
