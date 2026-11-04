// Phone controller pieces, team-coloured ('team' / 'teamdark' / 'teamlight'), drawn at ×4–×5 on the phone:
//   pad_button 48×50 up/down (anchor centre-bottom), pad_ring 52×52 seg ×16 (charge ring), pad_base 40×40, pad_knob 22×22.
import { grid, put, get, emit } from './kit.mjs';

const LN = (() => { const v = [-0.5, -0.62, 0.6]; const n = Math.hypot(...v); return v.map(a => a / n); })();
const dot = (nx, ny, nz) => { const n = Math.hypot(nx, ny, nz) || 1; return (nx * LN[0] + ny * LN[1] + nz * LN[2]) / n; };
const each = (g, fn) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) { const c = fn(x, y, x + 0.5, y + 0.5); if (c) g[y][x] = c; } };
const ringAround = (g, inside, ink) => { const add = []; each(g, (x, y) => { if (inside(x, y)) return; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inside(x + a, y + b))) add.push([x, y]); }); add.forEach(([x, y]) => put(g, x, y, ink)); };

// warm dark housing (soil/wood family so it sits in the garden): lit rim, deep hole
const HOUSE = { k: '#24180f', A: '#9a6a44', B: '#7a4f33', C: '#5a3826', E: '#3e2619', F: '#1e130c' };
const TEAM = { T: 'team', D: 'teamdark', L: 'teamlight', w: '#ffffff' };

function button(down) {
  const g = grid(48, 50), cx = 24, HY = 27, HR = 21.2, hole = 17.6, R = 16, fy = down ? 25 : 21.5;
  const inH = (x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - HY) <= HR;
  // housing bezel: a raised ring lit on its upper-left, the hole dark with a soft lower-right lip
  each(g, (x, y, X, Y) => {
    const dx = X - cx, dy = Y - HY, d = Math.hypot(dx, dy); if (d > HR) return;
    if (d > hole) { const l = -(dx + dy * 1.2) / d; return d > HR - 1 ? (l > 0.3 ? 'B' : 'C') : l > 0.45 ? 'A' : l > -0.3 ? 'B' : 'C'; }
    if (d > hole - 1.2) return (dx + dy) > 4 ? 'E' : 'F';
    return 'F';
  });
  ringAround(g, inH, 'k');
  // cylinder (the side of the button) from the face down to the hole floor
  const inCyl = (x, y) => { const X = x + 0.5 - cx; if (Math.abs(X) > R) return false; const Y = y + 0.5, h = Math.sqrt(R * R - X * X); return Y >= fy - h && Y <= HY - 1 + h; };
  each(g, (x, y, X) => inCyl(x, y) ? (X - cx < -R * 0.55 ? 'T' : X - cx < R * 0.35 ? 'D' : 'D') : null);
  ringAround(g, inCyl, 'k');
  // the face: team ramp lit from the upper-left, glossy highlight, ink rim
  const inF = (x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - fy) <= R;
  each(g, (x, y, X, Y) => {
    const u = (X - cx) / R, v = (Y - fy) / R, r2 = u * u + v * v; if (r2 > 1) return;
    const d = dot(u, v, Math.sqrt(1 - r2) * 1.6);
    // gloss: a crescent-ish oval up-left
    const gu = (u + 0.36) / 0.3, gv = (v + 0.44) / 0.17, ga = Math.atan2(v + 0.44, u + 0.36);
    const rot = 0.6, ru = ((u + 0.36) * Math.cos(rot) + (v + 0.44) * Math.sin(rot)) / 0.34, rv = (-(u + 0.36) * Math.sin(rot) + (v + 0.44) * Math.cos(rot)) / 0.15;
    if (ru * ru + rv * rv <= 1) return down ? 'L' : 'w';
    if (ru * ru + rv * rv <= 1.9 && !down) return 'L';
    if (r2 > 0.8 && u + v > 0.5) return 'D';
    return d > 0.82 ? 'L' : d > 0.35 ? 'T' : 'D';
  });
  ringAround(g, inF, 'k');
  // small round glint dot under the gloss
  if (!down) { put(g, Math.round(cx - R * 0.62), Math.round(fy - R * 0.05), 'L'); }
  return g;
}

function ring(k) {
  const N = 52, c = 26, g = grid(N, N), r0 = 21.4, r1 = 25.0, seg = 2 * Math.PI / 16;
  each(g, (x, y, X, Y) => {
    const dx = X - c, dy = Y - c, d = Math.hypot(dx, dy);
    if (d < r0 - 1 || d > r1 + 1) return;
    if (d < r0 || d > r1) return 'k';
    const a = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI), s = Math.floor(a / seg), f = a / seg - s;
    if (f * seg * d < 0.85) return 'k';                     // 1-px gaps between segments
    const lit = s <= k;
    const l = -(dx + dy) / d;
    if (lit) return d > r1 - 1 ? (l > 0.2 ? 'e' : 'E') : d < r0 + 1 ? (l > -0.2 ? 'w' : 'e') : (l > 0.3 ? 'w' : 'e');
    return d < r0 + 1 && l > 0 ? 'Q' : 'P';
  });
  return g;
}

