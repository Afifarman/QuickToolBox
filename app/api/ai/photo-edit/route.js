import { NextResponse } from 'next/server';
import { getClientKey, rateLimit } from '../../../../lib/security/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
// Current Gemini image-editing model first; legacy image model is a compatibility fallback.
const MODELS = [process.env.GEMINI_IMAGE_MODEL, 'gemini-3.1-flash-image', 'gemini-2.5-flash-image'].filter(Boolean);

export async function POST(request) {
  const limit = rateLimit(getClientKey(request, 'ai-photo-edit'), { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) return NextResponse.json({ error: 'অনেক বেশি ছবি এডিটের অনুরোধ হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন।' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });

  try {
    const body = await request.json().catch(() => ({}));
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) return NextResponse.json({ error: 'AI Image Editing চালু নেই: Vercel-এ GEMINI_API_KEY সেট করুন।' }, { status: 503 });
    const mimeType = String(body?.mimeType || '');
    const image = String(body?.image || '');
    const prompt = String(body?.prompt || '').trim().slice(0, 1200);
    if (!/^image\/(png|jpeg|webp)$/.test(mimeType)) return NextResponse.json({ error: 'শুধু JPG, PNG অথবা WebP ছবি ব্যবহার করুন।' }, { status: 400 });
    if (!image || !/^[A-Za-z0-9+/]+=*$/.test(image)) return NextResponse.json({ error: 'ছবির ডেটা পাওয়া যায়নি। আবার আপলোড করুন।' }, { status: 400 });
    if (Math.floor(image.length * 3 / 4) > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'ছবিটি ৮ MB-এর মধ্যে রাখুন।' }, { status: 413 });
    if (!prompt) return NextResponse.json({ error: 'কী পরিবর্তন চান তা লিখুন।' }, { status: 400 });

    const contents = [{ role: 'user', parts: [
      { inlineData: { mimeType, data: image } },
      { text: `Edit the provided image according to this instruction: ${prompt}. Return the edited image, not just advice. Preserve the original subject identity and important details unless explicitly asked otherwise. Make a conservative natural edit when ambiguous.` },
    ] }];
    let lastStatus = 502;
    for (const model of MODELS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      let response;
      let data;
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key.trim() },
          body: JSON.stringify({ contents, generationConfig: { responseModalities: ['TEXT', 'IMAGE'], temperature: 0.4 } }),
          signal: controller.signal,
        });
        data = await response.json().catch(() => ({}));
      } catch (error) {
        if (error?.name === 'AbortError') return NextResponse.json({ error: 'ছবি এডিট করতে সময় বেশি লাগছে। ছোট ছবি দিয়ে আবার চেষ্টা করুন।' }, { status: 504 });
        return NextResponse.json({ error: 'Gemini Image API-তে সংযোগ করা যায়নি। পরে আবার চেষ্টা করুন।' }, { status: 502 });
      } finally { clearTimeout(timer); }

      if (response.ok) {
        const parts = data?.candidates?.flatMap(candidate => candidate?.content?.parts || []) || [];
        const edited = parts.find(part => part?.inlineData?.data && /^image\//.test(part.inlineData.mimeType || ''));
        if (edited) return NextResponse.json({ ok: true, image: edited.inlineData.data, mimeType: edited.inlineData.mimeType, model, text: parts.filter(part => part.text).map(part => part.text).join('\n').slice(0, 500) });
        return NextResponse.json({ error: 'AI উত্তর দিয়েছে, কিন্তু সম্পাদিত ছবি ফেরত দেয়নি। এই API Key বা Model-এ image generation অনুমোদিত কি না যাচাই করুন।' }, { status: 502 });
      }
      lastStatus = response.status;
      if (response.status !== 404 && response.status !== 400) break;
    }
    const status = lastStatus === 429 ? 429 : lastStatus === 401 || lastStatus === 403 ? 403 : 502;
    const error = status === 429 ? 'Gemini API quota শেষ বা rate limit হয়েছে। Provider quota বাড়িয়ে আবার চেষ্টা করুন।' : status === 403 ? 'Gemini API Key-তে image model ব্যবহারের অনুমতি নেই।' : 'Gemini image model পাওয়া যায়নি বা অনুরোধ গ্রহণ করেনি। AI Studio-তে image-generation model access ও quota যাচাই করুন।';
    console.warn('[QuickToolBox Photo Edit] Provider failed', { status: lastStatus });
    return NextResponse.json({ error }, { status });
  } catch {
    return NextResponse.json({ error: 'ছবি এডিটের অনুরোধ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 });
  }
}
