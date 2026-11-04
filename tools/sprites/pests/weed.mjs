// weed 10×12: the lobby practice target. A scraggly dandelion: a rosette of saw-toothed leaves, a wiry stem and a
// shaggy yellow flower head with a cheeky little face (two eyes and a smirk). idle 2 (sways). Anchor = ground point.
import { grid, stamp, line, put, over, outline, emit, get } from './kit.mjs';

const PAL = {
  g: '#a6e05a', G: '#5fb83f', h: '#2f7d3a', H: '#1c4a2c', // leaf ramp (shared)
  o: '#1c2a1e', // ink on greens
  Y: '#fff3a0', y: '#ffd23f', Q: '#e09a1c', q: '#a0600e', // flower
  e: '#24180f', // eyes / smirk
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

export default function run() {
  return emit('weed', 'cheeky dandelion weed, the practice target', {
    anchor: [5, 12],
    palette: PAL,
    fps: { idle: 3 },
    frames: { idle: [weed(0), weed(1)] },
  });
}
