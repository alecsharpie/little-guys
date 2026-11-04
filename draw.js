// Everything the TV draws. The field is painted on a low-res canvas (30 px per world unit, 480×270) with the pixel
// sprites in sprites/, then scaled up with smoothing off so every pixel is a crisp square. Text (names, popups, the
// header) goes on the full-res canvas over it, so it stays sharp.
import { S } from './sprites/index.js';
import { draw as spr, frame as sprFrame, frameAt, count, TEAMS } from './sprites/pix.js';
import { W, H, TOP, PLOT_W, PLOT_H, HOLD_DELAY, KINDS, SEATS, standingIn } from './game.js';

export const U = 30, LW = W * U, LH = H * U;
export const team = seat => TEAMS[(SEATS.indexOf(seat) + 8) % 8];
export const seatColor = seat => team(seat).c;
const PLANT = [[-14, -7], [14, -7], [-14, 9], [14, 9]];

const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---------- crisp pixel shapes (canvas paths would anti-alias into mush at this size) ----------
export function ellipsePx(x, cx, cy, rx, ry) {
  cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    if (w > 0 || Math.abs(dy) < ry) x.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
  }
}
export function ringPx(x, cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, step = 1) {
  const n = Math.max(12, Math.round((rx + ry) * Math.abs(a1 - a0) / step)), seen = new Set();
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n, X = Math.round(cx + Math.cos(a) * rx), Y = Math.round(cy + Math.sin(a) * ry), k = X * 4096 + Y;
    if (!seen.has(k)) { seen.add(k); x.fillRect(X, Y, 1, 1); }
  }
}

// ---------- the lawn, built once ----------
let lawn = null;
function buildLawn() {
  const c = document.createElement('canvas'); c.width = LW; c.height = LH;
  const x = c.getContext('2d');
  // tiles laid from the top-left corner whatever their anchor, at their own size
  const t0 = sprFrame(S.grass, 'idle', 0), tw = t0.width, th = t0.height, nv = count(S.grass, 'idle');
  for (let ty = 0; ty < LH; ty += th) for (let tx = 0; tx < LW; tx += tw) x.drawImage(sprFrame(S.grass, 'idle', Math.floor(hash(tx, ty) * nv)), tx, ty);
  // the gravel yard the beds stand in, with a ragged edge
  const x0 = Math.round((5.4 - PLOT_W / 2 - 0.5) * U), x1 = Math.round((10.6 + PLOT_W / 2 + 0.5) * U);
  const y0 = Math.round((3.55 - PLOT_H / 2 - 0.45) * U), y1 = Math.round((5.85 + PLOT_H / 2 + 0.5) * U);
  for (let y = y0 - 2; y <= y1 + 2; y++) {
    const jl = Math.round(hash(1, y >> 1) * 3), jr = Math.round(hash(2, y >> 1) * 3);
    for (let xx = x0 - jl; xx <= x1 + jr; xx++) {
      const edgeY = y < y0 || y > y1; if (edgeY && hash(xx >> 1, y, 5) < 0.6) continue;
      const h = hash(xx, y, 9);
      x.fillStyle = h < 0.06 ? '#a88552' : h < 0.13 ? '#e3c995' : h < 0.55 ? '#d2b37c' : '#c9a870';
      x.fillRect(xx, y, 1, 1);
    }
  }
  // pebbles in the gravel: a lit top pixel and a shadow under
  for (let i = 0; i < 70; i++) {
    const px = x0 + Math.floor(hash(i, 3) * (x1 - x0)), py = y0 + Math.floor(hash(i, 4) * (y1 - y0));
    x.fillStyle = '#f0dcb0'; x.fillRect(px, py, 2, 1); x.fillStyle = '#9c7a4c'; x.fillRect(px, py + 1, 2, 1);
  }
  // a darker trodden rim where the gravel meets the grass
  x.fillStyle = 'rgba(60,90,30,.25)';
  for (let xx = x0 - 3; xx <= x1 + 3; xx++) { x.fillRect(xx, y1 + 3, 1, 1); }
  // scattered lawn life, kept off the yard and the header
  const free = (px, py, m = 10) => (px < x0 - m || px > x1 + m || py < y0 - m || py > y1 + m) && py > 26;
  for (let i = 0; i < 90; i++) {
    const px = Math.floor(hash(i, 11) * LW), py = Math.floor(hash(i, 12) * LH);
    if (!free(px, py)) continue;
    if (i % 3 === 0) spr(x, S.flowers, 'idle', i % count(S.flowers, 'idle'), px, py);
    else spr(x, S.tufts, 'idle', i % count(S.tufts, 'idle'), px, py);
  }
  [[22, 236, 0], [452, 120, 1], [400, 250, 0], [70, 150, 1]].forEach(([px, py, v]) => spr(x, S.stones, 'idle', v, px, py));
  spr(x, S.shed, 'idle', 0, 44, 76); spr(x, S.barrel, 'idle', 0, 84, 74);
  spr(x, S.bush, 'idle', 0, 448, 64); spr(x, S.bush, 'idle', 0, 30, 262);
  return c;
}

