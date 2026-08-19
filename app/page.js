import Link from 'next/link';
import { utilityTools, aiTools, studentTools } from '../lib/tools';

function ToolGrid({ items, base }) {
  return (
    <div className="grid">
      {items.map(([slug, icon, title, desc], i) => {
        const href = base === 'ai' ? `/${slug}` : `/${base}/${slug}`;
        return (
          <Link className="card" href={href} key={`${slug}-${i}`}>
            <i>{icon}</i>
            <div><h3>{title}</h3><p>{desc}</p></div>
            <strong>→</strong>
          </Link>
        );
      })}
    </div>
  );
}

export default function Home() {
  const total = utilityTools.length + aiTools.length + studentTools.length;
  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav>
          <a href="#tools">Tools</a>
          <a href="#ai">AI &amp; CV</a>
          <a href="#student-tools">Student</a>
          <Link href="/login">Login / Register</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>
      <main>
        <section className="hero">
          <small>⚡ FREE • FAST • SIMPLE • AI</small>
          <h1>One toolbox.<br /><span>Everything useful.</span></h1>
          <p>{total} fast, privacy-friendly PDF, calculator, productivity, student and AI tools designed for phones, tablets and computers.</p>
          <a className="btn" href="#tools">Explore tools →</a>
          <Link className="btn light" href="/tools">Search all tools</Link>
        </section>

        <section id="tools">
          <small>TOOLBOX</small>
          <h2>{utilityTools.length} essential tools.</h2>
          <ToolGrid items={utilityTools} base="tools" />
        </section>

        <section id="ai">
          <small>AI &amp; CV</small>
          <h2>AI tools without duplicates.</h2>
          <ToolGrid items={aiTools} base="ai" />
        </section>

        <section id="student-tools">
          <small>STUDENT TOOLS</small>
          <h2>{studentTools.length} useful tools for students.</h2>
          <ToolGrid items={studentTools} base="student-tools" />
        </section>

        <section id="about" className="about">
          <small>WHY QUICKTOOLBOX?</small>
          <h2>Fast, private and mobile-friendly.</h2>
          <div className="features">
            <div>⚡ <b>Fast</b><p>Lightweight browser-first tools.</p></div>
            <div>🔒 <b>Private</b><p>Local file tools process files in your browser.</p></div>
            <div>📱 <b>Responsive</b><p>Designed for phones, tablets and computers.</p></div>
          </div>
        </section>
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}
