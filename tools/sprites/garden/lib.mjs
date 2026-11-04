// Tiny raster kit for the garden painters (ideas borrowed from Age Up's sprite-lab painter-nature / painter-villager).
// A grid is an array of rows of palette chars, '.' = transparent. Light comes from the upper-left.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export const grid = (w, h, c = '.') => Array.from({ length: h }, () => Array(w).fill(c));
export const W_ = g => g[0].length, H_ = g => g.length;
export const get = (g, x, y) => (y < 0 || y >= g.length || x < 0 || x >= g[0].length) ? '.' : g[y][x];
export function put(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (c && c !== '.' && y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
export function erase(g, x, y) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = '.'; }
export const clone = g => g.map(r => r.slice());
export const text = g => '\n' + g.map(r => r.join('')).join('\n') + '\n';
export const parse = s => s.replace(/^\n+|\n+$/g, '').split('\n').map(r => [...r]);

// unit light vector (x right, y down, z toward viewer): upper-left, a bit in front
const LN = (() => { const v = [-0.55, -0.7, 0.5]; const n = Math.hypot(...v); return v.map(a => a / n); })();
export const light = (nx, ny, nz) => { const n = Math.hypot(nx, ny, nz) || 1; return (nx * LN[0] + ny * LN[1] + nz * LN[2]) / n; };

/** shaded ellipsoid. tones = [light, mid, shade, deep?]; thr = thresholds on the light dot; o.only(x,y) mask; o.cb(x,y,d,u,v) custom */
export function ell(g, cx, cy, rx, ry, tones, o = {}) {
  const thr = o.thr || [0.62, 0.25, -0.15], flat = o.flat || 1;
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, r2 = u * u + v * v;
    if (r2 > 1) continue;
    if (o.only && !o.only(x, y)) continue;
    const d = light(u, v, Math.sqrt(1 - r2) * flat);
    if (o.cb) { const c = o.cb(x, y, d, u, v); if (c) put(g, x, y, c); continue; }
    const t = d > thr[0] ? 0 : d > thr[1] ? 1 : d > thr[2] ? 2 : 3;
    put(g, x, y, tones[Math.min(t, tones.length - 1)]);
  }
}
export function rect(g, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, typeof c === 'function' ? c(x + i, y + j, i, j) : c); }
export function line(g, x0, y0, x1, y1, ch) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const pts = [];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (; ;) { pts.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  if (g && ch) pts.forEach(([x, y], i) => put(g, x, y, typeof ch === 'function' ? ch(x, y, i, pts.length) : ch));
  return pts;
}
/** stamp ascii art; '.'/' ' skipped. If the art has a '+' it is the origin placed at (x,y) and painted as `plus` (or skipped). */
export function stamp(g, x, y, art, plus = null, map = null) {
  const rows = typeof art === 'string' ? parse(art) : art;
  let ox = 0, oy = 0;
  rows.forEach((r, j) => { const i = r.indexOf('+'); if (i >= 0) { ox = i; oy = j; } });
  rows.forEach((r, j) => r.forEach((c, i) => {
    if (c === '.' || c === ' ') return;
    if (c === '+') { if (plus) put(g, x + i - ox, y + j - oy, plus); return; }
    if (c === '_') { erase(g, x + i - ox, y + j - oy); return; }
    put(g, x + i - ox, y + j - oy, map && map[c] ? map[c] : c);
  }));
}
export function overlay(dst, src, dx = 0, dy = 0) { for (let y = 0; y < src.length; y++) for (let x = 0; x < src[0].length; x++) if (src[y][x] !== '.') put(dst, x + dx, y + dy, src[y][x]); }
export function shift(g, dx, dy) { const n = grid(g[0].length, g.length); overlay(n, g, dx, dy); return n; }
export function flipX(g) { return g.map(r => r.slice().reverse()); }
/** outline every empty cell 4-adjacent to a filled one. ink(nbChars, x, y) → char or null. skip: chars that don't get outlined */
export function outline(g, ink, skip = '') {
  const out = clone(g);
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    if (g[y][x] !== '.') continue;
    const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => get(g, x + dx, y + dy)).map(c => skip.includes(c) ? '.' : c);
    if (nb.every(c => c === '.')) continue;
    const c = typeof ink === 'function' ? ink(nb, x, y) : ink;
    if (c) out[y][x] = c;
  }
  return out;
}
/** remove isolated single pixels of chars in `which` (replace by the majority neighbour) */
export function despeckle(g, which) {
  const out = clone(g);
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    const c = g[y][x]; if (!which.includes(c)) continue;
    const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => get(g, x + dx, y + dy));
    if (nb.includes(c)) continue;
    const cnt = {}; nb.forEach(n => { if (n !== '.') cnt[n] = (cnt[n] || 0) + 1; });
    const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    if (best) out[y][x] = best[0];
  }
  return out;
}
/** replace chars in a grid by a map */
export function recolor(g, map) { return g.map(r => r.map(c => map[c] ?? c)); }
/** deterministic hash noise in [0,1) */
export function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return ((h >>> 0) % 100000) / 100000; }

