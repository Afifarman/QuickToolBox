import { NextResponse } from 'next/server';
import { inspectRepository } from '../../../lib/auto-fix/github';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonEvent(type, data) {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

function pathsForProblem(problem) {
  const text = problem.toLowerCase();
  const paths = ['package.json'];
  if (text.includes('build') || text.includes('module') || text.includes('import')) {
    paths.push('app/api/auto-fix/route.js');
  }
  if (text.includes('login') || text.includes('oauth') || text.includes('auth')) {
    paths.push('app/login/page.js', 'lib/supabase/client.js');
  }
  return [...new Set(paths)].slice(0, 4);
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured on the server.' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const problem = String(body?.problem || '').trim();
    if (!problem) return NextResponse.json({ error: 'problem is required' }, { status: 400 });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(jsonEvent('status', { message: 'AI diagnosis started' })));

          const inspections = [];
          for (const path of pathsForProblem(problem)) {
            const result = await inspectRepository(path);
            inspections.push({
              path,
              ok: result.ok,
              type: result.type,
              status: result.status,
              content: typeof result.content === 'string' ? result.content.slice(0, 12000) : undefined,
              entries: result.entries,
            });
            controller.enqueue(encoder.encode(jsonEvent('tool', {
              message: `Inspected ${path}`,
              output: { path, ok: result.ok, type: result.type, status: result.status },
            })));
          }

          const prompt = [
            'You are the QuickToolBox Auto-Fix diagnosis assistant.',
            'Diagnose the bug using the repository inspection results below.',
            'Do not claim a fix is verified unless a build or test has actually passed.',
            'Never expose secrets, modify main, or deploy production.',
            'Recommend the smallest safe repair and name files that should change.',
            '',
            `Problem:\n${problem}`,
            '',
            `Repository inspection:\n${JSON.stringify(inspections, null, 2)}`,
          ].join('\n');

          const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: process.env.AUTO_FIX_MODEL || 'gpt-5-mini',
              input: prompt,
              stream: true,
              max_output_tokens: 2000,
            }),
          });

          if (!response.ok || !response.body) {
            const message = await response.text();
            throw new Error(`OpenAI request failed: ${response.status} ${message.slice(0, 500)}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let textSeen = false;

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const raw = line.slice(6).trim();
              if (!raw || raw === '[DONE]') continue;
              try {
                const event = JSON.parse(raw);
                if (event.type === 'response.output_text.delta' && event.delta) {
                  textSeen = true;
                  controller.enqueue(encoder.encode(jsonEvent('delta', { delta: event.delta })));
                }
              } catch {
                // Ignore incomplete/non-JSON provider frames.
              }
            }
          }

          controller.enqueue(encoder.encode(jsonEvent('done', {
            toolSeen: inspections.length > 0,
            textSeen,
          })));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(jsonEvent('error', {
            message: error?.message || 'Auto-fix request failed',
          })));
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
    return NextResponse.json(
      { error: error?.message || 'Auto-fix request failed' },
      { status: 500 },
    );
  }
}
