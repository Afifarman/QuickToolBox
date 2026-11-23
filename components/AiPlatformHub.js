'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './AiPlatformHub.module.css';

const tools = [
  { id: 'nano-banana', name: 'Nano Banana', company: 'Google', category: 'Image', summary: 'Generate and edit images with Google Gemini image models.', url: 'https://gemini.google.com/', access: 'Gemini app access; availability varies', api: 'No verified free image API tier', tags: ['image generation', 'image editing', 'google', 'gemini'] },
  { id: 'consensus', name: 'Consensus', company: 'Consensus', category: 'Research', summary: 'Search scientific papers and get evidence-focused research answers.', url: 'https://consensus.app/', access: 'Free searches with limits; check current plan', api: 'No public free API confirmed', tags: ['research', 'papers', 'academic', 'citations'] },
  { id: 'hedra', name: 'Hedra', company: 'Hedra', category: 'Video & Avatar', summary: 'Create expressive AI characters, avatars and generated media.', url: 'https://www.hedra.com/', access: 'Limited trial or credits may apply', api: 'Developer API is pay-per-use; not $0', tags: ['avatar', 'character', 'video', 'image'] },
  { id: 'cursor', name: 'Cursor', company: 'Anysphere', category: 'Coding', summary: 'AI-powered code editor for writing, understanding and refactoring code.', url: 'https://cursor.com/', access: 'Free plan with usage limits', api: 'Editor product; not a free hosted generation API', tags: ['coding', 'editor', 'developer', 'agent'] },
  { id: 'stable-diffusion', name: 'Stable Diffusion', company: 'Stability AI / open source', category: 'Image', summary: 'Open image-generation model family that can be self-hosted or run through compatible services.', url: 'https://github.com/CompVis/stable-diffusion', access: 'Open model code/weights subject to license; compute required', api: 'Self-hosting can be $0 if you provide suitable hardware', tags: ['image generation', 'open source', 'local', 'diffusion'] },
  { id: 'photoroom', name: 'PhotoRoom', company: 'PhotoRoom', category: 'Image', summary: 'Remove backgrounds and prepare product photos and marketing images.', url: 'https://www.photoroom.com/', access: 'Free app features may be limited', api: 'API access is not confirmed as free', tags: ['background remover', 'product photo', 'image editing'] },
  { id: 'hailuo', name: 'Hailuo AI', company: 'MiniMax', category: 'Video & Avatar', summary: 'Generate short AI videos from text and image prompts.', url: 'https://hailuoai.video/', access: 'Promotional credits or limits may vary by region', api: 'API usage is not guaranteed free', tags: ['text to video', 'image to video', 'video'] },
  { id: 'publer', name: 'Publer', company: 'Publer', category: 'Social', summary: 'Plan, schedule and manage social-media publishing workflows.', url: 'https://publer.com/', access: 'Free plan with account and channel limits', api: 'API availability and access depend on plan', tags: ['social media', 'scheduler', 'publishing', 'marketing'] },
  { id: 'udio', name: 'Udio', company: 'Udio', category: 'Music', summary: 'Create music and songs from text prompts and creative direction.', url: 'https://www.udio.com/', access: 'Free access/credits may be limited or change', api: 'No public free generation API confirmed', tags: ['music', 'song', 'audio', 'generation'] },
];

const categories = ['All categories', ...new Set(tools.map((tool) => tool.category))];

