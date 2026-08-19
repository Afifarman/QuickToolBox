'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient, isSupabaseConfigured, AUTH_NOT_CONFIGURED } from '../../lib/supabase/client';

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const s = createClient();
    if (!s) { setMsg(AUTH_NOT_CONFIGURED); return; }
    setBusy(true);
    setMsg('');
    try {
      const result = mode === 'login'
        ? await s.auth.signInWithPassword({ email, password })
        : await s.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` } });
      if (result.error) setMsg(result.error.message);
      else if (mode === 'login') { window.location.href = '/dashboard'; return; }
      else setMsg('Registration successful. Check your email if confirmation is enabled.');
    } catch (err) {
      setMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const s = createClient();
    if (!s) { setMsg(AUTH_NOT_CONFIGURED); return; }
    setMsg('');
    try {
      const { error } = await s.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
      if (error) setMsg(error.message);
    } catch (err) {
      setMsg(err?.message || 'Google sign-in is unavailable.');
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/">← QuickToolBox</Link>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p>{mode === 'login' ? 'Login to save tools, history and AI results.' : 'Create your free QuickToolBox account.'}</p>

        {!configured && <div className="notice">{AUTH_NOT_CONFIGURED}</div>}

        <button className="google-btn" onClick={google} disabled={busy || !configured} style={{ marginTop: 16 }}>
          Continue with Google
        </button>
        <div className="or">or</div>
        <form onSubmit={submit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!configured} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required disabled={!configured} />
          <button className="btn" disabled={busy || !configured}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
        {mode === 'login' && configured && <Link href="/reset-password">Forgot password?</Link>}
        {msg && <p className="auth-message">{msg}</p>}
        <button className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(''); }}>
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
        </button>
        <p style={{ marginTop: 14, fontSize: 13 }}>
          You don’t need an account — <Link href="/tools" style={{ color: '#4f46e5', fontWeight: 700 }}>all tools are free to use</Link>.
        </p>
      </div>
    </main>
  );
}
