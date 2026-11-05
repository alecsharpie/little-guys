// Little Guys rules. Pure: no DOM, no network, no clock (the TV calls step() with dt), so it runs in tests.
//
// A garden of six raised beds sits in the middle of a lawn. Pests crawl in from the edges, each heading for the nearest
// living bed, and munch it: every bite costs the bed a point of health (3 = thriving, 0 = wilted). When every bed has
// wilted, the game is over. Each phone is a controller for one little gardener: a joystick to walk, a button to
// bonk with the rake (tap), and hold to charge a spinning rake sweep, anywhere. Stand still in a thirsty bed and your
// gardener waters it back to health on their own. Ripe crops are harvested with a bonk for points. Ladybugs carry power-ups; every 5th wave a beetle queen.

export const SEATS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
export const W = 16, H = 9, TOP = 0.95;          // the field in world units; y < TOP is under the TV's header
export const BREAK = 4, BOSS_EVERY = 5;
export const CROPS = ['carrot', 'cabbage', 'pumpkin', 'tomato', 'sunflower', 'strawberry'];
export const PLOT_W = 2, PLOT_H = 44 / 30;        // a bed is 60×44 sprite pixels at 30 px per unit
export const PLOTS = [[5.4, 3.55], [8, 3.55], [10.6, 3.55], [5.4, 5.85], [8, 5.85], [10.6, 5.85]];
export const GROW = 26;                           // seconds for a thriving bed to ripen

// the gardener
export const SPEED = 3.4, ACCEL = 16, R = 0.26;
export const BONK_RANGE = 0.82, BONK_COS = 0.3, BONK_CD = 0.24, BONK_KNOCK = 4.6, BONK_ANIM = 0.3;
export const HOLD_DELAY = 0.16, CHARGE_TIME = 0.7, MIN_CHARGE = 0.3, CHARGE_SLOW = 0.4;
export const SPIN_TIME = 0.32, WATER_EVERY = 0.85;
export const MULTI_WINDOW = 0.7, BOWL_SPEED = 2.4;
export const DIZZY = 0.8, INVULN = 1.3, GIANT = 8, COMBO_TIME = 2.6;

// speed in units per second at wave 1; bite: seconds per point of bed health it eats
export const KINDS = {
  beetle:   { hp: 1, speed: 0.95, r: 0.2,  points: 50,  from: 1, weight: 4,   bite: 3.2 },
  hopper:   { hp: 1, speed: 1.7,  r: 0.22, points: 80,  from: 2, weight: 2,   bite: 3.2 },
  stag:     { hp: 2, speed: 0.7,  r: 0.27, points: 150, from: 3, weight: 1.3, bite: 2.6, armour: true, pinch: true },
  stinkbug: { hp: 1, speed: 0.8,  r: 0.2,  points: 60,  from: 4, weight: 1.3, bite: 3.2, stink: true },
  snail:    { hp: 4, speed: 0.42, r: 0.28, points: 150, from: 6, weight: 1,   bite: 2.4, heavy: 0.4 },
  queen:    { hp: 12, speed: 0.32, r: 0.6, points: 600, from: BOSS_EVERY, weight: 0, bite: 1.1, heavy: 0.15, pinch: true },
  ladybug:  { hp: 1, speed: 2.3,  r: 0.2,  points: 150, from: 2, weight: 0, friend: true },
  weed:     { hp: 1, speed: 0,    r: 0.22, points: 10,  from: 99, weight: 0, friend: true },
};
export const HOSTILE = k => !KINDS[k].friend;
// What the TV says when a pest first turns up (it shows the pest's own sprite next to the line).
export const INTRO = {
  hopper: 'Grasshoppers! Quick and jumpy.',
  ladybug: 'Ladybugs are friends. Catch one for a power-up.',
  stag: 'Stag beetles! Bonks bounce off the armour. Hold to spin.',
  stinkbug: 'Stinkbugs! Bonk one into a crowd, then stand clear.',
  snail: 'Snails! Slow, but they take a beating.',
};
export const POWERS = ['rain', 'bees', 'giant', 'bloom'];

export function rng(seed = Date.now()) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function newPlayer(name = '', x = 8, y = 4.7) {
  return { name, x, y, vx: 0, vy: 0, fx: 1, fy: 0, ix: 0, iy: 0, btn: false, on: true,
    cd: 0, bonkT: 0, hurtT: 0, pluckT: 0, holding: false, holdT: 0, charge: 0, mode: '', spinT: 0, spinR: 0, spinDmg: 0, spinHit: null, waterT: 0, watering: false,
    stun: 0, inv: 0, giantT: 0, moving: 0,
    score: 0, combo: 0, comboT: 0, best: 0, kills: 0, hits: 0, spinKills: 0, boomKills: 0, waters: 0, harvests: 0,
    wakes: 0, gifts: 0, ouches: 0, dist: 0, bonks: 0, bowled: 0, multi: 0, multiT: 0, bestMulti: 0, ev: 0, last: '' };
}

