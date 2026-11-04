// Tiny raster kit for the pest / friend / fx painters (adapted from Age Up's sprite-lab painter-nature quad.mjs):
// shaded ellipsoid volumes lit from the upper-left, a body mask, a selective outline from the mask, 1-px limbs,
// stamps, despeckle and the emitter that writes sprites/<id>.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const grid = (w, h, c = '.') => Array.from({ length: h }, () => Array(w).fill(c));
export const W = g => g[0].length, H = g => g.length;
export const get = (g, x, y) => (y >= 0 && y < g.length && x >= 0 && x < g[0].length) ? g[y][x] : '.';
export function put(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (c && c !== '.' && y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
export const clone = g => g.map(r => r.slice());
export const text = g => '\n' + g.map(r => r.join('')).join('\n') + '\n';
export const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function line(g, x0, y0, x1, y1, ch, onlyEmpty = false) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, i = 0;
  for (; ;) {
    const c = typeof ch === 'function' ? ch(x0, y0, i++) : ch;
    if (!onlyEmpty || get(g, x0, y0) === '.') put(g, x0, y0, c);
    if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
export function poly(g, pts, ch, onlyEmpty) { for (let i = 0; i < pts.length - 1; i++) line(g, ...pts[i], ...pts[i + 1], ch, onlyEmpty); }

/** stamp a multi-line string at (x,y); '.'/' ' transparent. opts.only: only onto empty cells; opts.map: char remap */
export function stamp(g, x, y, txt, o = {}) {
  const rows = txt.replace(/^\n+|\n+$/g, '').split('\n');
  rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { let c = r[xx]; if (c === '.' || c === ' ') continue; if (o.map && o.map[c]) c = o.map[c]; if (o.only && get(g, x + xx, y + yy) !== '.') continue; put(g, x + xx, y + yy, c); } });
}

const LN = (() => { const v = [-0.52, -0.66, 0.54]; const n = Math.hypot(...v); return v.map(a => a / n); })();

/**
 * Paint shaded ellipsoid forms into a fresh layer. forms: [{cx,cy,rx,ry,mat,z,ang,flat,bias,tilt}], mats: {name:{t:[...tones], thr}}
 * tones are light→dark; thr are dot thresholds between them (length tones-1). Returns { g, info } where info[y][x] =
 * { mat, t, d, u, v, f } for every body pixel.
 */
export function volumes(w, h, forms, mats) {
  const g = grid(w, h), info = grid(w, h, null);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let best = null;
    for (const f of forms) {
      const a = f.ang || 0, c = Math.cos(-a), s = Math.sin(-a), X = x + 0.5 - f.cx, Y = y + 0.5 - f.cy;
      const u = (c * X - s * Y) / f.rx, v = (s * X + c * Y) / f.ry, r2 = u * u + v * v; if (r2 > 1) continue;
      if (f.clip && !f.clip(x, y, u, v)) continue;
      const z = f.z || 0, dep = 1 - r2;
      if (best && (z < best.z || (z === best.z && dep <= best.dep))) continue;
      const ca = Math.cos(a), sa = Math.sin(a); let nx = ca * u - sa * v, ny = sa * u + ca * v; ny += f.tilt || 0;
      const nz = Math.sqrt(dep) * (f.flat || 1), n = Math.hypot(nx, ny, nz), d = (nx * LN[0] + ny * LN[1] + nz * LN[2]) / n;
      best = { z, dep, d, f, u, v };
    }
    if (!best) continue;
    const m = mats[best.f.mat], thr = m.thr; let t = thr.length;
    for (let i = 0; i < thr.length; i++) if (best.d > thr[i]) { t = i; break; }
    t = Math.max(0, Math.min(m.t.length - 1, t + (best.f.bias || 0)));
    g[y][x] = m.t[t]; info[y][x] = { mat: best.f.mat, t, d: best.d, u: best.u, v: best.v, f: best.f };
  }
  return { g, info };
}

/** mask of non-empty cells */
export const maskOf = (g, skip = '') => g.map(r => r.map(c => c !== '.' && !skip.includes(c) ? 1 : 0));

/**
 * outline around the mask: every empty 4-neighbour of a filled cell. ink(x,y,nb) returns the char; nb = {up,down,left,right}
 * chars of the filled neighbours (the outline pixel's neighbours that are inside). Default: rim when the body is only
 * below/right of the outline pixel (the lit upper-left edge), ink elsewhere.
 */
