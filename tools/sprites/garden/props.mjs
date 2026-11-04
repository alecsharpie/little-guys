// Garden scenery: plot (raised bed, 4 soil states), grass tiles (seamless), tufts, flowers, stones, bush, shed, barrel.
import { grid, put, get, stamp, ell, line, rect, clone, parse, hash, outline } from './lib.mjs';

const WOOD = { w: '#c09060', W: '#a07a4a', b: '#8a6a3a', B: '#5a3a18', d: '#3b2614', k: '#24180f' };
// generic outline: empty cells next to filled ones become ink; cells above/left of the shape take a softer rim tone
function ink(g, inkCh, rimFor = null, skip = '') {
  const out = clone(g), H = g.length, W = g[0].length;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x] !== '.') continue;
    const nb = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([dx, dy]) => get(g, x + dx, y + dy)).map(c => skip.includes(c) ? '.' : c);
    if (nb.every(c => c === '.')) continue;
    const upperLeft = (nb[0] !== '.' || nb[1] !== '.') && nb[2] === '.' && nb[3] === '.';
    const c = nb.find(c => c !== '.');
    out[y][x] = upperLeft && rimFor && rimFor(c) ? rimFor(c) : (typeof inkCh === 'function' ? inkCh(c) : inkCh);
  }
  return out;
}

// ======================= plot 60×44 =======================
const SOILS = {
  wet: { l: '#6e4a30', m: '#5a3826', s: '#432818', d: '#2e1a10', glint: true },
  ok: { l: '#9a6a44', m: '#7a4f33', s: '#5a3826', d: '#3e2619' },
  dry: { l: '#c4a074', m: '#a8845a', s: '#86663f', d: '#5e462a', cracks: 1 },
  dead: { l: '#a39684', m: '#857868', s: '#655a4c', d: '#443c32', cracks: 2, weeds: true },
};
function plot() {
  const W = 60, H = 44;
  const pal = { ...WOOD, '1': '', '2': '', '3': '', '4': '', g: '#dff4ff', G: '#9cc8e0', n: '#9aa0a6', N: '#5f656c',
    e: '#8fd06a', E: '#4f9e47', F: '#2f6e34', y: '#ffe680' };
  const frames = [];
  const pals = {};
  for (const [name, S] of Object.entries(SOILS)) {
    const g = grid(W, H);
    // soil bed interior x 4..55, y 5..33 (front plank covers below)
    for (let y = 4; y <= 34; y++) for (let x = 3; x <= 56; x++) {
      // tilled rows: period 4 → ridge (lit top), body, groove shade, groove deep
      const ph = (y - 5) % 4;
      let c = ['1', '2', '2', '3'][ph];
      const h = hash(x, y, 3);
      if (ph === 0 && h < 0.12) c = '2';            // ridge crumbs
      else if (ph === 2 && h < 0.08) c = '1';       // a lit clod on the slope
      else if (ph === 3 && h < 0.15) c = '4';       // deeper bits in the groove
      if (y <= 5) c = '4';                        // shadow under the back plank
      else if (x <= 4 || y === 6 && c === '1') c = '3';   // shadow along the left plank
      g[y][x] = c;
    }
    // cracks for dry / dead
    if (S.cracks) {
      const n = S.cracks === 1 ? 7 : 13;
      for (let i = 0; i < n; i++) {
        let x = 6 + Math.floor(hash(i, 1, name.length) * 48), y = 7 + Math.floor(hash(i, 2, name.length) * 24);
        for (let k = 0; k < 3 + S.cracks * 2; k++) { if (get(g, x, y) !== '.') g[y][x] = '4'; x += hash(i, k, 9) < 0.5 ? 1 : -1; if (hash(i, k, 7) < 0.45) y += 1; }
      }
    }
    // glistening puddle glints on wet soil
    if (S.glint) for (let i = 0; i < 9; i++) {   // wet sheen: short shiny streaks along the ridges
      const x = 7 + Math.floor(hash(i, 5, 1) * 44), y = 9 + 4 * Math.floor(hash(i, 6, 1) * 6);
      put(g, x, y, 'G'); put(g, x + 1, y, 'g'); put(g, x + 2, y, 'G');
    }
    // ---- wooden edging ----
    // back plank (top edge, thin): top surface 2 rows lit, inner face 1 row
    rect(g, 1, 1, 58, 1, 'w'); rect(g, 1, 2, 58, 1, 'W'); rect(g, 2, 3, 56, 1, 'B');
    // side planks: top surfaces 2 px wide, lit on the left one
    rect(g, 1, 1, 2, 34, 'W'); rect(g, 1, 1, 1, 34, 'w');
    rect(g, 57, 1, 2, 34, 'b'); rect(g, 58, 1, 1, 34, 'W');
    rect(g, 56, 3, 1, 32, 'B');   // inner shadow face of the right plank (we see its inside)
    // front plank: top surface 2 rows + front face 6 rows with grain, end grain at corners
    rect(g, 1, 35, 58, 2, 'w'); rect(g, 1, 36, 58, 1, 'W');
    rect(g, 1, 37, 58, 5, 'b');
    for (let x = 2; x < 58; x++) { if (hash(x, 1, 11) < 0.18) put(g, x, 38 + Math.floor(hash(x, 2, 11) * 3), 'B'); }
    line(g, 3, 39, 20, 39, (x) => hash(x, 3, 1) < 0.5 ? 'B' : null); line(g, 33, 40, 52, 40, (x) => hash(x, 4, 1) < 0.5 ? 'B' : null);
    rect(g, 1, 41, 58, 1, 'B');
    // plank seam on the front and nails
    put(g, 29, 37, 'B'); put(g, 29, 38, 'B'); put(g, 29, 39, 'B'); put(g, 29, 40, 'B');
    for (const x of [4, 26, 32, 55]) { put(g, x, 38, 'n'); put(g, x, 39, 'N'); }
    // corner posts poke up 1 px with lit tops
    for (const x of [1, 57]) { rect(g, x, 0, 2, 1, 'w'); rect(g, x, 35, 2, 1, 'w'); }
    rect(g, 1, 37, 2, 5, 'W'); rect(g, 57, 37, 2, 5, 'B');
    // weeds on dead soil
    if (S.weeds) {
      stamp(g, 8, 20, `\n.e.e\neEeE\n.FE.`); stamp(g, 47, 27, `\ne..e\nEeeE\n.EF.`); stamp(g, 30, 8, `\n.y.\neEe\n.F.`);
    }
    const out = ink(g, 'k', c => 'BbWw'.includes(c) ? 'd' : null);
    frames.push(out);
    pals[name] = S;
  }
  // soil tones differ per state: use distinct chars per state so one palette covers all four
  const remap = { wet: 'abcd', ok: 'ABCD', dry: 'pqrs', dead: 'PQRS' };
  const palette = { ...WOOD, g: '#d8e8ee', G: '#8a7a78', n: '#c4c8cc', N: '#5f656c', e: '#8fd06a', E: '#4f9e47', F: '#2f6e34', y: '#ffe680' };
  Object.entries(SOILS).forEach(([name, S], i) => {
    const ch = remap[name];
    palette[ch[0]] = S.l; palette[ch[1]] = S.m; palette[ch[2]] = S.s; palette[ch[3]] = S.d;
    frames[i] = frames[i].map(r => r.map(c => '1234'.includes(c) ? ch['1234'.indexOf(c)] : c));
  });
  return { id: 'plot', anchor: [30, 22], palette, frames: { soil: frames } };
}