function newPlots(r) {
  return PLOTS.map(([x, y], i) => ({ i, x, y, crop: CROPS[i], hp: 3, g: 0.2 + r() * 0.5, wetT: 0, munchers: 0 }));
}

export function newGame(seed) {
  const r = rng(seed);
  return { phase: 'lobby', t: 0, wave: 0, waveT: 0, timer: 0, players: {}, enemies: [], queue: [], plots: newPlots(r),
    next: 1, r, log: [], waveLost: 0, tev: 0, tlast: '', fresh: [] };
}

const around = (G, k) => { const a = (k / 8) * Math.PI * 2 + G.r() * 0.6; return [8 + Math.cos(a) * 1.9, 4.7 + Math.sin(a) * 1.25]; };

// Make sure a seat has a gardener (they keep their score if they drop out and come back).
export function ensure(G, seat, name) {
  let p = G.players[seat];
  if (!p) { const [x, y] = around(G, SEATS.indexOf(seat)); p = G.players[seat] = newPlayer(name, x, y); }
  else if (name) p.name = name;
  return p;
}

// A new game: fresh scores and garden, gardeners stay where they stand.
export function startGame(G, seats) {
  const seed = Math.floor(G.r() * 2 ** 31), keep = G.players;
  Object.assign(G, newGame(seed));
  for (const s of seats) { const o = keep[s], p = ensure(G, s, o?.name); if (o) { p.x = o.x; p.y = o.y; p.fx = o.fx; } }
  for (const pl of G.plots) pl.g = 0.1 + G.r() * 0.3;
  startWave(G);
}

export const speedScale = wave => Math.min(1.8, 1 + 0.05 * (wave - 1));
export const isBossWave = wave => wave > 0 && wave % BOSS_EVERY === 0;
const nPlayers = G => Math.max(1, Object.values(G.players).filter(p => p.on).length);

// A random point just outside the lawn's edge.
function edgePoint(r) {
  const per = 2 * (W + H), d = r() * per;
  if (d < W) return [d, -0.4];
  if (d < W + H) return [W + 0.4, d - W];
  if (d < 2 * W + H) return [d - W - H, H + 0.4];
  return [-0.4, d - 2 * W - H];
}

// The wave's spawn list: groups of 1–3 pests from one spot on the edge, spread over the wave.
export function planWave(G) {
  const n = G.wave, P = nPlayers(G), r = G.r;
  const boss = isBossWave(n);
  const count = Math.min(70, Math.round((5 + 2.6 * n) * (0.65 + 0.35 * P) * (boss ? 0.55 : 1)));
  const span = Math.min(42, 14 + 2.2 * n);
  const kinds = Object.entries(KINDS).filter(([, k]) => k.weight && k.from <= n);
  const total = kinds.reduce((a, [, k]) => a + k.weight, 0);
  const pickKind = () => { let x = r() * total; for (const [name, k] of kinds) if ((x -= k.weight) < 0) return name; return 'beetle'; };
  const q = [];
  // newly unlocked kinds show up early so the TV's introduction makes sense
  const fresh = kinds.filter(([, k]) => k.from === n).map(([name]) => name);
  let made = 0, t = 1.2;
  while (made < count) {
    const size = Math.min(count - made, 1 + Math.floor(r() * (n < 3 ? 2 : 3)));
    const [x, y] = edgePoint(r);
    for (let i = 0; i < size; i++) {
      const kind = fresh.length && made < 2 ? fresh[made % fresh.length] : pickKind();
      q.push({ at: t + i * 0.35, kind, x: x + (r() - 0.5) * 0.8, y: y + (r() - 0.5) * 0.8 });
      made++;
    }
    t += (span / Math.max(1, count)) * size * (0.6 + r() * 0.8);
  }
  if (boss) { const [x, y] = edgePoint(r); q.push({ at: Math.max(3, t * 0.4), kind: 'queen', x, y }); }
  if (n >= 2) for (let i = 0; i < (P >= 5 ? 2 : 1); i++) { const [x, y] = edgePoint(r); q.push({ at: 4 + r() * span * 0.8, kind: 'ladybug', x, y }); }
  q.sort((a, b) => a.at - b.at);
  return { queue: q, fresh: [...fresh, ...(n === 2 ? ['ladybug'] : [])] };
}

