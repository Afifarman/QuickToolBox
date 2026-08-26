import { NextResponse } from 'next/server';
import { run } from '@openai/agents';
import { createAutoFixAgent } from '@/lib/auto-fix/agent';
import { inspectRepository } from '@/lib/auto-fix/github';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonEvent(type, data) {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured on the server.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const problem = String(body?.problem || '').trim();
    if (!problem) {
      return NextResponse.json({ error: 'problem is required' }, { status: 400 });
    }

    const agent = createAutoFixAgent({ inspectRepository });
    const stream = await run(agent, problem, { stream: true, maxTurns: 8 });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(jsonEvent('status', { message: 'AI diagnosis started' })));
          let toolSeen = false;
          let textSeen = false;

          for await (const event of stream) {
            if (event.type === 'run_item_stream_event') {
              const item = event.item;
              if (item?.type === 'tool_call_item' || item?.type === 'tool_call_output_item') {
                toolSeen = true;
                controller.enqueue(encoder.encode(jsonEvent('tool', { message: 'Repository inspection tool executed' })));
              }
            }

            if (event.type === 'raw_model_stream_event' && event.data?.event?.type === 'response.output_text.delta') {
              const delta = event.data.event.delta || '';
              if (delta) {
                textSeen = true;
                controller.enqueue(encoder.encode(jsonEvent('delta', { delta })));
              }
            }
          }

          await stream.completed;
          controller.enqueue(encoder.encode(jsonEvent('done', {
            toolSeen,
            textSeen,
            output: stream.finalOutput,
          })));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(jsonEvent('error', { message: error?.message || 'Agent stream failed' })));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Auto-fix request failed' }, { status: 500 });
  }
}