// ---------- effects ----------
export const fx = { parts: [], pops: [], rings: [], anims: [], drops: [], decals: [], flyers: [], shake: 0, flash: 0, flashColor: '#fff', combo: {} };
const L = v => v * U;   // world → low-res px

export function burst(wx, wy, colors, n = 14, speed = 70, up = 40) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random() * 0.7);
    fx.parts.push({ x: L(wx), y: L(wy) - 4, z: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: up * (0.5 + Math.random()), t: 0,
      life: 0.4 + Math.random() * 0.4, c: Array.isArray(colors) ? colors[i % colors.length] : colors, s: Math.random() < 0.3 ? 2 : 1 });
  }
}
// key: a popup with the same key replaces the last one (a DOUBLE! becomes a TRIPLE! instead of stacking)
export function popup(wx, wy, text, color = '#fff', size = 1, key = null) { if (key) fx.pops = fx.pops.filter(p => p.key !== key); fx.pops.push({ x: L(wx), y: L(wy), text, color, size, t: 0, life: 1.1, key }); }
export function ring(wx, wy, r, color, life = 0.3) { fx.rings.push({ x: L(wx), y: L(wy), r: L(r), color, t: 0, life }); }
export function anim(id, set, wx, wy, { life, flip = false, dy = 0 } = {}) {
  const spec = S[id]; if (!spec) return;
  fx.anims.push({ spec, set, x: L(wx), y: L(wy) + dy, t: 0, life: life ?? count(spec, set) / 12, flip });
}
// a squashed bug leaves a little stain on the ground that fades away
export function splat(wx, wy, colors, size = 1) {
  const px = [], n = Math.round(9 * size), cs = Array.isArray(colors) ? colors : [colors];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 3.2 * size;
    px.push([Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r * 0.6), cs[i % cs.length]]);
  }
  for (let i = 0; i < 3 + size * 2; i++) { const a = Math.random() * Math.PI * 2, r = (4 + Math.random() * 3) * size; px.push([Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r * 0.6), cs[0]]); }
  fx.decals.push({ x: Math.round(L(wx)), y: Math.round(L(wy)), px, t: 0 });
  if (fx.decals.length > 90) fx.decals.shift();
}
// a harvested vegetable hops out of its bed and lands at the gardener's feet
export function flyer(spec, set, i, wx0, wy0, wx1, wy1, onLand) { fx.flyers.push({ spec, set, i, x0: L(wx0), y0: L(wy0), x1: L(wx1), y1: L(wy1), t: 0, life: 0.55, onLand }); }
export function bumpCombo(seat) { fx.combo[seat] = 0.18; }
export function drop(wx, wy, h = 14) { fx.drops.push({ x: L(wx) + (Math.random() - 0.5) * 6, y: L(wy), z: h, vz: 0, t: 0 }); }

