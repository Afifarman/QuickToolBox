'use client';

import Link from 'next/link';
import { useState } from 'react';
import QRCode from 'qrcode';

export default function QrCodeGenerator() {
  const [text, setText] = useState('https://quicktoolbox-bd.vercel.app');
  const [size, setSize] = useState(256);
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    setError('');
    try {
      if (!text.trim()) throw new Error('Enter some text or a URL.');
      const url = await QRCode.toDataURL(text.trim(), { width: Number(size) || 256, margin: 2 });
      setDataUrl(url);
    } catch (err) {
      setError(err?.message || 'Could not generate QR code.');
      setDataUrl('');
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'quicktoolbox-qr.png';
    a.click();
  }

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/">← All tools</Link></nav>
      </header>
      <main className="ai-page">
        <small>⬛ QR CODE GENERATOR</small>
        <h1>QR Code Generator</h1>
        <p>Create QR codes for text, URLs, contact info and more — fully in your browser.</p>
        <section className="result">
          <label><b>Text or URL</b></label>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text or URL" style={{ display: 'block', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #d0d5dd', width: '100%' }} />
          <label style={{ display: 'block', marginTop: 12 }}><b>Size: {size}px</b></label>
          <input type="range" min={128} max={512} step={32} value={size} onChange={(e) => setSize(e.target.value)} style={{ width: '100%', marginTop: 8 }} />
          <button className="btn" type="button" onClick={generate} disabled={busy} style={{ marginTop: 12 }}>{busy ? 'Generating…' : 'Generate QR Code'}</button>
          {error && <p role="alert" style={{ color: '#b42318', marginTop: 8 }}>{error}</p>}
        </section>
        {dataUrl && (
          <section className="result" style={{ marginTop: 16, textAlign: 'center' }}>
            <img src={dataUrl} alt="Generated QR code" style={{ maxWidth: '100%', height: 'auto' }} />
            <div style={{ marginTop: 12 }}>
              <button className="btn light" type="button" onClick={download}>Download PNG</button>
            </div>
          </section>
        )}
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}