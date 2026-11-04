// ui_icons: 12×12 HUD / menu icons, one set per icon, anchor [6,12] (bottom centre).
// Each icon is painted as layers of hand-shaded rows (or a few lines of geometry); every layer gets its own 1-px warm
// ink outline so overlapping parts separate, then layers are stacked. The art fits the inner 10×10 so the outline fits.
import { grid, put, get, clone, over, outline, stamp, rows, emit } from './kit.mjs';

export const PAL = {
  k: '#24180f',                                   // warm ink
  w: '#fffbea',                                   // glint
  e: '#fbf0d2', E: '#ecd9a6', Q: '#c9ad78',       // cream
  r: '#ff9a88', R: '#e04a4a', q: '#992838',       // red
  y: '#fbe7a1', Y: '#e9c46a', o: '#b98b3e', O: '#7a5526', // straw
  a: '#ffe28a', A: '#e1b12c', z: '#a87a12',       // gold
  s: '#e6eaee', S: '#9aa0a6', x: '#5f656c', X: '#1e2a33', // steel
  b: '#f2b070', B: '#c8763a', n: '#844620',       // bronze
  l: '#a6e05a', L: '#5fb83f', m: '#2f7d3a', M: '#1c4a2c', // leaf
  c: '#c4eaff', C: '#5ab0ff', d: '#2f72c8', D: '#1b3f80', // water
  h: '#a07a4a', H: '#8a6a3a', j: '#5a3a18', J: '#3b2614', // wood
  u: '#9a6a44', U: '#7a4f33', v: '#5a3826',       // soil
  i: '#fff4b0', f: '#ffc84a', F: '#f07a2a', t: '#b83a24', // flame
  1: '#f2d2b0', 2: '#e8c39e', 3: '#c9a07a', 4: '#8a5a3a', // skin
  5: '#f6f4ee', 6: '#c8ccd8', 7: '#8a92a8', 8: '#4a5268', // cloud / slate
  p: '#6a5040', P: '#46342a',                     // empty socket
  V: '#d4c25a', T: '#a08a30', g: '#e2f59a', G: '#b2d654', N: '#7aa236', K: '#4e6e22',       // stink green
  9: '#ffb6da', 0: '#f06aa8', '@': '#a03672',     // pink
};

/** rows → 12×12 layer, centred horizontally, bottom row at y=10 (+dx,dy) */
function L(art, dx = 0, dy = 0) {
  const r = rows(art), w = Math.max(...r.map(s => s.length)), g = grid(12, 12);
  stamp(g, Math.floor((12 - w) / 2) + dx, 11 - r.length + dy, r);
  return g;
}
/** outline each layer, stack bottom→top. post(g) may add un-outlined glints */
function icon(layers, post) {
  const g = grid(12, 12);
  for (const l of layers) over(g, outline(clone(l), 'k'));
  if (post) post(g);
  return g;
}
const ring = (cx, cy, r0, r1, fn) => { const g = grid(12, 12); for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); if (d >= r0 && d < r1) put(g, x, y, fn(dx, dy, d, (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI))); } return g; };

const HEART = `
.rrR..rRR.
rwrRRRRRRR
rrRRRRRRRq
RRRRRRRRqq
.RRRRRRqq.
..RRRRqq..
...Rqqq...
....qq....`;

const I = {};
I.heart = icon([L(HEART)]);
I.heart_empty = icon([L(`
.PPP..PPP.
PPPPPPPPPP
PPPPPPPPPp
PPPPPPPPpp
.PPPPPPpp.
..PPPPpp..
...Pppp...
....pp....`)]);
I.drop = icon([L(`
...cC...
...cC...
..ccCd..
..cCCd..
.cwCCCd.
.wcCCCd.
cwCCCCdd
cCCCCCdd
.CCCCdd.
..Cddd..`)]);
const FL = [`
....F...
...FF...
...FfF..
..FFfF.F
.FFffFFF
.FfiffFF
FFfiiffF
FfiiiifF
FfiiiifF
.tFffFt.`, `
...F....
..FF....
..FfF...
F.FffF..
FFFffFF.
FFfifFFF
FFfiiffF
FfiiiifF
FfiiiifF
.tFffFt.`, `
.....F..
....FF..
F..FfF..
F.FFfF..
FFFffFF.
.FfiifF.
FFfiiffF
FfiiiifF
FfiiiifF
.tFffFt.`];
I.flame = FL.map(f => icon([L(f)]));

