/* Game state and persistence.
 *
 * Progress lives in localStorage under SAVE_KEY as a versioned object.
 * Loading merges the stored object over fresh defaults, so older saves keep
 * working and any field added later picks up its default. When adding a new
 * field, give it a default in defaults() below; never rename SAVE_KEY.
 */

export const SAVE_KEY = "lh-save";
export const SAVE_VERSION = 2;

export const defaults = () => ({
  v:SAVE_VERSION, coins:0, gems:25, owned:{}, color:"amber", colors:["amber"], boostUntil:0, perm:1, ships:0, spent:0, purchases:[], starter:false,
  lifetime:0, run:0, taps:0, lumens:0, relights:0, golden:0, charter:false, ach:[], daily:{last:"",streak:0}, buyQty:1, lastSeen:0,
});

/** The live game state. Other modules import this binding and mutate its fields. */
export let S = defaults();

/** Merge a stored save over defaults, migrating v1 (unversioned) saves. */
export function hydrate(s) {
  const out = {...defaults(), ...s};
  if (!s.v) { out.v = SAVE_VERSION; out.lifetime = Math.max(out.coins, out.ships*10); out.run = out.lifetime; }
  return out;
}

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (s) S = hydrate(s);
  } catch (e) {}
}

export const save = () => {
  S.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
};
