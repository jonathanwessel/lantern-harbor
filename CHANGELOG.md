# Changelog

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
