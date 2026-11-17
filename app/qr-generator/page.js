"use client";

import { useState } from "react";
import QRCode from "qrcode";

const panelStyle = {
  background: "rgba(15, 23, 42, 0.82)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 20px 60px rgba(0,0,0,.22)",
};
const buttonStyle = {
  border: 0,
  borderRadius: 12,
  padding: "12px 17px",
  background: "linear-gradient(120deg,#7c3aed,#0891b2)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

export default function QRGeneratorPage() {
  const [value, setValue] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function generateCode(event) {
    event.preventDefault();
    const text = value.trim();
    if (!text) {
      setError("Enter text or a URL before generating a QR code.");
      setImage("");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        type: "image/png",
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      setImage(dataUrl);
    } catch (generationError) {
      setImage("");
      setError(generationError?.message || "Could not generate this QR code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "34px 18px 64px", color: "#f8fafc" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "#67e8f9", fontSize: 12, fontWeight: 800, letterSpacing: ".16em" }}>QUICKTOOLBOX · PRODUCTIVITY</p>
        <h1 style={{ fontSize: "clamp(30px,5vw,46px)", lineHeight: 1.08, margin: "8px 0 12px" }}>Free QR Code Generator</h1>
        <p style={{ color: "#cbd5e1", maxWidth: 680, lineHeight: 1.7 }}>
          Create a QR code from text or a link in your browser, then save it as a PNG image.
        </p>
      </header>

      <section style={panelStyle}>
        <form onSubmit={generateCode}>
          <label htmlFor="qr-content" style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Text or URL</label>
          <textarea
            id="qr-content"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://example.com or any text"
            rows={4}
            maxLength={1800}
            style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, padding: 14, color: "#f8fafc", background: "#0b1220", border: "1px solid rgba(148,163,184,.35)", resize: "vertical" }}
          />
          <p style={{ color: "#94a3b8", fontSize: 12, margin: "7px 0 16px" }}>{value.length}/1800 characters · QR code generation runs locally in this browser.</p>
          <button type="submit" disabled={busy} style={{ ...buttonStyle, opacity: busy ? .65 : 1 }}>
            {busy ? "Generating…" : "Generate QR code"}
          </button>
        </form>
        {error && <p role="alert" style={{ color: "#fca5a5", marginTop: 14 }}>{error}</p>}
        {image && (
          <div style={{ marginTop: 22, display: "grid", justifyItems: "start", gap: 14 }}>
            <img src={image} alt="Generated QR code" width="256" height="256" style={{ width: "min(256px,100%)", height: "auto", background: "white", padding: 12, borderRadius: 16 }} />
            <a href={image} download="quicktoolbox-qr.png" style={{ ...buttonStyle, textDecoration: "none", display: "inline-block" }}>Download PNG</a>
          </div>
        )}
      </section>
    </main>
  );
}
