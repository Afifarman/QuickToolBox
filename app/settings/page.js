'use client';

import { useSiteTheme } from '../providers';

const sectionStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: '18px 20px', marginTop: 16 };
const buttonStyle = { border: '1px solid #334155', background: 'transparent', color: 'inherit', borderRadius: 10, padding: '9px 14px', fontWeight: 700, cursor: 'pointer' };

export default function Settings() {
  const { mode, accent, themes, setAccent, toggleMode, ready } = useSiteTheme();

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 40 }}>
      <a href="/">← Home</a>
      <h1>Settings</h1>

      <section style={sectionStyle}>
        <h2>Appearance</h2>
        <p>Theme is currently <strong>{mode}</strong>.</p>
        <button type="button" style={buttonStyle} onClick={toggleMode}>
          Switch to {mode === 'dark' ? 'light' : 'dark'} mode
        </button>
        <label style={{ display: 'block', marginTop: 16 }}>
          Accent colour
          <select
            value={accent}
            onChange={(event) => setAccent(event.target.value)}
            disabled={!ready}
            aria-label="Accent colour"
            style={{ display: 'block', marginTop: 8, padding: '9px 12px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: 'inherit' }}
          >
            {Object.entries(themes).map(([key, theme]) => (
              <option key={key} value={key}>{theme.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section style={sectionStyle}>
        <h2>Language</h2>
        <p>The interface is currently English only. Bengali and other translations are not available yet.</p>
      </section>

      <section style={sectionStyle}>
        <h2>Saved data</h2>
        <p>Notes, checklists and favourites are stored in this browser, not on a server. Clearing site data removes them.</p>
        <a href="/saved" style={{ color: '#a78bfa', fontWeight: 700 }}>Review saved results →</a>
      </section>
    </main>
  );
}
