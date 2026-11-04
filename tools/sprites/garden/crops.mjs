// Crops: grow = [sprout, young, grown, ripe], wilt = 1. Anchor bottom centre = the soil point. Each plant sits in a little
// tilled mound (not outlined). Leaves/veg are painted unoutlined, then a selective outline is added from the mask:
// dark hue-shifted ink below/right, the material's deep tone on the lit upper-left rim.
import { grid, put, get, stamp, ell, line, clone, parse, light, hash } from './lib.mjs';

const BASE = {
  // leaf ramp (shared) + inks
  1: '#a6e05a', 2: '#5fb83f', 3: '#2f7d3a', 4: '#1c4a2c', k: '#1c2a1e', K: '#2a160c',
  // soil mound
  m: '#9a6a44', M: '#7a4f33', n: '#5a3826', N: '#3e2619',
  // wilt browns
  u: '#d2b064', U: '#a07a42', v: '#6e5030', V: '#3e2a16',
  // stem / stake wood
  w: '#b48a52', W: '#8a6a3a', b: '#5a3a18',
  x: '#ffffff',
};
// which outline ink each material gets: [ink (below/right), rim (upper-left)]
const INK = {};
for (const c of '1234') INK[c] = ['k', '4'];
for (const c of 'uUvV') INK[c] = ['V', 'v'];
for (const c of 'wWb') INK[c] = ['K', 'b'];
const NO_OUTLINE = 'mMnNx';

function finish(g, ink = INK) {
  const out = clone(g), H = g.length, W = g[0].length;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x] !== '.') continue;
    const nb = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([dx, dy]) => get(g, x + dx, y + dy)).map(c => NO_OUTLINE.includes(c) || !ink[c] ? '.' : c);
    if (nb.every(c => c === '.')) continue;
    const below = nb[0] !== '.' || nb[1] !== '.', above = nb[2] !== '.' || nb[3] !== '.';
    const c = nb.find(c => c !== '.');
    out[y][x] = below && !above ? ink[c][1] : ink[c][0];
  }
  return out;
}
// tilled mound at the base: cx centre, row y (bottom), half-width r
function mound(g, cx, y, r = 2) {
  for (let i = -r - 1; i <= r; i++) put(g, cx + i, y, i < -r + 1 ? 'M' : i > r - 2 ? 'n' : 'M');
  for (let i = -r; i <= r - 1; i++) put(g, cx + i, y - 1, i < 0 ? 'm' : i < r - 1 ? 'M' : 'n');
}
const art = (w, h, rows, y0 = null) => { const g = grid(w, h); const P = parse(rows); stamp(g, 0, y0 == null ? h - P.length : y0, P); return g; };

// ============ carrot (12×16) ============
const CARROT = {
  pal: { O: '#ffb256', o: '#f37a1f', Q: '#b8481a', q: '#7a2c10' },
  ink: { O: ['q', 'Q'], o: ['q', 'Q'], Q: ['q', 'q'] },
  frames: [
`
....1..1....
....21.12...
.....2.2....
......3.....
....mMMn....
...MMMMnn...`,
`
.....1......
..1..12..1..
..21.2..12..
...2.2.12...
...22322....
....232.....
.....3......
....mM3n....
...MMMMnn...`,
`
......1.....
..1..112..1.
.112.12..12.
..12.2.1122.
1..2.2.12...
12.22.22..1.
.22.222.112.
..2223.222..
...2323.2...
....333.....
....3o3.....
...mOoQn....
..MMMMMnn...`,
`
......1.....
..1..112..1.
.112.12..12.
..12.2.1122.
1..2.2.12...
12.22.22..1.
.22.222.112.
..2223.2222.
...232332...
....3333....
...OOooo....
..OOooooQ...
..OooQooQ...
..mOoooQQn..
.MMoooQQnn..`,
`
..u.....u...
.uU....U.u..
u..U.UU...v.
...UUUvU....
....UvU.....
...mUvvn....
..MMMMMnn...`,
  ],
};

