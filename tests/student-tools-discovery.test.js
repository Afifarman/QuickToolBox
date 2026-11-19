import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { LISTED_STUDENT_TOOLS } from "../lib/student-tools.js";

test("implemented GPA and Word Counter tools are listed in the Student Tools directory and sitemap source", async () => {
  const slugs = new Set(LISTED_STUDENT_TOOLS.map(({ slug }) => slug));
  for (const slug of ["gpa-cgpa-calculator", "word-character-counter"]) {
    assert.ok(slugs.has(slug), `Student Tools directory is missing ${slug}`);
  }
  const sitemap = await readFile(new URL("../app/sitemap.js", import.meta.url), "utf8");
  assert.match(sitemap, /LISTED_STUDENT_TOOLS\.map/);
});

test("homepage directory links to GPA/CGPA Calculator and Word Counter", async () => {
  const home = await readFile(new URL("../components/PdfGuruInspiredHome.js", import.meta.url), "utf8");
  for (const slug of ["gpa-cgpa-calculator", "word-character-counter"]) {
    assert.ok(home.includes(`href: "/student-tools/${slug}"`), `Homepage is missing ${slug}`);
  }
});
