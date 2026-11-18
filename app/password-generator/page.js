'use client';

import Link from 'next/link';
import { useState } from 'react';

function generatePassword(length, opts) {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{};:,.<>?';
  let pool = '';
  if (opts.lower) pool += lower;
  if (opts.upper) pool += upper;
  if (opts.numbers) pool += numbers;
  if (opts.symbols) pool += symbols;
  if (!pool) return '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < length; i++) out += pool[arr[i] % pool.length];
  // ensure at least one from each selected class
  const classes = [];
  if (opts.lower) classes.push(lower);
  if (opts.upper) classes.push(upper);
  if (opts.numbers) classes.push(numbers);
  if (opts.symbols) classes.push(symbols);
  const chars = out.split('');
  classes.forEach((cls, idx) => {
    const pos = idx % length;
    const r = new Uint32Array(1);
    crypto.getRandomValues(r);
    chars[pos] = cls[r[0] % cls.length];
  });
  return chars.join('');
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ lower: true, upper: true, numbers: true, symbols: true });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  function toggle(key) {
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function make() {
    setPassword(generatePassword(Number(length) || 16, opts));
    setCopied(false);
  }

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/">← All tools</Link></nav>
      </header>
      <main className="ai-page">
        <small>🔐 PASSWORD GENERATOR</small>
        <h1>Password Generator</h1>
        <p>Generate strong, random passwords locally in your browser.</p>
        <section className="result">
          <label><b>Length: {length}</b></label>
          <input type="range" min={4} max={64} value={length} onChange={(e) => setLength(e.target.value)} style={{ width: '100%', marginTop: 8 }} />
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {[
              ['lower', 'Lowercase (a-z)'],
              ['upper', 'Uppercase (A-Z)'],
              ['numbers', 'Numbers (0-9)'],
              ['symbols', 'Symbols (!@#…)'],
            ].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={opts[key]} onChange={() => toggle(key)} />
                {label}
              </label>
            ))}
          </div>
          <button className="btn" type="button" onClick={make} style={{ marginTop: 12 }}>Generate</button>
        </section>
        {password && (
          <section className="result" style={{ marginTop: 16 }}>
            <div className="ai-result-bar">
              <strong>Password</strong>
              <button className="btn light" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <div className="ai-result-body" style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{password}</div>
          </section>
        )}
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}