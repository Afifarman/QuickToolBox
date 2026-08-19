'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SAVED_KEY, readList, writeList } from '../../lib/usage';

export default function Saved() {
  const [items, setItems] = useState([]);

  useEffect(() => { setItems(readList(SAVED_KEY)); }, []);

  function remove(i) {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    writeList(SAVED_KEY, next);
  }
  function clear() { writeList(SAVED_KEY, []); setItems([]); }
  function copy(text) { navigator.clipboard?.writeText(text).catch(() => {}); }

  return (
    <main className="page">
      <Link className="back-link" href="/dashboard">← Dashboard</Link>
      <h1>💾 Saved Results</h1>
      <p>Results you saved from tools, stored in this browser.</p>
      {items.length ? (
        <>
          {items.map((x, i) => (
            <article className="card" key={i} style={{ marginBottom: 14 }}>
              <h3>{x.title || 'Saved result'}</h3>
              <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0' }}>{x.text || JSON.stringify(x, null, 2)}</pre>
              <button className="btn light" onClick={() => copy(x.text || JSON.stringify(x))}>Copy</button>
              <button className="btn light" onClick={() => remove(i)}>Delete</button>
            </article>
          ))}
          <button className="btn light" onClick={clear}>Clear all saved results</button>
        </>
      ) : (
        <div className="empty">
          Nothing saved yet. Tools with a <b>Save result</b> button will store output here.
          <div style={{ marginTop: 14 }}><Link className="btn" href="/tools">Browse tools →</Link></div>
        </div>
      )}
    </main>
  );
}
