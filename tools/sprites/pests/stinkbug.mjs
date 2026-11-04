// stinkbug 12×10: a shield bug. Olive-brown pentagon shield with spiky shoulders, a pale scutellum triangle on the back,
// cream dots along the banded edge, a small head with banded antennae. walk 4, munch 2, fly 2 (tumbling belly-up through
// the air after a bonk, legs flailing). Hand-painted body, legs per frame. Anchor = ground point under the body.
import { grid, stamp, line, put, over, emit, rot90, flipY, fit, get } from './kit.mjs';
import { squash, shock, deadBug } from './react.mjs';

const PAL = {
  L: '#e6d88c', // highlight
  a: '#ab9a52', // light olive
  b: '#7e7038', // mid olive-brown
  c: '#584a26', // shade
  d: '#382e18', // deep
  y: '#cdb866', // scutellum
  q: '#f0e2a2', // edge dots
  o: '#20180c', // ink
  e: '#e85a3a', // eye (red-brown bead)
  k: '#5e4e2c', K: '#2a2214', // legs
  p: '#b8c48a', P: '#8a9a5e', // pale belly (for the tumble)
  g: '#a6e05a', G: '#5fb83f',
  w: '#ffffff', n: '#dce8a8', // shock ticks, puffed-belly highlight
};
const BODY = `
............
....ooooo...
..ooaLLaabo.
.oaaayyyabbo
oqbyyyyybdeo
.occbbyybcdo
..oqcqcqddo.
...ooooooo..
`;
// belly-up: pale underside, legs pointing up
const BELLY = `
............
....ooooo...
..oopPPPPdo.
.opppPPPPPdo
oppPPPPPPdeo
.odPPPPPddoo
..ooddddddo.
....ooooo...
`;
function bug({ legs = [0, 0, 0, 0, 0, 0], lift = [], ant = 0, dip = 0, crumb = 0 }) {
  const L = grid(12, 10), g = grid(12, 10);
  stamp(g, 0, 0, BODY);
  const near = [[4, 2], [6, 6], [8, 10]];
  near.forEach(([hx, fx], i) => { const o = legs[i], up = lift.includes(i) ? 1 : 0; line(L, hx, 7, fx + o, 9 - up, 'k'); });
  [[4, 3], [8, 9]].forEach(([hx, fx], i) => { const o = legs[3 + i * 2], up = lift.includes(3 + i * 2) ? 1 : 0; line(L, hx, 1, fx + o, up ? 0 : 0, 'K'); });
  // banded antennae: dark with a pale joint
  line(L, 10, 2 + dip, 11, 0 + dip, 'K'); put(L, 11, 1 + dip - ant, 'a');
  if (dip) { for (let y = 9; y > 2; y--) g[y][10] = g[y - 1][10]; g[3][10] = 'o'; put(g, 11, 6, 'o'); put(g, 11, 4, '.'); }
  const out = over(L, g);
  if (crumb) { put(out, 11, 8, 'g'); put(out, 11, 9, 'G'); }
  return out;
}
function tumble(k) {
  // legs flail upward from the pale belly; frame 1 is the same bug turned a quarter (it spins as it flies)
  const g = grid(12, 10), L = grid(12, 10);
  stamp(g, 0, 0, BELLY);
  const kick = k ? 1 : -1;
  for (const [x, dx] of [[4, -1], [6, 0], [8, 1]]) { line(L, x, 1, x + dx + kick, 0, 'k'); }
  line(L, 4, 7, 3 - kick, 9, 'K'); line(L, 7, 7, 7 + kick, 9, 'K');
  line(L, 10, 3, 11, 1 + (k ? 1 : 0), 'K');
  let out = over(L, g);
  if (k) out = fit(rot90(out, true), 12, 10, 0, 0);
  return out;
}

// hurt: shield squashed flat, legs splayed, antenna flat back, eye shut, OOF ticks
function hurt(k) {
  const g = grid(12, 10), L = grid(12, 10);
  stamp(g, 0, 0, BODY);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 12; x++) if (g[y][x] === 'e') g[y][x] = 'd';
  const b = squash(g, k ? [] : [4], 0);
  const legs = k ? [[3, 8], [2, 9], [6, 8], [6, 9], [9, 8], [10, 9]] : [[2, 9], [1, 9], [5, 9], [6, 9], [9, 9], [10, 9], [11, 9]];
  for (const [x, y] of legs) put(L, x, y, 'k');
  const top = k ? 2 : 3;
  line(L, 10, top, 7, top - 1, 'K');
  const out = over(L, b);
  shock(out, 9, top - 1, 'w');
  return out;
}
// dead: belly-up and puffed up round, legs kicking
const deadMats = { shell: { t: ['a', 'b', 'c', 'd'], thr: [0.8, 0.4, -0.1] }, belly: { t: ['n', 'p', 'P'], thr: [0.6, 0.15] }, head: { t: ['c', 'd'], thr: [0.3] } };
function dead(k) {
  const { g } = deadBug({ w: 12, h: 10, cx: 5.4, cy: 6.3, rx: 4.7, ry: 3.6, mats: deadMats, head: [10, 7, 1.2, 1.2], hips: [[2, -1], [5, 0], [8, 1], [3, 0], [6, 0]], len: 3, leg: 'k', leg2: 'K', ink: 'o', rim: 'c', segs: [], k });
  // cream dots along the shell rim
  for (const x of [2, 4, 6, 8]) if (g[8][x] !== '.' && g[8][x] !== 'o') g[8][x] = 'q';
  return g;
}

const A = [0, 2, 4], B = [1, 3, 5];
const pose = (fa, fb, la, lb) => { const legs = []; for (const i of A) legs[i] = fa; for (const i of B) legs[i] = fb; return { legs, lift: [...(la ? A : []), ...(lb ? B : [])] }; };
export default function run() {
  return emit('stinkbug', 'olive shield bug', {
    anchor: [6, 10],
    fps: { hurt: 14, dead: 14 },
    palette: PAL,
    frames: {
      walk: [bug({ ...pose(1, -1) }), bug({ ...pose(0, 0, false, true), ant: 1 }), bug({ ...pose(-1, 1) }), bug({ ...pose(0, 0, true, false) })],
      munch: [bug({ dip: 1 }), bug({ crumb: 1, ant: 1 })],
      fly: [tumble(0), tumble(1)],
      hurt: [hurt(0), hurt(1)],
      dead: [dead(0), dead(1)],
    },
  });
}
