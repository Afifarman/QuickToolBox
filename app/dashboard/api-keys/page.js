'use client';
import { useEffect, useState } from 'react';

function copy(text) {
  navigator.clipboard.writeText(text);
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [busy, setBusy] = useState(false);
  const [env, setEnv] = useState('live');
  const [msg, setMsg] = useState('');
  const [lastKey, setLastKey] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('qtb_publishable_keys');
      if (raw) setKeys(JSON.parse(raw));
    } catch {}
  }, []);

  function persist(next) {
    setKeys(next);
    localStorage.setItem('qtb_publishable_keys', JSON.stringify(next));
  }

  async function createKey() {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/publishable-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ env }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');
      setLastKey(data);
      const entry = {
        id: data.id,
        preview: data.preview,
        env: data.env,
        createdAt: data.createdAt,
        hash: data.hash,
      };
      persist([entry, ...keys]);
      setMsg('✓ Publishable key created — copy it now. For security the full key is shown only once.');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  function revoke(id) {
    if (!confirm('Revoke this key? It will be removed from this browser.')) return;
    persist(keys.filter((k) => k.id !== id));
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 22px' }}>
      <a href="/dashboard">← Dashboard</a>
      <h1 style={{ fontSize: 38, letterSpacing: '-0.04em', margin: '12px 0 8px' }}>🔑 Publishable API Keys</h1>
      <p style={{ color: '#667085', lineHeight: 1.6, maxWidth: 640 }}>
        Create <b>publishable</b> keys (safe for client-side <code>NEXT_PUBLIC_</code>). They start with{' '}
        <code>qpk_live_</code> or <code>qpk_test_</code>. Use <code>NEXT_PUBLIC_QTB_PUBLISHABLE_KEY</code> in your
        frontend, and verify the SHA-256 <code>hash</code> server-side if needed.
      </p>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7f2',
          borderRadius: 18,
          padding: 22,
          marginTop: 24,
          display: 'grid',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 700 }}>
            Environment:{' '}
            <select value={env} onChange={(e) => setEnv(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd' }}>
              <option value="live">live — production</option>
              <option value="test">test — development</option>
            </select>
          </label>
          <button
            onClick={createKey}
            disabled={busy}
            className="btn"
            style={{ marginTop: 0 }}
          >
            {busy ? 'Creating…' : '+ Create new publishable key'}
          </button>
          <a href="/api/publishable-key" target="_blank" style={{ color: '#4f46e5', fontWeight: 700 }}>
            API docs →
          </a>
        </div>

        {msg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 12px', borderRadius: 10 }}>{msg}</div>
        )}

        {lastKey && (
          <div style={{ background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 12, wordBreak: 'break-all' }}>
            <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: '.08em', fontWeight: 700 }}>NEW KEY — COPY NOW (shown once)</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, marginTop: 8 }}>{lastKey.key}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  copy(lastKey.key);
                  setMsg('Copied to clipboard ✓');
                }}
                style={{ background: '#fff', color: '#0f172a', border: 0, padding: '8px 12px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                Copy key
              </button>
              <span style={{ fontSize: 12, opacity: 0.7, alignSelf: 'center' }}>
                ID {lastKey.id} · {lastKey.preview} · hash {lastKey.hash.slice(0, 16)}…
              </span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
              Env var: <code>NEXT_PUBLIC_QTB_PUBLISHABLE_KEY={lastKey.key}</code>
            </div>
          </div>
        )}

        <details style={{ background: '#f8fafc', padding: 12, borderRadius: 10 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>cURL example</summary>
          <pre style={{ overflowX: 'auto', fontSize: 13, marginTop: 8 }}>{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/publishable-key \\
  -H "Content-Type: application/json" \\
  -d '{"env":"${env}"}'`}</pre>
        </details>
      </div>

      <h2 style={{ marginTop: 32 }}>Your keys (this browser)</h2>
      <p style={{ color: '#98a2b3', fontSize: 14 }}>Stored in localStorage for demo. In production, store hashes in Supabase.</p>

      {keys.length === 0 ? (
        <div style={{ border: '1px dashed #d0d5dd', borderRadius: 12, padding: 18, color: '#667085', marginTop: 12 }}>No keys yet. Create one above.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {keys.map((k) => (
            <div key={k.id} style={{ background: '#fff', border: '1px solid #e5e7f2', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>{k.preview}</div>
                <div style={{ fontSize: 12, color: '#667085' }}>
                  {k.id} · <span style={{ background: k.env === 'live' ? '#dcfce7' : '#fef9c3', padding: '2px 6px', borderRadius: 6 }}>{k.env}</span> · {new Date(k.createdAt).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#98a2b3', wordBreak: 'break-all' }}>hash {k.hash.slice(0, 24)}…</div>
              </div>
              <button onClick={() => revoke(k.id)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 36, borderTop: '1px solid #e5e7f2', paddingTop: 20 }}>
        <h3>Supabase publishable key</h3>
        <p style={{ color: '#667085', lineHeight: 1.6 }}>
          If you meant a <b>Supabase</b> publishable key: open{' '}
          <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" style={{ color: '#4f46e5' }}>
            Supabase → Settings → API
          </a>{' '}
          → copy the <code>sb_publishable_…</code> key → set{' '}
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (and keep <code>NEXT_PUBLIC_SUPABASE_URL</code>) in Vercel →
          Environment Variables → Redeploy. This repo already prefers <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> over{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
      </div>
    </main>
  );
}
