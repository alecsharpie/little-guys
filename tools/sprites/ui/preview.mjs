// Preview the UI kit as PNGs: node tools/sprites/ui/preview.mjs [outdir]  (default: shots/)
//   ui-icons.png  every icon ×1, ×3 on dark green, ×3 on the wood panel, ×4 on paper
//   ui-slices.png 9-slices rendered at several sizes ×3 (panel 100×60 = 300×180 css, buttons 54×19 ≈ 160×56 css)
//   ui-pad.png    phone pieces ×4 in a few team colours; ui-logo.png the logo ×1/×3/×4 on green and wood
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './kit.mjs';
import { Canvas, TEAMS } from './png.mjs';
const out = path.resolve(process.argv[2] || path.join(ROOT, 'shots'));
fs.mkdirSync(out, { recursive: true });
const load = async id => { const f = path.join(ROOT, 'sprites', id + '.js'); return fs.existsSync(f) ? (await import(pathToFileURL(f).href + '?' + Date.now())).default : null; };
const S = {}; for (const id of ['ui_icons', 'ui_panel', 'ui_paper', 'ui_button', 'ui_button_gold', 'ui_chip', 'pad_button', 'pad_ring', 'pad_base', 'pad_knob', 'logo']) S[id] = await load(id);
const panel = (c, x, y, w, h, z = 3) => S.ui_panel ? c.nine(S.ui_panel, 'idle', x, y, w, h, 8, z) : c.rect(x, y, w * z, h * z, '#8a6a3a');

