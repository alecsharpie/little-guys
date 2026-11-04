// Shared helpers for the hit reactions: `hurt` (squash + recoil, eyes shut, shock ticks) and `dead` (flipped on its
// back, belly up, legs flailing). Used by the creature painters in this folder.
import { grid, volumes, outline, line, put, get, over, W, H } from './kit.mjs';

/** flatten: drop the given rows, restack the rest bottom-aligned (content above the dropped rows moves down), shift x */
export function squash(g, rows, dx = 0) {
  const h = H(g), w = W(g), out = grid(w, h), keep = [];
  for (let y = 0; y < h; y++) if (!rows.includes(y)) keep.push(g[y]);
  const off = h - keep.length;
  keep.forEach((r, i) => { for (let x = 0; x < w; x++) if (r[x] !== '.') put(out, x + dx, i + off, r[x]); });
  return out;
}

/** "OOF" ticks: short light strokes radiating from a point (cx,cy). n=3 strokes up-left, up, up-right */
export function shock(g, cx, cy, ch, big = false) {
  const L = big ? 2 : 1;
  for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1]]) {
    for (let i = 1; i <= L; i++) { const x = cx + dx * (i + 1), y = cy + dy * (i + 1); if (get(g, x, y) === '.') put(g, x, y, ch); }
  }
}

/**
 * A bug flipped on its back, seen from 3/4 above: the shell is now a rim at the bottom (resting on the ground), the
 * belly faces up with segment lines, the legs kick in the air (k alternates them), the head lolls at the front.
 * o: { w, h, cx, cy, rx, ry, mats: {shell, belly, head}, head: [x, y, rx, ry], hips: [[x, dir]...], len, leg, leg2,
 *      ink, rim, segs: [x...], k }
 */
export function deadBug(o) {
  const forms = [
    { cx: o.cx, cy: o.cy + o.ry * 0.35, rx: o.rx, ry: o.ry * 0.75, mat: 'shell', z: 0 },
    { cx: o.cx, cy: o.cy - o.ry * 0.12, rx: o.rx * 0.86, ry: o.ry * 0.72, mat: 'belly', z: 1 },
    { cx: o.head[0], cy: o.head[1], rx: o.head[2], ry: o.head[3], mat: 'head', z: 2 },
  ];
  const { g, info } = volumes(o.w, o.h, forms, o.mats);
  // belly segment lines (cross the body vertically, since it lies along x)
  for (const sx of o.segs || []) for (let y = 0; y < o.h; y++) if (info[y][sx]?.mat === 'belly' && info[y][sx].t > 0) g[y][sx] = o.mats.belly.t[Math.min(o.mats.belly.t.length - 1, info[y][sx].t + 1)];
  outline(g, o.ink, o.rim, { rimIf: (x, y) => y < o.cy && x < o.cx });
  // legs: from the top edge of the belly, bent at the knee, kicking (alternate pairs swap each frame)
  const L = grid(o.w, o.h);
  const top = x => { for (let y = 0; y < o.h; y++) if (info[y][Math.round(x)]?.mat === 'belly') return y; return Math.round(o.cy - o.ry * 0.6); };
  o.hips.forEach(([x, dir], i) => {
    const ph = ((i % 2) ^ o.k) ? 1 : -1, y0 = top(x), len = o.len;
    const kx = x + dir * Math.round(len * 0.35) + ph * 0.5, ky = y0 - Math.round(len * 0.6);
    const fx = x + dir * Math.round(len * 0.5) + ph * Math.max(1, Math.round(len * 0.35)), fy = y0 - len + (ph > 0 ? 1 : 0);
    const c = i < o.hips.length / 2 ? o.leg : (o.leg2 || o.leg);
    line(L, x, y0, kx, ky, c); line(L, kx, ky, fx, Math.max(0, fy), c);
    if (o.thick) { line(L, x + 1, y0, kx + 1, ky, o.leg2 || c); }
  });
  return { g: over(L, g), info };
}

/** shut / X'd eye at (x,y): size 1 = a 2-px dash, 2 = a 3×3 X */
export function xeye(g, x, y, ch, size = 1) {
  if (size === 1) { put(g, x, y, ch); put(g, x + 1, y, ch); return; }
  for (const [a, b] of [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]]) put(g, x + a, y + b, ch);
}
