'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LEARN_MODES, SOURCE_LABEL, askAI, learnPrompt, localLearning } from '../../../lib/ai-tools';

const LEVELS = ['School', 'College', 'Beginner', 'Advanced'];

export default function AILearningPage() {
  const [mode, setMode] = useState('explain');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('School');
  const [answer, setAnswer] = useState('');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    const value = topic.trim();
    if (!value || busy) return;
    setBusy(true);
    setAnswer('');
    setSource('');
    setCopied(false);
    const { text, source: used } = await askAI(
      learnPrompt(mode, value, level),
      () => localLearning(mode, value, level)
    );
    setAnswer(text);
    setSource(used);
    setBusy(false);
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
          <Link href="/ai">AI Tools</Link>
          <Link href="/student-tools">Student tools</Link>
          <Link href="/">← All tools</Link>
        </nav>
      </header>
      <main className="ai-page">
        <small>🤖 AI LEARNING</small>
        <h1>AI Learning Assistant</h1>
        <p>
          Learn anything faster. Get simple explanations, full lessons, quizzes, flashcards and study plans — powered
          by AI when a provider is configured, with a built-in study engine as fallback.
        </p>

        <div className="ai-templates">
          {LEARN_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`ai-chip${mode === m.id ? ' active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <textarea
          rows={7}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate();
          }}
          placeholder={
            mode === 'summary'
              ? 'Paste your study notes here…'
              : 'Enter a topic — e.g. “Photosynthesis”, “Newton’s laws”, “French Revolution”…'
          }
        />

        <div className="ai-actions" style={{ marginTop: 12 }}>
          <span className="ai-count">Level:</span>
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              className={`ai-chip${level === l ? ' active' : ''}`}
              onClick={() => setLevel(l)}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="ai-actions" style={{ marginTop: 14 }}>
          <button className="btn" type="button" onClick={generate} disabled={busy || !topic.trim()}>
            {busy ? 'Learning…' : 'Learn with AI →'}
          </button>
          <button
            className="btn light"
            type="button"
            onClick={() => {
              setTopic('');
              setAnswer('');
              setSource('');
            }}
          >
            Clear
          </button>
          <span className="ai-count">{topic.trim().length} characters</span>
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

        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22 }}>🎯 How to study with this tool</h2>
          <div className="features" style={{ marginTop: 12 }}>
            <div>
              <b>1. Understand</b>
              <p>Start with “Explain simply” until you can say the idea in your own words.</p>
            </div>
            <div>
              <b>2. Practice</b>
              <p>Switch to “Quiz” and “Flashcards” — active recall beats re-reading.</p>
            </div>
            <div>
              <b>3. Plan</b>
              <p>Use “Study plan” to spread the topic across your week with daily self-checks.</p>
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
