'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function AIPhotoEditor() {
  const canvasRef = useRef(null);
  const [src, setSrc] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [prompt, setPrompt] = useState('Make this photo brighter, sharper and more professional while keeping the person and clothes natural.');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [aiTip, setAiTip] = useState('');

  useEffect(() => {
    if (!src || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = src;
  }, [src, brightness, contrast, saturation, blur]);

  function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAiTip('Please choose a valid image file.');
      return;
    }
    setImageFile(file);
    setSrc(URL.createObjectURL(file));
    setAiTip('');
  }

  async function improvePrompt() {
    if (!imageFile) {
      setAiTip('আগে একটি ছবি আপলোড করুন, তারপর Improve with AI চাপুন।');
      return;
    }
    if (!prompt.trim()) {
      setAiTip('ছবিতে কী পরিবর্তন চান, তা লিখুন।');
      return;
    }

    setAiBusy(true);
    setAiTip('ছবি AI-তে পাঠানো হচ্ছে এবং সম্পাদিত ছবি তৈরি হচ্ছে…');
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('ছবিটি পড়া যায়নি। আবার চেষ্টা করুন।'));
        reader.readAsDataURL(imageFile);
      });
      const comma = dataUrl.indexOf(',');
      if (comma < 0) throw new Error('ছবির ডেটা পড়া যায়নি।');
      const res = await fetch('/api/ai-photo-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mimeType: imageFile.type,
          imageBase64: dataUrl.slice(comma + 1),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'AI দিয়ে ছবি সম্পাদনা করা যায়নি।');
      if (!data.imageDataUrl) throw new Error('AI কোনো সম্পাদিত ছবি ফেরত দেয়নি।');
      setSrc(data.imageDataUrl);
      setImageFile(null);
      setAiTip('AI-সম্পাদিত ছবি তৈরি হয়েছে। নিচের Download PNG বাটন দিয়ে সংরক্ষণ করুন।');
    } catch (error) {
      setAiTip(error instanceof Error ? error.message : 'AI ছবি সম্পাদনা ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setAiBusy(false);
    }
  }

  function download() {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.download = 'quicktoolbox-ai-photo-edit.png';
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
  }

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/ai">AI Assistant</Link><Link href="/ai-prompts">AI Prompts</Link><Link href="/">← All tools</Link></nav>
      </header>
      <main className="ai-page">
        <small>🖼️ AI PHOTO EDITOR</small>
        <h1>AI Photo Editor</h1>
        <p>ছবি আপলোড করুন, কী পরিবর্তন চান লিখুন, তারপর AI দিয়ে ছবিটি সম্পাদনা করুন।
        <section className="result">
          <input type="file" accept="image/*" onChange={upload} />
          <textarea rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe how you want to edit the photo…" />
          <div className="ai-actions">
            <button className="btn" type="button" onClick={improvePrompt} disabled={aiBusy || !imageFile}>{aiBusy ? "AI ছবি তৈরি করছে…" : "✨ Improve with AI"}</button>
            <button className="btn light" type="button" onClick={download} disabled={!src}>Download PNG</button>
          </div>
          {aiTip && <p className="result" style={{marginTop:16,whiteSpace:'pre-wrap'}}>{aiTip}</p>}
        </section>
        {src && <section className="result">
          <h2>Editor</h2>
          <div style={{display:'grid',gap:12,maxWidth:700}}>
            <label>Brightness: {brightness}% <input type="range" min="50" max="160" value={brightness} onChange={e=>setBrightness(Number(e.target.value))} /></label>
            <label>Contrast: {contrast}% <input type="range" min="50" max="160" value={contrast} onChange={e=>setContrast(Number(e.target.value))} /></label>
            <label>Saturation: {saturation}% <input type="range" min="0" max="180" value={saturation} onChange={e=>setSaturation(Number(e.target.value))} /></label>
            <label>Blur: {blur}px <input type="range" min="0" max="4" step="0.5" value={blur} onChange={e=>setBlur(Number(e.target.value))} /></label>
          </div>
          <canvas ref={canvasRef} style={{width:'100%',maxWidth:900,marginTop:20,borderRadius:16,background:'#eee'}} />
          <p style={{color:'#667085'}}>AI ছবি সম্পাদনার জন্য ছবিটি Gemini AI-তে পাঠানো হয়। সাধারণ brightness, contrast, saturation ও blur পরিবর্তন ব্রাউজারেই হয়।</p>
        </section>}
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}
