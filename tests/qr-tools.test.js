import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import QRCode from "qrcode";

test("QR generator creates a valid PNG data URL", async () => {
  const image = await QRCode.toDataURL("https://quicktoolbox-bd.vercel.app", {
    type: "image/png",
    width: 128,
    margin: 1,
  });
  assert.match(image, /^data:image\/png;base64,/);
});

test("QR scanner uses native QR detection and releases camera tracks", async () => {
  const source = await readFile(new URL("../app/qr-scanner/page.js", import.meta.url), "utf8");
  assert.match(source, /BarcodeDetector/);
  assert.match(source, /getUserMedia/);
  assert.match(source, /getTracks\(\)\.forEach/);
  assert.match(source, /createImageBitmap/);
});
