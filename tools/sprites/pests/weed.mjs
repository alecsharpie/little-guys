// weed 10×12: the lobby practice target. A scraggly dandelion: a rosette of saw-toothed leaves, a wiry stem and a
// shaggy yellow flower head with a cheeky little face (two eyes and a smirk). idle 2 (sways). Anchor = ground point.
import { grid, stamp, line, put, over, outline, emit, get } from './kit.mjs';
import { squash, shock } from './react.mjs';

const PAL = {
  g: '#a6e05a', G: '#5fb83f', h: '#2f7d3a', H: '#1c4a2c', // leaf ramp (shared)
  o: '#1c2a1e', // ink on greens
  Y: '#fff3a0', y: '#ffd23f', Q: '#e09a1c', q: '#a0600e', // flower
  e: '#24180f', // eyes / smirk
  r: '#d8b47a', R: '#8a6040', // roots
  w: '#ffffff',
};
const HEAD = [`
.o.oo.o.
oYoYyoyo
oYyyyyQo
oyeyyeQo
.yyqqyQo
oQoyQoqo
.o.oo.o.
`];
const ROSETTE = `
g...oho..g
Gg.ohHhogG
oGgGhHhGgo
.oGhhHhhGo
..oooooo..
`;
function weed(k) {
  const L = grid(10, 12);
  stamp(L, 0, 7, ROSETTE);
  // the stem leans with the sway; the flower head rides on top of it
  const hx = k ? 2 : 1;
  const F = grid(10, 12); stamp(F, hx, 0, HEAD[0]);
  if (k) { put(F, hx + 2, 3, 'e'); put(F, hx + 5, 3, 'e'); put(F, hx + 3, 4, 'y'); } // glancing the other way
  return over(L, F);
}

// hurt: flower head squashed flat and knocked back, eyes squeezed into dashes, OOF ticks
function hurt(k) {
  const L = grid(10, 12); stamp(L, 0, 7, ROSETTE);
  const F = grid(10, 12); stamp(F, k ? 1 : 0, 0, HEAD[0]);
  const eyes = []; for (let y = 0; y < 12; y++) for (let x = 0; x < 10; x++) if (F[y][x] === 'e') eyes.push([x, y]);
  for (const [x, y] of eyes) if (y === 3) { put(F, x + 1, y, 'e'); }
  const Fs = squash(F, k ? [2] : [1, 4], 0);
  const out = over(L, Fs);
  put(out, 4, 6, 'h');
  shock(out, 6, k ? 2 : 3, 'w');
  return out;
}
// dead: yanked out of the ground and flying, roots dangling and swinging, X eyes
const ROOTS = [`
..R.r..
.r..R.r
r...r..
.....r.`, `
..r.R..
.R.r..r
..r..R.
.r.....`];
function dead(k) {
  const out = grid(10, 12);
  const F = grid(10, 12); stamp(F, k ? 2 : 0, 0, HEAD[0]);
  for (let y = 0; y < 12; y++) for (let x = 0; x < 10; x++) if (F[y][x] === 'e') F[y][x] = 'y';
  const hx = k ? 2 : 0;
  for (const [a, b] of [[2, 2], [4, 2], [3, 3], [2, 4], [4, 4]]) put(F, hx + a, b, 'e'); // one X'd eye, the other squeezed shut
  put(F, hx + 5, 3, 'y'); put(F, hx + 6, 3, 'e'); put(F, hx + 5, 4, 'q');
  // the rosette crumpled into a tuft under the head, then the roots
  const L = grid(10, 12); stamp(L, k ? 2 : 1, 6, `
gG.oho.Gg
.oGhHhGo.
..ohHho..`);
  stamp(L, k ? 1 : 2, 8, ROOTS[k]);
  over(out, L); over(out, F);
  return out;
}

export default function run() {
  return emit('weed', 'cheeky dandelion weed, the practice target', {
    anchor: [5, 12],
    palette: PAL,
    fps: { idle: 3, hurt: 14, dead: 14 },
    frames: { idle: [weed(0), weed(1)], hurt: [hurt(0), hurt(1)], dead: [dead(0), dead(1)] },
  });
}
