"use client";

import { useEffect, useState } from "react";

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
    u32(lv, 14, crc); u32(lv, 18, data.length); u32(lv, 22, data.length);
    u16(lv, 26, name.length); local.set(name, 30); local.set(data, 30 + name.length);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0x0800); u16(cv, 10, 0);
    u32(cv, 16, crc); u32(cv, 20, data.length); u32(cv, 24, data.length);
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

function Download({ result }) {
  return result && <p role="status" style={{ marginTop: 12 }}><a href={result.url} download={result.name} style={{ color: "#7dd3fc", fontWeight: 700 }}>Download {result.name} · {(result.size / 1024).toFixed(1)} KB</a></p>;
}
function useResult() {
  const [result, setResult] = useState(null);
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result?.url]);
  function save(blob, name) { setResult({ url: URL.createObjectURL(blob), name, size: blob.size }); }
  return [result, save, () => setResult(null)];
}
const box = { border: "1px solid var(--border, #303746)", borderRadius: 16, padding: 18, marginTop: 18 };
const field = { display: "block", margin: "12px 0", color: "var(--muted-foreground, #9ca3af)" };
const button = { border: 0, borderRadius: 9, padding: "11px 16px", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" };

export default function ConverterEngines() {
  const [csv, setCsv] = useState(null), [xlsx, setXlsx] = useState(null), [zipInput, setZipInput] = useState(null), [zipFilesInput, setZipFilesInput] = useState([]);
  const [error, setError] = useState(""), [busy, setBusy] = useState("");
  const [csvResult, saveCsv, clearCsv] = useResult(), [xlsxResult, saveXlsx, clearXlsx] = useResult(), [zipResult, saveZip, clearZip] = useResult();
  async function run(label, fn) {
    setError(""); setBusy(label);
    try { await fn(); } catch (e) { setError(e?.message || "Conversion failed."); } finally { setBusy(""); }
  }
  return <>
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
      <label style={field}>ZIP file <input type="file" accept=".zip,application/zip" onChange={e => { setZipInput(e.target.files?.[0] || null); }} /></label>
      <button style={button} disabled={!zipInput || !!busy} onClick={() => run("unzip", async () => {
        const entries = await unzipEntries(zipInput);
        if (!entries.length) throw new Error("ZIP-এ extract করার মতো file নেই।");
        for (const entry of entries) {
          const url = URL.createObjectURL(new Blob([entry.data]));
          const a = document.createElement("a"); a.href = url; a.download = entry.name; a.click(); URL.revokeObjectURL(url);
        }
      })}>{busy === "unzip" ? "Extracting…" : "Extract files"}</button>
    </section>
    {error && <p role="alert" style={{ color: "#fca5a5", marginTop: 14 }}>{error}</p>}
  </>;
}