export function startWave(G) {
  G.wave++; G.phase = 'wave'; G.waveT = 0; G.waveLost = 0;
  G.enemies = G.enemies.filter(e => e.kind !== 'weed');
  const { queue, fresh } = planWave(G);
  G.queue = queue; G.fresh = fresh;
  G.log.push(['wave', G.wave, fresh]);
}

export const breakOver = G => G.phase === 'break' && G.timer <= 0;

function spawn(G, kind, x, y) {
  const k = KINDS[kind], P = nPlayers(G);
  const hp = kind === 'queen' ? 10 + 4 * P + 2 * Math.floor(G.wave / BOSS_EVERY) : k.hp;
  const e = { id: G.next++, kind, x, y, kx: 0, ky: 0, hp, max: hp, r: k.r, hurt: 0, fly: 0, owner: null, munch: 0, eating: -1,
    hopT: G.r(), face: x < W / 2 ? 1 : -1, by: null, flingT: 0, bowledIds: null, life: kind === 'ladybug' ? 13 : 0, leaving: false, tx: x, ty: y, t: G.r() * 10 };
  G.enemies.push(e);
  return e;
}

// ---------- input ----------
// What a phone sends: the stick (x, y in -1..1) and the button (b 0/1). Presses and releases are acted on at once.
export function input(G, seat, { x = 0, y = 0, b = 0 } = {}) {
  const p = G.players[seat]; if (!p) return;
  x = +x || 0; y = +y || 0;
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  p.ix = x; p.iy = y;
  if (b && !p.btn) press(G, seat, p);
  else if (!b && p.btn) release(G, seat, p);
  p.btn = !!b;
}

const plotAt = (G, x, y, pad = 0) => G.plots.find(pl => Math.abs(x - pl.x) <= PLOT_W / 2 + pad && Math.abs(y - pl.y) <= PLOT_H / 2 + pad);
export const standingIn = (G, p) => plotAt(G, p.x, p.y, -0.05);
// Where you stand, for the phone's label: 1 = a thirsty bed (stand still to water it), 2 = tap harvests it
export function context(G, p) {
  if (G.phase === 'lobby' || G.phase === 'over') return 0;
  const pl = standingIn(G, p); if (!pl) return 0;
  return (pl.hp < 3 ? 1 : 0) | (pl.hp > 0 && pl.g >= 1 ? 2 : 0);
}

function press(G, s, p) {
  if (!p.on || p.stun > 0 || p.spinT > 0) return;
  bonk(G, s, p);
  p.holding = true; p.holdT = 0; p.charge = 0; p.mode = 'charge';
}

function release(G, s, p) {
  if (p.holding && p.mode === 'charge' && p.charge >= MIN_CHARGE && p.stun <= 0) spin(G, s, p);
  p.holding = false; p.charge = 0; p.holdT = 0; p.mode = '';
}

function evt(p, what) { p.ev++; p.last = what; }
const mult = p => 1 + Math.min(2, Math.floor(p.combo / 10) * 0.5);

function bonk(G, s, p) {
  if (p.cd > 0) return;
  p.cd = BONK_CD; p.bonkT = BONK_ANIM; p.bonks++;
  const big = p.giantT > 0, range = BONK_RANGE * (big ? 1.7 : 1);
  let hits = 0;
  for (const e of G.enemies) {
    if (e.dead || e.fly > 0) continue;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1e-6;
    if (d - e.r > range) continue;
    if (d > e.r + R && (dx * p.fx + dy * p.fy) / d < BONK_COS) continue;
    hits++;
    hitEnemy(G, s, e, big ? 2 : 1, dx / d, dy / d, BONK_KNOCK * (big ? 1.5 : 1), 'bonk');
  }
  // teammates: a dizzy friend is bonked awake, anyone else just gets a shove
  for (const [o, q] of Object.entries(G.players)) {
    if (o === s || !q.on) continue;
    const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1e-6;
    if (d > range + R || (dx * p.fx + dy * p.fy) / d < BONK_COS) continue;
    if (q.stun > 0) { q.stun = 0; q.inv = 0.8; p.wakes++; p.score += 25; evt(p, 'wake'); evt(q, 'woke'); G.log.push(['wake', s, o]); }
    else { q.vx += dx / d * 5; q.vy += dy / d * 5; }
  }
  // a ripe bed under your feet, or in front of you
  const pl = standingIn(G, p) || plotAt(G, p.x + p.fx * 0.5, p.y + p.fy * 0.5);
  if (pl && pl.hp > 0 && pl.g >= 1 && G.phase !== 'lobby' && G.phase !== 'over') {
    pl.g = 0; p.harvests++; p.score += 150; p.pluckT = 0.3; evt(p, 'harvest'); G.log.push(['harvest', s, pl.i]);
  }
  G.log.push(['bonk', s, hits]);
}

