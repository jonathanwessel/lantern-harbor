# Changelog

## v1.1.0 — Free to Play

- **Lantern Harbor is free.** Removed every real-money element: the gem packs, the starter pack,
  the checkout dialog, the Revenue tab and the "test mode" banner.
- Gems are still earned the same ways (daily rations, achievements, contracts, seasonal
  challenges, golden and ghost ships, petrels, skuas and raids) and spent the same ways.
- The Gem Shop now opens with what you can buy, plus an **Earn gems** guide with shortcuts to Goals.
- Old saves keep everything, including the starter pack's 1.5× light and Sea Glass beam for
  anyone who had them.

## v1.0.0 — Take It With You

**New**
- **Install it as an app.** Lantern Harbor now has an app icon and a web app manifest. In
  Chrome or Edge, an **Install app** button appears under the panels (or use the browser's
  install icon) to get a desktop/home-screen app that opens full screen.
- **Works offline.** After one visit the whole game, fonts included, is cached on the device, so
  it loads even when the play server is off. A new cache comes with each release, and the
  "new version" notice still works whenever the server is reachable.
- **First-run tips** for brand-new players: tap the lamp, guide a ship, buy an upgrade.
  Skippable, and players with an existing save never see them.

**Balance**
- Golden ships are capped at about one every 20 seconds, however many bonuses stack. Before this,
  Sunreef Atoll with every golden-ship bonus could spawn one every ~12s, worth ~300 gems an hour.
- Bird arrivals are capped (gulls at most every ~6s, albatrosses ~60s, petrels ~8s), so Spring at
  the Atoll with full Ornithology no longer fills the sky nonstop.
- Albatross Tailwinds stack to at most 30 seconds, instead of chaining indefinitely.
- Normal play is unaffected: the caps only kick in when several bonuses stack up.

## v0.9.0 — Seasons

**New**
- **A new season every week**, the same for everyone. It changes on Monday 00:00 UTC and rotates
  Spring Migration, Summer Regatta, Autumn Gales, Winter Ice. This week is **Autumn Gales**.
  Each season changes the rules and the look of every harbor:
  - **Spring Migration**: birds twice as common and pay ×1.5. Greener coasts, drifting blossom,
    migrating flocks.
  - **Summer Regatta**: one more ship at a time, clippers three times as common, combo window +3s.
    Bunting on the lighthouse and bright racing sails.
  - **Autumn Gales**: fog and storms twice as often, bad-weather ships +1×, skua raids 50% more
    often. Rust-colored hills and blowing leaves.
  - **Winter Ice**: ships pay ×3 at night, ghost ships twice as common, golden ships pay ×1.5.
    Ice floes and snow in every harbor.
- **Seasonal challenges** (top of the Goals tab): three per season. Finish them for ◆ 30 and that
  season's **beam color**, yours to keep: Blossom Pink, Regatta Lime, Maple Orange, Frost Blue.
  If you finish but the week ends before you claim, the reward is added automatically.
- The season shows in the conditions line, and seasonal beams appear in the Gem Shop (earned,
  never sold).
- 2 achievements: Seasoned, A Year at Sea. Seasons finished in the Logbook.

## v0.8.0 — Flares & Raiders

**New**
- **Skuas.** Once you've earned 2K light all-time, dark pirate seabirds start showing up: alone now
  and then, and in **raids** of 3–6 with an alarm. While over the harbor each one steals light
  (about 6% of your per-second income, never more than 1% of your light per second).
- **Flare Gun.** Tap the sky near a skua to fire a signal flare from the lantern gallery. It flies
  to where you tapped and bursts, so lead fast birds a little. A downed skua tumbles into a puff
  of feathers and drops everything it stole plus 50%, a bounty, and sometimes a gem.
  - 3 flares to start, reloading one at a time. A HUD badge shows your flares and the raid.
  - Repel a whole raid for a bonus and a gem.
  - Out of flares? Sky taps go back to being lamp taps, so no tap is wasted.
  - Keyboard: Enter/Space fires at the nearest skua (aimed for you).
- **Flare Battery** research: +1 flare and faster reloads per level.
- **Sharpshooter** keeper trait (home: Lamp Room): fires at raiders on their own, every 6s
  and faster with levels.
- Sounds: flare launch, burst, skua squawk, raid alarm.
- New contract (shoot down skuas), 3 achievements (Flare Up, Raid Breaker, Sharp Eyes),
  and skuas downed / raids repelled in the Logbook.

**Fixed**
- The stats panel and badges over the scene were blocking taps on birds and golden ships
  behind them.

## v0.7.0 — New Shores

**New**
- **Two new harbors** with their own look, day length and rules:
  - **Frostwatch Fjord** (discovered after 2 relights): snow-capped peaks, drifting ice floes,
    falling snow, a black-and-white tower and the northern lights at night. Long polar nights,
    guided ships pay ×2, light per second ×0.8, fewer birds. Weather: blizzards and polar gales.
  - **Sunreef Atoll** (after 5 relights): turquoise shallows, coral, palm islands and a
    teal-striped tower. Long sunny days, light per second ×1.25, birds twice as common, golden
    ships 50% more often, guided ships pay ×0.8. Weather: sea mist and squalls.
- **Sea chart**: tap the ⚓ harbor button by your wallet to see every harbor and sail between them.
- **Each harbor keeps its own light, upgrades and run.** Gems, lumens, research, keepers,
  achievements and cosmetics are shared. Only the harbor you're at earns light. Relighting resets
  just the harbor you're in.
