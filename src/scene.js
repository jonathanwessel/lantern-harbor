/* Canvas harbor scene.
 *
 * Layers, back to front: sky (day/night), stars, moon/sun, clouds, headlands, sea, beam (when it
 * points away), island and buildings, lighthouse, ships, beam (when it points toward you), birds,
 * golden ship, weather, floating text.
 *
 * The harbor grows with the player's upgrades: the keeper's cottage lights up, a fog bell, pilot
 * boat, radio mast, satellite dish, coast guard station and lens workshop appear as they are bought,
 * and an observatory is built once research starts.
 */
import { COLORS, BIRDS, SHIPS } from "./config.js";
import { track } from "./contracts.js";
import { S, lvl } from "./state.js";
import { perTap, earn, shipBonus, goldReward, gullReward, autoCooldown, lureDelay, lureMult, COMBO_WINDOW, comboMult, maxShips,
  flareMax, flareReload, skuaSteal, skuaBounty, raidBonus, sharpInterval, comboWindow } from "./economy.js";
import { daylight, dayPhase, foggy, stormy, badWeather, isNight } from "./world.js";
import { fmt, $ } from "./util.js";
import { sfx } from "./audio.js";
import { settings, buzz } from "./settings.js";
import { keeperAt } from "./keepers.js";
import { THEMES } from "./themes.js";
import { harbor, isDay } from "./world.js";
import { season, smod } from "./seasons.js";

export const W = 680, H = 300;
const LX = 340, LY = 67, SEA = 190, REACH = 480;

let cv, ctx;
let beamP = 0, spin = 0, flash = 0, autoCd = 0, fogF = 0, stormF = 0, lightning = 0, bolt = null;
let ships = [], floats = [], gold = null, birds = [], sparks = [], clouds = [], drops = [], floes = [];
/** Active harbor theme (set each frame). */
let T = THEMES.lantern;
/** Blend a [night, day] color pair by daylight. */
const nd = (pair, d) => mix(pair[0], pair[1], d);

