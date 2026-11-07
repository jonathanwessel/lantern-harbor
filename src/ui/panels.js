/* Tab panels (Upgrades, Research, Keepers, Goals, Relight, Gem Shop), the save bar, and their button actions. */
import { UPGRADES, COLORS, GEMBUYS, DAILY, ACH, RESEARCH, SHIPS } from "../config.js";
import { ensureContracts, template, isDone, replaceContract, SWAP_COST } from "../contracts.js";
import { S, save, lvl, exportCode, parseCode, replaceState, backups, hydrate, validate } from "../state.js";
import { tier, perTap, perSec, earn, costN, qtyFor, pendingLumens, perLumen, today, yesterday, dailyReady,
  researchCost, researchMs, labLeft, rushCost } from "../economy.js";
import { fmt, $ } from "../util.js";
import { toast, openModal, closeModal, copyText } from "./dialogs.js";
import { sfx } from "../audio.js";
import { settings, setSetting, onSettings } from "../settings.js";
import { renderKeepers, keeperClick, keeperChange } from "./keepersPanel.js";
import { HARBORS, NETWORK_BONUS } from "../config.js";
import { isUnlocked, unlockedCount, nextHarbor, harborRun, travelTo, newHarbors } from "../harbors.js";
import { networkMult } from "../economy.js";
import { season, seasonEnds, seasonState, seasonClaimable, claimSeason } from "../seasons.js";

/** Currently selected tab id. */
export let tab = "up";

const fmtTime = ms => { const s = Math.ceil(ms/1000), h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60;
  return (h ? h+":"+String(m).padStart(2,"0") : m) + ":" + String(x).padStart(2,"0"); };
const pct = x => Math.round(x*100);

function upBtn(u) { const n = qtyFor(u), c = costN(u,n); return `☀ ${fmt(c)} <small>×${n}</small>`; }

export function renderUp() {
  const q = [1,10,"max"].map(v=>`<button data-qty="${v}" aria-pressed="${S.buyQty===v}">${v==="max"?"Max":"×"+v}</button>`).join("");
  $("p-up").innerHTML = `<div class="section-h"><span>Every 25 owned doubles that upgrade</span><div class="qty">${q}</div></div>`+
  UPGRADES.map(u=>{const own=S.owned[u.id]||0,next=(Math.floor(own/25)+1)*25;
    return `<div class="row"><div><h3>${u.name}</h3><p>${u.desc}${tier(u)>1?` <span class="ms">×${tier(u)}</span>`:""} <span class="own">· owned ${own}</span> <span class="ms">· ×2 at ${next}</span></p></div>
    <button class="buy" data-up="${u.id}">${upBtn(u)}</button></div>`}).join("");
  refreshUp();
}

/** Cheap per-tick update of upgrade buttons (cost text and enabled state). */
export function refreshUp() {
  document.querySelectorAll("[data-up]").forEach(b=>{const u=UPGRADES.find(x=>x.id===b.dataset.up);
    const h=upBtn(u);if(b.innerHTML!==h)b.innerHTML=h;b.disabled=S.coins<costN(u,qtyFor(u))});
}

/* ---------- Research ---------- */
const unlocked = r => !r.needs || r.needs(S);
const maxed = r => lvl(r.id) >= r.max;
/** True when the lab is idle and some project is affordable (drives the tab's dot). */
export const researchReady = () => !S.lab && RESEARCH.some(r=>unlocked(r)&&!maxed(r)&&S.coins>=researchCost(r));

export function renderResearch() {
  const cur = S.lab && RESEARCH.find(r=>r.id===S.lab.id);
  const active = cur ? `<div class="lab-active"><div class="top"><div><h3>${cur.name} <span class="own">Lv ${lvl(cur.id)} → ${lvl(cur.id)+1}</span></h3>
      <p>Researching… <span id="lab-time">${fmtTime(labLeft())}</span> left</p></div>
      <button class="buy gem" data-rush>Finish ◆ ${rushCost()}</button></div>
      <div class="bar"><i id="lab-bar" style="width:${pct(1-labLeft()/S.lab.ms)}%"></i></div></div>`
    : `<p class="lab-idle">The telescope is idle. Pick a project below.</p>`;
  const rows = RESEARCH.map(r=>{const l=lvl(r.id),ok=unlocked(r),mx=maxed(r);
    const label = mx ? "Complete" : !ok ? r.lock : `☀ ${fmt(researchCost(r))} <small>${fmtTime(researchMs(r))}</small>`;
    return `<div class="row ${mx?"done":""}"><div><h3>${r.name} <span class="own">Lv ${l}/${r.max}</span></h3><p>${r.desc}</p>
      <div class="pips">${"<i class=on></i>".repeat(l)}${"<i></i>".repeat(r.max-l)}</div></div>
      <button class="buy glass" data-res="${r.id}">${label}</button></div>`}).join("");
  $("p-research").innerHTML = `<div class="relight lab"><h3>Harbor Observatory</h3>
    <p>Study the sea and sky. Research is permanent: it survives a relight and keeps going while you're away. One project at a time.</p>${active}</div>
    <div class="section-h">Projects</div>${rows}`;
  refreshResearch();
}

