"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
const secondaryButtonStyle = {
  ...buttonStyle,
  background: "rgba(148,163,184,.14)",
  border: "1px solid rgba(148,163,184,.25)",
};

export default function QRScannerPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const timerRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("Ready to scan");
  const [error, setError] = useState("");

  const stopCamera = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const createDetector = useCallback(async () => {
    if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
      throw new Error("This browser does not support built-in QR scanning. Try a recent Chrome or Edge browser on HTTPS.");
    }
    const Detector = window.BarcodeDetector;
    if (typeof Detector.getSupportedFormats === "function") {
      const formats = await Detector.getSupportedFormats();
      if (!formats.includes("qr_code")) {
        throw new Error("This browser's barcode detector does not support QR codes.");
      }
    }
    return new Detector({ formats: ["qr_code"] });
  }, []);

  const scanVideo = useCallback(async function scanFrame() {
    const video = videoRef.current;
    if (!streamRef.current || !video || !detectorRef.current) return;

    if (video.readyState >= 2) {
      try {
        const codes = await detectorRef.current.detect(video);
        const value = codes.find((code) => code.rawValue)?.rawValue;
        if (value) {
          setResult(value);
          setStatus("QR code detected");
          stopCamera();
          return;
        }
      } catch (scanError) {
        setError(scanError?.message || "Could not read the camera frame.");
        stopCamera();
        return;
      }
    }
    timerRef.current = window.setTimeout(scanFrame, 300);
  }, [stopCamera]);

  async function startCamera() {
    setError("");
    setResult("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is unavailable. Open this page over HTTPS in a supported browser.");
      return;
    }

    setBusy(true);
    try {
      detectorRef.current = await createDetector();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setStatus("Point the camera at a QR code");
      if (!videoRef.current) throw new Error("Camera preview is not ready.");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      scanVideo();
    } catch (startError) {
      stopCamera();
      setError(
        startError?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings and try again."
          : startError?.message || "Unable to start the camera.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function scanImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setResult("");
    setBusy(true);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
      const detector = await createDetector();
      const bitmap = await createImageBitmap(file);
      let codes;
      try {
        codes = await detector.detect(bitmap);
      } finally {
        bitmap.close?.();
      }
      const value = codes.find((code) => code.rawValue)?.rawValue;
      if (!value) throw new Error("No QR code was found in this image.");
      setResult(value);
      setStatus("QR code detected from image");
    } catch (scanError) {
      setError(scanError?.message || "Could not scan this image in the current browser.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(result);
      setStatus("Result copied to clipboard");
    } catch {
      setError("Clipboard access is unavailable. Select and copy the result manually.");
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "34px 18px 64px", color: "#f8fafc" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "#67e8f9", fontSize: 12, fontWeight: 800, letterSpacing: ".16em" }}>QUICKTOOLBOX · CAMERA TOOLS</p>
        <h1 style={{ fontSize: "clamp(30px,5vw,46px)", lineHeight: 1.08, margin: "8px 0 12px" }}>QR Code Scanner</h1>
        <p style={{ color: "#cbd5e1", maxWidth: 680, lineHeight: 1.7 }}>
          Scan a QR code with your camera or choose an image. Detection runs in your browser using its native Barcode Detection API.
        </p>
      </header>

      <section style={panelStyle}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {!cameraActive ? (
            <button type="button" onClick={startCamera} disabled={busy} style={{ ...buttonStyle, opacity: busy ? .65 : 1 }}>
              {busy ? "Preparing scanner…" : "Start camera"}
            </button>
          ) : (
            <button type="button" onClick={stopCamera} style={secondaryButtonStyle}>Stop camera</button>
          )}
          <label htmlFor="qr-image-upload" style={{ ...secondaryButtonStyle, display: "inline-flex", alignItems: "center" }}>
            Scan an image
          </label>
          <input id="qr-image-upload" type="file" accept="image/*" onChange={scanImage} disabled={busy} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
        </div>

        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          aria-label="Live QR scanner camera preview"
          style={{ display: cameraActive ? "block" : "none", width: "100%", maxHeight: 420, aspectRatio: "16 / 9", objectFit: "cover", background: "#020617", borderRadius: 16 }}
        />
        {!cameraActive && (
          <div style={{ minHeight: 170, display: "grid", placeItems: "center", border: "1px dashed rgba(148,163,184,.35)", borderRadius: 16, color: "#94a3b8", textAlign: "center", padding: 20 }}>
            Camera preview will appear here after you allow access
          </div>
        )}

        <p role="status" aria-live="polite" style={{ color: "#a5f3fc", margin: "14px 0 0" }}>{status}</p>
        {error && <p role="alert" style={{ color: "#fca5a5", margin: "10px 0 0" }}>{error}</p>}
      </section>

      {result && (
        <section style={{ ...panelStyle, marginTop: 18 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 20 }}>Scanned result</h2>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#e2e8f0", fontFamily: "inherit", lineHeight: 1.6 }}>{result}</pre>
          <button type="button" onClick={copyResult} style={buttonStyle}>Copy result</button>
        </section>
      )}

      <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, marginTop: 18 }}>
        Browser support varies. Camera scanning requires HTTPS and permission. If the native QR detector is unavailable, the page reports that clearly instead of showing a false scan result.
      </p>
    </main>
  );
}