// ============ cabbage (14×14) — the head is a shaded volume with veins ============
function cabbage() {
  const pal = { A: '#dcf59a', B: '#a8dc66', C: '#72b84c', D: '#44903f', E: '#24582e', F: '#f4ffd0' };
  const ink = { A: ['k', 'E'], B: ['k', 'E'], C: ['k', 'E'], D: ['k', 'E'], E: ['k', 'k'], F: ['k', 'E'] };
  const W = 14, H = 14;
  const sprout = art(W, H, `
.....1..1.....
....121121....
.....22.2.....
......33......
.....mMMn.....
....MMMMnn....`);
  const young = art(W, H, `
.....1.11.....
...1122122....
..1222.22221..
..2232.32222..
...22333322...
....23332.....
....mM33nn....
...MMMMMnnn...`);
  // outer leaves: wide flat rosette; head: ellipse
  const rosette = (g, cx, cy, rx, ry, head) => {
    // outer leaf lobes
    const lobes = [[-rx + 2, 0, 3, 2.4], [rx - 2, 0, 3, 2.4], [-rx / 2, -1, 3, 2.6], [rx / 2, -1, 3, 2.6], [0, 1, 4, 2]];
    for (const [dx, dy, lx, ly] of lobes) ell(g, cx + dx, cy + dy, lx, ly, ['2', '3', '3', '4'], { thr: [0.55, 0.15, -0.3] });
    if (head) ell(g, cx, cy - head * 0.55, head, head * 0.9, null, {
      cb: (x, y, d, u, v) => {
        // veins: a few curved lines radiating from the bottom centre
        // wrapped leaves: two curved leaf edges sweeping across the head from the lower corners, shaded under their lip
        const e1 = Math.abs(u - (0.15 - (v + 1) * 0.55)) < 0.17 && v > -0.75;
        const e2 = Math.abs(u - (-0.05 + (v + 1) * 0.45)) < 0.17 && v > -0.2;
        let t = d > 0.66 ? 'A' : d > 0.3 ? 'B' : d > -0.1 ? 'C' : 'D';
        if (d > 0.82 && u < -0.1 && v < -0.2) t = 'F';
        if (e1 || e2) t = t === 'A' || t === 'F' ? 'C' : 'D';
        return t;
      },
    });
  };
  const grown = grid(W, H); rosette(grown, 7, 9.5, 6, 3, 2.6); mound(grown, 7, 13, 3);
  const ripe = grid(W, H); rosette(ripe, 7, 10, 6.5, 3, 4.2); mound(ripe, 7, 13, 3);
  const wilt = art(W, H, `
..............
.....uuUu.....
...uUUUUUv....
.uUUvUUvUUvu..
uUvv.vUv.vvUv.
.v...vvv...v..
....mMvvn.....
...MMMMMnnn...`);
  return { pal, ink, frames: [sprout, young, grown, ripe, wilt], W, H };
}

