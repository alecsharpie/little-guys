// queen 36×28: the boss beetle. A big lacquered indigo/violet carapace with a hard specular arc and a cool rim light, a
// gold-trimmed wing-case margin, a broad pronotum, a head wearing a tiny gold crown, amber eyes and heavy bronze
// mandibles. walk 4 (heavy, the body bobs), munch 2, roar 2 (rears up, mandibles wide, front legs raised).
// Anchor = ground point under the body.
import { grid, volumes, outline, line, put, get, over, emit, stamp, recolor } from './kit.mjs';
import { squash, shock, deadBug, xeye } from './react.mjs';

const PAL = {
  w: '#fff6ff', // specular
  c: '#d9c2ff', // lilac reflection
  l: '#9a6ad8', // lit carapace
  m: '#6440ae', // carapace
  s: '#40287c', // shade
  d: '#25164c', // deep
  r: '#5c7ee0', // reflected blue rim
  o: '#120a22', // ink
  Y: '#fff1b0', // gold glint
  y: '#ffd24a', // gold
  Q: '#c08a1c', // gold shade
  q: '#7a4e10', // gold deep
  A: '#f4cc80', B: '#bc7c3a', C: '#6a3a1e', // bronze mandibles
  k: '#7a68a6', K: '#3a2c5a', j: '#221838', // legs: lit, shade, far
  e: '#ffb640', E: '#fff2c0', // eyes
  R: '#e8466a', // ruby on the crown
  p: '#d4bce6', P: '#9a7cc0', q: '#5e4488', // belly (lilac)
  g: '#a6e05a', G: '#5fb83f', // leaf crumbs
};
const MATS = {
  shell: { t: ['w', 'l', 'm', 's', 'd'], thr: [0.96, 0.7, 0.3, -0.25] },
  pro: { t: ['w', 'l', 'm', 's', 'd'], thr: [0.96, 0.7, 0.3, -0.25] },
  head: { t: ['l', 'm', 's', 'd'], thr: [0.75, 0.35, -0.1] },
};

// thick two-segment leg: hip → knee → foot. near legs lit on top, far legs flat dark
function leg(L, [hx, hy], [kx, ky], [fx, fy], far) {
  const a = far ? 'j' : 'k', b = far ? 'j' : 'K';
  line(L, hx, hy, kx, ky, a); line(L, hx + 1, hy, kx + 1, ky, b);       // femur 2 px
  line(L, kx, ky, fx, fy, a); if (!far) line(L, kx + 1, ky, fx + 1, fy, b); // tibia
  put(L, fx, fy, far ? 'j' : 'o'); if (!far) put(L, fx + 1, fy, 'o');     // foot claw
}