// ======================= grass 32×32 seamless =======================
function grass() {
  const palette = { a: '#8fd06a', b: '#6cbf55', c: '#5bb04d', d: '#4f9e47', e: '#3a7d3e', f: '#a8dc7c' };
  const frames = [];
  for (let v = 0; v < 3; v++) {
    const g = grid(32, 32, 'b');
    // large soft patches of a slightly different mid (wrapped low-frequency noise)
    const P = (x, y, c) => { g[((y % 32) + 32) % 32][((x % 32) + 32) % 32] = c; };
    // a few small soft patches of a slightly deeper mid (wrapped blobs, so any variant can sit next to any other)
    for (let i = 0; i < 4; i++) {
      const cx = hash(i, v, 31) * 32, cy = hash(i, v, 32) * 32, rx = 2.5 + hash(i, v, 33) * 2.5, ry = rx * 0.6;
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++)
        if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) P(x, y, 'c');
    }
    // blade marks: little "v" / "|" strokes, wrapped
    const N = 22;
    for (let i = 0; i < N; i++) {
      const x = Math.floor(hash(i, v, 21) * 32), y = Math.floor(hash(i, v, 22) * 32), t = hash(i, v, 23);
      if (t < 0.45) { P(x, y, 'd'); P(x + 2, y, 'd'); P(x + 1, y + 1, 'd'); P(x, y - 1, 'a'); }             // a little v tuft, lit tip
      else if (t < 0.75) { P(x, y, 'd'); P(x, y - 1, 'a'); }                                              // single blade
      else if (t < 0.9) { P(x, y, 'a'); P(x + 1, y, 'a'); P(x + 1, y + 1, 'd'); }                         // lit fleck with shadow
      else { P(x, y, 'e'); P(x + 1, y, 'd'); }                                                            // dark divot
    }
    if (v === 2) { P(9, 20, 'f'); P(10, 19, 'f'); P(24, 7, 'f'); }
    frames.push(g);
  }
  return { id: 'grass', anchor: [0, 0], palette, frames: { idle: frames } };
}

