# Changelog

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