export function tickFx(dt) {
  for (const p of fx.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 260 * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.5; p.vy *= 0.5; } }
  fx.parts = fx.parts.filter(p => p.t < p.life);
  for (const p of fx.pops) p.t += dt;
  fx.pops = fx.pops.filter(p => p.t < p.life);
  for (const r of fx.rings) r.t += dt;
  fx.rings = fx.rings.filter(r => r.t < r.life);
  for (const a of fx.anims) a.t += dt;
  fx.anims = fx.anims.filter(a => a.t < a.life);
  for (const d of fx.drops) { d.t += dt; d.vz -= 300 * dt; d.z += d.vz * dt; if (d.z <= 0 && !d.splash) { d.splash = d.t; } }
  fx.drops = fx.drops.filter(d => !d.splash || d.t - d.splash < 0.25);
  for (const d of fx.decals) d.t += dt;
  fx.decals = fx.decals.filter(d => d.t < 9);
  for (const f of fx.flyers) { f.t += dt; if (f.t >= f.life && f.onLand) { f.onLand(); f.onLand = null; } }
  fx.flyers = fx.flyers.filter(f => f.t < f.life);
  for (const k in fx.combo) fx.combo[k] = Math.max(0, fx.combo[k] - dt);
  fx.shake = Math.max(0, fx.shake - dt * 30);
  fx.flash = Math.max(0, fx.flash - dt * 2.5);
}

// ---------- pieces ----------
function shadow(x, wx, wy, rx, ry = rx * 0.4) {
  x.fillStyle = 'rgba(28,52,18,.32)';
  ellipsePx(x, L(wx), L(wy), rx, Math.max(1, ry));
}

function heartPx(x, px, py, on) {
  // 5×4 pixel heart
  const rows = ['.#.#.', '#####', '.###.', '..#..'];
  rows.forEach((r, yy) => { for (let xx = 0; xx < 5; xx++) if (r[xx] === '#') { x.fillStyle = on ? (yy === 0 || (yy === 1 && xx < 2) ? '#ff9aa8' : '#e8364f') : '#5a4a3a'; x.fillRect(px + xx, py + yy, 1, 1); } });
  if (on) { x.fillStyle = '#ffffff'; x.fillRect(px + 1, py + 1, 1, 1); }
}

function drawPlot(x, pl, t, items) {
  const soil = pl.hp <= 0 ? 3 : pl.hp === 1 ? 2 : pl.wetT > 0 || pl.hp === 3 ? (pl.wetT > 0 ? 0 : 1) : 1;
  spr(x, S.plot, 'soil', soil, L(pl.x), L(pl.y));
  const spec = S['crop_' + pl.crop];
  PLANT.forEach(([dx, dy], i) => {
    const g = pl.g - i * 0.035, stage = pl.g >= 1 ? 3 : g < 0.28 ? 0 : g < 0.62 ? 1 : 2;
    const px = L(pl.x) + dx, py = L(pl.y) + dy;
    // the plant is y-sorted with the gardeners, so a little guy can stand in front of a sunflower or behind it
    items.push({ y: py, draw: () => {
      spr(x, spec, pl.hp <= 0 ? 'wilt' : 'grow', pl.hp <= 0 ? 0 : stage, px, py);
      if (stage === 3 && pl.hp > 0 && hash(i, Math.floor(t * 2 + pl.i)) < 0.25) spr(x, S.fx_sparkle, 'idle', frameAt(S.fx_sparkle, 'idle', t), px + Math.round(hash(i, 3) * 8 - 4), py - 10);
    } });
  });
  // health: three hearts over the bed's top edge, blinking while something is eating it
  const hx = L(pl.x) - 9, hy = L(pl.y) - 29;
  const blink = pl.munchers > 0 && Math.floor(t * 6) % 2;
  if (pl.hp < 3 || pl.munchers) for (let k = 0; k < 3; k++) heartPx(x, hx + k * 6, hy, k < pl.hp && !(blink && k === pl.hp - 1));
}

