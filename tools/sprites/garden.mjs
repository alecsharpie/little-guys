// Garden group painter: writes sprites/gardener.js, crop_*.js, plot.js, grass.js, tufts.js, flowers.js, stones.js, bush.js,
// shed.js, barrel.js. Run from the project root: node tools/sprites/garden.mjs [ids…]
import { emit } from './garden/lib.mjs';
import * as gardener from './garden/gardener.mjs';
const want = process.argv.slice(2);
const on = id => !want.length || want.includes(id);
if (on('gardener')) emit('gardener', { id: 'gardener', anchor: [9, 26], palette: gardener.PAL, frames: gardener.build() });
import * as crops from './garden/crops.mjs';
for (const [id, spec] of Object.entries(crops.build())) if (on(id)) emit(id, spec);
import * as props from './garden/props.mjs';
for (const [id, spec] of Object.entries(props.build())) if (on(id)) emit(id, spec);
