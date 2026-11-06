"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConverterEngines from "./ConverterEngines";

const tools = [
  { name: "Image Converter", category: "Images", description: "Convert images between PNG, JPEG and WebP in your browser.", href: "#image-converter", status: "ready", formats: "PNG ↔ JPEG ↔ WebP" },
  { name: "Image Compressor", category: "Images", description: "Resize and compress an image with a quality setting.", href: "#image-converter", status: "ready", formats: "PNG / JPEG / WebP" },
  { name: "SVG to PNG", category: "Vector", description: "Rasterize a local SVG file to a downloadable PNG in your browser.", href: "#svg-converter", status: "ready", formats: "SVG → PNG" },
  ...[
    ["PDF to Word", "Documents", "PDF → DOCX"], ["Word to PDF", "Documents", "DOCX → PDF"], ["PDF to JPG", "Documents", "PDF → JPG"],
    ["HTML to PDF", "Documents", "HTML → PDF"], ["PDF OCR", "Documents", "Scanned PDF → searchable PDF"],
    ["MP4 Converter", "Video", "MP4 / MOV / MKV"], ["Video Compressor", "Video", "MP4 / WebM"], ["Video to GIF", "Video", "Video → GIF"],
    ["MP3 Converter", "Audio", "MP3 / WAV / M4A"], ["Audio Compressor", "Audio", "MP3 / WAV / FLAC"],
    ["CSV to Excel", "Spreadsheets", "CSV → XLSX", "testing"], ["Excel to CSV", "Spreadsheets", "XLSX → CSV", "testing"],
    ["PowerPoint to PDF", "Presentations", "PPTX → PDF"], ["PDF to PowerPoint", "Presentations", "PDF → PPTX"],
    ["EPUB Converter", "E-books", "EPUB / MOBI / PDF"], ["ZIP Extractor", "Archives", "ZIP → files", "testing"], ["ZIP Creator", "Archives", "Files → ZIP", "testing"],
    ["EPS Converter", "Vector", "EPS / SVG / PDF"],
    ["DWG / DXF Converter", "CAD", "DWG / DXF"], ["Font Converter", "Fonts", "TTF / OTF / WOFF"],
  ].map(([name, category, formats, status]) => ({ name, category, formats, description: status === "testing" ? "Browser-local engine added; real-file and Preview tests are pending." : "Planned for a later free, browser-first release.", status: status || "planned", href: status === "ready" || status === "testing" ? "#converter-engines" : "#roadmap" })),
];

const categories = ["All tools", "Documents", "Images", "Video", "Audio", "Spreadsheets", "Presentations", "E-books", "Archives", "Vector", "CAD", "Fonts"];

