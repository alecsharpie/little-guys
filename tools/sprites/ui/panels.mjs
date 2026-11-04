// 9-slice frames for CSS border-image: ui_panel / ui_paper (24×24, slice 8), ui_button / ui_button_gold (18×18 up/down,
// slice 6), ui_chip (12×12, slice 4). Every edge strip and the centre are periodic with the slice size, so 'repeat' or
// 'round' tile seamlessly; corners are self-contained.
import { grid, put, emit } from './kit.mjs';

/** rounded rect mask test: inside w×h with corner radius r (pixel-centre test) */
const inRR = (x, y, w, h, r) => {
  const cx = Math.min(Math.max(x + 0.5, r), w - r), cy = Math.min(Math.max(y + 0.5, r), h - r);
  return Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r + 0.01;
};
const fill = (w, h, fn) => { const g = grid(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) put(g, x, y, fn(x, y)); return g; };

// ---- ui_panel: a wooden sign board. 4-px beam frame (lit top edge, nail heads in the corners), planks inside.
function panel() {
  const N = 24, inside = (x, y) => !((x === 0 || x === N - 1) && (y === 0 || y === N - 1));
  // plank pattern, periodic 8×8: planks 4 px tall, staggered butt joints, a short grain streak per plank
  // plank pattern, periodic 8×8: one 8-px plank per tile (lit top, soft grain streaks, shaded underside, dark seam)
  const plank = (x, y) => {
    const X = ((x % 8) + 8) % 8, Y = ((y % 8) + 8) % 8;
    if (Y === 7) return 'j';
    if (Y === 0) return 'h';
    if (Y === 6) return 'G';
    if (Y === 2 && X >= 1 && X <= 3) return 'G';
    if (Y === 4 && X >= 4 && X <= 7) return 'G';
    return 'H';
  };
  return fill(N, N, (x, y) => {
    if (!inside(x, y)) return '.';
    if (x === 0 || y === 0 || x === N - 1 || y === N - 1) return 'k';
    // frame beams (cols/rows 1..4 and 19..22) with mitred corners
    const t = y - 1, b = N - 2 - y, l = x - 1, r = N - 2 - x, e = Math.min(t, b, l, r);
    if (e <= 3) {
      // nail heads, 2×2, centred in each 4×4 corner square
      const cx = l <= 3 ? l : r <= 3 ? 3 - r : -1, cy = t <= 3 ? t : b <= 3 ? 3 - b : -1;
      if (cx >= 1 && cx <= 2 && cy >= 1 && cy <= 2 && (l <= 3 || r <= 3) && (t <= 3 || b <= 3)) return cx === 1 && cy === 1 ? 's' : cx === 2 && cy === 2 ? 'x' : 'S';
      if (cx >= 0 && cy >= 0 && (l <= 3 || r <= 3) && (t <= 3 || b <= 3)) {
        // around the nail: a tiny dark dent right/below it
        if ((cx === 3 && cy >= 1 && cy <= 3) || (cy === 3 && cx >= 1 && cx <= 3)) { /* fallthrough to beam */ }
      }
      const side = e === t ? 'T' : e === l ? 'L' : e === b ? 'B' : 'R';
      const along = side === 'T' || side === 'B' ? x : y, d = e;
      const A = ((along % 8) + 8) % 8;
      if (side === 'T') return d === 0 ? 'y' : d === 3 ? 'H' : (d === 2 && A >= 2 && A <= 4) ? 'H' : 'h';
      if (side === 'L') return d === 0 ? 'y' : d === 3 ? 'H' : (d === 2 && A >= 5 && A <= 7) ? 'H' : 'h';
      if (side === 'B') return d === 0 ? 'J' : d === 3 ? 'H' : d === 1 ? 'j' : (A >= 3 && A <= 5) ? 'j' : 'H';
      return d === 0 ? 'J' : d === 3 ? 'H' : d === 1 ? 'j' : (A >= 0 && A <= 2) ? 'j' : 'H';
    }
    if (y === 5 || x === 5) return 'J';                    // shadow the frame casts on the planks
    return plank(x, y);
  });
}

// ---- ui_paper: a cream seed-packet card: soft brown border, lit top-left rim, a stitched dashed line inside
function paper() {
  const N = 24;
  return fill(N, N, (x, y) => {
    if (!inRR(x, y, N, N, 2.5)) return '.';
    const edge = !inRR(x, y - 1, N, N, 2.5) || !inRR(x, y + 1, N, N, 2.5) || !inRR(x - 1, y, N, N, 2.5) || !inRR(x + 1, y, N, N, 2.5) || y === 0 || x === 0 || y === N - 1 || x === N - 1;
    if (edge) return y >= N - 2 ? 'O' : 'o';
    if (y === N - 2) return 'Q';
    if (y === 1 || x === 1) return 'w';
    if (x === N - 2) return 'E';
    // stitched dashes at inset 3 (2 on, 2 off: period 4 divides the slice)
    const onT = y === 3 || y === N - 4, onL = x === 3 || x === N - 4;
    if ((onT && x >= 3 && x <= N - 4 && (x & 3) < 2) || (onL && y >= 3 && y <= N - 4 && (y & 3) < 2)) return 'E';
    return 'e';
  });
}