// ======================= tufts 8×6 =======================
function tufts() {
  const palette = { a: '#a6e05a', b: '#6cbf55', c: '#4f9e47', d: '#3a7d3e', k: '#1c4a2c' };
  const T = [`
...a....
.a.ba.a.
.bab.ab.
abcbcbc.
.cdcdcd.
..dddd..`, `
..a..a..
.ab.ab..
.bc.bca.
abcbcbc.
.cdcdc..
..ddd...`, `
....a...
..a.b.a.
.abcbab.
.bcbcbcd
..cdcd..
........`];
  const frames = T.map(t => { const g = grid(8, 6); stamp(g, 0, 0, t); return g; });
  return { id: 'tufts', anchor: [4, 6], palette, frames: { idle: frames } };
}

// ======================= flowers 7×7 =======================
function flowers() {
  const palette = { a: '#a6e05a', b: '#5fb83f', c: '#2f7d3a', k: '#1c2a1e',
    W: '#ffffff', w: '#e4e0f0', y: '#ffd23a', Y: '#fff08a', o: '#d08a1a',
    V: '#c69cff', v: '#8a5ad8', u: '#5a3192', P: '#ffd0e4', p: '#f08ab8', q: '#b04a80' };
  const F = [
    // daisy
    `
..W....
.WyW...
..Ww.W.
..b.WyW
.ab..w.
..bab..
..cb...`,
    // buttercup
    `
.......
..YyY..
.yYoy..
..yob..
...b.Y.
.ab.yoy
..bcb..`,
    // violet
    `
..V....
.VvuV..
..vV...
..b..V.
.abVvuV
..bcvV.
...cb..`,
    // clover
    `
.......
..PpP..
.PppqP.
..pqq..
.ab.b..
abcbab.
.bc.cb.`,
  ];
  const frames = F.map(t => { const g = grid(7, 7); stamp(g, 0, 0, t); return g; });
  return { id: 'flowers', anchor: [3, 7], palette, frames: { idle: frames } };
}

// ======================= stones =======================
function stones() {
  const palette = { a: '#e2dcd0', b: '#b8b0a2', c: '#8a8274', d: '#5e584e', k: '#2e2a24', g: '#6cbf55', G: '#4f9e47' };
  const S = [`
....kkk.....
..kkaabkk...
.kaabbbcck..
.kbbbbccdk..
..kccddkkkk.
...kkkk.kbck
........kcdk
.........kk.`, `
..kkk.......
.kabbk..kk..
.kbbck.kabk.
..kkk..kcdk.
........kk..`];
  const frames = S.map(t => { const p = parse(t); const g = grid(12, 8); stamp(g, 0, 8 - p.length, p); return g; });
  return { id: 'stones', anchor: [6, 8], palette, frames: { idle: frames } };
}

// ======================= bush 26×20 =======================
function bush() {
  const W = 26, H = 20;
  const palette = { '1': '#b8ec6a', '2': '#7cc84a', '3': '#4f9e3c', '4': '#2f6e34', '5': '#1c4a2c', k: '#16301e', r: '#ff5a6a', R: '#b01e3a', x: '#ffffff', s: '#3a2a1a' };
  const g = grid(W, H);
  // clumps of leaf volumes, back to front
  const clumps = [[7, 9, 6, 5], [18, 8, 6, 5.5], [12.5, 6, 6.5, 5], [5, 13, 5, 4.5], [20.5, 13, 5, 4.5], [13, 13, 7, 5.5]];
  for (const [cx, cy, rx, ry] of clumps) ell(g, cx, cy, rx, ry, null, {
    cb: (x, y, d) => {
      // leafy texture: small scallops shift the band edge
      const j = (hash(x >> 1, y >> 1, 4) - 0.5) * 0.35;
      const t = d + j;
      return t > 0.6 ? '1' : t > 0.28 ? '2' : t > -0.05 ? '3' : t > -0.4 ? '4' : '5';
    },
  });
  // leaf-cluster highlights: little "c" shapes on the lit side
  for (const [x, y] of [[6, 5], [11, 3], [16, 4], [3, 9], [9, 9], [15, 9], [20, 6]]) { put(g, x, y, '1'); put(g, x + 1, y, '1'); put(g, x - 1, y + 1, '2'); }
  // berries
  for (const [x, y] of [[8, 11], [17, 12], [12, 15], [21, 9], [5, 15]]) { put(g, x, y, 'r'); put(g, x + 1, y, 'R'); put(g, x, y + 1, 'R'); put(g, x, y - 0, 'r'); }
  put(g, 8, 11, 'x'); put(g, 21, 9, 'x');
  const out = ink(g, 'k', c => '12'.includes(c) ? '4' : null);
  return { id: 'bush', anchor: [13, 20], palette, frames: { idle: [out] } };
}

