﻿"use client";

import { useEffect, useState } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { mergePdfBuffers, splitPdfBuffer } from "../lib/pdf-tools";

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
  if (typeof Ctor !== "function") throw new Error("এই ব্রাউজারে ZIP compression API নেই। Chrome বা Edge-এর নতুন সংস্করণ ব্যবহার করুন।");
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
  if (eocd < 0) throw new Error("এটি valid ZIP archive নয় বা ZIP directory পাওয়া যায়নি।");
  const count = read16(view, eocd + 10);
  if (count > 2000) throw new Error("একটি ZIP-এ সর্বোচ্চ ২,০০০টি entry সমর্থিত।");
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
  if (quoted) throw new Error("CSV-তে closing quote নেই।");
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
  if (file.size > 20 * 1024 * 1024) throw new Error("CSV সর্বোচ্চ ২০ MB হতে পারবে।");
  const rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  if (rows.length > 50000 || rows.some(r => r.length > 500)) throw new Error("সীমা: ৫০,০০০ row এবং ৫০০ column।");
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
  if (file.size > 50 * 1024 * 1024) throw new Error("XLSX সর্বোচ্চ ৫০ MB হতে পারবে।");
  const entries = await unzipEntries(file);
  const sheet = entries.find(e => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name));
  if (!sheet) throw new Error("এই workbook-এ worksheet পাওয়া যায়নি।");
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
      reject(new Error("ছবির ফরম্যাট লোড করা যায়নি।"));
    };
    img.src = url;
  });
}

async function imagesToPdf(files) {
  if (!files || !files.length) throw new Error("কমপক্ষে একটি ছবি নির্বাচন করুন।");
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
  if (!file) throw new Error("একটি PDF ফাইল নির্বাচন করুন।");
  if (file.size > 50 * 1024 * 1024) throw new Error("PDF Compressor সর্বোচ্চ ৫০ MB input সমর্থন করে।");
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
  if (!files || files.length < 2) throw new Error("কমপক্ষে ২টি PDF ফাইল নির্বাচন করুন।");
  const buffers = await Promise.all(files.map((file) => file.arrayBuffer()));
  const resultBytes = await mergePdfBuffers(buffers);
  return new Blob([resultBytes], { type: "application/pdf" });
}
async function splitPdfToZip(file) {
  if (!file) throw new Error("একটি PDF ফাইল নির্বাচন করুন।");
  const pages = await splitPdfBuffer(await file.arrayBuffer());
  return zipFiles(pages.map((page) => new File([page.bytes], page.name, { type: "application/pdf" })));
}

async function convertAudioToWav(file) {
  if (!file) throw new Error("একটি অডিও ফাইল নির্বাচন করুন।");
  const AudioContextClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AudioContextClass) throw new Error("এই ব্রাউজারে Web Audio API সমর্থিত নয়।");
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
  if (!docEntry) throw new Error("word/document.xml পাওয়া যায়নি। সঠিক DOCX ফাইল কি না যাচাই করুন।");
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
  if (!slideEntries.length) throw new Error("ppt/slides/slide*.xml পাওয়া যায়নি। সঠিক PPTX ফাইল কি না যাচাই করুন।");
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
  if (!htmlString || !htmlString.trim()) throw new Error("কিছু HTML কোড বা টেক্সট দিন।");
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
  if (!AudioContextClass) throw new Error("AudioContext সমর্থিত নয়।");
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
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("ভিডিও লোড করা যায়নি।")); };
  });
}

