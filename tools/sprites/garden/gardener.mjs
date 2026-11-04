// The gardener: a chunky little guy (big straw hat with a team band, team overalls, boots) with a rake. 18×26, anchor feet.
// Built per frame from parts: far arm, legs, torso (outlined together by mask), then the hand-drawn head stamp (its own ink),
// the near arm and the rake (own ink). Faces right.
import { grid, put, get, line, stamp, outline, parse, clone, shift, erase } from './lib.mjs';

export const W = 18, H = 26;
export const PAL = {
  k: '#24180f',                                  // warm ink
  a: '#f2d2b0', s: '#e8c39e', S: '#c9a07a', z: '#8a5a3a', p: '#f09a86',   // skin + blush
  Y: '#fbe7a1', y: '#e9c46a', h: '#b98b3e', j: '#7a5526',                  // straw
  L: 'teamlight', T: 'team', D: 'teamdark',
  c: '#f4ecd8', C: '#d6c6a2',                    // shirt
  H: '#8a5432', I: '#5e3820',                    // hair
  o: '#8a5634', O: '#55331d', q: '#33200f',      // boots
  w: '#b48a52', W: '#8a6a3a', b: '#5a3a18', B: '#3b2614',   // wood (handle)
  m: '#f0f3f5', M: '#a6acb3', N: '#626970', n: '#26323b',   // steel
  g: '#ffe28a', G: '#c8961e',                    // brass buttons
  e: '#9fd8ff', E: '#4c95dc', F: '#2b5aa0',      // water
  v: '#e2ecee', V: '#a6bcc3', X: '#64808a', K: '#2c3a40',      // galvanised watering can
  x: '#ffffff',
};

// ---------------- heads (hat + face), 16 wide, ink baked in. Placed with top-left at (hx, hy). ----------------
// facing right, 3/4
const HEAD = {
  R: `
.....kkkkkk.....
....kYYyyyhk....
....kYyyyyhk....
..kkLTTTTTDDkk..
.kYYYyyyyyyyhhk.
kYYyyyyyyyyyyyhk
khYyyyyyyyyyyhjk
.kjhhhhhhhhhhjk.
..kIHSSSSSSSk...
..kHzsssssssk...
..kHSsssssssak..
..kSSsssssssk...
...kSSSsssSk....
....kkkkkkk.....`,
  // front view (spin)
  F: `
.....kkkkkk.....
....kYYyyyhk....
....kYyyyyhk....
..kkLTTTTTDDkk..
.kYYYyyyyyyyhhk.
kYYyyyyyyyyyyyhk
khYyyyyyyyyyyhjk
.kjhhhhhhhhhhjk.
...kISSSSSSIk...
...kssksskssk...
...ksskasskak...
...kppssssppk...
....kSsssSSk....
.....kkkkkk.....`,
  // back view (spin)
  B: `
.....kkkkkk.....
....kYYyyyhk....
....kYyyyyhk....
..kkLTTTTTDDkk..
.kYYYyyyyyyyhhk.
kYYyyyyyyyyyyyhk
khYyyyyyyyyyyhjk
.kjhhhhhhhhhhjk.
...kIHHHHHHIk...
...kHHHHHHHIk...
...zHHHHHHIIz...
...kIHHHHIIIk...
....kIIIIIIk....
.....kkkkkk.....`,
};
// face variants for the right-facing head (rows 8..12 replaced)
// expressions for the right-facing head: pixels [x, y, ch] in head-stamp coords over the eyeless base face
const BLUSH = [[9, 11, 'p'], [10, 11, 'p'], [11, 11, 'p']];
const RING = [[9, 9], [10, 9], [11, 9], [11, 10], [11, 11], [10, 11], [9, 11], [9, 10]];
const FACE = {
  normal: [[10, 9, 'k'], [10, 10, 'k'], ...BLUSH],
  blink: [[9, 10, 'k'], [10, 10, 'k'], ...BLUSH],
  shut: [[9, 10, 'k'], [10, 10, 'k'], [8, 9, 'S'], [11, 9, 'S'], ...BLUSH],
  happy: [[9, 10, 'k'], [10, 9, 'k'], [11, 10, 'k'], [8, 11, 'p'], [9, 11, 'p'], [10, 11, 'p']],
  grit: [[10, 9, 'k'], [10, 10, 'k'], [9, 8, 'k'], [10, 8, 'k'], [9, 11, 'k'], [10, 11, 'x'], [11, 11, 'k']],
  swirlA: [...RING.filter((_, i) => i !== 6 && i !== 7).map(([x, y]) => [x, y, 'z']), [10, 10, 'k'], [8, 11, 'p'], [7, 11, 'p']],
  swirlB: [...RING.filter((_, i) => i !== 2 && i !== 3).map(([x, y]) => [x, y, 'z']), [10, 10, 'k'], [8, 11, 'p'], [7, 11, 'p']],
};
function headArt(kind = 'R', face = null) {
  const rows = parse(HEAD[kind]);
  if (kind === 'R') for (const [x, y, c] of FACE[face || 'normal']) rows[y][x] = c;
  return rows;
}

