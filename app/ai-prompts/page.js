'use client';

import Link from 'next/link';
import { useState } from 'react';

const categories = {
  'Image Editing': 'Create a professional photo-editing prompt that preserves the subject identity, clothing and composition.',
  'Image Generation': 'Create a detailed image-generation prompt with subject, composition, lighting, camera and style.',
  'Study': 'Create a student-friendly prompt that explains a topic simply, gives examples and ends with a quiz.',
  'Coding': 'Create a precise coding prompt that asks for production-ready code, edge cases and tests.',
  'SEO': 'Create an SEO prompt for keyword research, search intent, title, meta description and content outline.',
  'Social Media': 'Create a social-media content prompt with hooks, captions, hashtags and platform-specific formatting.',
};

export default function AIPrompts() {
  const [category, setCategory] = useState('Image Editing');
  const [goal, setGoal] = useState('Edit my portrait for a premium social media profile.');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function generate() {
    const requestGoal = goal.trim();
    if (!requestGoal || busy) {
      if (!requestGoal) setErrorMessage('আপনার লক্ষ্য বা নির্দেশনা লিখুন।');
      return;
    }
    setBusy(true);
    setResult('');
    setErrorMessage('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `You are an expert prompt engineer. Category: ${category}. Goal: ${requestGoal}. ${categories[category]} Return one polished copy-ready prompt followed by 3 short optional variations.` })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.text !== 'string' || !data.text.trim() || !data.source || data.source === 'local') {
        throw new Error(data.error || 'AI কোনো আসল উত্তর দেয়নি। API key, quota এবং deployment logs পরীক্ষা করে আবার চেষ্টা করুন।');
      }
      setResult(data.text.trim());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'AI Prompt Generator এখন কাজ করছে না। কোনো template-কে AI উত্তর হিসেবে দেখানো হয়নি। পরে আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/ai">AI Assistant</Link><Link href="/ai-photo-editor">AI Photo Editor</Link><Link href="/">← All tools</Link></nav>
      </header>
      <main className="ai-page">
        <small>✨ AI PROMPT TOOL</small>
        <h1>AI Prompt Generator</h1>
        <p>Create better prompts for image editing, image generation, study, coding, SEO and social media.</p>
        <section className="result">
          <label><b>Category</b></label>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{display:'block',marginTop:8,padding:12,borderRadius:10,border:'1px solid #d0d5dd',width:'100%'}}>
            {Object.keys(categories).map(x=><option key={x}>{x}</option>)}
          </select>
          <textarea rows={7} value={goal} onChange={e=>setGoal(e.target.value)} placeholder="What do you want the AI to do?" />
          <button className="btn" type="button" onClick={generate} disabled={busy}>{busy ? 'Creating…' : '✨ Generate Prompt'}</button>
        </section>
        {errorMessage && <section className="result" role="alert" style={{marginTop:20,border:'1px solid #fda29b',background:'#fff5f5',color:'#912018'}}><strong>AI response unavailable — এটি AI-তৈরি উত্তর নয়</strong><p>{errorMessage}</p><button className="btn light" type="button" onClick={generate} disabled={busy}>{busy ? 'Retrying…' : 'Try again'}</button></section>}
        {result && <section className="result" style={{marginTop:20}}>
          <div className="ai-result-bar"><strong>Copy-ready prompt</strong><button className="btn light" onClick={()=>navigator.clipboard?.writeText(result)}>Copy</button></div>
          <div className="ai-result-body">{result}</div>
        </section>}
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}
