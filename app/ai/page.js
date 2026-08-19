'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const PRESETS = [
  ['✍️ CV summary', 'Write a professional CV summary for a software engineer with 3 years of experience.'],
  ['✉️ Cover letter', 'Write a short, professional cover letter for a marketing internship.'],
  ['📄 Summarize', 'Summarize the following text in 5 clear bullet points:\n\n'],
  ['🔤 Fix grammar', 'Fix the grammar and improve the clarity of this text:\n\n'],
  ['💡 Ideas', 'Give me 10 creative content ideas about productivity for students.'],
  ['🌐 Translate', 'Translate the following text into Bangla:\n\n'],
];

export default function AIPage() {
  const [prompt, setPrompt] = useState('Write a professional CV summary for a software engineer.');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/ai')
      .then((r) => r.json())
      .then((j) => {
        if (alive && j && j.configured === false) {
          setError('AI is not configured on this deployment yet. Add an OPENAI_API_KEY environment variable in Vercel, then redeploy.');
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  async function generate() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setAnswer('');
    setError('');
    setCopied(false);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) setError(data.error || `Request failed (${res.status}).`);
      else setAnswer(data.text || 'No response generated.');
    } catch {
      setError('Could not reach the AI service. Check your connection and try again.');
    } finally {
      setBusy(false);
      setTimeout(() => boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/tools">Tools</Link><Link href="/cv-maker">CV Maker</Link><Link href="/">← Home</Link></nav>
      </header>

      <main className="ai-page">
        <small>🤖 AI TOOLS</small>
        <h1>QuickToolBox AI Assistant</h1>
        <p>Generate, rewrite, summarize, translate and improve text with AI.</p>

        <div className="chip-row">
          {PRESETS.map(([label, text]) => (
            <button className="chip" key={label} onClick={() => setPrompt(text)} type="button">{label}</button>
          ))}
        </div>

        <textarea
          rows={9}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate(); }}
          placeholder="Ask AI anything…"
        />
        <div style={{ marginTop: 6 }}>
          <button className="btn" onClick={generate} disabled={busy || !prompt.trim()}>
            {busy ? 'Generating…' : 'Generate with AI →'}
          </button>
          {(answer || error) && (
            <button className="btn light" onClick={() => { setAnswer(''); setError(''); }} type="button">Clear</button>
          )}
        </div>
        <p className="print-help">Tip: press Ctrl/⌘ + Enter to generate.</p>

        {error && <div className="notice" ref={boxRef}>⚠️ {error}</div>}

        {answer && (
          <div ref={boxRef}>
            <div className="ai-answer">{answer}</div>
            <button className="btn light" onClick={copy} type="button">{copied ? '✓ Copied' : 'Copy result'}</button>
          </div>
        )}
      </main>

      <footer>© 2026 QuickToolBox <span>AI tools.</span></footer>
    </>
  );
}