// ---------------- body parts ----------------
// torso (overalls bib over the cream shirt), unoutlined, 8 wide; placed with top-left at (tx, ty)
const TORSO = {
  R: `
CcLTTTcC
cLTTTTDC
cLgTTgDC
LTTTTTDD
LTTTTTDD`,
  F: `
CcLTTDcC
cLTgTgDC
LLTTTTDD
LTTTTTDD
LTTTTTDD`,
  B: `
CcLTTDcC
cLTTTTDC
LDTTTTDD
LTTDDTDD
LTTTTTDD`,
};
function torso(g, tx, ty, kind = 'R') { if (TORSO[kind]) stamp(g, tx, ty, TORSO[kind]); }
// a leg in team overalls from hip row 21 (x hx..hx+2) to the foot, boot at the bottom. lift raises the foot.
function leg(g, hx, fx, lift, far, hip = 21, bottom = 25) {
  const tones = far ? ['D', 'D', 'D'] : ['L', 'T', 'D'];
  const ay = bottom - 2 - lift;  // last pant row
  for (let y = hip; y <= ay; y++) {
    const t = ay === hip ? 1 : (y - hip) / (ay - hip);
    const x = Math.round(hx + (fx - hx) * t);
    tones.forEach((c, i) => put(g, x + i, y, c));
  }
  const by = bottom - 1 - lift;
  // chunky boot, toe forward (right)
  const bt = far ? ['O', 'O', 'O', 'O'] : ['o', 'o', 'o', 'O'];
  for (let i = 0; i < 3; i++) put(g, fx + i, by, i === 0 && !far ? 'o' : bt[i]);
  for (let i = 0; i < 4; i++) put(g, fx + i, by + 1, far ? 'O' : (i === 3 ? 'O' : 'o'));
}
// arm: shoulder → hand; 1 px thick sleeve for the first part, then skin; hand a 1-2 px knob
function arm(g, sx, sy, hx, hy, far, elbow = null) {
  const pts = elbow ? [...line(null, sx, sy, elbow[0], elbow[1]), ...line(null, elbow[0], elbow[1], hx, hy).slice(1)] : line(null, sx, sy, hx, hy);
  const ns = Math.max(1, pts.length - 1);
  // sleeve 2 px thick (light + shade), the hand a 1-px skin knob at the end
  pts.forEach(([x, y], i) => { if (i < ns) { put(g, x, y, far ? 'C' : 'c'); put(g, x, y + 1, far ? 'C' : 'C'); } });
  put(g, hx, hy, far ? 'S' : 's');
}

