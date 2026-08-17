'use client';
import { useState } from 'react';

export default function AIPage() {
  const [prompt, setPrompt] = useState('Write a professional CV summary for a software engineer.');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true); setAnswer('');
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      setAnswer(data.text || data.error || 'No response.');
    } catch { setAnswer('AI request failed.'); }
    finally { setBusy(false); }
  }

  return <main style={{maxWidth:900,margin:'0 auto',padding:'48px 20px'}}>
    <small>🤖 AI TOOLS</small>
    <h1>QuickToolBox AI Assistant</h1>
    <p>Generate, rewrite, summarize and improve text with AI.</p>
    <textarea rows={8} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ask AI anything..." style={{width:'100%',marginTop:20,padding:16,borderRadius:12}} />
    <button className="btn" onClick={generate} disabled={busy || !prompt.trim()}>{busy ? 'Generating…' : 'Generate with AI →'}</button>
    {answer && <div className="result" style={{whiteSpace:'pre-wrap',marginTop:20}}>{answer}</div>}
  </main>;
}
