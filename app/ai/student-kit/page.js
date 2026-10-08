'use client';

import Link from 'next/link';
import { useState } from 'react';
import { KIT_TABS, SOURCE_LABEL, askAI, kitPrompt, localStudentKit } from '../../../lib/ai-tools';

const FIELDS = {
  homework: [
    ['question', 'Homework question *', 'e.g. Why does the moon change shape?', true],
    ['subject', 'Subject', 'e.g. Science', false],
    ['level', 'Level', 'e.g. Class 8', false],
  ],
  essay: [
    ['topic', 'Essay topic *', 'e.g. Should phones be allowed in school?', true],
    ['level', 'Level', 'e.g. Class 10', false],
    ['length', 'Length guide', 'e.g. 5 paragraphs / 800 words', false],
  ],
  math: [
    ['problem', 'Math problem *', 'e.g. 2x + 4 = 10  |  15% of 240', true],
  ],
  citation: [
    ['source', 'Source details *', 'author | title | year | site/publisher', true],
  ],
  feedback: [
    ['draft', 'Paste your draft *', 'Paste the assignment text you want reviewed…', true],
  ],
  schedule: [
    ['subjects', 'Subjects *', 'e.g. Math, Physics, English', true],
    ['hours', 'Hours per day', 'e.g. 3', false],
    ['goal', 'Goal', 'e.g. board exam revision', false],
  ],
};

export default function StudentKitPage() {
  const [tab, setTab] = useState('homework');
  const [values, setValues] = useState({});
  const [answer, setAnswer] = useState('');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const fields = FIELDS[tab] || FIELDS.homework;

  function setValue(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function generate() {
    const required = fields.find((f) => f[3]);
    if (required && !String(values[required[0]] || '').trim()) return;
    if (busy) return;
    setBusy(true);
    setAnswer('');
    setSource('');
    setCopied(false);
    const { text, source: used } = await askAI(
      kitPrompt(tab, values),
      () => localStudentKit(tab, values)
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
        <small>🤖 AI STUDENT TOOL</small>
        <h1>AI Student Toolkit</h1>
        <p>
          Homework help, essay drafts, step-by-step math, citations, assignment feedback and study schedules — one AI
          toolkit built for students.
        </p>

        <div className="ai-templates">
          {KIT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ai-chip${tab === t.id ? ' active' : ''}`}
              onClick={() => {
                setTab(t.id);
                setAnswer('');
                setSource('');
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ai-form">
          {fields.map(([key, label, placeholder]) => (
            <label key={key}>
              {label}
              {key === 'draft' || key === 'question' ? (
                <textarea
                  rows={key === 'draft' ? 6 : 3}
                  value={values[key] || ''}
                  onChange={(e) => setValue(key, e.target.value)}
                  placeholder={placeholder}
                />
              ) : (
                <input
                  value={values[key] || ''}
                  onChange={(e) => setValue(key, e.target.value)}
                  placeholder={placeholder}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') generate();
                  }}
                />
              )}
            </label>
          ))}
        </div>

        <div className="ai-actions" style={{ marginTop: 14 }}>
          <button className="btn" type="button" onClick={generate} disabled={busy}>
            {busy ? 'Working…' : 'Generate with AI →'}
          </button>
          <button
            className="btn light"
            type="button"
            onClick={() => {
              setValues({});
              setAnswer('');
              setSource('');
            }}
          >
            Clear
          </button>
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
          <h2 style={{ fontSize: 22 }}>🎓 Study smarter</h2>
          <div className="features" style={{ marginTop: 12 }}>
            <div>
              <b>Understand, don&apos;t copy</b>
              <p>Use homework help to learn the method — then solve the next problem yourself.</p>
            </div>
            <div>
              <b>Draft, then improve</b>
              <p>Generate an essay structure, add your own evidence, then run it through Assignment Feedback.</p>
            </div>
            <div>
              <b>Plan the week</b>
              <p>A realistic schedule with breaks beats last-minute cramming every time.</p>
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
