// stag 18×14: the armoured stag beetle. A glossy near-black shell with hard specular streaks and a cool reflected rim
// light (it reads as lacquered armour: normal bonks bounce off), a broad pronotum, a big head and chestnut antler
// mandibles. walk 4, munch 2. Anchor = ground point under the body.
import { grid, volumes, outline, line, put, get, over, emit, stamp } from './kit.mjs';

const PAL = {
  w: '#ffffff', // specular
  c: '#a9c4ec', // cool reflection
  l: '#6a6492', // lit shell
  m: '#3a3150', // shell
  s: '#251d34', // shell shade
  d: '#150f1e', // deep
  r: '#5a7ab0', // reflected rim (blue sky bounce)
  o: '#0b0812', // ink
  A: '#f0b070', // mandible light
  B: '#b8642e', // mandible
  C: '#6e3018', // mandible shade
  k: '#3a2e44', // leg
  K: '#1e1828', // far leg
  e: '#ffe6a8', // eye
  g: '#a6e05a', G: '#5fb83f', // leaf crumbs
};
const MATS = {
  shell: { t: ['w', 'l', 'm', 's', 'd'], thr: [0.95, 0.72, 0.3, -0.25] },
  pro: { t: ['w', 'l', 'm', 's', 'd'], thr: [0.95, 0.72, 0.3, -0.25] },
  head: { t: ['l', 'm', 's', 'd'], thr: [0.8, 0.4, -0.1] },
};

function stag({ legs = [0, 0, 0, 0, 0, 0], lift = [], open = 0, dip = 0, crumb = 0, by = 0 }) {
  const Wd = 18, Ht = 14;
  const forms = [
    { cx: 5.0, cy: 6.6 + by, rx: 4.5, ry: 3.9, mat: 'shell', z: 0 },
    { cx: 9.5, cy: 6.6 + by, rx: 2.1, ry: 3.6, mat: 'pro', z: 1 },
    { cx: 11.6, cy: 6.8 + by + dip, rx: 1.5, ry: 2.6, mat: 'head', z: 2 },
  ];
  const { g, info } = volumes(Wd, Ht, forms, MATS);
  // lacquer: the specular streak follows the upper-left shoulder of the wing cases as a clean arc, plus a hot spot
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const i = info[y][x]; if (!i) continue;
    if (i.mat === 'shell') {
      const r = Math.hypot(i.u, i.v);
      if (r > 0.55 && r < 0.8 && i.u < -0.05 && i.v < 0.0 && i.v > -0.85) g[y][x] = i.u < -0.5 && i.v < -0.3 ? 'w' : 'c';
      else if (g[y][x] === 'w') g[y][x] = 'l';
      if (i.v > 0.55 && i.u > -0.4 && i.u < 0.85) g[y][x] = i.v > 0.8 ? 'd' : 's';
      if (i.v > 0.3 && i.v < 0.6 && i.u > 0.3 && i.u < 0.85) g[y][x] = 'r'; // bounced sky light on the lower-right flank
    }
    if (i.mat === 'pro') {
      if (i.u < -0.1 && i.u > -0.6 && i.v < -0.2 && i.v > -0.75) g[y][x] = i.v < -0.5 ? 'w' : 'c';
      else if (g[y][x] === 'w') g[y][x] = 'l';
    }
  }
  // seam along the back (slightly above centre), elytra/pronotum and pronotum/head joints in ink
  for (let x = 1; x <= 8; x++) { const y = Math.round(5.6 + by); if (info[y][x]?.mat === 'shell' && g[y][x] !== 'w' && g[y][x] !== 'c') g[y][x] = 'd'; }
  for (let y = 0; y < Ht; y++) for (let x = 1; x < Wd; x++) {
    const a = info[y][x - 1], b = info[y][x];
    if (a && b && a.mat !== b.mat && y > 3 + by) g[y][x - 1] = a.mat === 'shell' ? 'o' : 'd';
  }
  outline(g, 'o', 's', { rimIf: (x, y) => y < 5 + by && x < 9 });
  // mandibles (hand-drawn): far one curves up-forward, near one down-forward; open spreads them
  const M = grid(Wd, Ht), hy = Math.round(6 + by + dip);
  const far = `
.oAAo..
oABBBo.
.o..oBo
.....oC`, near = `
.....oC
.B..oCo
oCCCCo.
.oooo..`;
  stamp(M, 11, hy - 4 - open, far);
  stamp(M, 11, hy + 1 + open, near);
  // legs: near ones from under the body to the ground; far ones peek out above
  const L = grid(Wd, Ht);
  const nearL = [[3, 2], [6, 6], [9, 10]], farL = [[3, 2], [6, 5], [9, 9]];
  nearL.forEach(([hx, fx], i) => { const o = legs[i], up = lift.includes(i) ? 1 : 0; line(L, hx, 10 + by, hx + (fx - hx) / 2 + o / 2, 12 - up, 'k'); line(L, hx + (fx - hx) / 2 + o / 2, 12 - up, fx + o, 13 - up, 'k'); });
  farL.forEach(([hx, fx], i) => { const o = legs[3 + i], up = lift.includes(3 + i) ? 1 : 0; line(L, hx, 3 + by, fx + o, 1 - up, 'K'); });
  // antennae (elbowed)
  line(L, 11, 4 + by + dip, 11, 2 + by + dip, 'K'); put(L, 12, 1 + by + dip, 'K');
  const out = over(over(L, M), g);
  // eye
  put(out, 12, 5 + by + dip, 'e');
  if (crumb) { put(out, 17, 9, 'g'); put(out, 16, 10, 'G'); }
  return out;
}

const A = [0, 2, 4], B = [1, 3, 5];
const pose = (fa, fb, la, lb) => { const legs = []; for (const i of A) legs[i] = fa; for (const i of B) legs[i] = fb; return { legs, lift: [...(la ? A : []), ...(lb ? B : [])] }; };
export default function run() {
  return emit('stag', 'armoured stag beetle, lacquered shell and antler mandibles', {
    anchor: [9, 14],
    palette: PAL,
    frames: {
      walk: [
        stag({ ...pose(1, -1) }),
        stag({ ...pose(0, 0, false, true), by: -0 }),
        stag({ ...pose(-1, 1) }),
        stag({ ...pose(0, 0, true, false) }),
      ],
      munch: [
        stag({ ...pose(0, 0), open: 1 }),
        stag({ ...pose(0, 0), dip: 1, crumb: 1 }),
      ],
    },
  });
}
