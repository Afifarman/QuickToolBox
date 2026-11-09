import Link from 'next/link';

const destinations = [
  { href: '/ai-platform', title: 'AI Platform', description: 'Your workspace for exploring AI-powered tools.', icon: '✦', tag: 'AI WORKSPACE', tone: 'violet' },
  { href: '/coding-agent', title: 'Coding Agent', description: 'Plan code changes and prepare guarded GitHub pull requests.', icon: '⌘', tag: 'DEVELOPER AI', tone: 'blue' },
  { href: '/ai', title: 'AI Assistant', description: 'Ask, write, explain and summarize in one place.', icon: '✧', tag: 'AI', tone: 'blue' },
  { href: '/ai-photo-editor', title: 'AI Photo Editor', description: 'Explore image editing tools and workflows.', icon: '◈', tag: 'IMAGE', tone: 'rose' },
  { href: '/ai-prompts', title: 'AI Prompt Generator', description: 'Shape clearer prompts for your next idea.', icon: '⌘', tag: 'AI', tone: 'violet' },
  { href: '/cv-maker', title: 'CV Maker', description: 'Create a polished, professional CV.', icon: '▤', tag: 'PRODUCTIVITY', tone: 'blue' },
  { href: '/file-converter', title: 'File Converter', description: 'Convert supported files with a simple workflow.', icon: '⇄', tag: 'FILES', tone: 'cyan' },
  { href: '/photo-studio', title: 'Photo Studio', description: 'Prepare passport photos, ID layouts and image PDFs.', icon: '▧', tag: 'IMAGE STUDIO', tone: 'rose' },
];

const highlights = [
  { icon: '⚡', title: 'Quick workflows', copy: 'Get to useful tools without unnecessary steps.' },
  { icon: '◉', title: 'Browser-first', copy: 'Use supported tools directly from your browser.' },
  { icon: '▣', title: 'Works across screens', copy: 'A consistent experience on mobile, tablet and desktop.' },
];

export default function Home() {
  return (
    <main className="qt-home">
      <section className="qt-home-hero">
        <div className="qt-home-hero-glow" aria-hidden="true" />
        <div className="qt-home-hero-copy">
          <div className="qt-home-eyebrow"><span className="qt-pulse-dot" /> THE EVERYDAY DIGITAL WORKSPACE</div>
          <h1>One toolbox.<br /><span>More possibilities.</span></h1>
          <p>Useful AI, file and productivity tools come together in one focused workspace. Find what you need and get straight to work.</p>
          <div className="qt-home-actions">
            <Link className="qt-home-primary" href="/ai-platform">Explore the workspace <span aria-hidden="true">↗</span></Link>
            <Link className="qt-home-secondary" href="/file-converter">Open File Converter <span aria-hidden="true">→</span></Link>
          </div>
          <div className="qt-home-trust"><span><i>✓</i> Free-to-use tools</span><span><i>✓</i> No installation</span><span><i>✓</i> Responsive design</span></div>
        </div>
        <div className="qt-home-visual" aria-hidden="true">
          <div className="qt-orbit qt-orbit-one" /><div className="qt-orbit qt-orbit-two" />
          <div className="qt-home-core"><span>Q</span><small>QUICK<br />TOOLBOX</small></div>
          <div className="qt-float-card qt-float-ai"><b>✦</b><span>AI workspace</span><small>Ideas into action</small></div>
          <div className="qt-float-card qt-float-file"><b>⇄</b><span>File tools</span><small>Convert with ease</small></div>
          <div className="qt-float-card qt-float-image"><b>◈</b><span>Photo studio</span><small>Create & prepare</small></div>
        </div>
      </section>

      <section className="qt-home-tools" aria-label="QuickToolBox tools">
        <div className="qt-section-heading">
          <div><span className="qt-section-kicker">YOUR WORKSPACE</span><h2>What would you like to do?</h2><p>Choose a tool and jump right into your workflow.</p></div>
          <span className="qt-feature-count">{destinations.length} featured tools <b>↗</b></span>
        </div>
        <div className="qt-tool-grid">
          {destinations.map((item, index) => (
            <Link className={`qt-tool-card qt-tone-${item.tone}`} href={item.href} key={item.href}>
              <div className="qt-tool-card-top"><span className="qt-tool-icon">{item.icon}</span><span className="qt-tool-tag">{item.tag}</span></div>
              <div className="qt-tool-card-copy"><h3>{item.title}</h3><p>{item.description}</p></div>
              <span className="qt-tool-card-arrow" aria-hidden="true">↗</span>
              <span className="qt-tool-index">{String(index + 1).padStart(2, '0')}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="qt-home-benefits">
        <div className="qt-benefit-heading"><span className="qt-section-kicker">BUILT FOR EVERYDAY WORK</span><h2>Less friction.<br /><span>More focus.</span></h2></div>
        <div className="qt-benefit-list">{highlights.map((item) => <div className="qt-benefit" key={item.title}><span>{item.icon}</span><div><h3>{item.title}</h3><p>{item.copy}</p></div></div>)}</div>
      </section>
      <footer className="qt-home-footer"><Link className="qt-footer-brand" href="/"><span>Q</span> QuickToolBox</Link><p>Useful tools. Clear workflows. One place.</p><span>© {new Date().getFullYear()} QuickToolBox</span></footer>
    </main>
  );
}