// ============ pumpkin (18×14) ============
function pumpkin() {
  const pal = { P: '#ffc066', p: '#f59a2c', R: '#d9671c', r: '#9a3d12', G: '#9fd06a', g: '#5a9a40', t: '#7a5a2a', T: '#4e3818' };
  const ink = { P: ['K', 'r'], p: ['K', 'r'], R: ['K', 'r'], r: ['K', 'K'], G: ['k', 'g'], g: ['k', 'k'], t: ['K', 'T'], T: ['K', 'K'] };
  const W = 18, H = 14;
  const sprout = art(W, H, `
.......1..1.......
......121121......
.......22.2.......
........33........
.......mMMn.......
......MMMMnn......`);
  const young = art(W, H, `
......11....
....11221...1.....
...122222..121....
...223232.12221...
....2233.1222322..
.....333.3233322..
......3333.33.....
.......3m3Mn......
......MMMMnn......`);
  // a pumpkin: ribbed ellipsoid
  const gourd = (g, cx, cy, rx, ry, ripe) => ell(g, cx, cy, rx, ry, null, {
    cb: (x, y, d, u) => {
      const rib = Math.abs(Math.sin((u + 1) * Math.PI * (rx > 4 ? 2.5 : 1.5))) < 0.25 && Math.abs(u) < 0.85;
      let t = d > 0.6 ? 0 : d > 0.2 ? 1 : d > -0.2 ? 2 : 3;
      if (rib) t = Math.min(3, t + 1);
      return ripe ? 'PpRr'[t] : 'GGgg'[Math.min(t, 3)];
    },
  });
  const leaf = (g, cx, cy, rx = 3, ry = 2.2) => ell(g, cx, cy, rx, ry, ['1', '2', '3', '4'], { thr: [0.6, 0.15, -0.35] });
  const grown = grid(W, H);
  leaf(grown, 4, 7, 3.4, 2.6); leaf(grown, 13, 6, 3.6, 2.8); leaf(grown, 9, 4.5, 3, 2.4);
  line(grown, 3, 11, 14, 10, '3');
  gourd(grown, 9, 10.5, 3, 2.3, false); put(grown, 9, 8, 't');
  mound(grown, 9, 13, 3);
  const ripe = grid(W, H);
  leaf(ripe, 3, 6.5, 3, 2.4); leaf(ripe, 15, 5.5, 2.8, 2.4); leaf(ripe, 12.5, 3, 2.6, 2);
  gourd(ripe, 9, 8.6, 6.4, 4.5, true);
  stamp(ripe, 8, 2, `\n.tT\n.tT\ntT.`);
  put(ripe, 11, 3, '2'); put(ripe, 12, 4, '3');   // curly tendril
  mound(ripe, 9, 13, 4);
  const wilt = art(W, H, `
..................
..................
..uU...........u..
.uUUv.........Uuv.
..Uvv.UU....vUUv..
...v.vvUv.vUvv....
.....vUUUUUv......
.....UUvUUvv......
......mMMMnn......
.....MMMMMnnn.....`);
  return { pal, ink, frames: [sprout, young, grown, ripe, wilt], W, H };
}

// ============ tomato (12×18), staked ============
function tomato() {
  const pal = { R: '#ff6a5a', r: '#e2322e', S: '#9e1a22', s: '#5e0e16', G: '#b8e070', g: '#78b048' };
  const ink = { R: ['s', 'S'], r: ['s', 'S'], S: ['s', 's'], G: ['k', 'g'], g: ['k', 'k'] };
  const W = 12, H = 18;
  // stake on the right of the stem
  const stake = (g, top) => { for (let y = top; y <= 15; y++) { put(g, 8, y, y === top ? 'w' : 'W'); } put(g, 8, top, 'w'); };
  const sprout = art(W, H, `
....1..1....
....21.12...
.....2.2....
......3.....
....mMMn....
...MMMMnn...`);
  const young = grid(W, H);
  stake(young, 7);
  stamp(young, 0, 8, `
.....1......
...1122.....
..1223.1....
...23.122...
....3.223...
...12.3.....
..122.3.....
....233.....`);
  mound(young, 6, 17, 2);
  // a fruit: 3×3 shaded ball, or 2×2 small
  const fruit = (g, x, y, ripe, big = true) => {
    if (big) stamp(g, x, y, ripe ? `\n.RS.\nRrrS\nrrSS\n.SS.` : `\n.G.\nGgg\n.gg`);
    else stamp(g, x, y, ripe ? `\nRS\nrS` : `\nGg\ngg`);
  };
  const FOL = `
....1.......
..1122......
.1223.21....
..23..122...
.12..3.223..
122..3.2.3..
.23..3122...
..3.12.3....
.1223..3....
1223...221..
.23....3.22.
..3...3..3..
.....3......
....33......`;
  const plant = (g, ripe) => {
    for (let y = 1; y <= 15; y++) put(g, 8, y, y < 2 ? 'w' : 'W');
    stamp(g, 0, 1, ripe ? FOL : FOL.replace(/1(?=2)/g, '.'));
    if (false) stamp(g, 0, 1, `
....1.......
..11221.....
.1222322....
..2232.21...
.122.31222..
1222.3.2232.
.233.32122..
..3.13222...
.12223.233..
12232.3.....
.233..31....
..3..3122...
....3.2232..
....33..3...`);
    if (ripe) { fruit(g, 1, 4, true); fruit(g, 6, 7, true); fruit(g, 1, 10, true); fruit(g, 7, 12, true, false); }
    else { fruit(g, 2, 5, false); fruit(g, 7, 9, false); fruit(g, 2, 11, false, false); }
    mound(g, 6, 17, 3);
  };
  const grown = grid(W, H); plant(grown, false);
  const ripe = grid(W, H); plant(ripe, true);
  const wilt = grid(W, H);
  for (let y = 3; y <= 15; y++) put(wilt, 8, y, 'W');
  stamp(wilt, 0, 4, `
......u.....
....uUUv....
...uU.vUu...
..uv..vUvU..
.uv..vUv..v.
.v..uUvv....
...uUvU.v...
..uv..v..v..
.v...vv.....
.....vv.....`);
  put(wilt, 3, 9, 's'); put(wilt, 4, 9, 'S');   // a fallen, rotting tomato
  mound(wilt, 6, 17, 3);
  return { pal, ink, frames: [sprout, young, grown, ripe, wilt], W, H };
}