// ======================= barrel 16×20 =======================
function barrel() {
  const W = 16, H = 20;
  const palette = { w: '#c09060', W: '#a07a4a', b: '#8a6a3a', B: '#5a3a18', d: '#3b2614', k: '#24180f',
    m: '#e6eaee', M: '#9aa0a6', N: '#5f656c', n: '#1e2a33', e: '#bfe6ff', E: '#5aa8e8', F: '#2f6eb8', G: '#1e4a8a' };
  const mk = phase => {
    const g = grid(W, H);
    // body: slightly bulging cylinder, staves 3 px; shading by x across the cylinder
    for (let y = 4; y <= 18; y++) {
      const bulge = Math.round(Math.sin(((y - 4) / 14) * Math.PI) * 1);
      const x0 = 1 - bulge + 1, x1 = 14 + bulge - 1;
      for (let x = x0; x <= x1; x++) {
        const u = (x - x0) / (x1 - x0);
        let c = u < 0.2 ? 'w' : u < 0.55 ? 'W' : u < 0.82 ? 'b' : 'B';
        if ((x - 1) % 3 === 0 && u > 0.1 && u < 0.95) c = c === 'w' ? 'W' : c === 'W' ? 'b' : 'B';   // stave seams
        g[y][x] = c;
      }
    }
    // hoops
    for (const y of [6, 15]) for (let x = 0; x < W; x++) if (g[y][x] !== '.') { const u = x / W; g[y][x] = u < 0.3 ? 'm' : u < 0.7 ? 'M' : 'N'; }
    // top rim ellipse + water
    ell(g, 7.5, 3.6, 6.4, 2.4, null, { cb: () => 'b' });
    ell(g, 7.5, 3.8, 5.2, 1.7, null, { cb: (x, y, d, u, v) => v < -0.3 ? 'F' : 'E' });
    for (let x = 3; x <= 12; x++) if (get(g, x, 2) === 'b' && x < 7) g[2][x] = 'w';
    // glint ripples
    const gl = phase ? [[5, 3], [6, 3], [10, 4]] : [[6, 3], [7, 3], [9, 5]];
    for (const [x, y] of gl) put(g, x, y, 'e');
    put(g, 3, 9, 'w'); put(g, 3, 10, 'w');
    return ink(g, 'k', c => 'wW'.includes(c) ? 'B' : null);
  };
  return { id: 'barrel', anchor: [8, 20], palette, frames: { idle: [mk(0), mk(1)] } };
}

