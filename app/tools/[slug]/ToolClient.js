'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';

const META = {
  'pdf-merge': ['PDF Merge', 'Merge multiple PDF files in your browser.'],
  'pdf-split': ['PDF Split', 'Split a PDF into selected pages.'],
  'pdf-compressor': ['PDF Compressor', 'Optimize and save a PDF locally.'],
  'image-to-pdf': ['Image → PDF', 'Convert images to PDF.'],
  'passport-photo-maker': ['Passport Photo Maker', 'Create a 2×2 inch passport photo.'],
  'gpa-calculator': ['GPA/CGPA Calculator', 'Calculate GPA or CGPA.'],
  'emi-calculator': ['EMI Calculator', 'Calculate monthly loan EMI.'],
  'salary-calculator': ['Salary Calculator', 'Estimate net salary.'],
  'tax-vat-calculator': ['Tax/VAT Calculator', 'Calculate VAT and simple tax estimates.'],
  'invoice-generator': ['Invoice Generator', 'Create and print an invoice.'],
  'cover-letter-builder': ['Cover Letter Builder', 'Create a professional cover letter.'],
  'qr-scanner': ['QR Scanner', 'Scan QR codes with a supported camera.'],
  'qr-generator': ['QR Code Generator', 'Generate QR codes from text or URLs.'],
  'url-shortener': ['URL Shortener', 'Shorten a URL with a public service.'],
  'json-formatter': ['JSON Formatter', 'Format, validate and minify JSON.'],
  'favicon-generator': ['Favicon Generator', 'Create a favicon from an image.'],
  'meta-tag-generator': ['Meta Tag Generator', 'Generate SEO meta tags.'],
  'sitemap-generator': ['Sitemap Generator', 'Generate XML sitemap content.'],
  'password-strength-checker': ['Password Strength Checker', 'Check password strength locally.'],
  'password-generator': ['Password Generator', 'Generate a strong random password.'],
  'word-counter': ['Word Counter', 'Count words, characters and reading time.'],
  'age-calculator': ['Age Calculator', 'Calculate age from birth date.'],
  'date-calculator': ['Date Calculator', 'Calculate days between dates.'],
  'unit-converter': ['Unit Converter', 'Convert length, weight and temperature.'],
  'percentage-calculator': ['Percentage Calculator', 'Calculate percentages and changes.'],
  'image-compressor': ['Image Compressor', 'Compress an image in your browser.'],
  'currency-converter': ['Currency Converter', 'Convert currencies with live rates when available.'],
  'world-clock': ['World Clock / Timezone', 'View current time across time zones.']
};

const Field = ({ label, ...p }) => (
  <label className="field">
    <span>{label}</span>
    <input {...p} />
  </label>
);

const Button = ({ children, onClick, light = false, ...rest }) => (
  <button
    className="btn"
    style={light ? { background: '#f2f4f7', color: '#344054', boxShadow: 'none' } : {}}
    onClick={onClick}
    {...rest}
  >
    {children}
  </button>
);

const Download = ({ data, name, type = 'text/plain' }) => (
  <a
    className="btn"
    href={data?.startsWith('data:') ? data : `data:${type};charset=utf-8,${encodeURIComponent(data || '')}`}
    download={name}
  >
    Download
  </a>
);

const Upload = ({ label, ...p }) => (
  <label className="upload">
    {label}
    <input type="file" {...p} />
  </label>
);

