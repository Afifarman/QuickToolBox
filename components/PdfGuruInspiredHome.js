"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const tools = [
  { name: "File Converter", description: "Open the file workspace and convert supported formats.", href: "/file-converter", category: "PDF & Files", icon: "⇄", tags: "convert files pdf document image" },
  { name: "AI Assistant", description: "Ask questions, draft, explain and summarize.", href: "/ai", category: "AI & Writing", icon: "✦", tags: "chat write summarize explain ai" },
  { name: "AI Platform", description: "Explore the available AI workspace and tools.", href: "/ai-platform", category: "AI & Writing", icon: "✧", tags: "ai platform models tools" },
  { name: "AI Photo Editor", description: "Open image editing workflows and supported actions.", href: "/ai-photo-editor", category: "Image Tools", icon: "◈", tags: "image photo edit ai" },
  { name: "Photo Studio", description: "Prepare passport photos and image layouts.", href: "/photo-studio", category: "Image Tools", icon: "▧", tags: "photo passport id image" },
  { name: "CV Maker", description: "Build a clean, professional CV.", href: "/cv-maker", category: "Productivity", icon: "▤", tags: "resume cv job career" },
  { name: "AI Prompt Generator", description: "Create clearer prompts for AI workflows.", href: "/ai-prompts", category: "AI & Writing", icon: "⌘", tags: "prompt generator ai" },
  { name: "Local AI Chat", description: "Explore browser-based local AI where your device supports it.", href: "/ai/local", category: "AI & Writing", icon: "◉", tags: "local offline browser ai" },
  { name: "AI Agent", description: "Open the AI agent workspace.", href: "/ai-agent", category: "AI & Writing", icon: "⌁", tags: "agent automate assistant" },
];

const categories = [
  { name: "All tools", icon: "✣", note: "Browse the available workspace" },
  { name: "PDF & Files", icon: "▤", note: "Convert and manage supported files" },
  { name: "Image Tools", icon: "▧", note: "Photo editing and image workflows" },
  { name: "AI & Writing", icon: "✦", note: "AI assistance and writing" },
  { name: "Productivity", icon: "◷", note: "Everyday work utilities" },
];

const benefits = [
  ["⚡", "Fast workflows", "Get to the tool you need without unnecessary steps."],
  ["◈", "Privacy-minded", "Use browser-first tools where supported; check each tool for its processing method."],
  ["▣", "Works across screens", "A responsive workspace for desktop, tablet and mobile."],
  ["৳", "Free-first approach", "QuickToolBox prioritizes free tools and transparent limitations."],
];

export default function PdfGuruInspiredHome() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All tools");
  const visibleTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => (active === "All tools" || tool.category === active) &&
      (!q || [tool.name, tool.description, tool.category, tool.tags].join(" ").toLowerCase().includes(q)));
  }, [query, active]);

  return (
    <main className="pg-home">
      <section className="pg-hero">
        <div className="pg-hero-copy">
          <div className="pg-eyebrow"><span className="pg-live-dot" /> YOUR EVERYDAY DIGITAL WORKSPACE</div>
          <h1>Every tool you need.<br /><span>One quick workspace.</span></h1>
          <p>Discover AI, file, image and productivity tools in one place. Search the directory, choose a workflow and get started.</p>
          <div className="pg-hero-actions">
            <a className="pg-primary" href="#tool-directory">Explore all tools <span>↗</span></a>
            <Link className="pg-secondary" href="/file-converter">Open file workspace <span>→</span></Link>
          </div>
          <div className="pg-trust"><span>✓ Free-first tools</span><span>✓ No installation</span><span>✓ Mobile friendly</span></div>
        </div>
        <div className="pg-hero-art" aria-hidden="true">
          <div className="pg-ring pg-ring-a" /><div className="pg-ring pg-ring-b" />
          <div className="pg-core"><b>Q</b><small>QUICK<br />TOOLBOX</small></div>
          <div className="pg-orbit-card pg-card-a"><b>✦</b><span>AI workspace</span><small>Ideas into action</small></div>
          <div className="pg-orbit-card pg-card-b"><b>⇄</b><span>File tools</span><small>Convert with ease</small></div>
          <div className="pg-orbit-card pg-card-c"><b>◈</b><span>Image studio</span><small>Create & prepare</small></div>
        </div>
      </section>

      <section className="pg-directory" id="tool-directory">
        <div className="pg-heading">
          <div><span className="pg-kicker">THE TOOL DIRECTORY</span><h2>What would you like to do?</h2><p>Search the available tools or browse by category.</p></div>
          <span className="pg-count">{tools.length} available destinations</span>
        </div>
        <label className="pg-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools, e.g. PDF, photo, AI..." aria-label="Search tools" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
          <kbd>SEARCH</kbd>
        </label>
        <div className="pg-categories" aria-label="Filter tools by category">
          {categories.map((category) => <button key={category.name} type="button" className={active === category.name ? "is-active" : ""} onClick={() => setActive(category.name)}><span>{category.icon}</span>{category.name}</button>)}
        </div>
        <div className="pg-category-note">{categories.find((item) => item.name === active)?.note}</div>
        {visibleTools.length ? <div className="pg-tool-grid">
          {visibleTools.map((tool, index) => <Link href={tool.href} className="pg-tool-card" key={tool.href}>
            <div className="pg-tool-top"><span className="pg-tool-icon">{tool.icon}</span><span className="pg-tool-category">{tool.category}</span></div>
            <div className="pg-tool-copy"><h3>{tool.name}</h3><p>{tool.description}</p></div>
            <span className="pg-tool-arrow" aria-hidden="true">↗</span><span className="pg-tool-number">{String(index + 1).padStart(2, "0")}</span>
          </Link>)}
        </div> : <div className="pg-empty"><b>No matching tools found</b><p>Try another keyword or clear the category filter.</p><button type="button" onClick={() => { setQuery(""); setActive("All tools"); }}>Clear filters</button></div>}
      </section>

      <section className="pg-benefits">
        <div className="pg-benefit-intro"><span className="pg-kicker">MADE FOR EVERYDAY WORK</span><h2>Less friction.<br /><span>More focus.</span></h2><p>A clear, practical home for your digital workflows.</p></div>
        <div className="pg-benefit-grid">{benefits.map(([icon, title, copy]) => <article className="pg-benefit" key={title}><span>{icon}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
      </section>
      <section className="pg-bottom-cta"><div><span className="pg-kicker">READY WHEN YOU ARE</span><h2>Pick a tool. Make progress.</h2><p>Open a workspace and see its supported features and limitations clearly.</p></div><Link href="/file-converter">Start with files <span>↗</span></Link></section>
      <footer className="pg-footer"><Link href="/" className="pg-brand"><span>Q</span> QuickToolBox</Link><p>Useful tools. Clear workflows. One place.</p><span>© {new Date().getFullYear()} QuickToolBox</span></footer>
    </main>
  );
}
