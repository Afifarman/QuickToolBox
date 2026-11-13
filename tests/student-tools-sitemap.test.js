import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sitemap from "../app/sitemap.js";

test("sitemap includes the Student Tools directory and implemented tool routes", () => {
  const paths = sitemap().map((entry) => new URL(entry.url).pathname);
  const expected = [
    "/student-tools",
    "/student-tools/grade-calculator",
    "/student-tools/gpa-cgpa-calculator",
    "/student-tools/semester-result-calculator",
    "/student-tools/word-character-counter",
    "/student-tools/student-translator",
    "/student-tools/pdf-notes-extractor",
    "/student-tools/assignment-checklist",
    "/student-tools/study-notes-organizer",
  ];
  for (const path of expected) assert.ok(paths.includes(path), `Missing sitemap path: ${path}`);
});

test("all implemented student tool routes are discoverable from both directories", async () => {
  const directory = await readFile(new URL("../app/student-tools/page.js", import.meta.url), "utf8");
  const home = await readFile(new URL("../components/PdfGuruInspiredHome.js", import.meta.url), "utf8");
  for (const slug of ["gpa-cgpa-calculator", "word-character-counter"]) {
    assert.ok(directory.includes(`['${slug}'`), `Student Tools directory is missing ${slug}`);
    assert.ok(home.includes(`href: "/student-tools/${slug}"`), `Homepage is missing ${slug}`);
  }
});
