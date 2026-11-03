'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './LocalAIChat.module.css';

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const LIBRARY_URL = 'https://esm.run/@mlc-ai/web-llm@0.2.87';
const SYSTEM_PROMPT = 'You are QuickToolBox Local AI, a helpful assistant. Reply in the same language as the user. Support Bangla and English. Be accurate, concise, and clearly say when you are unsure. You run locally in the user browser.';

export default function LocalAIChat() {
  const engineRef = useRef(null);
  const loadingRef = useRef(false);
  const [supported, setSupported] = useState(null);
  const [status, setStatus] = useState('not-loaded');
  const [progress, setProgress] = useState({ text: 'Model not downloaded', progress: 0 });
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function detect() {
      if (!window.isSecureContext || !('gpu' in navigator)) {
        if (active) setSupported(false);
        return;
      }
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (active) setSupported(Boolean(adapter));
      } catch {
        if (active) setSupported(false);
      }
    }
    detect();
    return () => { active = false; };
  }, []);

  async function loadModel() {
    if (engineRef.current || loadingRef.current) return;
    if (!supported) {
      setError('এই browser/device-এ WebGPU পাওয়া যায়নি। সর্বশেষ Chrome বা Edge ব্যবহার করুন এবং hardware acceleration চালু করুন।');
      return;
    }
    loadingRef.current = true;
    setError('');
    setStatus('loading');
    setProgress({ text: 'AI engine প্রস্তুত হচ্ছে…', progress: 0 });
    try {
      // Load WebLLM only in the browser. The model inference itself never calls a paid API.
      const webllm = await import(/* webpackIgnore: true */ 'https://esm.run/@mlc-ai/web-llm@0.2.87');
      const engine = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => {
          setProgress({
            text: report?.text || 'Model download and initialization…',
            progress: Math.max(0, Math.min(1, Number(report?.progress) || 0)),
          });
        },
        appConfig: { ...webllm.prebuiltAppConfig, cacheBackend: 'indexeddb' },
      });
      engineRef.current = engine;
      setModelReady(true);
      setStatus('ready');
      setProgress({ text: 'Local model ready', progress: 1 });
    } catch (cause) {
      setStatus('error');
      setError(cause?.message || 'Local AI model could not be loaded. Check your internet connection, browser compatibility, and available memory.');
    } finally {
      loadingRef.current = false;
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    if (!engineRef.current) {
      setError('প্রথমে Load free AI model বাটনে ক্লিক করুন।');
      return;
    }
    const history = [...messages, { role: 'user', content: text }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setDraft('');
    setError('');
    setBusy(true);
    try {
      const stream = await engineRef.current.chat.completions.create({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-10)],
        temperature: 0.7,
        max_tokens: 700,
        stream: true,
      });
      for await (const chunk of stream) {
        const piece = chunk.choices?.[0]?.delta?.content || '';
        if (piece) {
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: last.content + piece };
            return next;
          });
        }
      }
    } catch (cause) {
      setError(cause?.message || 'Local response generation failed. Try a shorter prompt or reload the model.');
      setMessages((current) => current.filter((message, index) => !(index === current.length - 1 && message.role === 'assistant' && !message.content)));
    } finally {
      setBusy(false);
    }
  }

  const percent = Math.round(progress.progress * 100);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/ai" className={styles.back}>← AI Workspace</Link>
        <span className={styles.localBadge}><i /> Runs on your device</span>
      </header>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>PRIVATE · OPEN SOURCE · NO PAID API</span>
        <h1>Free Local <em>AI Chat</em></h1>
        <p>Run an open model in your browser. Your prompts stay on this device and are not sent to a paid AI inference API.</p>
      </section>
      <section className={styles.workspace}>
        <aside className={styles.modelPanel}>
          <div className={styles.panelTitle}>LOCAL MODEL</div>
          <h2>Qwen 2.5 · 0.5B</h2>
          <p className={styles.modelDescription}>Small quantized language model · browser WebGPU · first download approximately 1 GB (varies by model files and cache).</p>
          <div className={styles.specs}>
            <span>Inference <b>On-device</b></span>
            <span>API cost <b>৳0</b></span>
            <span>Cache <b>IndexedDB</b></span>
          </div>
          <div className={styles.compat}>
            <span>WebGPU compatibility</span>
            <b className={supported === null ? styles.neutral : supported ? styles.good : styles.bad}>{supported === null ? 'Checking…' : supported ? 'Supported' : 'Not detected'}</b>
          </div>
          <button className={styles.loadButton} onClick={loadModel} disabled={status === 'loading' || modelReady || supported === false}>
            {status === 'loading' ? 'Loading model…' : modelReady ? 'Model loaded ✓' : 'Load free AI model'}
          </button>
          {(status === 'loading' || modelReady) && <div className={styles.progressWrap}>
            <div className={styles.progressText}><span>{progress.text}</span><b>{percent}%</b></div>
            <div className={styles.progressTrack}><i style={{ width: percent + '%' }} /></div>
          </div>}
          <p className={styles.smallNote}>The first load needs internet and can take several minutes. After caching, the model may be reused offline in this browser. Keep this tab open while loading.</p>
        </aside>
        <section className={styles.chatPanel}>
          <div className={styles.chatHeader}><div><b>QuickToolBox Local AI</b><small>{modelReady ? 'Ready · browser inference' : 'Load the model to start chatting'}</small></div><button type="button" onClick={() => setMessages([])} disabled={!messages.length || busy}>Clear chat</button></div>
          <div className={styles.messages}>
            {!messages.length && <div className={styles.emptyState}><div className={styles.spark}>✳</div><h3>Your AI runs here</h3><p>Ask a question in Bangla or English after loading the model.</p><div className={styles.examples}><button onClick={() => setDraft('বাংলায় photosynthesis সহজভাবে বুঝিয়ে দাও।')}>বাংলায় Photosynthesis বুঝাও</button><button onClick={() => setDraft('Explain how the internet works in simple English.')}>Explain the internet</button></div></div>}
            {messages.map((message, index) => <article className={message.role === 'user' ? styles.userMessage : styles.assistantMessage} key={index}><b>{message.role === 'user' ? 'You' : 'Local AI'}</b><p>{message.content || (busy && index === messages.length - 1 ? 'Thinking…' : '')}</p></article>)}
          </div>
          {error && <div className={styles.error} role="alert"><b>Local AI issue</b><span>{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
          <form className={styles.composer} onSubmit={sendMessage}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} placeholder={modelReady ? 'Ask your local AI…' : 'Load the model first…'} disabled={!modelReady || busy} />
            <button type="submit" disabled={!modelReady || busy || !draft.trim()}>{busy ? 'Thinking…' : 'Send ↑'}</button>
          </form>
          <div className={styles.privacy}>No paid API · No cloud inference · Model files download from the open model host on first use.</div>
        </section>
      </section>
    </main>
  );
}
