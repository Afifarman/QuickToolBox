'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

function getErrorMessage(error) {
  if (!error) return '';
  return error.message || 'Authentication failed. Please try again.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

        if (error) throw error;

        if (data.session) {
          window.location.assign('/dashboard');
          return;
        }

        setMsg('Registration successful. Check your email and click the confirmation link to activate your account.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;
      window.location.assign('/dashboard');
    } catch (error) {
      setMsg(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    setMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      setMsg(getErrorMessage(error));
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <a href="/">← QuickToolBox</a>
        <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p>
          {mode === 'login'
            ? 'Login to save tools, history and AI results.'
            : 'Create your free QuickToolBox account.'}
        </p>

        <button className="google-btn" onClick={google} disabled={busy} type="button">
          {busy && mode === 'login' ? 'Connecting…' : 'Continue with Google'}
        </button>

        <div className="or">or</div>

        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />
          <button className="btn" disabled={busy} type="submit">
            {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        {mode === 'login' && <a href="/reset-password">Forgot password?</a>}
        {msg && <p className="auth-message">{msg}</p>}

        <button
          className="link-btn"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setMsg('');
          }}
          type="button"
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
        </button>
      </div>
    </main>
  );
}
