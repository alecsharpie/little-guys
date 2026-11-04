// Screenshot a page of this project with headless Chromium, so art and layout can be looked at, not guessed.
//   node tools/shot.mjs <page> [--w 1600] [--h 900] [--wait 1200] [--out shots/page.png] [--eval "js run before the shot"] [--print "js expression to print"]
// Serves the project root itself. Playwright comes from ~/.claude/skills/screenshot-verify (npm install there once).
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), page = args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')) || 'sprites.html';
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const W = +opt('w', 1600), H = +opt('h', 900), wait = +opt('wait', 1200);
const out = path.resolve(root, opt('out', 'shots/' + path.basename(page).replace(/[?#].*/, '').replace(/\.html$/, '') + '.png'));
let pw;
for (const base of [root, path.join(os.homedir(), '.claude/skills/screenshot-verify')]) {
  try { pw = createRequire(path.join(base, 'x.js'))('playwright'); break; } catch (e) {}
}
if (!pw) { console.error('playwright not found: cd ~/.claude/skills/screenshot-verify && npm install'); process.exit(1); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); let f = path.join(root, decodeURIComponent(u.pathname));
  if (!f.startsWith(root)) { res.writeHead(404); return res.end(); }
  try { if ((await fs.stat(f)).isDirectory()) f = path.join(f, 'index.html'); res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(await fs.readFile(f)); }
  catch (e) { res.writeHead(404); res.end(); }
}).listen(0);
const port = srv.address().port;
const browser = await pw.chromium.launch();
const tab = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
tab.on('pageerror', e => errors.push(String(e)));
tab.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await tab.goto(/^https?:/.test(page) ? page : `http://localhost:${port}/${page}`);
await tab.waitForTimeout(wait);
if (opt('eval')) { await tab.evaluate(opt('eval')); await tab.waitForTimeout(+opt('after', 600)); }
if (opt('print')) console.log(JSON.stringify(await tab.evaluate(opt('print'))));
await fs.mkdir(path.dirname(out), { recursive: true });
await tab.screenshot({ path: out, fullPage: args.includes('--full') });
console.log(out);
if (errors.length) console.log('page errors:\n  ' + errors.join('\n  '));
await browser.close(); srv.close();
