'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export default function AIPhotoEditor() {
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState('');
  const [editedSrc, setEditedSrc] = useState('');
  const [prompt, setPrompt] = useState('Make this photo brighter, sharper and more professional while keeping the person and clothes natural.');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!src || !canvasRef.current) return undefined;
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { setError('এই ব্রাউজারে ছবি সম্পাদনা চালু করা যায়নি।'); return; }
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.onerror = () => { if (!cancelled) setError('ছবিটি খোলা যায়নি। অন্য ছবি নির্বাচন করুন।'); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src, brightness, contrast, saturation, blur]);

  useEffect(() => () => { if (src.startsWith('blob:')) URL.revokeObjectURL(src); }, [src]);

  function upload(event) {
    const selected = event.target.files?.[0];
    setError(''); setNotice(''); setEditedSrc('');
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('শুধু JPG, PNG অথবা WebP ছবি ব্যবহার করুন।'); event.target.value = ''; return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setError('Vercel API request সীমার মধ্যে রাখতে ছবিটি ৩ MB-এর মধ্যে রাখুন।'); event.target.value = ''; return;
    }
    setFile(selected);
    setSrc(URL.createObjectURL(selected));
    setBrightness(100); setContrast(100); setSaturation(100); setBlur(0);
  }

  async function editWithAI() {
    if (!file || !prompt.trim()) return;
    setBusy(true); setError(''); setNotice('ছবি ও নির্দেশনা AI image model-এ পাঠানো হচ্ছে…'); setEditedSrc('');
    try {
      const image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(new Error('ছবি পড়া যায়নি। আবার আপলোড করুন।'));
        reader.readAsDataURL(file);
      });
      const response = await fetch('/api/ai/photo-edit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mimeType: file.type, prompt: prompt.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.image || !data.mimeType) throw new Error(data.error || 'AI সম্পাদিত ছবি ফেরত দেয়নি।');
      setEditedSrc(`data:${data.mimeType};base64,${data.image}`);
      setNotice(`AI দিয়ে ছবি সম্পাদিত হয়েছে • ${data.model || 'Gemini'}`);
    } catch (err) {
      setError(err?.message || 'AI ছবি সম্পাদনা ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      setNotice('');
    } finally { setBusy(false); }
  }

  function download(url, name) {
    if (!url) return;
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  }

  return <>
    <header>
      <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
      <nav><Link href="/ai">AI Assistant</Link><Link href="/ai-prompts">AI Prompts</Link><Link href="/">← All tools</Link></nav>
    </header>
    <main className="ai-page ai-page-photo-editor">
      <small>🖼️ AI PHOTO EDITOR</small>
      <h1>AI Photo Editor</h1>
      <p>ছবি আপলোড করুন, কী পরিবর্তন চান লিখুন—AI ছবির ডেটাসহ নির্দেশনা পাবে এবং সম্পাদিত ছবি ফেরত দেওয়ার চেষ্টা করবে। এটি শুধু টেক্সট নির্দেশনা তৈরি করার টুল নয়।</p>
      <section className="result">
        <label htmlFor="photo-upload"><b>ছবি নির্বাচন করুন (সর্বোচ্চ ৩ MB)</b></label>
        <input ref={fileRef} id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} />
        <label htmlFor="photo-prompt"><b>কীভাবে এডিট করতে চান?</b></label>
        <textarea id="photo-prompt" rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="যেমন: ব্যাকগ্রাউন্ড পরিষ্কার করো, আলো বাড়াও…" />
        <div className="ai-actions">
          <button className="btn" type="button" onClick={editWithAI} disabled={busy || !file || !prompt.trim()}>{busy ? 'AI ছবি এডিট করছে…' : '✨ Edit image with AI'}</button>
          <button className="btn light" type="button" onClick={() => download(editedSrc, 'quicktoolbox-ai-edited.png')} disabled={!editedSrc}>Download AI Image</button>
        </div>
        {notice && <p role="status" style={{color:'#067647',whiteSpace:'pre-wrap'}}>{notice}</p>}
        {error && <p role="alert" style={{color:'#b42318',whiteSpace:'pre-wrap'}}>{error}</p>}
        <p style={{color:'#667085',fontSize:13}}>Privacy: নির্বাচিত ছবিটি AI সম্পাদনার জন্য Google Gemini API-তে পাঠানো হবে। সংবেদনশীল ছবি আপলোড করবেন না।</p>
      </section>
      {src && <section className="result">
        <h2>Original / local adjustments</h2>
        <div style={{display:'grid',gap:12,maxWidth:700}}>
          <label>Brightness: {brightness}% <input aria-label="Brightness" type="range" min="50" max="160" value={brightness} onChange={e=>setBrightness(Number(e.target.value))} /></label>
          <label>Contrast: {contrast}% <input aria-label="Contrast" type="range" min="50" max="160" value={contrast} onChange={e=>setContrast(Number(e.target.value))} /></label>
          <label>Saturation: {saturation}% <input aria-label="Saturation" type="range" min="0" max="180" value={saturation} onChange={e=>setSaturation(Number(e.target.value))} /></label>
          <label>Blur: {blur}px <input aria-label="Blur" type="range" min="0" max="4" step="0.5" value={blur} onChange={e=>setBlur(Number(e.target.value))} /></label>
        </div>
        <canvas ref={canvasRef} aria-label="Original photo preview" style={{width:'100%',maxWidth:900,marginTop:20,borderRadius:16,background:'#eee'}} />
        <button className="btn light" type="button" onClick={() => download(canvasRef.current?.toDataURL('image/png'), 'quicktoolbox-local-edit.png')}>Download local edit</button>
      </section>}
      {editedSrc && <section className="result">
        <h2>AI edited result</h2>
        <img src={editedSrc} alt="AI edited result" style={{width:'100%',maxWidth:900,borderRadius:16}} />
        <button className="btn" type="button" onClick={() => download(editedSrc, 'quicktoolbox-ai-edited.png')}>Download edited image</button>
      </section>}
    </main>
    <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
  </>;
}
