# Little Guys

A party game for a TV and a room full of phones. The TV shows a sunny garden: six raised beds of carrots, cabbages,
pumpkins, tomatoes, sunflowers and strawberries, and a lawn full of hungry bugs crawling in from the edges. Every phone
is a little controller for one tiny pixel gardener: a **joystick** on the left, a **button** on the right. Co-op, up to 8.

Built from the same parts as `~/me/finger-frolic` (TV hosts, phones join with a code, Cloudflare relay), with a real
controller instead of swipes, and pixel art made the way `~/me/aoe`'s sprite-lab makes it.

## Play

1. Open the game on the laptop plugged into the TV (`F` fullscreen, click once for sound).
2. Everyone scans the QR code (or opens the link and types the 5-letter code), enters a name, and turns their phone sideways.
3. Practise on the weeds in the lobby, then tap **Ready**. The game starts when everyone is ready (or press **Start now**).

| | |
|---|---|
| 🕹️ Stick | Drag anywhere on the left half. The stick centres where your thumb lands. |
| 👆 Tap | Bonk with your rake. Bonk a ripe crop to harvest it (+150). Bonk a dizzy friend to wake them up. |
| ✊ Hold, release | Charge a spinning rake sweep (the ring round the button fills; full = bigger and harder). The only way through a stag beetle's armour. |
| 🎳 Bowling | A pest you knock flying (even a squashed one) skids into the pests behind it and bowls them over. Line them up! Kills close together are DOUBLE / TRIPLE / QUAD / PENTA / MEGA SWEEP, with bonus points. |
| 💧 Hold in a bed | Standing in a bed that has been bitten, holding waters it instead: one heart per second or so. Wilted beds can be watered back to life. |

Each bed has three hearts. Pests head for the nearest living bed and munch it. When every bed has wilted, the game is over. Every cleared wave pays a garden bonus for each heart still standing.
The phone's button tells you what it will do where you are standing (BONK / 💧 HOLD / 🥕 TAP).

Pests: 🪲 beetles (wave 1) · 🦗 grasshoppers, quick and hoppy (2) · stag beetles, armoured and they pinch (3) ·
💨 stinkbugs: a bonk sends them flying, and they burst in a stink cloud that hurts pests and dizzies gardeners (4) ·
🐌 snails, slow and tough (6) · 👑 the beetle queen every 5th wave (she sheds beetles when hit; beat her and every bed heals).
🐞 Ladybugs are friends: catch one for a team power-up: 🌧️ rain (every bed +1 heart), 🐝 bees (sting the nearest pests),
🍄 giant (you grow, with a longer, harder rake), 🌻 bloom (every living crop ripens).

At the end everyone gets an award (Pest Smasher, Harvest Hero, Water Wizard, Spin Doctor, Stink Bomber, Good Friend…).
Phones can drop in at any time; a phone that locks gets its gardener back when it reconnects (it naps meanwhile).

TV keys: `F` fullscreen · `M` mute · `Space` start · `Esc` back to the lobby.

## How it fits together

- `index.html` is the TV (host) and the only place the rules run. `pad.html` is the controller: it sends
  `{j:[x, y], b}` (stick and button) when they change, the stick at most 20 times a second, the button at once.
- `game.js` holds the rules (pure, tested). `draw.js` paints the field on a 480×270 canvas (30 px per world unit) and
  scales it up with smoothing off; names and popups are drawn sharp on top.
- `sprites/` holds the pixel sprites, one file per sprite, in sprite-lab's format (palette + character grids, team
  colours as `team`/`teamdark`/`teamlight`). `sprites/SPRITES.md` is the list and the house style.
  `tools/sprites/` has the generator scripts that write them. Look at them all, animated, on `sprites.html`.
- `shared/net.js` connects the TV and phones over the relay in `server/` (a Durable Object per room code), or over
  BroadcastChannel between tabs with `?net=local`. Until this game's relay is deployed it uses Finger Frolic's
  (the relay doesn't know which game is talking through it).
- `shared/audio.js` synthesises every sound.

## Development

No build step: edit and reload.

```sh
npm start        # serves on the home network + runs the relay locally (needs `npm install` in server/ once)
npm test         # rules tests + relay tests
node tools/shot.mjs sprites.html --full      # screenshot a page with headless Chromium → shots/
```

**Dev mode:** `dev.html` shows the TV and 1–8 landscape phones in one tab over BroadcastChannel (no relay). Click a phone
and use WASD/arrows + space (R = ready), or the mouse. Tick **bot** (or `dev.html?bots`) to have phones play themselves.

## Deploy

Static site (GitHub Pages like the other games). For its own relay: `CLOUDFLARE_API_TOKEN=… server/deploy.sh`
(deploys `littleguys-relay` and writes its URL into `shared/net.js`).