function gardenerSet(G, p) {
  if (!p.on) return ['sleep', null];
  if (p.stun > 0) return ['dizzy', null];
  if (p.spinT > 0) return ['spin', null];
  if (p.holding && p.holdT > HOLD_DELAY && p.mode === 'water') return ['water', null];
  if (p.holding && p.holdT > HOLD_DELAY && p.mode === 'charge') return ['charge', null];
  if (p.bonkT > 0) return ['bonk', Math.min(3, Math.floor((0.22 - p.bonkT) / 0.22 * 4))];
  if (p.moving > 0.4) return ['walk', null];
  if (G.phase === 'break' || p.cheer) return ['cheer', null];
  return ['idle', null];
}

function drawGardener(x, G, seat, p, t) {
  const tm = team(seat), [set, idx] = gardenerSet(G, p), spec = S.gardener;
  const i = idx ?? frameAt(spec, set, t + SEATS.indexOf(seat) * 0.37);
  let px = L(p.x), py = L(p.y);
  if (set === 'charge' && p.charge >= 1) px += Math.floor(t * 30) % 2 ? 1 : -1;
  const flip = p.fx < 0, big = p.giantT > 0 && (p.giantT > 1.5 || Math.floor(t * 8) % 2);
  const alpha = p.on ? (p.inv > 0 && p.stun <= 0 && p.spinT <= 0 && Math.floor(t * 12) % 2 ? 0.55 : 1) : 0.6;
  if (big) {
    x.save(); x.translate(Math.round(px), Math.round(py)); x.scale(2, 2);
    spr(x, spec, set, i, 0, 0, { team: tm, flip, alpha }); x.restore();
  } else spr(x, spec, set, i, px, py, { team: tm, flip, alpha });
  const top = py - (big ? 50 : 26);
  if (set === 'dizzy') for (let k = 0; k < 3; k++) {
    const a = t * 5 + k * 2.1;
    spr(x, S.fx_star, 'idle', frameAt(S.fx_star, 'idle', t + k * 0.2), px + Math.cos(a) * 7, top + 2 + Math.sin(a) * 2);
  }
  // charge: a ring that fills around the feet, white and pulsing when full
  if (set === 'charge') {
    x.fillStyle = p.charge >= 1 ? (Math.floor(t * 12) % 2 ? '#ffffff' : tm.l) : tm.l;
    const r = 7 + p.charge * 9;
    ringPx(x, px, py, r, r * 0.45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.05, p.charge));
  }
  if (p.spinT > 0) {
    const r = L(p.spinR) * (1 - p.spinT / 0.32 * 0.4);
    x.fillStyle = '#ffffff'; ringPx(x, px, py - 4, r, r * 0.5, t * 30, t * 30 + 2.2);
    x.fillStyle = tm.l; ringPx(x, px, py - 4, r - 2, (r - 2) * 0.5, t * 30 + 0.4, t * 30 + 2.0);
  }
}

function enemySet(e) {
  const k = e.kind;
  if (k === 'weed') return 'idle';
  if (k === 'ladybug') return 'fly';
  if (k === 'stinkbug' && e.fly > 0) return 'fly';
  if (k === 'snail' && e.hurt > 0) return 'hide';
  if (k === 'queen' && e.hurt > 0) return 'roar';
  if (e.eating >= 0) return 'munch';
  return k === 'hopper' ? 'hop' : 'walk';
}