function spin(G, s, p) {
  const c = p.charge;
  p.spinT = SPIN_TIME; p.spinR = (0.85 + 0.65 * c) * (p.giantT > 0 ? 1.4 : 1); p.spinDmg = c >= 1 ? 3 : 2; p.spinHit = new Set();
  p.inv = Math.max(p.inv, SPIN_TIME + 0.15);
  p.vx += p.fx * 5 * c; p.vy += p.fy * 5 * c;
  evt(p, 'spin'); G.log.push(['spin', s, p.spinR, c >= 1]);
}

function hitEnemy(G, s, e, dmg, nx, ny, knock, how) {
  const p = G.players[s], k = KINDS[e.kind];
  if (e.kind === 'ladybug') { catchLadybug(G, s, e); return; }
  if (k.armour && how === 'bonk') {
    e.kx += nx * knock * 0.7; e.ky += ny * knock * 0.7; e.hurt = 0.08;
    if (p) evt(p, 'clink');
    G.log.push(['clink', s, e.x, e.y]); return;
  }
  if (k.stink && how === 'bonk') {
    e.fly = 0.75; e.owner = s; e.kx = nx * 10; e.ky = ny * 10; e.eating = -1;
    if (p) { p.hits++; addCombo(p); evt(p, 'launch'); }
    G.log.push(['launch', s, e.id]); return;
  }
  const heavy = k.heavy || 1;
  e.hp -= dmg; e.hurt = 0.15; e.kx += nx * knock * heavy; e.ky += ny * knock * heavy; e.eating = -1;
  // knocked hard enough, it goes flying, and bowls over whatever it hits (see stepEnemies)
  e.by = s; if (knock * heavy >= 3.5) { e.flingT = 0.4; e.bowledIds = new Set(); }
  if (p) { p.hits++; addCombo(p); p.score += Math.round(10 * mult(p)); evt(p, 'hit'); }
  G.log.push(['hit', s, e.id, e.x, e.y, how]);
  if (e.kind === 'queen' && e.hp > 0 && G.r() < 0.4) { const b = spawn(G, 'beetle', e.x, e.y); b.kx = -nx * 3 + (G.r() - 0.5) * 4; b.ky = -ny * 3 + (G.r() - 0.5) * 4; }
  if (e.hp <= 0) kill(G, e, s, how);
}

function addCombo(p) { p.combo++; p.comboT = COMBO_TIME; p.best = Math.max(p.best, p.combo); }

function kill(G, e, s, how) {
  if (e.dead) return;
  e.dead = true;
  const p = G.players[s], k = KINDS[e.kind];
  let pts = 0;
  if (p) {
    pts = Math.round(k.points * mult(p) * (G.phase === 'lobby' ? 0 : 1));
    p.score += pts; p.kills++;
    if (how === 'spin') p.spinKills++;
    if (how === 'stink') p.boomKills++;
    if (how === 'bowl') p.bowled++;
    p.multi = p.multiT > 0 ? p.multi + 1 : 1; p.multiT = MULTI_WINDOW;
    p.bestMulti = Math.max(p.bestMulti, p.multi);
    evt(p, 'kill');
    if (p.multi >= 2 && G.phase !== 'lobby') {
      const bonus = 50 * p.multi; p.score += bonus;
      evt(p, 'multi'); G.log.push(['multi', s, p.multi, e.x, e.y, bonus]);
    }
  }
  G.log.push(['kill', s, e.kind, e.x, e.y, pts, how]);
  if (k.stink) stink(G, e.x, e.y, s);
  // knocked to death, it keeps skidding for a moment and can still bowl into others
  else e.ghost = e.kind === 'queen' ? 0.7 : 0.32;
  if (!(e.flingT > 0 && (how === 'bonk' || how === 'spin' || how === 'bowl'))) e.flingT = 0;
  if (e.kind === 'queen') {
    for (const q of Object.values(G.players)) q.score += 300;
    for (const pl of G.plots) pl.hp = Math.min(3, pl.hp + 1);
    G.tev++; G.tlast = 'queen';
  }
}

