// The home-screen icon: the gardener's idle frame on the lawn, pixel-true. node tools/icon.mjs → icon.png (180×180)
import { canvas } from './sprites/garden/lib.mjs';
import g from '../sprites/gardener.js';
const f = g.frames.idle[0].replace(/^\n+|\n+$/g, '').split('\n'), w = f[0].length, h = f.length, z = 6;
const cv = canvas(180, 180, '#6cbf55');
cv.fill(0, 140, 180, 40, '#4f9e47');
cv.blit(g.frames.idle[0], g.palette, Math.round((180 - w * z) / 2), 160 - h * z, z, { team: '#e04a4a', teamdark: '#992838', teamlight: '#ff9a88' });
cv.save(new URL('../icon.png', import.meta.url).pathname);
