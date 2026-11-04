// ladybug 11×9: the friend (catch it for a power-up). A glossy cherry-red dome with black spots and a black seam, a
// black pronotum with white cheek patches. fly 2 (red wing cases flipped open, the clear hind wings a flapping blur),
// walk 2. Hand-painted. Anchor = ground point under the body (in flight the game lifts it and draws the shadow).
import { grid, stamp, line, put, over, emit } from './kit.mjs';

const PAL = {
  w: '#ffffff', // glint
  l: '#ff7a5c', // light red
  m: '#ec2f2c', // red
  s: '#b0182c', // shade
  d: '#6e0e24', // deep
  K: '#1a0e14', // spots
  o: '#180a10', // ink
  h: '#2a1c24', // pronotum / head black
  W: '#fff4e6', // cheek patches
  f: '#eaf6ff', F: '#b4d2ee', // hind-wing blur
  k: '#2a1c24',
};
const WALK = `
...ooooo...
..olwllmo..
.olwlKlmoo.
ollooooohWo
omKmmmKmhho
osmmKmmshWo
.osdddddoo.
..ooooooo..
`;
// wing cases flipped open (far one up, near one down), black body between, the hind wings blurred out behind
const FLY = [`
.fff.......
fFFFfoooo..
.ffolwlmo..
...ollKmoo.
..ohhhhhhWo
...omKmsoo.
..osmmsso..
.fFfoooo...
..fff......
`, `
...........
....oooo...
ffoolwlmo..
fFFolKlmoo.
.fFohhhhhWo
fFFosmKsoo.
ffoossdso..
....oooo...
...........
`];
function walk(k) {
  const g = grid(11, 9), L = grid(11, 9);
  stamp(g, 0, 0, WALK);
  const o = k ? 1 : -1;
  line(L, 2, 7, 1 + (k ? 0 : -1), 8, 'k'); line(L, 5, 7, 5 + o, 8, 'k'); line(L, 7, 7, 8 + (k ? 0 : 1), 8, 'k');
  put(L, 9 + k, 1, 'k'); put(L, 9, 2, 'k'); // antenna
  return over(L, g);
}
export default function run() {
  return emit('ladybug', 'friendly ladybug, cherry red with black spots', {
    anchor: [5, 9],
    palette: PAL,
    fps: { fly: 14, walk: 8 },
    frames: { fly: FLY, walk: [walk(0), walk(1)] },
  });
}
