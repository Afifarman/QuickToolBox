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
