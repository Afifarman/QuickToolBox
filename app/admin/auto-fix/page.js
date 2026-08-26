'use client';

import { useState } from 'react';

export default function AutoFixPage() {
  const [problem, setProblem] = useState('');
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);

  async function diagnose(event) {
    event?.preventDefault();
    setRunning(true);
    setEvents([]);
    try {
      const response = await fetch('/api/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      });
      if (!response.ok || !response.body) throw new Error(await response.text());
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';
        for (const chunk of chunks) {
          const line = chunk.split('\n').find((item) => item.startsWith('data: '));
          if (!line) continue;
          try { setEvents((prev) => [...prev, JSON.parse(line.slice(6))]); } catch {}
        }
      }
    } catch (error) {
      setEvents((prev) => [...prev, { type: 'error', message: error.message }]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ opacity: 0.65, marginBottom: 8 }}>QuickToolBox Engineering</p>
        <h1 style={{ fontSize: 40, margin: 0 }}>AI Auto-Fix</h1>
        <p style={{ opacity: 0.75, marginTop: 10 }}>
          Diagnose bugs, inspect the repository and prepare a safe repair. Production is never modified directly.
        </p>
      </div>

      <form onSubmit={diagnose} style={{ display: 'grid', gap: 12 }}>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Paste a Vercel/GitHub error, runtime error, or describe the broken feature…"
          rows={8}
          required
          style={{ width: '100%', padding: 16, borderRadius: 14, border: '1px solid #ccc', font: 'inherit' }}
        />
        <button disabled={running} type="submit" style={{ padding: '14px 18px', borderRadius: 12, border: 0, cursor: running ? 'wait' : 'pointer', fontWeight: 700 }}>
          {running ? 'AI diagnosing…' : 'Run AI diagnosis'}
        </button>
      </form>

      <section style={{ marginTop: 28, display: 'grid', gap: 10 }}>
        {events.map((event, index) => (
          <article key={`${event.type}-${index}`} style={{ padding: 14, borderRadius: 12, background: 'rgba(127,127,127,.08)' }}>
            <strong>{event.type}</strong>
            {event.message && <div style={{ marginTop: 5 }}>{event.message}</div>}
            {event.delta && <span>{event.delta}</span>}
            {event.output && <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(event.output, null, 2)}</pre>}
          </article>
        ))}
      </section>
    </main>
  );
}
