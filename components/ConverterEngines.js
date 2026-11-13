"use client";

import { useEffect, useState } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { mergePdfBuffers, splitPdfBuffer } from "../lib/pdf-tools";
import { ttfToWoffBytes } from "../lib/woff";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}
function u16(view, offset, value) { view.setUint16(offset, value, true); }
function u32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }
function read16(view, offset) { return view.getUint16(offset, true); }
function read32(view, offset) { return view.getUint32(offset, true); }
async function transform(bytes, format, decompress = false) {
  const Ctor = decompress ? DecompressionStream : CompressionStream;
  if (typeof Ctor !== "function") throw new Error("This browser does not support the compression API needed for ZIP files. Use a current version of Chrome, Edge or Firefox.");
  const stream = new Blob([bytes]).stream().pipeThrough(new Ctor(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function zipFiles(files) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name.replace(/^\/+/, ""));
    if (!name.length || name.length > 65535) throw new Error("Invalid ZIP entry name.");
    const data = new Uint8Array(await file.arrayBuffer());
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0x0800); u16(lv, 8, 0);
    u16(lv, 10, 0); u16(lv, 12, 0x0021); u32(lv, 14, crc); u32(lv, 18, data.length); u32(lv, 22, data.length);
    u16(lv, 26, name.length); local.set(name, 30); local.set(data, 30 + name.length);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0x0800); u16(cv, 10, 0);
    u16(cv, 12, 0); u16(cv, 14, 0x0021); u32(cv, 16, crc); u32(cv, 20, data.length); u32(cv, 24, data.length);
    u16(cv, 28, name.length); u32(cv, 42, offset); central.set(name, 46);
    locals.push(local); centrals.push(central); offset += local.length;
  }
  const centralSize = centrals.reduce((n, item) => n + item.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 8, files.length); u16(ev, 10, files.length);
  u32(ev, 12, centralSize); u32(ev, 16, offset);
  return new Blob([...locals, ...centrals, end], { type: "application/zip" });
}
async function unzipEntries(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (read32(view, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("This is not a valid ZIP archive, or its directory could not be found.");
  const count = read16(view, eocd + 10);
  if (count > 2000) throw new Error("A ZIP archive can contain at most 2,000 entries here.");
  let cursor = read32(view, eocd + 16);
  const output = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    if (read32(view, cursor) !== 0x02014b50) throw new Error("ZIP central directory corrupt.");
    const method = read16(view, cursor + 10), crc = read32(view, cursor + 16);
    const compressedSize = read32(view, cursor + 20), size = read32(view, cursor + 24);
    const nameLength = read16(view, cursor + 28), extraLength = read16(view, cursor + 30), commentLength = read16(view, cursor + 32);
    const localOffset = read32(view, cursor + 42);
    const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;
    if (!name || name.startsWith("/") || name.split("/").includes("..") || name.includes("\\\\")) throw new Error("Unsafe ZIP path rejected.");
    if (name.endsWith("/")) continue;
    total += size;
    if (size > 100 * 1024 * 1024 || total > 300 * 1024 * 1024) throw new Error("ZIP extraction limit: 100 MB per file, 300 MB total.");
    if (read32(view, localOffset) !== 0x04034b50) throw new Error("ZIP local header corrupt.");
    const localName = read16(view, localOffset + 26), localExtra = read16(view, localOffset + 28);
    const start = localOffset + 30 + localName + localExtra;
    const compressed = bytes.slice(start, start + compressedSize);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = await transform(compressed, "deflate-raw", true);
    else throw new Error("Unsupported ZIP compression method: " + method);
    if (data.length !== size || crc32(data) !== crc) throw new Error("ZIP integrity check failed for " + name);
    output.push({ name, data });
  }
  return output;
}
function parseCsv(text) {
  const rows = []; let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === "") quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quote.");
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function csvCell(value) {
  const s = String(value ?? "");
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function colName(index) {
  let name = ""; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + (n - 1) % 26) + name;
  return name;
}
function xmlEscape(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
async function csvToXlsx(file) {
  if (file.size > 20 * 1024 * 1024) throw new Error("CSV files must be 20 MB or smaller.");
  const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  if (rows.length > 50000 || rows.some(r => r.length > 500)) throw new Error("Limit: 50,000 rows and 500 columns.");
  const sheetRows = rows.map((row, r) => '<row r="' + (r + 1) + '">' + row.map((cell, c) => '<c r="' + colName(c) + (r + 1) + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(cell) + '</t></is></c>').join("") + '</row>').join("");
  const files = [
    { name: "[Content_Types].xml", text: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: "_rels/.rels", text: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: "xl/workbook.xml", text: '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: "xl/_rels/workbook.xml.rels", text: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: "xl/worksheets/sheet1.xml", text: '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + sheetRows + '</sheetData></worksheet>' }
  ];
  return zipFiles(files.map(f => new File([f.text], f.name, { type: "application/xml" })));
}
async function xlsxToCsv(file) {
  if (file.size > 50 * 1024 * 1024) throw new Error("XLSX files must be 50 MB or smaller.");
  const entries = await unzipEntries(file);
  const sheet = entries.find(e => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name));
  if (!sheet) throw new Error("No worksheet was found in this workbook.");
  const sharedEntry = entries.find(e => e.name === "xl/sharedStrings.xml");
  const shared = sharedEntry ? [...new DOMParser().parseFromString(decoder.decode(sharedEntry.data), "application/xml").querySelectorAll("si")].map(si => [...si.querySelectorAll("t")].map(t => t.textContent).join("")) : [];
  const doc = new DOMParser().parseFromString(decoder.decode(sheet.data), "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Worksheet XML corrupt.");
  const rows = [...doc.querySelectorAll("sheetData > row")].map(row => {
    const values = [];
    for (const cell of row.querySelectorAll(":scope > c")) {
      const ref = cell.getAttribute("r") || "A1";
      const letters = ref.match(/[A-Z]+/i)?.[0] || "A";
      let col = 0; for (const char of letters.toUpperCase()) col = col * 26 + char.charCodeAt(0) - 64;
      const idx = col - 1;
      const type = cell.getAttribute("t");
      let value = cell.querySelector("is")?.textContent ?? cell.querySelector("v")?.textContent ?? "";
      if (type === "s") value = shared[Number(value)] ?? "";
      values[idx] = value;
    }
    return values.map(csvCell).join(",");
  });
  return new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
}

function rasterizeToJpgBytes(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Image conversion failed."));
        blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject);
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The image could not be decoded. Try another file."));
    };
    img.src = url;
  });
}

async function imagesToPdf(files) {
  if (!files || !files.length) throw new Error("Select at least one image.");
  const doc = await PDFDocument.create();
  for (const file of files) {
    let bytes = new Uint8Array(await file.arrayBuffer());
    let img;
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      img = await doc.embedJpg(bytes);
    } else if (file.type === "image/png") {
      try {
        img = await doc.embedPng(bytes);
      } catch {
        bytes = await rasterizeToJpgBytes(file);
        img = await doc.embedJpg(bytes);
      }
    } else {
      bytes = await rasterizeToJpgBytes(file);
      img = await doc.embedJpg(bytes);
    }
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const resultBytes = await doc.save();
  return new Blob([resultBytes], { type: "application/pdf" });
}


