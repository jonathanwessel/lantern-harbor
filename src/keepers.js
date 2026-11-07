/* Keepers: permanent crew (they survive a relight). Hire with light, assign to a post, and they
 * gain a level the longer they serve (offline too). A keeper at their trait's home post gets x1.5
 * and their trait's perk. */
import { KEEPER_NAMES, TRAITS, POSTS, keeperLevel } from "./config.js";
import { S } from "./state.js";
import { isNight } from "./world.js";

export const MAX_KEEPERS = 8;
export const REROLL_COST = 3;
export const CANDIDATES = 3;

export const hireCost = () => Math.ceil(5000*Math.pow(8, S.keepers.length));
export const keeperAt = post => S.keepers.find(k => k.post === post) || null;
export const levelOf = k => keeperLevel(k.xp);
/** XP needed for the next level (levels come at 120 * L^2 seconds of service). */
export const nextLevelXp = k => 120*Math.pow(levelOf(k), 2);
export const prevLevelXp = k => 120*Math.pow(levelOf(k)-1, 2);
export const atHome = k => !!k && !!k.post && TRAITS[k.trait]?.home === k.post;

/** Strength of a post: the keeper's level, x1.5 at home, x2 more for a Night Owl at night. */
export function postPower(post) {
  const k = keeperAt(post); if (!k) return 0;
  let p = levelOf(k)*(atHome(k) ? 1.5 : 1);
  if (atHome(k) && k.trait === "nightowl" && isNight()) p *= 2;
  return p;
}

/** Level of the keeper using `trait` at their home post (0 if none): drives trait perks. */
export function perkLevel(trait) {
  let best = 0;
  for (const k of S.keepers) if (k.trait === trait && atHome(k)) best = Math.max(best, levelOf(k));
  return best;
}

/* Post effects used by the economy. */
export const lampMult = () => 1 + .1*postPower("lamp");
export const dockMult = () => 1 + .1*postPower("dock");
export const obsSpeed = () => 1 + .05*postPower("obs");
export const lookMult = () => 1 + .04*postPower("look");

/* ---------- Hiring ---------- */
function candidate() {
  const used = new Set([...S.keepers, ...S.candidates].map(k => k.name));
  const pool = KEEPER_NAMES.filter(n => !used.has(n));
  const name = pool.length ? pool[Math.random()*pool.length|0] : `Keeper ${S.keepers.length+S.candidates.length+1}`;
  const ids = Object.keys(TRAITS);
  return { name, trait: ids[Math.random()*ids.length|0] };
}

export function ensureCandidates() {
  S.candidates = S.candidates.filter(c => c && TRAITS[c.trait]);
  S.keepers = S.keepers.filter(k => k && TRAITS[k.trait]);
  while (S.candidates.length < CANDIDATES) S.candidates.push(candidate());
}

/** Hire candidate i. They go straight to their home post if it's free. */
export function hire(i) {
  const c = S.candidates[i]; if (!c) return null;
  const home = TRAITS[c.trait].home;
  const k = { id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), name: c.name, trait: c.trait, xp: 0, post: keeperAt(home) ? null : home };
  S.keepers.push(k);
  S.candidates.splice(i, 1);
  ensureCandidates();
  return k;
}

export function reroll() { S.candidates = []; ensureCandidates(); }

/** Put keeper `id` on `post` (or off duty for ""). Whoever held that post swaps to the old one. */
export function assign(id, post) {
  const k = S.keepers.find(k => k.id === id); if (!k) return;
  post = POSTS.some(p => p.id === post) ? post : null;
  const other = post && keeperAt(post);
  if (other && other !== k) other.post = k.post || null;
  k.post = post;
}

/** Add service time to every keeper on duty. Returns the keepers who levelled up. */
export function addXp(sec) {
  const ups = [];
  for (const k of S.keepers) if (k.post) { const l = levelOf(k); k.xp += sec; if (levelOf(k) > l) ups.push(k); }
  return ups;
}
