/* Seasons: a new season every real week, the same for every player, rotating
 * Spring Migration -> Summer Regatta -> Autumn Gales -> Winter Ice. Each season changes the rules
 * and look of every harbor and has three challenges; finishing them earns a seasonal beam color
 * (kept forever) and gems. Challenge progress resets when the season changes. */
import { SEASONS } from "./config.js";
import { S } from "./state.js";

const WEEK = 7*864e5;
const EPOCH = Date.UTC(2026, 0, 5);   // a Monday
const OFFSET = 3;                     // so the week of 2026-11-02 is Autumn Gales

/** Default rule values; each season overrides some of them. */
const BASE = { birds:1, birdPay:1, lanes:0, clipper:1, combo:0, weather:1, gale:0, night:2, ghost:1, goldPay:1, raids:1 };

let override = null;                  // for testing: force a season id
export const forceSeason = id => { override = id; };

export const weekIndex = (now=Date.now()) => Math.floor((now - EPOCH)/WEEK);
export function season(now=Date.now()) {
  if (override) return SEASONS.find(s => s.id === override) || SEASONS[0];
  return SEASONS[(((weekIndex(now) + OFFSET) % 4) + 4) % 4];
}
export const seasonEnds = () => EPOCH + (weekIndex()+1)*WEEK;
export const smod = () => ({ ...BASE, ...season().mods });

const keyNow = () => `${weekIndex()}-${season().id}`;
const complete = (st, def) => def.tasks.every(t => (st.prog[t.kind]||0) >= t.goal);

let notice = null;
/** A message about last season's reward being granted at rollover, read once by the main loop. */
export const takeNotice = () => { const n = notice; notice = null; return n; };

function grant(def) {
  S.gems += def.gems;
  if (!S.colors.includes(def.color)) S.colors.push(def.color);
  S.seasonsDone++;
}

/** This week's progress. Rolls over (and settles last season) when the week changes. */
export function seasonState() {
  const k = keyNow();
  if (!S.season || S.season.key !== k) {
    if (S.season && !S.season.claimed) {
      const def = SEASONS.find(s => s.id === String(S.season.key).split("-").slice(1).join("-"));
      if (def && complete(S.season, def)) { grant(def); notice = `${def.name} is over. Its reward was added: ◆ ${def.gems} and a new beam color.`; }
    }
    S.season = { key: k, prog: {}, claimed: false };
  }
  return S.season;
}

export function seasonTrack(kind, v=1) {
  const def = season(), t = def.tasks.find(t => t.kind === kind); if (!t) return;
  const st = seasonState();
  st.prog[kind] = t.max ? Math.max(st.prog[kind]||0, v) : (st.prog[kind]||0) + v;
}

export const seasonComplete = () => complete(seasonState(), season());
export const seasonClaimable = () => seasonComplete() && !seasonState().claimed;
export function claimSeason() {
  if (!seasonClaimable()) return false;
  grant(season()); seasonState().claimed = true; return true;
}
