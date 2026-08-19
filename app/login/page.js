'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import {
  getAuthCallbackUrl,
  getOAuthOptions,
} from '../../lib/supabase/auth-redirect';

function getErrorMessage(error) {
  if (!error) return '';
  const message = error.message || error;
  const text = typeof message === 'string' ? message : 'Authentication failed. Please try again.';
  const lower = text.toLowerCase();

  if (
    lower.includes('redirect') ||
    lower.includes('allowlist') ||
    lower.includes('not allowed') ||
    lower.includes('redirect_uri')
  ) {
    return (
      'Google login is blocked because this site callback URL is not ' +
      'allowlisted in Supabase. Add the production /auth/callback URL ' +
      'under Authentication → URL Configuration → Redirect URLs.'
    );
  }

  if (text === 'missing_oauth_code') {
    return (
      'Google sign-in did not return an auth code. Confirm the Supabase ' +
      'Redirect URLs allowlist includes this site’s /auth/callback.'
    );
  }

  if (text === 'supabase_not_configured') {
    return 'Supabase is not configured on this deployment.';
  }

  // Show a user-friendly message for common auth errors
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials')
  ) {
    return 'Invalid email or password. Please try again.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before logging in. Check your inbox for the confirmation link.';
  }

  if (lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

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
    const error = params.get('error');
    if (error) setMsg(getErrorMessage(error));
  }, []);

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
            emailRedirectTo: getAuthCallbackUrl(),
          },
        });

        if (error) throw error;

        if (data.session) {
          // User was auto-confirmed (e.g. in development)
          window.location.assign('/dashboard');
          return;
        }

        setMsg(
          'Registration successful. Check your email and click the confirmation link to activate your account.'
        );
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
        options: getOAuthOptions(),
      });

      if (error) throw error;
      // signInWithOAuth redirects the browser — no further action needed
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

        <button
          className="google-btn"
          onClick={google}
          disabled={busy}
          type="button"
        >
          {busy ? 'Connecting…' : 'Continue with Google'}
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
            {busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Login'
                : 'Register'}
          </button>
        </form>

        {mode === 'login' && (
          <a href="/reset-password">Forgot password?</a>
        )}
        {msg && <p className="auth-message">{msg}</p>}

        <button
          className="link-btn"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setMsg('');
          }}
          type="button"
        >
          {mode === 'login'
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </button>
      </div>
    </main>
  );
}