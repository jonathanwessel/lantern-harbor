/* Keepers tab: the four posts, the roster, and hiring. */
import { POSTS, TRAITS } from "../config.js";
import { S, save } from "../state.js";
import { hireCost, keeperAt, levelOf, nextLevelXp, prevLevelXp, atHome, postPower, ensureCandidates, hire, reroll, assign,
  MAX_KEEPERS, REROLL_COST } from "../keepers.js";
import { fmt, $ } from "../util.js";
import { toast } from "./dialogs.js";
import { sfx } from "../audio.js";

const pct = x => Math.round(x*100);

/** What a post currently gives, as text. */
function postEffect(post) {
  const p = postPower(post.id);
  if (!p) return "Empty";
  return post.id === "lamp" ? `+${pct(.1*p)}% light per tap`
    : post.id === "dock" ? `+${pct(.1*p)}% light per guided ship`
    : post.id === "obs" ? `research ${pct(.05*p)}% faster`
    : `golden ships and birds ${pct(.04*p)}% more often`;
}

const traitLine = k => { const t = TRAITS[k.trait]; return `${t.name} <span class="own">· home: ${POSTS.find(p=>p.id===t.home).name}</span>`; };

function postSelect(k) {
  const opts = [["","Off duty"], ...POSTS.map(p => [p.id, p.name + (keeperAt(p.id) && keeperAt(p.id) !== k ? ` (swap with ${keeperAt(p.id).name.split(" ")[0]})` : "")])];
  return `<select class="post-sel" data-assign="${k.id}" aria-label="Post for ${k.name}">${opts.map(([v,l]) => `<option value="${v}" ${(k.post||"")===v?"selected":""}>${l}</option>`).join("")}</select>`;
}

export const keepersReady = () =>
  (S.keepers.length < MAX_KEEPERS && S.coins >= hireCost()) ||
  (POSTS.some(p => !keeperAt(p.id)) && S.keepers.some(k => !k.post));

export function renderKeepers() {
  ensureCandidates();
  const posts = POSTS.map(p => { const k = keeperAt(p.id);
    return `<div class="post ${k?"":"empty"}"><span>${p.name}</span><b>${k ? k.name : "No keeper"}</b>
      <small>${k ? `Lv ${levelOf(k)}${atHome(k)?" · home ×1.5":""} · ` : ""}${postEffect(p)}</small></div>`; }).join("");
  const roster = S.keepers.map(k => { const l = levelOf(k), lo = prevLevelXp(k), hi = nextLevelXp(k), home = atHome(k);
    return `<div class="row keeper ${k.post?"":"idle"}"><div><h3>${k.name} <span class="own">Lv ${l}${l>=10?" (max)":""}</span></h3>
      <p>${traitLine(k)}<br><span class="${home?"perk on":"perk"}">${TRAITS[k.trait].perk}${home?"":" (at home post only)"}</span></p>
      ${l<10?`<div class="bar"><i data-kxp="${k.id}" style="width:${pct(Math.min(1,(k.xp-lo)/(hi-lo)))}%"></i></div>`:""}</div>
      ${postSelect(k)}</div>`; }).join("");
  const full = S.keepers.length >= MAX_KEEPERS, cost = hireCost();
  const cands = full ? `<p class="lab-idle">Your crew is full (${MAX_KEEPERS} keepers).</p>` : S.candidates.map((c,i) => { const t = TRAITS[c.trait];
    return `<div class="row"><div><h3>${c.name}</h3><p>${t.name} <span class="own">· home: ${POSTS.find(p=>p.id===t.home).name}</span><br>${t.perk}</p></div>
      <button class="buy" data-hire="${i}">☀ ${fmt(cost)}</button></div>`; }).join("");
  $("p-keepers").innerHTML = `<div class="relight"><h3>Keepers</h3>
    <p>Hire keepers and give each a post. They level up the longer they serve, even while you're away, and stay with you when you relight. At their trait's home post a keeper works ×1.5 and adds a perk.</p>
    <div class="posts">${posts}</div></div>
    ${S.keepers.length ? `<div class="section-h">Your crew <span class="own">${S.keepers.length} / ${MAX_KEEPERS}</span></div>${roster}` : ""}
    <div class="section-h"><span>Hire</span>${full ? "" : `<button class="ghost sm" data-reroll ${S.gems<REROLL_COST?"disabled":""}>New faces ◆ ${REROLL_COST}</button>`}</div>${cands}`;
  refreshKeepers();
}

/** Cheap per-tick update: hire buttons and XP bars. */
export function refreshKeepers() {
  const cost = hireCost();
  document.querySelectorAll("[data-hire]").forEach(b => b.disabled = S.coins < cost || S.keepers.length >= MAX_KEEPERS);
  document.querySelectorAll("[data-kxp]").forEach(i => { const k = S.keepers.find(x => x.id === i.dataset.kxp); if (!k) return;
    const lo = prevLevelXp(k), hi = nextLevelXp(k); i.style.width = pct(Math.min(1,(k.xp-lo)/(hi-lo))) + "%"; });
  const r = document.querySelector("[data-reroll]"); if (r) r.disabled = S.gems < REROLL_COST;
}

/** Button clicks on this tab. Returns true if handled. */
export function keeperClick(d) {
  if (d.hire !== undefined) {
    const cost = hireCost();
    if (S.coins < cost || S.keepers.length >= MAX_KEEPERS) return true;
    S.coins -= cost; const k = hire(+d.hire);
    if (k) { sfx("chime"); toast(k.post ? `${k.name} joins the crew at the ${POSTS.find(p=>p.id===k.post).name}` : `${k.name} joins the crew. Give them a post.`); }
    renderKeepers(); save(); return true;
  }
  if ("reroll" in d) { if (S.gems >= REROLL_COST) { S.gems -= REROLL_COST; reroll(); sfx("buy"); renderKeepers(); save(); } return true; }
  return false;
}

/** Post dropdown changes. */
export function keeperChange(e) {
  const sel = e.target.closest("[data-assign]"); if (!sel) return false;
  assign(sel.dataset.assign, sel.value); sfx("buy"); renderKeepers(); save(); return true;
}
