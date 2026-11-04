// Effects: fx_poof (squash puff, plays once), fx_stink (looping stink cloud), fx_sparkle, fx_star (dizzy star),
// fx_bee (friendly bee), fx_drop (water drop + splash). Anchors are the centre, except fx_drop (see below).
import { grid, volumes, outline, line, put, get, over, emit, stamp, hash, despeckle } from './kit.mjs';

// ---------- fx_poof 16×16: dust puffs burst out in a ring, leaf bits fly, then the puffs thin out and fade ----------
function poof() {
  const PAL = { w: '#ffffff', a: '#fff6de', b: '#ecdcb8', c: '#c4ad84', d: '#94805e', g: '#a6e05a', G: '#5fb83f', h: '#2f7d3a' };
  const MATS = { dust: { t: ['w', 'a', 'b', 'c'], thr: [0.8, 0.4, -0.1] }, dusty: { t: ['a', 'b', 'c', 'd'], thr: [0.75, 0.3, -0.15] } };
  const C = 7.5;
  const ring = [0, 1, 2, 3, 4, 5].map(i => (i / 6) * Math.PI * 2 + 0.3);
  const leafDirs = [-2.2, -0.9, 0.5, 2.0];
  const frames = [];
  const st = [ // radius of the ring, puff size, leaf distance
    { r: 0, s: 3.6, core: 1, leaf: 0 },
    { r: 3.2, s: 2.7, leaf: 4 },
    { r: 4.6, s: 2.4, leaf: 6 },
    { r: 5.4, s: 1.8, leaf: 7, thin: 1 },
    { r: 6.0, s: 1.1, leaf: 7.5, thin: 2 },
  ];
  st.forEach((p, k) => {
    const forms = [];
    if (p.core) forms.push({ cx: C, cy: C, rx: p.s, ry: p.s * 0.8, mat: 'dust' });
    else ring.forEach((a, i) => {
      if (p.thin === 2 && i % 2) return;
      const r = p.r * (1 + 0.12 * Math.sin(i * 2.1)), s = p.s * (1 + 0.18 * Math.cos(i * 1.7));
      forms.push({ cx: C + Math.cos(a) * r, cy: C + Math.sin(a) * r * 0.8, rx: s, ry: s * 0.85, mat: p.thin ? 'dusty' : 'dust', z: -i });
    });
    if (k === 1) forms.push({ cx: C, cy: C, rx: 2.2, ry: 1.8, mat: 'dust', z: 5 });
    const { g } = volumes(16, 16, forms, MATS);
    if (p.core) { // impact flash: a little 4-point burst on the puff
      for (const [x, y] of [[7, 2], [8, 2], [7, 13], [8, 13], [2, 7], [2, 8], [13, 7], [13, 8]]) put(g, x, y, 'a');
    }
    if (p.leaf) leafDirs.forEach((a, i) => {
      const x = C + Math.cos(a) * p.leaf, y = C + Math.sin(a) * p.leaf * 0.85 + (k > 2 ? k - 2 : 0);
      const c = i % 2 ? 'g' : 'G'; put(g, x, y, c); if (k < 4) put(g, x + (i % 2 ? 1 : 0), y + (i % 2 ? 0 : 1), i % 2 ? 'G' : 'h');
    });
    frames.push(g);
  });
  emit('fx_poof', 'squash puff of dust and leaf bits (plays once)', { anchor: [8, 8], palette: PAL, fps: { idle: 14 }, frames: { idle: frames } });
}

