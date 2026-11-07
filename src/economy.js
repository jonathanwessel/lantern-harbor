/* Economy: multipliers, income, costs, prestige, research, and daily/achievement checks. */
import { UPGRADES, ACH } from "./config.js";
import { S, lvl } from "./state.js";
import { isNight, stormy, badWeather, weatherShipMult } from "./world.js";
import { lampMult, dockMult, obsSpeed, lookMult, perkLevel } from "./keepers.js";

export const boosted = () => Date.now() < S.boostUntil;
export const frenzy = () => Date.now() < S.frenzyUntil;
/** Bonus per lumen (0.10 base, +0.02 per Lumen Optics level). */
export const perLumen = () => .1 + .02*lvl("optics");
export const lumenMult = () => 1 + perLumen()*S.lumens;
export const mult = (withBoost=true) => S.perm*lumenMult()*(withBoost&&boosted()?2:1);

/** Every 25 owned doubles that upgrade's output. */
export const tier = u => Math.pow(2, Math.floor((S.owned[u.id]||0)/25));

const baseTap = () => 1 + UPGRADES.reduce((a,u)=>a+(u.tap||0)*(S.owned[u.id]||0)*tier(u),0);
const baseSec = () => UPGRADES.reduce((a,u)=>a+(u.sec||0)*(S.owned[u.id]||0)*tier(u),0);

/** Light per tap. Storms double taps; an albatross Tailwind multiplies them by 5. */
export const perTap = () => baseTap()*mult()*(1+.25*lvl("mantle"))*lampMult()*(stormy()?2:1)*(frenzy()?5:1);
/** Light per second. `b` = include the Surge boost (offline earnings exclude it). */
export const perSec = (b=true) => baseSec()*mult(b)*(1+.25*lvl("clock"));

export const earn = n => { S.coins += n; S.lifetime += n; S.run += n; };

/** Light for guiding a ship. Night doubles it; fog and storms multiply it further.
 *  `value` is the ship class multiplier, `combo` the manual guiding combo multiplier. Harbor Dues adds +50% per level. Auto-guided ships (Clockwork Beam) pay 50% (+10% per level) but also scale with per-second income. */
export function shipBonus(auto=false, value=1, combo=1) {
  const base = auto ? Math.max(5, perTap()*3, perSec()*3)*(.5+.1*lvl("auto"))*(1+.05*perkLevel("salt")) : Math.max(5, perTap()*3)*combo;
  const weather = weatherShipMult() + (badWeather() ? .1*perkLevel("storm") : 0);
  return base*value*(1+.5*lvl("dues"))*dockMult()*(isNight()?2:1)*weather;
}
/** Guiding combo: each manual guide within COMBO_WINDOW seconds of the last adds +10%, up to x3. */
export const COMBO_WINDOW = 8;
export const comboMult = n => 1 + .1*Math.min(Math.max(0,n-1), 20);
/** Ships in the harbor at once (3, plus Shipping Lanes research). */
export const maxShips = () => 3 + lvl("lanes");
export const goldReward = () => Math.max(perSec()*60, perTap()*50)*(1+.5*lvl("charts"))*(1+.1*perkLevel("eagle"));
export const birdMult = () => (1+.5*lvl("birds"))*(1+.1*perkLevel("birder"));
export const gullReward = () => Math.max(perSec()*45, perTap()*25, 20)*birdMult();
/** Seconds between Clockwork Beam auto-guides, by level. */
export const autoCooldown = () => [0,10,8,6,4.5,3][lvl("auto")]||0;

/** Bird Lure: seconds before a bird is caught automatically, and its payout share. */
export const lureDelay = () => [0,5,4,3,2.5,2][lvl("lure")]||0;
export const lureMult = () => .5+.1*lvl("lure");
/** Golden ship chance per second. */
export const goldChance = () => (S.charter?1/45:1/90)*(1+.2*lvl("lookout"))*lookMult();

/** Offline earnings cap, in hours. */
export const offlineCapH = () => 4 + lvl("tides");

/** Total cost of buying n more of upgrade u (geometric series). */
export function costN(u, n) {
  const k = S.owned[u.id]||0;
  return Math.ceil(u.base*Math.pow(u.mult,k)*(Math.pow(u.mult,n)-1)/(u.mult-1));
}

/** How many to buy for the current x1 / x10 / max setting. */
export function qtyFor(u) {
  if (S.buyQty !== "max") return S.buyQty;
  const k = S.owned[u.id]||0, c0 = u.base*Math.pow(u.mult,k);
  return Math.max(1, Math.floor(Math.log(S.coins*(u.mult-1)/c0+1)/Math.log(u.mult)));
}

export const pendingLumens = () => Math.floor(Math.sqrt(S.run/1e5));

/* ---------- Research ---------- */
export const researchCost = r => Math.ceil(r.base*Math.pow(r.grow, lvl(r.id)));
/** Research duration; a keeper at the Observatory speeds it up. */
export const researchMs = r => Math.round(r.time*Math.pow(1.6, lvl(r.id))*1000/obsSpeed());
export const labLeft = () => S.lab ? Math.max(0, S.lab.until - Date.now()) : 0;
/** Gems to finish the current project now: 2 per started minute left. */
export const rushCost = () => { const c = Math.max(2, Math.ceil(labLeft()/60000)*2); return perkLevel("scholar") ? Math.max(1, Math.ceil(c/2)) : c; };

export const today = () => new Date().toLocaleDateString("en-CA");
export const yesterday = () => { const d = new Date(); d.setDate(d.getDate()-1); return d.toLocaleDateString("en-CA"); };
export const dailyReady = () => S.daily.last !== today();
export const unclaimed = () => ACH.filter(a=>!S.ach.includes(a.id)&&a.cur(S)>=a.goal);