// ======================= shed 56×52 =======================
function shed() {
  const W = 56, H = 52;
  const palette = {
    ...WOOD,
    R: '#e0805a', r: '#c45c3c', q: '#923a28', Q: '#5e2218',    // roof shingles
    G: '#bfe6ff', g: '#6aaad8', h: '#3a6aa0',                   // window glass
    m: '#e6eaee', M: '#9aa0a6', N: '#5f656c', n: '#1e2a33',     // metal
    s: '#c4beb2', S: '#8e887c', t: '#5e584e',                   // stone footing
    f: '#ff7aa8', F: '#ffe680', e: '#5fb83f', E: '#2f7d3a',     // window box flowers
  };
  const g = grid(W, H);
  // --- wall: vertical planks x 5..50, y 20..47 ---
  for (let y = 20; y <= 47; y++) for (let x = 5; x <= 50; x++) {
    const pl = Math.floor((x - 5) / 5), px = (x - 5) % 5;
    let c = px === 0 ? 'B' : px === 1 ? 'w' : (hash(pl, y >> 2, 3) < 0.15 ? 'b' : 'W');
    if (x > 44) c = c === 'w' ? 'W' : c === 'W' ? 'b' : c;   // right end in shade
    g[y][x] = c;
  }
  // eave shadow under the roof
  for (let x = 5; x <= 50; x++) { g[20][x] = 'd'; g[21][x] = 'B'; g[22][x] = g[22][x] === 'w' ? 'W' : 'b'; }
  // --- stone footing ---
  for (let x = 4; x <= 51; x++) { g[48][x] = (x % 6 === 0) ? 'S' : 's'; g[49][x] = (x % 6 === 3) ? 't' : 'S'; }
  // --- door x 12..25, y 26..47 ---
  rect(g, 11, 25, 16, 1, 'd'); rect(g, 11, 25, 1, 23, 'd'); rect(g, 26, 25, 1, 23, 'd');   // frame recess
  rect(g, 12, 26, 14, 22, (x, y) => ((x - 12) % 4 === 0 ? 'b' : (x - 12) % 4 === 1 ? 'W' : 'b'));
  rect(g, 12, 26, 14, 1, 'w');   // lit lintel lip
  // Z brace
  rect(g, 12, 29, 14, 2, (x, y) => y === 29 ? 'w' : 'B'); rect(g, 12, 42, 14, 2, (x, y) => y === 42 ? 'w' : 'B');
  line(g, 13, 41, 24, 31, 'w'); line(g, 14, 41, 25, 31, 'B');
  put(g, 23, 37, 'm'); put(g, 23, 38, 'N');    // knob
  for (const [x, y] of [[13, 30], [24, 30], [13, 43], [24, 43]]) put(g, x, y, 'M');
  // --- window x 33..44, y 26..34 ---
  rect(g, 32, 25, 14, 11, 'd');
  rect(g, 33, 26, 12, 9, (x, y) => (y - 26) + (x - 33) * 0.5 < 4 ? 'G' : (y - 26) < 6 ? 'g' : 'h');
  rect(g, 38, 26, 2, 9, 'W'); rect(g, 33, 30, 12, 1, 'W');   // muntins
  rect(g, 31, 35, 16, 1, 'w'); rect(g, 31, 36, 16, 1, 'B');   // sill
  // window box with flowers
  rect(g, 32, 37, 14, 3, (x, y) => y === 37 ? 'W' : 'b'); rect(g, 32, 40, 14, 1, 'B');
  for (let x = 32; x <= 45; x++) { put(g, x, 36, hash(x, 1, 5) < 0.5 ? 'e' : 'E'); }
  for (const [x, c] of [[33, 'f'], [36, 'F'], [39, 'f'], [42, 'F'], [44, 'f']]) { put(g, x, 35, c); put(g, x, 34, c === 'f' ? 'f' : 'F'); }
  // --- roof: shingle plane seen from the front-top, x 1..54, y 2..21 ---
  for (let y = 3; y <= 19; y++) {
    const inset = Math.max(0, 3 - y);
    for (let x = 1 + inset; x <= 54 - inset; x++) {
      const course = Math.floor((y - 3) / 3), cy = (y - 3) % 3, off = course % 2 ? 3 : 0;
      const tile = Math.floor((x + off) / 6), tx = (x + off) % 6;
      let c = cy === 0 ? 'R' : cy === 1 ? 'r' : 'q';
      if (tx === 0 && cy > 0) c = 'q';
      if (hash(tile, course, 8) < 0.2 && cy === 1) c = 'R';
      if (x > 47) c = c === 'R' ? 'r' : c === 'r' ? 'q' : 'Q';   // right end turns away from the light
      g[y][x] = c;
    }
  }
  // ridge cap and eave edge
  rect(g, 3, 2, 50, 1, 'w'); rect(g, 3, 3, 50, 1, 'W');
  rect(g, 0, 20, 56, 1, 'Q'); rect(g, 1, 19, 54, 1, 'q');
  // --- tools leaning on the right wall: a shovel and a hoe ---
  line(g, 47, 41, 49, 26, 'w'); line(g, 48, 41, 50, 26, 'B');
  stamp(g, 45, 41, `\nmMMN\nmMMN\nMMNN\n.NN.`);
  line(g, 7, 47, 8, 30, 'w'); line(g, 8, 47, 9, 30, 'B'); stamp(g, 6, 28, `\nmMMMN\n.N.N.`);
  // little bucket at the foot
  stamp(g, 27, 44, `\n.....\nmMMN.\nMMNN.\n.NN..`);
  const out = ink(g, 'k', c => 'wWR'.includes(c) ? 'B' : null);
  return { id: 'shed', anchor: [28, 51], palette, frames: { idle: [out] } };
}

export function build() {
  return { plot: plot(), grass: grass(), tufts: tufts(), flowers: flowers(), stones: stones(), bush: bush(), shed: shed(), barrel: barrel() };
}
