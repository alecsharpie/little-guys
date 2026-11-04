# Sprites

Every sprite is a pixel grid in `sprites/<id>.js` (format in `pix.js`, the same as Age Up's sprite-lab). Generator scripts
in `tools/sprites/<group>.mjs` write them (do not hand-edit big grids: change the generator and re-run it). Look at them on
`sprites.html` (`node tools/shot.mjs sprites.html --full`, then read `shots/sprites.png`).

The field is drawn on a low-res canvas at **30 px per world unit** and scaled up ×3–×4 with smoothing off.
Light from the **upper-left**. View: 3/4 top-down (you see the top and the front). Things face **right**; the game
mirrors them for left. Anchor = the ground point (feet / base centre) unless noted.

## House style (from ~/me/aoe/tools/sprite-lab/AAA.md, adapted to a sunny garden)

- Selective outline: 1-px dark, hue-shifted ink (`#24180f` warm, `#1c2a1e` on greens), never `#000`; the lit upper-left
  edge may use the material's shade tone instead. Interior lines only where similar values meet.
- Three tones per material (light / mid / shade, + optional deep and a 1-px glint). Shades cooler and more saturated,
  lights warmer. Clusters, not noise; no pillow shading; no stray single pixels except eyes and glints.
- Shared ramps:

| material | light | mid | shade | deep |
| --- | --- | --- | --- | --- |
| skin | `#f2d2b0` | `#e8c39e` | `#c9a07a` | `#8a5a3a` |
| straw | `#fbe7a1` | `#e9c46a` | `#b98b3e` | `#7a5526` |
| wood | `#a07a4a` | `#8a6a3a` | `#5a3a18` | `#3b2614` |
| steel | `#e6eaee` | `#9aa0a6` | `#5f656c` | `#1e2a33` |
| leaf | `#a6e05a` | `#5fb83f` | `#2f7d3a` | `#1c4a2c` |
| grass | `#8fd06a` | `#6cbf55` | `#4f9e47` | `#3a7d3e` |
| soil | `#9a6a44` | `#7a4f33` | `#5a3826` | `#3e2619` |
| team | `teamlight` | `team` | `teamdark` | ink |

## The list (ids, rough sizes, frame sets)

Garden (painter A):
- `gardener` 16×24, anchor feet. idle 4 · walk 8 · bonk 4 (frame 0 = the strike, rake at full swing) · charge 2 (rake drawn
  back, trembling) · spin 4 (front / side / back / side) · water 4 (tipping a watering can, drops) · dizzy 4 · sleep 2
  (sitting, eyes shut) · cheer 2 (arms up). Straw hat with a team band, team-coloured shirt/overalls (≥ 12 px of team).
- `crop_carrot`, `crop_cabbage`, `crop_pumpkin`, `crop_tomato`, `crop_sunflower`, `crop_strawberry`: grow 4 = [sprout,
  young, grown, ripe] (ripe shows the veg clearly), wilt 1. ~12×16 (sunflower up to 14×26, pumpkin up to 18×14).
- `plot` 60×44 raised bed with wooden edging, anchor centre [30,22]. soil 4 = [wet, ok, dry, dead] (by its health 3..0).
  The game plants 4 crops in it at (−14,−7), (14,−7), (−14,9), (14,9) from the centre.
- `grass` 32×32 seamless tiles, idle 3 variants. `tufts` idle 3 (~8×6), `flowers` idle 4 (~7×7), `stones` idle 2,
  `bush` ~26×20, `shed` ~56×52 (tool shed), `barrel` ~16×20 (water barrel).

Pests and effects (painter B):
- `beetle` 12×10: walk 4, munch 2. `snail` 16×12: walk 4, munch 2, hide 1 (in its shell). `hopper` (grasshopper) 16×11:
  hop 4 (crouch, launch, air, land), munch 2. `stag` (armoured stag beetle, shiny shell) 18×14: walk 4, munch 2.
  `stinkbug` 12×10: walk 4, munch 2, fly 2 (tumbling through the air). `queen` (boss beetle) 36×28: walk 4, munch 2, roar 2.
- `ladybug` (friendly, carries a power-up) 11×9: fly 2, walk 2. `weed` (practice target) 10×12: idle 2.
- `fx_poof` 16×16 idle 5 (squash puff, plays once) · `fx_stink` 32×22 idle 4 (green cloud) · `fx_sparkle` 7×7 idle 4 ·
  `fx_star` 5×5 idle 4 (dizzy stars) · `fx_bee` 7×6 fly 2 · `fx_drop` drop 1 (3×5), splash 3 (7×4).
