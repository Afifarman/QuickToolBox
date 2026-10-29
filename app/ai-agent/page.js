'use client';

import Link from 'next/link';
import { useState } from 'react';

const SUGGESTIONS = [
  'আমার পড়াশোনার জন্য ৭ দিনের একটি পরিকল্পনা তৈরি করো',
  'Explain photosynthesis simply and give me a checklist to study it',
  'Summarize this text and give me the key points:',
  'QuickToolBox-এর AI tools কী কী এবং কী কাজে লাগে?',
];

export default function AIAgentPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [toolsUsed, setToolsUsed] = useState([]);

  async function send(value = message) {
    const text = String(value || '').trim();
    if (!text || busy) return;
    setMessages((old) => [...old, { role: 'user', text }]);
    setMessage('');
    setBusy(true);
    setStatus('');
    setToolsUsed([]);
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || !data.text) {
        throw new Error(data.error || 'AI Agent উত্তর দিতে পারেনি। পরে আবার চেষ্টা করুন।');
      }
      setMessages((old) => [...old, { role: 'assistant', text: data.text }]);
      setToolsUsed(Array.isArray(data.toolsUsed) ? data.toolsUsed : []);
      setStatus('AI উত্তর তৈরি হয়েছে');
    } catch (error) {
      setMessages((old) => [...old, { role: 'error', text: error?.message || 'AI Agent সাময়িকভাবে unavailable।' }]);
      setStatus('AI Agent unavailable — এটি সফল উত্তর নয়।');
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
      <main style={{ maxWidth: 900, padding: '42px 20px 72px' }}>
        <small>QUICKTOOLBOX • AI AGENT</small>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 58px)', letterSpacing: '-.05em', margin: '14px 0' }}>Your AI Agent</h1>
        <p style={{ color: '#667085', lineHeight: 1.7, maxWidth: 720 }}>
          Chat, break goals into steps, make checklists, summarize text and explain topics. The agent can call a small set of safe built-in tools; it cannot change your account, edit website code or perform external actions.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, margin: '22px 0' }}>
          {SUGGESTIONS.map((item) => (
            <button key={item} type="button" onClick={() => setMessage(item)} disabled={busy}
              style={{ border: '1px solid #d0d5dd', borderRadius: 999, background: '#fff', padding: '9px 13px', cursor: 'pointer', color: '#344054' }}>
              {item}
            </button>
          ))}
        </div>
        <section style={{ padding: 0, maxWidth: 'none' }}>
          <div aria-live="polite" style={{ minHeight: 220, maxHeight: 520, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: '#fff', border: '1px solid #e4e7ec', borderRadius: 18 }}>
            {messages.length === 0 && <p style={{ color: '#667085', margin: 'auto', textAlign: 'center' }}>কী করতে চাও, লিখে পাঠাও। আমি পরিকল্পনা করতে, বিষয় বুঝিয়ে বলতে ও checklist বানাতে পারি।</p>}
            {messages.map((item, index) => (
              <div key={index} style={{ alignSelf: item.role === 'user' ? 'flex-end' : 'stretch', maxWidth: item.role === 'user' ? '88%' : '100%', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: '12px 14px', borderRadius: 14, background: item.role === 'user' ? '#eef2ff' : item.role === 'error' ? '#fef3f2' : '#f8fafc', border: item.role === 'error' ? '1px solid #fecdca' : '1px solid #eaecf0', lineHeight: 1.65 }}>
                <strong style={{ display: 'block', fontSize: 12, marginBottom: 5, color: item.role === 'error' ? '#b42318' : '#475467' }}>
                  {item.role === 'user' ? 'You' : item.role === 'error' ? 'AI Agent Error' : 'QuickToolBox Agent'}
                </strong>
                {item.text}
              </div>
            ))}
            {busy && <p role="status" style={{ color: '#4f46e5' }}>Agent কাজ করছে…</p>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); send(); }} style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'stretch' }}>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={6000} rows={3}
              placeholder="তোমার কাজ বা প্রশ্ন লিখো…" disabled={busy}
              style={{ flex: 1, minWidth: 0, border: '1px solid #d0d5dd', borderRadius: 12, padding: 13, resize: 'vertical', background: '#fff' }} />
            <button className="btn" type="submit" disabled={busy || !message.trim()}>{busy ? 'Working…' : 'Send ↑'}</button>
          </form>
          {status && <p role="status" style={{ color: status.startsWith('AI Agent unavailable') ? '#b42318' : '#475467', fontSize: 13 }}>{status}</p>}
          {toolsUsed.length > 0 && <p style={{ color: '#667085', fontSize: 13 }}>Tools used: {toolsUsed.join(', ')}</p>}
          <p style={{ color: '#667085', fontSize: 12 }}>Privacy: the message is sent to Gemini to generate a response. Do not send passwords, API keys or other secrets.</p>
        </section>
      </main>
      <footer>© 2026 QuickToolBox <span>AI Agent preview</span></footer>
    </>
  );
}
