/* Entry point: load the save, wire up UI and scene, run the main loop. */
import { ACH } from "./config.js";
import { S, load, save } from "./state.js";
import { boosted, perTap, perSec, earn, pendingLumens, dailyReady, unclaimed } from "./economy.js";
import { fmt, $ } from "./util.js";
import { openModal, initDialogs } from "./ui/dialogs.js";
import { tab, renderAll, renderRelight, renderGoals, refreshUp, initPanels } from "./ui/panels.js";
import { draw, hasGold, spawnGold, initScene } from "./scene.js";

let last=performance.now(),acc=0,sec=0,lastP=-1,lastG="";

function loop(t){
  const dt=Math.min((t-last)/1000,1);last=t;earn(perSec()*dt);
  draw();
  acc+=dt;sec+=dt;
  if(acc>.25){acc=0;
    $("coins").textContent=fmt(S.coins);$("gems").textContent=S.gems;$("ptap").textContent=fmt(perTap());$("psec").textContent=fmt(perSec());$("ships").textContent=S.ships;
    $("lchip").hidden=!S.lumens;$("lumens").textContent=S.lumens;
    const b=$("boost");if(boosted()){const m=Math.ceil((S.boostUntil-Date.now())/1000);b.hidden=false;b.textContent=`2x · ${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`}else b.hidden=true;
    $("goldb").hidden=!hasGold();
    $("gdot").hidden=!(dailyReady()||unclaimed().length);$("rdot").hidden=pendingLumens()<1;
    if(tab==="up")refreshUp();
  }
  if(sec>=1){sec=0;
    if(!hasGold()&&Math.random()<(S.charter?1/45:1/90))spawnGold();
    if(tab==="relight"){const p=pendingLumens();if(p!==lastP){lastP=p;renderRelight()}else if($("r-run"))$("r-run").textContent=fmt(S.run)}
    if(tab==="goals"){const sig=[dailyReady(),S.ach.length,...ACH.map(a=>Math.floor(Math.min(a.cur(S),a.goal)/a.goal*20))].join();if(sig!==lastG){lastG=sig;renderGoals()}}
  }
  requestAnimationFrame(loop);
}

/* Offline earnings: half speed, capped at 4 hours. */
function welcomeBack(){
  if(!S.lastSeen)return;const away=(Date.now()-S.lastSeen)/1000;if(away<60)return;
  const capped=Math.min(away,4*3600),amt=perSec(false)*capped*0.5;if(amt<1)return;
  const h=Math.floor(capped/3600),m=Math.floor(capped%3600/60);
  openModal({title:"Welcome back, keeper",body:`Your crew kept the lamp lit for ${h?h+"h ":""}${m}m and earned ☀ ${fmt(amt)} while you were away. Offline earnings run at half speed, up to 4 hours.`,yes:"Collect",no:null,cls:"",cb:()=>{earn(amt);save()}});
}

load();
initDialogs();
initPanels();
initScene();
welcomeBack();

setInterval(save,5000);
addEventListener("pagehide",save);
document.addEventListener("visibilitychange",()=>{if(document.hidden)save()});
save();renderAll();requestAnimationFrame(loop);
