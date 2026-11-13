"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConverterEngines from "./ConverterEngines";

// `status` drives the badge and the call to action:
//   ready   — shipped and exercised in the browser
//   testing — engine exists but still needs real-file and cross-browser checks
//   planned — no engine yet; listed for transparency
const tools = [
  { name: "Image Converter", category: "Images", description: "Convert images between PNG, JPEG and WebP in your browser.", href: "#image-converter", status: "ready", formats: "PNG ↔ JPEG ↔ WebP" },
  { name: "Image Compressor", category: "Images", description: "Resize and re-encode an image with a quality setting.", href: "#image-converter", status: "ready", formats: "PNG / JPEG / WebP" },
  { name: "SVG to PNG", category: "Vector", description: "Rasterise a local SVG file to a downloadable PNG in your browser.", href: "#svg-converter", status: "ready", formats: "SVG → PNG" },
  { name: "Images to PDF", category: "Documents", description: "Combine one or more JPG, PNG or WebP images into a single PDF.", href: "#images-to-pdf", status: "ready", formats: "JPG / PNG / WebP → PDF" },
  { name: "Merge PDF", category: "Documents", description: "Combine two or more PDF documents into one file, without uploading.", href: "#merge-pdf", status: "ready", formats: "PDF + PDF → PDF" },
  { name: "Split PDF", category: "Documents", description: "Export every page of a PDF as a separate file in one ZIP download.", href: "#split-pdf", status: "ready", formats: "PDF → ZIP of pages" },
  { name: "Audio to WAV", category: "Audio", description: "Decode an audio file and save it as uncompressed WAV in your browser.", href: "#audio-to-wav", status: "ready", formats: "MP3 / M4A / OGG → WAV" },

  { name: "PDF Compressor", category: "Documents", description: "Rasterise each page to a JPEG to shrink a PDF. Text, links and forms are not preserved.", href: "#pdf-compressor", status: "testing", formats: "PDF → smaller PDF" },
  { name: "PDF to Word", category: "Documents", description: "Extract selectable text from a PDF into a simple .docx file.", href: "#pdf-to-docx", status: "testing", formats: "PDF → DOCX" },
  { name: "Word to PDF", category: "Documents", description: "Read the text of a .docx and lay it out as a plain PDF.", href: "#word-to-pdf", status: "testing", formats: "DOCX → PDF" },
  { name: "HTML to PDF", category: "Documents", description: "Strip HTML tags and lay the remaining text out as a plain PDF.", href: "#html-to-pdf", status: "testing", formats: "HTML / text → PDF" },
  { name: "PowerPoint to PDF", category: "Presentations", description: "Extract slide text into a simple PDF. Slide design is not preserved.", href: "#pptx-to-pdf", status: "testing", formats: "PPTX → PDF" },
  { name: "Audio Compressor", category: "Audio", description: "Re-encode audio to mono WAV at a lower sample rate.", href: "#audio-compressor", status: "testing", formats: "Audio → mono WAV" },
  { name: "Video Compressor", category: "Video", description: "Downscale a video and record it as WebM. The output has no audio track.", href: "#video-compressor", status: "testing", formats: "MP4 / MOV / WebM → WebM" },
  { name: "CSV to Excel", category: "Spreadsheets", description: "Turn a CSV file into a real .xlsx workbook.", href: "#csv-to-excel", status: "testing", formats: "CSV → XLSX" },
  { name: "Excel to CSV", category: "Spreadsheets", description: "Export the first worksheet of an .xlsx file to CSV.", href: "#excel-to-csv", status: "testing", formats: "XLSX → CSV" },
  { name: "Font Converter", category: "Fonts", description: "Repackage a TrueType font (.ttf) as a compressed WOFF web font.", href: "#font-converter", status: "testing", formats: "TTF → WOFF" },
  { name: "ZIP Creator", category: "Archives", description: "Pack several local files into one uncompressed ZIP archive.", href: "#zip-creator", status: "testing", formats: "Files → ZIP" },
  { name: "ZIP Extractor", category: "Archives", description: "Verify and unpack a ZIP archive in your browser.", href: "#zip-extractor", status: "testing", formats: "ZIP → files" },

  { name: "PDF to JPG", category: "Documents", description: "Render each page of a PDF as a downloadable JPG image.", href: "#pdf-to-jpg", status: "testing", formats: "PDF → JPG (ZIP)" },
  { name: "PDF to Text", category: "Documents", description: "Extract the selectable text of a PDF into a plain .txt file.", href: "#pdf-to-text", status: "testing", formats: "PDF → TXT" },
  { name: "Video to GIF", category: "Video", description: "Record a short video as an animated GIF in your browser.", href: "#video-to-gif", status: "testing", formats: "Video → GIF" },
  { name: "PDF to PowerPoint", category: "Presentations", description: "Extract slide text into a simple PPTX file. Slide design is not preserved.", href: "#pdf-to-pptx", status: "testing", formats: "PDF → PPTX" },
  { name: "EPUB to PDF", category: "E-books", description: "Extract the text of an EPUB book and lay it out as a PDF.", href: "#epub-to-pdf", status: "testing", formats: "EPUB → PDF" },
  { name: "DXF to SVG", category: "Vector", description: "Render the geometry of an ASCII DXF file as an SVG drawing.", href: "#dxf-to-svg", status: "testing", formats: "DXF → SVG" },
  { name: "MP4 Converter", category: "Video", description: "Re-encode a video to MP4 when the browser supports MP4 recording.", href: "#mp4-converter", status: "testing", formats: "Video → MP4" },
];