let pdfJsLoader;
async function loadPdfJs() {
  if (typeof window !== "undefined" && window.pdfjsLib) return window.pdfjsLib;
  if (!pdfJsLoader) {
    pdfJsLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        if (!window.pdfjsLib) return reject(new Error("PDF renderer did not initialize."));
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error("Could not load the PDF rendering library. Check your connection and retry."));
      document.head.appendChild(script);
    });
  }
  return pdfJsLoader;
}

async function compressPdfRaster(file, quality = 0.62) {
  if (!file) throw new Error("Select a PDF file.");
  if (file.size > 50 * 1024 * 1024) throw new Error("The PDF compressor accepts files up to 50 MB.");
  if (!Number.isFinite(quality) || quality < 0.35 || quality > 0.9) throw new Error("Compression quality must be between 35% and 90%.");
  const sourceBytes = new Uint8Array(await file.arrayBuffer());
  const sourcePdf = await PDFDocument.load(sourceBytes);
  const renderer = await loadPdfJs();
  const renderedPdf = await renderer.getDocument({ data: new Uint8Array(sourceBytes) }).promise;
  if (renderedPdf.numPages < 1 || renderedPdf.numPages > 100) throw new Error("PDF compression supports 1–100 pages.");
  const output = await PDFDocument.create();
  for (let index = 0; index < renderedPdf.numPages; index += 1) {
    const sourcePage = sourcePdf.getPage(index);
    const pdfPage = await renderedPdf.getPage(index + 1);
    const viewport = pdfPage.getViewport({ scale: 1 });
    const pixels = Math.ceil(viewport.width) * Math.ceil(viewport.height);
    if (pixels > 16000000) throw new Error("A PDF page exceeds the 16-megapixel processing limit.");
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Your browser could not start PDF image processing.");
    await pdfPage.render({ canvasContext: context, viewport }).promise;
    const jpeg = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!jpeg || jpeg.type !== "image/jpeg") throw new Error("Your browser could not export a compressed page image.");
    const image = await output.embedJpg(await jpeg.arrayBuffer());
    const page = output.addPage([sourcePage.getWidth(), sourcePage.getHeight()]);
    page.drawImage(image, { x: 0, y: 0, width: sourcePage.getWidth(), height: sourcePage.getHeight() });
    canvas.width = 1;
    canvas.height = 1;
    pdfPage.cleanup();
  }
  const bytes = await output.save({ useObjectStreams: true });
  return new Blob([bytes], { type: "application/pdf" });
}

async function mergePdfFiles(files) {
  if (!files || files.length < 2) throw new Error("Select at least 2 PDF files.");
  const buffers = await Promise.all(files.map((file) => file.arrayBuffer()));
  const resultBytes = await mergePdfBuffers(buffers);
  return new Blob([resultBytes], { type: "application/pdf" });
}
async function splitPdfToZip(file) {
  if (!file) throw new Error("Select a PDF file.");
  const pages = await splitPdfBuffer(await file.arrayBuffer());
  return zipFiles(pages.map((page) => new File([page.bytes], page.name, { type: "application/pdf" })));
}

async function convertAudioToWav(file) {
  if (!file) throw new Error("Select an audio file.");
  const AudioContextClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AudioContextClass) throw new Error("This browser does not support the Web Audio API.");
  const ctx = new AudioContextClass();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let pos = 0;
  const setUint16 = (d) => { out.setUint16(pos, d, true); pos += 2; };
  const setUint32 = (d) => { out.setUint32(pos, d, true); pos += 4; };
  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(audioBuffer.sampleRate);
  setUint32(audioBuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);
  setUint32(length - pos - 4);
  const channels = [];
  for (let i = 0; i < numOfChan; i++) channels.push(audioBuffer.getChannelData(i));
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      let sample = Math.max(-1, Math.min(1, channels[ch][i]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
  }
  return new Blob([out.buffer], { type: "audio/wav" });
}

async function docxToPdf(file) {
  const entries = await unzipEntries(file);
  const docEntry = entries.find(e => e.name === "word/document.xml" || e.name.endsWith("/document.xml"));
  if (!docEntry) throw new Error("word/document.xml was not found. Check that this is a valid .docx file.");
  const xml = decoder.decode(docEntry.data);
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const paragraphs = [...doc.querySelectorAll("p")].map(p => {
    return [...p.querySelectorAll("t")].map(t => t.textContent).join("");
  }).filter(t => t.trim().length > 0);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  let y = height - 50;
  const margin = 50, maxWidth = width - margin * 2, fontSize = 11, lineHeight = 16;

  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (textWidth > maxWidth) {
        if (y < 60) { page = pdf.addPage([595.28, 841.89]); y = height - 50; }
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
        line = word;
      } else { line = testLine; }
    }
    if (line) {
      if (y < 60) { page = pdf.addPage([595.28, 841.89]); y = height - 50; }
      page.drawText(line, { x: margin, y, size: fontSize, font });
      y -= lineHeight * 1.4;
    }
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

async function pdfToDocx(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const latin = new TextDecoder("latin1").decode(bytes);
  const matches = [...latin.matchAll(/\(([^)]+)\)\s*Tj/g)].map(m => m[1]);
  const textLines = matches.length
    ? matches
    : latin.split(/[\r\n]+/).filter(l => l.length > 20 && !l.startsWith("%") && !l.includes("obj")).slice(0, 200);

  const pXml = (textLines.length ? textLines : ["Converted text from PDF"]).map(line =>
    `<w:p><w:r><w:t>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t></w:r></w:p>`
  ).join("");

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${pXml}<w:sectPr/></w:body></w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

  return await zipFiles([
    new File([encoder.encode(contentTypes)], "[Content_Types].xml"),
    new File([encoder.encode(rels)], "_rels/.rels"),
    new File([encoder.encode(docXml)], "word/document.xml"),
  ]);
}

