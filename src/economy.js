/* Economy: multipliers, income, costs, prestige, and daily/achievement checks. */
import { UPGRADES, ACH } from "./config.js";
import { S } from "./state.js";

export const boosted = () => Date.now() < S.boostUntil;
export const lumenMult = () => 1 + 0.1*S.lumens;
export const mult = (withBoost=true) => S.perm*lumenMult()*(withBoost&&boosted()?2:1);

/** Every 25 owned doubles that upgrade's output. */
export const tier = u => Math.pow(2, Math.floor((S.owned[u.id]||0)/25));

export const perTap = () => (1 + UPGRADES.reduce((a,u)=>a+(u.tap||0)*(S.owned[u.id]||0)*tier(u),0))*mult();
export const perSec = (b=true) => UPGRADES.reduce((a,u)=>a+(u.sec||0)*(S.owned[u.id]||0)*tier(u),0)*mult(b);

export const earn = n => { S.coins += n; S.lifetime += n; S.run += n; };

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

export const today = () => new Date().toLocaleDateString("en-CA");
export const yesterday = () => { const d = new Date(); d.setDate(d.getDate()-1); return d.toLocaleDateString("en-CA"); };
export const dailyReady = () => S.daily.last !== today();
export const unclaimed = () => ACH.filter(a=>!S.ach.includes(a.id)&&a.cur(S)>=a.goal);