export default function AiPlatformHub() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    try { const stored = JSON.parse(localStorage.getItem('qtb_ai_studio_saved') || '[]'); if (Array.isArray(stored)) setSaved(stored); } catch { setSaved([]); }
  }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesText = !term || [tool.name, tool.company, tool.category, tool.summary, ...tool.tags].join(' ').toLowerCase().includes(term);
      return matchesText && (category === 'All categories' || tool.category === category) && (!showSaved || saved.includes(tool.id));
    });
  }, [query, category, showSaved, saved]);

  function toggleSaved(id) {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { localStorage.setItem('qtb_ai_studio_saved', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return <main className={styles.page}>
    <section className={styles.hero}>
      <span className={styles.kicker}>QUICKTOOLBOX · AI STUDIO</span>
      <h1>One place for your next <em>AI workflow.</em></h1>
      <p className={styles.lead}>Discover the AI tools you asked for, open their official services, and use QuickToolBox's own free-first AI workspaces. Third-party products open on their own websites; they are not falsely presented as built-in APIs.</p>
      <div className={styles.heroStats}><span>9 curated AI services</span><span>Free-first discovery</span><span>No API key required to browse</span></div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><span className={styles.kicker}>BUILT INTO QUICKTOOLBOX</span><h2>Use AI here</h2></div><span className={styles.subtle}>Existing QuickToolBox workspaces</span></div>
      <div className={styles.nativeGrid}>
        <Link href="/ai" className={styles.nativeCard}><span>✦</span><div><h3>QuickToolBox AI Assistant</h3><p>Chat and ask questions in Bangla or English using configured free-first providers.</p><b>Open AI Assistant ↗</b></div></Link>
        <Link href="/ai/local" className={styles.nativeCard}><span>◉</span><div><h3>Free Local AI</h3><p>Run a supported language model in your browser when your device supports WebGPU.</p><b>Open Local AI ↗</b></div></Link>
        <Link href="/ai-photo-editor" className={styles.nativeCard}><span>◈</span><div><h3>AI Photo Editor</h3><p>Open the existing photo-editing workspace. AI actions depend on available provider configuration.</p><b>Open Photo Editor ↗</b></div></Link>
      </div>
      <p className={styles.disclaimer}>These are links to existing QuickToolBox routes, not a claim that every third-party model is connected to our backend.</p>
    </section>

    <section id="directory" className={styles.section}>
      <div className={styles.sectionHeading}><div><span className={styles.kicker}>DISCOVER & LAUNCH</span><h2>AI tools directory</h2></div><span className={styles.subtle}>{visible.length} of {tools.length} tools</span></div>
      <div className={styles.directoryControls}>
        <input className={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search image, video, research, coding…" aria-label="Search AI tools" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter AI tools by category">{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <button type="button" className={showSaved ? styles.filterActive : styles.filterButton} onClick={() => setShowSaved((value) => !value)}>♥ Saved ({saved.length})</button>
      </div>
      <div className={styles.categoryPills}>{categories.map((item) => <button key={item} type="button" className={category === item ? styles.pillActive : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {visible.length ? <div className={styles.toolGrid}>{visible.map((tool) => <article className={styles.toolCard} key={tool.id}>
        <div className={styles.cardTop}><span className={styles.toolCategory}>{tool.category}</span><button type="button" className={saved.includes(tool.id) ? styles.saved : styles.save} onClick={() => toggleSaved(tool.id)} aria-label={saved.includes(tool.id) ? 'Remove saved tool' : 'Save tool'}>{saved.includes(tool.id) ? '♥' : '♡'}</button></div>
        <h3>{tool.name}</h3><p className={styles.company}>{tool.company}</p><p>{tool.summary}</p>
        <div className={styles.accessBlock}><b>Free access</b><span>{tool.access}</span></div>
        <div className={styles.accessBlock}><b>API / integration</b><span>{tool.api}</span></div>
        <a className={styles.openLink} href={tool.url} target="_blank" rel="noopener noreferrer">Open official service <span>↗</span></a>
      </article>)}</div> : <div className={styles.empty}><b>No matching tools</b><p>Change your search or category filter.</p><button type="button" onClick={() => { setQuery(''); setCategory('All categories'); setShowSaved(false); }}>Clear filters</button></div>}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><span className={styles.kicker}>IMPORTANT FOR A $0 PROJECT</span><h2>What “free” really means</h2></div></div>
      <div className={styles.freeNotes}>
        <p><b>Directory access:</b> QuickToolBox can link to official free plans and open-source projects without charging users or storing provider credentials.</p>
        <p><b>In-app API integration:</b> A free website plan does not automatically mean a free API. Several services above do not publish a free API tier. We will only enable an in-app connector after its free quota, terms and endpoint are verified.</p>
        <p><b>Privacy:</b> Third-party links leave QuickToolBox. Their own accounts, terms, data handling and usage limits apply.</p>
      </div>
    </section>
    <footer className={styles.footer}><Link href="/">QuickToolBox</Link><span>Free-first AI discovery · transparent limitations</span><Link href="#directory">Back to directory ↑</Link></footer>
  </main>;
}
