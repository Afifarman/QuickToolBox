'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

const LINKS = [
  ['/tools','🧰','All tools','Browse PDF, image, calculator and productivity tools'],
  ['/ai','✦','AI workspace','Generate, rewrite and summarize with AI'],
  ['/student-tools','🎓','Student studio','Study plans, flashcards, quizzes and calculators'],
  ['/favorites','★','Favourites','Quick access to your saved tools'],
  ['/history','◷','Recent activity','Return to tools you used recently'],
  ['/saved','▣','Saved results','Find your saved work'],
  ['/profile','♙','Profile','Manage your account information'],
  ['/settings','⚙','Settings','Theme and personal preferences'],
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('Loading your workspace…');

  useEffect(() => {
    createClient().auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        window.location.href = '/login';
        return;
      }
      setUser(data.user);
      setMsg('');
    });
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    window.location.href = '/';
  }

  if (!user) return <main className="dashboard-loading"><a className="brand" href="/"><b>Q</b> QuickToolBox</a><p>{msg}</p></main>;

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/"><b>Q</b> QuickToolBox</a>
        <nav>
          <a href="/tools">Tools</a>
          <a href="/ai">AI tools</a>
          <a href="/student-tools">Student tools</a>
          <a href="/">Home</a>
        </nav>
      </header>
      <main className="dashboard">
        <section className="dash-head">
          <div>
            <small>YOUR PERSONAL WORKSPACE</small>
            <h1>Welcome back <span aria-hidden="true">✦</span></h1>
            <p>{user.email}</p>
            <div className="dash-welcome-meta"><span className="dash-online-dot" /> Account signed in</div>
          </div>
          <button type="button" onClick={logout}>Log out <span aria-hidden="true">↗</span></button>
        </section>
        <div className="dashboard-section-heading">
          <div><h2>Your workspace</h2><p>Pick up where you left off, or choose a tool to get started.</p></div>
          <span>{LINKS.length} shortcuts</span>
        </div>
        <section className="dash-grid" aria-label="Dashboard shortcuts">
          {LINKS.map(([href, icon, title, description]) => (
            <a href={href} key={href} className="dash-link">
              <span className="dash-link-icon" aria-hidden="true">{icon}</span>
              <span className="dash-link-copy"><b>{title}</b><small>{description}</small></span>
              <span className="dash-link-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </section>
        <p className="dashboard-footnote">QuickToolBox · Your tools, in one place.</p>
      </main>
    </>
  );
}