export function refreshResearch() {
  if (S.lab) {
    const t=$("lab-time"),b=$("lab-bar"),r=document.querySelector("[data-rush]");
    if (t) t.textContent = fmtTime(labLeft());
    if (b) b.style.width = pct(1-labLeft()/S.lab.ms)+"%";
    if (r) { r.textContent = `Finish ◆ ${rushCost()}`; r.disabled = S.gems < rushCost(); }
  }
  document.querySelectorAll("[data-res]").forEach(b=>{const r=RESEARCH.find(x=>x.id===b.dataset.res);
    b.disabled = !!S.lab || maxed(r) || !unlocked(r) || S.coins < researchCost(r)});
}

/** Finish the running project if its time is up. Returns true when a level completed. */
export function checkLab() {
  if (!S.lab || Date.now() < S.lab.until) return false;
  const r = RESEARCH.find(x=>x.id===S.lab.id);
  S.lab = null;
  if (r) { S.research[r.id] = Math.min(r.max, lvl(r.id)+1); sfx("chime"); toast(`Research complete: ${r.name} Lv ${lvl(r.id)}`); }
  if (tab==="research") renderResearch();
  save();
  return true;
}

/* ---------- Goals ---------- */
const contractLight = () => Math.max(perSec()*120, perTap()*60, 50);

function contractsHtml() {
  ensureContracts();
  const cl = contractLight();
  return `<div class="section-h"><span>Harbor contracts</span><span class="own">A new one arrives as soon as you finish one</span></div>` +
    S.contracts.map((c,i)=>{const t=template(c),done=isDone(c),n=Math.min(c.n,c.goal);
      return `<div class="row contract ${done?"ready":""}"><div><h3>${t.text(c.goal)}</h3><p><span class="own">${fmt(n)} / ${fmt(c.goal)}</span> · reward ◆ ${c.gems} + ☀ ${fmt(cl)}</p>
        <div class="bar"><i style="width:${n/c.goal*100}%"></i></div></div>
        ${done?`<button class="buy gem" data-claim="${i}">Claim</button>`:`<button class="ghost sm" data-swap="${i}" ${S.gems<SWAP_COST?"disabled":""}>Swap ◆ ${SWAP_COST}</button>`}</div>`}).join("");
}

const hms = sec => { sec = Math.floor(sec); const h = Math.floor(sec/3600), m = Math.floor(sec%3600/60); return h ? `${h}h ${m}m` : `${m}m`; };

function logbookHtml() {
  const lv = Object.values(S.research).reduce((a,b)=>a+b,0);
  const cells = [
    ["Light, all time", fmt(S.lifetime)], ["Time played", hms(S.playTime)], ["Lamp taps", fmt(S.taps)],
    ["Ships guided", fmt(S.ships)], ["Best combo", S.bestCombo], ["Golden ships", S.golden],
    ["Birds caught", S.birds], ["Skuas downed", S.skuas], ["Raids repelled", S.raids], ["Contracts done", S.contractsDone], ["Seasons finished", S.seasonsDone], ["Research levels", lv],
    ["Relights", S.relights], ["Keepers", S.keepers.length], ["Harbors", `${unlockedCount()} / ${Object.keys(HARBORS).length}`], ["Achievements", `${S.ach.length} / ${ACH.length}`],
  ];
  const fleet = Object.entries(SHIPS).filter(([k])=>S.shipsBy[k]).map(([k,c])=>`${c.name} ${fmt(S.shipsBy[k])}`).join(" · ");
  return `<div class="section-h">Keeper's logbook</div><div class="logbook">${cells.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>
    ${fleet?`<p class="fleet">${fleet}</p>`:""}`;
}

