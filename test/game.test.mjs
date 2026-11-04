import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, startGame, startWave, step, input, ensure, breakOver, awards, context, KINDS, PLOTS, HOLD_DELAY, CHARGE_TIME, WATER_EVERY, BREAK } from '../game.js';

const run = (G, secs, live) => { for (let i = 0; i < Math.round(secs * 30); i++) step(G, 1 / 30, live); };
const tap = (G, s, x = 0, y = 0) => { input(G, s, { x, y, b: 1 }); input(G, s, { x, y, b: 0 }); };
const pest = (G, kind, x, y) => { const e = { id: G.next++, kind, x, y, kx: 0, ky: 0, hp: KINDS[kind].hp, max: KINDS[kind].hp, r: KINDS[kind].r, hurt: 0, fly: 0, munch: 0, eating: -1, hopT: 0, face: 1, life: 10, t: 0 }; G.enemies.push(e); return e; };
function game(seats = ['p1']) { const G = newGame(7); for (const s of seats) ensure(G, s, s); startGame(G, seats); G.queue = []; G.enemies = []; return G; }
const place = (p, x, y, fx = 1, fy = 0) => Object.assign(p, { x, y, fx, fy, vx: 0, vy: 0 });

test('pests left alone eat the garden until every bed wilts', () => {
  const G = newGame(1); ensure(G, 'p1', 'A'); startGame(G, ['p1']);
  assert.equal(G.phase, 'wave'); assert.ok(G.queue.length > 0);
  for (let i = 0; i < 3 && G.phase !== 'over'; i++) { run(G, 400); if (breakOver(G)) startWave(G); }
  assert.equal(G.phase, 'over');
  assert.ok(G.plots.every(pl => pl.hp === 0));
});

test('a bonk hits the beetle in front, not the one behind', () => {
  const G = game(), p = G.players.p1; place(p, 2, 2);
  const front = pest(G, 'beetle', 2.6, 2), back = pest(G, 'beetle', 1.3, 2);
  tap(G, 'p1');
  run(G, 0.5);
  assert.ok(!G.enemies.includes(front), 'front beetle squashed');
  assert.ok(G.enemies.includes(back));
  assert.equal(p.kills, 1); assert.ok(p.score > 0);
});

test('stag beetles shrug off bonks; a charged spin gets them', () => {
  const G = game(), p = G.players.p1; place(p, 2, 2);
  const stag = pest(G, 'stag', 2.5, 2);
  tap(G, 'p1'); step(G, 1 / 30);
  assert.equal(stag.hp, KINDS.stag.hp, 'bonk bounced off');
  place(p, 2, 2); stag.x = 6; stag.y = 8; stag.kx = stag.ky = 0;
  run(G, 0.3);
  input(G, 'p1', { b: 1 }); run(G, HOLD_DELAY + CHARGE_TIME + 0.05);
  assert.equal(p.charge, 1);
  place(p, 2, 2); stag.x = 2.6; stag.y = 2; stag.kx = stag.ky = 0;
  input(G, 'p1', { b: 0 }); run(G, 0.5);
  assert.ok(!G.enemies.includes(stag), 'swept away');
  assert.equal(p.spinKills, 1);
});

test('a bonked stinkbug flies into a crowd and gasses it (and dizzies a gardener standing in it)', () => {
  const G = game(['p1', 'p2']), p = G.players.p1, q = G.players.p2; place(p, 2, 4); place(q, 4.6, 4.9);
  const bug = pest(G, 'stinkbug', 2.5, 4), a = pest(G, 'beetle', 4.4, 4), b = pest(G, 'beetle', 4.6, 4.5);
  tap(G, 'p1');
  run(G, 1);
  assert.ok(!G.enemies.includes(bug) && !G.enemies.includes(a) && !G.enemies.includes(b));
  assert.equal(p.boomKills, 2);
  assert.ok(q.stun > 0 || q.ouches === 1, 'p2 got a whiff');
});

test('bonking a dizzy friend wakes them', () => {
  const G = game(['p1', 'p2']), p = G.players.p1, q = G.players.p2; place(p, 2, 2); place(q, 2.5, 2);
  q.stun = 0.8;
  tap(G, 'p1');
  assert.equal(q.stun, 0); assert.equal(p.wakes, 1);
});

