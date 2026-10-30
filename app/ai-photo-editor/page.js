'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export default function AIPhotoEditor() {
  const canvasRef = useRef(null);
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState('');
  const [editedImage, setEditedImage] = useState('');
  const [prompt, setPrompt] = useState('Remove the background and replace it with a clean, professional studio background. Keep the person natural.');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!src || !canvasRef.current) return;
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { setImageError('এই ব্রাউজারে Canvas চালু করা যায়নি।'); return; }
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImageError('');
    };
    img.onerror = () => { if (!cancelled) setImageError('ছবিটি preview করা যায়নি।'); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src, brightness, contrast, saturation, blur]);

  useEffect(() => () => { if (src.startsWith('blob:')) URL.revokeObjectURL(src); }, [src]);

  function upload(event) {
    const next = event.target.files?.[0];
    setError('');
    setEditedImage('');
    setImageError('');
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) {
      setError('শুধু JPG, PNG অথবা WebP ছবি আপলোড করুন।'); event.target.value = ''; return;
    }
    if (next.size > MAX_IMAGE_BYTES) {
      setError('ছবির আকার ৮ MB-এর মধ্যে রাখুন।'); event.target.value = ''; return;
    }
    setFile(next);
    setSrc(URL.createObjectURL(next));
    setBrightness(100); setContrast(100); setSaturation(100); setBlur(0);
  }

  async function runAIEdit() {
    if (!file) { setError('AI edit করার আগে একটি ছবি আপলোড করুন।'); return; }
    if (!prompt.trim()) { setError('কী পরিবর্তন করতে চান লিখুন।'); return; }
    setBusy(true); setError(''); setEditedImage('');
    try {
      const body = new FormData();
      body.append('image', file);
      body.append('prompt', prompt.trim());
      const response = await fetch('/api/ai/photo-edit', { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.image !== 'string' || !data.image.startsWith('data:image/')) {
        throw new Error(data.error || 'AI সম্পাদিত ছবি ফেরত দিতে পারেনি।');
      }
      setEditedImage(data.image);
    } catch (err) {
      setError(err?.message || 'AI image editing-এ সংযোগ করা যায়নি। আবার চেষ্টা করুন।');
    } finally { setBusy(false); }
  }

  function downloadCanvas() {
    const canvas = canvasRef.current;
    if (!canvas?.width) { setImageError('আগে ছবি আপলোড করুন।'); return; }
    const link = document.createElement('a');
    link.download = 'quicktoolbox-basic-edit.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function downloadAI() {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.download = 'quicktoolbox-ai-edited.png';
    link.href = editedImage;
    link.click();
  }

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/ai">AI Assistant</Link><Link href="/ai-prompts">AI Prompts</Link><Link href="/">← All tools</Link></nav>
      </header>
      <main className="ai-page ai-page-photo-editor">
        <small>🖼️ QUICKTOOLBOX PHOTO STUDIO</small>
        <h1>AI Photo Editor</h1>
        <p>এক জায়গায় আসল AI image editing এবং দ্রুত Basic photo editing করুন। JPG, PNG বা WebP — সর্বোচ্চ ৮ MB।</p>

        <section className="result">
          <h2>১. ছবি আপলোড করুন</h2>
          <input aria-label="Upload photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} />
          {src && <p>ছবি প্রস্তুত: {file?.name}</p>}
          {error && <p role="alert" style={{ color: '#b42318', whiteSpace: 'pre-wrap' }}>{error}</p>}
          {imageError && <p role="alert" style={{ color: '#b42318' }}>{imageError}</p>}
        </section>

        <section className="result">
          <h2>২. AI দিয়ে ছবিটি পরিবর্তন করুন</h2>
          <p>উদাহরণ: “ব্যাকগ্রাউন্ড সরিয়ে সাদা করো”, “ছবির আলো ঠিক করো”, “পেছনের অপ্রয়োজনীয় বস্তু সরাও”।</p>
          <textarea rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="কীভাবে ছবিটি edit করতে চান লিখুন…" />
          <div className="ai-actions">
            <button className="btn" type="button" onClick={runAIEdit} disabled={busy || !file || !prompt.trim()}>{busy ? 'AI ছবি সম্পাদনা করছে…' : '✨ AI দিয়ে Edit করুন'}</button>
            <button className="btn light" type="button" onClick={downloadAI} disabled={!editedImage}>AI ছবি Download</button>
          </div>
          {busy && <p role="status">ছবি AI-তে পাঠানো হচ্ছে। কিছুক্ষণ অপেক্ষা করুন…</p>}
          {editedImage && <div style={{ marginTop: 18 }}>
            <h3>AI Edited Result</h3>
            <img src={editedImage} alt="AI edited result" style={{ display: 'block', width: '100%', maxWidth: 800, borderRadius: 16 }} />
            <button className="btn" type="button" onClick={downloadAI}>Download edited image</button>
          </div>}
        </section>

        {src && <section className="result">
          <h2>৩. Basic Photo Editing</h2>
          <p>এই নিয়ন্ত্রণগুলো সরাসরি browser-এ চলে।</p>
          <div style={{ display: 'grid', gap: 12, maxWidth: 700 }}>
            <label>Brightness: {brightness}% <input aria-label="Brightness" type="range" min="50" max="160" value={brightness} onChange={e => setBrightness(Number(e.target.value))} /></label>
            <label>Contrast: {contrast}% <input aria-label="Contrast" type="range" min="50" max="160" value={contrast} onChange={e => setContrast(Number(e.target.value))} /></label>
            <label>Saturation: {saturation}% <input aria-label="Saturation" type="range" min="0" max="180" value={saturation} onChange={e => setSaturation(Number(e.target.value))} /></label>
            <label>Blur: {blur}px <input aria-label="Blur" type="range" min="0" max="4" step="0.5" value={blur} onChange={e => setBlur(Number(e.target.value))} /></label>
          </div>
          <canvas ref={canvasRef} aria-label="Basic photo edit preview" style={{ width: '100%', maxWidth: 900, marginTop: 20, borderRadius: 16, background: '#eee' }} />
          <div className="ai-actions"><button className="btn" type="button" onClick={downloadCanvas}>Download Basic Edit</button></div>
        </section>}
        <p style={{ color: '#667085', fontSize: 13 }}>Privacy: AI edit করার সময় ছবিটি Gemini image-editing API-তে পাঠানো হয়। Basic slider edit আপনার browser-এই হয়। API key server-side-এ থাকে।</p>
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}