// icons
if (S.ui_icons) {
  const ids = Object.keys(S.ui_icons.frames), cols = 10, cell = 12 * 3 + 12;
  const flat = ids.flatMap(k => S.ui_icons.frames[k].map((_, i) => [k, i]));
  const rowsN = Math.ceil(flat.length / cols), bw = cols * cell + 16, bh = rowsN * cell + 16;
  const c = new Canvas(bw * 2 + 40, bh * 2 + 120, '#283020');
  // strip ×1 and ×2
  flat.forEach(([k, i], n) => { c.sprite(S.ui_icons, k, i, 8 + n * 14, 6, 1); c.sprite(S.ui_icons, k, i, 8 + n * 26, 24, 2); });
  const Y0 = 60;
  c.rect(8, Y0, bw, bh, '#1d2a14'); c.rect(8 + bw / 2, Y0, bw / 2, bh, '#34482a');
  panel(c, bw + 24, Y0, Math.ceil(bw / 3), Math.ceil(bh / 3));
  if (S.ui_paper) c.nine(S.ui_paper, 'idle', 8, Y0 + bh + 16, Math.ceil(bw / 3), Math.ceil(bh / 3), 8, 3); else c.rect(8, Y0 + bh + 16, bw, bh, '#fbf0d2');
  c.rect(bw + 24, Y0 + bh + 16, bw, bh, '#5a3826');
  flat.forEach(([k, i], n) => {
    const X = (n % cols) * cell + 14, Y = Math.floor(n / cols) * cell + 14;
    c.sprite(S.ui_icons, k, i, 8 + X, Y0 + Y, 3); c.sprite(S.ui_icons, k, i, bw + 24 + X, Y0 + Y, 3);
    c.sprite(S.ui_icons, k, i, 8 + X, Y0 + bh + 16 + Y, 3); c.sprite(S.ui_icons, k, i, bw + 24 + X, Y0 + bh + 16 + Y, 3);
  });
  c.save(path.join(out, 'ui-icons.png'));
}
// slices
{
  const c = new Canvas(1000, 900, '#1d2a14');
  if (S.ui_panel) { panel(c, 10, 10, 100, 60); panel(c, 330, 10, 24, 24); panel(c, 420, 10, 40, 100); panel(c, 560, 10, 140, 34); }
  if (S.ui_paper) { panel(c, 10, 400, 100, 60); c.nine(S.ui_paper, 'idle', 10 + 24, 400 + 24, 60, 32, 8, 3); c.nine(S.ui_paper, 'idle', 330, 400, 50, 24, 8, 3); }
  const B = [['ui_button', 'up'], ['ui_button', 'down'], ['ui_button_gold', 'up'], ['ui_button_gold', 'down']];
  B.forEach(([id, set], n) => { if (S[id]) { c.nine(S[id], set, 10 + (n % 2) * 180, 220 + Math.floor(n / 2) * 80, 54, 19, 6, 3); c.nine(S[id], set, 380 + n * 70, 220, 18, 18, 6, 3); c.nine(S[id], set, 380 + n * 100, 300, 30, 24, 6, 3); } });
  if (S.ui_chip) { c.nine(S.ui_chip, 'idle', 700, 220, 40, 12, 4, 3); c.nine(S.ui_chip, 'idle', 700, 270, 12, 12, 4, 3); c.nine(S.ui_chip, 'idle', 760, 270, 26, 9, 4, 3);
    if (S.ui_icons) { c.sprite(S.ui_icons, 'heart', 0, 700 + 6, 220 + 0, 3); } }
  c.save(path.join(out, 'ui-slices.png'));
}
// pad
{
  const c = new Canvas(1200, 720, '#2a2420');
  const teams = [0, 1, 2, 5, 7];
  teams.forEach((t, n) => {
    const X = 10 + n * 236; const T = TEAMS[t];
    if (S.pad_ring && S.pad_button) { c.sprite(S.pad_ring, 'seg', 10, X, 10, 4, T); c.sprite(S.pad_button, 'up', 0, X + 2 * 4, 10 + (26 - 27) * 4, 4, T); }
    if (S.pad_button) { c.sprite(S.pad_ring, 'seg', 3, X, 230, 4, T); c.sprite(S.pad_button, 'down', 0, X + 2 * 4, 230 - 4, 4, T); }
    if (S.pad_base) c.sprite(S.pad_base, 'idle', 0, X, 450, 4, T);
    if (S.pad_knob && S.pad_base) c.sprite(S.pad_knob, 'idle', 0, X + (20 - 11 + (n - 2) * 2) * 4, 450 + (20 - 11 + (n % 2) * 3) * 4, 4, T);
  });
  if (S.pad_ring) S.pad_ring.frames.seg.forEach((_, i) => c.sprite(S.pad_ring, 'seg', i, 10 + i * 72, 620, 1, TEAMS[0]));
  if (S.pad_ring) S.pad_ring.frames.seg.forEach((_, i) => c.sprite(S.pad_ring, 'seg', i, 10 + i * 72, 672, 1, TEAMS[0]));
  c.save(path.join(out, 'ui-pad.png'));
}
// logo
if (S.logo) {
  const g = S.logo.frames.idle[0].replace(/^\n|\n$/g, '').split('\n'), w = g[0].length, h = g.length;
  const c = new Canvas(w * 4 * 2 + 60, h * 7 + 80, '#1d2a14');
  c.sprite(S.logo, 'idle', 0, 10, 10, 1); c.sprite(S.logo, 'idle', 0, 30 + w, 10, 2);
  c.sprite(S.logo, 'idle', 0, 10, 20 + h * 2, 4);
  panel(c, 30 + w * 4, 20 + h * 2, Math.ceil(w * 4 / 3) + 4, Math.ceil(h * 4 / 3) + 4);
  c.sprite(S.logo, 'idle', 0, 36 + w * 4, 26 + h * 2, 3);
  c.rect(30 + w * 4, 40 + h * 4 + h * 2 + 20, w * 3 + 24, h * 3 + 12, '#34482a');
  c.sprite(S.logo, 'idle', 0, 42 + w * 4, 46 + h * 6 + 20, 3);
  c.save(path.join(out, 'ui-logo.png'));
}
console.log('previews in', out);
// big icons ×7 for detail review
if (S.ui_icons) {
  const flat = Object.keys(S.ui_icons.frames).flatMap(k => S.ui_icons.frames[k].map((_, i) => [k, i])), cols = 10, cell = 12 * 7 + 8;
  const c = new Canvas(cols * cell + 8, Math.ceil(flat.length / cols) * cell + 8, '#34482a');
  flat.forEach(([k, i], n) => { const X = 8 + (n % cols) * cell, Y = 8 + Math.floor(n / cols) * cell; c.rect(X - 2, Y - 2, 12 * 7 + 4, 12 * 7 + 4, n % 2 ? '#8a6a3a' : '#1d2a14'); c.sprite(S.ui_icons, k, i, X, Y, 7); });
  c.save(path.join(out, 'ui-icons-big.png'));
}
