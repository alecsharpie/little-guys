// The gardener: a chunky little guy (big straw hat with a team band, team overalls, boots) with a rake. 18×26, anchor feet.
// Built per frame from parts: far arm, legs, torso (outlined together by mask), then the hand-drawn head stamp (its own ink),
// the near arm and the rake (own ink). Faces right.
import { grid, put as putA, get, line, stamp as stampA, outline, parse, clone } from './lib.mjs';
// The canvas is 30×30 with the feet at [15,30]; all figure coordinates below are in the original 18×26 frame
// (feet at x 9, ground row 25) and are shifted by (OX, OY) when painted, so poses may reach into negative coords.
const OX = 6, OY = 4;
const put = (g, x, y, c) => putA(g, x + OX, y + OY, c);
const stamp = (g, x, y, art, plus, map) => stampA(g, x + OX, y + OY, art, plus, map);
const getL = (g, x, y) => get(g, x + OX, y + OY);

export const W = 30, H = 30;
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
  d: '#7a4f33', r: '#a87650', t: '#4e301e',     // kicked-up soil
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
  squeeze: [[9, 9, 'k'], [10, 10, 'k'], [9, 11, 'k'], [8, 9, 'S'], [11, 12, 'k'], [12, 12, 'k']],
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
  const hx0 = 1 + lean + (p.headDx || 0), hy0 = 3 + bob + (p.headDy || 0), art = headArt(kind, p.face);
  if (p.hatUp) {
    // the hat pops off the head: paint the face + a hair dome, then the hat (rows 0..7) higher up, optionally nudged sideways
    const face = art.map((r, j) => j < 6 ? r.map(() => '.') : j === 6 ? [...'...kkIIIIIkk....'] : j === 7 ? [...(kind === 'B' ? '..kIHHHHHHHIk...' : '..kIHHHHHHHzk...')] : r);
    stamp(g, hx0, hy0, face);
    stamp(g, hx0 + (p.hatDx || 0), hy0 - p.hatUp, art.slice(0, 8));
  } else stamp(g, hx0, hy0, art);
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
const smear = pts => g => { for (const [x, y, c] of pts) if (getL(g, x, y) === '.' || 'yYhj'.includes(getL(g, x, y))) put(g, x, y, c || 'x'); };
// a bold motion-smear band: cells whose distance from (cx,cy) is in [r0,r1] (y scaled by sy) and angle (deg, screen, y down)
// between a0 and a1. Leading edge (near a1) is full width white→team light; it thins toward a0. Only paints empty cells.
const arcSmear = (cx, cy, r0, r1, a0, a1, sy = 1, over = '') => g => {
  for (let y = -6; y < 28; y++) for (let x = -8; x < 26; x++) {
    const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) / sy, r = Math.hypot(dx, dy);
    let a = Math.atan2(dy, dx) * 180 / Math.PI;
    const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
    while (a < lo) a += 360; while (a > lo + 360) a -= 360;
    if (a > hi) continue;
    const t = (a - a0) / (a1 - a0);                    // 0 at the tail, 1 at the leading edge
    const w = (r1 - r0) * (0.35 + 0.65 * t);
    if (r < r1 - w || r > r1) continue;
    const c = getL(g, x, y);
    if (c !== '.' && !over.includes(c)) continue;
    put(g, x, y, r > r1 - w * 0.5 && t > 0.25 ? 'x' : 'L');
  }
};
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
  // ---- bonk: 0 smear strike, 1 impact hold, 2 follow-through bounce, 3-5 recover through a diagonal to idle ----
  const lunge = [[10, 13, 0], [5, 3, 0]];
  const dirt = pts => g => { for (const [x, y, c] of pts) put(g, x, y, c); };
  const bonk = [
    figure({ bob: 1, lean: 2, legs: lunge, face: 'grit', hatUp: 1, hatDx: -1, far: [13, 18], near: [14, 18],
      rake: { x0: 12, y0: 15, x1: 20, y1: 23, head: 'down' },
      after: g => { arcSmear(11, 16, 10, 13.5, -130, 38, 1)(g); } }),
    figure({ bob: 2, lean: 2, legs: lunge, face: 'grit', far: [13, 19], near: [14, 19],
      rake: { x0: 12, y0: 16, x1: 20, y1: 24, head: 'down' },
      after: dirt([[17, 22, 'r'], [18, 21, 'd'], [23, 21, 'r'], [24, 22, 'd'], [21, 20, 't'], [16, 24, 'd'], [24, 24, 'r']]) }),
    figure({ bob: 1, lean: 2, legs: lunge, face: 'grit', far: [13, 18], near: [14, 18],
      rake: { x0: 12, y0: 14, x1: 20, y1: 19, head: 'down' },
      after: dirt([[18, 18, 'd'], [23, 17, 'r'], [21, 15, 't']]) }),
    figure({ bob: 0, lean: 1, legs: [[10, 11, 0], [5, 4, 0]], far: [12, 19], near: [14, 18],
      rake: { x0: 11, y0: 22, x1: 19, y1: 6, head: 'up' } }),
    figure({ lean: 0, legs: [[9, 10, 0], [5, 5, 0]], far: [6, 20], near: [14, 19],
      rake: { x0: 14, y0: 24, x1: 17, y1: 3, head: 'up' } }),
    figure({ rake: up(15, 24, 2), near: [14, 19], far: [5, 20] }),
  ];
  // ---- charge: 0-1 wind-up (once), 2-3 the coiled hold (loop, 1 px shake, glint on the tines) ----
  const coil = [[9, 11, 0], [5, 2, 0]];
  const glint = (pts) => g => { for (const [x, y, c] of pts) put(g, x, y, c); };
  const charge = [
    figure({ lean: -1, legs: [[9, 10, 0], [5, 4, 0]], face: 'grit', far: [10, 17], near: [11, 17],
      rake: { x0: 13, y0: 20, x1: 6, y1: 1, head: 'up', behind: true }, after: arcSmear(10, 18, 13, 15, -80, -110, 1) }),
    figure({ bob: 2, lean: -2, legs: coil, face: 'grit', far: [9, 17], near: [10, 17],
      rake: { x0: 13, y0: 20, x1: -3, y1: 5, head: 'up', behind: true }, after: arcSmear(9, 17, 12, 14, -95, -140, 1) }),
    figure({ bob: 2, lean: -2, legs: coil, face: 'grit', far: [9, 17], near: [10, 17],
      rake: { x0: 13, y0: 20, x1: -3, y1: 5, head: 'up', behind: true }, after: glint([[-5, 3, 'x'], [-5, 2, 'L']]) }),
    figure({ bob: 2, lean: -1, headDx: 0, legs: coil, face: 'grit', far: [10, 17], near: [11, 17],
      rake: { x0: 14, y0: 20, x1: -2, y1: 5, head: 'up', behind: true }, after: glint([[-1, 3, 'x'], [-1, 2, 'L']]) }),
  ];
  // ---- spin: a whirl, rake out at arm's length sweeping round (screen ellipse rx 12, ry 6 about the hands) ----
  const SC = [9, 19];
  const tip = deg => [Math.round(SC[0] + Math.cos(deg * Math.PI / 180) * 12), Math.round(SC[1] + Math.sin(deg * Math.PI / 180) * 6)];
  const trail = (deg, dir = 1) => g => {   // smear trailing the tip back along the ellipse (the rake turns toward smaller angles)
    for (let k = 4; k <= 75; k += 2) {
      const a = (deg + k * dir) * Math.PI / 180, t = 1 - k / 75;
      for (const r of [12, 11, 13]) {
        if (r !== 12 && t < 0.45) continue;
        const x = Math.round(SC[0] + Math.cos(a) * r), y = Math.round(SC[1] + Math.sin(a) * r / 2);
        if (getL(g, x, y) === '.') put(g, x, y, t > 0.55 && r === 12 ? 'x' : 'L');
      }
    }
  };
  const spinFrame = (deg, view, flip) => {
    const [tx, ty] = tip(deg);
    const head = view === 'F' ? 'down' : tx > SC[0] + 6 ? 'right' : tx < SC[0] - 6 ? 'left' : 'down';
    const behind = Math.sin(deg * Math.PI / 180) < -0.3;
    const hand = [Math.round(SC[0] + Math.cos(deg * Math.PI / 180) * 5), 19];
    const g = figure({ head: view === 'B' ? 'B' : view === 'F' ? 'F' : 'R', torso: view === 'B' ? 'B' : view === 'F' ? 'F' : 'R',
      legs: view === 'F' || view === 'B' ? [[9, 9, 0], [6, 6, 0]] : [[9, 10, 0], [5, 4, 0]],
      far: view === 'F' ? [4, 20] : [5, 20], near: hand,
      rake: { x0: hand[0], y0: 19, x1: tx, y1: ty, head, behind } , after: trail(deg, flip ? -1 : 1) });
    return flip ? flipXg(g) : g;
  };
  // front (rake toward the viewer) → ¾ → side (rake 12 px forward) → back (rake away) → side (facing left) → ¾
  const spin = [spinFrame(90, 'F'), spinFrame(40, 'R'), spinFrame(0, 'R'), spinFrame(-90, 'B'), spinFrame(0, 'R', true), spinFrame(40, 'R', true)].map((g, i) => g);
  // spinFrame(…, flip) mirrors the body; the rake angle is mirrored before painting so the result points the right way
  // ---- hurt: knocked backwards, hat popping up, eyes squeezed, rake flung up ----
  const hurt = [
    figure({ lean: -2, legs: [[8, 7, 0], [5, 3, 1]], face: 'squeeze', hatUp: 3, hatDx: -1, far: [2, 15], farElbow: [3, 18], near: [14, 12], nearElbow: [13, 16],
      rake: { x0: 17, y0: 19, x1: 12, y1: -2, head: 'up' } }),
    figure({ lean: -3, bob: -1, legs: [[8, 6, 1], [5, 2, 2]], face: 'squeeze', hatUp: 5, hatDx: -2, far: [1, 14], farElbow: [2, 17], near: [13, 11], nearElbow: [13, 15],
      rake: { x0: 19, y0: 16, x1: 8, y1: -3, head: 'up' } }),
  ];
  // ---- pluck: crouch and grab, yank upward, arms high ----
  const pluck = [
    figure({ bob: 3, lean: 2, legs: [[10, 12, 0], [5, 4, 0]], face: 'grit', far: [13, 24], near: [15, 24], farElbow: [11, 22], nearElbow: [14, 22], rake: null }),
    figure({ bob: -1, lean: -1, legs: [[9, 11, 0], [5, 3, 0]], face: 'grit', hatUp: 1, far: [12, 15], near: [13, 14], farElbow: [10, 18], nearElbow: [13, 18], rake: null,
      after: dirt([[15, 23, 'r'], [17, 22, 'd'], [13, 24, 'd'], [18, 24, 't']]) }),
    figure({ bob: -2, face: 'happy', hatUp: 1, legs: [[9, 10, 1], [5, 4, 1]], far: [1, 8], farElbow: [2, 13], near: [16, 8], nearElbow: [15, 13], rake: null }),
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
  return { idle, walk: walkS, bonk, charge, spin, water, dizzy, sleep, cheer, hurt, pluck };
}
function flipXg(g) { const out = g.map(r => r.slice().reverse()); return out.map(r => [...r.slice(0)]); }