async function pptxToPdf(file) {
  const entries = await unzipEntries(file);
  const slideEntries = entries.filter(e => e.name.match(/^ppt\/slides\/slide\d+\.xml$/i));
  if (!slideEntries.length) throw new Error("No slides were found. Check that this is a valid .pptx file.");
  slideEntries.sort((a, b) => {
    const na = parseInt(a.name.match(/\d+/)?.[0] || "0", 10);
    const nb = parseInt(b.name.match(/\d+/)?.[0] || "0", 10);
    return na - nb;
  });

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const parser = new DOMParser();

  for (const slideEntry of slideEntries) {
    const xml = decoder.decode(slideEntry.data);
    const doc = parser.parseFromString(xml, "application/xml");
    const texts = [...doc.querySelectorAll("t")].map(t => t.textContent.trim()).filter(Boolean);
    const page = pdf.addPage([841.89, 595.28]);
    page.drawText("Presentation Slide", { x: 50, y: 545, size: 14, font });
    let y = 500;
    for (const t of texts) {
      if (y < 60) break;
      page.drawText(t.slice(0, 100), { x: 60, y, size: 12, font });
      y -= 22;
    }
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

async function htmlToPdf(htmlString) {
  if (!htmlString || !htmlString.trim()) throw new Error("Paste some HTML or text first.");
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const textContent = doc.body?.innerText || doc.body?.textContent || htmlString;
  const lines = textContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage([595.28, 841.89]);
  const { height } = page.getSize();
  let y = height - 50;
  for (const line of lines) {
    if (y < 60) { page = pdf.addPage([595.28, 841.89]); y = height - 50; }
    page.drawText(line.slice(0, 90), { x: 50, y, size: 11, font });
    y -= 18;
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

async function compressAudio(file, targetSampleRate = 22050) {
  const AudioContextClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AudioContextClass) throw new Error("The Web Audio API is not available in this browser.");
  const ctx = new AudioContextClass();
  const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetSampleRate), targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start(0);
  const rendered = await offlineCtx.startRendering();

  const length = rendered.length * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let pos = 0;
  const setUint16 = (d) => { out.setUint16(pos, d, true); pos += 2; };
  const setUint32 = (d) => { out.setUint32(pos, d, true); pos += 4; };
  setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); setUint32(0x20746d66);
  setUint32(16); setUint16(1); setUint16(1);
  setUint32(targetSampleRate); setUint32(targetSampleRate * 2); setUint16(2); setUint16(16);
  setUint32(0x61746164); setUint32(length - pos - 4);
  const data = rendered.getChannelData(0);
  for (let i = 0; i < rendered.length; i++) {
    let sample = Math.max(-1, Math.min(1, data[i]));
    sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
    out.setInt16(pos, sample, true);
    pos += 2;
  }
  return new Blob([out.buffer], { type: "audio/wav" });
}

async function compressVideo(file, qualityScale = 0.5) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      const targetW = Math.round((video.videoWidth * qualityScale) / 2) * 2 || 320;
      const targetH = Math.round((video.videoHeight * qualityScale) / 2) * 2 || 240;
      const canvas = document.createElement("canvas");
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(24);
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond: 600000 });
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => { URL.revokeObjectURL(url); resolve(new Blob(chunks, { type: "video/webm" })); };
      mediaRecorder.start();
      video.play();
      function draw() {
        if (video.paused || video.ended) { if (mediaRecorder.state !== "inactive") mediaRecorder.stop(); return; }
        ctx.drawImage(video, 0, 0, targetW, targetH);
        requestAnimationFrame(draw);
      }
      draw();
      video.onended = () => { if (mediaRecorder.state !== "inactive") mediaRecorder.stop(); };
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The video could not be loaded.")); };
  });
}

async function ttfToWoff(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return new Blob([await ttfToWoffBytes(bytes)], { type: "font/woff" });
}

