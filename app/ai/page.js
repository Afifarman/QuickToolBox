'use client';

import Link from 'next/link';
import { useState } from 'react';

const TEMPLATES = [
  ['Write', 'Write a professional CV summary for a software engineer.'],
  ['Rewrite', 'Rewrite this more clearly and professionally:\n\n'],
  ['Summarize', 'Summarize this in 5 short bullet points:\n\n'],
  ['Email', 'Write a polite follow-up email about '],
  ['Study', 'Explain this topic simply for a student: '],
  ['Research URL', 'Open and summarize this URL, then list the most useful facts: '],
];

function parseSseBlock(block) {
  const dataLines = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim());
  if (!dataLines.length) return null;
  try {
    return JSON.parse(dataLines.join('\n'));
  } catch {
    return null;
  }
}

export default function AIPage() {
  const [prompt, setPrompt] = useState('Write a professional CV summary for a software engineer.');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('Ready');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    const value = prompt.trim();
    if (!value || busy) return;

    setBusy(true);
    setAnswer('');
    setError('');
    setStatus('Connecting to Gemini…');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ prompt: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `AI request failed (${res.status}).`);
      }
      if (!res.body) throw new Error('The AI stream is unavailable.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';

      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });

        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const event = parseSseBlock(block);
          if (!event) continue;

          if (event.type === 'provider') {
            setStatus(`Gemini ${event.model || ''}`.trim());
            continue;
          }
          if (event.type === 'complete') {
            setStatus('Complete');
            continue;
          }
          if (event.message) {
            setError(event.message);
            setStatus('Error');
            continue;
          }

          if (event.event_type === 'step.start') {
            const stepType = event.step?.type || 'tool';
            if (stepType !== 'model_output') setStatus(`Working: ${stepType.replaceAll('_', ' ')}…`);
            continue;
          }

          if (event.event_type === 'step.delta' && event.delta?.type === 'text') {
            text += event.delta.text || '';
            setAnswer(text);
            setStatus('Generating…');
          } else if (event.event_type === 'step.delta') {
            setStatus('Using context/tool…');
          }
        }
      }

      if (!text) setStatus('No text returned');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI request failed.';
      setError(message);
      setStatus('Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav>
          <Link href="/cv-maker">CV Maker</Link>
          <Link href="/student-tools">Student tools</Link>
          <Link href="/">← All tools</Link>
        </nav>
      </header>

      <main className="ai-page" style={{ maxWidth: 980, margin: '0 auto', padding: '48px 20px' }}>
        <small>🤖 GEMINI AI TOOLS</small>
        <h1>QuickToolBox AI Assistant</h1>
        <p>Generate, rewrite, summarize, study and research with Gemini. Responses stream live, and URL research can use Gemini’s URL Context tool.</p>

        <div className="ai-templates" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '24px 0' }}>
          {TEMPLATES.map(([label, value]) => (
            <button key={label} type="button" className="ai-chip" onClick={() => setPrompt(value)}>{label}</button>
          ))}
        </div>

        <textarea
          rows={9}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate();
          }}
          placeholder="Ask Gemini anything…"
          style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #d9def0', resize: 'vertical' }}
        />

        <div className="ai-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn" onClick={generate} disabled={busy || !prompt.trim()}>
            {busy ? 'Generating…' : 'Generate with Gemini →'}
          </button>
          <button className="btn light" type="button" onClick={() => { setPrompt(''); setAnswer(''); setError(''); setStatus('Ready'); }}>
            Clear
          </button>
          <span className="ai-count">{prompt.trim().length} characters · {status}</span>
        </div>

        {error && (
          <section className="result" style={{ marginTop: 20, borderColor: '#f0b8b8', color: '#8b1e1e' }}>
            <strong>Gemini error</strong>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{error}</div>
          </section>
        )}

        {answer && (
          <section className="result ai-result" style={{ marginTop: 20 }}>
            <div className="ai-result-bar"><strong>Gemini Result</strong><span>{status}</span></div>
            <div className="ai-result-body" style={{ whiteSpace: 'pre-wrap' }}>{answer}</div>
          </section>
        )}
      </main>

      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}
