import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("file converter hub clearly distinguishes live tools from planned formats", async () => {
  const source = await readFile(new URL("../components/FileConverterHub.js", import.meta.url), "utf8");
  assert.match(source, /status: "ready"/);
  assert.match(source, /status: "testing"/);
  assert.match(source, /status: "planned"/);
  assert.match(source, /Planned — not available yet/);
  assert.match(source, /Image converter & compressor/);
});

test("every advertised converter anchors to a section that exists", async () => {
  const hub = await readFile(new URL("../components/FileConverterHub.js", import.meta.url), "utf8");
  const engines = await readFile(new URL("../components/ConverterEngines.js", import.meta.url), "utf8");
  const ids = new Set([
    ...[...hub.matchAll(/id="([a-z0-9-]+)"/g)].map((match) => match[1]),
    ...[...engines.matchAll(/id="([a-z0-9-]+)"/g)].map((match) => match[1]),
  ]);

  const entries = [...hub.matchAll(/\{ name: "([^"]+)"[\s\S]*?status: "(ready|testing|planned)"[\s\S]*?\}/g)];
  assert.ok(entries.length >= 25, `expected the full catalogue, found ${entries.length}`);

  for (const [, name, status] of entries) {
    const entry = hub.slice(hub.indexOf(`name: "${name}"`), hub.indexOf(`name: "${name}"`) + 400);
    const href = /href: "(#[a-z0-9-]+)"/.exec(entry)?.[1];
    if (status === "planned") {
      assert.equal(href, undefined, `${name} is planned and must not link anywhere`);
      continue;
    }
    assert.ok(href, `${name} is ${status} but has no anchor`);
    assert.ok(ids.has(href.slice(1)), `${name} links to ${href}, which no section defines`);
  }
});

test("file converter route metadata promises no account and no paid API", async () => {
  const source = await readFile(new URL("../app/file-converter/page.js", import.meta.url), "utf8");
  assert.match(source, /file-converter/);
  assert.match(source, /without an account/);
});


test("image converter rejects unsupported formats and verifies the actual output MIME type", async () => {
  const source = await readFile(new URL("../components/FileConverterHub.js", import.meta.url), "utf8");
  assert.match(source, /\["image\/png", "image\/jpeg", "image\/webp"\]\.includes\(file\.type\)/);
  assert.match(source, /blob\.type !== format/);
  assert.match(source, /40 megapixels total/);
});

test("image converter preserves aspect ratio when only height or width is supplied", async () => {
  const source = await readFile(new URL("../components/FileConverterHub.js", import.meta.url), "utf8");
  assert.match(source, /const hasWidth = width\.trim\(\) !== ""/);
  assert.match(source, /const hasHeight = height\.trim\(\) !== ""/);
  assert.match(source, /Math\.round\(image\.naturalWidth \* requestedHeight \/ image\.naturalHeight\)/);
  assert.match(source, /Math\.round\(image\.naturalHeight \* targetWidth \/ image\.naturalWidth\)/);
});


test("SVG to PNG is a live browser-local converter with active-content and external-reference checks", async () => {
  const source = await readFile(new URL("../components/FileConverterHub.js", import.meta.url), "utf8");
  assert.match(source, /name: "SVG to PNG".*status: "ready"/);
  assert.match(source, /id="svg-converter"/);
  assert.match(source, /DOMParser\(\)/);
  assert.match(source, /foreignObject/);
  assert.match(source, /External SVG references are not supported/);
  assert.match(source, /canvas\.toBlob\(resolve, "image\/png"\)/);
  assert.match(source, /32 megapixels total/);
});

test("CSV and XLSX conversion engines validate input and create a real XLSX package", async () => {
  const source = await readFile(new URL("../components/ConverterEngines.js", import.meta.url), "utf8");
  assert.match(source, /function parseCsv/);
  assert.match(source, /async function csvToXlsx/);
  assert.match(source, /\[Content_Types\]\.xml/);
  assert.match(source, /async function xlsxToCsv/);
  assert.match(source, /sharedStrings\.xml/);
  assert.match(source, /ZIP integrity check failed/);
});

test("ZIP tools use ZIP signatures, CRC32 verification, and extraction limits", async () => {
  const source = await readFile(new URL("../components/ConverterEngines.js", import.meta.url), "utf8");
  assert.match(source, /0x04034b50/);
  assert.match(source, /0x02014b50/);
  assert.match(source, /0x06054b50/);
  assert.match(source, /crc32\(data\) !== crc/);
  assert.match(source, /300 \* 1024 \* 1024/);
  assert.match(source, /name\.split\("\/"\)\.includes\("\.\."\)/);
});

test("converter engines are rendered with testing status in the directory", async () => {
  const source = await readFile(new URL("../components/FileConverterHub.js", import.meta.url), "utf8");
  assert.match(source, /name: "CSV to Excel"[^}]*href: "#csv-to-excel"[^}]*status: "testing"/);
  assert.match(source, /name: "Excel to CSV"[^}]*href: "#excel-to-csv"[^}]*status: "testing"/);
  assert.match(source, /name: "ZIP Extractor"[^}]*href: "#zip-extractor"[^}]*status: "testing"/);
  assert.match(source, /name: "ZIP Creator"[^}]*href: "#zip-creator"[^}]*status: "testing"/);
  assert.match(source, /<ConverterEngines \/>/);
});


test("PDF compressor uses browser-side rasterization and clearly discloses lossy limitations", async () => {
  const source = await readFile(new URL("../components/ConverterEngines.js", import.meta.url), "utf8");
  assert.ok(source.includes("async function compressPdfRaster"));
  assert.ok(source.includes("pdfPage.render("));
  assert.ok(source.includes('canvas.toBlob(resolve, "image/jpeg", quality)'));
  assert.ok(source.includes("useObjectStreams: true"));
  assert.ok(source.includes("selectable text, links, forms and accessibility structure are not preserved"));
  assert.ok(source.includes("PDF compression supports 1–100 pages"));
});
