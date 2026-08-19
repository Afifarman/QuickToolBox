'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { getPasswordResetUrl } from '../../lib/supabase/auth-redirect';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setRecovery(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        mounted &&
        (event === 'PASSWORD_RECOVERY' || session)
      ) {
        setRecovery(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');

    const { error } = await createClient().auth.resetPasswordForEmail(
      email,
      { redirectTo: getPasswordResetUrl() }
    );

    setMsg(
      error?.message || 'Reset email sent. Check your inbox (and spam folder).'
    );
    if (!error) setSent(true);
    setBusy(false);
  }

  async function update(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');

    const { error } = await createClient().auth.updateUser({ password });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg('Password updated successfully. Redirecting to login…');
      setPassword('');
      setRecovery(false);
      await createClient().auth.signOut();
      setTimeout(() => window.location.assign('/login'), 2000);
    }
    setBusy(false);
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <a href="/login">← Login</a>
        <h1>{recovery ? 'Choose new password' : 'Reset Password'}</h1>

        {!recovery && !sent && (
          <form onSubmit={send}>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        {recovery && (
          <form onSubmit={update}>
            <input
              type="password"
              placeholder="New password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        {sent && !recovery && (
          <p>
            Check your email and open the reset link to choose a new
            password.
          </p>
        )}

        {msg && <p>{msg}</p>}
      </div>
    </main>
  );
}