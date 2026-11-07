/* Game state and persistence.
 *
 * Progress lives in localStorage under SAVE_KEY as a versioned object.
 * Loading merges the stored object over fresh defaults, so older saves keep
 * working and any field added later picks up its default. When adding a new
 * field, give it a default in defaults() below; never rename SAVE_KEY.
 *
 * Safety nets so a player never loses progress:
 *  - A rolling set of backups (BACKUP_KEY) is written on every load and hourly.
 *  - save() refuses to write a state with NaN/Infinity numbers or missing fields.
 *  - If another tab writes the save, this tab stops saving (see lockSaves()).
 */

export const SAVE_KEY = "lh-save";
export const BACKUP_KEY = "lh-save-backups";
export const SAVE_VERSION = 2;
const MAX_BACKUPS = 8;

export const defaults = () => ({
  v:SAVE_VERSION, coins:0, gems:25, owned:{}, color:"amber", colors:["amber"], boostUntil:0, perm:1, ships:0, spent:0, purchases:[], starter:false,
  lifetime:0, run:0, taps:0, lumens:0, relights:0, golden:0, charter:false, ach:[], daily:{last:"",streak:0}, buyQty:1, lastSeen:0,
  // v0.3
  research:{}, lab:null, birds:0, albatross:0, weatherShips:0, frenzyUntil:0,
  // v0.4
  contracts:[], contractsDone:0, bestCombo:0, shipsBy:{}, playTime:0,
});

/** The live game state. Other modules import this binding and mutate its fields. */
export let S = defaults();

/** Research level for a project id. */
export const lvl = id => S.research[id]||0;

/** Merge a stored save over defaults, migrating v1 (unversioned) saves. */
export function hydrate(s) {
  const out = {...defaults(), ...s};
  if (!s.v) { out.v = SAVE_VERSION; out.lifetime = Math.max(out.coins, out.ships*10); out.run = out.lifetime; }
  return out;
}

/** Throws if `s` doesn't look like a Lantern Harbor save (wrong types for known fields). */
export function validate(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) throw new Error("not a save object");
  if (typeof s.coins !== "number") throw new Error("missing light total");
  const d = defaults();
  for (const k of Object.keys(d)) {
    if (s[k] === undefined) continue;
    const want = d[k], got = s[k];
    const ok = k === "buyQty" ? (got === "max" || typeof got === "number")
      : want === null ? (got === null || typeof got === "object")
      : Array.isArray(want) ? Array.isArray(got)
      : typeof want === typeof got && (typeof got !== "number" || Number.isFinite(got));
    if (!ok) throw new Error(`bad value for "${k}"`);
  }
  return s;
}

function healthy(s) {
  try { validate(s); return true; } catch (e) { return false; }
}

/* ---------- Backups ---------- */
export function backups() {
  try { return JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]"); } catch (e) { return []; }
}
function pushBackup(raw, why) {
  try {
    const list = backups();
    if (list.length && list[0].data === raw) return;
    list.unshift({ t: Date.now(), why, data: raw });
    localStorage.setItem(BACKUP_KEY, JSON.stringify(list.slice(0, MAX_BACKUPS)));
  } catch (e) {}
}
let lastBackup = 0;

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const s = JSON.parse(raw || "null");
    if (s) { pushBackup(raw, "load"); S = hydrate(s); }
  } catch (e) {}
  lastBackup = Date.now();
}

/* ---------- Saving ---------- */
let locked = false, onLock = null;
/** Stop all saving from this tab (another tab took over, or a newer version wrote the save). */
export function lockSaves() { if (!locked) { locked = true; onLock && onLock(); } }
export const savesLocked = () => locked;
export function whenLocked(fn) { onLock = fn; }

export const save = () => {
  if (locked) return;
  if (!healthy(S)) { console.warn("Lantern Harbor: refusing to write an invalid save", S); return; }
  S.lastSeen = Date.now();
  try {
    const raw = JSON.stringify(S);
    localStorage.setItem(SAVE_KEY, raw);
    if (Date.now() - lastBackup > 3600e3) { lastBackup = Date.now(); pushBackup(raw, "hourly"); }
  } catch (e) {}
};

/* Another tab wrote the save: this tab's copy is stale, so stop writing. */
addEventListener("storage", e => { if (e.key === SAVE_KEY && e.newValue) lockSaves(); });

/* ---------- Save codes (export / import between browsers) ---------- */
const PREFIX = "LH2.";

export function exportCode() {
  save();
  const bytes = new TextEncoder().encode(JSON.stringify(S));
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
  return PREFIX + btoa(bin);
}

/** Parse a save code (or raw save JSON). Returns the save object or throws. */
export function parseCode(code) {
  code = String(code).trim();
  let json;
  if (code.startsWith("{")) json = code;
  else {
    const body = code.replace(/^LH\d+\./, "").replace(/\s+/g, "");
    let bin; try { bin = atob(body); } catch (e) { throw new Error("that doesn't look like a save code"); }
    json = new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  let s; try { s = JSON.parse(json); } catch (e) { throw new Error("the save code is incomplete or damaged"); }
  return validate(s);
}

/** Replace the current game with an imported save. The previous save is backed up first. */
export function replaceState(s) {
  try { const cur = localStorage.getItem(SAVE_KEY); if (cur) pushBackup(cur, "before import"); } catch (e) {}
  S = hydrate(s);
  locked = false;
  save();
}
