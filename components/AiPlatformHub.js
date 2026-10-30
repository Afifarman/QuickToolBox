'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './AiPlatformHub.module.css';

const catalog = [
  { name: 'AI Assistant', category: 'Chat & writing', description: 'Ask questions, rewrite, summarize and draft content.', href: '/ai', tags: ['Free tier available', 'Text'] },
  { name: 'AI Prompt Generator', category: 'Chat & writing', description: 'Create reusable prompts for study, coding, images and work.', href: '/ai-prompts', tags: ['Free', 'Prompts'] },
  { name: 'AI Photo Editor', category: 'Image', description: 'Submit an image and an editing instruction to the image-edit API.', href: '/ai-photo-editor', tags: ['Provider required', 'Image'] },
  { name: 'AI CV Maker', category: 'Productivity', description: 'Build and format a professional CV.', href: '/cv-maker', tags: ['Free', 'Career'] },
  { name: 'PDF Notes Extractor', category: 'Study', description: 'Extract selectable text from a PDF in your browser.', href: '/student-tools/pdf-notes-extractor', tags: ['Free', 'Study'] },
  { name: 'Notes Summarizer', category: 'Study', description: 'Create a concise summary of your notes.', href: '/student-tools/notes-summarizer', tags: ['Local tool', 'Study'] },
  { name: 'Grammar Checker', category: 'Study', description: 'Check common grammar, spacing and punctuation issues.', href: '/student-tools/grammar-checker', tags: ['Local tool', 'Study'] },
  { name: 'Student Translator', category: 'Study', description: 'Use browser translation support where available.', href: '/student-tools/student-translator', tags: ['Browser support', 'Study'] },
];

const providers = [
  { key: 'gemini', name: 'Google Gemini', note: 'Free quota may be available; subject to Google limits.' },
  { key: 'groq', name: 'Groq', note: 'Free developer access may be available; model and rate limits apply.' },
  { key: 'openrouter', name: 'OpenRouter', note: 'Free models/router can be rate-limited and availability varies.' },
  { key: 'huggingface', name: 'Hugging Face', note: 'Some inference routes may require paid credits; not assumed free.' },
  { key: 'openai', name: 'OpenAI', note: 'Paid provider; fallback is disabled unless explicitly enabled.' },
];
const filters = ['All', 'Chat & writing', 'Image', 'Productivity', 'Study'];

export default function AiPlatformHub() {
  const [active, setActive] = useState('All');
  const [query, setQuery] = useState('');
  const [providersState, setProvidersState] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [chatError, setChatError] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let live = true;
    fetch('/api/ai', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'Could not read provider configuration.');
        return data;
      })
      .then((data) => { if (live) setProvidersState(data.providers || null); })
      .catch(() => { if (live) setProvidersState(null); })
      .finally(() => { if (live) setHealthLoading(false); });
    return () => { live = false; };
  }, []);

  const visibleTools = useMemo(() => catalog.filter((tool) => {
    const matchesCategory = active === 'All' || tool.category === active;
    const text = (tool.name + ' ' + tool.description + ' ' + tool.tags.join(' ')).toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  }), [active, query]);

  async function sendPrompt(event) {
    event.preventDefault();
    if (!prompt.trim() || chatLoading) return;
    setChatLoading(true); setChatError(''); setAnswer('');
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No AI provider completed this request.');
      if (!data.text) throw new Error('The provider returned no usable answer.');
      setAnswer(data.text);
    } catch (error) {
      setChatError(error.message || 'AI request failed. Please try again.');
    } finally { setChatLoading(false); }
  }

  return <main className={styles.page}>
    <header className={styles.header}>
      <a href="/" className={styles.brand}>Q <span>QuickToolBox</span></a>
      <nav><a href="#assistant">AI Chat</a><a href="#directory">Tools Directory</a><a href="#models">Model Hub</a></nav>
    </header>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>ONE WORKSPACE · MANY AI TOOLS</p>
      <h1>Your AI workspace,<br /><span>all in one place.</span></h1>
      <p className={styles.lead}>Chat with available AI providers, discover practical tools, and check which model providers are configured for this deployment.</p>
      <div className={styles.heroStats}><span>Free-first routing</span><span>Honest provider status</span><span>Tool discovery</span></div>
    </section>
    <section id="assistant" className={styles.section}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>01 / AI ASSISTANT</p><h2>Ask your AI</h2></div><span className={styles.subtle}>Uses the QuickToolBox AI API</span></div>
      <form className={styles.chat} onSubmit={sendPrompt}>
        <label htmlFor="ai-prompt">What would you like help with?</label>
        <textarea id="ai-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. Explain solar panels in simple Bangla..." rows={4} maxLength={8000} />
        <div className={styles.chatFooter}><span>Responses depend on provider configuration and quota.</span><button disabled={chatLoading || !prompt.trim()}>{chatLoading ? 'Working…' : 'Send prompt ↗'}</button></div>
      </form>
      {chatError && <p className={styles.error} role="alert">{chatError}</p>}
      {answer && <article className={styles.answer}><h3>AI response</h3><p>{answer}</p></article>}
    </section>
    <section id="directory" className={styles.section}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>02 / DISCOVER</p><h2>AI tools directory</h2></div><span className={styles.subtle}>{visibleTools.length} tools listed</span></div>
      <input className={styles.search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools by name or task…" aria-label="Search AI tools" />
      <div className={styles.filters}>{filters.map((filter) => <button type="button" key={filter} onClick={() => setActive(filter)} className={active === filter ? styles.selected : ''}>{filter}</button>)}</div>
      <div className={styles.toolGrid}>{visibleTools.map((tool) => <a className={styles.toolCard} href={tool.href} key={tool.name}><span className={styles.toolCategory}>{tool.category}</span><h3>{tool.name}</h3><p>{tool.description}</p><div className={styles.tags}>{tool.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><b>Open tool ↗</b></a>)}</div>
      <p className={styles.disclaimer}>Directory entries describe existing QuickToolBox routes; listing a tool does not mean its full end-to-end behavior has passed testing.</p>
    </section>
    <section id="models" className={styles.section}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>03 / PROVIDERS</p><h2>AI model hub</h2></div><span className={styles.subtle}>{healthLoading ? 'Checking configuration…' : 'Configuration snapshot'}</span></div>
      <div className={styles.providerGrid}>{providers.map((provider) => {
        const configured = providersState?.[provider.key];
        return <article className={styles.providerCard} key={provider.key}><div className={styles.providerTop}><h3>{provider.name}</h3><span className={configured === true ? styles.configured : styles.unknown}>{healthLoading ? 'Checking' : providersState ? (configured ? 'Key configured' : 'Not configured') : 'Status unavailable'}</span></div><p>{provider.note}</p><small>Key presence is not a live API health test.</small></article>;
      })}</div>
      <p className={styles.disclaimer}>A provider is not labelled “Working” just because an environment variable exists. Real API tests and per-tool functional tests are tracked separately.</p>
    </section>
    <footer className={styles.footer}>QuickToolBox · Free-first AI workspace <a href="/">Back to home</a></footer>
  </main>;
}