function drawEnemy(x, e, t) {
  const spec = S[e.kind]; if (!spec) return;
  const set = enemySet(e);
  const i = e.kind === 'hopper' && set === 'hop' ? Math.floor(e.hopT * 4) : frameAt(spec, set, e.t);
  let px = L(e.x), py = L(e.y);
  if (e.kind === 'hopper' && set === 'hop' && e.hopT < 0.35) py -= Math.round(Math.sin(e.hopT / 0.35 * Math.PI) * 6);
  if (e.kind === 'ladybug') py -= 6 + Math.round(Math.sin(e.t * 6) * 2);
  if (e.fly > 0) py -= Math.round(Math.sin(e.fly / 0.75 * Math.PI) * 12);
  if (e.dead) { spr(x, spec, set, i, px, py, { flip: e.face < 0, mode: 'flash', alpha: Math.min(1, e.ghost * 4) }); return; }
  spr(x, spec, set, i, px, py, { flip: e.face < 0, mode: e.hurt > 0.06 ? 'flash' : '' });
  if (e.max > 1 && e.hp < e.max) {
    const w = e.kind === 'queen' ? 30 : 12, bx = Math.round(px - w / 2), by = Math.round(py - (e.kind === 'queen' ? 32 : 16));
    x.fillStyle = '#2a1a12'; x.fillRect(bx - 1, by - 1, w + 2, 4);
    x.fillStyle = '#5a2a2a'; x.fillRect(bx, by, w, 2);
    x.fillStyle = '#ff5a5a'; x.fillRect(bx, by, Math.max(1, Math.round(w * e.hp / e.max)), 2);
    x.fillStyle = '#ffb0a0'; x.fillRect(bx, by, Math.max(1, Math.round(w * e.hp / e.max)), 1);
  }
}

// incoming pests: a blinking marker on the edge where they will come from
function warnings(x, G, t) {
  if (G.phase !== 'wave') return;
  for (const q of G.queue) {
    if (q.at - G.waveT > 1.4) break;
    if (Math.floor(t * 6) % 2) continue;
    const px = Math.max(6, Math.min(LW - 6, L(q.x))), py = Math.max(L(TOP) + 4, Math.min(LH - 8, L(q.y)));
    x.fillStyle = q.kind === 'ladybug' ? '#ffe14d' : q.kind === 'queen' ? '#c77dff' : '#ff4d4d';
    x.fillRect(px - 1, py - 5, 2, 5); x.fillRect(px - 1, py + 1, 2, 2);
  }
}

// ---------- the frame ----------
const low = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (low) { low.width = LW; low.height = LH; }

