import test from 'node:test';
import assert from 'node:assert/strict';
import { ttfToWoffBytes, pad4 } from '../lib/woff.js';

const textEncoder = new TextEncoder();

/** Build a minimal sfnt (TTF) container with the given tables. */
function buildSfnt(tables) {
  const numTables = tables.length;
  let cursor = 12 + numTables * 16;
  const records = tables.map(({ tag, data }) => {
    const offset = cursor;
    cursor += data.length;
    cursor = pad4(cursor);
    return { tag, offset, data };
  });

  const out = new Uint8Array(cursor);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x00010000, false);
  view.setUint16(4, numTables, false);

  records.forEach((record, index) => {
    const position = 12 + index * 16;
    out.set(textEncoder.encode(record.tag), position);
    view.setUint32(position + 4, 0, false);
    view.setUint32(position + 8, record.offset, false);
    view.setUint32(position + 12, record.data.length, false);
    out.set(record.data, record.offset);
  });

  return out;
}

async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const compressible = new Uint8Array(600).fill(9);
const incompressible = new Uint8Array([1, 2, 3, 4]);

test('ttfToWoffBytes writes a WOFF 1.0 header', async () => {
  const sfnt = buildSfnt([
    { tag: 'glyf', data: compressible },
    { tag: 'cmap', data: incompressible },
  ]);
  const woff = await ttfToWoffBytes(sfnt);
  const view = new DataView(woff.buffer, woff.byteOffset, woff.byteLength);

  assert.equal(String.fromCharCode(...woff.subarray(0, 4)), 'wOFF');
  assert.equal(view.getUint32(4, false), 0x00010000, 'flavor comes from the sfnt header');
  assert.equal(view.getUint32(8, false), woff.length, 'declared length matches output');
  assert.equal(view.getUint16(12, false), 2, 'table count is preserved');
  assert.equal(view.getUint16(14, false), 0, 'reserved field is zero');
  assert.equal(
    view.getUint32(16, false),
    12 + 2 * 16 + pad4(compressible.length) + pad4(incompressible.length),
    'totalSfntSize describes the original font',
  );
  assert.equal(view.getUint32(24, false), 0, 'no metadata block');
  assert.equal(view.getUint32(36, false), 0, 'no private data block');
});

test('ttfToWoffBytes sorts the directory and stores each table correctly', async () => {
  const sfnt = buildSfnt([
    { tag: 'glyf', data: compressible },
    { tag: 'cmap', data: incompressible },
  ]);
  const woff = await ttfToWoffBytes(sfnt);
  const view = new DataView(woff.buffer, woff.byteOffset, woff.byteLength);

  const entries = [0, 1].map((index) => {
    const position = 44 + index * 20;
    return {
      tag: String.fromCharCode(...woff.subarray(position, position + 4)),
      offset: view.getUint32(position + 4, false),
      compLength: view.getUint32(position + 8, false),
      origLength: view.getUint32(position + 12, false),
    };
  });

  assert.deepEqual(entries.map((entry) => entry.tag), ['cmap', 'glyf']);

  for (const entry of entries) {
    const payload = woff.subarray(entry.offset, entry.offset + entry.compLength);
    const original = entry.tag === 'cmap' ? incompressible : compressible;
    assert.equal(entry.origLength, original.length);

    if (entry.compLength < entry.origLength) {
      const restored = await inflate(payload);
      assert.deepEqual(restored, original, `${entry.tag} inflates to the original bytes`);
    } else {
      assert.deepEqual(payload, original, `${entry.tag} is stored raw when deflate does not help`);
    }
  }
});

test('ttfToWoffBytes rejects data that is not an sfnt font', async () => {
  await assert.rejects(() => ttfToWoffBytes(new Uint8Array([0, 1, 2])), /too small/);

  const notAFont = new Uint8Array(64);
  await assert.rejects(() => ttfToWoffBytes(notAFont), /not a valid TrueType or OpenType font/);

  const truncatedDirectory = buildSfnt([{ tag: 'cmap', data: incompressible }]);
  truncatedDirectory[5] = 5; // claim five tables when only one exists
  await assert.rejects(() => ttfToWoffBytes(truncatedDirectory), /damaged table directory|not a valid/);
});
