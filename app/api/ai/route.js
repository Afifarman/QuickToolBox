import { NextResponse } from 'next/server';
import { createGeminiStream, geminiConfigured } from '../../../lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function sseEvent(type, data) {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: 'gemini',
    configured: geminiConfigured(),
    model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    streaming: true,
    urlContext: true,
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    if (!geminiConfigured()) {
      return NextResponse.json(
        { error: 'Gemini is not configured. Add GEMINI_API_KEY to Vercel Environment Variables.' },
        { status: 503 }
      );
    }

    const upstream = await createGeminiStream(prompt);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(sseEvent('status', {
          type: 'provider',
          provider: 'gemini',
          model: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
        })));

        const reader = upstream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.enqueue(encoder.encode(sseEvent('status', { type: 'complete' })));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(sseEvent('error', {
            message: error instanceof Error ? error.message : 'Gemini stream failed.',
          })));
          controller.close();
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to start Gemini.' },
      { status: 502 }
    );
  }
}
