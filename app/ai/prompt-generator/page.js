'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PROMPT_TYPES, SOURCE_LABEL, askAI, buildPrompt, enhancePromptLocally } from '../../../lib/ai-tools';

const STARTERS = [
  ['Image', 'image', 'A cozy reading nook with warm afternoon light'],
  ['Blog post', 'writing', 'How students can stay focused while studying'],
  ['Code', 'coding', 'A React todo list with local storage'],
  ['Lesson', 'study', 'Photosynthesis for class 8'],
  ['Ad copy', 'marketing', 'A budget-friendly study planner app'],
  ['Email', 'email', 'Asking a professor for a recommendation letter'],
];

export default function PromptGeneratorPage() {
  const [type, setType] = useState('image');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [format, setFormat] = useState('');
  const [extras, setExtras] = useState('');
  const [result, setResult] = useState('');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () => buildPrompt({ type, topic, tone, audience, format, extras }),
    [type, topic, tone, audience, format, extras]
  );

  function copyText(text) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  async function enhance() {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setResult('');
    setSource('');
    const instruction = `Improve this AI prompt. Make it more specific, structured and effective. Return only the improved prompt.\n\nPrompt to improve:\n${prompt}`;
    const { text, source: used } = await askAI(instruction, () => enhancePromptLocally(prompt, type));
    setResult(text);
    setSource(used);
    setBusy(false);
  }

  return (
    <>
      <header>
        <Link className="brand" href="/">
          <b>Q</b> QuickToolBox
        </Link>
        <nav>
          <Link href="/ai">AI Tools</Link>
          <Link href="/student-tools">Student tools</Link>
          <Link href="/">← All tools</Link>
        </nav>
      </header>
      <main className="ai-page">
        <small>🤖 AI PROMPT</small>
        <h1>AI Prompt Generator</h1>
        <p>
          Build better AI prompts in seconds. Pick a type, describe your topic, and get a structured prompt that gets
          stronger answers from any AI tool — ChatGPT, Gemini, Claude and more.
        </p>

        <div className="ai-templates">
          {PROMPT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ai-chip${type === t.id ? ' active' : ''}`}
              onClick={() => setType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ai-form">
          <label>
            Topic / goal *
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. A cozy reading nook with warm afternoon light"
            />
          </label>
          <div className="ai-form-row">
            <label>
              Tone / style
              <input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. friendly, dramatic, minimal" />
            </label>
            <label>
              Audience
              <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. class 8 students" />
            </label>
          </div>
          <div className="ai-form-row">
            <label>
              Output format
              <input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="e.g. 5 bullet points, blog post" />
            </label>
            <label>
              Extra details
              <input value={extras} onChange={(e) => setExtras(e.target.value)} placeholder="colors, length, must-include items…" />
            </label>
          </div>
        </div>

        <section className="result" style={{ marginTop: 18 }}>
          <div className="ai-result-bar">
            <strong>Your prompt</strong>
            <button className="btn light" type="button" onClick={() => copyText(prompt)}>
              Copy
            </button>
          </div>
          <div className="ai-result-body">{prompt}</div>
        </section>

        <div className="ai-actions" style={{ marginTop: 16 }}>
          <button className="btn" type="button" onClick={enhance} disabled={busy || !topic.trim()}>
            {busy ? 'Enhancing…' : '✨ Enhance with AI →'}
          </button>
          <button
            className="btn light"
            type="button"
            onClick={() => {
              setTopic('');
              setTone('');
              setAudience('');
              setFormat('');
              setExtras('');
              setResult('');
              setSource('');
            }}
          >
            Clear
          </button>
        </div>

        {result && (
          <section className="result ai-result">
            <div className="ai-result-bar">
              <strong>Enhanced prompt</strong>
              <span>{SOURCE_LABEL[source] || 'Assistant'}</span>
              <button className="btn light" type="button" onClick={() => copyText(result)}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="ai-result-body">{result}</div>
          </section>
        )}

        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22 }}>🚀 Quick starters</h2>
          <div className="ai-templates">
            {STARTERS.map(([label, t, sample]) => (
              <button
                key={label}
                type="button"
                className="ai-chip"
                onClick={() => {
                  setType(t);
                  setTopic(sample);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 22 }}>💡 Prompt tips</h2>
          <div className="features" style={{ marginTop: 12 }}>
            <div>
              <b>Be specific</b>
              <p>Name the subject, setting, style and constraints — vague prompts get vague answers.</p>
            </div>
            <div>
              <b>Set the format</b>
              <p>Ask for bullets, steps or a table so the answer arrives in the shape you need.</p>
            </div>
            <div>
              <b>Iterate</b>
              <p>Use the enhanced prompt, then ask the AI to expand the weakest part. Two rounds beat one.</p>
            </div>
          </div>
        </section>
      </main>
      <footer>
        © 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span>
      </footer>
    </>
  );
}
