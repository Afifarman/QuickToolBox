'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULTS = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  warm: 0,
  cool: 0,
  auto: false,
  rotate: 0,
  flipH: false,
  flipV: false,
  bgMode: 'none',
  threshold: 240,
};

const PRESETS = [
  ['Auto Enhance', { auto: true }],
  ['Vivid', { brightness: 106, contrast: 112, saturate: 140 }],
  ['B&W', { grayscale: 100, contrast: 112 }],
  ['Sepia', { sepia: 100 }],
  ['Vintage', { sepia: 40, contrast: 90, saturate: 80, brightness: 105 }],
  ['Warm', { saturate: 115, brightness: 103, warm: 35 }],
  ['Cool', { saturate: 110, brightness: 102, cool: 35 }],
  ['Soft', { brightness: 108, contrast: 92, saturate: 95, blur: 1.2 }],
  ['Dramatic', { contrast: 130, saturate: 120, brightness: 96 }],
];

const SLIDERS = [
  ['brightness', 'Brightness', 40, 180],
  ['contrast', 'Contrast', 40, 200],
  ['saturate', 'Saturation', 0, 250],
  ['blur', 'Blur', 0, 12],
  ['grayscale', 'Grayscale', 0, 100],
  ['sepia', 'Sepia', 0, 100],
];

// Per-channel percentile stretch (2%–98%) — a classic one-click "auto levels" enhance.
function autoEnhancePixels(data) {
  const histR = new Uint32Array(256);
  const histG = new Uint32Array(256);
  const histB = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    histR[data[i]] += 1;
    histG[data[i + 1]] += 1;
    histB[data[i + 2]] += 1;
  }
  const pixels = data.length / 4;
  const low = pixels * 0.02;
  const high = pixels * 0.98;
  const find = (hist) => {
    let lo = 0;
    let hi = 255;
    let acc = 0;
    for (let i = 0; i < 256; i += 1) {
      acc += hist[i];
      if (acc >= low) { lo = i; break; }
    }
    acc = 0;
    for (let i = 255; i >= 0; i -= 1) {
      acc += hist[i];
      if (acc >= pixels - high) { hi = i; break; }
    }
    return [lo, Math.max(lo + 1, hi)];
  };
  const [rLo, rHi] = find(histR);
  const [gLo, gHi] = find(histG);
  const [bLo, bHi] = find(histB);
  const lutR = new Uint8ClampedArray(256);
  const lutG = new Uint8ClampedArray(256);
  const lutB = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i += 1) {
    lutR[i] = ((i - rLo) * 255) / (rHi - rLo);
    lutG[i] = ((i - gLo) * 255) / (gHi - gLo);
    lutB[i] = ((i - bLo) * 255) / (bHi - bLo);
  }
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lutR[data[i]];
    data[i + 1] = lutG[data[i + 1]];
    data[i + 2] = lutB[data[i + 2]];
  }
}

function removeBackground(ctx, w, h, threshold) {
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const soft = 26;
  for (let i = 0; i < data.length; i += 4) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    if (max >= threshold - soft) {
      const strength = Math.min(1, (max - (threshold - soft)) / soft);
      data[i + 3] = Math.round(data[i + 3] * (1 - strength));
    }
  }
  ctx.putImageData(img, 0, 0);
}