function queen({ legs = [0, 0, 0, 0, 0, 0], lift = [], by = 0, rear = 0, open = 0, dip = 0, crumb = 0, raise = 0, shut = 0, crownDy = 0 }) {
  const Wd = 36, Ht = 28;
  // rear: rotate the forms about the back end (pivot) by -rear radians, so the front lifts
  const px = 3, py = 23, ca = Math.cos(-rear), sa = Math.sin(-rear);
  const R = (x, y) => [px + (x - px) * ca - (y - py) * sa, py + (x - px) * sa + (y - py) * ca];
  const F = (cx, cy, rx, ry, mat, z) => { const [X, Y] = R(cx, cy + by); return { cx: X, cy: Y, rx, ry, mat, z, ang: -rear }; };
  const forms = [
    F(11.6, 16.8, 10.4, 7.3, 'shell', 0),
    F(22.6, 17.0, 4.4, 6.5, 'pro', 1),
    F(27.0, 17.8 + dip, 3.2, 4.4, 'head', 2),
  ];
  const { g, info } = volumes(Wd, Ht, forms, MATS);
  for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
    const i = info[y][x]; if (!i) continue;
    if (i.mat === 'shell') {
      const r = Math.hypot(i.u, i.v);
      if (g[y][x] === 'w') g[y][x] = 'l';
      if (r > 0.58 && r < 0.76 && i.u < 0.1 && i.v < -0.05 && i.v > -0.95) g[y][x] = (i.u < -0.45 && i.v < -0.35) ? 'w' : 'c';
      if (r > 0.25 && r < 0.4 && i.u < -0.1 && i.u > -0.4 && i.v < -0.1 && i.v > -0.45) g[y][x] = 'c';
      if (r > 0.66 && r < 0.8 && i.v > 0.2 && i.u > 0.35) g[y][x] = 'r';
      if (i.v > 0.62 && r < 0.92) g[y][x] = 's';
      // gold trim along the lower margin of the wing cases
      if (r > 0.8 && r <= 0.92 && i.v > 0.35) g[y][x] = i.u < -0.2 ? 'y' : 'Q';
      if (r > 0.92 && i.v > 0.35) g[y][x] = 'd';
      // the seam down the back, a touch above centre
      if (Math.abs(i.v + 0.12) < 0.07 && i.u > -0.92 && i.u < 0.92 && g[y][x] !== 'w' && g[y][x] !== 'c') g[y][x] = 'd';
    }
    if (i.mat === 'pro') {
      if (g[y][x] === 'w') g[y][x] = 'l';
      if (i.u < 0.0 && i.u > -0.55 && i.v < -0.25 && i.v > -0.8) g[y][x] = i.v < -0.55 && i.u < -0.25 ? 'w' : 'c';
      if (i.v > 0.75) g[y][x] = 'd';
    }
  }
  for (let y = 0; y < Ht; y++) for (let x = 1; x < Wd; x++) {
    const a = info[y][x - 1], b = info[y][x];
    if (a && b && a.mat !== b.mat) g[y][x - 1] = a.mat === 'shell' ? 'o' : 'd';
  }
  outline(g, 'o', 's', { rimIf: (x, y) => y < 12 && x < 20 });
  // head furniture: crown, eyes, mandibles, antennae (positions follow the rotated head centre)
  const hc = R(27.0, 17.8 + dip + by), hx = Math.round(hc[0]), hy = Math.round(hc[1]);
  const M = grid(Wd, Ht);
  const far = open ? `
....oAo
...oABo
..oABo.
.oABo..
oABo...
.oo....` : `
..oAAo.
.oABBBo
oAB.oBo
.o...oC
.....o.`;
  const near = open ? `
.oo....
oBCo...
.oBCo..
..oBCo.
...oCCo
....oo.` : `
.....o.
.o...oC
oBC.oCo
.oCCCo.
..ooo..`;
  stamp(M, hx + 1, hy - (open ? 6 : 5) - (open > 1 ? 1 : 0), far);
  stamp(M, hx + 1, hy + 1 + (open > 1 ? 1 : 0), near);
  // legs: near (bottom) and far (peeking above). raise lifts the front pair for the roar
  const L = grid(Wd, Ht), TOP = grid(Wd, Ht);
  const base = by;
  // near legs: back one trails, middle one plants under the body, front one reaches forward
  const nearH = [[7, 22, -4, -5], [13, 23, 1, 0], [20, 22, 4, 5]], farH = [[7, 11, -4, -5], [13, 10, 0, -1], [20, 11, 4, 5]];
  nearH.forEach(([x, y, kx, fx], i) => {
    const o = legs[i], up = lift.includes(i) ? 1 : 0, [X, Y] = R(x, y + base);
    leg(L, [X, Y], [X + kx + o, Math.min(Y + 2, 25) - up], [X + fx + o * 2, 27 - up], false);
  });
  farH.forEach(([x, y, kx, fx], i) => {
    const o = legs[3 + i], up = lift.includes(3 + i) ? 1 : 0, [X, Y] = R(x, y + base);
    if (i === 2 && raise) { leg(L, [X, Y], [X + 2, Y - 5], [X + 5, Y - 6 - raise], true); return; }
    leg(L, [X, Y], [X + kx + o, Y - 3 - up], [X + fx + o * 2, Y], true);
  });
  // antennae: elbowed, clubbed
  line(L, hx - 1, hy - 3, hx - 2, hy - 7, 'j'); line(L, hx - 2, hy - 7, hx, hy - 9, 'j'); put(L, hx + 1, hy - 9, 'K'); put(L, hx + 1, hy - 10, 'K');
  const out = over(over(over(L, M), g), TOP);
  // crown: three gold points with a ruby, sitting on top of the head
  stamp(out, hx - 4, hy - 8 + crownDy, `
.o.o.o.
oYoyoyo
oYyyyQo
oyyRyQo
.oQQQo.
..ooo..`);
  // eyes: amber with a glint
  if (shut) { put(out, hx, hy - 2, 'o'); put(out, hx + 1, hy - 1, 'o'); put(out, hx, hy, 'o'); put(out, hx - 1, hy - 1, 'm'); } // squeezed ">"
  else { put(out, hx + 1, hy - 1, 'e'); put(out, hx + 1, hy - 2, 'E'); put(out, hx + 2, hy - 1, 'o'); }
  if (crumb) { put(out, 35, 22, 'g'); put(out, 34, 24, 'G'); put(out, 33, 21, 'G'); }
  return out;
}

