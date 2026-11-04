// stinkbug 12×10: a shield bug. Olive-brown pentagon shield with spiky shoulders, a pale scutellum triangle on the back,
// cream dots along the banded edge, a small head with banded antennae. walk 4, munch 2, fly 2 (tumbling belly-up through
// the air after a bonk, legs flailing). Hand-painted body, legs per frame. Anchor = ground point under the body.
import { grid, stamp, line, put, over, emit, rot90, flipY, fit, get } from './kit.mjs';

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

const A = [0, 2, 4], B = [1, 3, 5];
const pose = (fa, fb, la, lb) => { const legs = []; for (const i of A) legs[i] = fa; for (const i of B) legs[i] = fb; return { legs, lift: [...(la ? A : []), ...(lb ? B : [])] }; };
export default function run() {
  return emit('stinkbug', 'olive shield bug', {
    anchor: [6, 10],
    palette: PAL,
    frames: {
      walk: [bug({ ...pose(1, -1) }), bug({ ...pose(0, 0, false, true), ant: 1 }), bug({ ...pose(-1, 1) }), bug({ ...pose(0, 0, true, false) })],
      munch: [bug({ dip: 1 }), bug({ crumb: 1, ant: 1 })],
      fly: [tumble(0), tumble(1)],
    },
  });
}