// ---------- fx_stink 32×22: a looping sickly green cloud: lumpy puffs that churn, dark swirl curls, a fly or two ----------
function stink() {
  const PAL = { a: '#eef7a0', b: '#c6dc64', c: '#94b040', d: '#5e7a2c', o: '#3a4a1e', s: '#7a5a8a', S: '#4e3a62', k: '#1e1a22', w: '#ffffff' };
  const MATS = { gas: { t: ['a', 'b', 'c', 'd'], thr: [0.72, 0.3, -0.12] } };
  const puffs = [[10, 14, 4.6], [16, 11.5, 5.4], [22, 14, 4.6], [13, 17, 4.0], [20, 17.2, 4.0], [26.5, 16.8, 3.0], [5.5, 17, 3.0], [16, 17, 4.4]];
  const frames = [];
  for (let k = 0; k < 4; k++) {
    const t = k / 4 * Math.PI * 2;
    const forms = puffs.map(([x, y, r], i) => ({ cx: x + Math.cos(t + i * 1.3) * 0.7, cy: y + Math.sin(t + i * 1.9) * 0.7, rx: r * (1 + 0.07 * Math.sin(t + i)), ry: r * 0.78 * (1 + 0.07 * Math.cos(t + i)), mat: 'gas', z: i % 3 }));
    const { g } = volumes(32, 22, forms, MATS);
    outline(g, 'o', 'd');
    // swirl curls (purple-grey stink lines) turning a quarter per frame
    const curl = (cx, cy, R, ph) => {
      let px = null;
      for (let i = 0; i <= 14; i++) {
        const a = ph + i / 14 * Math.PI * 1.6, r = R * (0.35 + 0.65 * i / 14);
        const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r * 0.8);
        if (get(g, x, y) !== '.' && get(g, x, y) !== 'o') g[y][x] = i > 10 ? 'a' : 'c';
      }
    };
    curl(12, 15, 2.4, t); curl(19, 13, 2.8, t + 2);
    // wavy stink lines rising off the top, scrolling up a pixel per frame
    for (const [x0, len, ph] of [[9, 6, 0], [16, 7, 2], [23, 6, 1]]) {
      for (let i = 0; i < len; i++) {
        const y = 7 - i - (k % 2), x = x0 + Math.round(Math.sin((i + k) * 1.3 + ph) * 1.2);
        if (y >= 0 && get(g, x, y) === '.') g[y][x] = i < 2 ? 's' : i < len - 2 ? 's' : 'S';
      }
    }
    // two flies buzzing round it
    const f1 = [16 + Math.round(Math.cos(t) * 13), 6 + Math.round(Math.sin(t) * 2)], f2 = [16 + Math.round(Math.cos(t + 3) * 11), 21];
    for (const [x, y] of [f1, f2]) { put(g, x, y, 'k'); put(g, x, y - 1, k % 2 ? 'w' : '.'); }
    frames.push(g);
  }
  emit('fx_stink', 'looping green stink cloud with swirls and flies', { anchor: [16, 11], palette: PAL, fps: { idle: 6 }, frames: { idle: frames } });
}

// ---------- fx_sparkle 7×7: twinkle ----------
function sparkle() {
  const PAL = { w: '#ffffff', y: '#fff3a0', Y: '#ffd23f' };
  const F = [`
.......
.......
.......
...w...
.......
.......
.......
`, `
.......
.......
...y...
..ywy..
...y...
.......
.......
`, `
...y...
...y...
..Ywy..
yywwwyy
..ywY..
...y...
...y...
`, `
.......
.Y...Y.
...y...
..ywy..
...y...
.Y...Y.
.......
`];
  emit('fx_sparkle', 'twinkle', { anchor: [3, 3], palette: PAL, fps: { idle: 10 }, frames: { idle: F } });
}

// ---------- fx_star 5×5: a dizzy star tumbling (face, quarter turn, edge-on, quarter turn) ----------
function star() {
  const PAL = { w: '#fffbe0', y: '#ffd23f', Y: '#e09a1c', o: '#7a4e10' };
  const D = `
..y..
.wyY.
yyyYY
.yYY.
..Y..
`;
  const F = [`
..w..
.wyy.
wyyyY
.yyY.
.y.Y.
`, D, `
.y.Y.
.wyY.
wyyYY
.yYY.
..Y..
`, D];
  emit('fx_star', 'dizzy star', { anchor: [2, 2], palette: PAL, fps: { idle: 10 }, frames: { idle: F } });
}

// ---------- fx_bee 7×6: friendly bumble bee, wings flap ----------
function bee() {
  const PAL = { w: '#ffffff', W: '#c8e4ff', y: '#ffd23f', Y: '#c98a16', k: '#24180f', e: '#ffffff' };
  const F = [`
..ww...
.wWWw..
.ykykk.
kykykek
.YkYkk.
.......
`, `
.......
..Ww...
.ykykk.
kykykek
.YkYkk.
.......
`];
  // face right: stinger at left (x0), head at right with an eye
  const fix = s => s.replace(/\n/g, '\n');
  emit('fx_bee', 'friendly bumble bee', { anchor: [3, 3], palette: PAL, fps: { fly: 16 }, frames: { fly: F.map(fix) } });
}

// ---------- fx_drop: a water drop and its splash (3 frames). Both sets share one 7×5 canvas so the single anchor works
// for both: anchor [3,4] = the drop's bottom tip / the point where the splash hits the ground. ----------
function drop() {
  const PAL = { w: '#ffffff', a: '#c4eaff', b: '#5ab0ff', c: '#2f72c8' };
  const D = [`
...a...
...b...
..abb..
..bwb..
...c...
`];
  const S = [`
.......
.......
...a...
..b.b..
.acccb.
`, `
.......
.a...a.
..b.b..
.b...b.
..c.c..
`, `
a.....a
.......
.......
b.....b
.......
`];
  emit('fx_drop', 'water drop and splash', { anchor: [3, 4], palette: PAL, fps: { splash: 14 }, frames: { drop: D, splash: S } });
}

export default function run() { poof(); stink(); sparkle(); star(); bee(); drop(); }
