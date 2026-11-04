// snail 16×12: a garden snail with a glossy caramel spiral shell and a soft lilac-grey foot. walk 4 (the head stretches
// forward, then the tail catches up, eye stalks bob), munch 2 (head dips, nibbling), hide 1 (pulled into the shell).
// Anchor = ground point under the body.
import { grid, volumes, outline, line, put, get, over, emit, stamp, clone } from './kit.mjs';

const PAL = {
  w: '#fff6dc', // shell glint
  a: '#f6d48c', // shell light
  b: '#df9a4c', // shell mid
  c: '#b0602c', // shell shade
  d: '#6e3420', // spiral groove / deep
  v: '#ffe9b8', // spiral highlight band
  l: '#f4e4d8', // foot light
  m: '#d0b2a8', // foot mid
  n: '#9c7a7a', // foot shade
  p: '#644a52', // foot deep
  o: '#2a1712', // ink (warm)
  e: '#24180f', // eye
  E: '#ffffff', // eye glint
  g: '#a6e05a', G: '#5fb83f',
};
const MATS = {
  shell: { t: ['a', 'a', 'b', 'b', 'c'], thr: [0.9, 0.66, 0.25, -0.2] },
  foot: { t: ['l', 'm', 'n', 'p'], thr: [0.62, 0.2, -0.3] },
};

function shellLayer(Wd, Ht, cx, cy, R) {
  const { g, info } = volumes(Wd, Ht, [{ cx, cy, rx: R, ry: R * 0.92, mat: 'shell', z: 0 }], MATS);
  // spiral groove drawn as a connected 1-px line from the centre outwards (r = r0 + k·θ), with a cream band on its
  // lit outer side; the coil centre sits a little right of the middle
  const sx = cx + 0.4, sy = cy + 0.1, T = 2 * Math.PI * 1.05, k = (R - 2.2) / T;
  const P = []; for (let i = 0; i <= 60; i++) { const th = -Math.PI * 0.5 + T * i / 60, r = 1.0 + k * T * i / 60; P.push([sx + Math.cos(-th) * r, sy + Math.sin(-th) * r * 0.95, th]); }
  const inShell = (x, y) => info[Math.round(y)]?.[Math.round(x)];
  for (let i = 0; i < P.length - 1; i++) line(g, Math.floor(P[i][0]), Math.floor(P[i][1]), Math.floor(P[i + 1][0]), Math.floor(P[i + 1][1]), (x, y) => inShell(x, y) ? 'd' : null);
  for (const [x, y] of P) { const dx = x - sx, dy = y - sy, n = Math.hypot(dx, dy) || 1, X = Math.floor(x + dx / n * 1.1), Y = Math.floor(y + dy / n * 1.1); if (inShell(X, Y) && get(g, X, Y) !== 'd' && dx + dy < -0.2) g[Y][X] = get(g, X, Y) === 'a' ? 'v' : 'a'; }
  // glint on the upper-left of the whorl
  return { g, info };
}

function snail({ head = 0, tail = 0, shellX = 0, stalk = 0, dip = 0, mouth = 0, crumb = 0, hide = 0 }) {
  const Wd = 16, Ht = 12;
  const out = grid(Wd, Ht);
  if (!hide) {
    // foot: a long low slug body; the head end rises
    const forms = [
      { cx: 7.6 + (head - tail) / 2, cy: 10.0, rx: 6.1 + (head + tail) / 2, ry: 1.6, mat: 'foot', z: 0 },
      { cx: 12.4 + head, cy: 8.2 + dip, rx: 1.9, ry: 2.4, mat: 'foot', z: 1 },
    ];
    const { g } = volumes(Wd, Ht, forms, MATS);
    // lower edge of the foot touching the ground: deep tone (the sole)
    for (let x = 0; x < Wd; x++) for (let y = Ht - 1; y >= 0; y--) if (g[y][x] !== '.') { if (y >= 10) g[y][x] = 'p'; break; }
    outline(g, 'o', 'n');
    // eye stalks: two, the far one shorter and darker; tips are eyes with a glint
    const hx = Math.round(13 + head), hy = Math.round(6 + dip);
    line(g, hx - 1, hy, hx - 1, hy - 2 - stalk, 'n'); put(g, hx - 1, hy - 3 - stalk, 'e');
    line(g, hx, hy, hx + 1, hy - 2 + stalk, 'm'); put(g, hx + 1, hy - 3 + stalk, 'e'); put(g, hx + 2, hy - 3 + stalk, '.');
    // little lower tentacles + mouth
    put(g, hx + 2, hy + 2 + dip, mouth ? 'o' : 'n');
    over(out, g);
  }
  const R = 4.4, cx = hide ? 7.6 : 5.4 + shellX, cy = hide ? 6.6 : 5.6;
  const { g: S } = shellLayer(Wd, Ht, cx, cy, R);
  outline(S, 'o', 'c', { rimIf: (x, y) => y < cy && x < cx });
  put(S, Math.round(cx - 2.4), Math.round(cy - 2.6), 'w'); put(S, Math.round(cx - 1.4), Math.round(cy - 3.0), 'w');
  if (hide) {
    // a sliver of foot under the shell, the aperture closed
    const F = grid(Wd, Ht); stamp(F, Math.round(cx) - 3, 10, `
.onnmnno.
..ooooo..`);
    over(out, F);
  }
  over(out, S);
  if (crumb) { put(out, 15, 8, 'g'); put(out, 15, 10, 'G'); }
  return out;
}

export default function run() {
  return emit('snail', 'garden snail, caramel spiral shell', {
    anchor: [8, 12],
    palette: PAL,
    fps: { walk: 6 },
    frames: {
      walk: [
        snail({ head: 0, tail: 0, stalk: 0 }),
        snail({ head: 1, tail: 0, stalk: 1, shellX: 0 }),
        snail({ head: 1, tail: -1, stalk: 0, shellX: 1 }),
        snail({ head: 0, tail: -1, stalk: -1, shellX: 0 }),
      ],
      munch: [
        snail({ dip: 1, mouth: 1, stalk: 1 }),
        snail({ dip: 0, crumb: 1 }),
      ],
      hide: [snail({ hide: 1 })],
    },
  });
}
