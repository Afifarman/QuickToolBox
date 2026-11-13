'use client';

import { useEffect, useState } from 'react';

export default function History() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('qtb_history') || '[]');
      setItems(Array.isArray(saved) ? saved.filter((item) => item?.slug) : []);
    } catch {
      setItems([]);
    }
  }, []);

  function clear() {
    try {
      localStorage.removeItem('qtb_history');
    } catch {
      /* Storage may be blocked; the list is cleared for this view anyway. */
    }
    setItems([]);
  }

  return (
    <main className="qt-local-page">
      <a href="/student-tools">← Student Tools</a>
      <h1>History</h1>
      <p>Student tools you opened recently on this device.</p>
      {items.length ? (
        <>
          <ul>
            {items.map((item) => (
              <li key={item.slug}>
                <a href={`/student-tools/${item.slug}`}>{item.title || item.slug}</a>
              </li>
            ))}
          </ul>
          <button type="button" onClick={clear}>Clear history</button>
        </>
      ) : (
        <p>No history yet. Open any student tool and it will appear here.</p>
      )}
    </main>
  );
}