/** write sprites/<id>.js */
export function emit(id, spec, note = '') {
  const fr = Object.entries(spec.frames).map(([k, L]) => `    ${k}: [${L.map(t => '`' + (typeof t === 'string' ? t : text(t)) + '`').join(', ')}],`).join('\n');
  const pal = Object.entries(spec.palette).map(([k, v]) => `    ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: '${v}',`).join('\n');
  const extra = Object.entries(spec).filter(([k]) => !['id', 'anchor', 'palette', 'frames'].includes(k)).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},\n`).join('');
  const src = `// @pixel ${id} · generated by tools/sprites/garden.mjs${note ? ' · ' + note : ''} (do not hand-edit; change the generator and re-run)\nexport default {\n  id: '${id}', anchor: ${JSON.stringify(spec.anchor)},\n${extra}  palette: {\n${pal}\n  },\n  frames: {\n${fr}\n  },\n};\n`;
  fs.writeFileSync(path.resolve('sprites', id + '.js'), src);
  // sanity: every char used is in the palette
  for (const [set, L] of Object.entries(spec.frames)) L.forEach((t, i) => { for (const c of (typeof t === 'string' ? t : text(t))) if (c !== '.' && c !== '\n' && !(c in spec.palette)) throw new Error(`${id}.${set}[${i}]: char '${c}' not in palette`); });
  return spec;
}

// ---------- preview PNGs (no browser needed) ----------
const TEAM = { team: '#3f86e0', teamdark: '#27489a', teamlight: '#8ac4ff' };
function crc32(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
export function png(file, w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
/** a canvas-ish: { w, h, buf, fill(x,y,w,h,rgb), blit(grid, palette, x, y, z, team) } */
export function canvas(w, h, bg = '#5a4a8a') {
  const buf = Buffer.alloc(w * h * 4), cv = { w, h, buf };
  cv.fill = (x, y, ww, hh, col) => { const [r, g, b] = hex(col); for (let j = Math.max(0, y); j < Math.min(h, y + hh); j++) for (let i = Math.max(0, x); i < Math.min(w, x + ww); i++) { const k = (j * w + i) * 4; buf[k] = r; buf[k + 1] = g; buf[k + 2] = b; buf[k + 3] = 255; } };
  cv.blit = (gr, pal, x, y, z = 1, team = TEAM) => {
    const rows = typeof gr === 'string' ? parse(gr) : gr;
    rows.forEach((r, j) => r.forEach((c, i) => { if (c === '.' || c === ' ') return; let col = pal[c]; if (!col) col = '#ff00ff'; if (team[col]) col = team[col]; cv.fill(x + i * z, y + j * z, z, z, col); }));
  };
  cv.save = f => png(f, w, h, buf);
  cv.fill(0, 0, w, h, bg);
  return cv;
}
