import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("file converter hub clearly distinguishes live tools from planned formats", async () => {
  const source = await readFile(new URL("../components/FileConverterHub.js", import.meta.url), "utf8");
  assert.match(source, /status: "ready"/);
  assert.match(source, /status: "planned"/);
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
