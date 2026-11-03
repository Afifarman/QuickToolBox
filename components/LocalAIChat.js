'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './LocalAIChat.module.css';
import { COMPAT_QWEN_MODEL_ID, getQwenModelCandidates, isWebGPUShaderError } from '../lib/ai/local-model-selection';

const LIBRARY_URL = 'https://esm.run/@mlc-ai/web-llm@0.2.87';
const SYSTEM_PROMPT = 'You are QuickToolBox Local AI, a helpful assistant. Reply in the same language as the user. Support Bangla and English. Be accurate, concise, and clearly say when you are unsure. You run locally in the user browser.';

export default function LocalAIChat() {
  const engineRef = useRef(null);
  const loadingRef = useRef(false);
  const [supported, setSupported] = useState(null);
  const [hasShaderF16, setHasShaderF16] = useState(false);
  const [activeModel, setActiveModel] = useState('');
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
        if (active) {
          setSupported(Boolean(adapter));
          setHasShaderF16(Boolean(adapter?.features?.has('shader-f16')));
        }
      } catch {
        if (active) setSupported(false);
      }
    }
    detect();
    return () => { active = false; };
  }, []);

  async function loadModel() {
    if (engineRef.current || loadingRef.current) return;
    if (supported !== true) {
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
      const modelCandidates = getQwenModelCandidates(
        hasShaderF16,
        webllm.prebuiltAppConfig?.model_list || [],
      );
      if (!modelCandidates.length) {
        throw new Error('এই WebLLM সংস্করণে প্রয়োজনীয় Qwen model পাওয়া যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।');
      }

      let engine = null;
      let lastError = null;
      for (let index = 0; index < modelCandidates.length; index += 1) {
        const modelId = modelCandidates[index];
        setProgress({
          text: index === 0
            ? (modelId === COMPAT_QWEN_MODEL_ID ? 'Compatible Qwen model প্রস্তুত হচ্ছে…' : 'Qwen model প্রস্তুত হচ্ছে…')
            : 'প্রথম GPU shader variant কাজ করেনি; compatible model দিয়ে আবার চেষ্টা হচ্ছে…',
          progress: 0,
        });
        try {
          engine = await webllm.CreateMLCEngine(modelId, {
            initProgressCallback: (report) => {
              setProgress({
                text: report?.text || 'Model download and initialization…',
                progress: Math.max(0, Math.min(1, Number(report?.progress) || 0)),
              });
            },
            appConfig: { ...webllm.prebuiltAppConfig, cacheBackend: 'indexeddb' },
          });
          setActiveModel(modelId);
          break;
        } catch (cause) {
          lastError = cause;
          const shaderFailure = isWebGPUShaderError(cause);
          if (!shaderFailure || index === modelCandidates.length - 1) throw cause;
        }
      }
      if (!engine) throw lastError || new Error('Qwen model initialize করা যায়নি।');
      engineRef.current = engine;
      setModelReady(true);
      setStatus('ready');
      setProgress({ text: 'Local model ready', progress: 1 });
    } catch (cause) {
      setStatus('error');
      const message = String(cause?.message || cause || '');
      if (isWebGPUShaderError(cause)) {
        setError('আপনার GPU/browser এই Local AI model-এর shader তৈরি করতে পারছে না। Chrome/Edge আপডেট করুন, Hardware acceleration চালু করে browser restart দিন; তারপর আবার চেষ্টা করুন।');
      } else if (/memory|allocation|out of memory/i.test(message)) {
        setError('GPU memory যথেষ্ট নয়। অন্য heavy tab/app বন্ধ করে আবার model load করুন।');
      } else if (/fetch|network|download|http/i.test(message)) {
        setError('Model download ব্যর্থ হয়েছে। Internet connection পরীক্ষা করে আবার চেষ্টা করুন।');
      } else {
        setError(message || 'Local AI model load হয়নি। Browser compatibility ও available memory পরীক্ষা করে আবার চেষ্টা করুন।');
      }
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
          <p className={styles.modelDescription}>Small quantized Qwen model · browser WebGPU · selects an FP16 or FP32-compatible variant for your GPU.</p>
          <div className={styles.specs}>
            <span>Inference <b>On-device</b></span>
            <span>API cost <b>৳0</b></span>
            <span>Cache <b>IndexedDB</b></span>
          </div>
          <div className={styles.compat}>
            <span>WebGPU compatibility</span>
            <b className={supported === null ? styles.neutral : supported ? styles.good : styles.bad}>{supported === null ? 'Checking…' : supported ? (hasShaderF16 ? 'GPU detected · FP16' : 'GPU detected · compatibility mode') : 'Not detected'}</b>
          </div>
          <button className={styles.loadButton} onClick={loadModel} disabled={status === 'loading' || modelReady || supported === false}>
            {status === 'loading' ? 'Loading model…' : modelReady ? 'Model loaded ✓' : 'Load free AI model'}
          </button>
          {(status === 'loading' || modelReady) && <div className={styles.progressWrap}>
            <div className={styles.progressText}><span>{progress.text}</span><b>{percent}%</b></div>
            <div className={styles.progressTrack}><i style={{ width: percent + '%' }} /></div>
          </div>}
          <p className={styles.smallNote}>প্রথমবার model download করতে internet লাগবে এবং কয়েক মিনিট সময় লাগতে পারে। GPU compatibility অনুযায়ী Local AI নিজে model variant বেছে নেবে; download শেষ না হওয়া পর্যন্ত tab খোলা রাখুন.</p>
        </aside>
        <section className={styles.chatPanel}>
          <div className={styles.chatHeader}><div><b>QuickToolBox Local AI</b><small>{modelReady ? `Ready · ${activeModel.includes('q4f32') ? 'compatibility model' : 'FP16 model'}` : 'Load the model to start chatting'}</small></div><button type="button" onClick={() => setMessages([])} disabled={!messages.length || busy}>Clear chat</button></div>
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