function seasonHtml() {
  const se = season(), st = seasonState(), left = Math.max(0, seasonEnds() - Date.now());
  const dd = Math.floor(left/864e5), hh = Math.floor(left%864e5/36e5), mm = Math.floor(left%36e5/6e4);
  const beam = COLORS.find(c => c.id === se.color);
  const tasks = se.tasks.map(t => { const n = Math.min(st.prog[t.kind]||0, t.goal);
    return `<div class="stask"><span>${t.text}</span><span class="own">${fmt(n)} / ${fmt(t.goal)}</span><div class="bar"><i style="width:${n/t.goal*100}%"></i></div></div>`; }).join("");
  const btn = st.claimed ? `<button class="buy gem" disabled>Claimed</button>`
    : `<button class="buy gem" data-season ${seasonClaimable()?"":"disabled"}>◆ ${se.gems} + beam</button>`;
  return `<div class="season s-${se.id}"><div class="top"><div><span class="s-label">This week's season</span><h3>${se.name}</h3>
      <p>${se.blurb} <span class="own">Ends in ${dd?dd+"d ":""}${hh}h ${dd?"":mm+"m"}</span></p></div>${btn}</div>
    <span class="rules">${se.rules.map(r=>`<i>${r}</i>`).join("")}</span>
    <div class="stasks">${tasks}</div>
    <p class="s-reward"><span class="swatch" style="background:${beam.hex}"></span>Reward: the <b>${beam.name}</b> beam (yours to keep) and ◆ ${se.gems}. Progress resets when the season changes.</p></div>`;
}

export function renderGoals() {
  const ready=dailyReady(),streak=S.daily.last===today()||S.daily.last===yesterday()?S.daily.streak:0;
  const idx=ready?streak%7:(streak-1+7)%7;
  const days=DAILY.map((g,i)=>{const got=ready?i<idx:i<=idx;const now=ready&&i===idx;
    return `<div class="day ${now?"now":got?"got":""}"><span>Day ${i+1}</span>◆${g}</div>`}).join("");
  const ach=ACH.map(a=>{const done=S.ach.includes(a.id),c=Math.min(a.cur(S),a.goal),ok=c>=a.goal;
    return `<div class="row ${done?"done":""}"><div><h3>${a.name}</h3><p>${a.desc} <span class="own">· ${fmt(c)} / ${fmt(a.goal)}</span></p>${done?"":`<div class="bar"><i style="width:${c/a.goal*100}%"></i></div>`}</div>
    <button class="buy gem" data-ach="${a.id}" ${done||!ok?"disabled":""}>${done?"Claimed":"◆ "+a.gems}</button></div>`}).join("");
  $("p-goals").innerHTML=`${seasonHtml()}<div class="daily"><div class="top"><div><h3>Daily keeper's ration</h3><p>Come back each day. Miss a day and the streak resets. Current streak: ${streak} day${streak===1?"":"s"}.</p></div>
    <button class="buy gem" data-daily ${ready?"":"disabled"}>${ready?"Claim ◆ "+DAILY[idx]:"Back tomorrow"}</button></div><div class="days">${days}</div></div>
    ${contractsHtml()}
    <div class="section-h">Achievements</div>${ach}${logbookHtml()}`;
}

/* ---------- Relight ---------- */
export function renderRelight() {
  const p=pendingLumens(),per=perLumen();
  $("p-relight").innerHTML=`<div class="relight"><h3>Relight the lamp</h3>
  <p>Douse the lamp and start the night over. You lose this harbor's light and upgrades, but you keep gems, beam colors, research, keepers, and achievements, and you earn lumens. Each lumen permanently adds ${pct(per)}% to all light you earn.</p>
  <div class="nums"><div class="num"><span>Light this run</span><b id="r-run">${fmt(S.run)}</b></div><div class="num"><span>Lumens if you relight</span><b>+${p}</b></div><div class="num"><span>Current bonus</span><b>+${pct(S.lumens*per)}%</b></div></div>
  <p>${p<1?`You need 100K light this run to earn your first lumen.`:`After relighting, your bonus becomes +${pct((S.lumens+p)*per)}%.`}</p>
  ${(()=>{const n=nextHarbor();if(!n)return"";const left=HARBORS[n].need-S.relights;return `<p class="discover">Relight ${left} more time${left>1?"s":""} to discover <b>${HARBORS[n].name}</b>.</p>`})()}
  <div><button class="buy glass" data-relight ${p<1?"disabled":""}>Relight for ✦ ${p}</button></div></div>`;
}

/* ---------- Shop ----------
 * Lantern Harbor is free to play: gems are only ever earned in the game. */
