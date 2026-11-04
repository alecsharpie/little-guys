// Minimal RGB canvas + PNG encoder for previews (no browser needed).
import fs from 'node:fs';
import zlib from 'node:zlib';
import { TEAMS } from '../../../sprites/pix.js';
export { TEAMS };
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const L = t => t.replace(/^\n|\n$/g, '').split('\n');
export class Canvas {
  constructor(w, h, bg = '#202020') { this.w = w; this.h = h; this.b = Buffer.alloc(w * h * 3); this.rect(0, 0, w, h, bg); }
  px(x, y, c) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 3; this.b[i] = c[0]; this.b[i + 1] = c[1]; this.b[i + 2] = c[2]; }
  rect(x, y, w, h, col) { const c = typeof col === 'string' ? hex(col) : col; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  col(spec, ch, team) { let v = spec.palette[ch]; if (!v) return null; if (v === 'team') v = team.c; else if (v === 'teamdark') v = team.d; else if (v === 'teamlight') v = team.l; return hex(v); }
  /** draw frame with top-left at (x,y), scale z */
  sprite(spec, set, i, x, y, z = 1, team = TEAMS[0]) {
    const g = L(spec.frames[set][i]);
    g.forEach((r, j) => [...r].forEach((ch, k) => { if (ch === '.') return; const c = this.col(spec, ch, team); if (c) for (let a = 0; a < z; a++) for (let b = 0; b < z; b++) this.px(x + k * z + b, y + j * z + a, c); }));
    return { w: g[0].length * z, h: g.length * z };
  }
  /** 9-slice: draw the frame stretched to w×h source px (edges + fill repeat), at scale z */
  nine(spec, set, x, y, w, h, s, z = 3, team = TEAMS[0]) {
    const g = L(spec.frames[set][0]), sw = g[0].length, sh = g.length, cw = sw - 2 * s, chh = sh - 2 * s;
    const map = (v, n, sn, c) => v < s ? v : v >= n - s ? sn - (n - v) : s + ((v - s) % c);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const ch = g[map(j, h, sh, chh)][map(i, w, sw, cw)]; if (ch === '.') continue;
      const c = this.col(spec, ch, team); if (c) this.rect(x + i * z, y + j * z, z, z, c);
    }
  }
  save(f) {
    const { w, h } = this, raw = Buffer.alloc((w * 3 + 1) * h);
    for (let y = 0; y < h; y++) this.b.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
    const T = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    const crc = b => { let c = 0xffffffff; for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
    const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
    fs.writeFileSync(f, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
  }
}