export const STINK_R = 1.4;
function stink(G, x, y, s) {
  G.log.push(['stink', x, y, s]);
  for (const e of G.enemies) {
    if (e.dead || !HOSTILE(e.kind)) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1e-6;
    if (d > STINK_R + e.r) continue;
    hitEnemy(G, s, e, 2, dx / d, dy / d, 5, 'stink');
  }
  for (const [o, q] of Object.entries(G.players)) {
    const dx = q.x - x, dy = q.y - y, d = Math.hypot(dx, dy) || 1e-6;
    if (q.on && d < STINK_R * 0.85) dizzy(G, o, q, dx / d, dy / d, DIZZY);
  }
}

function dizzy(G, s, p, nx, ny, secs) {
  if (p.inv > 0 || p.spinT > 0) return false;
  p.stun = secs; p.hurtT = 0.2; p.inv = secs + INVULN; p.vx += nx * 6; p.vy += ny * 6;
  p.combo = 0; p.ouches++; p.holding = false; p.charge = 0; p.mode = '';
  evt(p, 'ouch'); G.log.push(['ouch', s, p.x, p.y]);
  return true;
}

function catchLadybug(G, s, e) {
  if (e.dead) return;
  e.dead = true;
  const p = G.players[s], power = POWERS[Math.floor(G.r() * POWERS.length)];
  if (p) { p.gifts++; p.score += KINDS.ladybug.points; evt(p, 'gift'); }
  G.log.push(['power', power, s, e.x, e.y]);
  G.tev++; G.tlast = power;
  if (power === 'rain') for (const pl of G.plots) { pl.hp = Math.min(3, pl.hp + 1); pl.wetT = 4; }
  if (power === 'bloom') for (const pl of G.plots) if (pl.hp > 0) pl.g = 1;
  if (power === 'giant' && p) p.giantT = GIANT;
  if (power === 'bees') {
    // the bees go for the pests that are eating, then the ones closest to the garden
    const near = e2 => Math.min(...G.plots.map(pl => Math.hypot(e2.x - pl.x, e2.y - pl.y)));
    const targets = G.enemies.filter(x => !x.dead && HOSTILE(x.kind)).sort((a, b) => (b.eating >= 0) - (a.eating >= 0) || near(a) - near(b)).slice(0, 7);
    for (const t of targets) { G.log.push(['bee', t.x, t.y]); hitEnemy(G, s, t, 3, 0, -1, 2, 'bees'); }
  }
}

// ---------- the clock ----------
export function step(G, dt, live = () => true) {
  G.t += dt;
  for (const [s, p] of Object.entries(G.players)) { p.on = live(s); stepPlayer(G, s, p, dt); }
  separatePlayers(G);

  if (G.phase === 'wave') {
    G.waveT += dt;
    while (G.queue.length && G.queue[0].at <= G.waveT) { const q = G.queue.shift(); spawn(G, q.kind, q.x, q.y); }
  }
  if (G.phase === 'break') G.timer -= dt;
  if (G.phase === 'lobby') lobbyWeeds(G, dt);

  for (const pl of G.plots) {
    pl.wetT = Math.max(0, pl.wetT - dt);
    if ((G.phase === 'wave' || G.phase === 'break') && pl.hp > 0 && pl.g < 1) pl.g = Math.min(1, pl.g + dt / GROW * (0.4 + 0.2 * pl.hp));
    pl.munchers = 0;
  }
  stepEnemies(G, dt);
  G.enemies = G.enemies.filter(e => (!e.dead || e.ghost > 0) && !e.gone);

  if (G.phase === 'wave' && !G.queue.length && !G.enemies.some(e => !e.dead && HOSTILE(e.kind))) {
    const perfect = G.waveLost === 0, hearts = G.plots.reduce((a, pl) => a + pl.hp, 0), bonus = hearts * 10;
    for (const p of Object.values(G.players)) if (p.on) p.score += bonus + (perfect ? 100 * G.wave : 0);
    G.log.push(['tally', hearts, bonus]);
    for (const e of G.enemies) e.leaving = true;
    G.phase = 'break'; G.timer = BREAK;
    G.log.push(['cleared', G.wave, perfect]);
    if (perfect) { G.tev++; G.tlast = 'perfect'; }
  }
}

