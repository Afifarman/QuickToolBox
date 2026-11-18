'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const CATEGORIES = {
  Length: [
    { key: 'm', label: 'Meter (m)', toBase: (v) => v, fromBase: (v) => v },
    { key: 'km', label: 'Kilometer (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { key: 'cm', label: 'Centimeter (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { key: 'mm', label: 'Millimeter (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { key: 'mi', label: 'Mile (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    { key: 'yd', label: 'Yard (yd)', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    { key: 'ft', label: 'Foot (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { key: 'in', label: 'Inch (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  ],
  Weight: [
    { key: 'kg', label: 'Kilogram (kg)', toBase: (v) => v, fromBase: (v) => v },
    { key: 'g', label: 'Gram (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { key: 'mg', label: 'Milligram (mg)', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    { key: 'lb', label: 'Pound (lb)', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
    { key: 'oz', label: 'Ounce (oz)', toBase: (v) => v * 0.0283495231, fromBase: (v) => v / 0.0283495231 },
    { key: 't', label: 'Metric ton (t)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  ],
  Volume: [
    { key: 'l', label: 'Liter (L)', toBase: (v) => v, fromBase: (v) => v },
    { key: 'ml', label: 'Milliliter (mL)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { key: 'm3', label: 'Cubic meter (m³)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { key: 'gal', label: 'US gallon (gal)', toBase: (v) => v * 3.785411784, fromBase: (v) => v / 3.785411784 },
    { key: 'qt', label: 'US quart (qt)', toBase: (v) => v * 0.946352946, fromBase: (v) => v / 0.946352946 },
    { key: 'cup', label: 'US cup', toBase: (v) => v * 0.2365882365, fromBase: (v) => v / 0.2365882365 },
    { key: 'floz', label: 'US fluid ounce (fl oz)', toBase: (v) => v * 0.02957352956, fromBase: (v) => v / 0.02957352956 },
  ],
  Area: [
    { key: 'm2', label: 'Square meter (m²)', toBase: (v) => v, fromBase: (v) => v },
    { key: 'km2', label: 'Square kilometer (km²)', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    { key: 'cm2', label: 'Square centimeter (cm²)', toBase: (v) => v / 1e4, fromBase: (v) => v * 1e4 },
    { key: 'ft2', label: 'Square foot (ft²)', toBase: (v) => v * 0.09290304, fromBase: (v) => v / 0.09290304 },
    { key: 'acre', label: 'Acre', toBase: (v) => v * 4046.8564224, fromBase: (v) => v / 4046.8564224 },
    { key: 'ha', label: 'Hectare (ha)', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
  ],
  Speed: [
    { key: 'mps', label: 'Meter/second (m/s)', toBase: (v) => v, fromBase: (v) => v },
    { key: 'kmh', label: 'Kilometer/hour (km/h)', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    { key: 'mph', label: 'Mile/hour (mph)', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    { key: 'kn', label: 'Knot (kn)', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
  ],
  Time: [
    { key: 's', label: 'Second (s)', toBase: (v) => v, fromBase: (v) => v },
    { key: 'min', label: 'Minute (min)', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
    { key: 'h', label: 'Hour (h)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    { key: 'd', label: 'Day (d)', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
    { key: 'wk', label: 'Week (wk)', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    { key: 'mo', label: 'Month (30d)', toBase: (v) => v * 2592000, fromBase: (v) => v / 2592000 },
    { key: 'yr', label: 'Year (365d)', toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 },
  ],
};

export default function UnitConverter() {
  const [category, setCategory] = useState('Length');
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('ft');

  const units = CATEGORIES[category];
  const result = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    if (category === 'Temperature') return '';
    const fromU = units.find((u) => u.key === from);
    const toU = units.find((u) => u.key === to);
    if (!fromU || !toU) return '';
    const base = fromU.toBase(n);
    return toU.fromBase(base);
  }, [value, from, to, units, category]);

  const tempResult = useMemo(() => {
    if (category !== 'Temperature') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    // convert to celsius
    let c;
    if (from === 'c') c = n;
    else if (from === 'f') c = (n - 32) * 5 / 9;
    else if (from === 'k') c = n - 273.15;
    else return null;
    let out;
    if (to === 'c') out = c;
    else if (to === 'f') out = c * 9 / 5 + 32;
    else if (to === 'k') out = c + 273.15;
    else return null;
    return out;
  }, [value, from, to, category]);

  function onCategoryChange(next) {
    setCategory(next);
    if (next === 'Temperature') {
      setFrom('c');
      setTo('f');
      return;
    }
    setFrom(CATEGORIES[next][0].key);
    setTo(CATEGORIES[next][1]?.key || CATEGORIES[next][0].key);
  }

  const display = category === 'Temperature' ? tempResult : result;

  return (
    <>
      <header>
        <Link className="brand" href="/"><b>Q</b> QuickToolBox</Link>
        <nav><Link href="/">← All tools</Link></nav>
      </header>
      <main className="ai-page">
        <small>🔢 UNIT CONVERTER</small>
        <h1>Unit Converter</h1>
        <p>Convert length, weight, volume, area, speed, time and temperature.</p>
        <section className="result">
          <label><b>Category</b></label>
          <select value={category} onChange={(e) => onCategoryChange(e.target.value)} style={{ display: 'block', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #d0d5dd', width: '100%' }}>
            {Object.keys(CATEGORIES).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="Temperature">Temperature</option>
          </select>
        </section>
        {category === 'Temperature' && (
          <section className="result" style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label><b>From</b></label>
                <select value={from} onChange={(e) => setFrom(e.target.value)} style={{ display: 'block', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #d0d5dd', width: '100%' }}>
                  <option value="c">Celsius (°C)</option>
                  <option value="f">Fahrenheit (°F)</option>
                  <option value="k">Kelvin (K)</option>
                </select>
              </div>
              <div>
                <label><b>To</b></label>
                <select value={to} onChange={(e) => setTo(e.target.value)} style={{ display: 'block', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #d0d5dd', width: '100%' }}>
                  <option value="c">Celsius (°C)</option>
                  <option value="f">Fahrenheit (°F)</option>
                  <option value="k">Kelvin (K)</option>
                </select>
              </div>
            </div>
          </section>
        )}
        {category !== 'Temperature' && (
          <section className="result" style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label><b>From</b></label>
                <select value={from} onChange={(e) => setFrom(e.target.value)} style={{ display: 'block', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #d0d5dd', width: '100%' }}>
                  {units.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label><b>To</b></label>
                <select value={to} onChange={(e) => setTo(e.target.value)} style={{ display: 'block', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #d0d5dd', width: '100%' }}>
                  {units.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
                </select>
              </div>
            </div>
          </section>
        )}
        <section className="result" style={{ marginTop: 16 }}>
          <label><b>Value</b></label>
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} style={{ display: 'block', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #d0d5dd', width: '100%' }} />
          <div style={{ marginTop: 16, fontSize: 20, fontWeight: 700 }}>
            Result: {display === '' || display === null ? '—' : Number(display).toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </div>
        </section>
      </main>
      <footer>© 2026 QuickToolBox <span>Utility + AI/CV + Student tools.</span></footer>
    </>
  );
}
