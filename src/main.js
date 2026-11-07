/* Entry point: load the save, wire up UI and scene, run the main loop. */
import { ACH } from "./config.js";
import { S, load, save, lvl, whenLocked } from "./state.js";
import { boosted, frenzy, perTap, perSec, earn, pendingLumens, dailyReady, unclaimed, offlineCapH, goldChance } from "./economy.js";
import { tickWeather, weather, isDay, isNight, timeName, stormy, foggy, daylight, weatherName, mods, harbor } from "./world.js";
import { newHarbors } from "./harbors.js";
import { season, smod, seasonState, seasonClaimable, takeNotice } from "./seasons.js";
import { fmt, $ } from "./util.js";
import { openModal, initDialogs, toast } from "./ui/dialogs.js";
import { tab, renderAll, renderRelight, renderGoals, refreshUp, refreshResearch, researchReady, checkLab, initPanels } from "./ui/panels.js";
import { draw, hasGold, spawnGold, spawnBird, birdCount, comboState, initScene, spawnRaider, startRaid, raidActive, raiderCount, flareState } from "./scene.js";
import { ensureContracts, contractsReady } from "./contracts.js";
import { unlock, ambience, sfx } from "./audio.js";
import { addXp, ensureCandidates, lookMult } from "./keepers.js";
import { keepersReady, refreshKeepers, renderKeepers } from "./ui/keepersPanel.js";

const VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

