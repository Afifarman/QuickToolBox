/**
 * Minimal WOFF 1.0 writer for TrueType/OpenType fonts.
 *
 * WOFF is not "a deflated sfnt". It needs its own header, a directory sorted by
 * table tag, and one compressed stream per table. Deflating the whole font file
 * produces something no browser will load, so this module follows the format:
 *
 *   header (44 bytes) + directory (20 bytes per table) + table data
 *
 * Reference: https://www.w3.org/TR/WOFF/
 */

const WOFF_SIGNATURE = 0x774f4646; // "wOFF"

const pad4 = (value) => (value + 3) & ~3;

const tagValue = (tag) =>
  ((tag[0] << 24) | (tag[1] << 16) | (tag[2] << 8) | tag[3]) >>> 0;

async function deflate(bytes) {
  if (typeof CompressionStream !== 'function') {
    throw new Error('This environment cannot compress font tables.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Convert sfnt (TTF/OTF) bytes into WOFF 1.0 bytes.
 * @param {Uint8Array} bytes
 * @returns {Promise<Uint8Array>}
 */
export async function ttfToWoffBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error('Font data must be a byte array.');
  }
  if (bytes.length < 12) throw new Error('This font file is too small to be valid.');

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flavor = view.getUint32(0, false);
  const numTables = view.getUint16(4, false);

  if (!numTables || 12 + numTables * 16 > bytes.length) {
    throw new Error('This is not a valid TrueType or OpenType font.');
  }

  const tables = [];
  for (let index = 0; index < numTables; index += 1) {
    const record = 12 + index * 16;
    const tag = bytes.subarray(record, record + 4);
    const checksum = view.getUint32(record + 4, false);
    const offset = view.getUint32(record + 8, false);
    const length = view.getUint32(record + 12, false);
    if (offset + length > bytes.length) {
      throw new Error('This font has a damaged table directory.');
    }
    tables.push({ tag, checksum, data: bytes.subarray(offset, offset + length) });
  }

  // The WOFF directory must be sorted by table tag.
  tables.sort((a, b) => tagValue(a.tag) - tagValue(b.tag));

  let totalSfntSize = 12 + numTables * 16;
  const entries = [];
  for (const table of tables) {
    const compressed = await deflate(table.data);
    // Small tables get bigger when deflated; those are stored uncompressed.
    const payload = compressed.length < table.data.length ? compressed : table.data;
    entries.push({ ...table, payload, origLength: table.data.length });
    totalSfntSize += pad4(table.data.length);
  }

  const headerSize = 44 + numTables * 20;
  const dataSize = entries.reduce((total, entry) => total + pad4(entry.payload.length), 0);
  const out = new Uint8Array(headerSize + dataSize);
  const outView = new DataView(out.buffer);

  outView.setUint32(0, WOFF_SIGNATURE, false);
  outView.setUint32(4, flavor, false);
  outView.setUint32(8, out.length, false);
  outView.setUint16(12, numTables, false);
  outView.setUint16(14, 0, false); // reserved
  outView.setUint32(16, totalSfntSize, false);
  outView.setUint16(20, 1, false); // majorVersion
  outView.setUint16(22, 0, false); // minorVersion
  // No metadata or private data blocks.
  outView.setUint32(24, 0, false);
  outView.setUint32(28, 0, false);
  outView.setUint32(32, 0, false);
  outView.setUint32(36, 0, false);
  outView.setUint32(40, 0, false);

  let directory = 44;
  let cursor = headerSize;
  for (const entry of entries) {
    out.set(entry.tag, directory);
    outView.setUint32(directory + 4, cursor, false);
    outView.setUint32(directory + 8, entry.payload.length, false);
    outView.setUint32(directory + 12, entry.origLength, false);
    outView.setUint32(directory + 16, entry.checksum, false);
    out.set(entry.payload, cursor);
    directory += 20;
    cursor += pad4(entry.payload.length);
  }

  return out;
}

export { pad4 };
