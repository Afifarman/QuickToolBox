'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All tools' },
  { id: 'tools', label: 'Everyday' },
  { id: 'ai', label: 'AI & CV' },
  { id: 'student-tools', label: 'Student' },
];

function getHref(slug, category) {
  if (category === 'ai') return slug === 'ai' ? '/ai' : slug === 'cv-maker' ? '/cv-maker' : `/${slug}`;
  return `/${category}/${slug}`;
}

export default function ToolDiscovery({ tools = [], aiTools = [], studentTools = [] }) {
  const allTools = useMemo(() => [
    ...tools.map(([slug, icon, title, desc]) => ({ slug, icon, title, desc, category: 'tools', categoryLabel: 'Everyday' })),
    ...aiTools.map(([slug, icon, title, desc]) => ({ slug, icon, title, desc, category: 'ai', categoryLabel: 'AI & CV' })),
    ...studentTools.map(([slug, icon, title, desc]) => ({ slug, icon, title, desc, category: 'student-tools', categoryLabel: 'Student' })),
  ], [tools, aiTools, studentTools]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [recent, setRecent] = useState([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem('qt-tool-favorites') || '[]');
      const savedRecent = JSON.parse(localStorage.getItem('qt-tool-recent') || '[]');
      if (Array.isArray(savedFavorites)) setFavorites(savedFavorites);
      if (Array.isArray(savedRecent)) setRecent(savedRecent);
    } catch {}
    setReady(true);
  }, []);

  const visibleTools = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allTools.filter(tool => {
      const matchesCategory = category === 'all' || tool.category === category;
      const matchesQuery = !needle || `${tool.title} ${tool.desc} ${tool.categoryLabel}`.toLowerCase().includes(needle);
      const matchesFavorite = !favoritesOnly || favorites.includes(tool.slug);
      return matchesCategory && matchesQuery && matchesFavorite;
    });
  }, [allTools, category, query, favorites, favoritesOnly]);

  const toggleFavorite = (slug) => {
    setFavorites(current => {
      const next = current.includes(slug) ? current.filter(item => item !== slug) : [...current, slug];
      try { localStorage.setItem('qt-tool-favorites', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const markRecent = (slug) => {
    setRecent(current => {
      const next = [slug, ...current.filter(item => item !== slug)].slice(0, 6);
      try { localStorage.setItem('qt-tool-recent', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const recentTools = recent.map(slug => allTools.find(tool => tool.slug === slug)).filter(Boolean);

  return (
    <section className="tool-discovery" id="tools">
      <div className="tool-discovery-heading">
        <div><small>YOUR SMART TOOLBOX</small><h2>Find the right tool, faster.</h2><p>Search every tool, save your favourites, and jump back into your recent work. Your preferences stay in this browser.</p></div>
        <span className="tool-count">{allTools.length} tools</span>
      </div>
      <div className="tool-discovery-bar">
        <label className="tool-search"><span aria-hidden="true">⌕</span><input aria-label="Search tools" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search PDF, AI, GPA, QR, JSON…" /><kbd>Search</kbd></label>
        <button className={favoritesOnly ? 'tool-filter-toggle is-active' : 'tool-filter-toggle'} type="button" onClick={() => setFavoritesOnly(value => !value)} aria-pressed={favoritesOnly}>☆ Favourites {favorites.length ? `(${favorites.length})` : ''}</button>
      </div>
      <div className="tool-category-filters" aria-label="Filter tool category">
        {CATEGORIES.map(item => <button id={item.id === 'ai' || item.id === 'student-tools' ? item.id : undefined} key={item.id} type="button" className={category === item.id ? 'tool-category is-active' : 'tool-category'} onClick={() => setCategory(item.id)} aria-pressed={category === item.id}>{item.label}</button>)}
      </div>
      {ready && recentTools.length > 0 && !query && category === 'all' && !favoritesOnly && <div className="recent-tools"><div className="recent-heading"><b>Recently used</b><span>On this device</span></div><div className="recent-links">{recentTools.map(tool => <Link key={tool.slug} href={getHref(tool.slug, tool.category)} onClick={() => markRecent(tool.slug)}>{tool.title} <span aria-hidden="true">↗</span></Link>)}</div></div>}
      <div className="tool-results-meta"><span>{visibleTools.length} {visibleTools.length === 1 ? 'tool' : 'tools'} found</span>{query && <button type="button" onClick={() => setQuery('')}>Clear search</button>}</div>
      <div className="grid tool-discovery-grid">
        {visibleTools.map(tool => <div className="tool-card-wrap" key={`${tool.category}-${tool.slug}`}>
          <Link className="card" href={getHref(tool.slug, tool.category)} onClick={() => markRecent(tool.slug)}>
            <span className="icon-wrap" aria-hidden="true">{tool.icon === 'spark' ? '✦' : tool.icon === 'graduation' ? '🎓' : tool.icon === 'image' ? '▧' : tool.icon === 'file' ? '▤' : tool.icon === 'calculator' ? '⌗' : '✧'}</span>
            <div><h3>{tool.title}</h3><p>{tool.desc}</p><span className="tool-category-label">{tool.categoryLabel}</span></div><span className="card-arrow" aria-hidden="true">→</span>
          </Link>
          <button className={favorites.includes(tool.slug) ? 'tool-favorite is-favorite' : 'tool-favorite'} type="button" onClick={() => toggleFavorite(tool.slug)} aria-label={favorites.includes(tool.slug) ? `Remove ${tool.title} from favourites` : `Add ${tool.title} to favourites`} aria-pressed={favorites.includes(tool.slug)} title={favorites.includes(tool.slug) ? 'Remove favourite' : 'Add to favourites'}>{favorites.includes(tool.slug) ? '★' : '☆'}</button>
        </div>)}
      </div>
      {visibleTools.length === 0 && <div className="tool-empty"><span>⌕</span><h3>No tools found</h3><p>Try a different keyword or switch category.</p><button className="btn" type="button" onClick={() => { setQuery(''); setCategory('all'); setFavoritesOnly(false); }}>Show all tools</button></div>}
    </section>
  );
}
