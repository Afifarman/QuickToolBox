"use client";

import { useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";

const MM = 72 / 25.4;
const A4 = { width: 210 * MM, height: 297 * MM };
const presets = {
  passport: { label: "35 × 45 mm", width: 35, height: 45 },
  square: { label: "2 × 2 inch", width: 50.8, height: 50.8 },
  visa: { label: "50 × 50 mm", width: 50, height: 50 },
};

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be opened."));
    image.src = source;
  });
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function imageBytes(dataUrl) {
  const response = await fetch(dataUrl);
  return new Uint8Array(await response.arrayBuffer());
}

async function makePhotoSheet(dataUrl, preset, copies) {
  const source = await loadImage(dataUrl);
  const photoWidth = preset.width * MM;
  const photoHeight = preset.height * MM;
  const margin = 10 * MM;
  const gap = 3 * MM;
  const columns = Math.max(1, Math.floor((A4.width - margin * 2 + gap) / (photoWidth + gap)));
  const rows = Math.max(1, Math.floor((A4.height - margin * 2 + gap) / (photoHeight + gap)));
  if (copies > columns * rows) throw new Error(`This size fits up to ${columns * rows} copies on one A4 page. Reduce copies to continue.`);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round((preset.width / 25.4) * 300);
  canvas.height = Math.round((preset.height / 25.4) * 300);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not start the image editor.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.max(canvas.width / source.width, canvas.height / source.height);
  const width = source.width * scale;
  const height = source.height * scale;
  context.drawImage(source, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4.width, A4.height]);
  const jpg = await pdf.embedJpg(await imageBytes(canvas.toDataURL("image/jpeg", 0.94)));
  for (let index = 0; index < copies; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    page.drawImage(jpg, {
      x: margin + column * (photoWidth + gap),
      y: A4.height - margin - photoHeight - row * (photoHeight + gap),
      width: photoWidth,
      height: photoHeight,
    });
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

async function makeIdCardPdf(frontData, backData) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4.width, A4.height]);
  const width = 85.6 * MM;
  const height = 54 * MM;
  const gap = 8 * MM;
  const top = A4.height - 18 * MM;
  for (const [index, source] of [frontData, backData].entries()) {
    const bytes = await imageBytes(source);
    const image = source.startsWith("data:image/png") ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    page.drawImage(image, {
      x: 18 * MM + (width - drawWidth) / 2,
      y: top - height - index * (height + gap) + (height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

async function makeImagePdf(files) {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const source = await readFile(file);
    const bytes = await imageBytes(source);
    const image = file.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const page = pdf.addPage([A4.width, A4.height]);
    const scale = Math.min((A4.width - 32 * MM) / image.width, (A4.height - 32 * MM) / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, { x: (A4.width - width) / 2, y: (A4.height - height) / 2, width, height });
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}

function FilePicker({ label, accept = "image/jpeg,image/png,image/webp", multiple = false, onChange, files }) {
  return (
    <label className="qt-studio-upload">
      <span className="qt-studio-upload-icon">＋</span>
      <strong>{label}</strong>
      <small>{multiple ? "Choose one or more images" : "JPG, PNG or WebP"}</small>
      <input type="file" accept={accept} multiple={multiple} onChange={(event) => onChange(multiple ? Array.from(event.target.files || []) : event.target.files?.[0] || null)} />
      {files ? <span className="qt-studio-file">{multiple ? `${files.length} file(s) selected` : files.name}</span> : null}
    </label>
  );
}

export default function PhotoStudioWorkspace() {
  const [mode, setMode] = useState("passport");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [preset, setPreset] = useState("passport");
  const [copies, setCopies] = useState(8);
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview, setBackPreview] = useState("");
  const [documents, setDocuments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedPreset = presets[preset];
  const modeLabel = useMemo(() => ({ passport: "Passport photo sheet", id: "ID card front & back", pdf: "Images to PDF" }[mode]), [mode]);

  async function chooseSingle(file, setter, previewSetter) {
    setter(file);
    previewSetter(file ? await readFile(file) : "");
    setMessage("");
    setError("");
  }

  async function runAction() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      let blob;
      let filename;
      if (mode === "passport") {
        if (!photoPreview) throw new Error("Upload a photo first.");
        blob = await makePhotoSheet(photoPreview, selectedPreset, Number(copies));
        filename = "quicktoolbox-passport-photo-sheet.pdf";
      } else if (mode === "id") {
        if (!frontPreview || !backPreview) throw new Error("Upload both the front and back images.");
        blob = await makeIdCardPdf(frontPreview, backPreview);
        filename = "quicktoolbox-id-card-front-back.pdf";
      } else {
        if (!documents.length) throw new Error("Choose at least one image.");
        if (documents.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
          throw new Error("Only JPG, PNG and WebP images are supported.");
        }
        if (documents.some((file) => file.type === "image/webp")) {
          throw new Error("WebP images are not supported by the PDF encoder yet. Convert them to JPG or PNG first.");
        }
        blob = await makeImagePdf(documents);
        filename = "quicktoolbox-images.pdf";
      }
      downloadBlob(blob, filename);
      setMessage("Your PDF is ready. The file was generated in your browser.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The PDF could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="qt-studio-workspace">
      <div className="qt-studio-tabs" role="tablist" aria-label="Photo studio tools">
        <button type="button" role="tab" aria-selected={mode === "passport"} className={mode === "passport" ? "active" : ""} onClick={() => { setMode("passport"); setError(""); setMessage(""); }}>📸 Passport Photo</button>
        <button type="button" role="tab" aria-selected={mode === "id"} className={mode === "id" ? "active" : ""} onClick={() => { setMode("id"); setError(""); setMessage(""); }}>🪪 ID Card PDF</button>
        <button type="button" role="tab" aria-selected={mode === "pdf"} className={mode === "pdf" ? "active" : ""} onClick={() => { setMode("pdf"); setError(""); setMessage(""); }}>📄 Images to PDF</button>
      </div>

      <div className="qt-studio-editor">
        <section className="qt-studio-panel">
          <div className="qt-studio-panel-heading"><div><small>WORKSPACE / {mode.toUpperCase()}</small><h2>{modeLabel}</h2></div><span className="qt-studio-local">● Browser processing</span></div>

          {mode === "passport" ? <>
            <FilePicker label="Upload portrait photo" files={photo} onChange={(file) => chooseSingle(file, setPhoto, setPhotoPreview)} />
            <div className="qt-studio-fields">
              <label>Photo size<select value={preset} onChange={(event) => setPreset(event.target.value)}>{Object.entries(presets).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
              <label>Copies on A4<input type="number" min="1" max="48" value={copies} onChange={(event) => setCopies(Math.max(1, Math.min(48, Number(event.target.value) || 1)))} /></label>
            </div>
            <p className="qt-studio-hint">The photo is center-cropped to the selected ratio, placed on a white background and arranged on an A4 PDF at 300 DPI. Check the crop before printing.</p>
            {photoPreview ? <div className="qt-studio-preview"><img src={photoPreview} alt="Uploaded portrait preview" /></div> : null}
          </> : null}

          {mode === "id" ? <>
            <div className="qt-studio-two-upload">
              <FilePicker label="Front side" files={front} onChange={(file) => chooseSingle(file, setFront, setFrontPreview)} />
              <FilePicker label="Back side" files={back} onChange={(file) => chooseSingle(file, setBack, setBackPreview)} />
            </div>
            <p className="qt-studio-hint">Places the front and back images on one A4 page using the standard 85.6 × 54 mm card footprint. This is a print layout, not an official identity-card generator.</p>
            <div className="qt-studio-preview-row">{frontPreview ? <img src={frontPreview} alt="ID card front preview" /> : null}{backPreview ? <img src={backPreview} alt="ID card back preview" /> : null}</div>
          </> : null}

          {mode === "pdf" ? <>
            <FilePicker label="Choose document images" multiple files={documents} onChange={(files) => { setDocuments(files); setError(""); setMessage(""); }} />
            <p className="qt-studio-hint">Each JPG or PNG image becomes a separate A4 PDF page, fitted without stretching. WebP is currently not supported in this export.</p>
            {documents.length ? <ul className="qt-studio-file-list">{documents.map((file) => <li key={file.name + file.size}>{file.name}</li>)}</ul> : null}
          </> : null}

          <button type="button" className="qt-studio-primary" disabled={busy} onClick={runAction}>{busy ? "Preparing PDF…" : "Generate & Download PDF →"}</button>
          {error ? <p className="qt-studio-alert error" role="alert">{error}</p> : null}
          {message ? <p className="qt-studio-alert success" role="status">{message}</p> : null}
        </section>

        <aside className="qt-studio-side">
          <div className="qt-studio-side-card"><span className="qt-studio-side-icon">🔒</span><h3>Private by default</h3><p>Files are processed locally in this browser. They are not uploaded to a QuickToolBox server by these tools.</p></div>
          <div className="qt-studio-side-card"><span className="qt-studio-side-icon">🖨️</span><h3>Print ready</h3><p>PDF output uses A4 pages and millimetre-based sizing. Choose actual size / 100% in your print dialog.</p></div>
          <div className="qt-studio-side-card"><span className="qt-studio-side-icon">₀</span><h3>Free to use</h3><p>No account, paid API or subscription is required. Browser and printer costs may still apply.</p></div>
        </aside>
      </div>
    </div>
  );
}
