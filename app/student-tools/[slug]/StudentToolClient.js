'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {recordVisit,isFavorite,toggleFavorite} from '../../../lib/usage';
import QRCode from 'qrcode';

/* ------------------------------ helpers ------------------------------ */

function useLocalList(slug) {
  const key = `qtb-student-${slug}`;
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(saved)) setItems(saved);
    } catch {}
  }, [key]);
  const save = useCallback(
    (next) => {
      setItems(next);
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    },
    [key]
  );
  return [items, save];
}

const Result = ({ children }) =>
  children ? <pre className="result" style={{ whiteSpace: 'pre-wrap', margin: '16px 0 0', fontFamily: 'inherit' }}>{children}</pre> : null;

const num = (v) => {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
};

/* --------------------------- text-input tools --------------------------- */

function TextTool({ slug, placeholder, rows = 8, action, label = 'Run tool', help }) {
  const [text, setText] = useState('');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      setOut(await action(text));
    } catch (e) {
      setOut(e?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="box">
      <textarea rows={rows} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
      <button className="btn" onClick={run} disabled={busy}>{busy ? 'Working…' : label}</button>
      {help && <p className="print-help">{help}</p>}
      <Result>{out}</Result>
    </div>
  );
}

/* ------------------------------ calculators ------------------------------ */

function parseGpaRows(text) {
  const rows = [];
  text.split(/[\n,]+/).forEach((line) => {
    const t = line.trim();
    if (!t) return;
    const [c, g] = t.split(/[:|\s]+/).map(num);
    if (c > 0 && Number.isFinite(g)) rows.push({ c, g });
  });
  return rows;
}

function GpaTool() {
  const [rows, setRows] = useState([
    { id: 1, name: 'Course 1', credit: 3, grade: 4 },
    { id: 2, name: 'Course 2', credit: 3, grade: 3.5 },
  ]);
  const result = useMemo(() => {
    let c = 0, p = 0;
    rows.forEach((r) => {
      const cr = num(r.credit), gp = num(r.grade);
      if (cr > 0 && Number.isFinite(gp)) { c += cr; p += cr * gp; }
    });
    return c ? { gpa: p / c, credits: c, points: p } : null;
  }, [rows]);

  const update = (id, field, v) => setRows(rows.map((r) => (r.id === id ? { ...r, [field]: v } : r)));

  return (
    <div className="box">
      <h2>Your courses</h2>
      {rows.map((r) => (
        <div className="row" key={r.id}>
          <label className="field"><span>Course</span>
            <input value={r.name} onChange={(e) => update(r.id, 'name', e.target.value)} /></label>
          <label className="field"><span>Credits</span>
            <input type="number" min="0" step="0.5" value={r.credit} onChange={(e) => update(r.id, 'credit', e.target.value)} /></label>
          <label className="field"><span>Grade point</span>
            <input type="number" min="0" max="5" step="0.01" value={r.grade} onChange={(e) => update(r.id, 'grade', e.target.value)} /></label>
        </div>
      ))}
      <button className="btn light" onClick={() => setRows([...rows, { id: Date.now(), name: `Course ${rows.length + 1}`, credit: 3, grade: 4 }])}>+ Add course</button>
      {rows.length > 1 && <button className="btn light" onClick={() => setRows(rows.slice(0, -1))}>− Remove last</button>}
      {result
        ? <div className="result">GPA / CGPA: {result.gpa.toFixed(2)} — {result.credits} credits, {result.points.toFixed(2)} grade points</div>
        : <div className="result">Enter credits and grade points to see your GPA.</div>}
    </div>
  );
}

