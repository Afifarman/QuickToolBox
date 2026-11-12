import { PDFDocument } from "pdf-lib";

const MAX_PDF_FILE_BYTES = 100 * 1024 * 1024;
const MAX_MERGED_BYTES = 250 * 1024 * 1024;
const MAX_SPLIT_PAGES = 200;

function validatePdfBuffer(buffer, label = "PDF") {
  if (!(buffer instanceof ArrayBuffer) && !ArrayBuffer.isView(buffer)) {
    throw new Error(label + " data is not a valid file buffer.");
  }
  const size = buffer.byteLength;
  if (size < 8) throw new Error(label + " file is empty or too small to be a valid PDF.");
  if (size > MAX_PDF_FILE_BYTES) throw new Error(label + " exceeds the 100 MB per-file limit.");
}

export async function mergePdfBuffers(buffers) {
  if (!Array.isArray(buffers) || buffers.length < 2) {
    throw new Error("কমপক্ষে ২টি PDF ফাইল নির্বাচন করুন।");
  }
  const totalBytes = buffers.reduce((sum, buffer) => sum + (buffer?.byteLength || 0), 0);
  if (totalBytes > MAX_MERGED_BYTES) {
    throw new Error("Combined PDF input exceeds the 250 MB limit.");
  }

  const merged = await PDFDocument.create();
  let totalPages = 0;
  for (let index = 0; index < buffers.length; index += 1) {
    const buffer = buffers[index];
    validatePdfBuffer(buffer, "PDF " + (index + 1));
    const document = await PDFDocument.load(buffer);
    totalPages += document.getPageCount();
    if (totalPages > 500) throw new Error("Merged documents are limited to 500 pages.");
    const pages = await merged.copyPages(document, document.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}

export async function splitPdfBuffer(buffer) {
  validatePdfBuffer(buffer);
  const document = await PDFDocument.load(buffer);
  const pageCount = document.getPageCount();
  if (pageCount < 1) throw new Error("PDF contains no pages.");
  if (pageCount > MAX_SPLIT_PAGES) {
    throw new Error("PDF splitting is limited to 200 pages per file.");
  }

  const pages = [];
  for (let index = 0; index < pageCount; index += 1) {
    const output = await PDFDocument.create();
    const [page] = await output.copyPages(document, [index]);
    output.addPage(page);
    pages.push({
      name: "document-page-" + String(index + 1).padStart(3, "0") + ".pdf",
      bytes: await output.save(),
    });
  }
  return pages;
}
