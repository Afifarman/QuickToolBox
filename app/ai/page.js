'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { localAI } from '../../lib/ai';

const TEMPLATES = [
  ['Write', 'Write a professional CV summary for a software engineer.'],
  ['Rewrite', 'Rewrite this more clearly and professionally:\n\n'],
  ['Summarize', 'Summarize this in 5 short bullet points:\n\n'],
  ['Email', 'Write a polite follow-up email about '],
  ['Study', 'Explain this topic simply for a student: '],
  ['Translate', 'Translate this to clear English:\n\n'],
];

const SOURCE_LABEL = {
  openai: 'OpenAI',
  groq: 'Groq',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
  local: 'On-device assistant',
};

export default function AIPage() {
  const [prompt, setPrompt] = useState('Write a professional CV summary for a software engineer.');
  const [answer, setAnswer] = useState('');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('qtb_ai_history') || '[]');
      if (Array.isArray(saved)) setHistory(saved.slice(0, 8));
    } catch {}
  }, []);

  const count = useMemo(() => prompt.trim().length, [prompt]);

  function remember(nextPrompt, nextAnswer, nextSource) {
    const item = { prompt: nextPrompt.slice(0, 160), answer: nextAnswer.slice(0, 400), source: nextSource, at: Date.now() };
    const next = [item, ...history.filter((x) => x.prompt !== item.prompt)].slice(0, 8);
    setHistory(next);
    try {
      localStorage.setItem('qtb_ai_history', JSON.stringify(next));
    } catch {}
  }

  async function generate() {
    const value = prompt.trim();
    if (!value || busy) return;
    setBusy(true);
    setAnswer('');
    setSource('');
    setCopied(false);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value }),
      });
      const data = await res.json().catch(() => ({}));
      const text = data.text || data.error || localAI(value);
      const used = data.source || (data.error ? 'local' : 'local');
      setAnswer(text);
      setSource(used);
      remember(value, text, used);
    } catch {
      const text = localAI(value);
      setAnswer(text);
      setSource('local');
      remember(value, text, 'local');
    } finally {
      setBusy(false);
    }
  }

  async function copyAnswer() {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <>
      <header>
        <Link className="brand" href="/">
          <b>Q</b> QuickToolBox
        </Link>
        <nav>
          <Link href="/cv-maker">CV Maker</Link>
          <Link href="/student-tools">Student tools</Link>
          <Link href="/">← All tools</Link>
        </nav>
      </header>
      <main className="ai-page">
        <small>🤖 AI TOOLS</small>
        <h1>QuickToolBox AI Assistant</h1>
        <p>
          Generate, rewrite, summarize and improve text. The assistant always answers — it uses a configured AI
          provider when available, and a built-in writer if no API key is set.
        </p>

        <div className="ai-templates">
          {TEMPLATES.map(([label, value]) => (
            <button key={label} type="button" className="ai-chip" onClick={() => setPrompt(value)}>
              {label}
            </button>
          ))}
        </div>

        <textarea
          rows={8}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate();
          }}
          placeholder="Ask AI anything..."
        />
        <div className="ai-actions">
          <button className="btn" onClick={generate} disabled={busy || !prompt.trim()}>
            {busy ? 'Generating…' : 'Generate with AI →'}
          </button>
          <button className="btn light" type="button" onClick={() => { setPrompt(''); setAnswer(''); setSource(''); }}>
            Clear
          </button>
          <span className="ai-count">{count} characters</span>
        </div>

        {answer && (
          <section className="result ai-result">
            <div className="ai-result-bar">
              <strong>Result</strong>
              <span>{SOURCE_LABEL[source] || 'Assistant'}</span>
              <button className="btn light" type="button" onClick={copyAnswer}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="ai-result-body">{answer}</div>
          </section>
        )}

        {history.length > 0 && (
          <section className="ai-history">
            <h2>Recent on this device</h2>
            {history.map((item) => (
              <button
                key={`${item.at}-${item.prompt}`}
                type="button"
                className="ai-history-item"
                onClick={() => {
                  setPrompt(item.prompt);
                  setAnswer(item.answer);
                  setSource(item.source);
                }}
              >
                <b>{item.prompt}</b>
                <span>{SOURCE_LABEL[item.source] || 'Assistant'}</span>
              </button>
            ))}
          </section>
        )}
      </main>
      <footer>
        © 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span>
      </footer>
    </>
  );
}