function ImageConverter() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("image/webp");
  const [quality, setQuality] = useState(0.82);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result?.url]);

  function choose(next) {
    setFile(next);
    setResult(null);
    setError("");
  }

  async function convert() {
    setError("");
    setResult(null);
    if (!file) return setError("Choose an image first.");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setError("Supported input formats are PNG, JPEG and WebP.");
    if (file.size > 25 * 1024 * 1024) return setError("Maximum input size is 25 MB.");
    setBusy(true);
    let objectUrl;
    try {
      objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const hasWidth = width.trim() !== "";
      const hasHeight = height.trim() !== "";
      const requestedWidth = hasWidth ? Number(width) : null;
      const requestedHeight = hasHeight ? Number(height) : null;
      // Preserve the source aspect ratio when the user supplies only one dimension.
      const targetWidth = hasWidth ? requestedWidth : hasHeight ? Math.round(image.naturalWidth * requestedHeight / image.naturalHeight) : image.naturalWidth;
      const targetHeight = hasHeight ? requestedHeight : hasWidth ? Math.round(image.naturalHeight * targetWidth / image.naturalWidth) : image.naturalHeight;
      if (!Number.isInteger(targetWidth) || !Number.isInteger(targetHeight) || targetWidth < 1 || targetHeight < 1 || targetWidth > 12000 || targetHeight > 12000 || targetWidth * targetHeight > 40000000) {
        throw new Error("Enter valid dimensions up to 12,000 px per side and 40 megapixels total.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not start image processing.");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, targetWidth, targetHeight);
      }
      context.drawImage(image, 0, 0, targetWidth, targetHeight);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, Number(quality)));
      if (!blob) throw new Error("This browser could not export the selected image format.");
      if (blob.type !== format) throw new Error(`Your browser exported ${blob.type || "an unknown format"} instead of ${format}. Choose another output format.`);
      const extension = format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";
      const url = URL.createObjectURL(blob);
      setResult({ url, name: (file.name.replace(/\.[^.]+$/, "") || "converted-image") + "." + extension, size: blob.size, width: targetWidth, height: targetHeight });
      canvas.width = 1;
      canvas.height = 1;
    } catch (e) {
      setError(e?.message || "Image conversion failed. Try another image.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBusy(false);
    }
  }

  return (
    <section id="image-converter" style={styles.converter}>
      <div>
        <span style={styles.eyebrow}>BROWSER-BASED · NO ACCOUNT · NO UPLOAD</span>
        <h2 style={styles.sectionTitle}>Image converter & compressor</h2>
        <p style={styles.muted}>Convert PNG, JPEG and WebP files locally on your device. Nothing is sent to a conversion server.</p>
      </div>
      <label style={styles.field}>Choose an image (up to 25 MB)
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => choose(e.target.files?.[0] || null)} style={styles.input} />
      </label>
      {file && <p style={styles.muted}>Selected: {file.name} · {(file.size / 1024).toFixed(1)} KB</p>}
      <div style={styles.controls}>
        <label style={styles.field}>Output format
          <select value={format} onChange={(e) => setFormat(e.target.value)} style={styles.input}>
            <option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option>
          </select>
        </label>
        <label style={styles.field}>Quality (JPEG / WebP)
          <select value={quality} onChange={(e) => setQuality(Number(e.target.value))} style={styles.input}>
            <option value="0.55">Smaller · 55%</option><option value="0.72">Balanced · 72%</option><option value="0.82">High · 82%</option><option value="0.94">Very high · 94%</option>
          </select>
        </label>
        <label style={styles.field}>Width (px, optional)
          <input type="number" min="1" max="12000" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="Original width" style={styles.input} />
        </label>
        <label style={styles.field}>Height (px, optional)
          <input type="number" min="1" max="12000" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Auto if blank" style={styles.input} />
        </label>
      </div>
      <button type="button" onClick={convert} disabled={busy || !file} style={styles.primary}>{busy ? "Converting…" : "Convert image"}</button>
      {error && <p role="alert" style={styles.error}>{error}</p>}
      {result && <div role="status" style={styles.success}>
        <strong>Conversion complete</strong>
        <p>{result.width} × {result.height} px · {(result.size / 1024).toFixed(1)} KB</p>
        <a href={result.url} download={result.name} style={styles.download}>Download {result.name}</a>
      </div>}
      <p style={styles.fine}>Note: JPEG does not support transparency; transparent areas are filled white. Actual file size may increase for some images.</p>
    </section>
  );
}


