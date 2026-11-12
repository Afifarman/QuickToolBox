"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const tools = [
  { name: "AI Platform", description: "Explore the AI workspace and available AI utilities.", category: "AI & Writing", href: "/ai-platform", icon: "✦", tag: "WORKSPACE" },
  { name: "AI Assistant", description: "Ask questions, explain topics and work with text.", category: "AI & Writing", href: "/ai", icon: "✧", tag: "AI" },
  { name: "AI Photo Editor", description: "Open image editing workflows and available AI actions.", category: "Image Tools", href: "/ai-photo-editor", icon: "◈", tag: "IMAGE" },
  { name: "AI Prompt Generator", description: "Build clearer prompts for your next AI task.", category: "AI & Writing", href: "/ai-prompts", icon: "⌘", tag: "AI" },
  { name: "CV Maker", description: "Create and prepare a professional CV.", category: "Productivity", href: "/cv-maker", icon: "▤", tag: "CAREER" },
  { name: "Image Converter", description: "Convert PNG, JPEG and WebP locally in your browser.", category: "Image Tools", href: "/file-converter#image-converter", icon: "⇄", tag: "PNG · JPG · WEBP" },
  { name: "SVG to PNG", description: "Rasterize a local SVG file and download a PNG.", category: "Image Tools", href: "/file-converter#svg-converter", icon: "◇", tag: "VECTOR" },
  { name: "Images to PDF", description: "Combine JPG, PNG or WebP images into a PDF.", category: "PDF Tools", href: "/file-converter#images-to-pdf", icon: "▧", tag: "IMAGE → PDF" },
  { name: "Merge PDF", description: "Join multiple PDF documents in your browser.", category: "PDF Tools", href: "/file-converter#merge-pdf", icon: "▤", tag: "PDF" },
  { name: "Audio to WAV", description: "Convert supported browser-playable audio to WAV.", category: "Audio Tools", href: "/file-converter#audio-to-wav", icon: "♫", tag: "AUDIO" },
  { name: "Photo Studio", description: "Prepare passport photos, ID layouts and image PDFs.", category: "Image Tools", href: "/photo-studio", icon: "▣", tag: "STUDIO" },
];

const categories = ["All tools", "PDF Tools", "Image Tools", "AI & Writing", "Productivity", "Audio Tools"];

export default function ToolDirectoryHome() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All tools");
  const filtered = useMemo(() => tools.filter((tool) => {
    const matchesCategory = category === "All tools" || tool.category === category;
    const haystack = (tool.name + " " + tool.description + " " + tool.category + " " + tool.tag).toLowerCase();
    return matchesCategory && haystack.includes(query.trim().toLowerCase());
  }), [category, query]);

  return (
    <main className="qtd-page">
      <section className="qtd-hero">
        <div className="qtd-hero-copy">
          <span className="qtd-eyebrow"><i /> YOUR EVERYDAY DIGITAL WORKSPACE</span>
          <h1>Everything you need.<br /><span>One quick toolbox.</span></h1>
          <p>Find a useful tool, upload when needed, and finish your task in one focused workspace. Free browser-based tools with clear availability labels.</p>
          <div className="qtd-actions">
            <a href="#tool-directory" className="qtd-primary">Explore all tools <span>↘</span></a>
            <Link href="/file-converter" className="qtd-secondary">Open file workspace <span>↗</span></Link>
          </div>
          <div className="qtd-trust"><span>✓ Browser-first workflows</span><span>✓ No installation</span><span>✓ Mobile-ready</span></div>
        </div>
        <div className="qtd-visual" aria-hidden="true">
          <div className="qtd-orbit qtd-orbit-a" /><div className="qtd-orbit qtd-orbit-b" /><div className="qtd-orbit qtd-orbit-c" />
          <div className="qtd-core"><span>Q</span><small>QUICK<br />TOOLBOX</small></div>
          <div className="qtd-float qtd-float-one"><b>▤</b><span>PDF tools</span><small>Organize & convert</small></div>
          <div className="qtd-float qtd-float-two"><b>✦</b><span>AI workspace</span><small>Ideas into action</small></div>
          <div className="qtd-float qtd-float-three"><b>◈</b><span>Image studio</span><small>Create & prepare</small></div>
        </div>
      </section>

      <section className="qtd-directory" id="tool-directory">
        <div className="qtd-section-heading">
          <div><span className="qtd-kicker">TOOL DIRECTORY</span><h2>What would you like to do?</h2><p>Search the available tools or browse by category.</p></div>
          <span className="qtd-count">{tools.length} listed tools</span>
        </div>
        <label className="qtd-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools — e.g. merge PDF, image converter..." aria-label="Search tools" /><kbd>SEARCH</kbd></label>
        <div className="qtd-categories" role="group" aria-label="Filter tools by category">
          {categories.map((item) => <button type="button" key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}
        </div>
        <div className="qtd-grid" aria-live="polite">
          {filtered.map((tool, index) => <Link className="qtd-card" href={tool.href} key={tool.name}>
            <div className="qtd-card-top"><span className="qtd-icon">{tool.icon}</span><span className="qtd-tag">{tool.tag}</span></div>
            <div><h3>{tool.name}</h3><p>{tool.description}</p></div>
            <span className="qtd-card-bottom"><span>Open tool</span><b>↗</b></span>
            <span className="qtd-card-index">{String(index + 1).padStart(2, "0")}</span>
          </Link>)}
          {!filtered.length && <div className="qtd-empty"><b>No matching tools found</b><p>Try another keyword or choose a different category.</p><button type="button" onClick={() => { setQuery(""); setCategory("All tools"); }}>Clear filters</button></div>}
        </div>
      </section>

      <section className="qtd-bottom">
        <div><span className="qtd-kicker">ONE WORKSPACE, CLEAR WORKFLOWS</span><h2>Less searching.<br /><span>More getting done.</span></h2></div>
        <div className="qtd-benefits"><article><b>01 · Find</b><p>Search the directory or choose a focused category.</p></article><article><b>02 · Work</b><p>Open the tool and follow its supported input steps.</p></article><article><b>03 · Finish</b><p>Download the result when the tool provides an output.</p></article></div>
      </section>
      <footer className="qtd-footer"><Link href="/" className="qtd-footer-brand"><span>Q</span> QuickToolBox</Link><p>Useful tools. Clear workflows. One place.</p><span>© {new Date().getFullYear()} QuickToolBox</span></footer>
    </main>
  );
}