const categories = ["All tools", "Available now", "Documents", "Images", "Audio", "Spreadsheets", "Archives", "Vector", "Video", "Presentations", "E-books", "CAD", "Fonts"];

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
  page: { maxWidth: 1160, margin: "0 auto", padding: "clamp(20px,5vw,44px) clamp(12px,4vw,20px) 80px", color: "var(--foreground, #f7f8fc)", boxSizing: "border-box", width: "100%" },
  hero: { position: "relative", isolation: "isolate", overflow: "hidden", padding: "clamp(26px,5vw,54px)", border: "1px solid rgba(129,140,248,.28)", borderRadius: 28, background: "radial-gradient(ellipse at 78% 18%, rgba(124,58,237,.30), transparent 38%), radial-gradient(ellipse at 12% 90%, rgba(14,165,233,.20), transparent 42%), linear-gradient(135deg, #10152d 0%, #171b3b 52%, #111827 100%)", boxShadow: "0 24px 70px rgba(4,8,25,.35), inset 0 1px 0 rgba(255,255,255,.10)" },
  eyebrow: { color: "#7dd3fc", fontSize: 12, fontWeight: 800, letterSpacing: 1.4 },
  title: { fontSize: "clamp(36px, 6vw, 66px)", lineHeight: 1.02, letterSpacing: "-.045em", margin: "16px 0", maxWidth: 760, color: "#fff", textShadow: "0 8px 35px rgba(99,102,241,.24)" },
  muted: { color: "var(--muted-foreground, #9ca3af)", lineHeight: 1.65 },
  toolbar: { display: "flex", flexWrap: "wrap", gap: 9, margin: "24px 0" },
  chip: { border: "1px solid var(--border, #394150)", borderRadius: 999, padding: "9px 14px", background: "transparent", color: "inherit", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 245px), 1fr))", gap: 14 },
  card: { position: "relative", overflow: "hidden", border: "1px solid rgba(148,163,184,.20)", borderRadius: 20, padding: 20, background: "linear-gradient(145deg, rgba(30,41,72,.76), rgba(15,23,42,.72))", boxShadow: "0 12px 32px rgba(2,6,23,.16), inset 0 1px 0 rgba(255,255,255,.07)", display: "flex", flexDirection: "column", gap: 11, minHeight: 205, transition: "transform .28s ease, border-color .28s ease, box-shadow .28s ease" },
  cardTitle: { margin: 0, fontSize: 18 },
  tag: { fontSize: 11, color: "#7dd3fc", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 },
  link: { color: "#7dd3fc", fontWeight: 700, textDecoration: "none", marginTop: "auto" },
  disabled: { color: "#9ca3af", fontSize: 13, marginTop: "auto" },
  converter: { marginTop: 38, border: "1px solid rgba(129,140,248,.24)", borderRadius: 24, padding: "clamp(16px,4vw,28px)", background: "linear-gradient(145deg, rgba(30,41,72,.55), rgba(15,23,42,.48))", boxShadow: "0 18px 48px rgba(2,6,23,.18), inset 0 1px 0 rgba(255,255,255,.06)", width: "100%", boxSizing: "border-box", overflowX: "hidden" },
  sectionTitle: { fontSize: 25, margin: "8px 0" },
  field: { display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 650, minWidth: 0 },
  input: { width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border, #4b5563)", background: "var(--background, #111827)", color: "inherit", minHeight: 44 },
  controls: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 14, margin: "18px 0" },
  primary: { border: "1px solid rgba(255,255,255,.24)", borderRadius: 14, padding: "14px 22px", background: "linear-gradient(110deg, #6366f1, #8b5cf6 55%, #0ea5e9)", color: "white", fontWeight: 850, cursor: "pointer", minHeight: 50, touchAction: "manipulation", width: "100%", maxWidth: 340, fontSize: "clamp(14px,3.5vw,16px)", boxShadow: "0 12px 28px rgba(99,102,241,.28), inset 0 1px 0 rgba(255,255,255,.25)" },
  error: { color: "#fca5a5" },
  success: { marginTop: 18, padding: 16, borderRadius: 12, background: "rgba(34,197,94,.09)", border: "1px solid rgba(34,197,94,.35)" },
  download: { display: "inline-block", padding: "10px 14px", borderRadius: 9, background: "#15803d", color: "white", textDecoration: "none", fontWeight: 750 },
  fine: { color: "var(--muted-foreground, #9ca3af)", fontSize: 12, lineHeight: 1.6, marginTop: 16 },
};