function SvgToPngConverter() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result?.url]);

  async function convert() {
    setError("");
    setResult(null);
    if (!file) return setError("Choose an SVG file first.");
    if (file.size > 10 * 1024 * 1024) return setError("Maximum SVG file size is 10 MB.");
    setBusy(true);
    let sourceUrl;
    try {
      const source = await file.text();
      const documentNode = new DOMParser().parseFromString(source, "image/svg+xml");
      if (documentNode.querySelector("parsererror")) throw new Error("This file is not valid SVG XML.");
      const svg = documentNode.documentElement;
      if (svg.localName !== "svg" || svg.namespaceURI !== "http://www.w3.org/2000/svg") throw new Error("The file does not contain a valid SVG root element.");

      // Remove active content and reject external references before loading the SVG as an image.
      if (svg.querySelector("script, foreignObject, iframe, object, embed, audio, video")) {
        throw new Error("This SVG contains active or embedded content and cannot be converted safely.");
      }
      for (const element of [svg, ...svg.querySelectorAll("*")]) {
        for (const attribute of [...element.attributes]) {
          const name = attribute.name.toLowerCase();
          const value = attribute.value.trim();
          if (name.startsWith("on")) {
            element.removeAttribute(attribute.name);
          } else if (name === "href" || name.endsWith(":href")) {
            if (value && !value.startsWith("#")) throw new Error("External SVG references are not supported. Embed artwork directly in the SVG.");
          } else if ((name === "style" || name === "filter") && /url\s*\(|@import|expression\s*\(/i.test(value)) {
            throw new Error("External CSS resources are not supported in SVG files.");
          }
        }
      }
      for (const styleNode of svg.querySelectorAll("style")) {
        if (/@import|url\s*\(|expression\s*\(/i.test(styleNode.textContent || "")) {
          throw new Error("SVG styles that load external resources are not supported.");
        }
      }

      const number = (value) => {
        const match = String(value || "").trim().match(/^([0-9]+(?:\.[0-9]+)?)(?:px)?$/i);
        return match ? Number(match[1]) : null;
      };
      const viewBox = (svg.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
      const viewWidth = viewBox.length === 4 && viewBox.every(Number.isFinite) ? viewBox[2] : null;
      const viewHeight = viewBox.length === 4 && viewBox.every(Number.isFinite) ? viewBox[3] : null;
      const width = number(svg.getAttribute("width")) || viewWidth || 300;
      const height = number(svg.getAttribute("height")) || viewHeight || 150;
      const targetWidth = Math.round(width);
      const targetHeight = Math.round(height);
      if (!Number.isInteger(targetWidth) || !Number.isInteger(targetHeight) || targetWidth < 1 || targetHeight < 1 || targetWidth > 8000 || targetHeight > 8000 || targetWidth * targetHeight > 32000000) {
        throw new Error("SVG dimensions must be within 8,000 px per side and 32 megapixels total.");
      }

      const safeSvg = new XMLSerializer().serializeToString(svg);
      sourceUrl = URL.createObjectURL(new Blob([safeSvg], { type: "image/svg+xml" }));
      const image = new Image();
      image.src = sourceUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not start PNG processing.");
      context.drawImage(image, 0, 0, targetWidth, targetHeight);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob || blob.type !== "image/png") throw new Error("Your browser could not export a PNG image.");
      const url = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.svg$/i, "") || "converted-image";
      setResult({ url, name: baseName + ".png", size: blob.size, width: targetWidth, height: targetHeight });
      canvas.width = 1;
      canvas.height = 1;
    } catch (cause) {
      setError(cause?.message || "SVG conversion failed. Try another SVG file.");
    } finally {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      setBusy(false);
    }
  }

  return (
    <section id="svg-converter" style={styles.converter}>
      <div>
        <span style={styles.eyebrow}>BROWSER-BASED · NO ACCOUNT · NO UPLOAD</span>
        <h2 style={styles.sectionTitle}>SVG to PNG converter</h2>
        <p style={styles.muted}>Convert a local SVG into a PNG image on your device. External resources and active SVG content are rejected for safety.</p>
      </div>
      <label style={styles.field}>Choose an SVG file (up to 10 MB)
        <input type="file" accept=".svg,image/svg+xml" onChange={(event) => { setFile(event.target.files?.[0] || null); setResult(null); setError(""); }} style={styles.input} />
      </label>
      {file && <p style={styles.muted}>Selected: {file.name} · {(file.size / 1024).toFixed(1)} KB</p>}
      <button type="button" onClick={convert} disabled={busy || !file} style={styles.primary}>{busy ? "Converting…" : "Convert SVG to PNG"}</button>
      {error && <p role="alert" style={styles.error}>{error}</p>}
      {result && <div role="status" style={styles.success}>
        <strong>Conversion complete</strong>
        <p>{result.width} × {result.height} px · {(result.size / 1024).toFixed(1)} KB</p>
        <a href={result.url} download={result.name} style={styles.download}>Download {result.name}</a>
      </div>}
      <p style={styles.fine}>The output uses the SVG width/height or viewBox. SVG files with external images, fonts or linked CSS are not supported.</p>
    </section>
  );
}

const styles = {
  page: { maxWidth: 1160, margin: "0 auto", padding: "44px 20px 80px", color: "var(--foreground, #f7f8fc)" },
  hero: { padding: "38px 0 30px", borderBottom: "1px solid var(--border, #303746)" },
  eyebrow: { color: "#7dd3fc", fontSize: 12, fontWeight: 800, letterSpacing: 1.4 },
  title: { fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.08, margin: "12px 0" },
  muted: { color: "var(--muted-foreground, #9ca3af)", lineHeight: 1.65 },
  toolbar: { display: "flex", flexWrap: "wrap", gap: 9, margin: "24px 0" },
  chip: { border: "1px solid var(--border, #394150)", borderRadius: 999, padding: "9px 14px", background: "transparent", color: "inherit", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 245px), 1fr))", gap: 14 },
  card: { border: "1px solid var(--border, #303746)", borderRadius: 16, padding: 18, background: "var(--card, rgba(255,255,255,.025))", display: "flex", flexDirection: "column", gap: 9, minHeight: 178 },
  cardTitle: { margin: 0, fontSize: 18 },
  tag: { fontSize: 11, color: "#7dd3fc", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 },
  link: { color: "#7dd3fc", fontWeight: 700, textDecoration: "none", marginTop: "auto" },
  disabled: { color: "#9ca3af", fontSize: 13, marginTop: "auto" },
  converter: { marginTop: 38, border: "1px solid var(--border, #303746)", borderRadius: 20, padding: 22, background: "var(--card, rgba(255,255,255,.025))" },
  sectionTitle: { fontSize: 25, margin: "8px 0" },
  field: { display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 650, minWidth: 0 },
  input: { width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border, #4b5563)", background: "var(--background, #111827)", color: "inherit", minHeight: 44 },
  controls: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 14, margin: "18px 0" },
  primary: { border: 0, borderRadius: 10, padding: "13px 20px", background: "#2563eb", color: "white", fontWeight: 800, cursor: "pointer" },
  error: { color: "#fca5a5" },
  success: { marginTop: 18, padding: 16, borderRadius: 12, background: "rgba(34,197,94,.09)", border: "1px solid rgba(34,197,94,.35)" },
  download: { display: "inline-block", padding: "10px 14px", borderRadius: 9, background: "#15803d", color: "white", textDecoration: "none", fontWeight: 750 },
  fine: { color: "var(--muted-foreground, #9ca3af)", fontSize: 12, lineHeight: 1.6, marginTop: 16 },
};