// ---------------- the rake (own ink): handle from (x0,y0) to (x1,y1); head at (x1,y1) in a given orientation ----------------
const RAKE_HEAD = {
  up: `
m.m.M
+MMMN`,  // tines up, bar at the '+' row (origin = the handle end, under the left tine… see place)
  down: `
mMMMN
m.M.N`,
  right: `
mm
M.
Mm
M.
NN`,
  left: `
mm
.M
mM
.M
NN`,
};
function rake(g, x0, y0, x1, y1, head, ox = 0, oy = 0) {
  const pts = line(null, x0, y0, x1, y1);
  pts.forEach(([x, y], i) => put(g, x, y, i < pts.length * 0.5 ? 'w' : 'W'));
  if (head && head !== 'none') {
    const art = parse(RAKE_HEAD[head]).map(r => r.map(c => c === '+' ? 'M' : c));
    const hw = art[0].length, hh = art.length;
    let px, py;
    if (head === 'up') { px = x1 - 2; py = y1 - hh; }
    else if (head === 'down') { px = x1 - 2; py = y1 + 1; }
    else if (head === 'right') { px = x1 + 1; py = y1 - 2; }
    else if (head === 'none') return;
    else { px = x1 - hw; py = y1 - 2; }
    stamp(g, px + ox, py + oy, art);
    return { px: px + ox, py: py + oy, hw, hh };
  }
}
// ink around rake + handle where they touch empty space (selective: below/right side only for the handle)
function rakeInk(g, before) {
  const out = clone(g);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x] !== '.') continue;
    const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => [get(g, x + dx, y + dy), get(before, x + dx, y + dy)]);
    const steel = nb.some(([c, b]) => 'mMN'.includes(c) && c !== b);
    const wood = nb.some(([c, b], i) => 'wW'.includes(c) && c !== b && (i === 0 || i === 3));  // empty cell below/right of wood
    if (steel) out[y][x] = 'n';
    else if (wood) out[y][x] = 'B';
  }
  return out;
}

// ---------------- compose ----------------
/**
 * p: { bob, lean, head:'R'|'F'|'B', face, headDx, headDy, legs:[[hx,fx,lift],[hx,fx,lift]] (far, near), torso,
 *      far:[hx,hy] hand, near:[hx,hy] hand, nearElbow, farElbow, rake:{x0,y0,x1,y1,head,front}, extra(g) before outline,
 *      after(g) at the end, sit }
 */
export function figure(p = {}) {
  const bob = p.bob || 0, lean = p.lean || 0, kind = p.head || 'R';
  let g = grid(W, H);
  const ty = 16 + bob, tx = 5 + lean;
  const legs = p.legs || [[9, 9, 0], [5, 5, 0]];
  // rake behind everything if asked
  const rk = p.rake;
  if (rk && rk.behind) rake(g, rk.x0, rk.y0, rk.x1, rk.y1, rk.head);
  // far arm
  if (p.far !== null) { const f = p.far || [4 + lean, 20 + bob]; arm(g, (kind === 'F' ? 5 : 6) + lean, ty + 1, f[0], f[1], true, p.farElbow); }
  if (p.legsFn) p.legsFn(g); else { leg(g, legs[0][0], legs[0][1], legs[0][2], true, ty + 5); leg(g, legs[1][0], legs[1][1], legs[1][2], false, ty + 5); }
  torso(g, tx, ty, p.torso || kind);
  if (p.extra) p.extra(g);
  // outline body by mask, ink k; on the lit top-left edges of team cloth use teamdark (selective)
  g = outline(g, (nb, x, y) => 'k');
  // head
  stamp(g, 1 + lean + (p.headDx || 0), 3 + bob + (p.headDy || 0), headArt(kind, p.face));
  if (p.afterHead) p.afterHead(g);
  // near arm + rake
  const before = clone(g);
  if (rk && !rk.behind) rake(g, rk.x0, rk.y0, rk.x1, rk.y1, rk.head);
  if (p.near !== null) {
    const n = p.near || [12 + lean, 20 + bob];
    const lay = grid(W, H);
    arm(lay, 11 + lean, ty + 1, n[0], n[1], false, p.nearElbow);
    const ol = outline(lay, 'k');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (lay[y][x] !== '.') g[y][x] = lay[y][x]; else if (ol[y][x] === 'k' && g[y][x] === '.') g[y][x] = 'k'; }
  }
  if (p.prop) p.prop(g);
  g = rakeInk(g, before);
  // ink the near hand where it pokes into empty space
  if (p.after) p.after(g);
  return g;
}

