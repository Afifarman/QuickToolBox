import { NextResponse } from 'next/server';
import { localAI } from '../../../lib/ai';

async function openaiText(key, prompt) {
  const models = ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o'];
  for (const model of models) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are QuickToolBox AI. Be concise, practical and helpful.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.6
      })
    });
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (response.ok && text) return text;
  }
  return null;
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });

    const key = process.env.OPENAI_API_KEY;
    if (key) {
      try {
        const text = await openaiText(key, prompt);
        if (text) return NextResponse.json({ text, source: 'openai' });
      } catch {}
    }

    return NextResponse.json({ text: localAI(prompt), source: 'local' });
  } catch {
    return NextResponse.json({ text: localAI('Help the user with a practical answer.'), source: 'local' });
  }
}