function PDFMerge() {
  const [fs, setFs] = useState([]);
  const [r, setR] = useState('');
  async function go() {
    try {
      if (!fs.length) return setR('Select PDF files.');
      const out = await PDFDocument.create();
      for (const f of fs) {
        const d = await PDFDocument.load(await f.arrayBuffer());
        (await out.copyPages(d, d.getPageIndices())).forEach((p) => out.addPage(p));
      }
      const u = URL.createObjectURL(new Blob([await out.save()], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = u;
      a.download = 'merged.pdf';
      a.click();
      setR('Merged PDF downloaded.');
    } catch {
      setR('Could not read a PDF.');
    }
  }
  return (
    <>
      <Upload label="Choose PDF files" accept="application/pdf" multiple onChange={(e) => setFs(Array.from(e.target.files || []))} />
      <Button onClick={go}>Merge PDFs</Button>
      <p>{r}</p>
    </>
  );
}

function PDFSplit() {
  const [f, setF] = useState(null);
  const [page, setPage] = useState('1');
  const [r, setR] = useState('');
  async function go() {
    try {
      if (!f) return setR('Choose a PDF.');
      const d = await PDFDocument.load(await f.arrayBuffer());
      const nums = page
        .split(',')
        .map((x) => parseInt(x.trim(), 10) - 1)
        .filter((x) => x >= 0 && x < d.getPageCount());
      if (!nums.length) return setR('Enter valid page numbers.');
      const out = await PDFDocument.create();
      (await out.copyPages(d, nums)).forEach((p) => out.addPage(p));
      const u = URL.createObjectURL(new Blob([await out.save()], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = u;
      a.download = 'split-pages.pdf';
      a.click();
      setR('Selected pages downloaded.');
    } catch {
      setR('Invalid PDF.');
    }
  }
  return (
    <>
      <Upload label="Choose PDF" accept="application/pdf" onChange={(e) => setF(e.target.files?.[0])} />
      <Field label="Pages (example: 1,3,5)" value={page} onChange={(e) => setPage(e.target.value)} />
      <Button onClick={go}>Split PDF</Button>
      <p>{r}</p>
    </>
  );
}

function PDFCompress() {
  const [f, setF] = useState(null);
  const [r, setR] = useState('');
  async function go() {
    try {
      if (!f) return setR('Choose a PDF.');
      const d = await PDFDocument.load(await f.arrayBuffer());
      const bytes = await d.save({ useObjectStreams: true, addDefaultPage: false });
      const u = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = u;
      a.download = 'optimized.pdf';
      a.click();
      setR(`Saved optimized PDF (${Math.round(bytes.length / 1024)} KB).`);
    } catch {
      setR('Could not optimize this PDF.');
    }
  }
  return (
    <>
      <Upload label="Choose PDF" accept="application/pdf" onChange={(e) => setF(e.target.files?.[0])} />
      <Button onClick={go}>Optimize PDF</Button>
      <p>{r}</p>
      <small>Browser optimization cannot guarantee a smaller file for every PDF.</small>
    </>
  );
}

function ImagePDF() {
  const [fs, setFs] = useState([]);
  const [r, setR] = useState('');
  async function go() {
    try {
      if (!fs.length) return setR('Choose images.');
      const out = await PDFDocument.create();
      for (const f of fs) {
        const bytes = await f.arrayBuffer();
        let im;
        if (f.type === 'image/png') im = await out.embedPng(bytes);
        else im = await out.embedJpg(bytes);
        const p = out.addPage([595, 842]);
        const s = Math.min(555 / im.width, 802 / im.height);
        p.drawImage(im, {
          x: (595 - im.width * s) / 2,
          y: (842 - im.height * s) / 2,
          width: im.width * s,
          height: im.height * s
        });
      }
      const u = URL.createObjectURL(new Blob([await out.save()], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = u;
      a.download = 'images.pdf';
      a.click();
      setR('PDF downloaded.');
    } catch {
      setR('Use JPG or PNG images.');
    }
  }
  return (
    <>
      <Upload label="Choose JPG/PNG images" accept="image/jpeg,image/png" multiple onChange={(e) => setFs(Array.from(e.target.files || []))} />
      <Button onClick={go}>Create PDF</Button>
      <p>{r}</p>
    </>
  );
}

function Passport() {
  const [f, setF] = useState(null);
  const [o, setO] = useState('');
  function go() {
    if (!f) return;
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = 600;
      c.height = 600;
      const x = c.getContext('2d');
      const s = Math.max(600 / im.width, 600 / im.height);
      const w = im.width * s;
      const h = im.height * s;
      x.drawImage(im, (600 - w) / 2, (600 - h) / 2, w, h);
      setO(c.toDataURL('image/jpeg', 0.92));
    };
    im.src = URL.createObjectURL(f);
  }
  return (
    <>
      <Upload label="Choose portrait" accept="image/*" onChange={(e) => setF(e.target.files?.[0])} />
      <Button onClick={go}>Make Photo</Button>
      {o && (
        <>
          <img src={o} alt="Passport photo" style={{ maxWidth: '280px', display: 'block', marginTop: 16 }} />
          <Download data={o} name="passport-photo.jpg" />
        </>
      )}
    </>
  );
}

function GPA() {
  const [rows, setRows] = useState([
    { c: 3, g: 4 },
    { c: 3, g: 3.5 }
  ]);
  const [r, setR] = useState('');
  return (
    <>
      <p>Enter credit and grade points.</p>
      {rows.map((x, i) => (
        <div className="row" key={i}>
          <Field
            label="Credits"
            type="number"
            value={x.c}
            onChange={(e) => {
              const a = [...rows];
              a[i].c = e.target.value;
              setRows(a);
            }}
          />
          <Field
            label="Grade points"
            type="number"
            step="0.01"
            value={x.g}
            onChange={(e) => {
              const a = [...rows];
              a[i].g = e.target.value;
              setRows(a);
            }}
          />
        </div>
      ))}
      <Button light onClick={() => setRows([...rows, { c: 3, g: 4 }])}>
        Add subject
      </Button>
      <Button
        onClick={() => {
          const c = rows.reduce((a, x) => a + Number(x.c), 0);
          const p = rows.reduce((a, x) => a + Number(x.c) * Number(x.g), 0);
          setR(c ? (p / c).toFixed(2) : '0');
        }}
      >
        Calculate GPA
      </Button>
      {r && <div className="result">GPA: {r}</div>}
    </>
  );
}

function EMI() {
  const [p, setP] = useState(500000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(5);
  const [r, setR] = useState('');
  function go() {
    const n = years * 12;
    const m = rate / 1200;
    const e = m ? (Number(p) * m * Math.pow(1 + m, n)) / (Math.pow(1 + m, n) - 1) : Number(p) / n;
    setR(`Monthly EMI: ${e.toFixed(2)} | Total interest: ${(e * n - p).toFixed(2)}`);
  }
  return (
    <>
      <Field label="Loan amount" type="number" value={p} onChange={(e) => setP(e.target.value)} />
      <Field label="Annual interest %" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
      <Field label="Years" type="number" value={years} onChange={(e) => setYears(e.target.value)} />
      <Button onClick={go}>Calculate EMI</Button>
      {r && <div className="result">{r}</div>}
    </>
  );
}

function Salary() {
  const [g, setG] = useState(50000);
  const [ded, setD] = useState(10);
  const [r, setR] = useState('');
  return (
    <>
      <Field label="Gross salary" type="number" value={g} onChange={(e) => setG(e.target.value)} />
      <Field label="Deductions %" type="number" value={ded} onChange={(e) => setD(e.target.value)} />
      <Button
        onClick={() => {
          const n = Number(g) * (1 - Number(ded) / 100);
          setR(`Estimated net salary: ${n.toFixed(2)}`);
        }}
      >
        Calculate
      </Button>
      {r && <div className="result">{r}</div>}
      <small>Generic estimate; payroll rules vary by country and employer.</small>
    </>
  );
}

function TaxVAT() {
  const [a, setA] = useState(1000);
  const [v, setV] = useState(15);
  const [r, setR] = useState('');
  return (
    <>
      <Field label="Amount" type="number" value={a} onChange={(e) => setA(e.target.value)} />
      <Field label="VAT %" type="number" value={v} onChange={(e) => setV(e.target.value)} />
      <Button
        onClick={() => {
          const tax = Number(a) * Number(v) / 100;
          setR(`VAT: ${tax.toFixed(2)} | Total: ${(Number(a) + tax).toFixed(2)}`);
        }}
      >
        Calculate VAT
      </Button>
      {r && <div className="result">{r}</div>}
      <small>VAT calculator only; income-tax liability requires jurisdiction-specific rules.</small>
    </>
  );
}

function Invoice() {
  const [c, setC] = useState('Customer');
  const [items, setItems] = useState([{ n: 'Service', q: 1, p: 100 }]);
  const total = items.reduce((a, x) => a + Number(x.q) * Number(x.p), 0);
  return (
    <>
      <Field label="Customer" value={c} onChange={(e) => setC(e.target.value)} />
      {items.map((x, i) => (
        <div className="row" key={i}>
          <Field
            label="Item"
            value={x.n}
            onChange={(e) => {
              const a = [...items];
              a[i].n = e.target.value;
              setItems(a);
            }}
          />
          <Field
            label="Qty"
            type="number"
            value={x.q}
            onChange={(e) => {
              const a = [...items];
              a[i].q = e.target.value;
              setItems(a);
            }}
          />
          <Field
            label="Price"
            type="number"
            value={x.p}
            onChange={(e) => {
              const a = [...items];
              a[i].p = e.target.value;
              setItems(a);
            }}
          />
        </div>
      ))}
      <Button light onClick={() => setItems([...items, { n: 'Service', q: 1, p: 0 }])}>
        Add item
      </Button>
      <div className="result">Total: {total.toFixed(2)}</div>
      <Button onClick={() => window.print()}>Print / Save PDF</Button>
    </>
  );
}

function Cover() {
  const [n, setN] = useState('Your Name');
  const [j, setJ] = useState('Job Title');
  const [co, setCo] = useState('Company');
  const [r, setR] = useState('');
  return (
    <>
      <Field label="Your name" value={n} onChange={(e) => setN(e.target.value)} />
      <Field label="Job title" value={j} onChange={(e) => setJ(e.target.value)} />
      <Field label="Company" value={co} onChange={(e) => setCo(e.target.value)} />
      <Button
        onClick={() =>
          setR(
            `Dear Hiring Manager,\n\nI am ${n}, and I am excited to apply for the ${j} position at ${co}. My skills, reliability and willingness to learn would allow me to contribute positively to your team.\n\nI would welcome the opportunity to discuss my application. Thank you for your consideration.\n\nSincerely,\n${n}`
          )
        }
      >
        Build Cover Letter
      </Button>
      {r && <textarea rows="12" value={r} readOnly />}
      <Button light onClick={() => r && navigator.clipboard?.writeText(r)}>
        Copy
      </Button>
    </>
  );
}

function QRScan() {
  const [v, setV] = useState('');
  const ref = useRef(null);
  const stream = useRef(null);
  async function start() {
    try {
      if (!('BarcodeDetector' in window)) return setV('This browser does not support BarcodeDetector. Use a QR scanner app/browser that supports it.');
      const d = new BarcodeDetector({ formats: ['qr_code'] });
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      const video = ref.current;
      video.srcObject = stream.current;
      await video.play();
      const scan = async () => {
        try {
          const a = await d.detect(video);
          if (a[0]) {
            setV(a[0].rawValue);
            stream.current?.getTracks().forEach((t) => t.stop());
            return;
          }
        } catch {}
        requestAnimationFrame(scan);
      };
      scan();
    } catch {
      setV('Camera permission was denied or unavailable.');
    }
  }
  return (
    <>
      <video ref={ref} playsInline muted style={{ width: '100%', maxWidth: 420, borderRadius: 12 }} />
      <Button onClick={start}>Start Camera Scan</Button>
      {v && <div className="result">{v}</div>}
    </>
  );
}

function QRGenerator() {
  const [text, setText] = useState('https://example.com');
  const [url, setUrl] = useState('');
  async function go() {
    try {
      const dataUrl = await QRCode.toDataURL(text, { width: 400, margin: 2 });
      setUrl(dataUrl);
    } catch {
      setUrl('');
    }
  }
  return (
    <>
      <Field label="Text or URL" value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={go}>Generate QR Code</Button>
      {url && (
        <>
          <img src={url} alt="QR code" style={{ width: 260, height: 260, marginTop: 16, borderRadius: 12 }} />
          <Download data={url} name="qr-code.png" />
        </>
      )}
    </>
  );
}

function Shortener() {
  const [u, setU] = useState('https://example.com');
  const [r, setR] = useState('');
  const [busy, setB] = useState(false);
  return (
    <>
      <Field label="Long URL" type="url" value={u} onChange={(e) => setU(e.target.value)} />
      <Button
        onClick={async () => {
          setB(true);
          try {
            const x = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(u)}`);
            setR(await x.text());
          } catch {
            setR('Shortening service unavailable.');
          } finally {
            setB(false);
          }
        }}
      >
        {busy ? 'Shortening…' : 'Shorten URL'}
      </Button>
      {r && <div className="result">{r}</div>}
    </>
  );
}

function JSONTool() {
  const [t, setT] = useState('{"name":"QuickToolBox","ok":true}');
  const [r, setR] = useState('');
  return (
    <>
      <textarea rows="14" value={t} onChange={(e) => setT(e.target.value)} />
      <div className="row">
        <Button
          onClick={() => {
            try {
              setR(JSON.stringify(JSON.parse(t), null, 2));
            } catch (e) {
              setR('Invalid JSON: ' + e.message);
            }
          }}
        >
          Format / Validate
        </Button>
        <Button
          light
          onClick={() => {
            try {
              setR(JSON.stringify(JSON.parse(t)));
            } catch (e) {
              setR('Invalid JSON: ' + e.message);
            }
          }}
        >
          Minify
        </Button>
      </div>
      {r && <textarea rows="14" value={r} readOnly />}
    </>
  );
}

function Favicon() {
  const [f, setF] = useState(null);
  const [o, setO] = useState('');
  function go() {
    if (!f) return;
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      c.getContext('2d').drawImage(im, 0, 0, 256, 256);
      setO(c.toDataURL('image/png'));
    };
    im.src = URL.createObjectURL(f);
  }
  return (
    <>
      <Upload label="Choose image" accept="image/*" onChange={(e) => setF(e.target.files?.[0])} />
      <Button onClick={go}>Generate Favicon</Button>
      {o && (
        <>
          <img src={o} alt="Favicon preview" style={{ width: 128, height: 128 }} />
          <Download data={o} name="favicon.png" />
        </>
      )}
    </>
  );
}

function Meta() {
  const [t, setT] = useState('QuickToolBox');
  const [d, setD] = useState('Free useful online tools');
  const [u, setU] = useState('https://example.com');
  const [r, setR] = useState('');
  return (
    <>
      <Field label="Title" value={t} onChange={(e) => setT(e.target.value)} />
      <Field label="Description" value={d} onChange={(e) => setD(e.target.value)} />
      <Field label="Canonical URL" value={u} onChange={(e) => setU(e.target.value)} />
      <Button
        onClick={() =>
          setR(
            `<title>${t}</title>\n<meta name="description" content="${d.replaceAll('"', '&quot;')}">\n<link rel="canonical" href="${u}">\n<meta property="og:title" content="${t}">\n<meta property="og:description" content="${d.replaceAll('"', '&quot;')}">\n<meta property="og:url" content="${u}">`
          )
        }
      >
        Generate Tags
      </Button>
      {r && <textarea rows="10" value={r} readOnly />}
    </>
  );
}

function Sitemap() {
  const [u, setU] = useState('https://example.com/\nhttps://example.com/about');
  const [r, setR] = useState('');
  return (
    <>
      <textarea rows="10" value={u} onChange={(e) => setU(e.target.value)} />
      <Button
        onClick={() =>
          setR(
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${u
              .split(/\n+/)
              .filter(Boolean)
              .map((x) => `  <url><loc>${x.trim()}</loc></url>`)
              .join('\n')}\n</urlset>`
          )
        }
      >
        Generate Sitemap
      </Button>
      {r && (
        <>
          <textarea rows="12" value={r} readOnly />
          <Download data={r} name="sitemap.xml" type="application/xml" />
        </>
      )}
    </>
  );
}

function Strength() {
  const [p, setP] = useState('');
  const [r, setR] = useState('');
  function go() {
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    setR(['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][s]);
  }
  return (
    <>
      <Field label="Password" type="password" value={p} onChange={(e) => setP(e.target.value)} />
      <Button onClick={go}>Check Strength</Button>
      {r && <div className="result">Strength: {r}</div>}
    </>
  );
}

function PasswordGen() {
  const [len, setLen] = useState(16);
  const [upper, setUpper] = useState(true);
  const [nums, setNums] = useState(true);
  const [syms, setSyms] = useState(true);
  const [out, setOut] = useState('');
  function gen() {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const up = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const num = '0123456789';
    const sym = '!@#$%^&*_-+=';
    let chars = lower;
    if (upper) chars += up;
    if (nums) chars += num;
    if (syms) chars += sym;
    let s = '';
    for (let i = 0; i < Number(len); i++) s += chars[Math.floor(Math.random() * chars.length)];
    setOut(s);
  }
  return (
    <>
      <Field label="Length" type="number" value={len} onChange={(e) => setLen(e.target.value)} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Uppercase
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="checkbox" checked={nums} onChange={(e) => setNums(e.target.checked)} /> Numbers
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="checkbox" checked={syms} onChange={(e) => setSyms(e.target.checked)} /> Symbols
      </label>
      <Button onClick={gen}>Generate Password</Button>
      {out && (
        <>
          <div className="result" style={{ wordBreak: 'break-all' }}>
            {out}
          </div>
          <Button light onClick={() => navigator.clipboard?.writeText(out)}>
            Copy
          </Button>
        </>
      )}
    </>
  );
}

function WordCounter() {
  const [t, setT] = useState('Hello QuickToolBox! This is a sample text to count words.');
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  const chars = t.length;
  const charsNoSpace = t.replace(/\s/g, '').length;
  const lines = t.split('\n').length;
  const reading = Math.ceil(words / 200);
  return (
    <>
      <textarea rows="10" value={t} onChange={(e) => setT(e.target.value)} placeholder="Type or paste text…" />
      <div className="result">
        Words: {words} | Characters: {chars} | Without spaces: {charsNoSpace} | Lines: {lines} | Reading: {reading} min
      </div>
    </>
  );
}

function AgeCalc() {
  const [dob, setDob] = useState('2000-01-01');
  const [r, setR] = useState('');
  function go() {
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    setR(`${years} years, ${months} months, ${days} days`);
  }
  return (
    <>
      <Field label="Birth date" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
      <Button onClick={go}>Calculate Age</Button>
      {r && <div className="result">{r}</div>}
    </>
  );
}

function DateCalc() {
  const [a, setA] = useState('2024-01-01');
  const [b, setB] = useState('2024-12-31');
  const [r, setR] = useState('');
  function go() {
    const d1 = new Date(a);
    const d2 = new Date(b);
    const diff = Math.abs(d2 - d1);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    setR(`${days} days | ${Math.floor(days / 7)} weeks | ${(days / 365).toFixed(2)} years`);
  }
  return (
    <>
      <Field label="Start date" type="date" value={a} onChange={(e) => setA(e.target.value)} />
      <Field label="End date" type="date" value={b} onChange={(e) => setB(e.target.value)} />
      <Button onClick={go}>Calculate Difference</Button>
      {r && <div className="result">{r}</div>}
    </>
  );
}

function UnitConverter() {
  const [type, setType] = useState('length');
  const [val, setVal] = useState(1);
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('km');
  const [r, setR] = useState('');
  const units = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254, mi: 1609.34 },
    weight: { kg: 1, g: 0.001, lb: 0.453592, oz: 0.0283495 },
    temperature: {}
  };
  function go() {
    if (type === 'temperature') {
      let c;
      if (from === 'C') c = Number(val);
      else if (from === 'F') c = (Number(val) - 32) * 5 / 9;
      else c = Number(val) - 273.15;
      let out;
      if (to === 'C') out = c;
      else if (to === 'F') out = c * 9 / 5 + 32;
      else out = c + 273.15;
      setR(`${val} ${from} = ${out.toFixed(2)} ${to}`);
      return;
    }
    const table = units[type];
    const base = Number(val) * (table[from] || 1);
    const converted = base / (table[to] || 1);
    setR(`${val} ${from} = ${converted.toFixed(4)} ${to}`);
  }
  return (
    <>
      <label className="field">
        <span>Type</span>
        <select value={type} onChange={(e) => { setType(e.target.value); setR(''); }}>
          <option value="length">Length</option>
          <option value="weight">Weight</option>
          <option value="temperature">Temperature</option>
        </select>
      </label>
      <div className="row">
        <Field label="Value" type="number" value={val} onChange={(e) => setVal(e.target.value)} />
        <label className="field">
          <span>From</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {type === 'length' && ['m', 'km', 'cm', 'mm', 'ft', 'in', 'mi'].map((u) => <option key={u} value={u}>{u}</option>)}
            {type === 'weight' && ['kg', 'g', 'lb', 'oz'].map((u) => <option key={u} value={u}>{u}</option>)}
            {type === 'temperature' && ['C', 'F', 'K'].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label className="field">
          <span>To</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {type === 'length' && ['m', 'km', 'cm', 'mm', 'ft', 'in', 'mi'].map((u) => <option key={u} value={u}>{u}</option>)}
            {type === 'weight' && ['kg', 'g', 'lb', 'oz'].map((u) => <option key={u} value={u}>{u}</option>)}
            {type === 'temperature' && ['C', 'F', 'K'].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>
      <Button onClick={go}>Convert</Button>
      {r && <div className="result">{r}</div>}
    </>
  );
}

function PercentCalc() {
  const [a, setA] = useState(20);
  const [b, setB] = useState(150);
  const [r, setR] = useState('');
  return (
    <>
      <Field label="Percent %" type="number" value={a} onChange={(e) => setA(e.target.value)} />
      <Field label="Of value" type="number" value={b} onChange={(e) => setB(e.target.value)} />
      <Button onClick={() => setR(`${a}% of ${b} = ${(Number(a) * Number(b) / 100).toFixed(2)}`)}>Calculate</Button>
      <Button light onClick={() => setR(`Change from ${a} to ${b}: ${(((Number(b) - Number(a)) / Number(a)) * 100).toFixed(2)}%`)}>Percent Change</Button>
      {r && <div className="result">{r}</div>}
    </>
  );
}

function ImageCompressor() {
  const [f, setF] = useState(null);
  const [quality, setQuality] = useState(0.7);
  const [o, setO] = useState('');
  const [info, setInfo] = useState('');
  function go() {
    if (!f) return;
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = im.width;
      c.height = im.height;
      c.getContext('2d').drawImage(im, 0, 0);
      const dataUrl = c.toDataURL('image/jpeg', Number(quality));
      setO(dataUrl);
      setInfo(`Original: ${(f.size / 1024).toFixed(1)} KB → Compressed: ~${Math.round((dataUrl.length * 0.75) / 1024)} KB`);
    };
    im.src = URL.createObjectURL(f);
  }
  return (
    <>
      <Upload label="Choose image" accept="image/*" onChange={(e) => setF(e.target.files?.[0])} />
      <Field label="Quality (0.1 - 1.0)" type="number" step="0.1" min="0.1" max="1" value={quality} onChange={(e) => setQuality(e.target.value)} />
      <Button onClick={go}>Compress Image</Button>
      {info && <p>{info}</p>}
      {o && (
        <>
          <img src={o} alt="Compressed" style={{ maxWidth: '100%', marginTop: 12, borderRadius: 12 }} />
          <Download data={o} name="compressed.jpg" />
        </>
      )}
    </>
  );
}

function CurrencyConverter() {
  const [amount, setAmount] = useState(1);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('BDT');
  const [r, setR] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const data = await res.json();
      const rate = data.rates?.[to];
      if (rate) setR(`${amount} ${from} = ${(Number(amount) * rate).toFixed(2)} ${to}`);
      else setR('Rate not available, using estimate.');
    } catch {
      const fallback = { USD: 1, BDT: 117, EUR: 0.92, GBP: 0.79, INR: 83 };
      const rate = (fallback[to] || 1) / (fallback[from] || 1);
      setR(`${amount} ${from} ≈ ${(Number(amount) * rate).toFixed(2)} ${to} (estimated)`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Field label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <div className="row">
        <Field label="From" value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} />
        <Field label="To" value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} />
      </div>
      <Button onClick={go}>{busy ? 'Converting…' : 'Convert'}</Button>
      {r && <div className="result">{r}</div>}
      <small>Uses public exchange API when available, fallback estimate otherwise.</small>
    </>
  );
}

function Clock() {
  const zones = ['Asia/Dhaka', 'Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney'];
  const [t, setT] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="grid">
      {zones.map((z) => (
        <div className="card" key={z}>
          <h3>{z}</h3>
          <p>{new Intl.DateTimeFormat('en-US', { timeZone: z, dateStyle: 'medium', timeStyle: 'medium' }).format(t)}</p>
        </div>
      ))}
    </div>
  );
}

function Tool({ slug }) {
  const map = {
    'pdf-merge': <PDFMerge />,
    'pdf-split': <PDFSplit />,
    'pdf-compressor': <PDFCompress />,
    'image-to-pdf': <ImagePDF />,
    'passport-photo-maker': <Passport />,
    'gpa-calculator': <GPA />,
    'emi-calculator': <EMI />,
    'salary-calculator': <Salary />,
    'tax-vat-calculator': <TaxVAT />,
    'invoice-generator': <Invoice />,
    'cover-letter-builder': <Cover />,
    'qr-scanner': <QRScan />,
    'qr-generator': <QRGenerator />,
    'url-shortener': <Shortener />,
    'json-formatter': <JSONTool />,
    'favicon-generator': <Favicon />,
    'meta-tag-generator': <Meta />,
    'sitemap-generator': <Sitemap />,
    'password-strength-checker': <Strength />,
    'password-generator': <PasswordGen />,
    'word-counter': <WordCounter />,
    'age-calculator': <AgeCalc />,
    'date-calculator': <DateCalc />,
    'unit-converter': <UnitConverter />,
    'percentage-calculator': <PercentCalc />,
    'image-compressor': <ImageCompressor />,
    'currency-converter': <CurrencyConverter />,
    'world-clock': <Clock />
  };
  return map[slug] || <p>Tool not found.</p>;
}

export default function ToolClient({ slug }) {
  const m = META[slug] || ['Tool not found', ''];
  return (
    <>
      <header>
        <Link className="brand" href="/">
          <b>Q</b> QuickToolBox
        </Link>
        <Link href="/">← All tools</Link>
      </header>
      <main className="tool">
        <small>FREE ONLINE TOOL</small>
        <h1>{m[0]}</h1>
        <p>{m[1]}</p>
        <div className="box">
          <Tool slug={slug} />
        </div>
      </main>
      <footer>© 2026 QuickToolBox</footer>
    </>
  );
}
