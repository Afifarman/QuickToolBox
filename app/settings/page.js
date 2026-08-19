'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Settings() {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState('en');
  const [notify, setNotify] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setDark(localStorage.getItem('qtb_theme') === 'dark');
    setLang(localStorage.getItem('qtb_lang') || 'en');
    setNotify(localStorage.getItem('qtb_notify') !== 'off');
  }, []);

  function theme(v) {
    setDark(v);
    localStorage.setItem('qtb_theme', v ? 'dark' : 'light');
    document.documentElement.dataset.theme = v ? 'dark' : 'light';
  }
  function language(v) { setLang(v); localStorage.setItem('qtb_lang', v); }
  function notifications(v) { setNotify(v); localStorage.setItem('qtb_notify', v ? 'on' : 'off'); }

  function clearAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('qtb') || k.startsWith('qt-'))
      .forEach((k) => localStorage.removeItem(k));
    setMsg('All locally stored QuickToolBox data has been cleared.');
    setDark(false); setLang('en'); setNotify(true);
    document.documentElement.dataset.theme = 'light';
  }

  return (
    <main className="page">
      <Link className="back-link" href="/dashboard">← Dashboard</Link>
      <h1>⚙️ Settings</h1>
      <p>These preferences are stored in this browser.</p>

      <section>
        <h2>🎨 Theme</h2>
        <div className="toggle-row">
          <button className="btn" onClick={() => theme(!dark)}>{dark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}</button>
          <span>Current: <b>{dark ? 'Dark' : 'Light'}</b></span>
        </div>
      </section>

      <section>
        <h2>🌐 Language</h2>
        <div className="toggle-row">
          <button className="chip" onClick={() => language('en')} disabled={lang === 'en'}>English</button>
          <button className="chip" onClick={() => language('bn')} disabled={lang === 'bn'}>বাংলা</button>
          <span>Selected: <b>{lang === 'bn' ? 'বাংলা' : 'English'}</b></span>
        </div>
      </section>

      <section>
        <h2>🔔 Notifications</h2>
        <div className="toggle-row">
          <button className="btn light" onClick={() => notifications(!notify)}>{notify ? '🔔 Notifications ON' : '🔕 Notifications OFF'}</button>
        </div>
      </section>

      <section>
        <h2>🧹 Local data</h2>
        <p>Favorites, history, saved results and tool data stored in this browser.</p>
        <button className="btn light" onClick={clearAll}>Clear all local data</button>
        {msg && <div className="result">{msg}</div>}
      </section>
    </main>
  );
}