function GradeTool() {
  const [marks, setMarks] = useState('');
  const [total, setTotal] = useState('100');
  const m = num(marks), t = num(total);
  const ok = Number.isFinite(m) && t > 0;
  const pct = ok ? (m / t) * 100 : 0;
  const grade = pct >= 80 ? 'A+ (4.00)' : pct >= 75 ? 'A (3.75)' : pct >= 70 ? 'A- (3.50)' : pct >= 65 ? 'B+ (3.25)'
    : pct >= 60 ? 'B (3.00)' : pct >= 55 ? 'B- (2.75)' : pct >= 50 ? 'C+ (2.50)' : pct >= 45 ? 'C (2.25)'
    : pct >= 40 ? 'D (2.00)' : 'F (0.00)';
  return (
    <div className="box">
      <div className="row">
        <label className="field"><span>Marks obtained</span><input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="e.g. 78" /></label>
        <label className="field"><span>Total marks</span><input type="number" value={total} onChange={(e) => setTotal(e.target.value)} /></label>
      </div>
      {ok
        ? <div className="result">{pct.toFixed(2)}% — Grade {grade}</div>
        : <div className="result">Enter marks and total marks.</div>}
    </div>
  );
}

function StudyTimeTool() {
  const [hours, setHours] = useState('40');
  const [days, setDays] = useState('10');
  const h = num(hours), d = num(days);
  const ok = h > 0 && d > 0;
  return (
    <div className="box">
      <div className="row">
        <label className="field"><span>Total study hours needed</span><input type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></label>
        <label className="field"><span>Days available</span><input type="number" value={days} onChange={(e) => setDays(e.target.value)} /></label>
      </div>
      {ok ? (
        <div className="result">
          {(h / d).toFixed(2)} hours per day ({Math.round((h / d) * 60)} minutes) — about {Math.ceil((h / d) / 0.75)} Pomodoro blocks daily.
        </div>
      ) : <div className="result">Enter hours and days.</div>}
    </div>
  );
}

function BudgetTool() {
  const [income, setIncome] = useState('10000');
  const [rows, setRows] = useState([
    { id: 1, name: 'Food', amount: 3000 },
    { id: 2, name: 'Transport', amount: 1200 },
    { id: 3, name: 'Books & supplies', amount: 800 },
  ]);
  const spent = rows.reduce((a, r) => a + (num(r.amount) || 0), 0);
  const bal = (num(income) || 0) - spent;
  const update = (id, field, v) => setRows(rows.map((r) => (r.id === id ? { ...r, [field]: v } : r)));
  return (
    <div className="box">
      <label className="field"><span>Monthly income / allowance</span><input type="number" value={income} onChange={(e) => setIncome(e.target.value)} /></label>
      <h2>Expenses</h2>
      {rows.map((r) => (
        <div className="row" key={r.id}>
          <label className="field"><span>Item</span><input value={r.name} onChange={(e) => update(r.id, 'name', e.target.value)} /></label>
          <label className="field"><span>Amount</span><input type="number" value={r.amount} onChange={(e) => update(r.id, 'amount', e.target.value)} /></label>
        </div>
      ))}
      <button className="btn light" onClick={() => setRows([...rows, { id: Date.now(), name: 'New expense', amount: 0 }])}>+ Add expense</button>
      <div className="result">Total expenses: {spent.toFixed(2)} | Balance: {bal.toFixed(2)} {bal < 0 ? '⚠️ over budget' : '✅ within budget'}</div>
    </div>
  );
}

/* --------------------------- scientific calculator --------------------------- */

const MATH_FNS = {
  sin: (x) => Math.sin(x), cos: (x) => Math.cos(x), tan: (x) => Math.tan(x),
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  log: Math.log10, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs,
  round: Math.round, floor: Math.floor, ceil: Math.ceil, exp: Math.exp,
};

