'use client';

import { useEffect, useState } from 'react';

const KEY = 'qtb_saved';

export default function Saved() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      setItems(Array.isArray(saved) ? saved : []);
    } catch {
      setItems([]);
    }
  }, []);

  function remove(index) {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* Storage may be blocked; the list still updates for this view. */
    }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* Storage may be blocked; the list is cleared for this view anyway. */
    }
    setItems([]);
  }

  return (
    <main className="qt-local-page">
      <a href="/student-tools">← Student Tools</a>
      <h1>Saved results</h1>
      <p>Results you saved with the “Save result” button. Stored in this browser only.</p>
      {items.length ? (
        <>
          <div>
            {items.map((item, index) => (
              <article key={`${item.at || index}-${index}`} style={{ borderTop: '1px solid rgba(148,163,184,.25)', padding: '16px 0' }}>
                <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>
                  {item.slug ? <a href={`/student-tools/${item.slug}`}>{item.title || 'Saved result'}</a> : item.title || 'Saved result'}
                </h2>
                <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '0 0 10px', fontSize: 13, lineHeight: 1.6 }}>
                  {item.text || JSON.stringify(item, null, 2)}
                </pre>
                <button type="button" onClick={() => remove(index)}>Delete</button>
              </article>
            ))}
          </div>
          <button type="button" onClick={clear}>Clear saved results</button>
        </>
      ) : (
        <p>No saved results yet. Run a student tool and press “Save result” to keep the output here.</p>
      )}
    </main>
  );
}
