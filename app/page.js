import Link from 'next/link';

const destinations = [
  { href: '/ai-platform', title: 'AI Platform', description: 'Explore the QuickToolBox AI workspace.', icon: '✦' },
  { href: '/ai', title: 'AI Assistant', description: 'Ask questions, write, explain and summarize.', icon: '🤖' },
  { href: '/ai-photo-editor', title: 'AI Photo Editor', description: 'Explore AI-assisted photo editing.', icon: '🖼️' },
  { href: '/ai-prompts', title: 'AI Prompt Generator', description: 'Create prompts for your projects.', icon: '✧' },
  { href: '/cv-maker', title: 'CV Maker', description: 'Build a professional CV.', icon: '📄' },
  { href: '/file-converter', title: 'File Converter', description: 'Convert supported files in your browser.', icon: '🔄' },
];

export default function Home() {
  return (
    <main>
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-eyebrow"><span className="home-live-dot" /> QUICKTOOLBOX</div>
          <h1>Get things done.<br /><span>Without the hassle.</span></h1>
          <p>Explore AI tools, file conversion and useful digital utilities in one simple place.</p>
          <div className="home-hero-actions">
            <Link className="btn home-primary" href="/ai-platform">Explore AI Platform <span aria-hidden="true">↗</span></Link>
            <Link className="home-secondary" href="/file-converter">Open File Converter <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="home-proof"><span><b>✓</b> Free tools</span><span><b>✓</b> Works on mobile</span><span><b>✓</b> No install needed</span></div>
        </div>
      </section>
      <section className="tool-discovery" aria-label="Available QuickToolBox features">
        <div className="tool-discovery-heading"><div><small>QUICKTOOLBOX WORKSPACE</small><h2>Choose what you want to do.</h2><p>AI and file tools available in QuickToolBox.</p></div><span className="tool-count">{destinations.length} features</span></div>
        <div className="grid tool-discovery-grid">
          {destinations.map((item) => <Link className="card" href={item.href} key={item.href}><span className="icon-wrap"><span className="tool-icon">{item.icon}</span></span><div><h3>{item.title}</h3><p>{item.description}</p></div><span className="card-arrow" aria-hidden="true">→</span></Link>)}
        </div>
      </section>
      <section id="about" className="about"><small>WHY QUICKTOOLBOX?</small><h2>Fast, private and mobile-friendly.</h2><div className="features"><div>⚡ <b>Fast</b><p>Lightweight browser-first tools.</p></div><div>🔒 <b>Private</b><p>Local file tools process files in your browser.</p></div><div>📱 <b>Responsive</b><p>Designed for phones, tablets and computers.</p></div></div></section>
    </main>
  );
}
