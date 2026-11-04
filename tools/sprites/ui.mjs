// Paints the UI kit (icons, 9-slice panels and buttons, phone controller pieces, logo): node tools/sprites/ui.mjs [part …]
// Parts live in tools/sprites/ui/<part>.mjs and write sprites/<id>.js through kit.emit. Preview: node tools/sprites/ui/preview.mjs
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ui');
const ALL = ['icons', 'panels', 'pad', 'logo'];
const want = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
for (const id of want) { await (await import(pathToFileURL(path.join(dir, id + '.mjs')).href)).default(); console.log('painted', id); }
