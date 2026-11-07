# Lantern Harbor

A tap-and-idle lighthouse game. Tap to earn light, buy upgrades, guide ships, catch birds and golden
ships, research permanent bonuses at the Harbor Observatory, and relight the lamp for lumens.
The harbor itself grows as you play: day turns to night, fog and storms roll in, and new buildings
appear on the island and headlands as you buy upgrades.

Lantern Harbor is **free to play**: there are no purchases. Gems are earned in the game (daily rations,
achievements, contracts, seasonal challenges, golden and ghost ships, birds and raids) and spent in the Gem Shop.

## Run it

```bash
npm install
npm run play      # the stable release, at http://localhost:5173  (play here)
npm run dev       # live development build, at http://localhost:5174
```

```bash
npm run stage     # build the current code and serve it at http://localhost:5175 (test a release before shipping)
```

Play on **5173**, develop on **5174**, and check production builds (offline cache, install) on **5175**.

The play server also listens on your local network, so other devices on the same Wi-Fi/LAN can
open `http://<this PC's IP>:5173` (for example `http://192.168.1.162:5173`). Each address keeps its
own save (browser storage is per address), so use **Menu > Export save / Import save** to move
progress between `localhost` and the network address or another device. Offline mode and
installing need a secure address (`localhost` or HTTPS), so they're unavailable over the plain
network address; the game itself works normally. They are different origins, so each keeps its own save and
nothing done in dev can touch the save you play with. The play server only ever serves tagged
releases from `live/`; when a new one is published, the running game shows "Version X is ready" and
reloads on your click, saving first.

## Online

The game is published with GitHub Pages at **https://jonathanwessel.github.io/lantern-harbor/**.
`.github/workflows/pages.yml` builds and deploys it on every push to `main`, so publishing a
release online is `git push origin main --tags` after `npm run release`. Installed copies (PWA)
pick up the new version the next time they're opened, or show "Version X is ready" if open.

## Releasing

1. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
2. Commit.
3. `npm run release` tags `v<version>` at HEAD and builds that tag (from a clean checkout) into `live/`.
4. `git push origin main --tags` publishes it online.

`npm run release -- v0.2.0` rebuilds an older tag, which is also how to roll back.

## Layout

The harbor canvas fills the window. `scene.js` has a camera: world coordinates stay fixed (the
lighthouse is at 340,67 in a 680×300 band) and the camera scales and positions that world to fill
any screen, keeping the lighthouse centered in the space not covered by the HUD, dock or an open
panel (`setInsets`, driven by `updateInsets()` in `ui/panels.js`). Panels are a bottom sheet on
phones and a right-hand drawer at ≥1100px wide or on short landscape screens.

## Install and offline

Release builds include a web app manifest and a service worker (`sw.js`, generated per release in
`vite.config.js`). The game can be installed from Chrome/Edge ("Install app" button) and runs offline
after one visit. Navigations are network-first, so a running game still picks up new releases.

## Saves

- Stored in `localStorage` under `lh-save` (versioned, currently `v: 2`). Loading merges the save
  over defaults, so old saves keep working and every new field needs a default in `src/state.js`.
- Rolling backups (`lh-save-backups`): taken on every load, hourly, and before an import. Restore
  them from **Backups** under the panels.
- **Export save** / **Import save** move progress between browsers and devices as a copyable code.
- The game refuses to write a save with invalid numbers, and if the game is open in two tabs, the
  older tab stops saving.

## Code layout

| File | What it does |
| --- | --- |
| `index.html`, `styles.css` | Markup and styles |
| `src/config.js` | Game data: upgrades, shop, achievements, research, birds |
| `src/state.js` | Save state, load/save, backups, export/import |
| `src/economy.js` | Income, costs, multipliers, prestige, research math |
| `src/world.js` | Day/night cycle and weather |
| `src/contracts.js` | Harbor Contracts |
| `src/harbors.js` | Harbors: unlocks, travel, per-harbor progress |
| `src/seasons.js` | Weekly seasons: calendar, rules, challenges, rewards |
| `src/themes.js` | Per-harbor scene palettes and features |
| `src/keepers.js` | Keepers: hiring, posts, levels, trait perks |
| `src/ui/keepersPanel.js` | Keepers tab |
| `src/audio.js` | Synthesized ambience and sound effects (Web Audio) |
| `src/settings.js` | Device settings (`lh-settings`, separate from the save) |
| `src/scene.js` | Canvas harbor scene and tap handling |
| `src/ui/panels.js` | Tab panels and button actions |
| `src/ui/dialogs.js` | Modal and toast |
| `src/tutorial.js` | First-run tips |
| `public/` | App icons and manifest |
| `src/main.js` | Startup, main loop, offline earnings, update notice |

See `ROADMAP.md` for what's next.