// ribbon (3 rows) above the disc (7 rows): stack by placing ribbon higher
function medalIcon(l, m, d) {
  const rib = L(`
RRq..CCd
.RRqCCd.
..RRCd..
...Rd...`, 0, -6);
  const disc = L(`
..llmm..
.lwlmmd.
lwllmmdd
llmmmddd
.mmmddd.
..dddd..`.replace(/l/g, l).replace(/m/g, m).replace(/d/g, d));
  return icon([rib, disc]);
}
I.medal_gold = medalIcon('a', 'A', 'z');
I.medal_silver = medalIcon('s', 'S', 'x');
I.medal_bronze = medalIcon('b', 'B', 'n');

I.trophy = icon([L(`
.aaaAAAAz.
a.awAAAz.z
a.aaAAAz.z
.aaaAAAzz.
..aaAAzz..
...aAzz...
....Az....
....Az....
..hhHHjj..
..HHjjJJ..`)]);
I.crown = icon([L(`
a...aa...z
aa..wA..zz
aaa.aA.zzz
aaaaAAAAzz
aRqaCdARqz
aaAAAAAAzz
zzzzzzzzzz`, 0, -1)]);
I.bolt = icon([L(`
.....aaa
....aaA.
...awA..
..aaA...
.aaaaaaA
.zzzaaA.
....aA..
...aA...
..aA....
..A.....`)]);
I.cloud_rain = icon([L(`
...556....
..55566.6.
.555566666
5555666667
6666667777
.77778888.`, 0, -3), L(`
..C...C...
.d...d...d`, 0, 0), L(`
.....C....
....d.....`, 0, 0)]);
I.mushroom = icon([L(`
...rrRR...
.rrwRReRq.
rrweRRRRqq
rRRRReeRqq
ReeRRRRqqq
qqqqqqqqqq`, 0, -4), L(`
..eeEQ..
..eEEQ..
.eeEEQQ.
.EEQQQQ.`)]);
// bloom: five petals opening around a sunny centre, on a little leafy stem
I.bloom = (() => {
  const P = grid(12, 12);
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + k * 2 * Math.PI / 5, px = 6 + Math.cos(a) * 2.5, py = 4.9 + Math.sin(a) * 2.4;
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
      const dx = x + 0.5 - px, dy = y + 0.5 - py, d = Math.hypot(dx, dy); if (d > 1.8) continue;
      const lit = -(dx * 0.6 + dy * 0.8) / 1.8 - 0.12 * (x + y - 10);
      put(P, x, y, lit > 0.3 ? '9' : lit > -0.4 ? '0' : '@');
    }
  }
  const Cc = grid(12, 12); stamp(Cc, 5, 4, `
aA
Az`);
  const S = L(`
.lL..m..
..lLmLm.
....m...`, 0, 0);
  return icon([S, P, Cc]);
})();
// bee: striped round body, dark head, glassy wings
I.bee = (() => {
  const B = grid(12, 12), Wg = grid(12, 12), Hd = grid(12, 12);
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const X = x + 0.5, Y = y + 0.5;
    const bu = (X - 5) / 3.6, bv = (Y - 7.3) / 2.7;
    if (bu * bu + bv * bv <= 1) { const lit = -(bu * 0.6 + bv * 0.8); put(B, x, y, x === 4 || x === 6 ? (lit > 0.2 ? 'j' : 'J') : lit > 0.25 ? 'a' : lit > -0.45 ? 'A' : 'z'); }
    const hu = X - 8.9, hv = Y - 6.6; if (hu * hu + hv * hv <= 2.9) put(Hd, x, y, hu + hv < -1 ? 'j' : 'J');
    for (const [cx, cy, rx, ry] of [[4.2, 3.4, 1.6, 2.2], [6.8, 3.2, 1.5, 2.0]]) { const u = (X - cx) / rx, v = (Y - cy) / ry; if (u * u + v * v <= 1) put(Wg, x, y, u + v < -0.6 ? 'w' : 'c'); }
  }
  put(Hd, 9, 6, 'w');
  return icon([Wg, B, Hd], g => { put(g, 1, 7, 'k'); });
})();
I.seedling = icon([L(`
.lll..LLm.
lwlLL.LLLm
.LLLmLmmm.
...mLm....
....Lm....
....Lm....`, 0, -2), L(`
..uuUUvv..
.uuUUUUvv.`)]);
I.wilted = icon([L(`
...VTTO...
..VT..OO..
..T....OV.
..T...VVO.
.VT....OO.
VOTO...O..
O.TO......`, 0, -2), L(`
..uuUUvv..
.uuUUUUvv.`)]);
I.check = icon([L(`
........lL
.......lLm
......lLm.
l....lLm..
Ll..lLm...
.LllLm....
..LLm.....
...m......`, 0, -1)]);
I.cross = icon([L(`
rR....rR
RRR..rRq
.RRRrRq.
..RRRq..
..rRRq..
.rRqRRq.
rRq..RRq
Rq....Rq`, 0, -1)]);
const SPK = `
...s....
..sS....
ssSS....
swSS....
sSSx....
SSxx....
..xx....
...x....`;
I.speaker_on = icon([L(SPK, -1, -1), L(`
.....e...
......E..
....e.E..
....E.E..
....E.E..
....Q.Q..
......Q..
.....Q...`.slice(0), 0, -1)].map((l, i) => l));
I.speaker_off = icon([L(SPK, -1, -1), L(`
.....r..R
......RR.
......Rq.
.....R..q`, 0, -3)]);
I.stick = icon([L(`
.....x....
.....x....
.sSSSSSxx.
SSSSSSxxxX
.xxxxxXXX.`), L(`
..rRR..
.rwRRq.
.rRRqq.
..Rqq..`, 0, -5)]);
I.tap = icon([L(`
...eeee...
..e....e..
....11....
....12....
....12....
....12.23.
..1112223.
..1222223.
..122223..
...2333...`)]);
// hold: a thumb pressing in a 3/4-charged ring
I.hold = icon([ring(6, 6.5, 3.6, 4.65, (dx, dy, d, a) => a < Math.PI * 1.5 ? (dx + dy < 0 ? 'e' : 'E') : 'p'), L(`
.11.
1122
1223
1223
1ee3
1ee3
.33.`, 0, -3)]);
// spin: a fat clockwise circular arrow, head at the top pointing right
I.spin = icon([L(`
......y...
..yyyyyy..
.yyYYYYYY.
yY....YY..
yY....Y...
yY......Yo
YY......oo
.Yo....oo.
..oooooo..`)]);
I.zzz = icon([L(`
......ccc.
.......c..
......ccc.
..CCCC....
....C.....
...C......
..CCCC....`, 0, -3), L(`
ccccc
...c.
..c..
.c...
CCCCC`, -3, 0)]);
I.swirl = (() => {
  const g = grid(12, 12);
  for (let t = 0; t < Math.PI * 4.2; t += 0.02) {
    const r = 0.4 + 0.34 * t, x = 6 + Math.cos(t) * r, y = 6.5 + Math.sin(t) * r;
    const X = Math.floor(x), Y = Math.floor(y);
    if (X < 1 || X > 10 || Y < 1 || Y > 10) continue;
    put(g, X, Y, t < 6 ? 'w' : t < 10 ? 'y' : 'Y');
  }
  return icon([g]);
})();
I.rake = icon([L(`
s.s.s.s
s.S.S.x
sssSSxx
...H...
...H...
...h...
...H...
...j...
...j...
...J...`)]);
I.watering_can = icon([L(`
.........C
........dd`, 0, -8), L(`
.sSS....sx
s...S..sS.
sssSSSsS..
swsSSSxx..
ssSSSSxx..
sSSSSxxx..
.xxxxxX...`, 0, 0)]);
I.bowling_pin = icon([L(`
.eE.
eeEQ
eEEQ
.Rq.
.eQ.
eeEQ
ewEEQ
eEEEQ
eEEQQ
.EQQ.`.replace(/\n(....)\n/g, '\n$1\n'))]);
I.stink = icon([L(`
..G....G..
.G....G...
..G....G..`, 0, -7), L(`
...gg.....
..gggG.gG.
.gggGGGGGN
ggGGGGGGNN
GGGGGGNNKK
.NNNKKKKK.`)]);
const SMALLHEART = c => `
.${c[0]}${c[0]}.${c[1]}${c[1]}.
${c[0]}${c[3]}${c[0]}${c[1]}${c[1]}${c[1]}${c[2]}
${c[0]}${c[1]}${c[1]}${c[1]}${c[1]}${c[2]}${c[2]}
.${c[1]}${c[1]}${c[1]}${c[2]}${c[2]}.
..${c[1]}${c[2]}${c[2]}..
...${c[2]}...`;
I.friends = icon([L(SMALLHEART('90@w'), -2, -3), L(SMALLHEART('rRqw'), 2, 0)]);
I.boot = icon([L(`
..yyYo....
..hHHj....
..hHHj....
..hHHj....
..hHHHj...
..hHHHHjj.
.hhHHHHHHj
.JJJJJJJJJ`, 0, -1)]);
I.phone_landscape = icon([L(`
.77777777.
78cccccC88
78cwCCCC68
78cCCCCd68
78CCCCdd88
.88888888.`, 0, -2)]);
I.qr = icon([L(`
eeeeeeeeee
eXXXeeXXXe
eXeXeXXeXe
eXXXeeXXXe
eeeeXeeeee
eXeXXeXeXe
eXXXeXXeXe
eXeXeeXXee
eXXXeXeeXe
eeeeeeeeee`)]);
I.star = icon([L(`
....aa....
....aA....
...aaAA...
aaaawAAAAz
.aaaaAAAz.
..aaAAAz..
..aAAzAz..
.aAz..zAz.
.Az....zz.`)]);
I.clock = (() => {
  const g = ring(6.5, 6.5, 0, 4.7, (dx, dy, d) => d > 3.7 ? (dx + dy < -1.5 ? 'y' : dx + dy < 2 ? 'Y' : 'o') : (dx + dy > 2.2 ? 'E' : 'e'));
  stamp(g, 6, 3, `
k..
k..
kkk`);
  put(g, 6, 2, 'Y'); put(g, 3, 6, 'E'); put(g, 9, 6, 'E'); put(g, 6, 9, 'E');
  return icon([g]);
})();
I.arrow_right = icon([L(`
......y...
......yY..
yyyyyyyYY.
yYYYYYYYYo
YYYYYYYYo.
......Yo..
......o...`, 0, -1)]);

export const ORDER = Object.keys(I);
export default function paint() {
  const frames = {};
  for (const [k, v] of Object.entries(I)) frames[k] = Array.isArray(v[0][0]) ? v : [v];
  emit('ui_icons', '12×12 UI icons, one set per icon (flame animates 3 frames)', { anchor: [6, 12], fps: { flame: 8 }, palette: PAL, frames },
    ['Every icon is 12×12, anchor [6,12]. Sets: ' + ORDER.join(', ') + '.']);
}
