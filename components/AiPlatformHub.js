'use client';

import { useEffect, useMemo, useState } from 'react';
import { aiTools, aiModels } from '../lib/ai-directory';
import styles from './AiPlatformHub.module.css';

const categories = ['All categories', ...new Set(aiTools.map((tool) => tool.category))];
const pricingOptions = ['All pricing', 'Free', 'Freemium', 'Paid'];

export default function AiPlatformHub() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [pricing, setPricing] = useState('All pricing');
  const [sort, setSort] = useState('featured');
  const [favorites, setFavorites] = useState([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('tools');

  useEffect(() => {
    try { setFavorites(JSON.parse(localStorage.getItem('qtb_ai_directory_favorites') || '[]')); } catch { setFavorites([]); }
  }, []);

  function toggleFavorite(id) {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { localStorage.setItem('qtb_ai_directory_favorites', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const visibleTools = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = aiTools.filter((tool) => {
      const searchable = [tool.name, tool.company, tool.category, tool.summary, ...tool.tags].join(' ').toLowerCase();
      return (!term || searchable.includes(term))
        && (category === 'All categories' || tool.category === category)
        && (pricing === 'All pricing' || tool.pricing === pricing)
        && (!favoritesOnly || favorites.includes(tool.id));
    });
    if (sort === 'az') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'za') result.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === 'featured') result.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
    return result;
  }, [query, category, pricing, sort, favoritesOnly, favorites]);

  const featured = aiTools.filter((tool) => tool.featured).slice(0, 6);

  return <main className={styles.page}>

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.kicker}>THE AI DISCOVERY PLATFORM</span>
        <h1>Find the right AI tool<br/><em>for your next idea.</em></h1>
        <p>Explore AI products from independent companies and leading technology providers. Compare what they do, check their pricing type, and visit the official website.</p>
        <div className={styles.heroActions}><a href="#directory" className={styles.primaryButton}>Explore directory <span>↘</span></a><a href="#models" className={styles.textButton}>Browse AI models ↗</a></div>
        <div className={styles.trustLine}><span>✓ Curated listings</span><span>✓ Official links</span><span>✓ Free & paid filters</span></div>
      </div>
      <div className={styles.heroVisual} aria-hidden="true">
        <div className={`${styles.orbit} ${styles.orbitOne}`}></div><div className={`${styles.orbit} ${styles.orbitTwo}`}></div>
        <div className={styles.orbitCore}><span>✳</span><b>AI</b><small>DISCOVER</small></div>
        <div className={styles.floatCard + ' ' + styles.floatTop}><span>✦</span><div><b>40+ tools</b><small>Across 10 categories</small></div></div>
        <div className={styles.floatCard + ' ' + styles.floatBottom}><span>⌘</span><div><b>Many providers</b><small>One place to explore</small></div></div>
      </div>
    </section>

    <section className={styles.featuredSection}>
      <div className={styles.sectionIntro}><div><span className={styles.kicker}>START HERE</span><h2>Featured discoveries</h2></div><span>Curated picks · not a popularity ranking</span></div>
      <div className={styles.featuredGrid}>{featured.map((tool) => <a key={tool.id} className={styles.featuredCard} href={tool.url} target="_blank" rel="noopener noreferrer"><span className={styles.featuredIcon}>{tool.name.slice(0,1)}</span><span><b>{tool.name}</b><small>{tool.category} · {tool.pricing}</small></span><i>↗</i></a>)}</div>
    </section>

    <section id="directory" className={styles.directorySection}>
      <div className={styles.sectionIntro}><div><span className={styles.kicker}>EXPLORE THE ECOSYSTEM</span><h2>AI tools directory</h2></div><span>{aiTools.length} curated listings</span></div>
      <div className={styles.tabs}><button className={activeTab === 'tools' ? styles.activeTab : ''} onClick={() => setActiveTab('tools')}>AI tools</button><button className={activeTab === 'models' ? styles.activeTab : ''} onClick={() => { setActiveTab('models'); document.getElementById('models')?.scrollIntoView({behavior:'smooth'}); }}>AI models</button></div>
      <div className={styles.filters}>
        <label className={styles.searchBox}><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by tool, company, task or tag…" aria-label="Search AI tools"/></label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={pricing} onChange={(event) => setPricing(event.target.value)} aria-label="Filter by pricing">{pricingOptions.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort tools"><option value="featured">Featured first</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select>
        <button className={favoritesOnly ? styles.favoritesActive : styles.favoritesButton} onClick={() => setFavoritesOnly((value) => !value)}>♥ Favorites ({favorites.length})</button>
      </div>
      <div className={styles.resultLine}><span>{visibleTools.length} results</span><button onClick={() => {setQuery('');setCategory('All categories');setPricing('All pricing');setSort('featured');setFavoritesOnly(false);}}>Reset filters</button></div>
      {visibleTools.length ? <div className={styles.toolGrid}>{visibleTools.map((tool) => <article className={styles.toolCard} key={tool.id}>
        <div className={styles.cardTop}><span className={styles.toolGlyph}>{tool.name.slice(0,1)}</span><button className={favorites.includes(tool.id) ? styles.saved : styles.save} aria-label={favorites.includes(tool.id) ? 'Remove from favorites' : 'Add to favorites'} onClick={() => toggleFavorite(tool.id)}>{favorites.includes(tool.id) ? '♥' : '♡'}</button></div>
        <div className={styles.toolMeta}><span>{tool.category}</span><span className={styles.pricing}>{tool.pricing}</span></div>
        <h3>{tool.name}</h3><p className={styles.company}>by {tool.company}</p><p className={styles.summary}>{tool.summary}</p>
        <div className={styles.tags}>{tool.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <a className={styles.openLink} href={tool.url} target="_blank" rel="noopener noreferrer">Visit official website <span>↗</span></a>
      </article>)}</div> : <div className={styles.empty}><b>No tools found</b><p>Try a different search term or clear some filters.</p><button onClick={() => {setQuery('');setCategory('All categories');setPricing('All pricing');setFavoritesOnly(false);}}>Clear filters</button></div>}
      <p className={styles.note}>Pricing labels are broad directory classifications, not price quotes. Features, free quotas and availability can change by region and over time. Always confirm current terms on the provider’s official website.</p>
    </section>

    <section id="models" className={styles.modelsSection}>
      <div className={styles.sectionIntro}><div><span className={styles.kicker}>MODELS & PROVIDERS</span><h2>AI model hub</h2></div><span>Model families · not standalone apps</span></div>
      <p className={styles.modelsLead}>An AI model is the underlying technology. An AI tool is the product people use. The same model family may power multiple products.</p>
      <div className={styles.modelGrid}>{aiModels.map((model) => <article className={styles.modelCard} key={model.name}><div className={styles.modelTop}><span className={styles.modelGlyph}>{model.company.slice(0,1)}</span><span>{model.kind}</span></div><h3>{model.name}</h3><p className={styles.company}>{model.company}</p><p>{model.modalities}</p><a href={model.url} target="_blank" rel="noopener noreferrer">Provider website ↗</a></article>)}</div>
    </section>

    <section className={styles.disclaimerSection}><b>Independent directory</b><p>QuickToolBox is an independent discovery directory. Listed products belong to their respective companies. Listing a product does not mean it is built by QuickToolBox, endorsed by us, or integrated into this website. We do not claim live availability or rank tools by popularity without verified data.</p></section>
    <footer className={styles.footer}><a href="/">QuickToolBox</a><span>Discover better ways to work with AI.</span><a href="#directory">Back to directory ↑</a></footer>
  </main>;
}