async function ttfToWoff(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const compressed = await transform(bytes, "deflate");
  const woff = new Uint8Array(44 + compressed.length);
  const view = new DataView(woff.buffer);
  view.setUint32(0, 0x774f4646);
  view.setUint32(4, 0x00010000);
  view.setUint32(8, 44 + compressed.length);
  view.setUint16(12, 1);
  view.setUint16(14, 0);
  view.setUint32(16, bytes.length);
  woff.set(compressed, 44);
  return new Blob([woff], { type: "font/woff" });
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
  const [imgPdfResult, saveImgPdf, clearImgPdf] = useResult(), [mergePdfResult, saveMergePdf, clearMergePdf] = useResult(), [audioResult, saveAudio, clearAudio] = useResult();
  const [splitPdfResult, saveSplitPdf, clearSplitPdf] = useResult(), [pdfCompressResult, savePdfCompress, clearPdfCompress] = useResult();
  const [docxResult, saveDocx, clearDocx] = useResult(), [pdfDocxResult, savePdfDocx, clearPdfDocx] = useResult(), [pptxResult, savePptx, clearPptx] = useResult();
  const [htmlResult, saveHtml, clearHtml] = useResult(), [audioCompressResult, saveAudioCompress, clearAudioCompress] = useResult();
  const [videoCompressResult, saveVideoCompress, clearVideoCompress] = useResult(), [ttfResult, saveTtf, clearTtf] = useResult();
  useEffect(() => () => extracted.forEach(item => URL.revokeObjectURL(item.url)), [extracted]);
  async function run(label, fn) {
    setError(""); setBusy(label);
    try { await fn(); } catch (e) { setError(e?.message || "Conversion failed."); } finally { setBusy(""); }
  }
  return <div className="converter-wrap">
    <section style={box} id="images-to-pdf">
      <h2>Images to PDF</h2><p>এক বা একাধিক ছবি (JPG, PNG, WebP) দিয়ে ব্রাউজারেই সরাসরি একটি PDF ডকুমেন্ট তৈরি করুন।</p>
      <label style={field}>Select images (JPG / PNG / WebP) <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => { setPdfImages([...(e.target.files || [])]); clearImgPdf(); }} /></label>
      <button style={button} disabled={!pdfImages.length || !!busy} onClick={() => run("img-to-pdf", async () => saveImgPdf(await imagesToPdf(pdfImages), "quicktoolbox-images.pdf"))}>{busy === "img-to-pdf" ? "Creating PDF…" : "Convert Images to PDF"}</button>
      <Download result={imgPdfResult} />
    </section>
    <section style={box} id="pdf-compressor">
      <h2>PDF Compressor</h2>
      <p>প্রতিটি PDF page-কে JPEG image-এ রূপান্তর করে file size কমানোর চেষ্টা করে। Processing আপনার browser-এ হয়।</p>
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
      <button style={button} disabled={!pdfCompressInput || !!busy} onClick={() => run("compress-pdf", async () => savePdfCompress(await compressPdfRaster(pdfCompressInput, Number(pdfCompressQuality)), (pdfCompressInput.name.replace(/\\.pdf$/i, "") || "document") + "-compressed.pdf"))}>{busy === "compress-pdf" ? "Compressing…": "Compress PDF"}</button>
      <Download result={pdfCompressResult} />
      <p style={{ color: "var(--muted-foreground, #9ca3af)", fontSize: 13, lineHeight: 1.6 }}>Important: this is lossy compression. Pages are flattened into images, so selectable text, links, forms and accessibility structure are not preserved. File size may increase for some PDFs; compare the output before using it.</p>
    </section>
    <section style={box} id="merge-pdf">
      <h2>Merge PDF</h2><p>একাধিক PDF ফাইল নির্বাচন করে একটি একক PDF ফাইলে জোড়া লাগান।</p>
      <label style={field}>Select PDF files (at least 2) <input type="file" accept="application/pdf,.pdf" multiple onChange={e => { setMergePdfs([...(e.target.files || [])]); clearMergePdf(); }} /></label>
      <button style={button} disabled={mergePdfs.length < 2 || !!busy} onClick={() => run("merge-pdf", async () => saveMergePdf(await mergePdfFiles(mergePdfs), "quicktoolbox-merged.pdf"))}>{busy === "merge-pdf" ? "Merging…" : "Merge PDFs"}</button>
      <Download result={mergePdfResult} />
    </section>
    <section style={box} id="split-pdf">
      <h2>Split PDF</h2><p>একটি PDF-এর প্রতিটি পৃষ্ঠা আলাদা PDF ফাইলে ভাগ করে ZIP হিসেবে ডাউনলোড করুন। সর্বোচ্চ ১০০ MB এবং ২০০ পৃষ্ঠা।</p>
      <label style={field}>Select PDF file <input type="file" accept="application/pdf,.pdf" onChange={e => { setPdfSplitInput(e.target.files?.[0] || null); clearSplitPdf(); }} /></label>
      <button style={button} disabled={!pdfSplitInput || !!busy} onClick={() => run("split-pdf", async () => saveSplitPdf(await splitPdfToZip(pdfSplitInput), (pdfSplitInput.name.replace(/\.pdf$/i, "") || "document") + "-pages.zip"))}>{busy === "split-pdf" ? "Splitting…" : "Split PDF into pages"}</button>
      <Download result={splitPdfResult} />
    </section>
    <section style={box} id="audio-to-wav">
      <h2>Audio to WAV</h2><p>যেকোনো অডিও ফাইল (MP3, M4A, OGG, AAC) ব্রাউজারেই স্ট্যান্ডার্ড WAV অডিওতে রূপান্তর করুন।</p>
      <label style={field}>Audio file <input type="file" accept="audio/*" onChange={e => { setAudioInput(e.target.files?.[0] || null); clearAudio(); }} /></label>
      <button style={button} disabled={!audioInput || !!busy} onClick={() => run("audio", async () => saveAudio(await convertAudioToWav(audioInput), (audioInput.name.replace(/\.[^.]+$/, "") || "audio") + ".wav"))}>{busy === "audio" ? "Converting…" : "Convert to WAV"}</button>
      <Download result={audioResult} />
    </section>
    <section style={box} id="word-to-pdf">
      <h2>Word to PDF</h2><p>Microsoft Word (.docx) ফাইলকে সরাসরি ব্রাউজারেই একটি সুন্দর PDF ডকুমেন্টে রূপান্তর করুন।</p>
      <label style={field}>Word document (.docx) <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => { setDocxInput(e.target.files?.[0] || null); clearDocx(); }} /></label>
      <button style={button} disabled={!docxInput || !!busy} onClick={() => run("docx", async () => saveDocx(await docxToPdf(docxInput), (docxInput.name.replace(/\.docx$/i, "") || "document") + ".pdf"))}>{busy === "docx" ? "Converting…" : "Convert to PDF"}</button>
      <Download result={docxResult} />
    </section>
    <section style={box} id="pdf-to-docx">
      <h2>PDF to Word</h2><p>PDF ফাইল থেকে টেক্সট ও কন্টেন্ট এক্সট্রাক্ট করে এডিটেবল Word (.docx) ফাইলে রূপান্তর করুন।</p>
      <label style={field}>PDF file <input type="file" accept=".pdf,application/pdf" onChange={e => { setPdfDocxInput(e.target.files?.[0] || null); clearPdfDocx(); }} /></label>
      <button style={button} disabled={!pdfDocxInput || !!busy} onClick={() => run("pdf-docx", async () => savePdfDocx(await pdfToDocx(pdfDocxInput), (pdfDocxInput.name.replace(/\.pdf$/i, "") || "converted") + ".docx"))}>{busy === "pdf-docx" ? "Converting…" : "Convert to Word (.docx)"}</button>
      <Download result={pdfDocxResult} />
    </section>
    <section style={box} id="html-to-pdf">
      <h2>HTML to PDF</h2><p>HTML কোড বা যেকোনো টেক্সট সরাসরি একটি সাজানো PDF ফাইলে রূপান্তর করুন।</p>
      <label style={field}>Paste HTML or enter text
        <textarea rows={4} value={htmlInput} onChange={e => { setHtmlInput(e.target.value); clearHtml(); }} placeholder="<h1>Title</h1><p>Your content here...</p>" style={{ width: "100%", padding: 10, borderRadius: 8, background: "var(--background, #111827)", color: "inherit", border: "1px solid var(--border, #4b5563)", marginTop: 8 }} />
      </label>
      <button style={button} disabled={!htmlInput.trim() || !!busy} onClick={() => run("html-pdf", async () => saveHtml(await htmlToPdf(htmlInput), "webpage.pdf"))}>{busy === "html-pdf" ? "Creating PDF…" : "Generate PDF"}</button>
      <Download result={htmlResult} />
    </section>
    <section style={box} id="pptx-to-pdf">
      <h2>PowerPoint to PDF</h2><p>PowerPoint (.pptx) প্রেজেন্টেশন স্লাইডগুলোকে PDF ডকুমেন্টে কনভার্ট করুন।</p>
      <label style={field}>PowerPoint (.pptx) file <input type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={e => { setPptxInput(e.target.files?.[0] || null); clearPptx(); }} /></label>
      <button style={button} disabled={!pptxInput || !!busy} onClick={() => run("pptx", async () => savePptx(await pptxToPdf(pptxInput), (pptxInput.name.replace(/\.pptx$/i, "") || "presentation") + ".pdf"))}>{busy === "pptx" ? "Converting…" : "Convert to PDF"}</button>
      <Download result={pptxResult} />
    </section>
    <section style={box} id="audio-compressor">
      <h2>Audio Compressor</h2><p>অডিও ফাইলের সাইজ ব্রাউজারেই অপ্টিমাইজ ও কম্প্রেস করুন (আকার প্রায় ৬০-৭০% ছোট হবে)।</p>
      <label style={field}>Audio file (MP3 / WAV / FLAC / M4A) <input type="file" accept="audio/*" onChange={e => { setAudioCompressInput(e.target.files?.[0] || null); clearAudioCompress(); }} /></label>
      <button style={button} disabled={!audioCompressInput || !!busy} onClick={() => run("compress-audio", async () => saveAudioCompress(await compressAudio(audioCompressInput), (audioCompressInput.name.replace(/\.[^.]+$/, "") || "audio") + "-compressed.wav"))}>{busy === "compress-audio" ? "Compressing…" : "Compress Audio"}</button>
      <Download result={audioCompressResult} />
    </section>
    <section style={box} id="video-compressor">
      <h2>Video Compressor & WebM Converter</h2><p>ভিডিও ফাইল (MP4 / WebM / MOV) ব্রাউজারেই ছোট রেজ্যুলেশনে কম্প্রেস ও রিকোড করুন।</p>
      <label style={field}>Video file <input type="file" accept="video/*" onChange={e => { setVideoCompressInput(e.target.files?.[0] || null); clearVideoCompress(); }} /></label>
      <button style={button} disabled={!videoCompressInput || !!busy} onClick={() => run("compress-video", async () => saveVideoCompress(await compressVideo(videoCompressInput), (videoCompressInput.name.replace(/\.[^.]+$/, "") || "video") + "-compressed.webm"))}>{busy === "compress-video" ? "Processing…" : "Compress Video"}</button>
      <Download result={videoCompressResult} />
    </section>
    <section style={box} id="font-converter">
      <h2>Font Converter (TTF to WOFF)</h2><p>TrueType (.ttf) ফন্ট ফাইলকে হালকা ও ফাস্ট ওয়েব ফন্ট (.woff)-এ রূপান্তর করুন।</p>
      <label style={field}>TTF Font file <input type="file" accept=".ttf,font/ttf" onChange={e => { setTtfInput(e.target.files?.[0] || null); clearTtf(); }} /></label>
      <button style={button} disabled={!ttfInput || !!busy} onClick={() => run("ttf-woff", async () => saveTtf(await ttfToWoff(ttfInput), (ttfInput.name.replace(/\.ttf$/i, "") || "font") + ".woff"))}>{busy === "ttf-woff" ? "Converting…" : "Convert to WOFF"}</button>
      <Download result={ttfResult} />
    </section>
    <section style={box} id="csv-to-excel">
      <h2>CSV to Excel</h2><p>CSV ফাইলকে XLSX workbook-এ রূপান্তর করুন।</p>
      <label style={field}>CSV file <input type="file" accept=".csv,text/csv" onChange={e => { setCsv(e.target.files?.[0] || null); clearCsv(); }} /></label>
      <button style={button} disabled={!csv || !!busy} onClick={() => run("csv", async () => saveCsv(await csvToXlsx(csv), csv.name.replace(/\.csv$/i, "") + ".xlsx"))}>{busy === "csv" ? "Converting…" : "Convert to Excel"}</button>
      <Download result={csvResult} />
    </section>
    <section style={box} id="excel-to-csv">
      <h2>Excel to CSV</h2><p>প্রথম worksheet-এর data CSV-তে export করুন।</p>
      <label style={field}>XLSX file <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => { setXlsx(e.target.files?.[0] || null); clearXlsx(); }} /></label>
      <button style={button} disabled={!xlsx || !!busy} onClick={() => run("xlsx", async () => saveXlsx(await xlsxToCsv(xlsx), xlsx.name.replace(/\.xlsx$/i, "") + ".csv"))}>{busy === "xlsx" ? "Converting…" : "Convert to CSV"}</button>
      <Download result={xlsxResult} />
    </section>
    <section style={box} id="zip-creator">
      <h2>ZIP Creator</h2><p>একাধিক local file একটি ZIP archive-এ প্যাক করুন (Store/no compression)।</p>
      <label style={field}>Files <input type="file" multiple onChange={e => { setZipFilesInput([...e.target.files || []]); clearZip(); }} /></label>
      <button style={button} disabled={!zipFilesInput.length || !!busy} onClick={() => run("zip-create", async () => saveZip(await zipFiles(zipFilesInput), "quicktoolbox-archive.zip"))}>{busy === "zip-create" ? "Creating…" : "Create ZIP"}</button>
      <Download result={zipResult} />
    </section>
    <section style={box} id="zip-extractor">
      <h2>ZIP Extractor</h2><p>ZIP-এর file integrity যাচাই করে browser-এ extract করুন।</p>
      <label style={field}>ZIP file <input type="file" accept=".zip,application/zip" onChange={e => { setZipInput(e.target.files?.[0] || null); setExtracted([]); }} /></label>
      <button style={button} disabled={!zipInput || !!busy} onClick={() => run("unzip", async () => {
        const entries = await unzipEntries(zipInput);
        if (!entries.length) throw new Error("ZIP-এ extract করার মতো file নেই।");
        setExtracted(entries.map(entry => ({ name: entry.name, size: entry.data.length, url: URL.createObjectURL(new Blob([entry.data])) })));
      })}>{busy === "unzip" ? "Extracting…" : "Extract files"}</button>
      {extracted.map(item => <p key={item.name}><a href={item.url} download={item.name} style={{ color: "#7dd3fc" }}>{item.name} · {(item.size / 1024).toFixed(1)} KB — Download</a></p>)}
    </section>
    {error && <p role="alert" style={{ color: "#fca5a5", marginTop: 14 }}>{error}</p>}
  </div>;
}