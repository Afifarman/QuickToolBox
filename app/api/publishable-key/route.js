import { NextResponse } from 'next/server';
import { generatePublishableKey, validatePublishableKey } from '../../../lib/publishable-key';

export async function POST(request) {
  try {
    let env = 'live';
    try {
      const body = await request.json();
      if (body?.env && ['live', 'test'].includes(body.env)) env = body.env;
    } catch {
      // no body or invalid json → default to live
    }

    // Optional query override: /api/publishable-key?env=test
    const url = new URL(request.url);
    const qEnv = url.searchParams.get('env');
    if (qEnv && ['live', 'test'].includes(qEnv)) env = qEnv;

    const result = generatePublishableKey({ env });

    // In production you'd persist { id, hash, preview, env, createdAt } to DB.
    // The raw `key` is returned once and never stored in plaintext.
    return NextResponse.json(
      {
        ...result,
        usage: {
          envVar: 'NEXT_PUBLIC_QTB_PUBLISHABLE_KEY',
          header: 'x-qtb-publishable-key',
          note: 'This key is publishable and safe for client-side use. Store the hash server-side if you verify it.',
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to generate key' }, { status: 500 });
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || url.searchParams.get('validate');
  if (key) {
    return NextResponse.json({
      key,
      valid: validatePublishableKey(key),
      env: validatePublishableKey(key) ? key.split('_')[1] : null,
    });
  }
  return NextResponse.json({
    message: 'POST to this endpoint to create a new publishable API key.',
    endpoints: {
      'POST /api/publishable-key': '{ env?: "live" | "test" } → { key, id, hash, preview, createdAt }',
      'GET /api/publishable-key?key=qpk_live_...': 'Validate a key',
    },
    example: 'curl -X POST https://your-host/api/publishable-key -H "Content-Type: application/json" -d \'{"env":"live"}\'',
  });
}
