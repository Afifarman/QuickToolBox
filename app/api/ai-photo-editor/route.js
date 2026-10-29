import { NextResponse } from 'next/server';
import { getClientKey, rateLimit } from '../../../lib/security/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request) {
  const limit = rateLimit(getClientKey(request, 'ai-photo-editor'), { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'অনেকবার চেষ্টা করা হয়েছে। ১০ মিনিট পরে আবার চেষ্টা করুন।' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim().slice(0, 2000);
    const mimeType = String(body?.mimeType || '').toLowerCase();
    const imageBase64 = String(body?.imageBase64 || '');
    if (!prompt) return NextResponse.json({ error: 'ছবি সম্পাদনার নির্দেশনা লিখুন।' }, { status: 400 });
    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json({ error: 'শুধু JPG, PNG অথবা WebP ছবি ব্যবহার করুন।' }, { status: 400 });
    }
    if (!imageBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
      return NextResponse.json({ error: 'সঠিক ছবি পাওয়া যায়নি। আবার আপলোড করুন।' }, { status: 400 });
    }
    const estimatedBytes = Math.floor(imageBase64.length * 3 / 4);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'ছবির আকার ৮ MB-এর কম হতে হবে।' }, { status: 413 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI ছবি সম্পাদনার API key সেট করা নেই। Vercel Environment Variables-এ GEMINI_API_KEY যোগ করে redeploy করুন।' }, { status: 503 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);
    let response;
    let result;
    try {
      response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=' + encodeURIComponent(apiKey),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: 'Edit the supplied image according to these instructions. Return the edited image, not just advice or a description. Preserve the subject identity and important details unless the user explicitly requests a change. Instructions: ' + prompt },
                { inline_data: { mime_type: mimeType, data: imageBase64 } },
              ],
            }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        },
      );
      result = await response.json().catch(() => ({}));
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const status = response.status;
      console.error('[AI Photo Editor] Gemini request failed:', status);
      if (status === 400 || status === 404) {
        return NextResponse.json({ error: 'Gemini image model অনুরোধটি গ্রহণ করেনি। API key, model access ও request configuration পরীক্ষা করুন।' }, { status: 502 });
      }
      if (status === 429) {
        return NextResponse.json({ error: 'Gemini API quota শেষ বা rate limit হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।' }, { status: 429 });
      }
      if (status === 401 || status === 403) {
        return NextResponse.json({ error: 'Gemini API key বা permission সমস্যা। Vercel-এর GEMINI_API_KEY ও Google AI Studio access পরীক্ষা করুন।' }, { status: 502 });
      }
      return NextResponse.json({ error: 'AI image service এখন কাজ করছে না। পরে আবার চেষ্টা করুন।' }, { status: 502 });
    }

    const parts = result?.candidates?.flatMap(candidate => candidate?.content?.parts || []) || [];
    const imagePart = parts.find(part => part?.inlineData?.data || part?.inline_data?.data);
    const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
    const returnedMime = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || 'image/png';
    if (!imageData || !returnedMime.startsWith('image/')) {
      return NextResponse.json({ error: 'AI কোনো সম্পাদিত ছবি ফেরত দেয়নি। অন্য নির্দেশনা দিয়ে আবার চেষ্টা করুন।' }, { status: 502 });
    }

    return NextResponse.json({ imageDataUrl: 'data:' + returnedMime + ';base64,' + imageData });
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    console.error('[AI Photo Editor] Request failed:', timedOut ? 'timeout' : (error?.name || 'Error'));
    return NextResponse.json(
      { error: timedOut ? 'AI-তে সময় বেশি লাগছে। ছোট ছবি দিয়ে আবার চেষ্টা করুন।' : 'ছবি সম্পাদনা করা যায়নি। ছবিটি আবার আপলোড করে চেষ্টা করুন।' },
      { status: timedOut ? 504 : 500 },
    );
  }
}
