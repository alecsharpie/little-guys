// Fast preview of painted sprites without a browser: every frame of every set at ×Z on a lawn-green and a checker
// background, plus a ×3 lawn strip (game scale). node tools/sprites/pests/preview.mjs out.png [zoom] id id …
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { ROOT } from './kit.mjs';

const [out, zs, ...ids] = process.argv.slice(2);
const Z = +zs || 6;
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const specs = [];
for (const id of ids) specs.push((await import(pathToFileURL(path.join(ROOT, 'sprites', id + '.js')).href + '?' + Date.now())).default);
const rows = s => Object.entries(s.frames).map(([k, L]) => [k, L.map(t => t.replace(/^\n|\n$/g, '').split('\n'))]);
// layout: per sprite one block: left = big frames on lawn; right = same at ×3
let Wd = 0, Ht = 8; const blocks = [];
for (const s of specs) {
  let bh = 0, bw = 0; const sets = rows(s);
  let y = 0;
  for (const [, fr] of sets) { const w = fr[0][0].length, h = fr.length && fr[0].length; bw = Math.max(bw, fr.length * (w + 2) * Z + 20 + fr.length * (w + 4) * 3 * 1 + 40); y += h * Z + 8; }
  blocks.push({ s, sets, y0: Ht, h: y }); Ht += y + 12; Wd = Math.max(Wd, bw);
}
Wd += 16;
const img = Buffer.alloc(Wd * Ht * 3);
const px = (x, y, [r, g, b]) => { if (x < 0 || y < 0 || x >= Wd || y >= Ht) return; const i = (y * Wd + x) * 3; img[i] = r; img[i + 1] = g; img[i + 2] = b; };
const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
rect(0, 0, Wd, Ht, [40, 44, 52]);
const G = [108, 191, 85], G2 = [96, 176, 76];
for (const b of blocks) {
  let y = b.y0;
  for (const [, fr] of b.sets) {
    const w = fr[0][0].length, h = fr[0].length; let x = 8;
    const draw = (f, X, Y, z) => f.forEach((r, j) => [...r].forEach((c, i) => { if (c === '.') return; let col = b.s.palette[c]; if (!col || col[0] !== '#') col = '#c8c8c8'; rect(X + i * z, Y + j * z, z, z, hex(col)); }));
    for (const f of fr) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) rect(x + i * Z, y + j * Z, Z, Z, (i + j) % 2 ? G : G2); draw(f, x, y, Z); x += (w + 2) * Z; }
    x += 20;
    rect(x - 4, y, fr.length * (w + 4) * 3 + 8, h * 3 + 8, G);
    for (const f of fr) { draw(f, x, y + 4, 3); x += (w + 4) * 3; }
    y += h * Z + 8;
  }
}
// png
const raw = Buffer.alloc((Wd * 3 + 1) * Ht);
for (let y = 0; y < Ht; y++) { raw[y * (Wd * 3 + 1)] = 0; img.copy(raw, y * (Wd * 3 + 1) + 1, y * Wd * 3, (y + 1) * Wd * 3); }
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(Wd, 0); ihdr.writeUInt32BE(Ht, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(out, Wd + 'x' + Ht);