let last=performance.now(),acc=0,sec=0,lastP=-1,lastG="";
const clock = ms => { const s=Math.ceil(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };

function conditions(){
  const parts=[season().name,timeName()];
  if(isNight())parts.push("ships ×"+smod().night);
  if(isDay())parts.push("birds ×2");
  if(weather.kind==="fog")parts.push(weatherName()+": ships ×"+(3+.5*lvl("signals")));
  if(weather.kind==="storm")parts.push(weatherName()+": taps ×2, ships ×"+(2+.5*lvl("signals")));
  return parts.join(" · ");
}

function everySecond(){
  if(!hasGold()&&Math.random()<goldChance())spawnGold();
  // birds: gulls are common (twice as common by day), albatrosses are rare, storm petrels only fly in storms
  if(birdCount()<3){const b=(1+.3*lvl("birds"))*lookMult()*mods().birds*smod().birds;
    if(Math.random()<b*(isDay()?2:1)/30)spawnBird("gull");
    else if(Math.random()<b/300)spawnBird("albatross");
    else if(stormy()&&Math.random()<b/25)spawnBird("petrel")}
  // raiders: lone skuas now and then, and occasional raids, once the harbor is worth robbing
  if(S.lifetime>=2000){
    if(!raidActive()&&Math.random()<smod().raids/200)startRaid(3+Math.floor(Math.random()*4));
    else if(raiderCount()<2&&Math.random()<mods().birds/110)spawnRaider();
  }
  if(tickWeather())toast(weather.kind==="fog"?`${weatherName()} rolls in. Guided ships pay extra.`:weather.kind==="storm"?`${weatherName()}! Taps and ships pay extra.`:"The weather clears.");
  checkLab();
  seasonState();const sn=takeNotice();if(sn){toast(sn,5000);sfx("chime")}
  const ups=addXp(1);ups.forEach(k=>{toast(`${k.name} is now level ${Math.min(10,1+Math.floor(Math.sqrt(k.xp/120)))}`);sfx("chime")});
  if(ups.length&&tab==="keepers")renderKeepers();
  if(tab==="relight"){const p=pendingLumens();if(p!==lastP){lastP=p;renderRelight()}else if($("r-run"))$("r-run").textContent=fmt(S.run)}
  if(tab==="goals"){const sig=[dailyReady(),S.ach.length,...ACH.map(a=>Math.floor(Math.min(a.cur(S),a.goal)/a.goal*20)),...S.contracts.map(c=>c.kind+c.n),JSON.stringify(seasonState()),Math.floor(Date.now()/60000),S.gems>=2,Math.floor(S.playTime/60)].join();if(sig!==lastG){lastG=sig;renderGoals()}}
}

function loop(t){
  const dt=Math.min((t-last)/1000,1);last=t;earn(perSec()*dt);S.playTime+=dt;
  draw(dt);
  acc+=dt;sec+=dt;
  if(acc>.25){acc=0;
    $("coins").textContent=fmt(S.coins);$("gems").textContent=S.gems;$("ptap").textContent=fmt(perTap());$("psec").textContent=fmt(perSec());$("ships").textContent=S.ships;
    $("cond").textContent=conditions();
    $("lchip").hidden=!S.lumens;$("lumens").textContent=S.lumens;
    const b=$("boost");if(boosted()){b.hidden=false;b.textContent=`2x · ${clock(S.boostUntil-Date.now())}`}else b.hidden=true;
    const f=$("frenzy");if(frenzy()){f.hidden=false;f.textContent=`Tailwind ×5 taps · ${clock(S.frenzyUntil-Date.now())}`}else f.hidden=true;
    const w=$("wx");if(weather.kind!=="clear"){w.hidden=false;w.textContent=`${weatherName()} · ${clock(weather.until-Date.now())}`;w.className="badge "+weather.kind}else w.hidden=true;
    if(document.body.dataset.harbor!==S.harbor)document.body.dataset.harbor=S.harbor;
    $("hname").textContent=harbor().name;$("hdot").hidden=!newHarbors().length;
    const c=comboState(),cb=$("combo");if(c.n>=2){cb.hidden=false;cb.textContent=`Combo ${c.n} · ×${c.mult.toFixed(1)}`}else cb.hidden=true;
    $("goldb").hidden=!hasGold();
    const fs=flareState(),fb=$("flares");if(fs.raiders||fs.ammo<fs.max){fb.hidden=false;fb.textContent=`Flares ${"●".repeat(fs.ammo)}${"○".repeat(fs.max-fs.ammo)}`+(fs.raid?` · Raid: ${fs.raid} left`:fs.raiders?` · ${fs.raiders} skua${fs.raiders>1?"s":""}`:"")}else fb.hidden=true;
    ambience({fog:foggy()?1:0, storm:stormy()?1:0, day:daylight(), bell:!!S.owned.bell});
    $("gdot").hidden=!(dailyReady()||unclaimed().length||contractsReady()||seasonClaimable());$("rdot").hidden=pendingLumens()<1;$("resdot").hidden=!researchReady();$("kdot").hidden=!keepersReady();
    if(tab==="up")refreshUp();
    if(tab==="research")refreshResearch();
    if(tab==="keepers")refreshKeepers();
  }
  if(sec>=1){sec=0;everySecond()}
  requestAnimationFrame(loop);
}

/* Offline earnings: half speed, capped (4 hours plus Tide Tables research). */
function welcomeBack(){
  if(!S.lastSeen)return;const away=(Date.now()-S.lastSeen)/1000;if(away<60)return;
  addXp(Math.min(away,offlineCapH()*3600)); // keepers keep training while you're away
  const cap=offlineCapH(),capped=Math.min(away,cap*3600),amt=perSec(false)*capped*0.5;if(amt<1)return;
  const h=Math.floor(capped/3600),m=Math.floor(capped%3600/60);
  openModal({title:"Welcome back, keeper",body:`Your crew kept the lamp lit for ${h?h+"h ":""}${m}m and earned ☀ ${fmt(amt)} while you were away. Offline earnings run at half speed, up to ${cap} hours.`,yes:"Collect",no:null,cls:"",cb:()=>{earn(amt);save()}});
}

/* New release on the play server: offer a reload (the game saves first, so nothing is lost). */
function watchForUpdates(){
  if(VERSION==="dev")return;
  const check=async()=>{try{const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const {version}=await r.json();
    if(version&&version!==VERSION){$("upd-v").textContent=version;$("update").hidden=false}}catch(e){}};
  setInterval(check,60000);setTimeout(check,5000);
  $("upd-go").onclick=()=>{save();location.reload()};
}

load();
ensureContracts();
ensureCandidates();
initDialogs();
initPanels();
initScene();
welcomeBack();
whenLocked(()=>openModal({title:"Open in another tab",body:"Lantern Harbor was saved from another tab or window, so this one has paused saving to protect your progress. Reload to continue here with the latest save.",yes:"Reload",no:null,cls:"glass",cb:()=>location.reload()}));
$("ver").textContent="v"+VERSION;
watchForUpdates();

/* Browsers only allow sound after a tap or key press. */
addEventListener("pointerdown", unlock, {capture:true});
addEventListener("keydown", unlock, {capture:true});

setInterval(save,5000);
addEventListener("pagehide",save);
document.addEventListener("visibilitychange",()=>{if(document.hidden)save()});
save();renderAll();requestAnimationFrame(loop);