test('holding in a thirsty bed waters it; tapping a ripe bed harvests it', () => {
  const G = game(), p = G.players.p1, pl = G.plots[0];
  pl.hp = 1; pl.g = 0.3; place(p, pl.x, pl.y);
  assert.equal(context(G, p) & 1, 1);
  input(G, 'p1', { b: 1 }); run(G, WATER_EVERY * 2 + 0.1);
  assert.equal(pl.hp, 3); assert.equal(p.waters, 2);
  input(G, 'p1', { b: 0 }); run(G, 0.3);
  assert.equal(p.charge, 0, 'watering never charges a spin');
  pl.g = 1; assert.equal(context(G, p) & 2, 2);
  tap(G, 'p1');
  assert.equal(pl.g, 0); assert.equal(p.harvests, 1);
});

test('a munching pest costs its bed health, and a cleared wave gives a break then the next wave', () => {
  const G = game(), pl = G.plots[1];
  const e = pest(G, 'beetle', pl.x, pl.y - 0.9);
  run(G, KINDS.beetle.bite + 2);
  assert.equal(pl.hp, 2);
  G.enemies = [];
  step(G, 1 / 30);
  assert.equal(G.phase, 'break');
  run(G, BREAK + 0.1);
  assert.ok(breakOver(G));
  startWave(G); assert.equal(G.wave, 2);
});

test('catching a ladybug fires a team power-up', () => {
  const G = game(), p = G.players.p1; place(p, 2, 2);
  pest(G, 'ladybug', 2.5, 2);
  G.plots[0].hp = 1;
  tap(G, 'p1');
  assert.equal(p.gifts, 1); assert.ok(G.tev > 0);
  assert.ok(['rain', 'bees', 'giant', 'bloom'].includes(G.tlast));
});

test('everyone gets a different award', () => {
  const G = game(['p1', 'p2', 'p3']);
  Object.assign(G.players.p1, { kills: 30, harvests: 1 }); Object.assign(G.players.p2, { kills: 29, harvests: 5 }); Object.assign(G.players.p3, { waters: 3 });
  const A = awards(G), titles = Object.values(A).map(a => a.title);
  assert.equal(new Set(titles).size, 3);
  assert.equal(A.p1.title, 'Pest Smasher'); assert.equal(A.p2.title, 'Harvest Hero'); assert.equal(A.p3.title, 'Water Wizard');
});

test('the stick moves the gardener, at most at full speed', () => {
  const G = game(), p = G.players.p1; place(p, 3, 3);
  input(G, 'p1', { x: 5, y: 0 });
  run(G, 1);
  assert.ok(p.x > 5.5 && p.x < 6.6, `x=${p.x}`);
  assert.equal(PLOTS.length, 6);
});

test('a bonked beetle bowls over the beetles behind it, and the kills count as a multi-kill', () => {
  const G = game(), p = G.players.p1; place(p, 2, 4);
  const a = pest(G, 'beetle', 2.55, 4); a.hp = 2;                   // a tough one: survives the bonk and goes flying
  const b = pest(G, 'beetle', 3.15, 4), c = pest(G, 'beetle', 3.6, 4.05);
  tap(G, 'p1');
  run(G, 0.6);
  assert.ok(!G.enemies.includes(b), 'first in line bowled over');
  assert.ok(p.bowled >= 1);
  assert.ok(G.log.some(l => l[0] === 'bowl'));
});

test('kills close together are a multi-kill, with a bonus', () => {
  const G = game(), p = G.players.p1; place(p, 2, 4);
  pest(G, 'beetle', 2.5, 3.9); pest(G, 'beetle', 2.5, 4.1); pest(G, 'beetle', 2.6, 4);
  const before = p.score;
  tap(G, 'p1');
  assert.equal(p.kills, 3); assert.equal(p.bestMulti, 3);
  assert.ok(p.score - before > 3 * 50 + 50 * 2 + 50 * 3 - 1, 'multi bonus paid');
  assert.ok(G.log.some(l => l[0] === 'multi' && l[2] === 3));
});

test('a squashed beetle skids on and bowls over the one behind it', () => {
  const G = game(), p = G.players.p1; place(p, 2, 4);
  pest(G, 'beetle', 2.5, 4); const b = pest(G, 'beetle', 3.3, 4);
  tap(G, 'p1');
  run(G, 0.5);
  assert.ok(!G.enemies.includes(b), 'bowled'); assert.equal(p.bowled, 1); assert.equal(p.kills, 2);
  assert.ok(G.enemies.every(e => !e.dead), 'skidding bodies are cleaned up');
});