function evaluateExpression(raw) {
  const expr = String(raw).trim();
  if (!expr) throw new Error('Enter an expression, e.g. 2^10 + sqrt(144)');
  if (!/^[0-9+\-*/^().,%\s a-zA-Z]+$/.test(expr)) throw new Error('Unsupported characters in expression.');
  let js = expr.replace(/\^/g, '**').replace(/π|\bpi\b/gi, 'Math.PI').replace(/\be\b/g, 'Math.E');
  js = js.replace(/([a-zA-Z]+)\s*\(/g, (m, name) => {
    const fn = name.toLowerCase();
    if (fn in MATH_FNS) return `__f.${fn}(`;
    throw new Error(`Unknown function: ${name}`);
  });
  if (/[a-zA-Z_$]/.test(js.replace(/__f\.\w+/g, '').replace(/Math\.\w+/g, ''))) {
    throw new Error('Unsupported name in expression.');
  }
  // eslint-disable-next-line no-new-func
  const value = Function('__f', `"use strict";return (${js});`)(MATH_FNS);
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Result is not a finite number.');
  return value;
}

function ScientificTool() {
  const [expr, setExpr] = useState('2^10 + sqrt(144)');
  const [out, setOut] = useState('');
  function go() {
    try { setOut(String(evaluateExpression(expr))); }
    catch (e) { setOut(e.message); }
  }
  return (
    <div className="box">
      <label className="field"><span>Expression</span>
        <input value={expr} onChange={(e) => setExpr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} /></label>
      <p className="print-help">Supports + − × ÷, ^, brackets, %, sqrt, log, ln, sin, cos, tan, abs, round, pi, e.</p>
      <button className="btn" onClick={go}>Calculate</button>
      {out && <div className="result">{out}</div>}
    </div>
  );
}

function MathSolverTool() {
  const [q, setQ] = useState('15% of 240');
  const [out, setOut] = useState('');
  function go() {
    const x = q.trim();
    const pct = x.match(/([\d.]+)\s*%\s*of\s*([\d.]+)/i);
    const eq = x.match(/^\s*([\d.]*)\s*x\s*([+-])\s*([\d.]+)\s*=\s*([\d.]+)\s*$/i);
    const eq2 = x.match(/^\s*([\d.]*)\s*x\s*=\s*([\d.]+)\s*$/i);
    if (pct) return setOut(`${pct[1]}% of ${pct[2]} = ${(Number(pct[1]) * Number(pct[2])) / 100}`);
    if (eq) {
      const a = Number(eq[1] || 1), b = (eq[2] === '+' ? 1 : -1) * Number(eq[3]), c = Number(eq[4]);
      return setOut(a ? `x = ${((c - b) / a).toFixed(4).replace(/\.?0+$/, '')}` : 'No solution (coefficient is 0).');
    }
    if (eq2) {
      const a = Number(eq2[1] || 1), c = Number(eq2[2]);
      return setOut(a ? `x = ${(c / a).toFixed(4).replace(/\.?0+$/, '')}` : 'No solution (coefficient is 0).');
    }
    try { setOut(`= ${evaluateExpression(x)}`); }
    catch { setOut('Try "15% of 240", "2x + 4 = 10", or an expression like 12*8+5.'); }
  }
  return (
    <div className="box">
      <label className="field"><span>Problem</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} /></label>
      <button className="btn" onClick={go}>Solve</button>
      {out && <div className="result">{out}</div>}
    </div>
  );
}

/* ------------------------------ pomodoro ------------------------------ */

function PomodoroTool() {
  const PRESETS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const [mode, setMode] = useState('focus');
  const [seconds, setSeconds] = useState(PRESETS.focus);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (seconds !== 0 || !running) return;
    setRunning(false);
    if (mode === 'focus') setRounds((r) => r + 1);
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.frequency.value = 880; osc.connect(gain); gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        osc.start(); osc.stop(ctx.currentTime + 1);
      }
    } catch {}
  }, [seconds, running, mode]);

  const pick = (m) => { setMode(m); setSeconds(PRESETS[m]); setRunning(false); };
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="box" style={{ textAlign: 'center' }}>
      <div className="toggle-row" style={{ justifyContent: 'center' }}>
        <button className={`chip${mode === 'focus' ? ' active' : ''}`} onClick={() => pick('focus')}>Focus 25:00</button>
        <button className={`chip${mode === 'short' ? ' active' : ''}`} onClick={() => pick('short')}>Short break 5:00</button>
        <button className={`chip${mode === 'long' ? ' active' : ''}`} onClick={() => pick('long')}>Long break 15:00</button>
      </div>
      <div style={{ fontSize: 'clamp(56px,16vw,104px)', fontWeight: 850, letterSpacing: '-.04em', margin: '14px 0', fontVariantNumeric: 'tabular-nums' }}>
        {mm}:{ss}
      </div>
      <button className="btn" onClick={() => setRunning(!running)}>{running ? '⏸ Pause' : '▶ Start'}</button>
      <button className="btn light" onClick={() => { setSeconds(PRESETS[mode]); setRunning(false); }}>↺ Reset</button>
      <p className="print-help">Completed focus sessions: <b>{rounds}</b></p>
    </div>
  );
}