// ---- chunky pixel button: lit top bevel, glint, 3-px lip under the face that vanishes when pressed
function button(down) {
  const N = 18, top = down ? 3 : 0, faceBot = down ? 16 : 13;
  return fill(N, N, (x, y) => {
    const yy = y - top, hh = N - top;
    if (yy < 0 || !inRR(x, yy, N, hh, 2.5)) return '.';
    const edge = !inRR(x, yy - 1, N, hh, 2.5) || !inRR(x, yy + 1, N, hh, 2.5) || !inRR(x - 1, yy, N, hh, 2.5) || !inRR(x + 1, yy, N, hh, 2.5) || yy === 0 || x === 0 || y === N - 1 || x === N - 1;
    if (edge) return 'k';
    if (y > faceBot) return x <= 2 ? 'm' : 'M';                         // the lip (side of the button)
    if (y === faceBot) return 'm';
    if (!down && ((x === 2 || x === 3) && y === 2 || x === 2 && y === 3)) return 'w';
    if (yy === 1) return down ? 'L' : 'l';
    if (x === 1) return 'l';
    if (x === N - 2) return 'm';
    if (down && yy === 2) return 'm';                                  // pressed: a thin inner shadow under the rim
    return 'L';
  });
}

// ---- ui_chip: small dark soil pill for name tags and stats
function chip() {
  const N = 12, r = 3;
  return fill(N, N, (x, y) => {
    if (!inRR(x, y, N, N, r)) return '.';
    const edge = !inRR(x, y - 1, N, N, r) || !inRR(x, y + 1, N, N, r) || !inRR(x - 1, y, N, N, r) || !inRR(x + 1, y, N, N, r) || y === 0 || x === 0 || y === N - 1 || x === N - 1;
    if (edge) return 'k';
    if (y === 1) return 'u';
    if (y === N - 2) return 's';
    return 'v';
  });
}

export default function paint() {
  const woodPal = { k: '#24180f', y: '#c09460', h: '#a07a4a', H: '#8a6a3a', G: '#7a5a30', j: '#5a3a18', J: '#3b2614', s: '#e6eaee', S: '#9aa0a6', x: '#5f656c' };
  emit('ui_panel', 'wooden sign board, 9-slice', { anchor: [12, 12], slice: 8, palette: woodPal, frames: { idle: [panel()] } },
    ['9-SLICE: 24×24, slice 8 (border-image-slice: 8 fill). Edges and centre repeat with period 8.',
     'Frame is 4 px + 1 px shadow: keep content inset ≥ 6 source px (= 6 × scale css px) from the outer edge.']);
  emit('ui_paper', 'cream seed-packet / parchment card, 9-slice', { anchor: [12, 12], slice: 8,
    palette: { o: '#b89060', O: '#8a6638', w: '#fffaf0', e: '#fbf0d2', E: '#e6d2a0', Q: '#dcc590' }, frames: { idle: [paper()] } },
    ['9-SLICE: 24×24, slice 8 (border-image-slice: 8 fill). Dashed stitching period 4; centre is flat cream.',
     'Keep content inset ≥ 5 source px (inside the stitching).']);
  const green = { k: '#1c2a1e', w: '#e4f8b0', l: '#a6e05a', L: '#5fb83f', m: '#2f7d3a', M: '#1c4a2c' };
  const gold = { k: '#24180f', w: '#fffbea', l: '#fbe7a1', L: '#e9c46a', m: '#b98b3e', M: '#7a5526' };
  const notes = ['9-SLICE: 18×18, slice 6 (border-image-slice: 6 fill), sets up/down. up: face rows 1–13 + 3-px lip;',
    'down: the face sits 3 px lower (rows 3–17, no lip) so a label should move down 3 × scale px. Content inset ≥ 3 px sides.'];
  emit('ui_button', 'chunky leaf-green pixel button, 9-slice', { anchor: [9, 18], slice: 6, palette: green, frames: { up: [button(false)], down: [button(true)] } }, notes);
  emit('ui_button_gold', 'sunny straw-gold primary button, 9-slice', { anchor: [9, 18], slice: 6, palette: gold, frames: { up: [button(false)], down: [button(true)] } }, notes);
  emit('ui_chip', 'small dark soil pill / tag, 9-slice', { anchor: [6, 12], slice: 4,
    palette: { k: '#24180f', u: '#7a4f33', v: '#5a3826', s: '#3e2619' }, frames: { idle: [chip()] } },
    ['9-SLICE: 12×12, slice 4 (border-image-slice: 4 fill). Content inset ≥ 2 px.']);
}
