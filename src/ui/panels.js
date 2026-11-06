/* Tab panels (Upgrades, Goals, Relight, Gem Shop, Revenue) and their button actions. */
import { UPGRADES, COLORS, PACKS, GEMBUYS, DAILY, ACH } from "../config.js";
import { S, save } from "../state.js";
import { tier, perTap, perSec, earn, costN, qtyFor, pendingLumens, today, yesterday, dailyReady } from "../economy.js";
import { fmt, $ } from "../util.js";
import { toast, openModal } from "./dialogs.js";

/** Currently selected tab id. */
export let tab = "up";

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

export function renderGoals() {
  const ready=dailyReady(),streak=S.daily.last===today()||S.daily.last===yesterday()?S.daily.streak:0;
  const idx=ready?streak%7:(streak-1+7)%7;
  const days=DAILY.map((g,i)=>{const got=ready?i<idx:i<=idx;const now=ready&&i===idx;
    return `<div class="day ${now?"now":got?"got":""}"><span>Day ${i+1}</span>◆${g}</div>`}).join("");
  const ach=ACH.map(a=>{const done=S.ach.includes(a.id),c=Math.min(a.cur(S),a.goal),ok=c>=a.goal;
    return `<div class="row ${done?"done":""}"><div><h3>${a.name}</h3><p>${a.desc} <span class="own">· ${fmt(c)} / ${fmt(a.goal)}</span></p>${done?"":`<div class="bar"><i style="width:${c/a.goal*100}%"></i></div>`}</div>
    <button class="buy gem" data-ach="${a.id}" ${done||!ok?"disabled":""}>${done?"Claimed":"◆ "+a.gems}</button></div>`}).join("");
  $("p-goals").innerHTML=`<div class="daily"><div class="top"><div><h3>Daily keeper's ration</h3><p>Come back each day. Miss a day and the streak resets. Current streak: ${streak} day${streak===1?"":"s"}.</p></div>
    <button class="buy gem" data-daily ${ready?"":"disabled"}>${ready?"Claim ◆ "+DAILY[idx]:"Back tomorrow"}</button></div><div class="days">${days}</div></div>
    <div class="section-h">Achievements</div>${ach}`;
}

export function renderRelight() {
  const p=pendingLumens();
  $("p-relight").innerHTML=`<div class="relight"><h3>Relight the lamp</h3>
  <p>Douse the lamp and start the night over. You lose your light and upgrades, but you keep gems, beam colors, purchases, and achievements, and you earn lumens. Each lumen permanently adds 10% to all light you earn.</p>
  <div class="nums"><div class="num"><span>Light this run</span><b id="r-run">${fmt(S.run)}</b></div><div class="num"><span>Lumens if you relight</span><b>+${p}</b></div><div class="num"><span>Current bonus</span><b>+${Math.round(S.lumens*10)}%</b></div></div>
  <p>${p<1?`You need 100K light this run to earn your first lumen.`:`After relighting, your bonus becomes +${Math.round((S.lumens+p)*10)}%.`}</p>
  <div><button class="buy glass" data-relight ${p<1?"disabled":""}>Relight for ✦ ${p}</button></div></div>`;
}

export function renderShop() {
  const packs=PACKS.filter(p=>!(p.once&&S.starter)).map(p=>`<div class="row"><div><h3>${p.name}${p.tag?` <span class="own">${p.tag}</span>`:""}</h3><p>${p.desc||`◆ ${p.gems} gems`}</p></div>
    <button class="buy cash" data-pack="${p.id}">$${p.usd.toFixed(2)}</button></div>`).join("");
  const spend=GEMBUYS.filter(g=>!(g.once&&S[g.id])).map(g=>`<div class="row"><div><h3>${g.name}</h3><p>${g.desc}</p></div>
    <button class="buy gem" data-gb="${g.id}" ${S.gems<g.cost?"disabled":""}>◆ ${g.cost}</button></div>`).join("");
  const cols=COLORS.map(c=>{const own=S.colors.includes(c.id),on=S.color===c.id;
    return `<div class="row"><div><h3><span class="swatch" style="background:${c.hex}"></span>${c.name}</h3><p>Beam color, cosmetic only</p></div>
    <button class="buy ${own?"":"gem"}" data-col="${c.id}" ${on||(!own&&S.gems<c.cost)?"disabled":""}>${on?"Equipped":own?"Equip":"◆ "+c.cost}</button></div>`}).join("");
  $("p-shop").innerHTML=`<div class="section-h">Get gems</div>${packs}<div class="section-h">Spend gems</div>${spend}<div class="section-h">Beam colors</div>${cols}`;
}

