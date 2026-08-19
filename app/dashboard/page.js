'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured, AUTH_NOT_CONFIGURED } from '../../lib/supabase/client';

const LINKS = [
  ['/tools', '🧰 Tools', 'Explore all tools'],
  ['/ai', '🤖 AI Tools', 'Generate and improve content'],
  ['/cv-maker', '📄 CV Maker', '120 professional templates'],
  ['/student-tools', '🎓 Student Tools', 'GPA, planner, flashcards & more'],
  ['/favorites', '⭐ Favorites', 'Your favorite tools'],
  ['/history', '🕘 History', 'Recently used tools'],
  ['/saved', '💾 Saved Results', 'Your saved results'],
  ['/profile', '👤 Profile', 'Account settings'],
  ['/settings', '⚙️ Settings', 'Theme, language & notifications'],
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | guest

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setState('guest'); return; }
    let alive = true;
    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data?.user) { setState('guest'); return; }
        setUser(data.user);
        setState('ready');
      })
      .catch(() => { if (alive) setState('guest'); });
    return () => { alive = false; };
  }, []);

  async function logout() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (state === 'loading') {
    return <main className="page"><div className="empty">Loading your dashboard…</div></main>;
  }

  return (
    <main className="dashboard">
      <div className="dash-head">
        <div>
          <small>MY QUICKTOOLBOX</small>
          <h1>{user ? 'Welcome 👋' : 'Your toolbox'}</h1>
          <p>{user ? user.email : 'Browsing as a guest — every tool below works without an account.'}</p>
        </div>
        {user
          ? <button onClick={logout}>Logout</button>
          : <Link className="btn" href="/login">Login / Register</Link>}
      </div>

      {!user && isSupabaseConfigured() && (
        <div className="notice">You are not logged in. Log in to sync favorites and saved results across devices.</div>
      )}
      {!isSupabaseConfigured() && <div className="notice">{AUTH_NOT_CONFIGURED}</div>}

      <div className="dash-grid" style={{ marginTop: 24 }}>
        {LINKS.map(([href, title, desc]) => (
          <Link href={href} key={href}><b>{title}</b><span>{desc}</span></Link>
        ))}
      </div>
    </main>
  );
}