export function outline(g, ink, rim = null, o = {}) {
  const m = o.mask || maskOf(g, o.skip || ''), add = [];
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    if (m[y][x]) continue;
    const dn = get(m, x, y + 1) === 1, rt = get(m, x + 1, y) === 1, up = get(m, x, y - 1) === 1, lf = get(m, x - 1, y) === 1;
    let diag = false;
    if (o.diag) diag = [[1, 1], [-1, 1], [1, -1], [-1, -1]].some(([a, b]) => get(m, x + a, y + b) === 1);
    if (!dn && !rt && !up && !lf && !diag) continue;
    let c = ink;
    if (typeof ink === 'function') c = ink(x, y, { dn, rt, up, lf });
    else if (rim && (dn || rt) && !up && !lf && (o.rimIf ? o.rimIf(x, y) : true)) c = rim;
    if (c) add.push([x, y, c]);
  }
  for (const [x, y, c] of add) g[y][x] = c;
  return g;
}

/** composite layer b over a (non-empty cells of b win). onlyEmpty: only where a is empty */
export function over(a, b, dx = 0, dy = 0, onlyEmpty = false) {
  for (let y = 0; y < b.length; y++) for (let x = 0; x < b[0].length; x++) { const c = b[y][x]; if (c === '.') continue; if (onlyEmpty && get(a, x + dx, y + dy) !== '.') continue; put(a, x + dx, y + dy, c); }
  return a;
}
export function shift(g, dx, dy) { const n = grid(W(g), H(g)); return over(n, g, dx, dy); }
export const flipX = g => g.map(r => r.slice().reverse());
export const flipY = g => g.slice().reverse().map(r => r.slice());
export function rot90(g, cw = true) { const h = H(g), w = W(g), n = grid(h, w); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (cw) n[x][h - 1 - y] = g[y][x]; else n[w - 1 - x][y] = g[y][x]; } return n; }
/** paste g centred into a w×h canvas (offset dx,dy) */
export function fit(g, w, h, dx = 0, dy = 0) { const n = grid(w, h); return over(n, g, Math.floor((w - W(g)) / 2) + dx, Math.floor((h - H(g)) / 2) + dy); }
/** rotate a grid by an arbitrary angle about (px,py) with nearest sampling (for tumbles / rears; keep angles small or 90s) */
export function rotate(g, ang, px, py, w = W(g), h = H(g), ox = 0, oy = 0) {
  const n = grid(w, h), c = Math.cos(ang), s = Math.sin(ang);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x + 0.5 - px - ox, Y = y + 0.5 - py - oy, sx = c * X + s * Y + px, sy = -s * X + c * Y + py;
    n[y][x] = get(g, Math.floor(sx), Math.floor(sy));
  }
  return n;
}

/** remove lone pixels: a cell whose four neighbours all share one other colour takes it (keep: chars never touched) */
export function despeckle(g, keep = '') {
  const out = clone(g);
  for (let y = 1; y < g.length - 1; y++) for (let x = 1; x < g[0].length - 1; x++) {
    const c = g[y][x]; if (c === '.' || keep.includes(c)) continue;
    const n = [g[y - 1][x], g[y + 1][x], g[y][x - 1], g[y][x + 1]];
    if (n.every(k => k === n[0]) && n[0] !== c && n[0] !== '.') out[y][x] = n[0];
  }
  return out;
}
/** replace chars by a map, optionally only where pred(x,y) */
export function recolor(g, map, pred) { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) { const c = g[y][x]; if (map[c] && (!pred || pred(x, y))) g[y][x] = map[c]; } return g; }

/** write sprites/<id>.js. frames: {set: [grid|string]} */
export function emit(id, about, spec) {
  const fr = Object.entries(spec.frames).map(([k, L]) => `    ${k}: [${L.map(t => '`' + (typeof t === 'string' ? t : text(t)) + '`').join(', ')}],`).join('\n');
  const pal = Object.entries(spec.palette).map(([k, v]) => `    ${/^[A-Za-z]$/.test(k) ? k : JSON.stringify(k)}: '${v}',`).join('\n');
  const extra = spec.fps ? `  fps: ${JSON.stringify(spec.fps)},\n` : '';
  const src = `// @pixel ${id}: ${about}\n// Generated by tools/sprites/pests.mjs (tools/sprites/pests/). Do not hand-edit: change the generator and re-run it.\nexport default {\n  id: '${id}', anchor: ${JSON.stringify(spec.anchor)},\n${extra}  palette: {\n${pal}\n  },\n  frames: {\n${fr}\n  },\n};\n`;
  // sanity: every char used is in the palette, frames in a set share a size
  for (const [set, L] of Object.entries(spec.frames)) {
    const gs = L.map(t => typeof t === 'string' ? t.replace(/^\n|\n$/g, '').split('\n') : t.map(r => r.join('')));
    const w = gs[0][0].length, h = gs[0].length;
    gs.forEach((rows, i) => { if (rows.length !== h || rows.some(r => r.length !== w)) throw new Error(`${id}.${set}[${i}] size mismatch`); rows.forEach(r => [...r].forEach(c => { if (c !== '.' && !(c in spec.palette)) throw new Error(`${id}.${set}[${i}] unknown char '${c}'`); })); });
  }
  fs.writeFileSync(path.join(ROOT, 'sprites', id + '.js'), src);
  return spec;
}