function stepPlayer(G, s, p, dt) {
  p.cd = Math.max(0, p.cd - dt); p.bonkT = Math.max(0, p.bonkT - dt); p.hurtT = Math.max(0, p.hurtT - dt); p.pluckT = Math.max(0, p.pluckT - dt); p.inv = Math.max(0, p.inv - dt);
  p.giantT = Math.max(0, p.giantT - dt); p.multiT = Math.max(0, p.multiT - dt);
  if (p.combo && (p.comboT -= dt) <= 0) p.combo = 0;
  const ix = p.on ? p.ix : 0, iy = p.on ? p.iy : 0;
  if (!p.on) { p.holding = false; p.charge = 0; }
  if (p.stun > 0 || !p.on) { p.watering = false; p.waterT = 0; }
  let tx = 0, ty = 0;
  if (p.stun > 0) {
    p.stun = Math.max(0, p.stun - dt);
  } else {
    if (p.spinT > 0) {
      p.spinT = Math.max(0, p.spinT - dt);
      for (const e of G.enemies) {
        if (e.dead || e.fly > 0 || p.spinHit.has(e.id)) continue;
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1e-6;
        if (d > p.spinR + e.r) continue;
        p.spinHit.add(e.id);
        hitEnemy(G, s, e, p.spinDmg, dx / d, dy / d, 6.5, 'spin');
      }
    }
    if (p.holding) {
      p.holdT += dt;
      if (p.mode === 'charge') {
        const c = clamp((p.holdT - HOLD_DELAY) / CHARGE_TIME, 0, 1);
        if (c >= 1 && p.charge < 1) { evt(p, 'charged'); G.log.push(['charged', s]); }
        p.charge = c;
      }
    }
    // standing still in a thirsty bed waters it: no button, so the hold stays free to charge a spin anywhere
    // (charging, swinging or walking puts the can down)
    const pl = G.phase !== 'lobby' && G.phase !== 'over' && standingIn(G, p);
    p.watering = !!(pl && pl.hp < 3 && Math.hypot(ix, iy) < 0.3 && !(p.holding && p.holdT > HOLD_DELAY) && p.bonkT <= 0 && p.spinT <= 0);
    if (!p.watering) p.waterT = 0;
    else if ((p.waterT += dt) >= WATER_EVERY) {
      p.waterT = 0; pl.hp++; pl.wetT = 3; p.waters++; p.score += 20; evt(p, 'water'); G.log.push(['water', s, pl.i, pl.hp]);
    }
    const slow = p.holding && p.holdT > HOLD_DELAY ? CHARGE_SLOW : 1;
    tx = ix * SPEED * slow; ty = iy * SPEED * slow;
    if (Math.hypot(ix, iy) > 0.25) { const m = Math.hypot(ix, iy); p.fx = ix / m; p.fy = iy / m; }
  }
  const a = Math.min(1, ACCEL * dt);
  p.vx += (tx - p.vx) * a; p.vy += (ty - p.vy) * a;
  const ox = p.x, oy = p.y;
  p.x = clamp(p.x + p.vx * dt, R, W - R); p.y = clamp(p.y + p.vy * dt, TOP, H - R * 0.6);
  const moved = Math.hypot(p.x - ox, p.y - oy);
  p.dist += moved; p.moving = moved / Math.max(dt, 1e-6);
}

function separatePlayers(G) {
  const ps = Object.values(G.players).filter(p => p.on);
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i], b = ps[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = R * 1.6;
    if (d > 0 && d < min) { const k = (min - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; }
  }
}

// the nearest living bed, and the point on its edge to walk to
function target(G, e) {
  let best = null, bd = 1e9;
  for (const pl of G.plots) {
    if (pl.hp <= 0) continue;
    const px = clamp(e.x, pl.x - PLOT_W / 2, pl.x + PLOT_W / 2), py = clamp(e.y, pl.y - PLOT_H / 2, pl.y + PLOT_H / 2);
    const d = Math.hypot(e.x - px, e.y - py);
    if (d < bd) { bd = d; best = { pl, px, py, d }; }
  }
  return best;
}

