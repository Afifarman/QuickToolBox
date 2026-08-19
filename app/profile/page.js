'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured, AUTH_NOT_CONFIGURED } from '../../lib/supabase/client';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [state, setState] = useState('loading');

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setState('guest'); return; }
    let alive = true;
    supabase.auth.getUser()
      .then(({ data }) => {
        if (!alive) return;
        if (!data?.user) { setState('guest'); return; }
        setUser(data.user);
        setName(data.user.user_metadata?.full_name || '');
        setState('ready');
      })
      .catch(() => { if (alive) setState('guest'); });
    return () => { alive = false; };
  }, []);

  async function save(e) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) { setMsg(AUTH_NOT_CONFIGURED); return; }
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
    setMsg(error?.message || 'Profile saved.');
  }

  if (state === 'loading') return <main className="page"><div className="empty">Loading…</div></main>;

  if (state === 'guest') {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <Link href="/dashboard">← Dashboard</Link>
          <h1>Profile</h1>
          {isSupabaseConfigured()
            ? <p>You need to be logged in to edit your profile.</p>
            : <div className="notice">{AUTH_NOT_CONFIGURED}</div>}
          {isSupabaseConfigured() && <Link className="btn" href="/login">Go to login</Link>}
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/dashboard">← Dashboard</Link>
        <h1>Profile</h1>
        <p>{user.email}</p>
        <form onSubmit={save}>
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn">Save profile</button>
        </form>
        {msg && <p className="auth-message">{msg}</p>}
      </div>
    </main>
  );
}
