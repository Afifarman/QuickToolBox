import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("File Converter metadata uses its own canonical and Open Graph URL", async () => {
  const page = await readFile(new URL("../app/file-converter/page.js", import.meta.url), "utf8");
  const helper = await readFile(new URL("./metadata.js", import.meta.url), "utf8");

  assert.match(page, /buildMetadata\(\{/);
  assert.match(page, /path:\s*["']\/file-converter["']/);
  assert.match(helper, /const url = new URL\(path, SITE_URL\)\.toString\(\)/);
  assert.match(helper, /openGraph:\s*\{[\s\S]*?url,/);
  assert.match(page, /alternates|buildMetadata/);
});

test("AI Platform metadata uses its own Open Graph URL and remains noindex", async () => {
  const page = await readFile(new URL("../app/ai-platform/page.js", import.meta.url), "utf8");
  const helper = await readFile(new URL("./metadata.js", import.meta.url), "utf8");

  assert.match(page, /buildMetadata\(\{/);
  assert.match(page, /path:\s*["']\/ai-platform["']/);
  assert.match(page, /noindex:\s*true/);
  assert.match(helper, /if \(noindex\)/);
  assert.match(helper, /metadata\.robots = \{ index: false, follow: true \}/);
});
