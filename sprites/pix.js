// Pixel sprites, in the format of Age Up's sprite-lab (~/me/aoe/tools/sprite-lab): a spec is
//   { id, anchor: [x, y], palette: { ch: '#rrggbb' | 'team' | 'teamdark' | 'teamlight' }, frames: { set: [grid, …] }, fps?: { set: n } }
// where each grid is a multi-line string, one character per pixel, '.' transparent. The game draws the whole field on a
// low-res canvas (30 px per world unit) and scales it up with smoothing off, so every sprite pixel is a crisp square.

// team ramps: light / mid / dark. None of them green, so a gardener never melts into the lawn.
export const TEAMS = [
  { l: '#ff9a88', c: '#e04a4a', d: '#992838' },
  { l: '#8ac4ff', c: '#3f86e0', d: '#27489a' },
  { l: '#ffe680', c: '#f2c230', d: '#ad7418' },
  { l: '#cfa8ff', c: '#9a5ae0', d: '#5a3192' },
  { l: '#ffb878', c: '#f08a2c', d: '#a44c1a' },
  { l: '#93f2e2', c: '#2cc4b0', d: '#16717a' },
  { l: '#ffb6da', c: '#f06aa8', d: '#a03672' },
  { l: '#ffffff', c: '#d8dce8', d: '#868ca6' },
];

const CACHE = new Map();
const lines = g => g.replace(/\r/g, '').split('\n').filter((l, i, a) => !((i === 0 || i === a.length - 1) && !l.trim()));

export function frameList(spec, set) {
  return spec.frames[set] || spec.frames.idle || Object.values(spec.frames)[0];
}

// cached canvas for frame i (wraps) of a set; team: a TEAMS entry or null; mode: '' | 'flash' (white silhouette) | 'shadow'
export function frame(spec, set, i, team = null, mode = '') {
  const list = frameList(spec, set), n = list.length, k = ((Math.floor(i) % n) + n) % n;
  const key = spec.id + '|' + set + '|' + k + '|' + (team ? team.c : '') + '|' + mode;
  let c = CACHE.get(key);
  if (c) return c;
  const L = lines(list[k]), w = Math.max(1, ...L.map(l => l.length)), h = L.length;
  c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < L[yy].length; xx++) {
    const ch = L[yy][xx]; if (ch === '.' || ch === ' ') continue;
    let col = spec.palette[ch]; if (!col) continue;
    if (col === 'team') col = team ? team.c : '#c8c8c8';
    else if (col === 'teamdark') col = team ? team.d : '#7a7a7a';
    else if (col === 'teamlight') col = team ? team.l : '#eeeeee';
    if (mode === 'flash') col = '#ffffff';
    if (mode === 'shadow') col = '#000000';
    x.fillStyle = col; x.fillRect(xx, yy, 1, 1);
  }
  CACHE.set(key, c);
  return c;
}

// frames per second for a set (spec.fps overrides)
const FPS = { idle: 4, walk: 10, bonk: 16, spin: 16, charge: 10, water: 8, dizzy: 8, munch: 6, fly: 12, hop: 10 };
export const fps = (spec, set) => (spec.fps && spec.fps[set]) || FPS[set] || 8;
export const frameAt = (spec, set, t) => Math.floor(t * fps(spec, set));
export const count = (spec, set) => frameList(spec, set).length;

// Draw a frame with its anchor at (x, y) on a low-res canvas, snapped to whole pixels. flip mirrors around the anchor.
export function draw(ctx, spec, set, i, x, y, { team = null, flip = false, mode = '', alpha = 1 } = {}) {
  const c = frame(spec, set, i, team, mode), [ax, ay] = spec.anchor;
  const X = Math.round(x), Y = Math.round(y);
  if (alpha !== 1) { ctx.save(); ctx.globalAlpha *= alpha; }
  if (flip) { ctx.save(); ctx.translate(X, 0); ctx.scale(-1, 1); ctx.drawImage(c, -(c.width - ax), Y - ay); ctx.restore(); }
  else ctx.drawImage(c, X - ax, Y - ay);
  if (alpha !== 1) ctx.restore();
}