async function pdfToJpgZip(file) {
  if (!file) throw new Error("Select a PDF file.");
  if (file.size > 50 * 1024 * 1024) throw new Error("PDF files must be 50 MB or smaller.");
  const sourceBytes = new Uint8Array(await file.arrayBuffer());
  const renderer = await loadPdfJs();
  const pdf = await renderer.getDocument({ data: new Uint8Array(sourceBytes) }).promise;
  if (pdf.numPages < 1 || pdf.numPages > 100) throw new Error("PDF to JPG supports 1–100 pages.");
  const zipEntries = [];
  for (let index = 0; index < pdf.numPages; index += 1) {
    const page = await pdf.getPage(index + 1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Your browser could not start image processing.");
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob || blob.type !== "image/jpeg") throw new Error("Your browser could not export a page image.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    zipEntries.push(new File([bytes], (file.name.replace(/\.pdf$/i, "") || "page") + "-" + (index + 1) + ".jpg", { type: "image/jpeg" }));
    canvas.width = 1; canvas.height = 1;
    page.cleanup();
  }
  return zipFiles(zipEntries);
}

async function pdfToText(file) {
  if (!file) throw new Error("Select a PDF file.");
  if (file.size > 50 * 1024 * 1024) throw new Error("PDF files must be 50 MB or smaller.");
  const sourceBytes = new Uint8Array(await file.arrayBuffer());
  const renderer = await loadPdfJs();
  const pdf = await renderer.getDocument({ data: new Uint8Array(sourceBytes) }).promise;
  if (pdf.numPages < 1 || pdf.numPages > 100) throw new Error("PDF to text supports 1–100 pages.");
  const lines = [];
  for (let index = 0; index < pdf.numPages; index += 1) {
    const page = await pdf.getPage(index + 1);
    const content = await page.getTextContent();
    const text = content.items.map((item) => (item.str || "")).join(" ").replace(/\s+/g, " ").trim();
    if (text) lines.push("— Page " + (index + 1) + " —\n" + text);
    page.cleanup();
  }
  const output = lines.length ? lines.join("\n\n") : "No selectable text was found in this PDF. Scanned pages need OCR.";
  return new Blob([output], { type: "text/plain;charset=utf-8" });
}

async function pdfToPptx(file) {
  if (!file) throw new Error("Select a PDF file.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const latin = new TextDecoder("latin1").decode(bytes);
  const matches = [...latin.matchAll(/\(([^)]+)\)\s*Tj/g)].map((m) => m[1]);
  const textLines = matches.length ? matches : latin.split(/[\r\n]+/).filter((l) => l.length > 20 && !l.startsWith("%") && !l.includes("obj")).slice(0, 200);
  const slides = textLines.length ? textLines : ["Converted text from PDF"];
  const slideXml = (text) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
    '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>' +
    '<a:p><a:r><a:t>' + xmlEscape(text.slice(0, 200)) + '</a:t></a:r></a:p></p:txBody></p:sp>' +
    '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
  const slideEntries = slides.map((text, index) => ({ name: "ppt/slides/slide" + (index + 1) + ".xml", text }));
  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>' +
    slides.map((_, i) => '<Override PartName="/ppt/slides/slide' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>').join("") +
    '</Types>';
  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>';
  const presRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    slides.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + (i + 1) + '.xml"/>').join("") + '</Relationships>';
  const presentation = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst/><p:sldIdLst>' +
    slides.map((_, i) => '<p:sldId id="' + (256 + i) + '" r:id="rId' + (i + 1) + '"/>').join("") + '</p:sldIdLst><p:sldSz cx="9144000" cy="6858000" type="screen4x3"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>';
  const files = [
    new File([encoder.encode(contentTypes)], "[Content_Types].xml"),
    new File([encoder.encode(rels)], "_rels/.rels"),
    new File([encoder.encode(presentation)], "ppt/presentation.xml"),
    new File([encoder.encode(presRels)], "ppt/_rels/presentation.xml.rels"),
  ];
  for (const entry of slideEntries) files.push(new File([encoder.encode(slideXml(entry.text))], entry.name));
  return zipFiles(files);
}

async function epubToPdf(file) {
  if (!file) throw new Error("Select an EPUB file.");
  const entries = await unzipEntries(file);
  const htmlEntries = entries.filter((e) => /\.(xhtml|html|htm)$/i.test(e.name));
  if (!htmlEntries.length) throw new Error("No readable content was found in this EPUB.");
  const parser = new DOMParser();
  const texts = [];
  for (const entry of htmlEntries) {
    const doc = parser.parseFromString(decoder.decode(entry.data), "application/xhtml+xml");
    const bodyText = (doc.body?.innerText || doc.body?.textContent || "").trim();
    if (bodyText) texts.push(bodyText);
  }
  const allText = texts.join("\n\n");
  if (!allText.trim()) throw new Error("This EPUB contains no readable text.");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pageWidth = 595.28, pageHeight = 841.89, margin = 50, maxWidth = pageWidth - margin * 2, fontSize = 11, lineHeight = 16;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 50;
  for (const para of allText.split(/\n{2,}/)) {
    const words = para.replace(/\s+/g, " ").trim().split(" ");
    let line = "";
    for (const word of words) {
      const testLine = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth) {
        if (y < 60) { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - 50; }
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
        line = word;
      } else { line = testLine; }
    }
    if (line) {
      if (y < 60) { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - 50; }
      page.drawText(line, { x: margin, y, size: fontSize, font });
      y -= lineHeight * 1.4;
    }
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

function dxfNumber(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
async function dxfToSvg(file) {
  if (!file) throw new Error("Select a DXF file.");
  if (file.size > 20 * 1024 * 1024) throw new Error("DXF files must be 20 MB or smaller.");
  const text = await file.text();
  const lines = text.split(/\r?\n/);
  // DXF is a flat sequence of group code / value pairs.
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = lines[i].trim();
    const value = lines[i + 1];
    if (code === "") continue;
    pairs.push([Number(code), value]);
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const elements = [];
  let i = 0;
  while (i < pairs.length) {
    if (pairs[i][0] !== 0) { i += 1; continue; }
    const type = pairs[i][1].trim().toUpperCase();
    // Find the next section/entity boundary.
    let j = i + 1;
    const props = {};
    while (j < pairs.length && pairs[j][0] !== 0) {
      const code = pairs[j][0];
      const value = pairs[j][1];
      if (code === 10) props.x = dxfNumber(value);
      else if (code === 20) props.y = dxfNumber(value);
      else if (code === 11) props.x2 = dxfNumber(value);
      else if (code === 21) props.y2 = dxfNumber(value);
      else if (code === 40) props.r = dxfNumber(value);
      else if (code === 50) props.a1 = dxfNumber(value);
      else if (code === 51) props.a2 = dxfNumber(value);
      else if (code === 90) props.count = dxfNumber(value);
      else if (code === 70) props.closed = dxfNumber(value);
      j += 1;
    }
    if (type === "LINE" && props.x !== undefined) {
      elements.push('<line x1="' + props.x + '" y1="' + (-props.y) + '" x2="' + props.x2 + '" y2="' + (-props.y2) + '" stroke="black" stroke-width="1"/>');
      for (const v of [props.x, props.y, props.x2, props.y2]) {}
      minX = Math.min(minX, props.x, props.x2); maxX = Math.max(maxX, props.x, props.x2);
      minY = Math.min(minY, props.y, props.y2); maxY = Math.max(maxY, props.y, props.y2);
    } else if (type === "CIRCLE" && props.x !== undefined) {
      elements.push('<circle cx="' + props.x + '" cy="' + (-props.y) + '" r="' + props.r + '" fill="none" stroke="black" stroke-width="1"/>');
      minX = Math.min(minX, props.x - props.r); maxX = Math.max(maxX, props.x + props.r);
      minY = Math.min(minY, props.y - props.r); maxY = Math.max(maxY, props.y + props.r);
    } else if (type === "LWPOLYLINE" || type === "POLYLINE") {
      // Collect subsequent vertices until the next entity.
      const verts = [];
      let k = i + 1;
      let cx, cy;
      while (k < pairs.length && pairs[k][0] !== 0) {
        if (pairs[k][0] === 10) cx = dxfNumber(pairs[k][1]);
        else if (pairs[k][0] === 20) { cy = dxfNumber(pairs[k][1]); if (cx !== undefined) { verts.push([cx, cy]); cx = undefined; } }
        k += 1;
      }
      if (verts.length) {
        const d = verts.map((v, idx) => (idx === 0 ? "M" : "L") + v[0] + " " + (-v[1])).join(" ") + (props.closed ? " Z" : "");
        elements.push('<path d="' + d + '" fill="none" stroke="black" stroke-width="1"/>');
        for (const v of verts) { minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]); minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]); }
      }
    }
    i = j;
  }
  if (!elements.length) throw new Error("No supported geometry (LINE, CIRCLE, LWPOLYLINE) was found in this DXF file.");
  const pad = 10;
  const w = (maxX - minX) || 100, h = (maxY - minY) || 100;
  const svg = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (minX - pad) + " " + (-(maxY + pad)) + " " + (w + pad * 2) + " " + (h + pad * 2) + '" width="' + (w + pad * 2) + '" height="' + (h + pad * 2) + '">' + elements.join("") + '</svg>';
  return new Blob([svg], { type: "image/svg+xml" });
}

async function mp4Converter(file) {
  if (!file) throw new Error("Select a video file.");
  const supported = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E,mp4a.40.2");
  if (!supported) throw new Error("This browser cannot encode MP4. Use Chrome 126+ or the WebM converter instead.");
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto"; video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(24);
      // Add an audio track only if the source has one; otherwise output silent MP4.
      let mediaRecorder;
      try { mediaRecorder = new MediaRecorder(stream, { mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", videoBitsPerSecond: 1000000 }); }
      catch { mediaRecorder = new MediaRecorder(stream, { mimeType: "video/mp4", videoBitsPerSecond: 1000000 }); }
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => { URL.revokeObjectURL(url); resolve(new Blob(chunks, { type: "video/mp4" })); };
      mediaRecorder.onerror = (e) => { URL.revokeObjectURL(url); reject(new Error("MP4 encoding failed: " + (e?.error?.message || "unknown error"))); };
      mediaRecorder.start();
      video.play();
      function draw() {
        if (video.paused || video.ended) { if (mediaRecorder.state !== "inactive") mediaRecorder.stop(); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(draw);
      }
      draw();
      video.onended = () => { if (mediaRecorder.state !== "inactive") mediaRecorder.stop(); };
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The video could not be loaded.")); };
  });
}

async function videoToGif(file) {
  if (!file) throw new Error("Select a video file.");
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto"; video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = async () => {
      try {
        const frames = [];
        const targetW = Math.min(320, video.videoWidth || 320);
        const scale = targetW / (video.videoWidth || 320);
        const targetH = Math.round((video.videoHeight || 240) * scale);
        const canvas = document.createElement("canvas");
        canvas.width = targetW; canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        const duration = Math.min(video.duration || 4, 4);
        const fps = 8;
        const frameCount = Math.max(1, Math.round(duration * fps));
        for (let f = 0; f < frameCount; f++) {
          video.currentTime = (f / frameCount) * duration;
          await new Promise((r) => { video.onseeked = r; });
          ctx.drawImage(video, 0, 0, targetW, targetH);
          const imgData = ctx.getImageData(0, 0, targetW, targetH);
          frames.push({ data: imgData.data, delay: Math.round(100 / fps) });
        }
        URL.revokeObjectURL(url);
        const gif = encodeGif(targetW, targetH, frames);
        resolve(new Blob([gif], { type: "image/gif" }));
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("The video could not be loaded.")); };
  });
}