function overlayTint(ctx, w, h, color, strength) {
  if (strength <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = Math.min(1, strength / 100);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function renderTo(canvas, img, s) {
  const swap = ((s.rotate % 360) + 360) % 360 === 90 || ((s.rotate % 360) + 360) % 360 === 270;
  const w = swap ? img.naturalHeight : img.naturalWidth;
  const h = swap ? img.naturalWidth : img.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.save();
  ctx.filter = `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturate}%) blur(${s.blur}px) grayscale(${s.grayscale}%) sepia(${s.sepia}%)`;
  ctx.translate(w / 2, h / 2);
  ctx.rotate((s.rotate * Math.PI) / 180);
  ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();

  overlayTint(ctx, w, h, '#ff9a3c', s.warm);
  overlayTint(ctx, w, h, '#3c7dff', s.cool);

  if (s.auto) {
    const imgData = ctx.getImageData(0, 0, w, h);
    autoEnhancePixels(imgData.data);
    ctx.putImageData(imgData, 0, 0);
  }

  if (s.bgMode === 'remove') {
    removeBackground(ctx, w, h, s.threshold);
  }

  if (s.bgMode === 'blur') {
    const temp = document.createElement('canvas');
    temp.width = w;
    temp.height = h;
    temp.getContext('2d').drawImage(canvas, 0, 0);
    ctx.save();
    ctx.filter = `blur(${Math.max(8, Math.round(Math.min(w, h) / 40))}px)`;
    ctx.drawImage(temp, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    const cx = w / 2;
    const cy = h / 2;
    ctx.ellipse(cx, cy, w * 0.32, h * 0.42, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(temp, 0, 0);
    ctx.restore();
  }
}

export default function PhotoEditorPage() {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const fileRef = useRef(null);
  const rafRef = useRef(0);
  const [fileName, setFileName] = useState('');
  const [hasImage, setHasImage] = useState(false);
  const [settings, setSettings] = useState(DEFAULTS);
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [format, setFormat] = useState('png');

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    renderTo(canvas, img, compare ? DEFAULTS : settings);
  }, [settings, compare]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    setError('');
    setBusy(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setFileName(file.name);
      setHasImage(true);
      setSettings(DEFAULTS);
      setBusy(false);
      requestAnimationFrame(draw);
    };
    img.onerror = () => {
      setError('Could not read that image. Try another file.');
      setBusy(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const type = settings.bgMode === 'remove' ? 'image/png' : format === 'jpg' ? 'image/jpeg' : 'image/png';
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `quicktoolbox-edit.${type === 'image/jpeg' ? 'jpg' : 'png'}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, type, 0.92);
  }

  const ready = hasImage;

  return (
    <>
      <header>
        <Link className="brand" href="/">
          <b>Q</b> QuickToolBox
        </Link>
        <nav>
          <Link href="/ai">AI Tools</Link>
          <Link href="/student-tools">Student tools</Link>
          <Link href="/">← All tools</Link>
        </nav>
      </header>
      <main className="ai-page">
        <small>🤖 AI PHOTO EDIT</small>
        <h1>AI Photo Editor</h1>
        <p>
          One-click AI-style enhance, filters, background tools and more — right in your browser. Your photos never
          leave your device.
        </p>

        {!ready ? (
          <div
            className="photo-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              loadFile(e.dataTransfer.files?.[0]);
            }}
          >
            <p>Drag &amp; drop a photo here</p>
            <button className="btn" type="button" onClick={() => fileRef.current?.click()}>
              Choose photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => loadFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <>
            <div className="photo-stage">
              <canvas ref={canvasRef} className="photo-canvas" />
              {compare && <span className="photo-badge">Original</span>}
            </div>

            <div className="ai-actions" style={{ marginTop: 14 }}>
              <button
                className="btn light"
                type="button"
                onMouseDown={() => setCompare(true)}
                onMouseUp={() => setCompare(false)}
                onMouseLeave={() => setCompare(false)}
                onTouchStart={() => setCompare(true)}
                onTouchEnd={() => setCompare(false)}
              >
                Hold to compare
              </button>
              <button className="btn light" type="button" onClick={() => setSettings(DEFAULTS)}>
                Reset
              </button>
              <button className="btn light" type="button" onClick={() => fileRef.current?.click()}>
                New photo
              </button>
              <button className="btn" type="button" onClick={download}>
                Download ↓
              </button>
              <select className="photo-select" value={format} onChange={(e) => setFormat(e.target.value)} aria-label="Download format">
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
              </select>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
            </div>

            <section className="result" style={{ marginTop: 22 }}>
              <h2 style={{ fontSize: 20, marginTop: 0 }}>✨ One-click AI presets</h2>
              <div className="ai-templates" style={{ marginTop: 8 }}>
                {PRESETS.map(([label, patch]) => (
                  <button
                    key={label}
                    type="button"
                    className="ai-chip"
                    onClick={() => setSettings({ ...DEFAULTS, ...patch, rotate: settings.rotate, flipH: settings.flipH, flipV: settings.flipV, bgMode: settings.bgMode, threshold: settings.threshold })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="result" style={{ marginTop: 16 }}>
              <h2 style={{ fontSize: 20, marginTop: 0 }}>🎛️ Adjust</h2>
              <div className="photo-controls">
                {SLIDERS.map(([key, label, min, max]) => (
                  <label className="photo-slider" key={key}>
                    <span>
                      {label} <b>{settings[key]}</b>
                    </span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={key === 'blur' ? 0.1 : 1}
                      value={settings[key]}
                      onChange={(e) => set(key, Number(e.target.value))}
                    />
                  </label>
                ))}
                <label className="photo-slider">
                  <span>
                    Warmth <b>{settings.warm}</b>
                  </span>
                  <input type="range" min={0} max={100} value={settings.warm} onChange={(e) => set('warm', Number(e.target.value))} />
                </label>
                <label className="photo-slider">
                  <span>
                    Cool tone <b>{settings.cool}</b>
                  </span>
                  <input type="range" min={0} max={100} value={settings.cool} onChange={(e) => set('cool', Number(e.target.value))} />
                </label>
              </div>
              <div className="ai-templates" style={{ marginTop: 14 }}>
                <button className="ai-chip" type="button" onClick={() => set('rotate', (settings.rotate + 90) % 360)}>
                  ⟳ Rotate 90°
                </button>
                <button className="ai-chip" type="button" onClick={() => set('flipH', !settings.flipH)}>
                  ↔️ Flip horizontal
                </button>
                <button className="ai-chip" type="button" onClick={() => set('flipV', !settings.flipV)}>
                  ↕️ Flip vertical
                </button>
              </div>
            </section>

            <section className="result" style={{ marginTop: 16 }}>
              <h2 style={{ fontSize: 20, marginTop: 0 }}>🪄 Background tools</h2>
              <div className="ai-templates" style={{ marginTop: 8 }}>
                <button
                  className={`ai-chip${settings.bgMode === 'remove' ? ' active' : ''}`}
                  type="button"
                  onClick={() => set('bgMode', settings.bgMode === 'remove' ? 'none' : 'remove')}
                >
                  Remove background
                </button>
                <button
                  className={`ai-chip${settings.bgMode === 'blur' ? ' active' : ''}`}
                  type="button"
                  onClick={() => set('bgMode', settings.bgMode === 'blur' ? 'none' : 'blur')}
                >
                  Portrait blur
                </button>
              </div>
              {settings.bgMode === 'remove' && (
                <label className="photo-slider" style={{ marginTop: 12 }}>
                  <span>
                    Remove sensitivity <b>{settings.threshold}</b>
                  </span>
                  <input type="range" min={180} max={255} value={settings.threshold} onChange={(e) => set('threshold', Number(e.target.value))} />
                </label>
              )}
              <p style={{ color: '#667085', marginBottom: 0 }}>
                Background removal works best on plain white or solid-color backgrounds. Download as PNG to keep
                transparency.
              </p>
            </section>
          </>
        )}

        {busy && <p className="ai-count">Loading photo…</p>}
        {error && (
          <p className="result" style={{ marginTop: 16, color: '#b42318' }}>
            {error}
          </p>
        )}
        <p className="ai-count" style={{ marginTop: 22 }}>
          {fileName ? `Editing: ${fileName}` : 'Tip: try “Auto Enhance” first, then fine-tune with the sliders.'}
        </p>
      </main>
      <footer>
        © 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span>
      </footer>
    </>
  );
}