const EARN = [
  ["Daily keeper's ration", "◆ 5–30 a day, more for a streak", "goals"],
  ["Achievements", "◆ 5–40 each", "goals"],
  ["Harbor contracts", "◆ 2–4 each, always three on offer", "goals"],
  ["Seasonal challenges", "◆ 30 and a beam color each week", "goals"],
  ["Golden ships", "◆ 1 each, tap them fast", null],
  ["Ghost ships", "◆ 1 each, only at night", null],
  ["Storm petrels and skuas", "◆ 1 from petrels in storms, sometimes from skuas, and for every raid repelled", null],
];

export function renderShop() {
  const left = ACH.filter(a=>!S.ach.includes(a.id)).length;
  const earn = EARN.map(([name, how, tab]) => `<div class="row"><div><h3>${name}</h3><p>${how}${name==="Achievements"?` <span class="own">· ${left} left to earn</span>`:""}</p></div>
    ${tab ? `<button class="ghost sm" data-goto="${tab}">Goals</button>` : ""}</div>`).join("");
  const spend=GEMBUYS.filter(g=>!(g.once&&S[g.id])).map(g=>`<div class="row"><div><h3>${g.name}</h3><p>${g.desc}</p></div>
    <button class="buy gem" data-gb="${g.id}" ${S.gems<g.cost?"disabled":""}>◆ ${g.cost}</button></div>`).join("");
  const cols=COLORS.map(c=>{const own=S.colors.includes(c.id),on=S.color===c.id,se=c.season&&!own;
    return `<div class="row ${se?"done":""}"><div><h3><span class="swatch" style="background:${c.hex}"></span>${c.name}</h3><p>${c.season?`Seasonal beam, earned in ${({spring:"Spring Migration",summer:"Summer Regatta",autumn:"Autumn Gales",winter:"Winter Ice"})[c.season]}`:"Beam color, cosmetic only"}</p></div>
    <button class="buy ${own||se?"":"gem"}" data-col="${c.id}" ${on||se||(!own&&S.gems<c.cost)?"disabled":""}>${on?"Equipped":own?"Equip":se?"Season reward":"◆ "+c.cost}</button></div>`}).join("");
  $("p-shop").innerHTML=`<p class="free">Lantern Harbor is free. Every gem is earned by playing.</p>
    <div class="section-h">Spend gems</div>${spend}<div class="section-h">Beam colors</div>${cols}<div class="section-h">Earn gems</div>${earn}`;
}

const RENDER = {up:renderUp, research:renderResearch, keepers:renderKeepers, goals:renderGoals, relight:renderRelight, shop:renderShop};

/** Re-render the currently visible panel. */
export function renderAll() { RENDER[tab](); }

/* ---------- Save tools ---------- */
const summary = s => `☀ ${fmt(s.coins||0)} light · ◆ ${s.gems||0} gems · ✦ ${s.lumens||0} lumens · ${s.ships||0} ships`;

function confirmReplace(s, title) {
  openModal({title, body:`This replaces the game in this browser.\n\nNow: ${summary(S)}\nIncoming: ${summary(s)}\n\nYour current game is backed up first, so you can undo this from Backups.`,
    yes:"Replace", cls:"glass", cb:()=>{ replaceState(s); renderAll(); toast("Save loaded"); }});
}

function exportSave() {
  openModal({title:"Export save", body:"Copy this code, then use Import save in another browser or device to continue there.",
    field:{value:exportCode(), readonly:true}, yes:"Copy code", cls:"glass", no:"Close",
    cb:async v=>{ toast(await copyText(v) ? "Save code copied" : "Couldn't copy. Select the code and copy it by hand."); }});
}

function importSave() {
  openModal({title:"Import save", body:"Paste a save code from Export save.", field:{placeholder:"LH2.…"}, yes:"Import", cls:"glass",
    cb:v=>{ let s; try { s = parseCode(v); } catch (e) { toast("Import failed: "+e.message, 3600); return; } confirmReplace(s, "Load this save?"); }});
}

function showBackups() {
  const list = backups();
  const html = list.length ? `Automatic snapshots of this browser's save, newest first.<br><br>` + list.map((b,i)=>{
      let s; try { s = hydrate(JSON.parse(b.data)); } catch (e) { return ""; }
      return `<span class="bk"><span>${new Date(b.t).toLocaleString()} · ${b.why}<br><small>${summary(s)}</small></span><button class="ghost sm" data-restore="${i}">Restore</button></span>`;
    }).join("") : "No backups yet. One is taken every time the game loads, and every hour while you play.";
  openModal({title:"Backups", html, yes:null, no:"Close"});
}