// Minimal GIF89a encoder with a 256-colour (median-cut-ish) palette per frame is
// out of scope; use a fixed web-safe palette and nearest-colour quantisation.
function encodeGif(width, height, frames) {
  const palette = [];
  for (let r = 0; r < 6; r++) for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) {
    palette.push([r * 51, g * 51, b * 51]);
  }
  // Pad to 256.
  while (palette.length < 256) palette.push([0, 0, 0]);
  const out = [];
  const push = (b) => out.push(b & 0xff);
  const pushStr = (s) => { for (let i = 0; i < s.length; i++) push(s.charCodeAt(i)); };
  // Header
  pushStr("GIF89a");
  push(width & 0xff); push((width >> 8) & 0xff);
  push(height & 0xff); push((height >> 8) & 0xff);
  push(0xf7); push(0); push(0); // packed, bg index, aspect ratio
  for (const c of palette) { push(c[0]); push(c[1]); push(c[2]); }
  // Netscape loop extension
  push(0x21); push(0xff); push(0x0b); pushStr("NETSCAPE2.0"); push(0x03); push(0x01); push(0x00); push(0x00); push(0x00);
  for (const frame of frames) {
    push(0x21); push(0xf9); push(0x04); push(0x04); // disposal, transparent flag off
    push(frame.delay & 0xff); push((frame.delay >> 8) & 0xff);
    push(0x00); push(0x00);
    push(0x2c);
    push(0x00); push(0x00); push(0x00); push(0x00);
    push(width & 0xff); push((width >> 8) & 0xff);
    push(height & 0xff); push((height >> 8) & 0xff);
    push(0x00); // no local colour table
    // LZW
    const indices = new Uint8Array(width * height);
    for (let p = 0; p < width * height; p++) {
      const off = p * 4;
      const r = frame.data[off], g = frame.data[off + 1], b = frame.data[off + 2];
      let best = 0, bestDist = Infinity;
      for (let ci = 0; ci < palette.length; ci++) {
        const c = palette[ci];
        const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
        if (d < bestDist) { bestDist = d; best = ci; }
      }
      indices[p] = best;
    }
    // LZW encode with 8-bit min code size.
    const minCodeSize = 8;
    push(minCodeSize);
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = endCode + 1;
    const dict = new Map();
    function resetDict() {
      dict.clear();
      for (let c = 0; c < clearCode; c++) dict.set(String.fromCharCode(c), c);
      nextCode = endCode + 1;
      codeSize = minCodeSize + 1;
    }
    resetDict();
    const subBlocks = [];
    let current = "";
    let bitBuffer = 0, bitCount = 0;
    function emit(code) {
      bitBuffer |= code << bitCount;
      bitCount += codeSize;
      while (bitCount >= 8) {
        subBlocks.push(bitBuffer & 0xff);
        bitBuffer >>= 8;
        bitCount -= 8;
      }
    }
    emit(clearCode);
    for (let p = 0; p < indices.length; p++) {
      const k = String.fromCharCode(indices[p]);
      const combined = current + k;
      if (dict.has(combined)) { current = combined; }
      else {
        emit(dict.get(current));
        if (nextCode < 4096) {
          dict.set(combined, nextCode++);
          if (nextCode === (1 << codeSize) && codeSize < 12) codeSize += 1;
        } else {
          emit(clearCode);
          resetDict();
        }
        current = k;
      }
    }
    if (current) emit(dict.get(current));
    emit(endCode);
    if (bitCount > 0) subBlocks.push(bitBuffer & 0xff);
    // Write sub-blocks.
    let pos = 0;
    while (pos < subBlocks.length) {
      const chunk = Math.min(255, subBlocks.length - pos);
      push(chunk);
      for (let c = 0; c < chunk; c++) push(subBlocks[pos + c]);
      pos += chunk;
    }
    push(0); // block terminator
  }
  push(0x3b); // trailer
  return new Uint8Array(out);
}