/* ------------------------------ list tools ------------------------------ */

function TaskTool({ slug, withDeadline }) {
  const [items, save] = useLocalList(slug);
  const [text, setText] = useState('');
  const [deadline, setDeadline] = useState('');
  const add = () => {
    if (!text.trim()) return;
    save([...items, { id: Date.now(), text: text.trim(), deadline, done: false }]);
    setText(''); setDeadline('');
  };
  const done = items.filter((i) => i.done).length;
  return (
    <div className="box">
      <div className="row">
        <label className="field"><span>Task</span>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="e.g. Physics assignment 3" /></label>
        {withDeadline && (
          <label className="field"><span>Deadline</span>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
        )}
      </div>
      <button className="btn" onClick={add}>Add</button>
      {items.length > 0 && <p className="print-help">{done} of {items.length} completed. Saved on this device.</p>}
      <ul className="list">
        {items.map((it) => (
          <li key={it.id}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 18, height: 18 }} checked={!!it.done}
                onChange={() => save(items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))} />
              <span style={{ textDecoration: it.done ? 'line-through' : 'none', opacity: it.done ? 0.6 : 1 }}>
                {it.text}{it.deadline ? ` — due ${it.deadline}` : ''}
              </span>
            </label>
            <button className="chip" onClick={() => save(items.filter((x) => x.id !== it.id))}>Delete</button>
          </li>
        ))}
      </ul>
      {!items.length && <div className="empty">No tasks yet. Add your first one above.</div>}
    </div>
  );
}

