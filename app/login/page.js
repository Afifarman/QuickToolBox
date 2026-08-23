'use client';

import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '../../lib/supabase/client';
import { getAuthCallbackUrl } from '../../lib/supabase/auth-redirect';

function getErrorMessage(error) {
  if (!error) return '';
  const message = error.message || error;
  const text = typeof message === 'string' ? message : 'Authentication failed. Please try again.';
  const lower = text.toLowerCase();

  if (lower.includes('redirect') || lower.includes('allowlist') || lower.includes('not allowed') || lower.includes('redirect_uri')) {
    return 'Google login is blocked by the Supabase redirect URL settings. Add this exact URL to Authentication → URL Configuration → Redirect URLs: ' + getAuthCallbackUrl();
  }
  if (lower.includes('provider') && lower.includes('google')) {
    return 'Google sign-in is not enabled in Supabase. Open Authentication → Providers → Google and enable it with the Google OAuth Client ID and Secret.';
  }
  if (lower.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (lower.includes('email not confirmed')) return 'Please confirm your email address first, then try logging in again.';
  if (lower.includes('password')) return text;
  if (text === 'missing_oauth_code') return 'Google sign-in did not return an authorization code. Check the Supabase Redirect URLs and Google OAuth callback configuration.';
  if (text === 'supabase_not_configured') return 'Supabase is not configured on this deployment. Add the public Supabase URL and publishable/anon key in Vercel environment variables.';
  return text;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const error = params.get('error') || hashParams.get('error_description') || hashParams.get('error');
    if (error) setMsg(getErrorMessage(error));
    if (!isSupabaseConfigured()) {
      setMsg((prev) => prev || 'Supabase is not configured on this deployment. Auth will run in guest mode. Add NEXT_PUBLIC_SUPABASE_URL and key in Vercel to enable login.');
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg('');

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: getAuthCallbackUrl() },
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign('/dashboard');
          return;
        }
        setMsg('Registration successful. Check your email and click the confirmation link to activate your account.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) throw error;
      window.location.assign('/dashboard');
    } catch (error) {
      setMsg(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      const supabase = createClient();
      const redirectTo = getAuthCallbackUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Google OAuth URL was not returned by Supabase.');
      window.location.assign(data.url);
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
        <p>{mode === 'login' ? 'Login to save tools, history and AI results.' : 'Create your free QuickToolBox account.'}</p>

        <button className="google-btn" onClick={google} disabled={busy} type="button">
          <span aria-hidden="true">G</span> {busy ? 'Connecting…' : 'Continue with Google'}
        </button>
        <div className="or">or</div>

        <form onSubmit={submit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required />
          <button className="btn" disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}</button>
        </form>

        {mode === 'login' && <a href="/reset-password">Forgot password?</a>}
        {msg && <p className="auth-message" role="alert">{msg}</p>}
        <button className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(''); }} type="button">
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
        </button>
      </div>
    </main>
  );
}