// ============ sunflower (14×26) ============
function sunflower() {
  const pal = { Y: '#fff08a', y: '#ffd23a', o: '#e89a1a', O: '#a8600e', c: '#8a5228', C: '#5a3418', e: '#33200e' };
  const ink = { Y: ['K', 'O'], y: ['K', 'O'], o: ['K', 'O'], O: ['K', 'K'], c: ['K', 'C'], C: ['K', 'K'], e: ['K', 'K'] };
  const W = 14, H = 26;
  const stalk = (g, top, x = 7) => { for (let y = top; y <= 24; y++) { put(g, x, y, '2'); put(g, x + 1, y, '3'); } };
  const lf = (g, x, y, right) => stamp(g, x, y, right ? `\n.112.\n12223\n.2233\n...3.` : `\n.211.\n32221\n3322.\n.3...`);
  const sprout = art(W, H, `
.....1..1.....
.....21.12....
......2.2.....
.......3......
.....mMMn.....
....MMMMnn....`);
  const young = grid(W, H);
  stalk(young, 14); lf(young, 8, 15, true); lf(young, 2, 18, false); lf(young, 8, 20, true);
  stamp(young, 5, 12, `\n.11.\n1223\n.33.`);
  mound(young, 7, 25, 2);
  const grown = grid(W, H);
  stalk(grown, 7); lf(grown, 8, 9, true); lf(grown, 2, 12, false); lf(grown, 8, 15, true); lf(grown, 2, 19, false);
  stamp(grown, 4, 3, `
..1y1.
.12yy2.
.2y2y3.
..2233.
...33..`);
  mound(grown, 7, 25, 2);
  const ripe = grid(W, H);
  stalk(ripe, 11); lf(ripe, 8, 13, true); lf(ripe, 2, 15, false); lf(ripe, 8, 19, true);
  // the head: petals ring + seed disc, tilted toward the viewer / right
  ell(ripe, 7, 6, 6.6, 6, null, {
    cb: (x, y, d, u, v) => {
      const r = Math.hypot(u, v);
      if (r > 0.52) { // petals: alternate light/mid by angle, shade at the lower right
        const a = Math.atan2(v, u), pet = Math.cos(a * 11) > -0.2;
        if (r > 0.9 && !pet) return null;
        return d < -0.1 ? 'o' : pet ? (d > 0.45 ? 'Y' : 'y') : 'o';
      }
      // seed disc: brown with a checker of darker seeds and a lit upper-left rim
      const seed = (x + y) % 2 === 0;
      return d > 0.55 ? 'c' : seed ? 'C' : (d > 0.1 ? 'c' : 'e');
    },
  });
  mound(ripe, 7, 25, 2);
  const wilt = grid(W, H);
  for (let y = 9; y <= 24; y++) put(wilt, 7, y, y < 12 ? 'U' : 'v');
  stamp(wilt, 3, 6, `
..uUUu.
.uvVVvU
..UvvU.
...U...`);
  stamp(wilt, 8, 14, `\nUu.\n.vU\n..v`); stamp(wilt, 3, 17, `\n.uU\nUv.\nv..`);
  mound(wilt, 7, 25, 2);
  return { pal, ink, frames: [sprout, young, grown, ripe, wilt], W, H };
}