function stepEnemies(G, dt) {
  const slow = 1, sc = speedScale(G.wave);
  for (const e of G.enemies) {
    if (e.dead) {
      if (e.ghost > 0) { e.ghost -= dt; e.x += e.kx * dt; e.y += e.ky * dt; const f = Math.exp(-4 * dt); e.kx *= f; e.ky *= f; }
      continue;
    }
    const k = KINDS[e.kind];
    e.t += dt; e.hurt = Math.max(0, e.hurt - dt);
    if (e.fly > 0) {
      // a bonked stinkbug, tumbling: it bursts when it hits another pest or lands
      e.fly -= dt; e.x += e.kx * dt; e.y += e.ky * dt; e.kx *= Math.exp(-1.5 * dt); e.ky *= Math.exp(-1.5 * dt);
      if (e.x < 0 || e.x > W) e.kx *= -1;
      if (e.y < TOP || e.y > H) e.ky *= -1;
      const bump = G.enemies.find(o => o !== e && !o.dead && HOSTILE(o.kind) && Math.hypot(o.x - e.x, o.y - e.y) < o.r + e.r + 0.05);
      if (bump || e.fly <= 0) kill(G, e, e.owner, 'bonk');
      continue;
    }
    let vx = 0, vy = 0;
    if (e.kind === 'weed') { /* rooted */ }
    else if (e.kind === 'ladybug') {
      e.life -= dt;
      if (e.life <= 0 || G.phase !== 'wave') e.leaving = true;
      let near = null, nd = 2.4;
      for (const p of Object.values(G.players)) { if (!p.on) continue; const d = Math.hypot(p.x - e.x, p.y - e.y); if (d < nd) { nd = d; near = p; } }
      let gx, gy;
      if (e.leaving) { gx = e.x < W / 2 ? -1 : W + 1; gy = e.y; }
      else if (near) { gx = e.x + (e.x - near.x); gy = e.y + (e.y - near.y); }
      else {
        if (Math.hypot(e.tx - e.x, e.ty - e.y) < 0.3 || !e.tx) { e.tx = 1.5 + G.r() * (W - 3); e.ty = TOP + 0.6 + G.r() * (H - TOP - 1.4); }
        gx = e.tx; gy = e.ty;
      }
      const dx = gx - e.x, dy = gy - e.y, d = Math.hypot(dx, dy) || 1;
      const sp = k.speed * (near && !e.leaving ? 1.15 : 0.7);
      vx = dx / d * sp; vy = dy / d * sp;
      if (e.leaving && (e.x < -0.6 || e.x > W + 0.6)) { e.gone = true; G.log.push(['escape', e.x, e.y]); continue; }
      if (!e.leaving) { e.x = clamp(e.x, 0.3, W - 0.3); e.y = clamp(e.y, TOP, H - 0.3); }
    } else {
      const tg = target(G, e);
      if (tg && tg.d <= e.r * 0.6) {
        // munching
        if (e.eating !== tg.pl.i) { e.eating = tg.pl.i; e.munch = 0; }
        tg.pl.munchers++;
        if ((e.munch += dt) >= k.bite) {
          e.munch = 0; tg.pl.hp--; tg.pl.g = Math.max(0, tg.pl.g - 0.25); G.waveLost++;
          G.log.push(['bite', tg.pl.i, tg.pl.hp, e.x, e.y]);
          if (tg.pl.hp <= 0) { G.log.push(['wilt', tg.pl.i]); if (G.plots.every(pl => pl.hp <= 0)) { G.phase = 'over'; G.log.push(['over']); } }
        }
      } else if (tg) {
        e.eating = -1;
        const dx = tg.px - e.x, dy = tg.py - e.y, d = Math.hypot(dx, dy) || 1;
        let sp = k.speed * sc * slow;
        if (e.kind === 'hopper') { e.hopT = (e.hopT + dt / 0.75) % 1; sp *= e.hopT < 0.35 ? 2.7 : 0.08; }
        vx = dx / d * sp; vy = dy / d * sp;
      }
    }
    e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt;
    const f = Math.exp(-7 * dt); e.kx *= f; e.ky *= f;
    if (Math.abs(vx + e.kx) > 0.05) e.face = vx + e.kx > 0 ? 1 : -1;
  }
  // bowling: a pest knocked flying knocks down the pests it hits, which fly on and knock down more
  for (const e of G.enemies) {
    if ((e.dead && !(e.ghost > 0)) || !(e.flingT > 0)) continue;
    e.flingT -= dt; e.bowledIds ??= new Set();
    const sp = Math.hypot(e.kx, e.ky); if (sp < BOWL_SPEED) continue;
    for (const o of G.enemies) {
      if (o === e || o.dead || o.fly > 0 || !HOSTILE(o.kind) || e.bowledIds.has(o.id)) continue;
      const dx = o.x - e.x, dy = o.y - e.y, d = Math.hypot(dx, dy) || 1e-6;
      if (d > o.r + e.r + 0.04) continue;
      e.bowledIds.add(o.id);
      G.log.push(['bowl', e.by, o.x, o.y]);
      hitEnemy(G, e.by, o, 1, (dx / d + e.kx / sp) / 2, (dy / d + e.ky / sp) / 2, sp * 0.95, 'bowl');
      e.kx *= 0.7; e.ky *= 0.7;
    }
  }
  // pests jostle for room, and push (and some pinch) gardeners
  const es = G.enemies.filter(e => !e.dead && e.fly <= 0);
  for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
    const a = es[i], b = es[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.9;
    if (d > 0 && d < min) {
      const ha = KINDS[a.kind].heavy ? 0.2 : 0.5, hb = KINDS[b.kind].heavy ? 0.2 : 0.5, k = (min - d) / d;
      a.x -= dx * k * ha; a.y -= dy * k * ha; b.x += dx * k * hb; b.y += dy * k * hb;
    }
  }
  for (const [s, p] of Object.entries(G.players)) {
    if (!p.on) continue;
    for (const e of es) {
      if (KINDS[e.kind].friend) continue;
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), min = R + e.r;
      if (d <= 0 || d >= min) continue;
      const k = (min - d) / d;
      p.x += dx * k * 0.6; p.y += dy * k * 0.6; e.x -= dx * k * 0.4; e.y -= dy * k * 0.4;
      if (KINDS[e.kind].pinch && p.spinT <= 0) dizzy(G, s, p, dx / d, dy / d, e.kind === 'queen' ? 1.1 : DIZZY);
    }
  }
}