function NotesOrganizerTool({ slug }) {
  const [items, save] = useLocalList(slug);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const add = () => {
    if (!subject.trim() && !body.trim()) return;
    save([{ id: Date.now(), subject: subject.trim() || 'Untitled', body: body.trim() }, ...items]);
    setSubject(''); setBody('');
  };
  return (
    <div className="box">
      <label className="field"><span>Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Chemistry — Chapter 4" /></label>
      <label className="field"><span>Notes</span>
        <textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write or paste your notes…" /></label>
      <button className="btn" onClick={add}>Save note</button>
      <ul className="list">
        {items.map((n) => (
          <li key={n.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <b>{n.subject}</b>
              <button className="chip" onClick={() => save(items.filter((x) => x.id !== n.id))}>Delete</button>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0', color: '#475467' }}>{n.body}</p>
          </li>
        ))}
      </ul>
      {!items.length && <div className="empty">No notes saved yet.</div>}
    </div>
  );
}

function FlashcardTool({ slug }) {
  const [items, save] = useLocalList(slug);
  const [text, setText] = useState('What is photosynthesis? :: The process plants use to convert light into energy.');
  const [flipped, setFlipped] = useState({});
  const build = () => {
    const cards = text.split(/\n+/).filter(Boolean).map((line, i) => {
      const [q, a] = line.split(/\s*::\s*/);
      return { id: Date.now() + i, q: (q || line).trim(), a: (a || 'Add an answer after "::"').trim() };
    });
    save(cards); setFlipped({});
  };
  return (
    <div className="box">
      <label className="field"><span>One card per line — use <code>Question :: Answer</code></span>
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <button className="btn" onClick={build}>Create flashcards</button>
      {items.length > 0 && <p className="print-help">Tap a card to flip it. {items.length} cards saved.</p>}
      <div className="grid" style={{ marginTop: 14 }}>
        {items.map((c) => (
          <button className="card" key={c.id} style={{ textAlign: 'left', cursor: 'pointer', gridTemplateColumns: '1fr' }}
            onClick={() => setFlipped({ ...flipped, [c.id]: !flipped[c.id] })}>
            <div>
              <h3 style={{ fontSize: 15 }}>{flipped[c.id] ? 'Answer' : 'Question'}</h3>
              <p>{flipped[c.id] ? c.a : c.q}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ timetable ------------------------------ */

function TimetableTool() {
  const [subjects, setSubjects] = useState('Math\nPhysics\nEnglish\nChemistry');
  const [hours, setHours] = useState('3');
  const [out, setOut] = useState('');
  function go() {
    const list = subjects.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (!list.length) return setOut('Add at least one subject.');
    const perDay = Math.max(1, num(hours) || 1);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const slotLen = perDay / Math.min(list.length, 3);
    let idx = 0;
    const plan = days.map((day) => {
      const todays = [];
      for (let i = 0; i < Math.min(list.length, 3); i += 1) { todays.push(list[idx % list.length]); idx += 1; }
      let start = 17;
      const lines = todays.map((s) => {
        const from = start; start += slotLen;
        const fmt = (h) => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
        return `   ${fmt(from)}–${fmt(start)}  ${s}`;
      });
      return `${day}\n${lines.join('\n')}`;
    });
    setOut(`Weekly study plan — ${perDay} hour(s) per day\n\n${plan.join('\n\n')}`);
  }
  return (
    <div className="box">
      <div className="row">
        <label className="field"><span>Subjects (one per line)</span>
          <textarea rows={6} value={subjects} onChange={(e) => setSubjects(e.target.value)} /></label>
        <label className="field"><span>Study hours per day</span>
          <input type="number" min="1" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} /></label>
      </div>
      <button className="btn" onClick={go}>Generate timetable</button>
      <Result>{out}</Result>
    </div>
  );
}

/* ------------------------------ countdown ------------------------------ */

function CountdownTool() {
  const [when, setWhen] = useState('');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = when ? new Date(when).getTime() : NaN;
  const diff = Number.isFinite(target) ? target - now : NaN;
  return (
    <div className="box">
      <label className="field"><span>Exam date and time</span>
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
      {!when && <div className="result">Pick your exam date to start the countdown.</div>}
      {when && !Number.isFinite(target) && <div className="result">That date is not valid.</div>}
      {when && Number.isFinite(diff) && (
        <div className="result">
          {diff <= 0 ? '🎓 Exam time has arrived. Good luck!' : (
            <>
              {Math.floor(diff / 86400000)} days, {Math.floor((diff % 86400000) / 3600000)} hours,{' '}
              {Math.floor((diff % 3600000) / 60000)} minutes, {Math.floor((diff % 60000) / 1000)} seconds remaining
              <div style={{ fontWeight: 500, marginTop: 6 }}>
                That is about {Math.ceil(diff / 86400000)} study day(s) — roughly {Math.max(1, Math.round((diff / 86400000) * 2))} focused sessions if you study 2 per day.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ file / QR tools ------------------------------ */

function PdfExtractTool() {
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setOut('Reading file…');
    try {
      if (f.type === 'application/pdf') {
        const buf = new Uint8Array(await f.arrayBuffer());
        let raw = '';
        for (let i = 0; i < buf.length; i += 1) raw += String.fromCharCode(buf[i]);
        const chunks = [];
        const re = /\((?:\\.|[^\\()])*\)/g;
        let m;
        while ((m = re.exec(raw))) {
          const s = m[0].slice(1, -1).replace(/\\([()\\])/g, '$1').replace(/\\[rn]/g, ' ');
          if (/[A-Za-z0-9]/.test(s)) chunks.push(s);
        }
        const text = chunks.join(' ').replace(/\s{2,}/g, ' ').trim();
        setOut(text
          ? text.slice(0, 20000)
          : 'No selectable text found. This PDF is likely a scanned image — extraction needs OCR, which runs outside the browser.');
      } else {
        setOut((await f.text()).slice(0, 20000) || 'The file is empty.');
      }
    } catch {
      setOut('Could not read this file.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="box">
      <label className="upload">Choose a PDF or text file
        <input type="file" accept="application/pdf,text/plain,.txt,.md" onChange={onFile} /></label>
      <p className="print-help">Works with text-based PDFs. Scanned/image PDFs need OCR and cannot be extracted here.</p>
      {busy && <div className="result">Working…</div>}
      <Result>{!busy ? out : ''}</Result>
    </div>
  );
}

function NotesQrTool() {
  const [value, setValue] = useState('');
  const [img, setImg] = useState('');
  const [msg, setMsg] = useState('');
  async function make() {
    const v = value.trim();
    if (!v) { setMsg('Enter a link or text first.'); setImg(''); return; }
    try {
      setImg(await QRCode.toDataURL(v, { width: 512, margin: 2 }));
      setMsg('');
    } catch { setMsg('Could not create a QR code for this text.'); }
  }
  return (
    <div className="box">
      <label className="field"><span>Notes link or text</span>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://drive.google.com/…" /></label>
      <button className="btn" onClick={make}>Generate QR code</button>
      {msg && <div className="result">{msg}</div>}
      {img && (
        <div style={{ marginTop: 18 }}>
          <img src={img} alt="QR code for your notes" style={{ width: 240, maxWidth: '100%', borderRadius: 12, border: '1px solid #e5e7f2', background: '#fff' }} />
          <div><a className="btn" href={img} download="notes-qr.png">Download PNG</a></div>
        </div>
      )}
    </div>
  );
}

function TranslatorTool() {
  const [text, setText] = useState('');
  const [to, setTo] = useState('bn');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  const langs = [['bn', 'Bangla'], ['en', 'English'], ['hi', 'Hindi'], ['ar', 'Arabic'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['ja', 'Japanese']];
  async function go() {
    if (!text.trim()) { setOut('Enter text to translate.'); return; }
    setBusy(true); setOut('Translating…');
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=auto|${to}`);
      const j = await r.json();
      setOut(j?.responseData?.translatedText || 'Translation service returned no result.');
    } catch {
      setOut('Translation service is unavailable right now. Check your connection and try again.');
    } finally { setBusy(false); }
  }
  return (
    <div className="box">
      <label className="field"><span>Text to translate</span>
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste study text…" /></label>
      <label className="field"><span>Translate to</span>
        <select value={to} onChange={(e) => setTo(e.target.value)}>
          {langs.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select></label>
      <button className="btn" onClick={go} disabled={busy}>{busy ? 'Translating…' : 'Translate'}</button>
      <Result>{out}</Result>
    </div>
  );
}

function AiStudyTool() {
  const [q, setQ] = useState('');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  async function ask() {
    if (!q.trim()) { setOut('Type a study question first.'); return; }
    setBusy(true); setOut('Thinking…');
    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: `Explain clearly for a student, with short steps and an example:\n\n${q}` }),
      });
      const j = await r.json();
      setOut(j.text || j.error || 'AI response unavailable.');
    } catch { setOut('Could not reach the AI service.'); }
    finally { setBusy(false); }
  }
  return (
    <div className="box">
      <label className="field"><span>Your study question</span>
        <textarea rows={5} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Explain Newton's second law with an example…" /></label>
      <button className="btn" onClick={ask} disabled={busy}>{busy ? 'Thinking…' : 'Ask AI'}</button>
      <Result>{out}</Result>
    </div>
  );
}

/* ------------------------------ text utilities ------------------------------ */

const summarize = (s) => {
  const t = s.trim();
  if (!t) return 'Paste your notes first.';
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 2) return t;
  const freq = {};
  t.toLowerCase().match(/[a-z']+/g)?.forEach((w) => { if (w.length > 3) freq[w] = (freq[w] || 0) + 1; });
  const scored = sentences.map((sent, i) => {
    const words = sent.toLowerCase().match(/[a-z']+/g) || [];
    const score = words.reduce((a, w) => a + (freq[w] || 0), 0) / (words.length || 1);
    return { sent, i, score };
  });
  const keep = Math.max(2, Math.ceil(sentences.length / 3));
  return scored.sort((a, b) => b.score - a.score).slice(0, keep).sort((a, b) => a.i - b.i).map((x) => `• ${x.sent.trim()}`).join('\n');
};

const wordStats = (s) => {
  const words = (s.trim().match(/\S+/g) || []).length;
  const sentences = (s.match(/[^.!?]+[.!?]+/g) || []).length || (s.trim() ? 1 : 0);
  return `Words: ${words}
Characters: ${s.length}
Characters (no spaces): ${s.replace(/\s/g, '').length}
Sentences: ${sentences}
Paragraphs: ${s.trim() ? s.trim().split(/\n{2,}/).length : 0}
Lines: ${s ? s.split('\n').length : 0}
Reading time: ~${Math.max(1, Math.ceil(words / 200))} min
Speaking time: ~${Math.max(1, Math.ceil(words / 130))} min`;
};

const grammarFix = (s) => {
  if (!s.trim()) return 'Paste text to check.';
  const fixed = s
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([,;:])(?=[^\s])/g, '$1 ')
    .replace(/([.!?])(?=[A-Za-z])/g, '$1 ')
    .replace(/\bi\b/g, 'I')
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, a, b) => a + b.toUpperCase())
    .trim();
  const notes = [];
  if (/\s{2,}/.test(s)) notes.push('• Removed extra spaces');
  if (/\s+[,.!?]/.test(s)) notes.push('• Removed spaces before punctuation');
  if (/\bi\b/.test(s)) notes.push('• Capitalised the pronoun "I"');
  if (/(^|[.!?]\s+)[a-z]/.test(s)) notes.push('• Capitalised sentence starts');
  return `${fixed}\n\n${notes.length ? `Fixes applied:\n${notes.join('\n')}` : 'No common issues found.'}`;
};

const quizFrom = (s) => {
  const lines = s.split(/\n|(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.length > 12);
  if (!lines.length) return 'Paste some notes to build questions from.';
  return lines.slice(0, 12).map((line, i) => {
    const clean = line.replace(/[.?!]+$/, '');
    return `${i + 1}. ${i % 3 === 0 ? `Explain: ${clean}?` : i % 3 === 1 ? `True or false — ${clean}.` : `In your own words, describe: ${clean}?`}`;
  }).join('\n\n');
};

const outlineFrom = (topic) => {
  const t = topic.trim();
  if (!t) return 'Enter an essay topic.';
  return `Essay outline — ${t}

1. Introduction
   • Hook: an interesting fact or question about ${t}
   • Background: why ${t} matters today
   • Thesis statement: your main argument about ${t}

2. Body paragraph 1 — Main point
   • Topic sentence
   • Evidence / example
   • Explanation linking back to the thesis

3. Body paragraph 2 — Supporting point
   • Topic sentence
   • Data, quotation or case study
   • Analysis

4. Body paragraph 3 — Counter-argument
   • Opposing view on ${t}
   • Your response and why your position still holds

5. Conclusion
   • Restate the thesis in new words
   • Summarise the key points
   • Final thought or call to action`;
};

function CitationTool() {
  const [f, setF] = useState({ author: '', title: '', year: '', publisher: '', url: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const a = f.author || 'Author, A.';
  const t = f.title || 'Title of the work';
  const y = f.year || 'n.d.';
  const p = f.publisher || 'Publisher';
  const u = f.url ? ` ${f.url}` : '';
  return (
    <div className="box">
      <div className="row">
        <label className="field"><span>Author</span><input value={f.author} onChange={set('author')} placeholder="Rahman, A." /></label>
        <label className="field"><span>Year</span><input value={f.year} onChange={set('year')} placeholder="2024" /></label>
      </div>
      <label className="field"><span>Title</span><input value={f.title} onChange={set('title')} placeholder="Introduction to Physics" /></label>
      <div className="row">
        <label className="field"><span>Publisher / Website</span><input value={f.publisher} onChange={set('publisher')} placeholder="Oxford Press" /></label>
        <label className="field"><span>URL (optional)</span><input value={f.url} onChange={set('url')} placeholder="https://…" /></label>
      </div>
      <pre className="result" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
        {`APA 7:  ${a} (${y}). ${t}. ${p}.${u}

MLA 9:  ${a} "${t}." ${p}, ${y}.${u}

Chicago: ${a} "${t}." ${p}, ${y}.${u}

Harvard: ${a} (${y}) ${t}. ${p}.${u}`}
      </pre>
    </div>
  );
}

/* ------------------------------ router ------------------------------ */

function ToolBody({ slug }) {
  switch (slug) {
    case 'gpa-cgpa-calculator':
    case 'semester-result-calculator':
      return <GpaTool />;
    case 'grade-calculator': return <GradeTool />;
    case 'study-time-calculator': return <StudyTimeTool />;
    case 'student-budget-calculator': return <BudgetTool />;
    case 'scientific-calculator': return <ScientificTool />;
    case 'math-problem-solver': return <MathSolverTool />;
    case 'pomodoro-timer': return <PomodoroTool />;
    case 'assignment-planner': return <TaskTool slug={slug} withDeadline />;
    case 'assignment-checklist': return <TaskTool slug={slug} />;
    case 'study-notes-organizer': return <NotesOrganizerTool slug={slug} />;
    case 'flashcard-generator': return <FlashcardTool slug={slug} />;
    case 'study-timetable': return <TimetableTool />;
    case 'exam-countdown': return <CountdownTool />;
    case 'pdf-notes-extractor': return <PdfExtractTool />;
    case 'notes-qr-generator': return <NotesQrTool />;
    case 'student-translator': return <TranslatorTool />;
    case 'ai-study-assistant': return <AiStudyTool />;
    case 'notes-summarizer':
      return <TextTool slug={slug} placeholder="Paste your class notes here…" action={summarize} label="Summarize notes" />;
    case 'word-character-counter':
      return <TextTool slug={slug} placeholder="Paste or type your text…" action={wordStats} label="Count" />;
    case 'grammar-checker':
      return <TextTool slug={slug} placeholder="Paste text to check…" action={grammarFix} label="Check and fix" />;
    case 'quiz-generator':
      return <TextTool slug={slug} placeholder="Paste notes — one idea per line…" action={quizFrom} label="Generate questions" />;
    case 'essay-outline-generator':
      return <TextTool slug={slug} rows={3} placeholder="Enter your essay topic…" action={outlineFrom} label="Create outline" />;
    case 'citation-generator': return <CitationTool />;
    default:
      return <div className="box"><p>This tool is not available.</p></div>;
  }
}

function FavButton({ slug, title, href }) {
  const [fav, setFav] = useState(false);
  useEffect(() => { setFav(isFavorite(href)); }, [href]);
  return (
    <button className="btn light" type="button" onClick={() => setFav(toggleFavorite({ slug, title, href }))}>
      {fav ? '★ Favorited' : '☆ Favorite'}
    </button>
  );
}

export default function StudentToolClient({ slug, icon, title, desc }) {
  const href = `/student-tools/${slug}`;
  useEffect(() => { recordVisit({ slug, title, href }); }, [slug, title, href]);
  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <Link href="/student-tools">← All student tools</Link>
      </header>
      <main className="tool">
        <small>STUDENT TOOL</small>
        <div style={{ fontSize: 44, lineHeight: 1.1, marginTop: 10 }}>{icon}</div>
        <h1>{title}</h1>
        <p>{desc}</p>
        <div style={{ marginBottom: 10 }}><FavButton slug={slug} title={title} href={href} /></div>
        <ToolBody slug={slug} />
      </main>
      <footer>© 2026 QuickToolBox <span>Student tools.</span></footer>
    </>
  );
}