- **Harbor network**: +10% to all light everywhere for each harbor you discover.
- The page takes on each harbor's colors.
- 2 new achievements: Northern Lights, Island Time.

**Your save**: existing progress becomes Lantern Harbor's progress. Nothing moves or resets.

## v0.6.0 — Keepers

**New**
- **Keepers tab.** Hire named keepers with light (5K for the first, ×8 for each after, up to 8)
  and give each one a post:
  - *Lamp Room*: +10% light per tap per keeper level.
  - *Dock*: +10% light per guided ship per level.
  - *Observatory*: research 5% faster per level.
  - *Lookout*: golden ships and birds 4% more often per level.
- **Keepers level up** the longer they serve, up to level 10 (about 2.7 hours on duty), and keep
  training while you're away. They stay with you when you relight.
- **Traits.** Every keeper has one, with a home post where they work ×1.5 and add a perk:
  Night Owl (Lamp Room, doubled at night), Old Salt and Storm Sailor (Dock), Scholar
  (Observatory, half-price research rushes), Birder and Eagle Eye (Lookout).
- Choose from three candidates, or pay 3 gems for new faces. Moving a keeper to a filled post
  swaps the two.
- **You can see your crew**: a keeper with a lantern walks the lamp gallery, another waits on the
  dock, a lookout watches from the cliff with a spyglass, and the observatory window glows.
- 3 new achievements: First Mate, Full Watch, Seasoned Keeper.

## v0.5.0 — Sound & Feel

**New**
- **Sound.** Everything is synthesized live, with no audio files:
  - Ambience: rolling waves, wind, rain in storms, a distant foghorn in fog, and your Fog Bell
    tolling once you own one.
  - Effects: lamp taps, a chime for every guided ship that climbs a musical scale as your combo
    grows, an eerie tone for ghost ships, a sparkle for golden ships, bird chirps and gull cries,
    thunder after lightning, and chimes for research, contracts, achievements and relights.
  - Sound starts after your first tap (a browser rule) and pauses when the tab is hidden.
- **Settings** (button under the panels): sound on/off, ambience and effects volume, vibration on
  phones, reduce motion (fewer particles, no lightning flash), and number format
  (1.23M, 1.23e6, or 1,234,567). Settings stay on this device and aren't part of Export save.
- A **Sound on/off** quick toggle next to Settings.
- **Vibration** on phones when you guide ships and catch birds or golden ships.

**Balance**
- Gems were coming in faster than the Gem Shop expects, mostly from contracts and storms:
  - Harbor Contract gem rewards are roughly halved (2–4 gems each, still plus light).
    Contracts you already have keep their current reward.
  - Storm petrels are about half as common and give 1 gem (was 2).

## v0.4.0 — Fleet & Contracts

**New**
- **Seven ship classes**, each worth a different amount when guided:
  fishing boats (×0.6, common), sloops (×1), schooners (×1.3), steamers (×1.4),
  freighters (×3, slow and stacked with containers), clippers (×1.8, fast, gone quickly),
  and rare **ghost ships** that only sail at night (×8 and +1 gem, and they fade at daybreak).
- **Tap a ship to pick it.** Tapping a specific ship guides that one, so you can go for freighters
  and ghosts. Tapping anywhere else still guides the first ship in view.
- **Guiding combo.** Guide ships back to back (within 8 seconds) for +10% per ship, up to ×3.
- **Harbor Contracts** in the Goals tab: three rotating goals (guide ships at night, catch birds,
  reach a combo, guide freighters...) that pay gems plus light. Swap one you don't like for 2 gems.
- **Keeper's Logbook** in the Goals tab: lifetime stats, time played, best combo, and ships by class.
- **Shipping Lanes** research: one more ship in the harbor at a time per level (up to 7).
- 4 new achievements: Ghost Light, Heavy Cargo, Chain of Lights, Harbor Contractor.

## v0.3.0 — The Living Harbor

**New**
- **Harbor Observatory (Research tab).** 11 permanent projects that survive a relight and keep
  running while you're away. One at a time; finish early with gems.
  - *Clockwork Beam*: the sweeping beam guides ships on its own.
  - *Bird Lure*: birds land at the lantern on their own.
  - *Harbor Dues*: +50% light per guided ship per level.
  - *Lookout Post*: golden ships appear more often.
  - Also: Incandescent Mantles, Clockwork Rotation, Ornithology, Fog Signals, Gilded Charts,
    Tide Tables (longer offline cap), Lumen Optics (stronger lumens; unlocks after a relight).
- **Day and night.** A 6-minute cycle with moon, sun, stars and dusk light. Ships pay ×2 at night;
  birds visit twice as often by day.
- **Weather.** Fog (ships ×3) and storms (taps ×2, ships ×2, lightning, rain) roll in now and then.
- **Birds.** Gulls (light), rare albatrosses (Tailwind: taps ×5 for 15s), and storm petrels (+2 gems).
- **The harbor grows.** The cottage lights up, and a fog bell, pilot boat, radio mast, satellite dish,
  coast guard station, lens workshop and observatory appear as you buy them.
- **A real rotating beam** that swings in front of and behind the tower. Tapping snaps it onto a ship.
- Ship variety (sloops, schooners, steamers), wakes, running lights, sharper graphics on high-DPI screens.
- 4 new achievements.

**Saves**
- Export save / Import save (copyable code) and automatic rolling Backups with one-click restore.
- The game refuses to write a damaged save, and pauses saving in a stale second tab.
- An in-game notice when a new version is released.

## v0.2.0 — Module split
- Split the single HTML file into `index.html`, `styles.css` and ES modules, with a Vite dev server.
  No gameplay changes.
