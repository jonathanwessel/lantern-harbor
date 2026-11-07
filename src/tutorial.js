/* First-run tutorial: a few short tips over the harbor for brand-new keepers.
 * Saves from before v1.0 (anyone who has already played) skip it; see hydrate() in state.js. */
import { S, save } from "./state.js";
import { $ } from "./util.js";

export const DONE = 99;
const STEPS = [
  { text: "Tap the lighthouse to make light.", done: () => S.taps >= 5 },
  { text: "Ships need guiding! Tap a ship as it sails past for bonus light.", done: () => S.ships >= 1 },
  { text: "Open Upgrades in the dock and buy one. A Night Keeper earns light even while you're away.", done: () => Object.values(S.owned).some(n => n > 0) },
  { text: "That's the basics, keeper. Research, contracts, keepers and new harbors open up as you play.", done: () => false, timeout: 9000 },
];

let shownAt = 0, shownStep = -1;

function finish() { S.tutorial = DONE; $("coach").hidden = true; save(); }

/** Called a few times a second from the main loop. */
export function tickTutorial() {
  const el = $("coach");
  if (S.tutorial >= STEPS.length) { if (!el.hidden) el.hidden = true; return; }
  const step = STEPS[S.tutorial];
  if (shownStep !== S.tutorial) { shownStep = S.tutorial; shownAt = Date.now(); $("coach-text").textContent = step.text; el.hidden = false; }
  const shown = Date.now() - shownAt;
  // every tip stays up at least 3s, even if its goal was already met (taps also guide ships)
  if ((step.done() && shown > 3000) || (step.timeout && shown > step.timeout)) {
    S.tutorial++;
    if (S.tutorial >= STEPS.length) finish(); else save();
  }
}

export function initTutorial() {
  $("coach-skip").onclick = finish;
}
