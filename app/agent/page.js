'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeControls from '../../components/ThemeControls';
import { useSiteTheme } from '../providers';

const examples = ['Make the website easier to use on mobile', 'Plan improvements for the AI tools', 'Switch to dark mode and use violet accents'];

export default function AgentPage() {
  const { mode, accent, setMode, setAccent, themes } = useSiteTheme();
  const [goal, setGoal] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('idle');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  function applyAppearanceFromGoal(text) {
    const value = text.toLowerCase();
    let changed = [];
    if (/\b(dark mode|dark theme|night mode)\b/.test(value)) { setMode('dark'); changed.push('Dark mode'); }
    else if (/\b(light mode|light theme)\b/.test(value)) { setMode('light'); changed.push('Light mode'); }
    const found = Object.keys(themes).find(key => new RegExp('\\b' + key + '\\b', 'i').test(value) || new RegExp('\\b' + themes[key].label.split(' ')[0] + '\\b', 'i').test(value));
    if (found) { setAccent(found); changed.push(themes[found].label + ' accent'); }
    return changed;
  }

  async function runAgent(event) {
    event?.preventDefault();
    const task = goal.trim();
    if (!task || status === 'working') return;
    setStatus('working');
    setError('');
    const changes = applyAppearanceFromGoal(task);
    const previous = history.slice(-3).map(item => item.goal + ': ' + item.result).join('\n');
    const prompt = [
      'You are the QuickToolBox planning agent. Create a practical, safe, adaptive plan for the user.',
      'Do not claim to have changed website source code, deployed code, tested APIs, or accessed external systems.',
      'You may only directly apply website appearance preferences when requested. For all other work, provide clear steps and explain which access or approval is needed.',
      'Return a short plan with: Goal, prioritized steps (numbered), first action, verification, and how to re-plan if a step fails.',
      'Previous task context (may be empty): ' + (previous || 'None'),
      'Current user goal: ' + task,
      'Current appearance: mode=' + mode + ', accent=' + accent + '.'
    ].join('\n\n');
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Agent request failed.');
      const result = data.text || 'No plan was returned. Please try again.';
      setPlan(result);
      setHistory(items => [{ goal: task, result, source: data.source || 'unknown', at: new Date().toISOString(), appearance: changes }, ...items].slice(0, 8));
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Could not reach the AI service.');
      setStatus('error');
    }
  }

  function replan() {
    setGoal(current => current ? current + '\nRe-plan based on the previous result: identify the next safest useful step and how to verify it.' : '');
    setStatus('idle');
  }

  return (
    <main className="qt-agent-page">
      <header className="qt-agent-header">
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/">Home</Link><Link href="/ai">AI Assistant</Link><Link href="/tools">Tools</Link></nav>
        <ThemeControls compact />
      </header>
      <section className="qt-agent-hero">
        <span className="qt-agent-eyebrow">AUTONOMOUS PLANNING · USER-CONTROLLED THEMES</span>
        <h1>Meet your <span>QuickToolBox Agent</span></h1>
        <p>Give it a goal. It creates a plan, adapts its next steps from the conversation, and can change the site's appearance when you ask.</p>
      </section>
      <section className="qt-agent-layout">
        <div className="qt-agent-panel">
          <div className="qt-panel-title"><div><span className="qt-agent-orb">✦</span><h2>What should I work on?</h2></div><ThemeControls /></div>
          <form onSubmit={runAgent}>
            <label htmlFor="agent-goal">Your goal</label>
            <textarea id="agent-goal" rows={5} maxLength={4000} value={goal} onChange={event => setGoal(event.target.value)} placeholder="Example: Plan the next improvements for QuickToolBox, then switch to dark mode and violet accents." required />
            <div className="qt-agent-examples">{examples.map(item => <button type="button" key={item} onClick={() => setGoal(item)}>{item}</button>)}</div>
            <button className="btn qt-agent-submit" type="submit" disabled={!goal.trim() || status === 'working'}>{status === 'working' ? 'Planning…' : '✦ Plan and adapt'}</button>
          </form>
          {error && <p className="qt-agent-error" role="alert">{error}</p>}
          {plan && <div className="qt-agent-result" aria-live="polite"><div className="qt-result-heading"><h2>Agent plan</h2><span>{status === 'working' ? 'Working' : 'Ready'}</span></div><pre>{plan}</pre><button className="btn" type="button" onClick={replan}>Re-plan next step ↻</button></div>}
          <p className="qt-agent-note">Safety: this agent can plan and change your local website theme. It cannot silently edit production code, change accounts, or deploy changes from this page.</p>
        </div>
        <aside className="qt-agent-sidebar">
          <div className="qt-agent-panel"><h2>Current appearance</h2><p>These settings apply across the site on this browser.</p><div className="qt-theme-preview"><span className="qt-preview-dot" /> <div><b>{mode === 'dark' ? 'Dark mode' : 'Light mode'}</b><small>{themes[accent].label} accent</small></div></div><ThemeControls /></div>
          <div className="qt-agent-panel"><h2>Recent plans</h2>{history.length ? history.map((item, index) => <button className="qt-history-row" type="button" key={item.at + index} onClick={() => { setGoal(item.goal); setPlan(item.result); setStatus('done'); }}><b>{item.goal}</b><small>{new Date(item.at).toLocaleString()}</small></button>) : <p>Your agent's plans will appear here after the first run.</p>}</div>
        </aside>
      </section>
    </main>
  );
}
