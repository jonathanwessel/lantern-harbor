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
import { COLORS, BIRDS } from "./config.js";
import { S, lvl } from "./state.js";
import { perTap, earn, shipBonus, goldReward, gullReward, autoCooldown, lureDelay, lureMult } from "./economy.js";
import { daylight, dayPhase, foggy, stormy, badWeather } from "./world.js";
import { fmt, $ } from "./util.js";

export const W = 680, H = 300;
const LX = 340, LY = 67, SEA = 190, REACH = 480;

let cv, ctx;
let beamP = 0, spin = 0, flash = 0, autoCd = 0, fogF = 0, stormF = 0, lightning = 0, bolt = null;
let ships = [], floats = [], gold = null, birds = [], sparks = [], clouds = [], drops = [];

/* ---------- Color helpers ---------- */
const HEX = {};
/** Parse "#rrggbb" (cached) or an "rgb(r,g,b)" string from mix(), so mixes can be nested. */
const rgb = h => h[0]==="#" ? (HEX[h] || (HEX[h] = [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)))) : h.slice(4,-1).split(",").map(Number);
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t))})`; };
const rgba = (h, a) => `rgba(${rgb(h)},${Math.max(0,Math.min(1,a))})`;

const STARS = Array.from({length:70}, (_,i) => ({x:(i*97+i*i*13)%W, y:(i*53+i*7)%165, s:i%5===0?2:1, p:i*1.7}));
const TOWN = [[22,150],[34,147],[48,152],[66,146],[80,151],[104,156],[118,160],[150,166],[170,170],[196,177]];

/* ---------- Spawning ---------- */
const SHIP_TYPES = ["sloop","sloop","schooner","steamer"];
function spawnShip(){ships.push({x:-40,y:205+Math.random()*50,v:.4+Math.random()*.5,lit:false,type:SHIP_TYPES[Math.random()*SHIP_TYPES.length|0],p:Math.random()*6})}

export const hasGold = () => !!gold;
export function spawnGold(){gold={x:-40,y:215+Math.random()*30,v:1.6}}

export const birdCount = () => birds.length;
export function spawnBird(kind){
  const b = BIRDS[kind], dir = Math.random()<.5?1:-1;
  birds.push({kind, dir, x:dir>0?-30:W+30, y:30+Math.random()*110, v:b.v*(.85+Math.random()*.3), p:Math.random()*6, age:0});
}

/* ---------- Interaction ---------- */
const birdHit = (b,px,py) => Math.hypot(px-b.x, py-b.y) < 24*BIRDS[b.kind].size+8;

function burst(x, y, color, n=10){ for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*2;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,a:1,c:color})} }

function guide(s, auto){
  s.lit = true;
  const bonus = shipBonus(auto); earn(bonus); S.ships++;
  if (badWeather()) S.weatherShips++;
  floats.push({x:s.x,y:s.y-24,a:1,t:(auto?"⚙ +":"⚓ +")+fmt(bonus)});
  burst(s.x, s.y-8, COLORS.find(c=>c.id===S.color).hex, auto?6:10);
}

function catchBird(b, auto=false){
  birds.splice(birds.indexOf(b),1); S.birds++;
  const info = BIRDS[b.kind], r = gullReward()*(b.kind==="albatross"?2:1)*(auto?lureMult():1); earn(r);
  if (b.kind==="albatross") { S.albatross++; S.frenzyUntil = Math.max(Date.now(),S.frenzyUntil)+15000;
    floats.push({x:b.x,y:b.y-26,a:1.5,t:"Tailwind! taps ×5",c:"#fff6c7"}); }
  if (b.kind==="petrel") { S.gems += 2; floats.push({x:b.x,y:b.y-26,a:1.3,t:"+◆2",c:"#b98cff"}); }
  floats.push({x:b.x,y:b.y-8,a:1.2,t:"✧ +"+fmt(r),c:info.color});
  burst(b.x, b.y, info.color, 14);
}

function tap(px,py){
  if(gold&&px!=null&&Math.hypot(px-gold.x,py-(gold.y-6))<40){
    const r=goldReward();earn(r);S.gems+=1;S.golden++;
    floats.push({x:gold.x,y:gold.y-24,a:1.3,t:"★ +"+fmt(r)+" +◆1",c:"#ffd84a"});burst(gold.x,gold.y-6,"#ffd84a",18);gold=null;flash=1;return}
  if(px!=null){const b=birds.find(b=>birdHit(b,px,py));if(b){catchBird(b);return}}
  const g=perTap();earn(g);S.taps++;flash=1;
  floats.push({x:330+Math.random()*40-20,y:52,a:1,t:"+"+fmt(g)});
  const s=ships.find(s=>!s.lit&&s.x>0&&s.x<W);
  if(s){guide(s,false);beamP=Math.acos(Math.max(-1,Math.min(1,(s.x-LX)/REACH)))}else spin+=3;
}

export function initScene(){
  cv=$("cv");ctx=cv.getContext("2d");
  const dpr=Math.min(2,devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  for(let i=0;i<3;i++){spawnShip();ships[i].x=Math.random()*600}
  for(let i=0;i<6;i++)clouds.push({x:Math.random()*W,y:18+Math.random()*100,s:.6+Math.random()*.8,v:.04+Math.random()*.1});
  for(let i=0;i<90;i++)drops.push({x:Math.random()*W,y:Math.random()*H,v:6+Math.random()*4});
  cv.addEventListener("pointerdown",e=>{const r=cv.getBoundingClientRect();tap((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)});
  cv.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();
    if(gold)tap(gold.x,gold.y);else if(birds[0])tap(birds[0].x,birds[0].y);else tap(null,null)}});
}

/* ---------- Drawing pieces ---------- */
function ell(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}

function hull(x,y,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x-18,y);ctx.lineTo(x+18,y);ctx.lineTo(x+12,y+8);ctx.lineTo(x-12,y+8);ctx.fill();
  ctx.fillRect(x-1,y-18,2,18);ctx.beginPath();ctx.moveTo(x+1,y-17);ctx.lineTo(x+12,y-4);ctx.lineTo(x+1,y-4);ctx.fill()}

function sail(x0,top,bot,w,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x0+1,top);ctx.quadraticCurveTo(x0+w*.9,(top+bot)/2,x0+w,bot);ctx.lineTo(x0+1,bot);ctx.fill()}

function drawShip(s,d,col,t){
  const k=.8+(s.y-205)/50*.4, y=s.y+Math.sin(t/500+s.p)*1.2;
  ctx.save();ctx.translate(s.x,y);ctx.scale(k,k);
  // wake
  ctx.strokeStyle=rgba("#e9f0f7",.18+.1*d);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-20,7);ctx.lineTo(-44,9);ctx.moveTo(-18,9);ctx.lineTo(-36,12);ctx.stroke();
  const hullC=s.lit?mix("#2a3f55","#5a3b2e",d):mix("#1f3247","#4f3a30",d), sailC=s.lit?col:mix("#41607e","#e6dfcc",d);
  ctx.fillStyle=hullC;const L=s.type==="sloop"?18:24;
  ctx.beginPath();ctx.moveTo(-L,0);ctx.lineTo(L+2,0);ctx.lineTo(L-5,8);ctx.lineTo(-L+5,8);ctx.fill();
  ctx.fillStyle=mix("#13202e","#2b1d17",d);ctx.fillRect(-L+4,5,2*L-8,1.5);
  if(s.type==="sloop"){ctx.fillStyle=hullC;ctx.fillRect(-1,-20,2,20);sail(0,-19,-3,13,sailC);sail(-1,-16,-3,-9,sailC)}
  if(s.type==="schooner"){ctx.fillStyle=hullC;ctx.fillRect(-9,-22,2,22);ctx.fillRect(7,-18,2,18);sail(-8,-21,-3,12,sailC);sail(8,-17,-3,11,sailC)}
  if(s.type==="steamer"){ctx.fillStyle=s.lit?col:mix("#33506c","#d9d2c0",d);ctx.fillRect(-12,-8,20,8);ctx.fillStyle=mix("#2a3a4c","#7b3b30",d);ctx.fillRect(2,-17,5,10);
    ctx.fillStyle=rgba("#9aa8b5",.35);for(let i=0;i<3;i++){const q=(t/900+i/3+s.p)%1;ell(4-q*18,-20-q*14,3+q*5,2+q*3)}}
  if(s.lit){ctx.fillStyle=rgba(col,.25);ell(0,-6,26,16);ctx.fillStyle="#fff6c7";ctx.fillRect(-1,-22,2,2)}
  else if(d<.5){ctx.fillStyle="#ff6b5a";ctx.fillRect(-L+2,-2,2,2);ctx.fillStyle="#6fdc8c";ctx.fillRect(L-3,-2,2,2)}
  ctx.restore();
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
  sky.addColorStop(0,mix("#050c17","#3a77b0",d));sky.addColorStop(1,mix("#14293f","#a9d5ea",d));
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,SEA);
  const warm=Math.max(0,1-Math.abs(d-.5)*2.2);
  if(warm>0){const g=ctx.createLinearGradient(0,60,0,SEA);g.addColorStop(0,rgba("#ff9a62",0));g.addColorStop(1,rgba("#ff9a62",.6*warm));ctx.fillStyle=g;ctx.fillRect(0,60,W,SEA-60)}
  // stars
  const sa=(1-d)*(1-stormF*.8);
  if(sa>.02)STARS.forEach(s=>{ctx.fillStyle=rgba("#cfe0f2",sa*(.45+.45*Math.sin(t/700+s.p)));ctx.fillRect(s.x,s.y,s.s,s.s)});
  // moon (night) and sun (day)
  if(ph<.64){const p=ph/.64,x=60+560*p,y=150-115*Math.sin(Math.PI*p),a=1-d;
    const g=ctx.createRadialGradient(x,y,4,x,y,46);g.addColorStop(0,rgba("#f3efd8",.35*a));g.addColorStop(1,rgba("#f3efd8",0));ctx.fillStyle=g;ell(x,y,46,46);
    ctx.fillStyle=rgba("#f3efd8",a);ell(x,y,12,12);ctx.fillStyle=rgba("#c9c3a8",a*.7);ell(x-3,y-2,2.5,2.5);ell(x+4,y+3,1.8,1.8)}
  if(ph>.53){const p=(ph-.53)/.47,x=60+560*p,y=175-140*Math.sin(Math.PI*p),c=mix("#ff8a4a","#fff1b8",d);
    const g=ctx.createRadialGradient(x,y,6,x,y,60);g.addColorStop(0,rgba("#ffe7a0",.5*d+.2));g.addColorStop(1,rgba("#ffe7a0",0));ctx.fillStyle=g;ell(x,y,60,60);
    ctx.fillStyle=c;ell(x,y,15,15)}
  // clouds
  const cc=mix(mix("#1a2a3e","#ffffff",d),"#3a4350",stormF*.8),ca=.45+.35*d+.35*stormF;
  clouds.forEach(c=>{ctx.globalAlpha=Math.min(1,ca);ctx.fillStyle=cc;
    const s=c.s;ell(c.x,c.y,26*s,9*s);ell(c.x+18*s,c.y-5*s,18*s,9*s);ell(c.x-16*s,c.y+1*s,16*s,7*s);ell(c.x+34*s,c.y+2*s,15*s,6*s);ctx.globalAlpha=1});
  if(stormF>0){ctx.fillStyle=rgba("#070b11",.45*stormF);ctx.fillRect(0,0,W,SEA)}
}

function drawHeadlands(d){
  const far=mix(mix("#0b1828","#56788f",d),"#8796a3",fogF*.6), near=mix(mix("#0d1d2e","#46657b",d),"#8796a3",fogF*.5);
  ctx.fillStyle=far;ctx.beginPath();ctx.moveTo(0,SEA);[[0,146],[30,138],[70,142],[110,152],[150,160],[200,172],[250,186],[262,SEA]].forEach(([x,y])=>ctx.lineTo(x,y));ctx.fill();
  ctx.fillStyle=near;ctx.beginPath();ctx.moveTo(548,SEA);[[580,178],[612,166],[650,158],[680,154],[680,SEA]].forEach(([x,y])=>ctx.lineTo(x,y));ctx.fill();
  const lit=(1-d)*(1-fogF*.7);
  if(lit>.05)TOWN.forEach(([x,y],i)=>{ctx.fillStyle=rgba(i%3?"#ffcf7a":"#ffe7b0",lit*(.7+.3*Math.sin(performance.now()/900+i*2)));ctx.fillRect(x,y,2,2)});
  // Lens Grinders' Guild workshop on the west headland
  if(S.owned.guild){ctx.fillStyle=mix("#1c2a38","#7a6a5a",d);ctx.fillRect(84,134,26,14);ctx.fillStyle=mix("#2a1d1a","#6b3b33",d);
    ctx.beginPath();ctx.moveTo(81,135);ctx.lineTo(97,125);ctx.lineTo(113,135);ctx.fill();ctx.fillRect(102,122,4,9);
    ctx.fillStyle=rgba("#ffcf7a",.3+.6*(1-d));ctx.fillRect(89,139,5,5);ctx.fillRect(99,139,5,5)}
  // Coast Guard Station on the east cliff
  if(S.owned.guard){const x=618,y=146;ctx.fillStyle=mix("#26384a","#dfe5ea",d);ctx.fillRect(x,y,34,16);ctx.fillStyle=mix("#3a1e1e","#b33b33",d);ctx.fillRect(x-2,y-4,38,5);
    ctx.fillStyle=rgba("#ffcf7a",.25+.6*(1-d));for(let i=0;i<3;i++)ctx.fillRect(x+5+i*10,y+5,5,5);
    ctx.fillStyle=mix("#3b4b5b","#8a96a2",d);ctx.fillRect(x+40,y-22,1.5,38);ctx.fillStyle="#ff7a6b";
    const w=Math.sin(performance.now()/300)*2;ctx.beginPath();ctx.moveTo(x+41.5,y-22);ctx.lineTo(x+53,y-19+w);ctx.lineTo(x+41.5,y-15);ctx.fill()}
}

function drawSea(d,t){
  const g=ctx.createLinearGradient(0,SEA,0,H);g.addColorStop(0,mix("#0f2438","#2f7aa3",d));g.addColorStop(1,mix("#071321","#1b5274",d));
  ctx.fillStyle=g;ctx.fillRect(0,SEA,W,H-SEA);
  const amp=2+3*stormF;
  ctx.strokeStyle=mix("#1d3c5c","#7fc0dd",d);ctx.lineWidth=2;ctx.globalAlpha=.7;
  for(let y=200;y<H;y+=18){ctx.beginPath();for(let x=0;x<=W;x+=20)ctx.lineTo(x,y+Math.sin(x/30+t/700+y)*amp);ctx.stroke()}
  ctx.globalAlpha=1;
}

function drawIsland(d,t,col){
  ctx.fillStyle=mix("#16283b","#56646c",d);ell(340,200,82,20);
  ctx.fillStyle=mix("#1d3247","#6d7b82",d);ell(300,196,28,9);ell(392,197,30,8);ell(356,203,40,9);
  ctx.strokeStyle=rgba("#e9f0f7",.25+.15*Math.sin(t/600));ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(340,203,86,21,0,.15,Math.PI-.15);ctx.stroke();
  // Satellite Beacon dish
  if(S.owned.sat){ctx.fillStyle=mix("#3b4b5b","#c4ccd4",d);ctx.fillRect(264,180,2,13);ctx.save();ctx.translate(265,180);ctx.rotate(-.6+Math.sin(t/3000)*.3);
    ctx.beginPath();ctx.arc(0,0,9,0,Math.PI);ctx.fill();ctx.restore();ctx.fillStyle="#6fdc8c";ctx.globalAlpha=.5+.5*Math.sin(t/250);ctx.fillRect(264,176,2,2);ctx.globalAlpha=1}
  // keeper's cottage, window lit once a Night Keeper is hired
  ctx.fillStyle=mix("#2b3542","#d7c6a8",d);ctx.fillRect(274,178,30,17);
  ctx.fillStyle=mix("#2a1a18","#7a3d33",d);ctx.beginPath();ctx.moveTo(271,179);ctx.lineTo(289,166);ctx.lineTo(307,179);ctx.fill();ctx.fillRect(296,166,4,9);
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
  const r=ctx.createLinearGradient(318,0,362,0);r.addColorStop(0,mix("#a8473b","#d9654f",d));r.addColorStop(1,mix("#5a2520","#93402f",d));
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
  if(stormF>.01){
    ctx.strokeStyle=rgba("#a9c1d6",.35*stormF);ctx.lineWidth=1;ctx.beginPath();
    drops.forEach(p=>{p.y+=p.v*k;p.x-=p.v*.35*k;if(p.y>H){p.y=-10;p.x=Math.random()*(W+60)}ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+3,p.y-9)});ctx.stroke();
    if(stormy()&&Math.random()<.004*k){lightning=1;let x=60+Math.random()*560,y=0;bolt=[[x,y]];while(y<SEA-20){y+=12+Math.random()*16;x+=Math.random()*24-12;bolt.push([x,y])}}
    if(lightning>.05){ctx.fillStyle=rgba("#e9f0ff",.35*lightning);ctx.fillRect(0,0,W,H);
      if(bolt){ctx.strokeStyle=rgba("#ffffff",lightning);ctx.lineWidth=2;ctx.beginPath();bolt.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}}
    lightning*=Math.pow(.85,k)}
}

/* ---------- Frame ---------- */
export function draw(dt=1/60){
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
  ships.forEach(s=>{s.x+=s.v*k;drawShip(s,d,col,t)});
  ships=ships.filter(s=>s.x<W+40);while(ships.length<3)spawnShip();
  const beam=drawBeam(d,col,!behind);
  // Clockwork Beam: the sweep guides ships it passes over
  if(lvl("auto")>0){autoCd-=dt;
    if(autoCd<=0&&beam.ah>.15){const s=ships.find(s=>!s.lit&&s.x>0&&s.x<W&&Math.abs(s.x-beam.tipX)<26);if(s){guide(s,true);autoCd=autoCooldown()}}}
  if(gold){gold.x+=gold.v*k;const bob=Math.sin(t/200)*2;
    ctx.save();ctx.shadowColor="#ffd84a";ctx.shadowBlur=18;hull(gold.x,gold.y+bob,"#ffd84a");ctx.restore();
    ctx.fillStyle="#fff6c7";for(let i=0;i<3;i++){const a=t/300+i*2.1;ctx.fillRect(gold.x+Math.cos(a)*24,gold.y-8+Math.sin(a)*14,2,2)}
    if(gold.x>W+40)gold=null}
  birds.forEach(b=>{b.x+=b.v*b.dir*k;b.y+=Math.sin(t/400+b.p)*.3*k;b.age+=dt;drawBird(b,t)});
  // Bird Lure: birds land at the lantern on their own after a few seconds
  if(lvl("lure")>0){const b=birds.find(b=>b.age>=lureDelay());if(b)catchBird(b,true)}
  birds=birds.filter(b=>b.x>-40&&b.x<W+40);
  drawWeather(d,t,k);
  sparks.forEach(p=>{p.x+=p.vx*k;p.y+=p.vy*k;p.vy+=.05*k;p.a-=.03*k;ctx.fillStyle=rgba(p.c,p.a);ctx.fillRect(p.x,p.y,2,2)});sparks=sparks.filter(p=>p.a>0);
  ctx.font="600 16px 'IBM Plex Mono', monospace";ctx.textAlign="center";ctx.shadowColor="rgba(0,0,0,.7)";ctx.shadowBlur=4;
  floats.forEach(f=>{f.y-=.8*k;f.a-=.015*k;ctx.globalAlpha=Math.max(0,Math.min(1,f.a));ctx.fillStyle=f.c||"#ffd99a";ctx.fillText(f.t,f.x,f.y)});ctx.globalAlpha=1;ctx.shadowBlur=0;
  floats=floats.filter(f=>f.a>0);flash*=Math.pow(.9,k);
}
