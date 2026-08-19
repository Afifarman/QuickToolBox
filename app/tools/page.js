'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { utilityTools, aiTools, studentTools } from '../../lib/tools';

const GROUPS = [
  { key: 'utility', label: '🧰 Utility Tools', base: '/tools', items: utilityTools },
  { key: 'student', label: '🎓 Student Tools', base: '/student-tools', items: studentTools },
  { key: 'ai', label: '🤖 AI Tools', base: '', items: aiTools },
];

export default function ToolsPage() {
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    return GROUPS.map((g) => ({
      ...g,
      items: term
        ? g.items.filter(([slug, , title, desc]) =>
            `${slug} ${title} ${desc}`.toLowerCase().includes(term))
        : g.items,
    }));
  }, [q]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/ai">AI</Link><Link href="/cv-maker">CV Maker</Link><Link href="/dashboard">Dashboard</Link></nav>
      </header>

      <main className="page">
        <small>ALL TOOLS</small>
        <h1>Every QuickToolBox tool</h1>
        <p>{utilityTools.length + studentTools.length + aiTools.length} free tools. No signup, nothing to install — everything runs in your browser.</p>

        <input
          className="search"
          placeholder="🔍 Search tools… (e.g. PDF, GPA, QR, password)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {total === 0 && <div className="empty">No tools match “{q}”. Try a different word.</div>}

        {groups.map((g) => g.items.length > 0 && (
          <section key={g.key}>
            <h2>{g.label} <span style={{ color: '#64748b', fontWeight: 500, fontSize: 15 }}>({g.items.length})</span></h2>
            <div className="grid">
              {g.items.map(([slug, icon, title, desc]) => (
                <Link className="card" href={g.base ? `${g.base}/${slug}` : `/${slug}`} key={`${g.key}-${slug}`}>
                  <i>{icon}</i>
                  <div><h3>{title}</h3><p>{desc}</p></div>
                  <strong>→</strong>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer>© 2026 QuickToolBox <span>All tools are free.</span></footer>
    </>
  );
}
