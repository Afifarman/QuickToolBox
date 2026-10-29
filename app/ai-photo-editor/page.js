'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export default function AIPhotoEditor() {
  const canvasRef = useRef(null);
  const [src, setSrc] = useState('');
  const [prompt, setPrompt] = useState('Make this photo brighter, sharper and more professional while keeping the person and clothes natural.');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [aiTip, setAiTip] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!src || !canvasRef.current) return undefined;
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setImageError('এই ব্রাউজারে ছবি সম্পাদনার canvas চালু করা যায়নি। অন্য ব্রাউজারে চেষ্টা করুন।');
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImageError('');
    };
    img.onerror = () => {
      if (!cancelled) setImageError('ছবিটি খোলা যায়নি। অন্য JPG, PNG বা WebP ছবি নির্বাচন করুন।');
    };
    img.src = src;
    return () => { cancelled = true; };
  }, [src, brightness, contrast, saturation, blur]);

  useEffect(() => () => {
    if (src.startsWith('blob:')) URL.revokeObjectURL(src);
  }, [src]);

  function upload(e) {
    const file = e.target.files?.[0];
    setAiTip('');
    setAiError('');
    setImageError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('একটি image ফাইল নির্বাচন করুন।');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('ছবির আকার ১০ MB-এর মধ্যে রাখুন।');
      e.target.value = '';
      return;
    }
    setSrc(URL.createObjectURL(file));
  }

  async function improvePrompt() {
    setAiBusy(true);
    setAiTip('');
    setAiError('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Turn this photo editing request into a precise, safe image-editing instruction. Request: ${prompt}` })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.text !== 'string' || !data.text.trim()) {
        throw new Error(data.error || 'AI পরিষেবা এখন নির্দেশনা তৈরি করতে পারেনি। কিছুক্ষণ পরে আবার চেষ্টা করুন।');
      }
      setAiTip(data.text.trim());
    } catch (error) {
      setAiError(error?.message || 'AI পরিষেবায় সংযোগ করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setAiBusy(false);
    }
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !src || !canvas.width || !canvas.height) {
      setImageError('ডাউনলোডের আগে একটি ছবি আপলোড করে এডিটর তৈরি হতে দিন।');
      return;
    }
    try {
      const a = document.createElement('a');
      a.download = 'quicktoolbox-photo-edit.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch {
      setImageError('ছবিটি ডাউনলোড করা যায়নি। আবার আপলোড করে চেষ্টা করুন।');
    }
  }

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/ai">AI Assistant</Link><Link href="/ai-prompts">AI Prompts</Link><Link href="/">← All tools</Link></nav>
      </header>
      <main className="ai-page">
        <small>🖼️ PHOTO EDITOR</small>
        <h1>Photo Editor + AI Instructions</h1>
        <p>Upload a photo, adjust it in your browser, and ask AI for editing instructions. Note: AI instructions do not directly change the image pixels; the sliders below perform basic browser-based edits.</p>
        <section className="result">
          <label htmlFor="photo-upload"><b>Choose a photo (max 10 MB)</b></label>
          <input id="photo-upload" type="file" accept="image/*" onChange={upload} />
          <label htmlFor="photo-prompt"><b>Describe the edit you want</b></label>
          <textarea id="photo-prompt" rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe how you want to edit the photo…" />
          <div className="ai-actions">
            <button className="btn" type="button" onClick={improvePrompt} disabled={aiBusy || !prompt.trim()}>{aiBusy ? 'Generating…' : '✨ Get AI Instructions'}</button>
            <button className="btn light" type="button" onClick={download} disabled={!src}>Download PNG</button>
          </div>
          {aiError && <p role="alert" style={{marginTop:16,color:'#b42318',whiteSpace:'pre-wrap'}}>{aiError}</p>}
          {aiTip && <div className="result" style={{marginTop:16,whiteSpace:'pre-wrap'}}><strong>AI-generated instructions (not an edited image)</strong><p>{aiTip}</p></div>}
          {imageError && <p role="alert" style={{marginTop:16,color:'#b42318'}}>{imageError}</p>}
        </section>
        {src && <section className="result">
          <h2>Browser photo editor</h2>
          <div style={{display:'grid',gap:12,maxWidth:700}}>
            <label>Brightness: {brightness}% <input aria-label="Brightness" type="range" min="50" max="160" value={brightness} onChange={e=>setBrightness(Number(e.target.value))} /></label>
            <label>Contrast: {contrast}% <input aria-label="Contrast" type="range" min="50" max="160" value={contrast} onChange={e=>setContrast(Number(e.target.value))} /></label>
            <label>Saturation: {saturation}% <input aria-label="Saturation" type="range" min="0" max="180" value={saturation} onChange={e=>setSaturation(Number(e.target.value))} /></label>
            <label>Blur: {blur}px <input aria-label="Blur" type="range" min="0" max="4" step="0.5" value={blur} onChange={e=>setBlur(Number(e.target.value))} /></label>
          </div>
          <canvas ref={canvasRef} aria-label="Photo preview" style={{width:'100%',maxWidth:900,marginTop:20,borderRadius:16,background:'#eee'}} />
          <p style={{color:'#667085'}}>Privacy: basic photo adjustments run locally in your browser. Only the text editing request is sent to the AI API; the photo pixels are not uploaded by this feature.</p>
        </section>}
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}