/* ---------- Sea chart (travel between harbors) ---------- */
function showChart() {
  const rows = Object.entries(HARBORS).map(([id,h]) => {
    const here = id === S.harbor, open = isUnlocked(id), left = h.need - S.relights;
    const btn = here ? `<span class="here">You are here</span>` : open ? `<button class="buy glass" data-travel="${id}">Sail here</button>` : `<span class="locked">Relight ${left} more time${left>1?"s":""}</span>`;
    return `<span class="harbor ${here?"current":""} ${open?"":"locked-h"}"><span class="hh"><b>${h.name}</b>${btn}</span>
      <small>${open ? h.blurb : "Uncharted waters."}</small>
      ${open ? `<span class="rules">${h.rules.map(r=>`<i>${r}</i>`).join("")}</span>${!here&&harborRun(id)?`<small>Light this run here: ☀ ${fmt(harborRun(id))}</small>`:""}` : ""}</span>`;
  }).join("");
  openModal({title:"Sea chart", html:`Each harbor keeps its own light and upgrades. Gems, lumens, research, keepers and achievements go with you. Only the harbor you're at earns light.<br>
    <b>Harbor network:</b> +${Math.round(NETWORK_BONUS*100)}% to all light for each harbor discovered (now ×${networkMult().toFixed(1)}).
    <span class="chart">${rows}</span>`, yes:null, no:"Close"});
}

/* ---------- Settings ---------- */
const check = k => `<input type="checkbox" data-set="${k}" ${settings[k]?"checked":""}>`;
const slider = k => `<input type="range" min="0" max="1" step="0.05" data-set="${k}" value="${settings[k]}">`;

function showSettings() {
  const nums = [["short","1.23M"],["sci","1.23e6"],["full","1,234,567"]].map(([v,l])=>`<option value="${v}" ${settings.numbers===v?"selected":""}>${l}</option>`).join("");
  const html = `<span class="settings">
    <label class="set"><span>Sound</span>${check("sound")}</label>
    <label class="set"><span>Ambience <small>waves, wind, foghorn</small></span>${slider("ambience")}</label>
    <label class="set"><span>Effects <small>taps, ships, birds</small></span>${slider("effects")}</label>
    <label class="set"><span>Vibration <small>phones only</small></span>${check("haptics")}</label>
    <label class="set"><span>Reduce motion <small>fewer particles, no lightning flash</small></span>${check("reduceMotion")}</label>
    <label class="set"><span>Numbers</span><select data-set="numbers">${nums}</select></label>
    <small class="set-note">Settings are saved on this device and aren't included in Export save.</small></span>`;
  openModal({title:"Settings", html, yes:null, no:"Done"});
}

function onSetting(e) {
  if (e.type === "change" && keeperChange(e)) return;
  const el = e.target.closest("[data-set]"); if (!el) return;
  const k = el.dataset.set, v = el.type === "checkbox" ? el.checked : el.type === "range" ? +el.value : el.value;
  setSetting(k, v);
  if (k === "effects") sfx("tap");
}

const soundLabel = () => { const b = document.querySelector("[data-sound]"); if (b) { b.textContent = settings.sound ? "Sound on" : "Sound off"; b.setAttribute("aria-pressed", settings.sound); } };

