'use client';

import { useEffect, useState } from 'react';
import { STUDENT_TOOLS } from '../../lib/student-tools';

export default function Favorites() {
  const [slugs, setSlugs] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('qtb_favorites') || '[]');
      setSlugs(Array.isArray(saved) ? saved.filter((slug) => STUDENT_TOOLS[slug]) : []);
    } catch {
      setSlugs([]);
    }
  }, []);

  function clear() {
    try {
      localStorage.removeItem('qtb_favorites');
    } catch {
      /* Storage may be blocked; the list is cleared for this view anyway. */
    }
    setSlugs([]);
  }

  return (
    <main className="qt-local-page">
      <a href="/student-tools">← Student Tools</a>
      <h1>Favourites</h1>
      <p>Tools you saved with the ☆ Save button. Stored in this browser only.</p>
      {slugs.length ? (
        <>
          <ul>
            {slugs.map((slug) => (
              <li key={slug}>
                <a href={`/student-tools/${slug}`}>
                  {STUDENT_TOOLS[slug].icon} {STUDENT_TOOLS[slug].title}
                </a>
              </li>
            ))}
          </ul>
          <button type="button" onClick={clear}>Clear favourites</button>
        </>
      ) : (
        <p>No favourites yet. Open a student tool and press ☆ Save to add it here.</p>
      )}
    </main>
  );
}
