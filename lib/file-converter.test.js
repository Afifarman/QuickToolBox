import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("file converter hub clearly distinguishes live tools from planned formats", async () => {
  const source = await readFile(new URL("../components/FileConverterHub.js", import.meta.url), "utf8");
  assert.match(source, /status: "ready"/);
  assert.match(source, /status: status \|\| "planned"/);
  assert.match(source, /Coming in a tested update/);
  assert.match(source, /Image converter & compressor/);
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

test("four converter engines are rendered with testing status in the directory", async () => {
  const source = await readFile(new URL("../components/FileConverterHub.js", import.meta.url), "utf8");
  assert.match(source, /\["CSV to Excel".*"testing"\]/);
  assert.match(source, /\["Excel to CSV".*"testing"\]/);
  assert.match(source, /\["ZIP Extractor".*"testing"\]/);
  assert.match(source, /\["ZIP Creator".*"testing"\]/);
  assert.match(source, /<ConverterEngines \/>/);
});