function Download({ result }) {
  return result && <p role="status" style={{ marginTop: 12 }}><a href={result.url} download={result.name} style={{ color: "#7dd3fc", fontWeight: 700 }}>Download {result.name} · {(result.size / 1024).toFixed(1)} KB</a></p>;
}
function useResult() {
  const [result, setResult] = useState(null);
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result?.url]);
  function save(blob, name) { setResult({ url: URL.createObjectURL(blob), name, size: blob.size }); }
  return [result, save, () => setResult(null)];
}
const box = { border: "1px solid var(--border, #303746)", borderRadius: 16, padding: "clamp(14px, 4vw, 20px)", marginTop: 18, width: "100%", boxSizing: "border-box", overflowX: "hidden" };
const field = { display: "block", margin: "12px 0", color: "var(--muted-foreground, #9ca3af)", width: "100%", boxSizing: "border-box" };
const button = { border: 0, borderRadius: 9, padding: "12px 20px", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer", minHeight: 44, touchAction: "manipulation", fontSize: "clamp(14px, 3.5vw, 16px)" };

export default function ConverterEngines() {
  const [csv, setCsv] = useState(null), [xlsx, setXlsx] = useState(null), [zipInput, setZipInput] = useState(null), [zipFilesInput, setZipFilesInput] = useState([]);
  const [error, setError] = useState(""), [busy, setBusy] = useState("");
  const [extracted, setExtracted] = useState([]);
  const [pdfImages, setPdfImages] = useState([]), [mergePdfs, setMergePdfs] = useState([]), [audioInput, setAudioInput] = useState(null);
  const [pdfSplitInput, setPdfSplitInput] = useState(null), [pdfCompressInput, setPdfCompressInput] = useState(null);
  const [pdfCompressQuality, setPdfCompressQuality] = useState("0.62");
  const [csvResult, saveCsv, clearCsv] = useResult(), [xlsxResult, saveXlsx, clearXlsx] = useResult(), [zipResult, saveZip, clearZip] = useResult();
  const [docxInput, setDocxInput] = useState(null), [pdfDocxInput, setPdfDocxInput] = useState(null), [pptxInput, setPptxInput] = useState(null);
  const [htmlInput, setHtmlInput] = useState(""), [audioCompressInput, setAudioCompressInput] = useState(null);
  const [videoCompressInput, setVideoCompressInput] = useState(null), [ttfInput, setTtfInput] = useState(null);
  const [pdfJpgInput, setPdfJpgInput] = useState(null), [pdfTextInput, setPdfTextInput] = useState(null);
  const [pptxPdfInput, setPptxPdfInput] = useState(null), [epubInput, setEpubInput] = useState(null);
  const [dxfInput, setDxfInput] = useState(null), [mp4Input, setMp4Input] = useState(null), [gifInput, setGifInput] = useState(null);
  const [imgPdfResult, saveImgPdf, clearImgPdf] = useResult(), [mergePdfResult, saveMergePdf, clearMergePdf] = useResult(), [audioResult, saveAudio, clearAudio] = useResult();
  const [splitPdfResult, saveSplitPdf, clearSplitPdf] = useResult(), [pdfCompressResult, savePdfCompress, clearPdfCompress] = useResult();
  const [docxResult, saveDocx, clearDocx] = useResult(), [pdfDocxResult, savePdfDocx, clearPdfDocx] = useResult(), [pptxResult, savePptx, clearPptx] = useResult();
  const [htmlResult, saveHtml, clearHtml] = useResult(), [audioCompressResult, saveAudioCompress, clearAudioCompress] = useResult();
  const [videoCompressResult, saveVideoCompress, clearVideoCompress] = useResult(), [ttfResult, saveTtf, clearTtf] = useResult();
  const [pdfJpgResult, savePdfJpg, clearPdfJpg] = useResult(), [pdfTextResult, savePdfText, clearPdfText] = useResult();
  const [pptxPdfResult, savePptxPdf, clearPptxPdf] = useResult(), [epubResult, saveEpub, clearEpub] = useResult();
  const [dxfResult, saveDxf, clearDxf] = useResult(), [mp4Result, saveMp4, clearMp4] = useResult(), [gifResult, saveGif, clearGif] = useResult();
  useEffect(() => () => extracted.forEach(item => URL.revokeObjectURL(item.url)), [extracted]);
  async function run(label, fn) {
    setError(""); setBusy(label);
    try { await fn(); } catch (e) { setError(e?.message || "Conversion failed."); } finally { setBusy(""); }
  }
  return <div className="converter-wrap">
    <div className="qt-engine-intro">
      <span className="qt-engine-badge">TESTING · RUNS IN YOUR BROWSER</span>
      <h2>More converter engines</h2>
      <p>These tools process files locally and never upload them. They are labelled Testing because real-file and cross-browser checks are still in progress, so open the output and confirm it is correct before you rely on it.</p>
    </div>
    <section style={box} id="images-to-pdf">
      <h2>Images to PDF</h2>
      <p>Combine one or more JPG, PNG or WebP images into a single PDF. Each image becomes one page at its own pixel size.</p>
      <label style={field}>Select images (JPG / PNG / WebP) <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => { setPdfImages([...(e.target.files || [])]); clearImgPdf(); }} /></label>
      <button style={button} disabled={!pdfImages.length || !!busy} onClick={() => run("img-to-pdf", async () => saveImgPdf(await imagesToPdf(pdfImages), "quicktoolbox-images.pdf"))}>{busy === "img-to-pdf" ? "Creating PDF…" : "Convert Images to PDF"}</button>
      <Download result={imgPdfResult} />
    </section>
    <section style={box} id="pdf-compressor">
      <h2>PDF Compressor</h2>
      <p>Rasterises every page to a JPEG image to try to shrink the file. Processing happens in your browser.</p>
      <label style={field}>PDF file (up to 50 MB, maximum 100 pages)
        <input type="file" accept="application/pdf,.pdf" onChange={e => { setPdfCompressInput(e.target.files?.[0] || null); clearPdfCompress(); }} />
      </label>
      <label style={field}>Image quality
        <select value={pdfCompressQuality} onChange={e => setPdfCompressQuality(e.target.value)}>
          <option value="0.78">Higher quality</option>
          <option value="0.62">Balanced</option>
          <option value="0.45">Smaller file</option>
        </select>
      </label>
      <button style={button} disabled={!pdfCompressInput || !!busy} onClick={() => run("compress-pdf", async () => savePdfCompress(await compressPdfRaster(pdfCompressInput, Number(pdfCompressQuality)), (pdfCompressInput.name.replace(/\.pdf$/i, "") || "document") + "-compressed.pdf"))}>{busy === "compress-pdf" ? "Compressing…" : "Compress PDF"}</button>
      <Download result={pdfCompressResult} />
      <p style={{ color: "var(--muted-foreground, #9ca3af)", fontSize: 13, lineHeight: 1.6 }}>Important: this is lossy compression. Pages are flattened into images, so selectable text, links, forms and accessibility structure are not preserved. File size may increase for some PDFs; compare the output before using it.</p>
    </section>
    <section style={box} id="merge-pdf">
      <h2>Merge PDF</h2>
      <p>Select two or more PDF files and join them into one document, in the order you select them.</p>
      <label style={field}>Select PDF files (at least 2) <input type="file" accept="application/pdf,.pdf" multiple onChange={e => { setMergePdfs([...(e.target.files || [])]); clearMergePdf(); }} /></label>
      <button style={button} disabled={mergePdfs.length < 2 || !!busy} onClick={() => run("merge-pdf", async () => saveMergePdf(await mergePdfFiles(mergePdfs), "quicktoolbox-merged.pdf"))}>{busy === "merge-pdf" ? "Merging…" : "Merge PDFs"}</button>
      <Download result={mergePdfResult} />
    </section>
    <section style={box} id="split-pdf">
      <h2>Split PDF</h2>
      <p>Split a PDF into one file per page and download them together as a ZIP. Up to 100 MB and 200 pages.</p>
      <label style={field}>Select PDF file <input type="file" accept="application/pdf,.pdf" onChange={e => { setPdfSplitInput(e.target.files?.[0] || null); clearSplitPdf(); }} /></label>
      <button style={button} disabled={!pdfSplitInput || !!busy} onClick={() => run("split-pdf", async () => saveSplitPdf(await splitPdfToZip(pdfSplitInput), (pdfSplitInput.name.replace(/\.pdf$/i, "") || "document") + "-pages.zip"))}>{busy === "split-pdf" ? "Splitting…" : "Split PDF into pages"}</button>
      <Download result={splitPdfResult} />
    </section>
    <section style={box} id="audio-to-wav">
      <h2>Audio to WAV</h2>
      <p>Decode an audio file and export uncompressed WAV. The output is usually larger than a compressed source such as MP3.</p>
      <label style={field}>Audio file <input type="file" accept="audio/*" onChange={e => { setAudioInput(e.target.files?.[0] || null); clearAudio(); }} /></label>
      <button style={button} disabled={!audioInput || !!busy} onClick={() => run("audio", async () => saveAudio(await convertAudioToWav(audioInput), (audioInput.name.replace(/\.[^.]+$/, "") || "audio") + ".wav"))}>{busy === "audio" ? "Converting…" : "Convert to WAV"}</button>
      <Download result={audioResult} />
    </section>
    <section style={box} id="word-to-pdf">
      <h2>Word to PDF</h2>
      <p>Read the text of a .docx file and lay it out as a plain PDF. Fonts, images, tables and page layout are not preserved.</p>
      <label style={field}>Word document (.docx) <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => { setDocxInput(e.target.files?.[0] || null); clearDocx(); }} /></label>
      <button style={button} disabled={!docxInput || !!busy} onClick={() => run("docx", async () => saveDocx(await docxToPdf(docxInput), (docxInput.name.replace(/\.docx$/i, "") || "document") + ".pdf"))}>{busy === "docx" ? "Converting…" : "Convert to PDF"}</button>
      <Download result={docxResult} />
    </section>
    <section style={box} id="pdf-to-docx">
      <h2>PDF to Word</h2>
      <p>Extract selectable text from a PDF into an editable .docx file. Scanned PDFs need OCR, which is not included.</p>
      <label style={field}>PDF file <input type="file" accept=".pdf,application/pdf" onChange={e => { setPdfDocxInput(e.target.files?.[0] || null); clearPdfDocx(); }} /></label>
      <button style={button} disabled={!pdfDocxInput || !!busy} onClick={() => run("pdf-docx", async () => savePdfDocx(await pdfToDocx(pdfDocxInput), (pdfDocxInput.name.replace(/\.pdf$/i, "") || "converted") + ".docx"))}>{busy === "pdf-docx" ? "Converting…" : "Convert to Word (.docx)"}</button>
      <Download result={pdfDocxResult} />
    </section>
    <section style={box} id="html-to-pdf">
      <h2>HTML to PDF</h2>
      <p>Strip HTML tags and lay the remaining text out as a plain PDF. Styling, images and scripts are ignored.</p>
      <label style={field}>Paste HTML or enter text
        <textarea rows={4} value={htmlInput} onChange={e => { setHtmlInput(e.target.value); clearHtml(); }} placeholder="<h1>Title</h1><p>Your content here...</p>" style={{ width: "100%", padding: 10, borderRadius: 8, background: "var(--background, #111827)", color: "inherit", border: "1px solid var(--border, #4b5563)", marginTop: 8 }} />
      </label>
      <button style={button} disabled={!htmlInput.trim() || !!busy} onClick={() => run("html-pdf", async () => saveHtml(await htmlToPdf(htmlInput), "webpage.pdf"))}>{busy === "html-pdf" ? "Creating PDF…" : "Generate PDF"}</button>
      <Download result={htmlResult} />
    </section>
    <section style={box} id="pptx-to-pdf">
      <h2>PowerPoint to PDF</h2>
      <p>Extract the text from each slide and lay it out as a plain PDF. Slide design, images and animations are not preserved.</p>
      <label style={field}>PowerPoint (.pptx) file <input type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={e => { setPptxInput(e.target.files?.[0] || null); clearPptx(); }} /></label>
      <button style={button} disabled={!pptxInput || !!busy} onClick={() => run("pptx", async () => savePptx(await pptxToPdf(pptxInput), (pptxInput.name.replace(/\.pptx$/i, "") || "presentation") + ".pdf"))}>{busy === "pptx" ? "Converting…" : "Convert to PDF"}</button>
      <Download result={pptxResult} />
    </section>
    <section style={box} id="audio-compressor">
      <h2>Audio Compressor</h2>
      <p>Re-encode audio as mono WAV at a lower sample rate. This can shrink a large lossless file, but the result may be bigger than the original MP3 or M4A.</p>
      <label style={field}>Audio file (MP3 / WAV / FLAC / M4A) <input type="file" accept="audio/*" onChange={e => { setAudioCompressInput(e.target.files?.[0] || null); clearAudioCompress(); }} /></label>
      <button style={button} disabled={!audioCompressInput || !!busy} onClick={() => run("compress-audio", async () => saveAudioCompress(await compressAudio(audioCompressInput), (audioCompressInput.name.replace(/\.[^.]+$/, "") || "audio") + "-compressed.wav"))}>{busy === "compress-audio" ? "Compressing…" : "Compress Audio"}</button>
      <Download result={audioCompressResult} />
    </section>
    <section style={box} id="video-compressor">
      <h2>Video Compressor &amp; WebM Converter</h2>
      <p>Downscale the video and record the canvas as WebM. The output is video only — the audio track is dropped.</p>
      <label style={field}>Video file <input type="file" accept="video/*" onChange={e => { setVideoCompressInput(e.target.files?.[0] || null); clearVideoCompress(); }} /></label>
      <button style={button} disabled={!videoCompressInput || !!busy} onClick={() => run("compress-video", async () => saveVideoCompress(await compressVideo(videoCompressInput), (videoCompressInput.name.replace(/\.[^.]+$/, "") || "video") + "-compressed.webm"))}>{busy === "compress-video" ? "Processing…" : "Compress Video"}</button>
      <Download result={videoCompressResult} />
    </section>
    <section style={box} id="font-converter">
      <h2>Font Converter (TTF to WOFF)</h2>
      <p>Repackage a TrueType (.ttf) font as a compressed WOFF file for the web. Each font table is deflated as the WOFF specification requires.</p>
      <label style={field}>TTF Font file <input type="file" accept=".ttf,font/ttf" onChange={e => { setTtfInput(e.target.files?.[0] || null); clearTtf(); }} /></label>
      <button style={button} disabled={!ttfInput || !!busy} onClick={() => run("ttf-woff", async () => saveTtf(await ttfToWoff(ttfInput), (ttfInput.name.replace(/\.ttf$/i, "") || "font") + ".woff"))}>{busy === "ttf-woff" ? "Converting…" : "Convert to WOFF"}</button>
      <Download result={ttfResult} />
    </section>
    <section style={box} id="csv-to-excel">
      <h2>CSV to Excel</h2>
      <p>Convert a CSV file into an XLSX workbook with a single worksheet.</p>
      <label style={field}>CSV file <input type="file" accept=".csv,text/csv" onChange={e => { setCsv(e.target.files?.[0] || null); clearCsv(); }} /></label>
      <button style={button} disabled={!csv || !!busy} onClick={() => run("csv", async () => saveCsv(await csvToXlsx(csv), csv.name.replace(/\.csv$/i, "") + ".xlsx"))}>{busy === "csv" ? "Converting…" : "Convert to Excel"}</button>
      <Download result={csvResult} />
    </section>
    <section style={box} id="excel-to-csv">
      <h2>Excel to CSV</h2>
      <p>Export the first worksheet of an XLSX file to CSV.</p>
      <label style={field}>XLSX file <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => { setXlsx(e.target.files?.[0] || null); clearXlsx(); }} /></label>
      <button style={button} disabled={!xlsx || !!busy} onClick={() => run("xlsx", async () => saveXlsx(await xlsxToCsv(xlsx), xlsx.name.replace(/\.xlsx$/i, "") + ".csv"))}>{busy === "xlsx" ? "Converting…" : "Convert to CSV"}</button>
      <Download result={xlsxResult} />
    </section>
    <section style={box} id="zip-creator">
      <h2>ZIP Creator</h2>
      <p>Pack multiple local files into one ZIP archive. Files are stored without compression.</p>
      <label style={field}>Files <input type="file" multiple onChange={e => { setZipFilesInput([...e.target.files || []]); clearZip(); }} /></label>
      <button style={button} disabled={!zipFilesInput.length || !!busy} onClick={() => run("zip-create", async () => saveZip(await zipFiles(zipFilesInput), "quicktoolbox-archive.zip"))}>{busy === "zip-create" ? "Creating…" : "Create ZIP"}</button>
      <Download result={zipResult} />
    </section>
    <section style={box} id="zip-extractor">
      <h2>ZIP Extractor</h2>
      <p>Verify and unpack a ZIP archive in your browser, then download each entry.</p>
      <label style={field}>ZIP file <input type="file" accept=".zip,application/zip" onChange={e => { setZipInput(e.target.files?.[0] || null); setExtracted([]); }} /></label>
      <button style={button} disabled={!zipInput || !!busy} onClick={() => run("unzip", async () => {
        const entries = await unzipEntries(zipInput);
        if (!entries.length) throw new Error("This ZIP contains no files to extract.");
        setExtracted(entries.map(entry => ({ name: entry.name, size: entry.data.length, url: URL.createObjectURL(new Blob([entry.data])) })));
      })}>{busy === "unzip" ? "Extracting…" : "Extract files"}</button>
      {extracted.map(item => <p key={item.name}><a href={item.url} download={item.name} style={{ color: "#7dd3fc" }}>{item.name} · {(item.size / 1024).toFixed(1)} KB — Download</a></p>)}
    </section>
    <section style={box} id="pdf-to-jpg">
      <h2>PDF to JPG</h2>
      <p>Render every page of a PDF as a JPG image and download them together in a ZIP.</p>
      <label style={field}>PDF file <input type="file" accept="application/pdf,.pdf" onChange={e => { setPdfJpgInput(e.target.files?.[0] || null); clearPdfJpg(); }} /></label>
      <button style={button} disabled={!pdfJpgInput || !!busy} onClick={() => run("pdf-jpg", async () => savePdfJpg(await pdfToJpgZip(pdfJpgInput), (pdfJpgInput.name.replace(/\.pdf$/i, "") || "pages") + ".zip"))}>{busy === "pdf-jpg" ? "Rendering…" : "Convert to JPG (ZIP)"}</button>
      <Download result={pdfJpgResult} />
    </section>
    <section style={box} id="pdf-to-text">
      <h2>PDF to Text</h2>
      <p>Extract the selectable text of a PDF into a plain .txt file. Scanned pages need OCR, which is not included.</p>
      <label style={field}>PDF file <input type="file" accept="application/pdf,.pdf" onChange={e => { setPdfTextInput(e.target.files?.[0] || null); clearPdfText(); }} /></label>
      <button style={button} disabled={!pdfTextInput || !!busy} onClick={() => run("pdf-text", async () => savePdfText(await pdfToText(pdfTextInput), (pdfTextInput.name.replace(/\.pdf$/i, "") || "document") + ".txt"))}>{busy === "pdf-text" ? "Extracting…" : "Extract Text"}</button>
      <Download result={pdfTextResult} />
    </section>
    <section style={box} id="pdf-to-pptx">
      <h2>PDF to PowerPoint</h2>
      <p>Extract the text of a PDF into a simple PPTX file. Slide design, images and layout are not preserved.</p>
      <label style={field}>PDF file <input type="file" accept="application/pdf,.pdf" onChange={e => { setPptxPdfInput(e.target.files?.[0] || null); clearPptxPdf(); }} /></label>
      <button style={button} disabled={!pptxPdfInput || !!busy} onClick={() => run("pdf-pptx", async () => savePptxPdf(await pdfToPptx(pptxPdfInput), (pptxPdfInput.name.replace(/\.pdf$/i, "") || "presentation") + ".pptx"))}>{busy === "pdf-pptx" ? "Converting…" : "Convert to PPTX"}</button>
      <Download result={pptxPdfResult} />
    </section>
    <section style={box} id="epub-to-pdf">
      <h2>EPUB to PDF</h2>
      <p>Extract the text of an EPUB book and lay it out as a plain PDF.</p>
      <label style={field}>EPUB file <input type="file" accept=".epub,application/epub+zip" onChange={e => { setEpubInput(e.target.files?.[0] || null); clearEpub(); }} /></label>
      <button style={button} disabled={!epubInput || !!busy} onClick={() => run("epub", async () => saveEpub(await epubToPdf(epubInput), (epubInput.name.replace(/\.epub$/i, "") || "book") + ".pdf"))}>{busy === "epub" ? "Converting…" : "Convert to PDF"}</button>
      <Download result={epubResult} />
    </section>
    <section style={box} id="dxf-to-svg">
      <h2>DXF to SVG</h2>
      <p>Render the geometry (lines, circles, polylines) of an ASCII DXF file as an SVG drawing.</p>
      <label style={field}>DXF file <input type="file" accept=".dxf,text/plain" onChange={e => { setDxfInput(e.target.files?.[0] || null); clearDxf(); }} /></label>
      <button style={button} disabled={!dxfInput || !!busy} onClick={() => run("dxf", async () => saveDxf(await dxfToSvg(dxfInput), (dxfInput.name.replace(/\.dxf$/i, "") || "drawing") + ".svg"))}>{busy === "dxf" ? "Converting…" : "Convert to SVG"}</button>
      <Download result={dxfResult} />
    </section>
    <section style={box} id="video-to-gif">
      <h2>Video to GIF</h2>
      <p>Sample a few seconds of a video and encode them as an animated GIF. Output is small and low quality.</p>
      <label style={field}>Video file <input type="file" accept="video/*" onChange={e => { setGifInput(e.target.files?.[0] || null); clearGif(); }} /></label>
      <button style={button} disabled={!gifInput || !!busy} onClick={() => run("gif", async () => saveGif(await videoToGif(gifInput), (gifInput.name.replace(/\.[^.]+$/, "") || "clip") + ".gif"))}>{busy === "gif" ? "Encoding…" : "Convert to GIF"}</button>
      <Download result={gifResult} />
    </section>
    <section style={box} id="mp4-converter">
      <h2>MP4 Converter</h2>
      <p>Re-encode a video to MP4 when the browser supports MP4 recording (Chrome 126+). Otherwise an error is shown.</p>
      <label style={field}>Video file <input type="file" accept="video/*" onChange={e => { setMp4Input(e.target.files?.[0] || null); clearMp4(); }} /></label>
      <button style={button} disabled={!mp4Input || !!busy} onClick={() => run("mp4", async () => saveMp4(await mp4Converter(mp4Input), (mp4Input.name.replace(/\.[^.]+$/, "") || "video") + ".mp4"))}>{busy === "mp4" ? "Encoding…" : "Convert to MP4"}</button>
      <Download result={mp4Result} />
    </section>
    {error && <p role="alert" style={{ color: "#fca5a5", marginTop: 14 }}>{error}</p>}
  </div>;
}