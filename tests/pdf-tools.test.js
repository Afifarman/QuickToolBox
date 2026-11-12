import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { mergePdfBuffers, splitPdfBuffer } from "../lib/pdf-tools.js";

async function makePdf(pageCount) {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) pdf.addPage();
  return pdf.save();
}

test("mergePdfBuffers combines all pages in input order", async () => {
  const first = await makePdf(2);
  const second = await makePdf(1);
  const merged = await mergePdfBuffers([first, second]);
  const parsed = await PDFDocument.load(merged);
  assert.equal(parsed.getPageCount(), 3);
});

test("mergePdfBuffers rejects fewer than two input files", async () => {
  await assert.rejects(async () => mergePdfBuffers([await makePdf(1)]), /কমপক্ষে ২টি PDF/);
});

test("splitPdfBuffer returns one valid PDF per source page", async () => {
  const source = await makePdf(3);
  const outputs = await splitPdfBuffer(source);
  assert.equal(outputs.length, 3);
  for (const [index, output] of outputs.entries()) {
    assert.match(output.name, new RegExp("page-" + String(index + 1).padStart(3, "0") + "\\.pdf$"));
    const parsed = await PDFDocument.load(output.bytes);
    assert.equal(parsed.getPageCount(), 1);
  }
});

test("splitPdfBuffer rejects invalid input", async () => {
  await assert.rejects(() => splitPdfBuffer(new Uint8Array([1, 2, 3])), /empty or too small/);
});