function onClick(e) {
  const b=e.target.closest("button");if(!b||b.disabled)return;const d=b.dataset;
  if(keeperClick(d))return;
  if(d.qty){S.buyQty=d.qty==="max"?"max":+d.qty;renderUp();save()}
  if(d.up){const u=UPGRADES.find(x=>x.id===d.up),n=qtyFor(u),c=costN(u,n);if(S.coins>=c){S.coins-=c;S.owned[u.id]=(S.owned[u.id]||0)+n;sfx("buy");renderUp();save()}}
  if(d.res){const r=RESEARCH.find(x=>x.id===d.res),c=researchCost(r);
    if(!S.lab&&unlocked(r)&&!maxed(r)&&S.coins>=c){S.coins-=c;const ms=researchMs(r);S.lab={id:r.id,until:Date.now()+ms,ms};sfx("buy");renderResearch();save()}}
  if("rush" in d&&S.lab){const c=rushCost();if(S.gems>=c){S.gems-=c;S.lab.until=Date.now();checkLab()}}
  if("daily" in d&&dailyReady()){const streak=S.daily.last===yesterday()?S.daily.streak+1:1;const g=DAILY[(streak-1)%7];
    S.daily={last:today(),streak};S.gems+=g;sfx("chime");toast(`Day ${streak} ration: ◆ ${g}`);renderGoals();save()}
  if("season" in d){if(claimSeason()){sfx("chime");toast(`${season().name} complete! ◆ ${season().gems} and the ${COLORS.find(c=>c.id===season().color).name} beam`);renderGoals();save()}}
  if(d.claim){const i=+d.claim,c=S.contracts[i];if(c&&isDone(c)){const l=contractLight();S.gems+=c.gems;earn(l);S.contractsDone++;sfx("chime");
    toast(`Contract done: ◆ ${c.gems} + ☀ ${fmt(l)}`);replaceContract(i);renderGoals();save()}}
  if(d.swap){const i=+d.swap;if(S.contracts[i]&&S.gems>=SWAP_COST){S.gems-=SWAP_COST;replaceContract(i);renderGoals();save()}}
  if(d.ach){const a=ACH.find(x=>x.id===d.ach);if(a&&!S.ach.includes(a.id)&&a.cur(S)>=a.goal){S.ach.push(a.id);S.gems+=a.gems;sfx("chime");toast(`${a.name}: ◆ ${a.gems}`);renderGoals();save()}}
  if("relight" in d){const p=pendingLumens();if(p<1)return;
    openModal({title:"Relight the lamp?",body:`You'll reset your light and upgrades and gain ${p} lumen${p>1?"s":""}, a permanent +${pct(p*perLumen())}% to all light. Gems, colors, research, and keepers stay.`,yes:"Relight",cls:"glass",cb:()=>{
      const had=unlockedCount();S.lumens+=p;S.relights++;S.coins=0;S.run=0;S.owned={};sfx("relight");toast(`Relit. Bonus is now +${pct(S.lumens*perLumen())}%`);
      if(unlockedCount()>had){const id=newHarbors()[0];if(id)setTimeout(()=>{toast(`New harbor discovered: ${HARBORS[id].name}! Open the sea chart to sail there.`,5000);sfx("chime")},2600)}
      renderAll();save()}})}
  if(d.goto){const t=document.querySelector(`.tab[data-tab="${d.goto}"]`);if(t){t.click();t.scrollIntoView({block:"nearest"})}}
  if(d.gb){const g=GEMBUYS.find(x=>x.id===d.gb);if(S.gems<g.cost)return;S.gems-=g.cost;sfx("buy");
    if(g.id==="boost"){S.boostUntil=Math.max(Date.now(),S.boostUntil)+600000;toast("Surge active: 2x light")}
    if(g.id==="skip"){const amt=perSec()*7200||perTap()*500;earn(amt);toast("Collected ☀ "+fmt(amt))}
    if(g.id==="charter"){S.charter=true;toast("Golden Charter signed")}
    renderShop();save()}
  if(d.col){const c=COLORS.find(x=>x.id===d.col);
    if(c.season&&!S.colors.includes(c.id))return;
    if(!S.colors.includes(c.id)){if(S.gems<c.cost)return;S.gems-=c.cost;S.colors.push(c.id)}
    S.color=c.id;sfx("buy");renderShop();save()}
  if("settings" in d)showSettings();
  if("chart" in d)showChart();
  if(d.travel){closeModal();if(travelTo(d.travel)){sfx("chime");toast(`You sail to ${HARBORS[d.travel].name}.`);document.body.dataset.harbor=S.harbor;renderAll();save()}}
  if("sound" in d)setSetting("sound",!settings.sound);
  if("export" in d)exportSave();
  if("import" in d)importSave();
  if("backups" in d)showBackups();
  if(d.restore){const bk=backups()[+d.restore];if(!bk)return;closeModal();
    let s;try{s=validate(JSON.parse(bk.data))}catch(err){toast("That backup is damaged");return}
    confirmReplace(s,"Restore this backup?")}
}

export function initPanels() {
  document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{tab=t.dataset.tab;
    document.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected",x===t));
    Object.keys(RENDER).forEach(k=>$("p-"+k).hidden=k!==tab);renderAll()});
  document.addEventListener("click", onClick);
  document.addEventListener("input", onSetting);
  document.addEventListener("change", onSetting);
  onSettings(k => { if (k === "sound") soundLabel(); if (k === "numbers") renderAll(); });
  soundLabel();
}