// hurt: a big recoil. The carapace squashes 2 px, the head snaps up with the jaws sprung, legs splay, eyes squeezed
// shut and the crown jumps off her head for a moment; frame 1 is the rebound
function hurt(k) {
  const g = squash(queen({ legs: k ? [-1, 0, 1, -1, 0, 1] : [-2, 0, 2, -2, 0, 2], rear: k ? 0.06 : 0.12, open: 1, shut: 1, crownDy: k ? -1 : -3 }), k ? [15] : [13, 16], 0);
  shock(g, 29, k ? 5 : 6, 'w', true);
  return g;
}
// dead: flipped on her back and dazed: lilac belly up, six thick legs kicking, jaws agape, X eyes, crown sliding off
const deadMats = { shell: { t: ['w', 'l', 'm', 's', 'd'], thr: [0.95, 0.7, 0.3, -0.2] }, belly: { t: ['p', 'P', 'q'], thr: [0.5, 0.0] }, head: { t: ['l', 'm', 's', 'd'], thr: [0.75, 0.35, -0.1] } };
const CROWN = [`
..o......
.oYo.o...
oYyyoyo.o
.oyRyyoyo
..oQQyyQo
...ooQQo.
.....oo..`, `
......o..
...o.oYo.
.o.oyoyyo
oyoyyRyo.
oQyyQQo..
.oQQoo...
..oo.....`];
function dead(k) {
  const { g } = deadBug({ w: 36, h: 28, cx: 15, cy: 20.5, rx: 12.6, ry: 6.4, mats: deadMats, head: [28.4, 21.4, 3.2, 3.4], hips: [[8, -1], [14, 0], [20, 1], [11, -1], [17, 1]], len: 7, leg: 'k', leg2: 'K', thick: 1, ink: 'o', rim: 's', segs: [10, 13, 16, 19], k });
  // gold trim on the upturned rim
  for (let x = 4; x < 26; x++) for (let y = 27; y > 18; y--) { if (g[y][x] === 'o' || g[y][x] === '.') continue; if (y < 27 && (g[y + 1][x] === 'o')) { if (x % 2 === 0 || 1) g[y][x] = x < 12 ? 'y' : 'Q'; } break; }
  put(g, 6, 24, 'w'); put(g, 7, 25, 'c');
  xeye(g, 28, 19, 'e', 2);
  // jaws agape, waving
  const t = k;
  line(g, 31, 20, 34, 17 + t, 'B'); line(g, 32, 20, 35, 18 + t, 'A'); put(g, 35, 16 + t, 'o');
  line(g, 31, 23, 34, 25 - t, 'C'); line(g, 32, 23, 35, 24 - t, 'B'); put(g, 35, 26 - t, 'o');
  // crown knocked askew, rocking
  stamp(g, k ? 27 : 25, k ? 10 : 11, CROWN[k]);
  shock(g, 30, 9, 'Y');
  return g;
}

const A = [0, 2, 4], B = [1, 3, 5];
const pose = (fa, fb, la, lb) => { const legs = []; for (const i of A) legs[i] = fa; for (const i of B) legs[i] = fb; return { legs, lift: [...(la ? A : []), ...(lb ? B : [])] }; };
export default function run() {
  return emit('queen', 'the boss beetle, a crowned lacquered violet carapace', {
    anchor: [18, 28],
    palette: PAL,
    fps: { walk: 7, roar: 5, hurt: 14, dead: 14 },
    frames: {
      walk: [
        queen({ ...pose(1, -1) }),
        queen({ ...pose(0, 0, false, true), by: -1 }),
        queen({ ...pose(-1, 1) }),
        queen({ ...pose(0, 0, true, false), by: -1 }),
      ],
      munch: [
        queen({ ...pose(0, 0), open: 1 }),
        queen({ ...pose(0, 0), dip: 1, crumb: 1 }),
      ],
      hurt: [hurt(0), hurt(1)],
      dead: [dead(0), dead(1)],
      roar: [
        queen({ ...pose(0, 0), rear: 0.2, open: 1, raise: 1 }),
        queen({ ...pose(0, 0), rear: 0.25, open: 2, raise: 2 }),
      ],
    },
  });
}
