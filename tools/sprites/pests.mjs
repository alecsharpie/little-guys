// Paints the pests, friends and effects (painter B): node tools/sprites/pests.mjs [id …]
// Each painter lives in tools/sprites/pests/<id>.mjs and writes sprites/<id>.js through kit.emit.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pests');
const ALL = ['beetle', 'snail', 'hopper', 'stag', 'stinkbug', 'queen', 'ladybug', 'weed', 'fx'];
const want = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
for (const id of want) {
  const f = path.join(dir, id + '.mjs');
  if (!fs.existsSync(f)) { console.log('skip', id); continue; }
  await (await import(pathToFileURL(f).href)).default();
  console.log('painted', id);
}
