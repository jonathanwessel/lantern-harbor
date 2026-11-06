/* Canvas harbor scene: lighthouse, beam, ships, golden ships, floating text. */
import { COLORS } from "./config.js";
import { S } from "./state.js";
import { perTap, perSec, earn } from "./economy.js";
import { fmt, $ } from "./util.js";

let cv, ctx;
let beam=0, flash=0, ships=[], floats=[], gold=null;

function spawnShip(){ships.push({x:-40,y:205+Math.random()*50,v:.4+Math.random()*.5,lit:false})}

export const hasGold = () => !!gold;
export function spawnGold(){gold={x:-40,y:215+Math.random()*30,v:1.6}}

function tap(px,py){
  if(gold&&px!=null&&Math.hypot(px-gold.x,py-(gold.y-6))<40){
    const r=Math.max(perSec()*60,perTap()*50);earn(r);S.gems+=1;S.golden++;
    floats.push({x:gold.x,y:gold.y-24,a:1.3,t:"★ +"+fmt(r)+" +◆1",c:"#ffd84a"});gold=null;flash=1;return}
  const g=perTap();earn(g);S.taps++;flash=1;beam=0;
  floats.push({x:330+Math.random()*40-20,y:60,a:1,t:"+"+fmt(g)});
  const s=ships.find(s=>!s.lit&&s.x>0&&s.x<680);
  if(s){s.lit=true;const bonus=Math.max(5,g*3);earn(bonus);S.ships++;floats.push({x:s.x,y:s.y-20,a:1,t:"⚓ +"+fmt(bonus)})}
}

export function initScene(){
  cv=$("cv");ctx=cv.getContext("2d");
  for(let i=0;i<3;i++){spawnShip();ships[i].x=Math.random()*600}
  cv.addEventListener("pointerdown",e=>{const r=cv.getBoundingClientRect();tap((e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height)});
  cv.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();tap(gold?gold.x:null,gold?gold.y:null)}});
}

function hull(x,y,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x-18,y);ctx.lineTo(x+18,y);ctx.lineTo(x+12,y+8);ctx.lineTo(x-12,y+8);ctx.fill();
  ctx.fillRect(x-1,y-18,2,18);ctx.beginPath();ctx.moveTo(x+1,y-17);ctx.lineTo(x+12,y-4);ctx.lineTo(x+1,y-4);ctx.fill()}

export function draw(){
  const W=cv.width,H=cv.height,col=COLORS.find(c=>c.id===S.color).hex,t=performance.now();
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#3a5878";for(let i=0;i<40;i++){ctx.fillRect((i*97)%W,(i*53)%120,2,2)}
  beam+=0.012;const ang=Math.sin(beam)*1.1+Math.PI;
  ctx.save();ctx.translate(340,70);ctx.rotate(ang);
  const gr=ctx.createLinearGradient(0,0,-420,0);gr.addColorStop(0,col+"cc");gr.addColorStop(1,col+"00");
  ctx.fillStyle=gr;ctx.globalAlpha=.35+flash*.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-460,-60);ctx.lineTo(-460,60);ctx.fill();ctx.restore();ctx.globalAlpha=1;
  ctx.fillStyle="#0e2236";ctx.fillRect(0,190,W,H-190);
  ctx.strokeStyle="#1d3c5c";ctx.lineWidth=2;for(let y=200;y<H;y+=18){ctx.beginPath();for(let x=0;x<=W;x+=20)ctx.lineTo(x,y+Math.sin(x/30+t/700+y)*2);ctx.stroke()}
  ctx.fillStyle="#1a2c40";ctx.beginPath();ctx.ellipse(340,200,80,20,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#d9e3ec";ctx.beginPath();ctx.moveTo(318,195);ctx.lineTo(328,80);ctx.lineTo(352,80);ctx.lineTo(362,195);ctx.fill();
  ctx.fillStyle="#c95a4a";[110,150].forEach(y=>{ctx.fillRect(322+(195-y)*0.05,y,36-(195-y)*0.1,14)});
  ctx.fillStyle="#24425f";ctx.fillRect(322,52,36,8);ctx.fillRect(326,82,28,4);
  ctx.fillStyle=col;ctx.globalAlpha=.6+flash*.4;ctx.fillRect(328,60,24,20);ctx.globalAlpha=1;
  ctx.fillStyle="#24425f";ctx.beginPath();ctx.moveTo(320,52);ctx.lineTo(340,36);ctx.lineTo(360,52);ctx.fill();
  ships.forEach(s=>{s.x+=s.v;hull(s.x,s.y,s.lit?col:"#4a6a8a")});
  ships=ships.filter(s=>s.x<W+40);while(ships.length<3)spawnShip();
  if(gold){gold.x+=gold.v;const bob=Math.sin(t/200)*2;
    ctx.save();ctx.shadowColor="#ffd84a";ctx.shadowBlur=18;hull(gold.x,gold.y+bob,"#ffd84a");ctx.restore();
    ctx.fillStyle="#fff6c7";for(let i=0;i<3;i++){const a=t/300+i*2.1;ctx.fillRect(gold.x+Math.cos(a)*24,gold.y-8+Math.sin(a)*14,2,2)}
    if(gold.x>W+40)gold=null}
  ctx.font="600 16px 'IBM Plex Mono', monospace";ctx.textAlign="center";
  floats.forEach(f=>{f.y-=.8;f.a-=.015;ctx.globalAlpha=Math.max(0,Math.min(1,f.a));ctx.fillStyle=f.c||"#ffd99a";ctx.fillText(f.t,f.x,f.y)});ctx.globalAlpha=1;
  floats=floats.filter(f=>f.a>0);flash*=.9;
}