// ---------------- frame sets ----------------
const up = (x, y0, y1) => ({ x0: x, y0, x1: x, y1, head: 'up' });
// bright smear arc pixels (drawn over, no ink)
const smear = pts => g => { for (const [x, y, c] of pts) if (get(g, x, y) === '.' || 'yYhj'.includes(get(g, x, y))) put(g, x, y, c || 'x'); };
// watering can stamps (own ink): level and tipped
const CAN = {
  level: `
.KKKK......
K.vvVK.....
KvvvvVK..KK
KvvvvVKKKvK
KvvvVVXvvK.
KvvVVXXKK..
.KKKKKK....`,
  tip: `
..KKK.......
.K...K......
KvvvvK......
KvvvvVKK....
KvvvVVXKK...
.KvVVXXvvKK.
..KKKKKKvvK.
........KK..`,
};
const WX = [2, 1, 0, -1, -2, -1, 0, 1], WL = [0, 0, 0, 0, 0, 1, 1, 0], BOB = [0, 1, 0, -1, 0, 1, 0, -1];
function walk(f) {
  const a = f % 8, b = (f + 4) % 8, bob = BOB[f];
  const near = [6, 6 + WX[a], WL[a]], far = [8, 8 + WX[b], WL[b]];
  const sw = WX[b] > 0 ? 1 : WX[b] < 0 ? -1 : 0;             // the free (far) arm swings against the near leg
  const rs = WX[a] > 1 ? 1 : WX[a] < -1 ? -1 : 0;            // the rake hand rocks a little with the near leg
  return figure({ bob, legs: [far, near], far: [4 - sw, 20 + bob], near: [14 + rs, 19 + bob], rake: up(15 + rs, 22 + bob, 3 + bob) });
}
export function build() {
  const idle = [
    figure({ rake: up(15, 24, 2), near: [14, 19] }),
    figure({ bob: 1, rake: up(15, 24, 3), near: [14, 20], far: [4, 21] }),
    figure({ bob: 1, rake: up(15, 24, 3), near: [14, 20], far: [4, 21], face: 'blink' }),
    figure({ rake: up(15, 24, 2), near: [14, 19], far: [5, 21] }),
  ];
  const walkS = [0, 1, 2, 3, 4, 5, 6, 7].map(walk);
  const wide = [[10, 11, 0], [5, 4, 0]];
  const bonk = [
    // 0: the strike, rake head slammed into the ground in front, smear arc over the swing
    figure({ bob: 1, lean: 1, legs: wide, face: 'grit', far: [12, 18], near: [13, 19], rake: { x0: 11, y0: 16, x1: 15, y1: 21, head: 'down' },
      after: smear([[8, 0], [9, 0], [10, 0, 'm'], [11, 1], [12, 1], [13, 2], [14, 2, 'm'], [15, 3], [16, 4], [16, 5, 'm'], [17, 6], [17, 7], [17, 8], [17, 9, 'm'], [17, 10], [17, 11]]) }),
    // 1: impact hold / bounce
    figure({ bob: 1, lean: 1, legs: wide, face: 'grit', far: [12, 18], near: [13, 19], rake: { x0: 11, y0: 15, x1: 15, y1: 20, head: 'down' } }),
    // 2: follow-through, rake rising
    figure({ lean: 1, legs: wide, far: [11, 19], near: [14, 18], rake: { x0: 14, y0: 23, x1: 16, y1: 5, head: 'up' } }),
    // 3: recover
    figure({ legs: [[9, 9, 0], [5, 5, 0]], near: [14, 19], rake: up(15, 23, 3) }),
  ];
  const charge = [
    figure({ bob: 1, lean: -1, legs: wide, face: 'grit', far: [9, 17], near: [10, 17], rake: { x0: 12, y0: 19, x1: 4, y1: 2, head: 'up', behind: true } }),
    figure({ bob: 1, lean: 0, headDx: -1, legs: wide, face: 'grit', far: [9, 17], near: [11, 17], rake: { x0: 13, y0: 19, x1: 5, y1: 2, head: 'up', behind: true } }),
  ];
  const spin = [
    figure({ head: 'F', legs: [[9, 9, 0], [6, 6, 0]], far: [4, 20], near: [13, 19], rake: { x0: 11, y0: 19, x1: 15, y1: 19, head: 'right' } }),
    flipXg(figure({ legs: [[9, 9, 0], [5, 5, 0]], near: [13, 20], far: [5, 20], rake: { x0: 12, y0: 20, x1: 14, y1: 22, head: 'down' } })),
    figure({ head: 'B', torso: 'B', legs: [[9, 9, 0], [6, 6, 0]], near: [13, 20], far: [4, 19], rake: { x0: 6, y0: 19, x1: 2, y1: 19, head: 'left', behind: true } }),
    figure({ legs: [[9, 9, 0], [5, 5, 0]], near: [12, 20], far: [5, 19], rake: { x0: 8, y0: 18, x1: 3, y1: 10, head: 'up', behind: true } }),
  ];
  const can = (kind, x, y, drops = []) => g => { stamp(g, x, y, CAN[kind]); for (const [dx, dy, c] of drops) put(g, dx, dy, c || 'E'); };
  const water = [
    figure({ near: [13, 19], far: [5, 20], prop: can('level', 10, 16), rake: null }),
    figure({ lean: 1, near: [13, 19], far: [5, 20], prop: can('tip', 9, 16), rake: null }),
    figure({ lean: 1, bob: 1, near: [13, 20], far: [5, 21], prop: can('tip', 9, 17, [[17, 21, 'e'], [17, 22], [16, 24, 'e'], [17, 25]]), rake: null }),
    figure({ lean: 1, near: [13, 19], far: [5, 20], prop: can('tip', 9, 16, [[17, 20, 'e'], [17, 21], [17, 23, 'e'], [16, 24], [17, 25, 'e']]), rake: null }),
  ];
  const dz = [[-1, 0, 16, 4], [0, 1, 16, 3], [1, 0, 15, 3], [0, -1, 16, 4]];
  const dizzy = dz.map(([lean, hdx, rx, ry], i) => figure({ lean, headDx: hdx, face: i % 2 ? 'swirlB' : 'swirlA', legs: [[9, 9 + (i === 1 ? 1 : 0), 0], [5, 5 - (i === 3 ? 1 : 0), 0]], near: [14 + lean, 20], far: [4 + lean, 21], rake: { x0: 14, y0: 25, x1: rx + lean, y1: ry + 3, head: 'up' } }));
  // sitting on the ground hugging the knees, the rake leaning beside him
  const SIT = `
.CcLTTTcC....
.cLTgTgDC.LL.
.LTTTTTDDLTTD
.LTTTTTDDTTTD
.LTTTTTTTTTDD
..DDDDDDDDooo
..........oOO`;
  const sit = bob => figure({
    bob, face: 'shut', far: null, near: null, legsFn: () => {}, torso: 'none',
    rake: { x0: 3, y0: 25, x1: 5, y1: 4, head: 'up', behind: true },
    extra: g => stamp(g, 4, 19, SIT),
    after: g => { stamp(g, 11, 20 + (bob - 4), `\ncs\nss`); },
  });
  const sleep = [sit(4), sit(5)];
  const cheer = [
    figure({ face: 'happy', far: [2, 12], farElbow: [2, 16], near: [16, 12], nearElbow: [15, 16], rake: up(16, 18, 2) }),
    figure({ bob: -1, face: 'happy', legs: [[9, 10, 1], [5, 4, 1]], far: [1, 10], farElbow: [2, 15], near: [16, 10], nearElbow: [15, 15], rake: up(16, 16, 1) }),
  ];
  return { idle, walk: walkS, bonk, charge, spin, water, dizzy, sleep, cheer };
}
function flipXg(g) { const out = g.map(r => r.slice().reverse()); return out.map(r => [...r.slice(0)]); }
