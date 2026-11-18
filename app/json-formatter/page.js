'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function JsonFormatter() {
  const [input, setInput] = useState('{\n  "name": "QuickToolBox",\n  "tools": 78\n}');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indent, setIndent] = useState(2);

  function format() {
    setError('');
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, Number(indent) || 2));
    } catch (err) {
      setError(err?.message || 'Invalid JSON');
      setOutput('');
    }
  }

  function minify() {
    setError('');
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (err) {
      setError(err?.message || 'Invalid JSON');
      setOutput('');
    }
  }

  function validate() {
    setError('');
    try {
      JSON.parse(input);
      setOutput('✅ Valid JSON');
    } catch (err) {
      setError(err?.message || 'Invalid JSON');
      setOutput('');
    }
  }

  async function copy() {
    if (!output) return;
    try { await navigator.clipboard.writeText(output); } catch {}
  }

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/">← All tools</Link></nav>
      </header>
      <main className="ai-page">
        <small>{'{ }'} JSON FORMATTER</small>
        <h1>JSON Formatter & Validator</h1>
        <p>Pretty-print, minify and validate JSON directly in your browser.</p>
        <section className="result">
          <label><b>Input JSON</b></label>
          <textarea rows={10} value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} style={{ display: 'block', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #d0d5dd', width: '100%', fontFamily: 'monospace' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Indent
              <select value={indent} onChange={(e) => setIndent(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #d0d5dd' }}>
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={1}>1 space</option>
              </select>
            </label>
            <button className="btn" type="button" onClick={format}>Format</button>
            <button className="btn light" type="button" onClick={minify}>Minify</button>
            <button className="btn light" type="button" onClick={validate}>Validate</button>
            <button className="btn light" type="button" onClick={copy} disabled={!output}>Copy</button>
          </div>
          {error && <p role="alert" style={{ color: '#b42318', marginTop: 8, whiteSpace: 'pre-wrap' }}>{error}</p>}
        </section>
        {output && (
          <section className="result" style={{ marginTop: 16 }}>
            <div className="ai-result-bar"><strong>Output</strong></div>
            <div className="ai-result-body" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{output}</div>
          </section>
        )}
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}