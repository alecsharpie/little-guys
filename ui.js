// The pixel-art UI: icons, panels and buttons for the HTML around the game (TV overlays, phone controller), drawn from
// the same sprites as the field (sprites/ui_*.js, pad_*.js, logo.js). No emoji anywhere: every glyph is a sprite.
//
//   art(name, scale)   an <img> of an icon (a set of ui_icons, e.g. 'heart') or any sprite ('crop_carrot', 'beetle')
//   skin(scale)        paints the 9-slice panels and buttons into CSS variables at a whole-number scale
import { S } from './sprites/index.js';
import { frame } from './sprites/pix.js';

const URLS = new Map();
// a data: URL of a sprite frame, scaled up by a whole number so the browser never has to resample it
export function dataUrl(spec, set, i = 0, scale = 1, team = null) {
  const key = spec.id + '|' + set + '|' + i + '|' + scale + '|' + (team ? team.c : '');
  let u = URLS.get(key);
  if (u) return u;
  const f = frame(spec, set, i, team), c = document.createElement('canvas');
  c.width = f.width * scale; c.height = f.height * scale;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(f, 0, 0, c.width, c.height);
  u = c.toDataURL(); URLS.set(key, u);
  return u;
}

// name → [spec, set, frame]: an icon set first, then a sprite id (its first set; ripe for crops)
export function lookup(name) {
  if (S.ui_icons?.frames[name]) return [S.ui_icons, name, 0];
  const spec = S[name] || S['crop_' + name];
  if (!spec) return [S.ui_icons, 'star', 0];
  const set = spec.frames.grow ? 'grow' : spec.frames.idle ? 'idle' : spec.frames.walk ? 'walk' : Object.keys(spec.frames)[0];
  return [spec, set, set === 'grow' ? 3 : 0];
}

export function art(name, scale = 3, { cls = '', team = null, frame: fi = null, alt = '' } = {}) {
  const [spec, set, i] = lookup(name), f = frame(spec, set, fi ?? i, team);
  return `<img class="px ${cls}" src="${dataUrl(spec, set, fi ?? i, scale, team)}" width="${f.width * scale}" height="${f.height * scale}" alt="${alt}" draggable="false">`;
}

// 9-slice skins: [sprite, set, slice in sprite pixels]
const SKINS = { panel: ['ui_panel', 'idle', 8], paper: ['ui_paper', 'idle', 8], btn: ['ui_button', 'up', 6], 'btn-down': ['ui_button', 'down', 6],
  gold: ['ui_button_gold', 'up', 6], 'gold-down': ['ui_button_gold', 'down', 6], chip: ['ui_chip', 'idle', 4] };
export function skin(scale = 3) {
  const root = document.documentElement.style;
  for (const [name, [id, set, slice]] of Object.entries(SKINS)) {
    const spec = S[id]; if (!spec) continue;
    root.setProperty(`--${name}`, `url(${dataUrl(spec, set, 0, scale)})`);
    root.setProperty(`--${name}-s`, String(slice * scale));
    root.setProperty(`--${name}-w`, slice * scale + 'px');
    // a one-step-smaller version, for cards inside panels
    const sm = Math.max(2, scale - 1);
    root.setProperty(`--${name}-sm`, `url(${dataUrl(spec, set, 0, sm)})`);
    root.setProperty(`--${name}-sm-s`, String(slice * sm));
    root.setProperty(`--${name}-sm-w`, slice * sm + 'px');
  }
  root.setProperty('--px', scale + 'px');
}

// a whole-number pixel scale for this screen: ~3 on a 900-px-tall TV, 2–3 on a phone
export const uiScale = (base = 300) => Math.max(2, Math.round(Math.min(innerWidth * 0.5625, innerHeight) / base));
