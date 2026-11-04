// hopper 16×11: a chartreuse grasshopper with olive folded wings, a big drumstick hind femur with its coral shin folded
// under it, a large glossy eye and swept-back antennae. Hand-painted frames. hop 4 (crouch, launch, airborne with the
// legs streaming back and the rose hindwings flashing, land), munch 2. Anchor = ground point under the body.
import { emit, grid, stamp, line, put, get, shift, over, flipX, flipY } from './kit.mjs';
import { squash, shock } from './react.mjs';

const PAL = {
  a: '#f2f08a', // body light
  b: '#c8d43c', // body mid (chartreuse)
  c: '#86a02e', // body shade
  d: '#4a6026', // body deep
  u: '#c0aa62', // folded wing light
  v: '#86703e', // folded wing
  x: '#ff9a88', X: '#e0506a', // hindwing flash
  r: '#ff6a4a', R: '#b8342e', // shin
  o: '#1c2414', // ink (green-black)
  e: '#2a1a14', E: '#ffffff', // eye
  g: '#a6e05a', G: '#5fb83f',
};
const STAND = `
...........o....
....oooooo.o....
...oa.....o.o...
...ocao.ooooooo.
.ouurcauaabcaabo
ouvvvrcabbbcEebo
ocvvcbrcabcceeco
.ocdcddrcacdccdo
..oddddorododdo.
...oooo.R.d..d..
........RRo...o.
`;
const CROUCH = `
................
...........o....
....oooooo.o....
...oa.....o.o...
...ocao.ooooooo.
.ouurcauaabcaabo
ouvvvrcabbbcEebo
ocvvcbrcabcceeco
.ocdcddrcacdccdo
..oddddorododdo.
...ooooRRodo.do.
`;
// body without the hind leg, for the jump frames
const BODY = `
...........o....
....oooooo.o....
..........o.o...
..ooooooooooooo.
.ouuuuuuaabcaabo
ouvvvvvvbbbcEebo
ocvvvvcbabcceeco
.ocdcdcdbacdccdo
..oddddddododdo.
`;
const g0 = () => { const g = grid(16, 11); stamp(g, 0, 0, BODY); return g; };
function leg(g, hip, knee, foot, tars) {
  const L = grid(16, 11);
  line(L, hip[0], hip[1], knee[0], knee[1], 'a'); line(L, hip[0], hip[1] + 1, knee[0], knee[1] + 1, 'c');
  line(L, knee[0], knee[1] + 1, foot[0], foot[1], 'r'); if (tars) line(L, foot[0], foot[1], tars[0], tars[1], 'R');
  // ink on the open side of the femur only
  for (let y = 0; y < 11; y++) for (let x = 0; x < 16; x++) if (L[y][x] === 'a' && get(g, x, y - 1) === '.' && get(L, x, y - 1) === '.') put(g, x, y - 1, 'o');
  return over(g, L);
}
function launch() { // body up 1 and nose up, the hind leg straightening down-back to push off
  let g = shift(g0(), 0, 0);
  g = leg(g, [9, 7], [5, 7], [3, 9], [2, 10]);
  line(g, 11, 9, 13, 9, 'd'); put(g, 10, 9, 'd'); put(g, 14, 8, 'o');
  return g;
}
function air() { // airborne: rose hindwings flash open, legs stream back
  let g = shift(g0(), 0, -1);
  stamp(g, 2, 1, `
..xxxxx.
.xXxXxXx
xXXXXXXv`);
  g = leg(g, [8, 6], [3, 6], [0, 8]);
  line(g, 11, 8, 14, 9, 'd'); line(g, 9, 8, 11, 9, 'd');
  return g;
}
function land() { // touching down: front legs reach, hind leg folding back in
  const g = grid(16, 11); stamp(g, 0, 0, STAND);
  for (const x of [10, 13, 14]) { g[9][x] = '.'; g[10][x] = '.'; }
  put(g, 14, 9, 'd'); put(g, 15, 10, 'o'); put(g, 11, 9, 'd'); put(g, 12, 10, 'o');
  return g;
}
function munch(k) {
  const g = grid(16, 11); stamp(g, 0, 0, STAND);
  if (k === 0) { // head dips a pixel, jaws open
    for (let y = 10; y > 2; y--) for (let x = 12; x < 16; x++) g[y][x] = g[y - 1][x];
    g[3][12] = 'o'; g[3][13] = '.'; g[3][14] = '.'; g[9][15] = 'o'; g[9][14] = 'r'; put(g, 13, 2, 'o');
  } else { put(g, 15, 9, 'g'); put(g, 14, 10, 'G'); }
  return g;
}
const findEye = g => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (g[y][x] === 'E') return [x, y]; return null; };
// hurt: body squashed, hind leg kicked straight out behind, front legs splayed, eye squeezed shut, OOF ticks
function hurt(k) {
  let g = squash(g0(), k ? [] : [5], 0);
  const e = findEye(g);
  if (e) { const [x, y] = e; g[y][x] = 'o'; g[y][x + 1] = 'o'; g[y + 1][x] = 'b'; g[y + 1][x + 1] = 'b'; }
  g = leg(g, [9, 8], [4, 8 - k], [1, 9], [0, 10]);
  line(g, 11, 9, 13, 10, 'd'); line(g, 10, 9, 8, 10, 'd'); put(g, 14, 10, 'o');
  shock(g, 12, k ? 2 : 3, 'E');
  return g;
}
// dead: tumbling upside down with its legs everywhere (alternates belly-up and spun round), eye X'd
function dead(k) {
  const st = grid(16, 11); stamp(st, 0, 0, STAND);
  const e = findEye(st); if (e) { const [x, y] = e; st[y][x] = 'o'; st[y + 1][x + 1] = 'o'; st[y][x + 1] = 'a'; st[y + 1][x] = 'a'; }
  let g = flipY(st);
  if (k) g = flipX(g);
  // a flailing hind leg and front legs thrown out
  const L = grid(16, 11);
  if (k) { line(L, 9, 3, 13, 0, 'r'); line(L, 5, 2, 3, 0, 'd'); }
  else { line(L, 7, 3, 3, 0, 'r'); line(L, 11, 2, 14, 0, 'd'); }
  return over(g, L, 0, 0, true);
}

export default function run() {
  return emit('hopper', 'chartreuse grasshopper with coral shins', {
    anchor: [8, 11],
    palette: PAL,
    fps: { hop: 10, hurt: 14, dead: 14 },
    frames: {
      hop: [CROUCH, launch(), air(), land()],
      munch: [munch(0), munch(1)],
      hurt: [hurt(0), hurt(1)],
      dead: [dead(0), dead(1)],
    },
  });
}
