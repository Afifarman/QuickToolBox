'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'qtb_global_assistant_history';

export default function QuickToolboxAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setMessages(saved.slice(-12));
    } catch {}
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function persist(next) {
    setMessages(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-12))); } catch {}
  }

  async function send(event) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    persist(next);
    setDraft('');
    setError('');
    setBusy(true);
    try {
      const prompt = next.slice(-8).map(item => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`).join('\n\n')
        + '\n\nAssistant: Reply to the latest user message. Keep the conversation context.';
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.text || !data.source || data.source === 'local') {
        throw new Error(data.error || 'AI is unavailable right now. Please try again.');
      }
      persist([...next, { role: 'assistant', content: data.text, source: data.source }]);
    } catch (err) {
      setError(err?.message || 'Could not connect to an AI provider.');
    } finally {
      setBusy(false);
    }
  }

  if (pathname === '/ai') return null;

  return (
    <div className="qtb-float-assistant">
      {open && (
        <section className="qtb-float-panel" aria-label="QuickToolBox AI Assistant">
          <div className="qtb-float-head">
            <div className="qtb-float-brand"><span>✦</span><div><b>QuickToolBox AI</b><small>Free-first AI assistant</small></div></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">×</button>
          </div>
          <div className="qtb-float-messages" aria-live="polite">
            {messages.length === 0 && <div className="qtb-float-welcome"><span>✦</span><b>How can I help?</b><p>Ask a question in Bangla or English.</p><Link href="/ai" onClick={() => setOpen(false)}>Open full AI workspace ↗</Link></div>}
            {messages.map((item, index) => <div key={index} className={item.role === 'user' ? 'qtb-float-message user' : 'qtb-float-message assistant'}><span>{item.role === 'user' ? 'You' : 'AI'}</span><p>{item.content}</p></div>)}
            {busy && <div className="qtb-float-typing">AI is thinking…</div>}
          </div>
          {error && <p className="qtb-float-error" role="alert">{error}</p>}
          <form className="qtb-float-form" onSubmit={send}>
            <textarea ref={inputRef} rows={2} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Message QuickToolBox AI…" aria-label="Message QuickToolBox AI" />
            <button type="submit" disabled={busy || !draft.trim()} aria-label="Send message">↑</button>
          </form>
          <div className="qtb-float-foot"><span>AI can make mistakes.</span><Link href="/ai" onClick={() => setOpen(false)}>Full workspace</Link></div>
        </section>
      )}
      <button className="qtb-float-launcher" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}>
        <span>{open ? '×' : '✦'}</span><b>{open ? 'Close' : 'Ask AI'}</b>
      </button>
    </div>
  );
}
