'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HISTORY_KEY, readList, writeList } from '../../lib/usage';

function when(ts) {
  if (!ts) return '';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(ts).toLocaleDateString();
}

export default function History() {
  const [items, setItems] = useState([]);

  useEffect(() => { setItems(readList(HISTORY_KEY)); }, []);
  function clear() { writeList(HISTORY_KEY, []); setItems([]); }

  return (
    <main className="page">
      <Link className="back-link" href="/dashboard">← Dashboard</Link>
      <h1>🕘 History</h1>
      <p>Tools you recently opened on this device.</p>
      {items.length ? (
        <>
          <ul className="list">
            {items.map((x, i) => (
              <li key={`${x.href}-${i}`}>
                <Link href={x.href}>{x.title || x.slug}</Link>
                <span style={{ color: '#64748b', fontSize: 13 }}>{when(x.at)}</span>
              </li>
            ))}
          </ul>
          <button className="btn light" onClick={clear}>Clear history</button>
        </>
      ) : (
        <div className="empty">
          No history yet — open a tool and it will show up here.
          <div style={{ marginTop: 14 }}><Link className="btn" href="/tools">Browse tools →</Link></div>
        </div>
      )}
    </main>
  );
}
