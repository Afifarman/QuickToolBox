import { NextResponse } from 'next/server';
import { getClientKey, rateLimit } from '../../../../lib/security/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request) {
  const limit = rateLimit(getClientKey(request, 'ai-photo-edit'), { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'অনেকবার চেষ্টা করা হয়েছে। ১০ মিনিট পরে আবার চেষ্টা করুন।' }, {
      status: 429, headers: { 'Retry-After': String(limit.retryAfter) },
    });
  }

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return NextResponse.json({ error: 'AI image editing চালু নেই: Vercel Environment Variables-এ GEMINI_API_KEY সেট করুন।' }, { status: 503 });

  try {
    const form = await request.formData();
    const file = form.get('image');
    const prompt = String(form.get('prompt') || '').trim().slice(0, 1500);
    if (!(file instanceof File)) return NextResponse.json({ error: 'আগে একটি ছবি আপলোড করুন।' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'শুধু JPG, PNG অথবা WebP ছবি ব্যবহার করুন।' }, { status: 415 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'ছবির আকার ৮ MB-এর মধ্যে রাখুন।' }, { status: 413 });
    if (!prompt) return NextResponse.json({ error: 'কী পরিবর্তন করতে চান তা লিখুন।' }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50000);
    let response;
    let data;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key.trim() },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [
            { text: `Edit the supplied image according to this instruction: ${prompt}. Return the edited image, preserving unrelated details and the original subject identity. Do not return only text.` },
            { inlineData: { mimeType: file.type, data: bytes.toString('base64') } },
          ] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      });
      data = await response.json().catch(() => ({}));
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const status = response.status;
      const providerMessage = String(data?.error?.message || '').slice(0, 350);
      console.warn('[QuickToolBox photo edit] Gemini request failed:', status);
      const message = status === 429
        ? 'Gemini API quota শেষ বা request limit হয়েছে। Google AI Studio-তে billing/quota দেখুন।'
        : status === 403 || status === 401
          ? 'Gemini API key অনুমোদিত নয়। Vercel-এর GEMINI_API_KEY এবং API access যাচাই করুন।'
          : status === 404
            ? 'Image editing model পাওয়া যায়নি। GEMINI_IMAGE_MODEL সেটিংস যাচাই করুন।'
            : 'AI image editing ব্যর্থ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
      return NextResponse.json({ error: message, providerStatus: status, detail: providerMessage }, { status: status === 429 ? 429 : 502 });
    }

    const parts = data?.candidates?.flatMap(candidate => candidate?.content?.parts || []) || [];
    const imagePart = parts.find(part => part?.inlineData?.data && String(part.inlineData.mimeType || '').startsWith('image/'));
    if (!imagePart) {
      return NextResponse.json({ error: 'AI কোনো সম্পাদিত ছবি ফেরত দেয়নি। অন্য নির্দেশনা দিয়ে চেষ্টা করুন।' }, { status: 502 });
    }

    return NextResponse.json({
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      source: 'gemini',
      model,
    });
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    console.error('[QuickToolBox photo edit] Request error:', timedOut ? 'timeout' : error?.name || 'unknown');
    return NextResponse.json({
      error: timedOut ? 'AI image editing সময়সীমা অতিক্রম করেছে। ছোট ছবি দিয়ে আবার চেষ্টা করুন।' : 'ছবি সম্পাদনার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।',
    }, { status: 500 });
  }
}