export default function FileConverterHub() {
  const [active, setActive] = useState("All tools");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => tools.filter((tool) => (active === "All tools" || tool.category === active) && (tool.name + " " + tool.description + " " + tool.formats).toLowerCase().includes(query.toLowerCase())), [active, query]);
  const readyCount = tools.filter((tool) => tool.status === "ready").length;

  return (
    <main style={styles.page}>
      <div style={styles.hero}>
        <span style={styles.eyebrow}>QUICKTOOLBOX · FREE FILE WORKSPACE</span>
        <h1 style={styles.title}>Convert files. Keep control.</h1>
        <p style={{ ...styles.muted, maxWidth: 720 }}>A free, no-login file conversion workspace. Start with PDF and image tools, with more format families being added in tested releases.</p>
        <p style={{ ...styles.muted, fontSize: 13 }}>{tools.length} tools in the directory · {readyCount} available now · No paid conversion API</p>
      </div>
      <div style={styles.toolbar}>
        {categories.map((category) => <button key={category} type="button" onClick={() => setActive(category)} aria-pressed={active === category} style={{ ...styles.chip, ...(active === category ? { background: "#1d4ed8", borderColor: "#3b82f6", color: "white" } : {}) }}>{category}</button>)}
      </div>
      <label style={{ ...styles.field, maxWidth: 480, marginBottom: 20 }}>Search converters
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try PDF, WebP, MP4, ZIP…" style={styles.input} />
      </label>
      <div style={styles.grid}>
        {filtered.map((tool) => <article key={tool.name} style={styles.card}>
          <span style={styles.tag}>{tool.category} · {tool.status === "ready" ? "Available" : tool.status === "testing" ? "Testing" : "Planned"}</span>
          <h2 style={styles.cardTitle}>{tool.name}</h2>
          <p style={{ ...styles.muted, fontSize: 13, margin: 0 }}>{tool.description}</p>
          <span style={{ ...styles.muted, fontSize: 12 }}>{tool.formats}</span>
          {tool.status === "ready" || tool.status === "testing" ? <Link href={tool.href} style={styles.link}>{tool.status === "testing" ? "Open test area ↓" : "Use converter ↓"}</Link> : <span style={styles.disabled}>Coming in a tested update</span>}
        </article>)}
      </div>
      <ImageConverter />
      <SvgToPngConverter />
      <section id="roadmap" style={{ marginTop: 34 }}>
        <h2 style={styles.sectionTitle}>How the full platform will roll out</h2>
        <p style={styles.muted}>Format support will be enabled only when the conversion engine, output quality and failure cases pass tests. Planned cards are not active converters.</p>
        <ol style={{ ...styles.muted, lineHeight: 2 }}>
          <li>PDF and image conversions, compression and page operations.</li>
          <li>Audio and video using browser codecs where supported, with clear compatibility notices.</li>
          <li>Office documents, spreadsheets, presentations and e-books using free, open-source processing where feasible.</li>
          <li>Archives, vector, CAD and font conversions after safe parsers and reliable format engines are validated.</li>
        </ol>
      </section>
    </main>
  );
}