function base() {
  const N = 40, c = 20, g = grid(N, N), R = 19.2;
  each(g, (x, y, X, Y) => {
    const dx = X - c, dy = Y - c, d = Math.hypot(dx, dy); if (d > R) return;
    if (d > R - 1) return 'k';
    const l = (dx * 0.55 + dy * 0.83) / (d || 1);        // facing the light from below-right (inside a recess)
    if (d > R - 3) return l > 0.55 ? 'A' : l > 0.0 ? 'B' : l > -0.5 ? 'C' : 'E';   // rim: lit lower edge
    // recess floor: the rim shades its upper-left part
    if (d > R - 5 && l < -0.2) return 'G';
    if (Math.hypot(dx + 1.5, dy + 2) > R - 3.5 && l < 0.2) return 'G';
    return 'F';
  });
  // four little direction notches (tiny triangles pointing outward)
  const tri = [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [2, 1]];       // up-pointing, origin = left tip pixel
  for (const [x, y] of tri) { put(g, 19 + x, 5 + y, 'n'); put(g, 19 + x, 34 - y, 'n'); put(g, 5 + y, 19 + x, 'n'); put(g, 34 - y, 19 + x, 'n'); }
  return g;
}

function knob() {
  const N = 22, cx = 11, g = grid(N, N), R = 8.8, fy = 9.9, by = 12.3;
  const inF = (x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - fy) <= R;
  const inS = (x, y) => { const X = x + 0.5 - cx; if (Math.abs(X) > R) return false; const h = Math.sqrt(R * R - X * X), Y = y + 0.5; return Y >= fy && Y <= by + h; };
  each(g, (x, y, X) => inS(x, y) ? (X - cx < -R * 0.5 ? 'T' : 'D') : null);
  ringAround(g, inS, 'k');
  each(g, (x, y, X, Y) => {
    const u = (X - cx) / R, v = (Y - fy) / R, r2 = u * u + v * v; if (r2 > 1) return;
    const d = dot(u, v, Math.sqrt(1 - r2) * 1.3);
    // concave thumb dish: inner disc shaded the other way round
    const iu = (X - cx) / 5, iv = (Y - fy) / 5, ir = iu * iu + iv * iv;
    if (ir <= 1) return ir > 0.5 && iu + iv > 0.5 ? 'L' : 'T';
    const gu = (u + 0.45) / 0.22, gv = (v + 0.55) / 0.16;
    if (gu * gu + gv * gv <= 1) return 'w';
    return d > 0.7 ? 'L' : d > 0.2 ? 'T' : 'D';
  });
  ringAround(g, inF, 'k');
  return g;
}

export default function paint() {
  emit('pad_button', 'big round team-coloured arcade button in a wooden housing (no label: the game draws it)',
    { anchor: [24, 50], palette: { ...HOUSE, ...TEAM }, frames: { up: [button(false)], down: [button(true)] } },
    ['48×50, anchor [24,50] (centre-bottom). Housing centre is (24,27); the face centre is (24,21.5) up, (24,25) down',
     '(face radius 16): draw a label centred on the face and drop it 3–4 px with the face on press.']);
  emit('pad_ring', 'charge ring: 16 segments filling clockwise from 12 o\'clock (frame k = k+1 lit)',
    { anchor: [26, 26], palette: { k: '#24180f', w: '#fffbea', e: '#fbe7a1', E: '#e2bc62', P: '#3e2c22', Q: '#5a4232' }, frames: { seg: Array.from({ length: 16 }, (_, k) => ring(k)) } },
    ['52×52, anchor [26,26] (centre). Ring radii ≈21.4–25 (ink outside that) . Frame = floor(charge * 15).',
     'To wrap pad_button, put the ring centre on the button housing centre (button anchor y − 23).']);
  emit('pad_base', 'joystick well: a recessed round socket with a lit lower rim and four direction notches',
    { anchor: [20, 20], palette: { ...HOUSE, G: '#140c07', n: '#6a442c' }, frames: { idle: [base()] } },
    ['40×40, anchor [20,20] (centre). Floor radius ≈14: keep the knob centre within ~9 px of the anchor.']);
  emit('pad_knob', 'chunky team-coloured thumb knob with a concave dish and a glint',
    { anchor: [11, 11], palette: { k: '#24180f', ...TEAM }, frames: { idle: [knob()] } },
    ['22×22, anchor [11,11] (centre of the knob body).']);
}