function lobbyWeeds(G, dt) {
  G.weedT = (G.weedT || 0) - dt;
  if (G.enemies.filter(e => e.kind === 'weed').length < 3 && G.weedT <= 0) {
    G.weedT = 1.2;
    const spots = [[12.6, 2.2], [13.8, 4.6], [12.4, 7.2], [14.6, 6.4], [13.2, 3.4]];
    const free = spots.filter(([x, y]) => !G.enemies.some(e => Math.hypot(e.x - x, e.y - y) < 0.5));
    if (free.length) { const [x, y] = free[Math.floor(G.r() * free.length)]; spawn(G, 'weed', x, y); G.log.push(['sprout', x, y]); }
  }
}

// ---------- the end ----------
export const ranking = G => Object.entries(G.players).sort((a, b) => b[1].score - a[1].score);

// [art (a ui_icons set or sprite id), title, measure, line]
const AWARDS = [
  ['rake', 'Pest Smasher', p => p.kills, p => `${p.kills} pests bonked`],
  ['carrot', 'Harvest Hero', p => p.harvests, p => `${p.harvests} crops picked`],
  ['watering_can', 'Water Wizard', p => p.waters, p => `${p.waters} beds watered`],
  ['flame', 'Combo Champ', p => p.best, p => `best combo ${p.best}`],
  ['bowling_pin', 'Bug Bowler', p => p.bowled, p => `${p.bowled} pests bowled over`],
  ['bolt', 'Multi Masher', p => p.bestMulti >= 3 ? p.bestMulti : 0, p => `${p.bestMulti} pests in one go`],
  ['spin', 'Spin Doctor', p => p.spinKills, p => `${p.spinKills} pests swept away`],
  ['stink', 'Stink Bomber', p => p.boomKills, p => `${p.boomKills} pests gassed`],
  ['friends', 'Good Friend', p => p.wakes, p => `woke ${p.wakes} friend${p.wakes === 1 ? '' : 's'} up`],
  ['ladybug', 'Ladybug Lover', p => p.gifts, p => `${p.gifts} ladybug${p.gifts === 1 ? '' : 's'} caught`],
  ['swirl', 'Dizzy Dancer', p => p.ouches, p => `dizzy ${p.ouches} time${p.ouches === 1 ? '' : 's'}`],
  ['boot', 'Wanderer', p => p.dist / 40, p => `walked ${Math.round(p.dist)} m`],
];
// One award each, no two the same: each player gets the one they are most outstanding at, relative to the table.
export function awards(G) {
  const ps = Object.entries(G.players), out = {}, used = new Set(), cand = [];
  for (const [ai, [, , f]] of AWARDS.entries()) {
    const max = Math.max(0, ...ps.map(([, p]) => f(p)));
    if (max <= 0) continue;
    for (const [s, p] of ps) if (f(p) > 0) cand.push({ s, ai, v: f(p) / max + f(p) * 1e-4 });
  }
  cand.sort((a, b) => b.v - a.v || a.ai - b.ai);
  for (const c of cand) {
    if (out[c.s] || used.has(c.ai)) continue;
    const [icon, title, , why] = AWARDS[c.ai];
    out[c.s] = { icon, title, why: why(G.players[c.s]) }; used.add(c.ai);
  }
  for (const [s] of ps) out[s] ??= { icon: 'seedling', title: 'Little Sprout', why: 'just happy to be in the garden' };
  return out;
}