export function drawField(ctx, G, { W: SW, H: SH, live, name, t }) {
  if (!lawn) lawn = buildLawn();
  const x = low.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, LW, LH);
  x.drawImage(lawn, 0, 0);
  for (const d of fx.decals) {
    x.globalAlpha = d.t < 5 ? 0.85 : 0.85 * (1 - (d.t - 5) / 4);
    for (const [dx, dy, c] of d.px) { x.fillStyle = c; x.fillRect(d.x + dx, d.y + dy, 1, 1); }
  }
  x.globalAlpha = 1;

  const items = [];
  for (const pl of G.plots) drawPlot(x, pl, t, items);
  warnings(x, G, t);
  // shadows first, so nothing's shadow falls on a neighbour's head
  for (const p of Object.values(G.players)) shadow(x, p.x, p.y, p.giantT > 0 ? 12 : 6, p.giantT > 0 ? 4 : 2);
  for (const e of G.enemies) {
    if (e.dead) continue;
    const air = e.kind === 'ladybug' || e.fly > 0;
    shadow(x, e.x, e.y, Math.round(L(e.r) * (air ? 0.6 : 1.1)), Math.round(L(e.r) * 0.45));
  }
  for (const [s, p] of Object.entries(G.players)) items.push({ y: L(p.y), draw: () => drawGardener(x, G, s, p, t) });
  for (const e of G.enemies) items.push({ y: L(e.y) + (e.fly > 0 || e.kind === 'ladybug' ? 20 : 0), draw: () => drawEnemy(x, e, t) });
  for (const a of fx.anims) items.push({ y: a.y + 8, draw: () => spr(x, a.spec, a.set, Math.floor(a.t / a.life * count(a.spec, a.set)), a.x, a.y, { flip: a.flip }) });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();

  for (const f of fx.flyers) {
    const k = Math.min(1, f.t / f.life), e = 1 - (1 - k) * (1 - k);
    spr(x, f.spec, f.set, f.i, f.x0 + (f.x1 - f.x0) * e, f.y0 + (f.y1 - f.y0) * e - Math.sin(k * Math.PI) * 22);
  }
  for (const p of fx.parts) { x.fillStyle = p.c; x.fillRect(Math.round(p.x), Math.round(p.y - p.z), p.s, p.s); }
  for (const d of fx.drops) {
    if (d.splash) spr(x, S.fx_drop, 'splash', Math.floor((d.t - d.splash) / 0.25 * 3), d.x, d.y);
    else spr(x, S.fx_drop, 'drop', 0, d.x, d.y - d.z);
  }
  for (const r of fx.rings) {
    const k = r.t / r.life; x.fillStyle = r.color;
    ringPx(x, r.x, r.y, r.r * (0.4 + 0.6 * k), r.r * (0.4 + 0.6 * k) * 0.5, 0, Math.PI * 2, 1 + k * 3);
  }

  // up to the screen: the biggest whole-number scale that fits, letterboxed with a darker lawn
  let Z = Math.min(SW / LW, SH / LH); if (Z >= 2) Z = Math.floor(Z);
  const ox = Math.round((SW - LW * Z) / 2), oy = Math.round((SH - LH * Z) / 2);
  const sh = fx.shake > 0.5 ? Math.round((Math.random() - 0.5) * fx.shake / 4) * Z : 0, sv = fx.shake > 0.5 ? Math.round((Math.random() - 0.5) * fx.shake / 4) * Z : 0;
  ctx.fillStyle = '#2f5a2a'; ctx.fillRect(0, 0, SW, SH);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(low, ox + sh, oy + sv, LW * Z, LH * Z);
  if (fx.flash > 0) { ctx.globalAlpha = fx.flash * 0.35; ctx.fillStyle = fx.flashColor; ctx.fillRect(0, 0, SW, SH); ctx.globalAlpha = 1; }

  const X = lx => ox + lx * Z, Y = ly => oy + ly * Z;
  // names under the gardeners
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = `800 ${Math.round(6 * Z)}px ui-rounded, system-ui, sans-serif`;
  for (const [s, p] of Object.entries(G.players)) {
    const nx = X(L(p.x)), ny = Y(L(p.y) + 3);
    const label = name(s) + (p.on ? '' : ' 💤');
    ctx.lineWidth = Math.max(2, Z * 1.2); ctx.strokeStyle = 'rgba(20,30,10,.85)'; ctx.strokeText(label, nx, ny);
    ctx.fillStyle = team(s).l; ctx.fillText(label, nx, ny);
  }
  // combo over the head: bigger and hotter as it climbs, with a pop each time it goes up
  for (const [s, p] of Object.entries(G.players)) {
    if (p.combo < 3) continue;
    const heat = Math.min(1, p.combo / 30), bump = (fx.combo[s] || 0) / 0.18;
    const size = Math.round((6 + heat * 4) * Z * (1 + bump * 0.45));
    ctx.font = `900 ${size}px ui-rounded, system-ui, sans-serif`;
    const cx = X(L(p.x)), cy = Y(L(p.y) - (p.giantT > 0 ? 56 : 32)) - size;
    const label = `×${p.combo}${p.combo >= 10 ? ' 🔥' : ''}`;
    ctx.lineWidth = Math.max(3, Z * 1.5); ctx.strokeStyle = 'rgba(40,20,10,.9)'; ctx.strokeText(label, cx, cy);
    ctx.fillStyle = `hsl(${50 - heat * 45}, 100%, ${70 - heat * 12}%)`; ctx.fillText(label, cx, cy);
  }
  for (const p of fx.pops) {
    const k = p.t / p.life, a = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
    ctx.globalAlpha = a; ctx.font = `900 ${Math.round(8 * Z * p.size * (k < 0.1 ? 0.6 + k * 4 : 1))}px ui-rounded, system-ui, sans-serif`;
    ctx.lineWidth = Math.max(3, Z * 1.6); ctx.strokeStyle = 'rgba(30,20,10,.85)';
    const py = Y(p.y - 18 - k * 14);
    ctx.strokeText(p.text, X(p.x), py); ctx.fillStyle = p.color; ctx.fillText(p.text, X(p.x), py);
    ctx.globalAlpha = 1;
  }
  return { Z, ox, oy, X, Y };
}