/* ---------- Color helpers ---------- */
const HEX = {};
/** Parse "#rrggbb" (cached) or an "rgb(r,g,b)" string from mix(), so mixes can be nested. */
const rgb = h => h[0]==="#" ? (HEX[h] || (HEX[h] = [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)))) : h.slice(4,-1).split(",").map(Number);
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t))})`; };
const rgba = (h, a) => `rgba(${rgb(h)},${Math.max(0,Math.min(1,a))})`;

const STARS = Array.from({length:70}, (_,i) => ({x:(i*97+i*i*13)%W, y:(i*53+i*7)%165, s:i%5===0?2:1, p:i*1.7}));

/* ---------- Spawning ---------- */
const CLASS_IDS = Object.keys(SHIPS).filter(k=>SHIPS[k].w>0);
const weight = k => SHIPS[k].w*(k==="clipper"?smod().clipper:1);
/** Weighted pick of a ship class. Ghost ships only sail at night. */
function pickClass(){
  if(isNight()&&Math.random()<.03*smod().ghost)return "ghost";
  let r=Math.random()*CLASS_IDS.reduce((a,k)=>a+weight(k),0);for(const k of CLASS_IDS){r-=weight(k);if(r<=0)return k}return "sloop";
}
function spawnShip(x){const type=pickClass(),[a,b]=SHIPS[type].v;
  ships.push({x:x??-40-Math.random()*140,y:205+Math.random()*50,v:a+Math.random()*(b-a),lit:false,type,p:Math.random()*6,fade:1})}

export const hasGold = () => !!gold;
export function spawnGold(){gold={x:-40,y:215+Math.random()*30,v:1.6}}

export const birdCount = () => birds.length;
export function spawnBird(kind){
  const b = BIRDS[kind], dir = Math.random()<.5?1:-1;
  birds.push({kind, dir, x:dir>0?-30:W+30, y:30+Math.random()*110, v:b.v*(.85+Math.random()*.3), p:Math.random()*6, age:0});
  if (kind === "gull" && Math.random() < .6) sfx("gull");
}

/* ---------- Guiding combo ---------- */
let combo = 0, comboT = 0;
/** Current combo, for the HUD badge. */
export const comboState = () => ({ n: combo, left: comboT, mult: comboMult(combo) });

/* ---------- Interaction ---------- */
const birdHit = (b,px,py) => Math.hypot(px-b.x, py-b.y) < 24*BIRDS[b.kind].size+8;
const shipScale = s => .8+(s.y-205)/50*.4;
const shipHit = (s,px,py) => { const k=shipScale(s); return Math.abs(px-s.x)<30*k && py>s.y-30*k && py<s.y+14*k; };
const onScreen = s => !s.lit && s.x>0 && s.x<W;

function burst(x, y, color, n=10){ if(settings.reduceMotion)n=Math.ceil(n/3); for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*2;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,a:1,c:color})} }

function guide(s, auto){
  s.lit = true;
  const cls = SHIPS[s.type];
  if (!auto) { combo = comboT > 0 ? combo+1 : 1; comboT = comboWindow(); S.bestCombo = Math.max(S.bestCombo, combo); track("combo", combo); }
  const bonus = shipBonus(auto, cls.value, auto ? 1 : comboMult(combo)); earn(bonus); S.ships++;
  S.shipsBy[s.type] = (S.shipsBy[s.type]||0) + 1;
  track("ship"); track(s.type); if (isNight()) track("night"); if (isDay()) track("day");
  if (badWeather()) { S.weatherShips++; track("weather"); }
  if (s.type === "ghost") S.gems += 1;
  if (s.type === "ghost") sfx("ghost"); else if (auto) sfx("autoGuide"); else sfx("guide", combo);
  if (!auto) buzz(8);
  const label = ["freighter","clipper","ghost"].includes(s.type) ? cls.name+" " : "";
  floats.push({x:s.x,y:s.y-24,a:1.1,t:label+(auto?"⚙ +":"⚓ +")+fmt(bonus)+(s.type==="ghost"?" +◆1":""),c:s.type==="ghost"?"#bfe9e3":undefined});
  if (!auto && combo >= 2) floats.push({x:s.x,y:s.y-42,a:1,t:`Combo ×${comboMult(combo).toFixed(1)}`,c:"#5fd3c4"});
  burst(s.x, s.y-8, s.type==="ghost"?"#bfe9e3":COLORS.find(c=>c.id===S.color).hex, auto?6:10);
}

function catchBird(b, auto=false){
  birds.splice(birds.indexOf(b),1); S.birds++; track("bird");
  const info = BIRDS[b.kind], r = gullReward()*(b.kind==="albatross"?2:1)*(auto?lureMult():1); earn(r);
  if (b.kind==="albatross") { S.albatross++; track("albatross"); S.frenzyUntil = Math.max(Date.now(),S.frenzyUntil)+15000;
    floats.push({x:b.x,y:b.y-26,a:1.5,t:"Tailwind! taps ×5",c:"#fff6c7"}); }
  if (b.kind==="petrel") { S.gems += 1; floats.push({x:b.x,y:b.y-26,a:1.3,t:"+◆1",c:"#b98cff"}); }
  sfx("bird"); if (!auto) buzz([10,30,10]);
  floats.push({x:b.x,y:b.y-8,a:1.2,t:"✧ +"+fmt(r),c:info.color});
  burst(b.x, b.y, info.color, 14);
}

function tap(px,py){
  if(gold&&px!=null&&Math.hypot(px-gold.x,py-(gold.y-6))<40){
    const r=goldReward();earn(r);S.gems+=1;S.golden++;track("gold");sfx("gold");buzz([15,40,15]);
    floats.push({x:gold.x,y:gold.y-24,a:1.3,t:"★ +"+fmt(r)+" +◆1",c:"#ffd84a"});burst(gold.x,gold.y-6,"#ffd84a",18);gold=null;flash=1;return}
  if(px!=null){const b=birds.find(b=>birdHit(b,px,py));if(b){catchBird(b);return}}
  if(flareTap(px,py))return;
  const g=perTap();earn(g);S.taps++;track("tap");flash=1;
  floats.push({x:330+Math.random()*40-20,y:52,a:1,t:"+"+fmt(g)});
  // Tap a ship to guide that one; otherwise the beam picks the first unguided ship in view.
  const s=(px!=null&&ships.find(s=>onScreen(s)&&shipHit(s,px,py)))||ships.find(onScreen);
  if(s){guide(s,false);beamP=Math.acos(Math.max(-1,Math.min(1,(s.x-LX)/REACH)))}else{spin+=3;sfx("tap");buzz(5)}
}

export function initScene(){
  cv=$("cv");ctx=cv.getContext("2d");
  const dpr=Math.min(2,devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  for(let i=0;i<maxShips();i++)spawnShip(Math.random()*600);
  for(let i=0;i<6;i++)clouds.push({x:Math.random()*W,y:18+Math.random()*100,s:.6+Math.random()*.8,v:.04+Math.random()*.1});
  for(let i=0;i<90;i++)drops.push({x:Math.random()*W,y:Math.random()*H,v:6+Math.random()*4,p:Math.random()*6});
  for(let i=0;i<6;i++)floes.push({x:Math.random()*W,y:200+Math.random()*90,w:14+Math.random()*26,v:.05+Math.random()*.08,p:Math.random()*6});
  cv.addEventListener("pointerdown",e=>{const r=cv.getBoundingClientRect();tap((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)});
  cv.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();
    const r=raiders.find(r=>!r.leaving);
    if(gold)tap(gold.x,gold.y);else if(r&&ammo>0){const [x,y]=lead(r,Math.hypot(r.x-GALLERY[0],r.y-GALLERY[1])/FLARE_SPEED);fire(x,y)}
    else if(birds[0])tap(birds[0].x,birds[0].y);else tap(null,null)}});
}

/* ---------- Raiders and the Flare Gun ----------
 * Skuas swoop over the harbor stealing light. Tap the sky near one to fire a flare from the lantern
 * gallery: it flies to where you tapped and bursts, downing any skua inside the blast. A downed
 * skua drops what it stole plus 50%, and a bounty. Flares are limited and reload over time. */
const GALLERY = [340, 74], FLARE_SPEED = 1400, BLAST = 28;
let raiders = [], fallen = [], flares = [], blasts = [];
let ammo = 3, reloadT = 0, sharpT = 0, dryT = 0;
let raid = null;           // { total, spawned, left, shot, next }
let hinted = false;

export const raiderCount = () => raiders.filter(r=>!r.leaving).length;
export const flareState = () => ({ ammo, max: flareMax(), reload: reloadT, raid: raid ? raid.left : 0, raiders: raiderCount() });

function spawnSkua(inRaid){
  const dir=Math.random()<.5?1:-1;
  raiders.push({x:dir>0?-30:W+30,y:40+Math.random()*110,base:0,dir,v:1.6+Math.random()*.6,p:Math.random()*6,age:0,life:16+Math.random()*8,stolen:0,tick:0,leaving:false,raid:inRaid});
  const r=raiders[raiders.length-1];r.base=r.y;
  if(!hinted&&!S.skuas){hinted=true;setTimeout(()=>floats.push({x:W/2,y:120,a:2.2,t:"A skua is stealing light! Tap it to fire a flare",c:"#ff8a6b"}),600)}
}
/** A lone skua drifts in. */
export function spawnRaider(){ spawnSkua(false); }
/** A raid: several skuas arrive a second or so apart. */
export function startRaid(n){ raid={total:n,spawned:0,left:n,shot:0,next:0}; sfx("alarm"); }
export const raidActive = () => !!raid;

function raiderDone(r, shot){
  if(!r.raid||!raid)return;
  raid.left--; if(shot)raid.shot++;
  if(raid.left<=0){
    if(raid.shot===raid.total){const b=raidBonus();earn(b);S.gems+=1;S.raids++;track("raid");
      floats.push({x:W/2,y:110,a:2,t:`Raid repelled! +☀${fmt(b)} +◆1`,c:"#5fd3c4"});sfx("chime");}
    else floats.push({x:W/2,y:110,a:1.6,t:"The raiders flew off",c:"#ff8a6b"});
    raid=null;
  }
}

function downSkua(r){
  raiders.splice(raiders.indexOf(r),1);S.skuas++;track("skua");
  const bounty=skuaBounty();S.coins+=r.stolen;earn(bounty+r.stolen*.5);
  const gem=Math.random()<.08;if(gem)S.gems+=1;
  floats.push({x:r.x,y:r.y-14,a:1.2,t:`✸ +${fmt(bounty+r.stolen*1.5)}${gem?" +◆1":""}`,c:"#ffb066"});
  fallen.push({x:r.x,y:r.y,vx:r.v*r.dir*.4,vy:-1,rot:0,a:1,dir:r.dir});
  burst(r.x,r.y,"#3b3430",10);burst(r.x,r.y,"#e9f0f7",4);
  sfx("squawk");buzz([12,30,12]);
  raiderDone(r,true);
}

/** Fire a flare at (tx,ty). `auto` = fired by a Sharpshooter keeper (free). */
function fire(tx,ty,auto=false){
  if(!auto){ if(ammo<=0)return false; ammo--; if(reloadT<=0)reloadT=flareReload(); }
  const [x,y]=GALLERY,dist=Math.hypot(tx-x,ty-y)||1;
  flares.push({x,y,tx,ty,vx:(tx-x)/dist*FLARE_SPEED,vy:(ty-y)/dist*FLARE_SPEED,left:dist/FLARE_SPEED,trail:[]});
  sfx("flare");flash=Math.max(flash,.4);
  return true;
}

/** Where a skua will be after `s` seconds (for leading shots). */
function lead(r,s){const f=s*60;return [r.x+r.v*r.dir*f,r.base+Math.sin((r.age+s)*2+r.p)*26];}

function tickRaiders(dt,k,t){
  // raid arrivals
  if(raid&&raid.spawned<raid.total){raid.next-=dt;if(raid.next<=0){spawnSkua(true);raid.spawned++;raid.next=.8+Math.random()*.8}}
  // reload
  if(ammo<flareMax()){reloadT-=dt;if(reloadT<=0){ammo++;reloadT=ammo<flareMax()?flareReload():0}}else reloadT=0;
  if(dryT>0)dryT-=dt;
  // Sharpshooter keeper: shoots on their own, leading the target
  const iv=sharpInterval();
  if(iv&&raiders.length){sharpT-=dt;if(sharpT<=0){const r=raiders.find(r=>!r.leaving&&r.x>20&&r.x<W-20);
    if(r){const d=Math.hypot(r.x-GALLERY[0],r.y-GALLERY[1])/FLARE_SPEED,[x,y]=lead(r,d);fire(x,y,true);sharpT=iv}}}
  // skuas: swoop back and forth stealing light, then leave
  const steal=skuaSteal();
  raiders.forEach(r=>{r.age+=dt;
    if(!r.leaving&&r.age>r.life)r.leaving=true;
    r.x+=r.v*r.dir*k;r.y=r.base+Math.sin(r.age*2+r.p)*26;
    if(!r.leaving&&((r.x>W-30&&r.dir>0)||(r.x<30&&r.dir<0)))r.dir*=-1;
    if(!r.leaving&&r.x>0&&r.x<W){const amt=Math.min(S.coins*.01*dt,steal*dt);S.coins-=amt;r.stolen+=amt;S.stolen+=amt;r.tick+=dt;
      if(r.tick>2.5&&r.stolen>0){r.tick=0;floats.push({x:r.x,y:r.y+16,a:.9,t:"-"+fmt(r.stolen),c:"#ff7a6b"})}}
  });
  raiders=raiders.filter(r=>{const gone=r.leaving&&(r.x<-40||r.x>W+40);if(gone)raiderDone(r,false);return !gone});
  // flares in flight
  flares.forEach(f=>{f.trail.push([f.x,f.y]);if(f.trail.length>6)f.trail.shift();const s=Math.min(dt,f.left);f.x+=f.vx*s;f.y+=f.vy*s;f.left-=dt;
    if(f.left<=0){blasts.push({x:f.tx,y:f.ty,r:4,a:1});sfx("boom");burst(f.tx,f.ty,"#ffb066",12);
      raiders.filter(r=>Math.hypot(r.x-f.tx,r.y-f.ty)<BLAST).forEach(downSkua)}});
  flares=flares.filter(f=>f.left>0);
  blasts.forEach(b=>{b.r+=2.2*k;b.a-=.06*k});blasts=blasts.filter(b=>b.a>0);
  fallen.forEach(f=>{f.vy+=.12*k;f.x+=f.vx*k;f.y+=f.vy*k;f.rot+=.15*k;f.a-=.012*k});fallen=fallen.filter(f=>f.a>0&&f.y<H+20);
}

function drawSkua(x,y,dir,t,p,rot=0,alpha=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(dir*1.35,1.35);ctx.globalAlpha=alpha;
  const flap=Math.sin(t/85+p);
  ctx.fillStyle=rgba("#ff5a4a",.12+.06*Math.sin(t/160+p));ell(0,0,18,12);
  ctx.strokeStyle="#2b2522";ctx.fillStyle="#3b3430";ctx.lineWidth=2.4;ctx.lineJoin="round";ctx.beginPath();
  ctx.moveTo(-13,-flap*7);ctx.lineTo(-6,-3-flap*2);ctx.lineTo(0,0);ctx.lineTo(6,-3-flap*2);ctx.lineTo(13,-flap*7);ctx.stroke();
  ell(1,1,5,2.4);ctx.beginPath();ctx.moveTo(-4,1);ctx.lineTo(-8,3);ctx.lineTo(-4,3);ctx.fill();
  ctx.fillStyle="#ff3b2f";ctx.fillRect(4,-.5,1.4,1.4);ctx.fillStyle="#c9b27a";ctx.fillRect(6,.5,2.5,1);
  ctx.restore();ctx.globalAlpha=1;
}

function drawRaiders(t){
  raiders.forEach(r=>drawSkua(r.x,r.y,r.dir,t,r.p));
  fallen.forEach(f=>drawSkua(f.x,f.y,f.dir,t,0,f.rot,f.a));
  ctx.save();ctx.globalCompositeOperation="lighter";
  flares.forEach(f=>{ctx.strokeStyle=rgba("#ff8a4a",.6);ctx.lineWidth=2;ctx.beginPath();f.trail.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.lineTo(f.x,f.y);ctx.stroke();
    ctx.fillStyle="#fff1c9";ell(f.x,f.y,2.5,2.5);ctx.fillStyle=rgba("#ff8a4a",.4);ell(f.x,f.y,7,7)});
  blasts.forEach(b=>{ctx.strokeStyle=rgba("#ffb066",b.a);ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke();
    if(b.a>.7){ctx.fillStyle=rgba("#fff1c9",(b.a-.7)*2);ell(b.x,b.y,b.r*.6,b.r*.6)}});
  ctx.restore();
}

/** Called by tap(): fire at a sky tap while raiders are around. Returns true if it used the tap. */
function flareTap(px,py){
  if(px==null||!raiders.length||py>SEA-4)return false;
  if(fire(px,py))return true;
  if(dryT<=0){dryT=1.5;floats.push({x:px,y:py-10,a:.9,t:"Reloading…",c:"#8aa2bb"})}
  return false;
}

/* ---------- Drawing pieces ---------- */
function ell(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}

function hull(x,y,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x-18,y);ctx.lineTo(x+18,y);ctx.lineTo(x+12,y+8);ctx.lineTo(x-12,y+8);ctx.fill();
  ctx.fillRect(x-1,y-18,2,18);ctx.beginPath();ctx.moveTo(x+1,y-17);ctx.lineTo(x+12,y-4);ctx.lineTo(x+1,y-4);ctx.fill()}

function sail(x0,top,bot,w,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x0+1,top);ctx.quadraticCurveTo(x0+w*.9,(top+bot)/2,x0+w,bot);ctx.lineTo(x0+1,bot);ctx.fill()}
/** A torn, fluttering sail for the ghost ship. */
function rag(x0,top,bot,w,c,t){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x0+1,top);ctx.lineTo(x0+w,top+3);
  for(let i=0;i<=4;i++){const y=top+3+(bot-top-3)*i/4;ctx.lineTo(x0+w-(i%2?4:0)+Math.sin(t/300+i)*1.5,y)}ctx.lineTo(x0+1,bot);ctx.fill()}

const REGATTA = ["#ff6b6b","#ffd84a","#5fd3c4","#b98cff","#ff9ecf","#6fdc8c"];
const HULL_LEN = {fishing:13,sloop:18,schooner:24,steamer:24,freighter:38,clipper:26,ghost:24};
const BOXES = ["#b33b33","#3b6fb3","#c89b4a","#4a9b6b","#8a5ab3"];

function drawShip(s,d,col,t){
  const k=shipScale(s), y=s.y+Math.sin(t/500+s.p)*1.2, ghost=s.type==="ghost", L=HULL_LEN[s.type];
  ctx.save();ctx.translate(s.x,y);ctx.scale(k,k);
  const base=s.fade*(ghost?.55+.15*Math.sin(t/400+s.p):1);ctx.globalAlpha=base;
  // wake (clippers leave a long one)
  const wl=s.type==="clipper"?40:24;
  ctx.strokeStyle=rgba("#e9f0f7",ghost?.08:.18+.1*d);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-L,7);ctx.lineTo(-L-wl,9);ctx.moveTo(-L+2,9);ctx.lineTo(-L-wl*.7,12);ctx.stroke();
  if(ghost){ctx.fillStyle=rgba("#7fffd4",.16);ell(0,-8,38,22)}
  const hullC=ghost?"#9fd8cf":s.lit?mix("#2a3f55","#5a3b2e",d):mix("#1f3247","#4f3a30",d);
  const regatta=season().id==="summer"&&(s.type==="clipper"||s.type==="sloop");
  const sailC=ghost?"#d8f5ef":s.lit?col:regatta?mix("#33475c",REGATTA[(s.p*10|0)%REGATTA.length],d*.8+.2):mix("#41607e","#e6dfcc",d);
  ctx.fillStyle=hullC;
  ctx.beginPath();ctx.moveTo(-L,0);ctx.lineTo(L+(s.type==="clipper"?8:2),0);ctx.lineTo(L-5,8);ctx.lineTo(-L+5,8);ctx.fill();
  ctx.fillStyle=ghost?"#6fb5aa":mix("#13202e","#2b1d17",d);ctx.fillRect(-L+4,5,2*L-8,1.5);
  switch(s.type){
    case "fishing":
      ctx.fillStyle=s.lit?col:mix("#33506c","#c9b48a",d);ctx.fillRect(-8,-7,9,7);ctx.fillStyle=hullC;ctx.fillRect(5,-16,1.5,16);
      ctx.strokeStyle=hullC;ctx.beginPath();ctx.moveTo(6,-15);ctx.lineTo(15,2);ctx.stroke();break;
    case "sloop":
      ctx.fillStyle=hullC;ctx.fillRect(-1,-20,2,20);sail(0,-19,-3,13,sailC);sail(-1,-16,-3,-9,sailC);break;
    case "schooner":
      ctx.fillStyle=hullC;ctx.fillRect(-9,-22,2,22);ctx.fillRect(7,-18,2,18);sail(-8,-21,-3,12,sailC);sail(8,-17,-3,11,sailC);break;
    case "steamer":
      ctx.fillStyle=s.lit?col:mix("#33506c","#d9d2c0",d);ctx.fillRect(-12,-8,20,8);ctx.fillStyle=mix("#2a3a4c","#7b3b30",d);ctx.fillRect(2,-17,5,10);
      ctx.fillStyle=rgba("#9aa8b5",.35);for(let i=0;i<3;i++){const q=(t/900+i/3+s.p)%1;ell(4-q*18,-20-q*14,3+q*5,2+q*3)}break;
    case "freighter":
      for(let i=0;i<6;i++){ctx.fillStyle=s.lit?col:mix("#22384d",BOXES[(i+(s.p*10|0))%5],d);ctx.fillRect(-30+i*8,-7-(i%2)*4,7,7+(i%2)*4)}
      ctx.fillStyle=mix("#33506c","#e9f0f7",d);ctx.fillRect(22,-14,10,14);ctx.fillStyle=rgba("#ffcf7a",.4+.5*(1-d));ctx.fillRect(24,-12,6,2);break;
    case "clipper":
      ctx.fillStyle=hullC;[-12,0,12].forEach((x,i)=>{ctx.fillRect(x-1,-28+i*2,2,28-i*2);sail(x,-27+i*2,-3,10,sailC)});
      ctx.strokeStyle=hullC;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L+8,0);ctx.lineTo(12,-26);ctx.stroke();break;
    case "ghost":
      ctx.fillStyle=hullC;ctx.fillRect(-9,-24,2,24);ctx.fillRect(7,-20,2,20);rag(-8,-23,-3,12,sailC,t);rag(8,-19,-3,11,sailC,t);
      ctx.fillStyle="#7fffd4";ctx.globalAlpha=base*(.6+.4*Math.sin(t/180));ctx.fillRect(-1,-27,2,2);ctx.globalAlpha=base;break;
  }
  if(s.lit&&!ghost){ctx.fillStyle=rgba(col,.25);ell(0,-6,L+8,16);ctx.fillStyle="#fff6c7";ctx.fillRect(-1,-22,2,2)}
  else if(!s.lit&&!ghost&&d<.5){ctx.fillStyle="#ff6b5a";ctx.fillRect(-L+2,-2,2,2);ctx.fillStyle="#6fdc8c";ctx.fillRect(L-3,-2,2,2)}
  ctx.restore();ctx.globalAlpha=1;
}

function drawBird(b,t){
  const info=BIRDS[b.kind],k=info.size,flap=Math.sin(t/(b.kind==="albatross"?260:120)+b.p);
  ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.dir*k,k);
  if(b.kind!=="gull"){ctx.fillStyle=rgba(info.color,.18+.08*Math.sin(t/200));ell(0,0,20,14)}
  ctx.strokeStyle=info.color;ctx.lineWidth=2/k+.6;ctx.lineCap="round";ctx.beginPath();
  ctx.moveTo(-12,-flap*6);ctx.quadraticCurveTo(-5,-4-flap*3,0,0);ctx.quadraticCurveTo(5,-4-flap*3,12,-flap*6);ctx.stroke();
  ctx.fillStyle=info.color;ell(1,1,3.5,1.8);ctx.restore();
}

function drawSky(d,t,ph){
  const sky=ctx.createLinearGradient(0,0,0,SEA);
  sky.addColorStop(0,nd(T.skyTop,d));sky.addColorStop(1,nd(T.skyBot,d));
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,SEA);
  const warm=Math.max(0,1-Math.abs(d-.5)*2.2);
  if(warm>0){const g=ctx.createLinearGradient(0,60,0,SEA);g.addColorStop(0,rgba(T.warm,0));g.addColorStop(1,rgba(T.warm,.6*warm));ctx.fillStyle=g;ctx.fillRect(0,60,W,SEA-60)}
  // stars
  const sa=(1-d)*(1-stormF*.8);
  if(sa>.02)STARS.forEach(s=>{ctx.fillStyle=rgba("#cfe0f2",sa*(.45+.45*Math.sin(t/700+s.p)));ctx.fillRect(s.x,s.y,s.s,s.s)});
  if(T.aurora)drawAurora(d,t);
  // moon (night) and sun (day), timed to this harbor's day
  const cyc=harbor().cycle,mEnd=cyc.day-.01,sStart=cyc.dawn-.02;
  if(ph<mEnd){const p=ph/mEnd,x=60+560*p,y=150-115*Math.sin(Math.PI*p),a=1-d;
    const g=ctx.createRadialGradient(x,y,4,x,y,46);g.addColorStop(0,rgba("#f3efd8",.35*a));g.addColorStop(1,rgba("#f3efd8",0));ctx.fillStyle=g;ell(x,y,46,46);
    ctx.fillStyle=rgba("#f3efd8",a);ell(x,y,12,12);ctx.fillStyle=rgba("#c9c3a8",a*.7);ell(x-3,y-2,2.5,2.5);ell(x+4,y+3,1.8,1.8)}
  if(ph>sStart){const p=(ph-sStart)/(1-sStart),x=60+560*p,y=175-140*Math.sin(Math.PI*p),c=mix("#ff8a4a","#fff1b8",d);
    const g=ctx.createRadialGradient(x,y,6,x,y,60);g.addColorStop(0,rgba("#ffe7a0",.5*d+.2));g.addColorStop(1,rgba("#ffe7a0",0));ctx.fillStyle=g;ell(x,y,60,60);
    ctx.fillStyle=c;ell(x,y,15,15)}
  // clouds
  const cc=mix(nd(T.cloud,d),"#3a4350",stormF*.8),ca=.45+.35*d+.35*stormF;
  clouds.forEach(c=>{ctx.globalAlpha=Math.min(1,ca);ctx.fillStyle=cc;
    const s=c.s;ell(c.x,c.y,26*s,9*s);ell(c.x+18*s,c.y-5*s,18*s,9*s);ell(c.x-16*s,c.y+1*s,16*s,7*s);ell(c.x+34*s,c.y+2*s,15*s,6*s);ctx.globalAlpha=1});
  if(stormF>0){ctx.fillStyle=rgba("#070b11",.45*stormF);ctx.fillRect(0,0,W,SEA)}
}

const poly = pts => { ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.fill(); };
const SEASON_TINT = { spring:["#4f9a5a",.28], autumn:["#b0602a",.34], winter:["#dfe8ee",.3] };
const PEAKS_W = [[0,SEA],[0,128],[40,88],[70,108],[110,58],[150,104],[185,84],[230,140],[262,SEA]];
const PEAKS_E = [[520,SEA],[556,122],[600,70],[630,100],[660,78],[680,92],[680,SEA]];

function drawPalm(x,y,h,d,t,k=1){
  const trunk=nd(["#1a1c1a","#7a5a3a"],d), leaf=nd(["#0f2a22","#2f8a55"],d), sway=Math.sin(t/1400+x)*2*k;
  ctx.strokeStyle=trunk;ctx.lineWidth=2.2*k;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+4*k,y-h*.5,x+2*k+sway,y-h);ctx.stroke();
  ctx.strokeStyle=leaf;ctx.lineWidth=2*k;const tx=x+2*k+sway,ty=y-h;
  for(const [a,l] of [[-2.6,12],[-2.1,14],[-1.3,11],[-.6,13],[-.15,11]]){ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(tx+Math.cos(a)*l*.6*k,ty+Math.sin(a)*l*.6*k-3*k,tx+Math.cos(a)*l*k,ty+Math.sin(a)*l*k+4*k);ctx.stroke()}
}

function drawHeadlands(d){
  const tint=SEASON_TINT[season().id];
  let far=nd(T.far,d), near=nd(T.near,d); if(tint){far=mix(far,tint[0],tint[1]*(.4+.6*d));near=mix(near,tint[0],tint[1]*(.4+.6*d))}
  far=mix(far,"#8796a3",fogF*.6); near=mix(near,"#8796a3",fogF*.5); const t=performance.now();
  if(T.land==="peaks"){
    ctx.fillStyle=far;poly(PEAKS_W);poly(PEAKS_E);
    // snow caps: paint the upper slopes inside the mountain shapes
    ctx.save();ctx.beginPath();[PEAKS_W,PEAKS_E].forEach(pts=>{pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()});ctx.clip();
    ctx.fillStyle=mix(nd(T.snow,d),"#c9d6e0",fogF*.5);ctx.fillRect(0,0,W,98);ctx.fillStyle=rgba(nd(T.snow,d),.35);ctx.fillRect(0,98,W,14);ctx.restore();
    ctx.fillStyle=near;poly([[548,SEA],[580,178],[612,166],[650,158],[680,154],[680,SEA]]);
  } else if(T.land==="atolls"){
    ctx.fillStyle=far;ell(110,SEA,96,7);ell(600,SEA,74,6);
    ctx.fillStyle=nd(["#2a2a24","#e8d8a0"],d);ell(110,SEA-1,70,3);ell(600,SEA-1,52,2.5);
    [[70,SEA-2,20,.8],[96,SEA-2,24,.9],[140,SEA-2,18,.75],[580,SEA-2,20,.8],[624,SEA-2,16,.7]].forEach(([x,y,h,k])=>drawPalm(x,y,h,d,t,k));
  } else {
    ctx.fillStyle=far;poly([[0,SEA],[0,146],[30,138],[70,142],[110,152],[150,160],[200,172],[250,186],[262,SEA]]);
    ctx.fillStyle=near;poly([[548,SEA],[580,178],[612,166],[650,158],[680,154],[680,SEA]]);
  }
  const lit=(1-d)*(1-fogF*.7);
  if(lit>.05)T.town.forEach(([x,y],i)=>{ctx.fillStyle=rgba(i%3?"#ffcf7a":"#ffe7b0",lit*(.7+.3*Math.sin(performance.now()/900+i*2)));ctx.fillRect(x,y,2,2)});
  // Lens Grinders' Guild workshop on the west headland
  if(S.owned.guild){ctx.save();ctx.translate(T.guild[0]-84,T.guild[1]-134);
    ctx.fillStyle=mix("#1c2a38","#7a6a5a",d);ctx.fillRect(84,134,26,14);ctx.fillStyle=mix("#2a1d1a","#6b3b33",d);
    ctx.beginPath();ctx.moveTo(81,135);ctx.lineTo(97,125);ctx.lineTo(113,135);ctx.fill();ctx.fillRect(102,122,4,9);
    ctx.fillStyle=rgba("#ffcf7a",.3+.6*(1-d));ctx.fillRect(89,139,5,5);ctx.fillRect(99,139,5,5);ctx.restore()}
  // Coast Guard Station on the east cliff
  if(S.owned.guard){const [x,y]=T.guard;ctx.fillStyle=mix("#26384a","#dfe5ea",d);ctx.fillRect(x,y,34,16);ctx.fillStyle=mix("#3a1e1e","#b33b33",d);ctx.fillRect(x-2,y-4,38,5);
    ctx.fillStyle=rgba("#ffcf7a",.25+.6*(1-d));for(let i=0;i<3;i++)ctx.fillRect(x+5+i*10,y+5,5,5);
    ctx.fillStyle=mix("#3b4b5b","#8a96a2",d);ctx.fillRect(x+40,y-22,1.5,38);ctx.fillStyle="#ff7a6b";
    const w=Math.sin(performance.now()/300)*2;ctx.beginPath();ctx.moveTo(x+41.5,y-22);ctx.lineTo(x+53,y-19+w);ctx.lineTo(x+41.5,y-15);ctx.fill()}
}

function drawSea(d,t){
  const g=ctx.createLinearGradient(0,SEA,0,H);g.addColorStop(0,nd(T.seaTop,d));g.addColorStop(1,nd(T.seaBot,d));
  ctx.fillStyle=g;ctx.fillRect(0,SEA,W,H-SEA);
  if(T.coral){ // shallows around the island and coral heads under the water
    ctx.fillStyle=rgba("#bff7ef",.08+.22*d);ell(340,206,150,22);
    [[90,282,40,10,"#ff7a8a"],[200,292,30,8,"#ffb347"],[470,286,36,9,"#c77dff"],[600,294,44,9,"#ff7a8a"],[300,296,26,6,"#5fd3c4"]].forEach(([x,y,rx,ry,c])=>{ctx.fillStyle=rgba(c,.12+.18*d);ell(x,y,rx,ry);ell(x+rx*.5,y-ry*.6,rx*.4,ry*.8)});
  }
  const amp=2+3*stormF;
  ctx.strokeStyle=nd(T.wave,d);ctx.lineWidth=2;ctx.globalAlpha=.7;
  for(let y=200;y<H;y+=18){ctx.beginPath();for(let x=0;x<=W;x+=20)ctx.lineTo(x,y+Math.sin(x/30+t/700+y)*amp);ctx.stroke()}
  ctx.globalAlpha=1;
  if(T.floes||season().id==="winter")floes.forEach(f=>{f.x+=f.v;if(f.x>W+40)f.x=-40;const y=f.y+Math.sin(t/900+f.p)*1;
    ctx.fillStyle=nd(["#7f93a6","#f2f7fa"],d);ctx.beginPath();ctx.moveTo(f.x-f.w,y);ctx.lineTo(f.x-f.w*.4,y-3);ctx.lineTo(f.x+f.w*.6,y-2.5);ctx.lineTo(f.x+f.w,y+1);ctx.lineTo(f.x+f.w*.2,y+3);ctx.fill();
    ctx.fillStyle=rgba("#0b1a2b",.2);ctx.fillRect(f.x-f.w*.8,y+2,f.w*1.6,1)});
}

/** Northern lights: soft green and violet ribbons that fade in with the night. */
function drawAurora(d,t){
  const a=(1-d)*(1-stormF)*(1-fogF*.6);if(a<.03)return;
  ctx.save();ctx.globalCompositeOperation="lighter";
  [["#6fffb0",30,0],["#5fd3c4",48,2],["#b98cff",22,4]].forEach(([c,y0,ph])=>{
    const g=ctx.createLinearGradient(0,y0-10,0,y0+60);g.addColorStop(0,rgba(c,0));g.addColorStop(.35,rgba(c,.22*a));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;
    for(let x=0;x<W;x+=6){const y=y0+Math.sin(x/90+t/2600+ph)*14+Math.sin(x/37+t/1700)*5,h=30+Math.sin(x/60+t/2100+ph)*14;ctx.fillRect(x,y,6,h)}});
  ctx.restore();
}

function drawIsland(d,t,col){
  ctx.fillStyle=nd(T.rock,d);ell(340,200,82,20);
  ctx.fillStyle=nd(T.rock2,d);ell(300,196,28,9);ell(392,197,30,8);ell(356,203,40,9);
  if(T.palms){drawPalm(262,198,26,d,t);drawPalm(424,198,22,d,t,.9)}
  ctx.strokeStyle=rgba("#e9f0f7",.25+.15*Math.sin(t/600));ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(340,203,86,21,0,.15,Math.PI-.15);ctx.stroke();
  // Satellite Beacon dish
  if(S.owned.sat){ctx.fillStyle=mix("#3b4b5b","#c4ccd4",d);ctx.fillRect(264,180,2,13);ctx.save();ctx.translate(265,180);ctx.rotate(-.6+Math.sin(t/3000)*.3);
    ctx.beginPath();ctx.arc(0,0,9,0,Math.PI);ctx.fill();ctx.restore();ctx.fillStyle="#6fdc8c";ctx.globalAlpha=.5+.5*Math.sin(t/250);ctx.fillRect(264,176,2,2);ctx.globalAlpha=1}
  // keeper's cottage, window lit once a Night Keeper is hired
  ctx.fillStyle=mix("#2b3542","#d7c6a8",d);ctx.fillRect(274,178,30,17);
  ctx.fillStyle=mix("#2a1a18","#7a3d33",d);ctx.beginPath();ctx.moveTo(271,179);ctx.lineTo(289,166);ctx.lineTo(307,179);ctx.fill();ctx.fillRect(296,166,4,9);
  if(T.snowfall){ctx.fillStyle=nd(T.snow,d);ctx.beginPath();ctx.moveTo(273,177);ctx.lineTo(289,166);ctx.lineTo(305,177);ctx.lineTo(289,169);ctx.fill()}
  ctx.fillStyle=S.owned.keeper?rgba("#ffcf7a",.45+.55*(1-d)):mix("#141e29","#5a6672",d);ctx.fillRect(279,183,6,6);ctx.fillRect(293,183,6,6);
  if(S.owned.keeper&&d<.6){ctx.fillStyle=rgba("#ffcf7a",.15*(1-d));ell(289,187,22,10)}
  // observatory, built once research begins
  if(S.lab||Object.keys(S.research).length){const x=398;ctx.fillStyle=mix("#283746","#c9d1d8",d);ctx.fillRect(x-12,182,24,13);
    ctx.beginPath();ctx.arc(x,182,12,Math.PI,0);ctx.fill();ctx.fillStyle=S.lab?rgba("#ffcf7a",.5+.4*(1-d)):mix("#141e29","#6a7682",d);ctx.fillRect(x-2,171,4,11);
    if(S.lab){ctx.strokeStyle=mix("#6a7682","#3b4b5b",d);ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,177);ctx.lineTo(x+9+Math.sin(t/4000)*3,164);ctx.stroke()}}
  // Fog Bell, swings in fog
  if(S.owned.bell){const x=372,sw=foggy()?Math.sin(t/260)*.5:0;ctx.fillStyle=mix("#2a2f36","#5b4a3a",d);ctx.fillRect(x-7,180,2,15);ctx.fillRect(x+5,180,2,15);ctx.fillRect(x-7,179,14,2);
    ctx.save();ctx.translate(x,181);ctx.rotate(sw);ctx.fillStyle=mix("#6b5530","#c89b4a",d);ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(3,0);ctx.lineTo(5,8);ctx.lineTo(-5,8);ctx.fill();ctx.restore()}
  // Radio Beacon mast, blinking red light
  if(S.owned.radio){const x=418;ctx.strokeStyle=mix("#34424f","#9aa6b1",d);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-5,197);ctx.lineTo(x,112);ctx.lineTo(x+5,197);
    for(let y=120;y<195;y+=10){const w=(y-112)/85*5;ctx.moveTo(x-w,y);ctx.lineTo(x+w,y+10)}ctx.stroke();
    if(Math.sin(t/400)>0){ctx.fillStyle="#ff5a4a";ell(x,111,2.5,2.5);ctx.fillStyle=rgba("#ff5a4a",.25);ell(x,111,8,8)}}
  // Harbor Pilot Boat at a little pier
  if(S.owned.pilot){ctx.fillStyle=mix("#2a2016","#6b5238",d);ctx.fillRect(408,201,30,2);const y=209+Math.sin(t/600)*1.2;
    ctx.fillStyle=mix("#7a2c25","#c95a4a",d);ctx.beginPath();ctx.moveTo(432,y);ctx.lineTo(462,y);ctx.lineTo(457,y+6);ctx.lineTo(436,y+6);ctx.fill();
    ctx.fillStyle=mix("#3a4a5a","#e9f0f7",d);ctx.fillRect(441,y-7,11,7);ctx.fillStyle=rgba("#ffcf7a",.4+.5*(1-d));ctx.fillRect(444,y-5,3,3)}
}

function drawTower(d,col,t){
  ctx.save();ctx.beginPath();ctx.moveTo(318,195);ctx.lineTo(328,80);ctx.lineTo(352,80);ctx.lineTo(362,195);ctx.closePath();ctx.clip();
  const g=ctx.createLinearGradient(318,0,362,0);g.addColorStop(0,mix("#b7c5d2","#f4f7fa",d));g.addColorStop(.55,mix("#9aabbb","#e4ebf1",d));g.addColorStop(1,mix("#4f6073","#a8b7c5",d));
  ctx.fillStyle=g;ctx.fillRect(310,78,60,120);
  const r=ctx.createLinearGradient(318,0,362,0);r.addColorStop(0,nd(T.stripeA,d));r.addColorStop(1,nd(T.stripeB,d));
  ctx.fillStyle=r;[104,144].forEach(y=>ctx.fillRect(310,y,60,16));
  ctx.restore();
  ctx.fillStyle=mix("#16222e","#3b4b5b",d);ctx.beginPath();ctx.moveTo(335,195);ctx.lineTo(335,186);ctx.arc(340,186,5,Math.PI,0);ctx.lineTo(345,195);ctx.fill();
  ctx.fillStyle=rgba("#ffcf7a",.25+.6*(1-d));ctx.fillRect(338,124,4,6);ctx.fillRect(338,166,4,6);
  // gallery and railing
  ctx.fillStyle=mix("#1b2b3b","#34465a",d);ctx.fillRect(319,79,42,4);
  ctx.strokeStyle=mix("#1b2b3b","#34465a",d);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(320,73);ctx.lineTo(360,73);for(let x=321;x<=360;x+=4.8){ctx.moveTo(x,73);ctx.lineTo(x,79)}ctx.stroke();
  // lantern room
  ctx.fillStyle=rgba(col,.55+flash*.45);ctx.fillRect(328,57,24,22);
  ctx.fillStyle="#fffbe8";ctx.globalAlpha=.7+flash*.3;ell(LX,LY,4+flash*2,5+flash*2);ctx.globalAlpha=1;
  ctx.fillStyle=mix("#1b2b3b","#34465a",d);[328,336,344,351].forEach(x=>ctx.fillRect(x,57,1.5,22));ctx.fillRect(326,55,28,3);
  ctx.beginPath();ctx.moveTo(324,56);ctx.quadraticCurveTo(340,34,356,56);ctx.fill();ell(LX,39,3,3);ctx.fillRect(339.3,28,1.4,9);
}

function drawBeam(d,col,front){
  const h=Math.cos(beamP),ah=Math.abs(h),z=Math.sin(beamP);
  const tipX=LX+h*REACH,tipY=LY+116*ah,half=18+46*(1-ah)+12*fogF;
  const a=(.3+flash*.45)*(front?1:.5)*(1-.5*d)*(1+.6*fogF)*Math.min(1,ah*2+.25);
  ctx.save();ctx.globalCompositeOperation="lighter";
  const g=ctx.createLinearGradient(LX,LY,tipX,tipY);g.addColorStop(0,rgba(col,a));g.addColorStop(1,rgba(col,0));
  const nx=-(tipY-LY),ny=tipX-LX,nl=Math.hypot(nx,ny)||1;
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(LX-nx/nl*3,LY-ny/nl*3);ctx.lineTo(tipX-nx/nl*half,tipY-ny/nl*half);ctx.lineTo(tipX+nx/nl*half,tipY+ny/nl*half);ctx.lineTo(LX+nx/nl*3,LY+ny/nl*3);ctx.fill();
  if(front&&ah>.2){ctx.fillStyle=rgba(col,.12*ah*(1-.5*d));ell(tipX,SEA+10,50*ah,6)}
  if(front){const fr=(22+(S.owned.fresnel?14:0)+flash*30)*(1+Math.max(0,z)*(1-ah)*1.6);
    const hg=ctx.createRadialGradient(LX,LY,2,LX,LY,fr);hg.addColorStop(0,rgba(col,.55*(1-.4*d)));hg.addColorStop(1,rgba(col,0));ctx.fillStyle=hg;ell(LX,LY,fr,fr)}
  ctx.restore();
  return {h,ah,tipX};
}

function drawWeather(d,t,k){
  if(fogF>.01){
    for(let i=0;i<7;i++){const x=((i*131+t/90*(i%2?1:-1))%(W+240)+W+240)%(W+240)-120,y=150+(i*37)%110;
      const g=ctx.createRadialGradient(x,y,10,x,y,130);g.addColorStop(0,rgba("#c9d6e0",.32*fogF));g.addColorStop(1,rgba("#c9d6e0",0));ctx.fillStyle=g;ctx.fillRect(x-130,y-130,260,260)}
    ctx.fillStyle=rgba(d>.5?"#dfe8ee":"#7f93a5",.18*fogF);ctx.fillRect(0,120,W,H-120)}
  if(T.snowfall||season().id==="winter"){ // snow: a light fall always, heavy in blizzards and gales
    const n=Math.round((settings.reduceMotion?.4:1)*(24+66*Math.max(fogF,stormF))),wind=1+3*stormF;
    ctx.fillStyle=rgba("#f4f8fb",.75);
    for(let i=0;i<n;i++){const p=drops[i];p.y+=(.5+p.v*.08)*k;p.x+=(Math.sin(t/900+p.p)*.3-wind*.5)*k;if(p.y>H){p.y=-4;p.x=Math.random()*(W+80)}if(p.x<-10)p.x=W+10;ctx.fillRect(p.x,p.y,i%3?1.5:2.2,i%3?1.5:2.2)}
  }
  if(stormF>.01){
    if(!(T.snowfall||season().id==="winter")){ctx.strokeStyle=rgba("#a9c1d6",.35*stormF);ctx.lineWidth=1;ctx.beginPath();
    (settings.reduceMotion?drops.slice(0,35):drops).forEach(p=>{p.y+=p.v*k;p.x-=p.v*.35*k;if(p.y>H){p.y=-10;p.x=Math.random()*(W+60)}ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+3,p.y-9)});ctx.stroke()}
    if(stormy()&&Math.random()<.004*k){lightning=1;sfx("thunder");let x=60+Math.random()*560,y=0;bolt=[[x,y]];while(y<SEA-20){y+=12+Math.random()*16;x+=Math.random()*24-12;bolt.push([x,y])}}
    if(lightning>.05){if(!settings.reduceMotion){ctx.fillStyle=rgba("#e9f0ff",.35*lightning);ctx.fillRect(0,0,W,H)}
      if(bolt){ctx.strokeStyle=rgba("#ffffff",lightning);ctx.lineWidth=2;ctx.beginPath();bolt.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}}
    lightning*=Math.pow(.85,k)}
}

/* ---------- Seasonal touches ---------- */
const MOTES = Array.from({length:36}, (_,i) => ({x:Math.random()*W, y:Math.random()*H, v:.3+Math.random()*.5, p:Math.random()*6, c:i%3}));
const PETALS = ["#ffc4dd","#ff9ecf","#fff0f6"], LEAVES = ["#ff8a3d","#d9542f","#a8662a"];

function drawSeasonFront(d,t,k){
  const id=season().id;
  if(id==="spring"||id==="autumn"){const cols=id==="spring"?PETALS:LEAVES,n=settings.reduceMotion?12:MOTES.length;
    for(let i=0;i<n;i++){const m=MOTES[i];m.y+=m.v*k*(id==="autumn"?1.2:.7);m.x+=(Math.sin(t/800+m.p)*.6-(id==="autumn"?1+stormF*2:.3))*k;
      if(m.y>H){m.y=-6;m.x=Math.random()*(W+100)}if(m.x<-10)m.x=W+10;
      ctx.save();ctx.translate(m.x,m.y);ctx.rotate(t/600+m.p);ctx.fillStyle=rgba(cols[m.c],.85);
      if(id==="spring")ell(0,0,2.4,1.4);else{ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(2.2,0);ctx.lineTo(0,3);ctx.lineTo(-2.2,0);ctx.fill()}
      ctx.restore()}}
}

function drawSeasonBack(d,t){
  const id=season().id;
  if(id==="spring"){ // migrating flocks in the distance
    ctx.strokeStyle=rgba(d>.5?"#2a3a4a":"#9fb3c4",.55);ctx.lineWidth=1;
    for(let f=0;f<2;f++){const bx=((t/90*(f?1:.8)+f*400)%(W+200))-100,by=58+f*28;
      for(let i=0;i<7;i++){const j=i-3,x=bx-Math.abs(j)*9,y=by+j*5,fl=Math.sin(t/140+i)*2;ctx.beginPath();ctx.moveTo(x-3,y-fl);ctx.lineTo(x,y);ctx.lineTo(x+3,y-fl);ctx.stroke()}}}
  if(id==="summer"){ // bunting from the gallery
    const lines=[[[322,80],[289,167]],[[358,80],[404,171]]];
    lines.forEach(([[x1,y1],[x2,y2]],li)=>{ctx.strokeStyle=rgba("#e9f0f7",.5);ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo((x1+x2)/2,(y1+y2)/2+14,x2,y2);ctx.stroke();
      for(let i=1;i<9;i++){const u=i/9,x=(1-u)*(1-u)*x1+2*u*(1-u)*(x1+x2)/2+u*u*x2,y=(1-u)*(1-u)*y1+2*u*(1-u)*((y1+y2)/2+14)+u*u*y2;
        ctx.fillStyle=mix("#33475c",REGATTA[(i+li*3)%REGATTA.length],.4+.6*d);ctx.beginPath();ctx.moveTo(x-2.5,y);ctx.lineTo(x+2.5,y);ctx.lineTo(x,y+5);ctx.fill()}})}
}

/** A tiny keeper figure with a lantern. */
function figure(x,y,d,t,k=1,glass=false){
  ctx.save();ctx.translate(x,y);ctx.scale(k,k);
  const c=mix("#0d1824","#2a3442",d);ctx.fillStyle=c;ctx.fillRect(-1.5,-7,3,5);ctx.fillRect(-1.5,-2,1.2,2);ctx.fillRect(.3,-2,1.2,2);ell(0,-8.5,1.6,1.6);
  if(glass){ctx.strokeStyle=mix("#3a4a5a","#2a3442",d);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(1,-8);ctx.lineTo(5,-10);ctx.stroke()}
  const g=1-d,lx=glass?-3:2;ctx.fillStyle=rgba("#ffcf7a",.5+.5*g);ctx.fillRect(lx,-5+Math.sin(t/300)*.4,1.6,2);if(g>.3){ctx.fillStyle=rgba("#ffcf7a",.18*g);ell(lx+.8,-4,6,6)}
  ctx.restore();
}

function drawKeepers(d,t){
  if(keeperAt("lamp")){const x=325+(Math.sin(t/4200)+1)*15;figure(x,79,d,t,1.3)}
  if(keeperAt("dock"))figure(S.owned.pilot?424:412,S.owned.pilot?201:197,d,t,1.5);
  if(keeperAt("look"))figure(T.lookout[0],T.lookout[1],d,t,1.1,true);
  if(keeperAt("obs")&&d<.7){ctx.fillStyle=rgba("#ffcf7a",.35*(1-d));ctx.fillRect(390,186,4,4)}
}

/* ---------- Frame ---------- */
export function draw(dt=1/60){
  T=THEMES[S.harbor]||THEMES.lantern;
  const k=dt*60,col=COLORS.find(c=>c.id===S.color).hex,t=performance.now(),d=daylight(),ph=dayPhase();
  fogF+=((foggy()?1:0)-fogF)*.02*k;stormF+=((stormy()?1:0)-stormF)*.02*k;
  beamP=(beamP+(Math.PI*2/7+spin)*dt)%(Math.PI*2);spin*=Math.pow(.96,k);
  clouds.forEach(c=>{c.x+=c.v*k*(1+stormF*3);if(c.x>W+60){c.x=-60;c.y=18+Math.random()*100}});

  ctx.clearRect(0,0,W,H);
  drawSky(d,t,ph);
  drawHeadlands(d);
  drawSea(d,t);
  const behind=Math.sin(beamP)<0;
  if(behind)drawBeam(d,col,false);
  drawIsland(d,t,col);
  drawTower(d,col,t);
  drawSeasonBack(d,t);
  drawKeepers(d,t);
  // ghost ships fade away at daybreak
  ships.forEach(s=>{s.x+=s.v*k;if(s.type==="ghost"&&d>.3&&!s.lit)s.fade-=.01*k;drawShip(s,d,col,t)});
  ships=ships.filter(s=>s.x<W+60&&s.fade>0);while(ships.length<maxShips())spawnShip();
  if(comboT>0){comboT-=dt;if(comboT<=0)combo=0}
  const beam=drawBeam(d,col,!behind);
  // Clockwork Beam: the sweep guides ships it passes over
  if(lvl("auto")>0){autoCd-=dt;
    if(autoCd<=0&&beam.ah>.15){const s=ships.find(s=>onScreen(s)&&Math.abs(s.x-beam.tipX)<26);if(s){guide(s,true);autoCd=autoCooldown()}}}
  if(gold){gold.x+=gold.v*k;const bob=Math.sin(t/200)*2;
    ctx.save();ctx.shadowColor="#ffd84a";ctx.shadowBlur=18;hull(gold.x,gold.y+bob,"#ffd84a");ctx.restore();
    ctx.fillStyle="#fff6c7";for(let i=0;i<3;i++){const a=t/300+i*2.1;ctx.fillRect(gold.x+Math.cos(a)*24,gold.y-8+Math.sin(a)*14,2,2)}
    if(gold.x>W+40)gold=null}
  birds.forEach(b=>{b.x+=b.v*b.dir*k;b.y+=Math.sin(t/400+b.p)*.3*k;b.age+=dt;drawBird(b,t)});
  // Bird Lure: birds land at the lantern on their own after a few seconds
  if(lvl("lure")>0){const b=birds.find(b=>b.age>=lureDelay());if(b)catchBird(b,true)}
  birds=birds.filter(b=>b.x>-40&&b.x<W+40);
  tickRaiders(dt,k,t);drawRaiders(t);
  drawWeather(d,t,k);
  drawSeasonFront(d,t,k);
  sparks.forEach(p=>{p.x+=p.vx*k;p.y+=p.vy*k;p.vy+=.05*k;p.a-=.03*k;ctx.fillStyle=rgba(p.c,p.a);ctx.fillRect(p.x,p.y,2,2)});sparks=sparks.filter(p=>p.a>0);
  ctx.font="600 16px 'IBM Plex Mono', monospace";ctx.textAlign="center";ctx.shadowColor="rgba(0,0,0,.7)";ctx.shadowBlur=4;
  floats.forEach(f=>{f.y-=.8*k;f.a-=.015*k;ctx.globalAlpha=Math.max(0,Math.min(1,f.a));ctx.fillStyle=f.c||"#ffd99a";ctx.fillText(f.t,f.x,f.y)});ctx.globalAlpha=1;ctx.shadowBlur=0;
  floats=floats.filter(f=>f.a>0);flash*=Math.pow(.9,k);
}
