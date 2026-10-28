'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeControls from '../../components/ThemeControls';
import { useSiteTheme } from '../providers';

const agents = [
  { id: 'general', name: 'General Planner', emoji: '🧭', description: 'Break any goal into practical steps.' },
  { id: 'study', name: 'Study Agent', emoji: '📚', description: 'Notes, revision plans, quizzes and study schedules.' },
  { id: 'seo', name: 'SEO Agent', emoji: '🔎', description: 'Technical SEO, page titles, sitemap and content ideas.' },
  { id: 'coding', name: 'Coding Helper', emoji: '💻', description: 'Debugging plans, code explanations and safe test steps.' },
  { id: 'content', name: 'Content Agent', emoji: '✍️', description: 'Draft posts, descriptions, scripts and ideas.' },
  { id: 'research', name: 'Research Agent', emoji: '🧪', description: 'Compare options, summarize evidence and plan research.' },
];
const agentInstructions = {
  general: 'Act as a general-purpose planning assistant. Prioritize tasks and adapt the plan when something fails.',
  study: 'Act as a student study coach. Explain simply, create concise notes, a realistic study schedule, active-recall questions and an answer key. Do not invent facts.',
  seo: 'Act as an SEO assistant. Prioritize crawlability, unique metadata, useful content, canonical URLs, sitemap/robots, performance and verification. Do not claim Google rankings or indexing are guaranteed.',
  coding: 'Act as a coding helper. Explain the likely cause, propose minimal safe changes, tests and rollback steps. Never claim code was changed or tested unless tools actually did that.',
  content: 'Act as a content creator. Produce useful, original drafts suited to the requested platform and audience; label assumptions and avoid fabricated claims.',
  research: 'Act as a research planner. Separate established facts, uncertainty and next checks; suggest credible sources and a comparison framework.',
};
const examples = ['Make the website easier to use on mobile', 'Create a 7-day study plan for my exam', 'Improve QuickToolBox SEO safely', 'Switch to dark mode and use violet accents'];

export default function AgentPage() {
  const { mode, accent, setMode, setAccent, themes } = useSiteTheme();
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [goal, setGoal] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('idle');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState([]);
  const [checking, setChecking] = useState(false);

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
      'You are the QuickToolBox free multi-agent workspace. ' + agentInstructions[selectedAgent],
      'Do not claim to have changed website source code, deployed code, tested APIs, or accessed external systems.',
      'You may only directly apply website appearance preferences when requested. For all other work, provide clear steps and explain which access or approval is needed.',
      'Return a short plan with: Goal, prioritized steps (numbered), first action, verification, and how to re-plan if a step fails.',
      'Previous task context (may be empty): ' + (previous || 'None'),
      'Selected agent: ' + agents.find(item => item.id === selectedAgent)?.name + '.',
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

  async function runDiagnostics() {
    if (checking) return;
    setChecking(true);
    setDiagnostics([]);
    const checks = [
      { name: 'Homepage', path: '/' },
      { name: 'AI Assistant page', path: '/ai' },
      { name: 'AI Agent page', path: '/agent' },
      { name: 'Tools page', path: '/tools' },
      { name: 'AI API availability', path: '/api/ai' },
      { name: 'Robots.txt', path: '/robots.txt' },
      { name: 'Sitemap.xml', path: '/sitemap.xml' },
    ];
    const results = await Promise.all(checks.map(async check => {
      try {
        const response = await fetch(check.path, { cache: 'no-store' });
        let detail = response.status + ' ' + response.statusText;
        if (check.path === '/api/ai' && response.ok) {
          const data = await response.json();
          detail += data.available ? ' · provider key configured' : ' · no AI provider detected';
        } else if (check.path === '/sitemap.xml' && response.ok) {
          const body = await response.text();
          detail += ' · ' + (body.match(/<url>/g) || []).length + ' URLs detected';
        } else if (check.path === '/robots.txt' && response.ok) {
          const body = await response.text();
          detail += body.toLowerCase().includes('sitemap') ? ' · sitemap reference found' : ' · no sitemap reference found';
        }
        return { ...check, ok: response.ok, detail };
      } catch {
        return { ...check, ok: false, detail: 'Request failed in this browser' };
      }
    }));
    setDiagnostics(results);
    setChecking(false);
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
        <span className="qt-agent-eyebrow">FREE MULTI-AGENT WORKSPACE · USER-CONTROLLED THEMES</span>
        <h1>Meet your <span>Free AI Agents</span></h1>
        <p>Choose a specialist for studying, SEO, coding, content or research. Agents use the site's existing AI API and can change the local theme when you ask.</p>
      </section>
      <section className="qt-agent-layout">
        <div className="qt-agent-panel">
          <div className="qt-panel-title"><div><span className="qt-agent-orb">✦</span><h2>Choose a free AI agent</h2></div><ThemeControls /></div>
          <div className="qt-agent-grid" role="list" aria-label="Available AI agents">
            {agents.map(agent => <button type="button" role="listitem" key={agent.id} className={selectedAgent === agent.id ? 'qt-agent-choice is-selected' : 'qt-agent-choice'} aria-pressed={selectedAgent === agent.id} onClick={() => setSelectedAgent(agent.id)}><span>{agent.emoji}</span><b>{agent.name}</b><small>{agent.description}</small></button>)}
          </div>
          <div className="qt-agent-diagnostics">
            <div><h3>Live website check</h3><p>Runs real read-only checks against this website. It does not change production settings.</p></div>
            <button className="btn" type="button" onClick={runDiagnostics} disabled={checking}>{checking ? 'Checking live site…' : 'Run live checks'}</button>
            {diagnostics.length > 0 && <ul aria-live="polite">{diagnostics.map(item => <li key={item.path} className={item.ok ? 'qt-check-ok' : 'qt-check-fail'}><span>{item.ok ? '✓' : '✕'} {item.name}</span><small>{item.detail}</small></li>)}</ul>}
          </div>
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
