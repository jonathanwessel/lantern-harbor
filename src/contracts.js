/* Harbor Contracts: three rotating short goals. Game events call track(); finished contracts are
 * claimed from the Goals tab and immediately replaced by a new one. */
import { CONTRACTS } from "./config.js";
import { S } from "./state.js";

export const SLOTS = 3;
export const SWAP_COST = 2;

function make(exclude) {
  const pool = CONTRACTS.filter(c => !exclude.includes(c.kind));
  const t = pool[Math.random()*pool.length|0];
  let goal = t.goal[0] + Math.floor(Math.random()*(t.goal[1]-t.goal[0]+1));
  if (t.round) goal = Math.max(t.round, Math.round(goal/t.round)*t.round);
  return { kind:t.kind, goal, n:0, gems:t.gems };
}

/** Top up to SLOTS contracts, dropping any whose template no longer exists. */
export function ensureContracts() {
  S.contracts = S.contracts.filter(c => c && CONTRACTS.some(t => t.kind === c.kind));
  while (S.contracts.length < SLOTS) S.contracts.push(make(S.contracts.map(c => c.kind)));
}

export const template = c => CONTRACTS.find(t => t.kind === c.kind);
export const isDone = c => c.n >= c.goal;
export const contractsReady = () => S.contracts.some(isDone);

/** Record progress. For "max" contracts (combo) `v` is the value reached, otherwise an amount. */
export function track(kind, v=1) {
  for (const c of S.contracts) if (c.kind === kind && !isDone(c)) c.n = template(c)?.max ? Math.max(c.n, v) : c.n + v;
}

/** Replace contract i with a fresh one of a different kind. */
export function replaceContract(i) {
  const others = S.contracts.map(c => c.kind);
  S.contracts[i] = make(others);
}
