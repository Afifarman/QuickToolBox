'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FAVORITES_KEY, readList, writeList } from '../../lib/usage';

export default function Favorites() {
  const [items, setItems] = useState([]);

  useEffect(() => { setItems(readList(FAVORITES_KEY)); }, []);

  function remove(href) {
    const next = items.filter((x) => x.href !== href);
    setItems(next);
    writeList(FAVORITES_KEY, next);
  }
  function clear() { writeList(FAVORITES_KEY, []); setItems([]); }

  return (
    <main className="page">
      <Link className="back-link" href="/dashboard">← Dashboard</Link>
      <h1>⭐ Favorites</h1>
      <p>Your favorite tools, saved on this device.</p>
      {items.length ? (
        <>
          <ul className="list">
            {items.map((x) => (
              <li key={x.href}>
                <Link href={x.href}>{x.title || x.slug}</Link>
                <button className="btn light" onClick={() => remove(x.href)}>Remove</button>
              </li>
            ))}
          </ul>
          <button className="btn light" onClick={clear}>Clear all favorites</button>
        </>
      ) : (
        <div className="empty">
          No favorites yet. Open any tool and press <b>☆ Favorite</b> to pin it here.
          <div style={{ marginTop: 14 }}><Link className="btn" href="/tools">Browse tools →</Link></div>
        </div>
      )}
    </main>
  );
}
