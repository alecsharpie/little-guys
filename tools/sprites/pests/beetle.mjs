// beetle 12×10: the basic pest. A round iridescent leaf beetle (bronze glint → jade → deep teal) seen in 3/4 from above:
// domed wing cases, a narrower pronotum, a dark head with a bright eye; six legs scuttle in a tripod gait and the
// antennae wiggle. walk 4, munch 2. Anchor = ground point under the body. Body is hand-painted; legs are drawn per frame.
import { grid, stamp, line, put, over, emit } from './kit.mjs';
import { squash, shock, deadBug } from './react.mjs';

const PAL = {
  w: '#fffbe6', // glint
  l: '#e3c35c', // bronze sheen
  L: '#9fc35a', // bronze→jade
  m: '#3fae8a', // jade
  s: '#22737e', // teal shade
  d: '#1d3c5c', // deep
  o: '#111925', // ink
  k: '#2e2a3c', // leg
  K: '#1a1726', // far leg / antenna
  e: '#f6f2e0', // eye glint
  g: '#a6e05a', // leaf crumb
  G: '#5fb83f', // leaf crumb
  p: '#dcc47e', P: '#a48a52', q: '#6a5434', // belly (bronze)
};
// body: wing cases x1..6, pronotum x7..8, head x9..10
const BODY = `
..ooooo.....
.olwlLmoo...
olwlLmmLmoo.
oLlLmmsmsdeo
ommmmsssdddo
.ossdddoooo.
..ooooo.....
`;

// legs are hand-placed per frame: near legs (rows 8–9) are 2-px strokes whose slant shows the stroke (\ reaching
// forward, / pushing back, | planted, a lone pixel = lifted); far legs peek out above the shell (rows 0–1)
const NEAR = [
  [[2, 8], [3, 9], [5, 8], [4, 9], [8, 8], [9, 9]],   // tripod A forward, B back
  [[2, 8], [5, 8], [5, 9], [8, 8]],                   // A lifted (swinging), B planted
  [[2, 8], [1, 9], [5, 8], [6, 9], [8, 8], [7, 9]],   // A back, B forward
  [[2, 8], [2, 9], [5, 8], [8, 8], [8, 9]],           // A planted, B lifted
];
const FAR = [[[1, 1], [0, 0], [7, 1], [7, 0]], [[1, 1], [1, 0], [7, 1], [8, 0]], [[1, 1], [2, 0], [7, 1], [8, 0]], [[1, 1], [1, 0], [7, 1], [7, 0]]];
const ANT = [[[10, 2], [11, 1], [9, 2], [10, 0]], [[10, 2], [11, 2], [9, 2], [9, 1], [10, 0]], [[10, 2], [11, 1], [9, 2], [10, 0]], [[10, 2], [11, 1], [11, 0], [9, 2], [9, 1]]];
function beetle(k, { dip = 0, jaw = 0, crumb = 0 } = {}) {
  const g = grid(12, 10), L = grid(12, 10);
  for (const [x, y] of NEAR[k]) put(L, x, y, 'k');
  for (const [x, y] of FAR[k]) put(L, x, y, 'K');
  for (const [x, y] of ANT[k]) put(L, x, y + dip, 'K');
  stamp(g, 0, 1, BODY);
  if (dip) { // head lowered into the leaf
    for (let y = 9; y > 0; y--) for (let x = 9; x < 12; x++) g[y][x] = g[y - 1][x];
    g[3][9] = 'o'; g[3][10] = '.'; g[7][9] = 'o'; g[7][10] = 'o';
  }
  if (jaw) { put(g, 11, 6 + dip, 'o'); put(g, 11, 7 + dip, '.'); }
  if (crumb) { put(g, 11, 8, 'g'); put(g, 11, 9, 'G'); }
  return over(L, g);
}

// hurt: shell squashed a pixel flat and knocked back, legs splayed out flat, antennae blown back, eye shut, OOF ticks
function hurt(k) {
  const g = grid(12, 10), L = grid(12, 10);
  stamp(g, 0, 1, BODY);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 12; x++) if (g[y][x] === 'e') g[y][x] = 'd';
  const b = squash(g, k ? [] : [4], 0);
  const legs = k ? [[1, 8], [0, 9], [4, 8], [4, 9], [8, 8], [9, 9]] : [[1, 9], [0, 9], [4, 9], [5, 9], [8, 9], [9, 9], [10, 9]];
  for (const [x, y] of legs) put(L, x, y, 'k');
  const top = k ? 2 : 3;
  for (const [x, y] of [[0, top], [10, top]]) put(L, x, y, 'K');                 // far legs flung sideways
  line(L, 9, top - 1, 6, top - 1, 'K'); put(L, 10, top - 1, 'K');               // antennae streaming back, flat
  const out = over(L, b);
  shock(out, 9, top - 1, 'w');
  return out;
}
// dead: flipped on its back, bronze belly up, six legs kicking
const deadMats = { shell: { t: ['w', 'l', 'm', 's', 'd'], thr: [0.95, 0.7, 0.3, -0.15] }, belly: { t: ['p', 'P', 'q'], thr: [0.5, 0.0] }, head: { t: ['s', 'd'], thr: [0.4] } };
const dead = k => deadBug({ w: 12, h: 10, cx: 5.5, cy: 7.0, rx: 4.6, ry: 2.7, mats: deadMats, head: [10, 7.6, 1.2, 1.3], hips: [[2, -1], [5, 0], [8, 1], [3, 0], [6, 0]], len: 4, leg: 'k', leg2: 'K', ink: 'o', rim: 's', segs: [3, 5, 7], k }).g;

export default function run() {
  return emit('beetle', 'round iridescent leaf beetle, the basic pest', {
    anchor: [6, 10],
    palette: PAL,
    fps: { hurt: 14, dead: 14 },
    frames: {
      walk: [beetle(0), beetle(1), beetle(2), beetle(3)],
      munch: [beetle(3, { dip: 1, jaw: 1 }), beetle(1, { crumb: 1 })],
      hurt: [hurt(0), hurt(1)],
      dead: [dead(0), dead(1)],
    },
  });
}