export function renderRev() {
  const n=S.purchases.length;
  $("p-rev").innerHTML=`<div class="ledger">Simulated purchases this player: <b>${n}</b><br>Gross: <b>$${S.spent.toFixed(2)}</b><br>Your cut after a 30% store fee: <b>$${(S.spent*.7).toFixed(2)}</b> (at the 15% small-developer rate: $${(S.spent*.85).toFixed(2)})<br><br>
  ${n?S.purchases.slice(-8).reverse().map(p=>`${new Date(p.t).toLocaleTimeString()} · ${p.name} · $${p.usd.toFixed(2)}`).join("<br>"):"No purchases yet. Try the Gem Shop tab."}</div>`;
}

const RENDER = {up:renderUp, goals:renderGoals, relight:renderRelight, shop:renderShop, rev:renderRev};

/** Re-render the currently visible panel. */
export function renderAll() { RENDER[tab](); }

function onClick(e) {
  const b=e.target.closest("button");if(!b||b.disabled)return;const d=b.dataset;
  if(d.qty){S.buyQty=d.qty==="max"?"max":+d.qty;renderUp();save()}
  if(d.up){const u=UPGRADES.find(x=>x.id===d.up),n=qtyFor(u),c=costN(u,n);if(S.coins>=c){S.coins-=c;S.owned[u.id]=(S.owned[u.id]||0)+n;renderUp();save()}}
  if("daily" in d&&dailyReady()){const streak=S.daily.last===yesterday()?S.daily.streak+1:1;const g=DAILY[(streak-1)%7];
    S.daily={last:today(),streak};S.gems+=g;toast(`Day ${streak} ration: ◆ ${g}`);renderGoals();save()}
  if(d.ach){const a=ACH.find(x=>x.id===d.ach);if(a&&!S.ach.includes(a.id)&&a.cur(S)>=a.goal){S.ach.push(a.id);S.gems+=a.gems;toast(`${a.name}: ◆ ${a.gems}`);renderGoals();save()}}
  if("relight" in d){const p=pendingLumens();if(p<1)return;
    openModal({title:"Relight the lamp?",body:`You'll reset your light and upgrades and gain ${p} lumen${p>1?"s":""}, a permanent +${p*10}% to all light. Gems, colors, and purchases stay.`,yes:"Relight",cls:"glass",cb:()=>{
      S.lumens+=p;S.relights++;S.coins=0;S.run=0;S.owned={};toast(`Relit. Bonus is now +${Math.round(S.lumens*10)}%`);renderAll();save()}})}
  if(d.pack){const p=PACKS.find(x=>x.id===d.pack);
    openModal({title:p.name,body:p.desc||`Adds ${p.gems} gems to your account.`,price:"$"+p.usd.toFixed(2),note:true,yes:"Buy",cb:()=>{
      S.gems+=p.gems;S.spent+=p.usd;S.purchases.push({name:p.name,usd:p.usd,t:Date.now()});
      if(p.once){S.starter=true;S.perm=1.5;if(!S.colors.includes("sea"))S.colors.push("sea");S.color="sea"}
      toast(`Purchased ${p.name} (test)`);renderAll();save()}})}
  if(d.gb){const g=GEMBUYS.find(x=>x.id===d.gb);if(S.gems<g.cost)return;S.gems-=g.cost;
    if(g.id==="boost"){S.boostUntil=Math.max(Date.now(),S.boostUntil)+600000;toast("Surge active: 2x light")}
    if(g.id==="skip"){const amt=perSec()*7200||perTap()*500;earn(amt);toast("Collected ☀ "+fmt(amt))}
    if(g.id==="charter"){S.charter=true;toast("Golden Charter signed")}
    renderShop();save()}
  if(d.col){const c=COLORS.find(x=>x.id===d.col);
    if(!S.colors.includes(c.id)){if(S.gems<c.cost)return;S.gems-=c.cost;S.colors.push(c.id)}
    S.color=c.id;renderShop();save()}
}

export function initPanels() {
  document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{tab=t.dataset.tab;
    document.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected",x===t));
    Object.keys(RENDER).forEach(k=>$("p-"+k).hidden=k!==tab);renderAll()});
  document.addEventListener("click", onClick);
}
