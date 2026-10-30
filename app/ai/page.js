'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const STARTERS = [
  { icon: '✍', title: 'Write something', prompt: 'Write a clear, professional introduction about ' },
  { icon: '⌘', title: 'Help with code', prompt: 'Help me write or debug code. I am working with ' },
  { icon: '▤', title: 'Summarize text', prompt: 'Summarize the following text into clear bullet points:\n\n' },
  { icon: '🎓', title: 'Study a topic', prompt: 'Explain this topic in simple Bangla for a student: ' },
];
const LABELS = { gemini: 'Gemini', groq: 'Groq', huggingface: 'Hugging Face', openrouter: 'OpenRouter', openai: 'OpenAI' };
const STORE = 'qtb_ai_conversations_v2';
const makeId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function AIPage() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '[]');
      if (Array.isArray(saved) && saved.length) {
        setConversations(saved);
        setActiveId(saved[0].id);
        return;
      }
    } catch {}
    const initial = { id: makeId(), title: 'New chat', messages: [], updatedAt: Date.now() };
    setConversations([initial]);
    setActiveId(initial.id);
  }, []);

  useEffect(() => {
    if (conversations.length) {
      try { localStorage.setItem(STORE, JSON.stringify(conversations.slice(0, 40))); } catch {}
    }
  }, [conversations]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [activeId, conversations, busy]);

  const active = conversations.find(item => item.id === activeId) || conversations[0];
  const messages = active?.messages || [];

  function updateActive(nextMessages) {
    setConversations(current => current.map(item => item.id === activeId
      ? { ...item, messages: nextMessages, title: item.messages.length ? item.title : (nextMessages.find(message => message.role === 'user')?.content || 'New chat').slice(0, 42), updatedAt: Date.now() }
      : item).sort((a, b) => b.updatedAt - a.updatedAt));
  }

  function newChat() {
    const item = { id: makeId(), title: 'New chat', messages: [], updatedAt: Date.now() };
    setConversations(current => [item, ...current]);
    setActiveId(item.id);
    setDraft('');
    setError('');
    inputRef.current?.focus();
  }

  async function send(textOverride) {
    const text = String(textOverride ?? draft).trim();
    if (!text || busy || !active) return;
    const nextMessages = [...messages, { role: 'user', content: text, id: makeId() }];
    updateActive(nextMessages);
    setDraft('');
    setError('');
    setBusy(true);
    try {
      const transcript = nextMessages.slice(-12).map(message => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`).join('\n\n');
      const prompt = `You are QuickToolBox AI, a helpful, accurate assistant. Reply in the user's language unless asked otherwise. Use the conversation context and answer the latest user message.\n\n${transcript}\n\nAssistant:`;
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.text || !data.source || data.source === 'local') {
        throw new Error(data.error || 'No AI provider returned a real response. Please try again later.');
      }
      updateActive([...nextMessages, { role: 'assistant', content: data.text, source: data.source, model: data.model, id: makeId() }]);
    } catch (err) {
      setError(err?.message || 'The AI request could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  async function copyMessage(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(message.id);
      window.setTimeout(() => setCopied(''), 1400);
    } catch { setError('Clipboard access is unavailable in this browser.'); }
  }

  function deleteChat(id) {
    const next = conversations.filter(item => item.id !== id);
    if (activeId === id) {
      const replacement = next[0] || { id: makeId(), title: 'New chat', messages: [], updatedAt: Date.now() };
      setConversations(next.length ? next : [replacement]);
      setActiveId(replacement.id);
    } else setConversations(next);
  }

  return (
    <div className="qtb-ai-shell">
      <aside className="qtb-ai-sidebar">
        <Link href="/" className="qtb-ai-brand"><span>Q</span><b>QuickToolBox</b></Link>
        <button className="qtb-ai-new" type="button" onClick={newChat}><span>＋</span> New chat</button>
        <div className="qtb-ai-history-label">RECENT CHATS</div>
        <div className="qtb-ai-history">
          {conversations.map(item => <div className={item.id === activeId ? 'qtb-ai-history-item active' : 'qtb-ai-history-item'} key={item.id}>
            <button type="button" onClick={() => { setActiveId(item.id); setError(''); }}><span>◷</span>{item.title}</button>
            <button type="button" className="qtb-ai-delete" onClick={() => deleteChat(item.id)} aria-label={`Delete ${item.title}`}>×</button>
          </div>)}
          {!conversations.length && <p className="qtb-ai-empty-history">Your chats will appear here.</p>}
        </div>
        <div className="qtb-ai-sidebar-bottom"><div className="qtb-ai-profile"><span>✦</span><div><b>QuickToolBox AI</b><small>Free-first models</small></div></div><Link href="/">← Back to tools</Link></div>
      </aside>
      <main className="qtb-ai-main">
        <header className="qtb-ai-topbar"><div><span className="qtb-ai-status-dot" /> QuickToolBox AI <small>Preview</small></div><Link href="/">Explore tools ↗</Link></header>
        <section className={messages.length ? 'qtb-ai-chat has-messages' : 'qtb-ai-chat'}>
          {messages.length === 0 ? <div className="qtb-ai-welcome">
            <div className="qtb-ai-orb"><span>✦</span></div><div className="qtb-ai-kicker">YOUR EVERYDAY AI PARTNER</div>
            <h1>What can I help you <span>with?</span></h1><p>Ask in Bangla or English. Get help with writing, learning, ideas and code.</p>
            <div className="qtb-ai-starters">{STARTERS.map(item => <button key={item.title} type="button" onClick={() => { setDraft(item.prompt); inputRef.current?.focus(); }}><span>{item.icon}</span><b>{item.title}</b><small>{item.prompt.slice(0, 48)}…</small></button>)}</div>
          </div> : <div className="qtb-ai-messages">
            {messages.map(message => <article className={message.role === 'user' ? 'qtb-ai-message user' : 'qtb-ai-message assistant'} key={message.id}>
              <div className="qtb-ai-message-avatar">{message.role === 'user' ? 'You' : '✦'}</div>
              <div className="qtb-ai-message-content"><div className="qtb-ai-message-label">{message.role === 'user' ? 'You' : 'QuickToolBox AI'}</div><div className="qtb-ai-message-text">{message.content}</div>
                {message.role === 'assistant' && <div className="qtb-ai-message-tools"><span>{LABELS[message.source] || message.source || 'AI'}</span><button type="button" onClick={() => copyMessage(message)}>{copied === message.id ? 'Copied ✓' : 'Copy'}</button></div>}
              </div>
            </article>)}
            {busy && <div className="qtb-ai-thinking"><span /><span /><span /> AI is thinking…</div>}<div ref={bottomRef} />
          </div>}
          {error && <div className="qtb-ai-error" role="alert"><b>AI request failed</b><span>{error}</span><button type="button" onClick={() => setError('')}>Dismiss</button></div>}
          <form className="qtb-ai-composer" onSubmit={event => { event.preventDefault(); send(); }}>
            <textarea ref={inputRef} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} rows={2} placeholder="Message QuickToolBox AI…" aria-label="Message QuickToolBox AI" />
            <div className="qtb-ai-composer-bottom"><span>↵ Send · Shift + ↵ New line</span><button type="submit" disabled={busy || !draft.trim()} aria-label="Send message">{busy ? '…' : '↑'}</button></div>
          </form>
          <div className="qtb-ai-disclaimer">QuickToolBox AI can make mistakes. Verify important information.</div>
        </section>
      </main>
    </div>
  );
}
