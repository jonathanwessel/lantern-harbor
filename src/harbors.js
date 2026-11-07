/* New Shores: several harbors. Each harbor keeps its own light, upgrades and light-this-run; gems,
 * lumens, research, keepers, achievements and cosmetics are shared.
 *
 * The active harbor's values live in S.coins / S.owned / S.run as before (so all existing code and
 * old saves keep working); the other harbors' values are parked in S.harbors[id]. */
import { HARBORS } from "./config.js";
import { S } from "./state.js";
import { weather } from "./world.js";

export const harborIds = () => Object.keys(HARBORS);
export const isUnlocked = id => !!HARBORS[id] && S.relights >= HARBORS[id].need;
export const unlockedCount = () => harborIds().filter(isUnlocked).length;
/** Unlocked harbors the player hasn't visited yet (drives the "new" marker on the chart button). */
export const newHarbors = () => harborIds().filter(id => isUnlocked(id) && !S.visited.includes(id));
/** Next locked harbor, if any. */
export const nextHarbor = () => harborIds().find(id => !isUnlocked(id)) || null;

/** Light earned at a harbor this run (active or parked). */
export const harborRun = id => id === S.harbor ? S.run : (S.harbors[id]?.run || 0);

export function travelTo(id) {
  if (!isUnlocked(id) || id === S.harbor) return false;
  S.harbors[S.harbor] = { coins: S.coins, owned: S.owned, run: S.run };
  const t = S.harbors[id] || { coins: 0, owned: {}, run: 0 };
  delete S.harbors[id];
  S.coins = t.coins || 0; S.owned = t.owned || {}; S.run = t.run || 0;
  S.harbor = id;
  if (!S.visited.includes(id)) S.visited.push(id);
  weather.kind = "clear";
  return true;
}