// ============ strawberry (12×12), low plant ============
function strawberry() {
  const pal = { R: '#ff5a6a', r: '#e02a40', S: '#9a1430', s: '#5e0a1e', Z: '#ffe9a0', F: '#fffbe8', f: '#e8d8b0' };
  const ink = { R: ['s', 'S'], r: ['s', 'S'], S: ['s', 's'], F: ['k', 'f'], f: ['k', 'k'], Z: ['k', 'k'] };
  const W = 12, H = 12;
  const sprout = art(W, H, `
....1..1....
....21.12...
.....2.2....
......3.....
....mMMn....
...MMMMnn...`);
  const young = art(W, H, `
.....11.....
..11.12..1..
.1222.2.122.
.2232.3.2232
..23.333.3..
....3333....
....mM3n....
...MMMMnn...`);
  const LEAVES = `
....11.11...
..11221122..
.12223.2232.
1222332.2232
.2233.33.33.
..3.3333.3..
....3333....`;
  const grown = art(W, H, LEAVES + `\n....mM3n....\n...MMMMnn...`);
  stamp(grown, 1, 1, `\n.F.\nFZf\n.f.`); stamp(grown, 8, 3, `\n.F.\nFZf\n.f.`);
  const ripe = art(W, H, LEAVES + `\n....mM3n....\n...MMMMnn...`);
  const berry = (x, y) => stamp(ripe, x, y, `\n.33.\nRrrS\nRZrS\n.rS.\n..S.`.replace(/\n\.33\./, '\n.23.'));
  berry(0, 4); berry(7, 5); berry(3, 6);
  stamp(ripe, 8, 0, `\n.F.\nFZf\n.f.`);
  const wilt = art(W, H, `
....u..u....
..uUU.vUu...
.uUvv.vvUu..
uv..vvv..vU.
.....vv.....
....mMvn....
...MMMMnn...`);
  put(wilt, 2, 9, 'S'); put(wilt, 3, 9, 's');
  return { pal, ink, frames: [sprout, young, grown, ripe, wilt], W, H };
}

function pack(id, c) {
  const pal = { ...BASE, ...c.pal }, ink = { ...INK, ...c.ink };
  const fr = c.frames.map(f => finish(typeof f === 'string' ? art(c.W, c.H, f) : f, ink));
  // keep only palette entries used
  const used = new Set(fr.flatMap(g => g.flat()));
  const palette = Object.fromEntries(Object.entries(pal).filter(([k]) => used.has(k)));
  return { id, anchor: [c.W / 2, c.H], palette, frames: { grow: fr.slice(0, 4), wilt: [fr[4]] } };
}
export function build() {
  return {
    crop_carrot: pack('crop_carrot', { ...CARROT, W: 12, H: 16 }),
    crop_cabbage: pack('crop_cabbage', cabbage()),
    crop_pumpkin: pack('crop_pumpkin', pumpkin()),
    crop_tomato: pack('crop_tomato', tomato()),
    crop_sunflower: pack('crop_sunflower', sunflower()),
    crop_strawberry: pack('crop_strawberry', strawberry()),
  };
}
