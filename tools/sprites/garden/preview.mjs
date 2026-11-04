// Render sprites to a PNG contact sheet without a browser:
//   node tools/sprites/garden/preview.mjs <out.png> <id> [id…] [--z 6] [--team 0..7] [--tile]
// Each set: its frames at ×z on lawn green, then the same frames at ×1 and ×3 (game scale). --tile tiles idle frames 4×3.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { canvas, parse } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = args[0], Z = +opt('z', 6), tile = args.includes('--tile');
const ids = args.slice(1).filter((a, i, A) => !a.startsWith('--') && !A[i]?.startsWith('--') && !(A[i - 1] || '').startsWith('--'));
const TEAMS = [['#ff9a88', '#e04a4a', '#992838'], ['#8ac4ff', '#3f86e0', '#27489a'], ['#ffe680', '#f2c230', '#ad7418'], ['#cfa8ff', '#9a5ae0', '#5a3192'], ['#ffb878', '#f08a2c', '#a44c1a'], ['#93f2e2', '#2cc4b0', '#16717a'], ['#ffb6da', '#f06aa8', '#a03672'], ['#ffffff', '#d8dce8', '#868ca6']];
const tm = TEAMS[+opt('team', 1)], team = { teamlight: tm[0], team: tm[1], teamdark: tm[2] };
const specs = [];
for (const id of ids) specs.push((await import(pathToFileURL(path.resolve('sprites', id + '.js')).href + '?' + Date.now())).default);
const rows = [];
const only = opt('sets', '') ? opt('sets').split(',') : null;
for (const s of specs) for (const [set, L] of Object.entries(s.frames)) {
  if (only && !only.includes(set)) continue;
  const fr = L.map(parse), w = Math.max(...fr.map(f => f[0].length)), h = Math.max(...fr.map(f => f.length));
  rows.push({ s, set, fr, w, h });
}
const PAD = 8;
let Wt = 0, Ht = PAD;
for (const r of rows) { const rowW = PAD + r.fr.length * (r.w * Z + PAD) + 20 + r.fr.length * (r.w + 4) + 20 + r.fr.length * (r.w * 3 + 6); Wt = Math.max(Wt, rowW); Ht += r.h * Z + PAD; }
if (tile) { const g = rows.find(r => r.set === 'idle') || rows[0]; Wt = Math.max(Wt, g.w * 4 * 3 + 2 * PAD); Ht += g.h * 3 * 3 + PAD; }
const cv = canvas(Wt, Ht, '#2d2457');
let y = PAD;
for (const r of rows) {
  let x = PAD;
  r.fr.forEach(f => { cv.fill(x, y, r.w * Z, r.h * Z, '#6cbf55'); cv.blit(f, r.s.palette, x, y, Z, team); x += r.w * Z + PAD; });
  x += 20;
  cv.fill(x - 4, y, r.fr.length * (r.w + 4) + 4, r.h + 8, '#6cbf55');
  r.fr.forEach(f => { cv.blit(f, r.s.palette, x, y + 4, 1, team); x += r.w + 4; });
  x += 20;
  cv.fill(x - 6, y, r.fr.length * (r.w * 3 + 6) + 6, r.h * 3 + 8, '#6cbf55');
  r.fr.forEach(f => { cv.blit(f, r.s.palette, x, y + 4, 3, team); x += r.w * 3 + 6; });
  y += r.h * Z + PAD;
}
if (tile) {
  const g = rows.find(r => r.set === 'idle') || rows[0];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) cv.blit(g.fr[(i * 7 + j * 3) % g.fr.length], g.s.palette, PAD + i * g.w * 3, y + j * g.h * 3, 3, team);
}
cv.save(out);
console.log(out, Wt + '×' + Ht);