export default function FileConverterHub() {
  const [active, setActive] = useState("All tools");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => tools.filter((tool) => (active === "All tools" ? true : active === "Available now" ? (tool.status === "ready" || tool.status === "testing") : tool.category === active) && (tool.name + " " + tool.description + " " + tool.formats).toLowerCase().includes(query.toLowerCase())), [active, query]);
  const readyCount = tools.filter((tool) => tool.status === "ready").length;
  const testingCount = tools.filter((tool) => tool.status === "testing").length;

  return (
    <main className="qt-file-converter" style={styles.page}>
      <style jsx global>{`
        @keyframes qt-float { 0%,100% { transform: translateY(0) rotate(-7deg); } 50% { transform: translateY(-13px) rotate(3deg); } }
        @keyframes qt-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes qt-glow { 0%,100% { opacity:.45; transform:scale(.92); } 50% { opacity:.9; transform:scale(1.08); } }
        @keyframes qt-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .qt-file-converter .qt-studio-visual { position:absolute; right:clamp(8px,7vw,100px); top:50%; transform:translateY(-50%); width:clamp(130px,22vw,245px); aspect-ratio:1; display:grid; place-items:center; pointer-events:none; }
        .qt-file-converter .qt-studio-core { width:48%; aspect-ratio:1; display:grid; place-items:center; border-radius:28%; color:white; font-size:clamp(38px,6vw,66px); background:linear-gradient(145deg,#a78bfa,#4f46e5 58%,#0284c7); box-shadow:0 24px 48px rgba(79,70,229,.48),inset 0 2px 3px rgba(255,255,255,.55),inset 0 -8px 15px rgba(15,23,42,.25); transform:rotate(-12deg) perspective(500px) rotateX(12deg); animation:qt-float 5s ease-in-out infinite; }
        .qt-file-converter .qt-studio-orbit { position:absolute; inset:9%; border:1px solid rgba(196,181,253,.42); border-radius:50%; transform:rotateX(65deg); animation:qt-orbit 18s linear infinite; box-shadow:0 0 35px rgba(129,140,248,.14); }
        .qt-file-converter .qt-studio-orbit:before,.qt-file-converter .qt-studio-orbit:after { content:""; position:absolute; width:17%; aspect-ratio:1; border-radius:12px; background:linear-gradient(145deg,#e0e7ff,#818cf8); box-shadow:0 8px 22px rgba(99,102,241,.45); }
        .qt-file-converter .qt-studio-orbit:before { top:4%; left:16%; }.qt-file-converter .qt-studio-orbit:after { bottom:4%; right:16%; background:linear-gradient(145deg,#bae6fd,#0ea5e9); }
        .qt-file-converter .qt-tool-symbol { width:46px;height:46px;display:grid;place-items:center;border-radius:15px;font-size:23px;background:linear-gradient(145deg,rgba(129,140,248,.24),rgba(14,165,233,.12));border:1px solid rgba(165,180,252,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.12); }
        .qt-file-converter .qt-file-card:hover { transform:translateY(-5px); border-color:rgba(129,140,248,.55); box-shadow:0 20px 42px rgba(2,6,23,.28),0 0 28px rgba(99,102,241,.10); }
        .qt-file-converter .qt-file-card:focus-within { outline:2px solid #818cf8; outline-offset:3px; }
        .qt-file-converter .qt-file-chip[aria-pressed="true"] { background:linear-gradient(110deg,#4f46e5,#7c3aed)!important; border-color:#a5b4fc!important; box-shadow:0 7px 18px rgba(99,102,241,.22); }
        .qt-file-converter .qt-file-search input:focus,.qt-file-converter input:focus,.qt-file-converter select:focus { outline:2px solid #818cf8; outline-offset:2px; }
        @media(max-width:680px) { .qt-file-converter .qt-studio-visual { opacity:.22; right:-28px; top:25%; width:155px; } .qt-file-converter .qt-file-hero { padding:26px 20px!important; } .qt-file-converter .qt-file-toolbar { gap:7px!important; } .qt-file-converter .qt-file-chip { padding:8px 11px!important; font-size:12px; } }
        @media(prefers-reduced-motion:reduce) { .qt-file-converter *,.qt-file-converter *:before,.qt-file-converter *:after { animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important; } }
      `}</style>
      <div className="qt-file-hero" style={styles.hero}>
        <div className="qt-studio-visual" aria-hidden="true"><div className="qt-studio-orbit"></div><div className="qt-studio-core">⇄</div></div>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
          <span style={{ ...styles.eyebrow, color: "#c4b5fd" }}>✦ QUICKTOOLBOX · FREE FILE WORKSPACE</span>
          <h1 style={styles.title}>Your files.<br/><span style={{ background: "linear-gradient(90deg,#c4b5fd,#67e8f9,#a5b4fc,#c4b5fd)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", color: "transparent", animation: "qt-shimmer 7s linear infinite" }}>Reimagined.</span></h1>
          <p style={{ ...styles.muted, maxWidth: 610, color: "#cbd5e1", fontSize: 16 }}>A beautifully simple workspace to convert, compress and transform files — free, private and right in your browser.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <span style={{ ...styles.chip, color: "#e0e7ff", borderColor: "rgba(196,181,253,.3)", background: "rgba(99,102,241,.13)" }}>✧ {tools.length} format tools</span>
            <span style={{ ...styles.chip, color: "#e0e7ff", borderColor: "rgba(196,181,253,.3)", background: "rgba(99,102,241,.13)" }}>⌁ {readyCount} ready · {testingCount} testing</span>
            <span style={{ ...styles.chip, color: "#e0e7ff", borderColor: "rgba(196,181,253,.3)", background: "rgba(99,102,241,.13)" }}>◈ No paid API</span>
          </div>
        </div>
      </div>
      <div className="qt-file-toolbar" style={styles.toolbar}>
        {categories.map((category) => <button key={category} type="button" onClick={() => setActive(category)} aria-pressed={active === category} style={{ ...styles.chip, ...(active === category ? { background: "#1d4ed8", borderColor: "#3b82f6", color: "white" } : {}) }}>{category}</button>)}
      </div>
      <label className="qt-file-search" style={{ ...styles.field, maxWidth: 480, marginBottom: 20 }}>Search converters
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try PDF, WebP, MP4, ZIP…" style={styles.input} />
      </label>
      <div className="qt-file-grid" style={styles.grid}>
        {filtered.map((tool) => <article className="qt-file-card" key={tool.name} style={styles.card}>
          <span style={styles.tag}>{tool.category} · {tool.status === "ready" ? "Available" : tool.status === "testing" ? "Testing" : "Planned"}</span>
          <h2 style={{ ...styles.cardTitle, letterSpacing: "-.02em" }}>{tool.name}</h2>
          <p style={{ ...styles.muted, fontSize: 13, margin: 0 }}>{tool.description}</p>
          <span style={{ ...styles.muted, fontSize: 12 }}>{tool.formats}</span>
          {tool.status === "ready" || tool.status === "testing" ? <Link href={tool.href} style={styles.link}>Use converter ↓</Link> : <span style={styles.disabled}>Planned — not available yet</span>}
        </article>)}
      </div>
      <ImageConverter />
      <SvgToPngConverter />
      <section className="qt-file-engines" id="converter-engines" style={{ marginTop: 34 }}><ConverterEngines /></section>
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