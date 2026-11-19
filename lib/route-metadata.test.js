import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildMetadata } from "./metadata.js";

test("File Converter metadata uses its own canonical and Open Graph URL", async () => {
  const source = await readFile(new URL("../app/file-converter/page.js", import.meta.url), "utf8");
  assert.match(source, /buildMetadata\(\{/);
  assert.match(source, /path:\s*["']\/file-converter["']/);

  const metadata = buildMetadata({
    title: "File Converter",
    description: "Convert files in your browser.",
    path: "/file-converter",
  });
  assert.equal(metadata.alternates.canonical, "/file-converter");
  assert.equal(new URL(metadata.openGraph.url).pathname, "/file-converter");
});

test("AI Platform metadata uses its own Open Graph URL and remains noindex", async () => {
  const source = await readFile(new URL("../app/ai-platform/page.js", import.meta.url), "utf8");
  assert.match(source, /buildMetadata\(\{/);
  assert.match(source, /path:\s*["']\/ai-platform["']/);
  assert.match(source, /noindex:\s*true/);

  const metadata = buildMetadata({
    title: "AI Platform",
    description: "Explore AI tools.",
    path: "/ai-platform",
    noindex: true,
  });
  assert.equal(metadata.alternates.canonical, "/ai-platform");
  assert.equal(new URL(metadata.openGraph.url).pathname, "/ai-platform");
  assert.deepEqual(metadata.robots, { index: false, follow: true });
});
