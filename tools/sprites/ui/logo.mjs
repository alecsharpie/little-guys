// logo: "Little Guys" as a painted pixel logo. Big chunky "Guys" (letters drawn on a 2-px grid, then rounded) in a sunny
// straw gradient with a 2-px toasted extrusion; small cream "Little" nestled above "uys"; ink outline, 1-px drop shadow,
// a sprout for the dot of the i and a ladybug crawling on the s.
import { grid, put, get, clone, over, outline, stamp, rows, emit } from './kit.mjs';

const G_ = {
  G: [
    '....######...',
    '..##########.',
    '.####....####',
    '####......###',
    '###........#.',
    '###..........',
    '###..........',
    '###...#######',
    '###...#######',
    '###.......###',
    '###.......###',
    '####......###',
    '.####....####',
    '..###########',
    '....#######..'],
  u: [
    '###......###',
    '###......###',
    '###......###',
    '###......###',
    '###......###',
    '###......###',
    '###.....####',
    '####...#####',
    '.###########',
    '..######.###'],
  y: [
    '###......###',
    '###......###',
    '###......###',
    '###......###',
    '###......###',
    '###.....####',
    '####...#####',
    '.###########',
    '..#######.##',
    '.........###',
    '###....####.',
    '.#########..',
    '..######....'],
  s: [
    '..#######..',
    '.#########.',
    '####....###',
    '####.......',
    '.########..',
    '..#########',
    '.......####',
    '###....####',
    '##########.',
    '.########..'],
};
const LITTLE = {
  L: ['###...', '###...', '###...', '###...', '###...', '###...', '###...', '######', '######'],
  i: ['...', '...', '...', '###', '###', '###', '###', '###', '###'],
  t: ['.###..', '.###..', '######', '######', '.###..', '.###..', '.###..', '.#####', '..####'],
  l: ['###.', '###.', '###.', '###.', '###.', '###.', '###.', '####', '.###'],
  e: ['.......', '.......', '.......', '.#####.', '###.###', '#######', '###....', '###..##', '.#####.'],
};

export default function paint() {
  const Wc = 140, Hc = 56, face = grid(Wc, Hc), tone = grid(Wc, Hc, null);
  const mark = (x, y, t) => { if (x >= 0 && y >= 0 && x < Wc && y < Hc) { face[y][x] = '#'; tone[y][x] = t; } };
  // "Guys": macro grid ×2, baseline at y=38. Each lowercase letter bounces a little.
  const base = 38, OX = 3;
  const big = [['G', 0, 15], ['u', 31, 10], ['y', 59, 10], ['s', 87, 10]], bounce = { G: 0, u: -1, y: 1, s: -2 };
  for (const [ch, x0, xh] of big) {
    const gl = G_[ch], top = base - xh * 2 + bounce[ch];
    gl.forEach((r, j) => [...r].forEach((c, i) => {
      if (c !== '#') return;
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        const y = top + j * 2 + a, f = (y - top) / (xh * 2);
        mark(OX + x0 + i * 2 + b, y, f < 0.16 ? 'w' : f < 0.5 ? 'y' : f < 0.86 ? 'Y' : 'o');
      }
    }));
  }
  // round the outer corners of the macro pixels (knock off convex corner pixels)
  const kill = [];
  for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) {
    if (face[y][x] !== '#') continue;
    const e = (dx, dy) => get(face, x + dx, y + dy) !== '#';
    if ((e(-1, 0) && e(0, -1) && e(-1, -1)) || (e(1, 0) && e(0, -1) && e(1, -1)) || (e(-1, 0) && e(0, 1) && e(-1, 1)) || (e(1, 0) && e(0, 1) && e(1, 1))) kill.push([x, y]);
  }
  kill.forEach(([x, y]) => { face[y][x] = '.'; tone[y][x] = null; });
  // "Little": 1-px letters, cream, above "uys"
  const LX = OX + 38, LY = 4;
  let lx = LX; const lb = { L: 0, i: 1, t: 0, l: -1, e: 1 };
  const word = ['L', 'i', 't', 't', 'l', 'e'], ipos = [];
  word.forEach((ch, n) => {
    const gl = LITTLE[ch], dy = (lb[ch] || 0) + (n === 3 ? 1 : 0);
    if (ch === 'i') ipos.push([lx, LY + dy]);
    gl.forEach((r, j) => [...r].forEach((c, i) => { if (c === '#') mark(lx + i, LY + dy + j, j + (ch === 'e' ? 0 : 0) < 3 ? 'e1' : j < 6 ? 'e2' : 'e3'); }));
    lx += gl[0].length + 2;
  });
  // paint: face tones, top-edge glints, 2-px extrusion, outline, shadow
  const g = grid(Wc, Hc);
  for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) if (face[y][x] === '#') {
    const t = tone[y][x], topEdge = get(face, x, y - 1) !== '#';
    if (t[0] === 'e') g[y][x] = topEdge ? 'W' : t === 'e1' ? 'W' : t === 'e2' ? 'e' : 'E';
    else g[y][x] = topEdge && t !== 'o' ? 'W' : t;
  }
  const isLittle = (x, y) => tone[y] && tone[y][x] && tone[y][x][0] === 'e';
  const ex = [];
  for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) if (face[y][x] === '#') for (const d of [1, 2]) {
    if (y + d < Hc && face[y + d][x] !== '#' && g[y + d][x] === '.') ex.push([x, y + d, isLittle(x, y) ? 'Q' : d === 1 ? 'O' : 'P']);
  }
  ex.forEach(([x, y, c]) => { if (g[y][x] === '.') g[y][x] = c; });
  outline(g, 'k');
  // drop shadow 1 px down-right
  const sh = [];
  for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) if (g[y][x] !== '.' && get(g, x + 1, y + 1) === '.') sh.push([x + 1, y + 1]);
  sh.forEach(([x, y]) => put(g, x, y, 'S'));
  // sprout dotting the i
  const [ix, iy] = ipos[0];
  const sp = grid(Wc, Hc);
  stamp(sp, ix - 2, iy - 3, `
ll..LM.
lLl.LMM
.lLmLM.
...m...`);
  over(g, outline(sp, 'g'));
  // ladybug on the s
  const lbX = OX + 87 + 7, lbY = base - 20 - 2 - 5;
  const bug = grid(Wc, Hc);
  stamp(bug, lbX, lbY, `
...rRR..
.krwRkRq
kwkRRRkq
kkkRkRqq
..kqqqq.`);
  over(g, outline(bug, 'k'));
  // crop to content
  let x0 = Wc, y0 = Hc, x1 = 0, y1 = 0;
  for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) if (g[y][x] !== '.') { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const out = g.slice(y0, y1 + 1).map(r => r.slice(x0, x1 + 1)), w = x1 - x0 + 1, h = y1 - y0 + 1;
  emit('logo', '"Little Guys" painted pixel logo', {
    anchor: [Math.round(w / 2), h],
    palette: { k: '#24180f', S: '#140c06', W: '#fffbea', w: '#fff3c8', y: '#fbe7a1', Y: '#e9c46a', o: '#d2a24e', O: '#a8742e', P: '#7a5526',
      e: '#f6ead0', E: '#e2cfa4', Q: '#b89a6a', r: '#ff9a88', R: '#e04a4a', q: '#992838', l: '#a6e05a', L: '#5fb83f', m: '#2f7d3a', M: '#1c4a2c', g: '#1c2a1e' },
    frames: { idle: [out] },
  }, [`${w}×${h}, anchor [${Math.round(w / 2)},${h}] (bottom centre). Legible from ×2; meant for ×3–×4.`]);
}
