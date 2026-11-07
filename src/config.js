/* Static game data: upgrades, cosmetics, shop items, daily rewards, achievements. */

export const UPGRADES = [
  {id:"lens",name:"Polished Lens",desc:"+1 light per tap",base:15,mult:1.15,tap:1},
  {id:"keeper",name:"Night Keeper",desc:"+1 light per second",base:50,mult:1.15,sec:1},
  {id:"bell",name:"Fog Bell",desc:"+5 light per second",base:400,mult:1.16,sec:5},
  {id:"fresnel",name:"Fresnel Array",desc:"+10 light per tap",base:1500,mult:1.17,tap:10},
  {id:"pilot",name:"Harbor Pilot Boat",desc:"+40 light per second",base:6000,mult:1.18,sec:40},
  {id:"radio",name:"Radio Beacon",desc:"+250 light per second",base:60000,mult:1.2,sec:250},
  {id:"guild",name:"Lens Grinders' Guild",desc:"+150 light per tap",base:250000,mult:1.2,tap:150},
  {id:"guard",name:"Coast Guard Station",desc:"+1,500 light per second",base:1.2e6,mult:1.21,sec:1500},
  {id:"sat",name:"Satellite Beacon",desc:"+10,000 light per second",base:1.5e7,mult:1.22,sec:10000},
];

export const COLORS = [
  {id:"amber",name:"Amber Flame",hex:"#ffb547",cost:0},
  {id:"sea",name:"Sea Glass",hex:"#5fd3c4",cost:40},
  {id:"aurora",name:"Aurora Violet",hex:"#b98cff",cost:60},
  {id:"ember",name:"Signal Red",hex:"#ff7a6b",cost:60},
  {id:"pearl",name:"Moon Pearl",hex:"#e9f0f7",cost:90},
];

/* Real-money packs. All purchases are SIMULATED for now. */
export const PACKS = [
  {id:"p1",name:"Pouch of Gems",gems:80,usd:0.99},
  {id:"p2",name:"Chest of Gems",gems:500,usd:4.99,tag:"+25% bonus"},
  {id:"p3",name:"Vault of Gems",gems:1200,usd:9.99,tag:"Best value"},
  {id:"starter",name:"Keeper's Starter Pack",gems:300,usd:2.99,once:true,desc:"300 gems + Sea Glass beam + permanent 1.5x light. One per player."},
];

export const GEMBUYS = [
  {id:"boost",name:"Lighthouse Surge",desc:"2x all light for 10 minutes",cost:20},
  {id:"skip",name:"Tide Skip",desc:"Instantly collect 2 hours of light",cost:50},
  {id:"charter",name:"Golden Charter",desc:"Golden ships show up twice as often. Permanent.",cost:120,once:true},
];

/* Gems for day 1..7 of the daily streak. */
export const DAILY = [5,5,10,10,15,15,30];

/* Achievements. `cur(S)` reads progress from the save state. */
export const ACH = [
  {id:"tap100",name:"Steady Hand",desc:"Tap the lamp 100 times",gems:5,cur:S=>S.taps,goal:100},
  {id:"tap1k",name:"Night Shift",desc:"Tap the lamp 1,000 times",gems:10,cur:S=>S.taps,goal:1000},
  {id:"ship10",name:"Safe Passage",desc:"Guide 10 ships",gems:5,cur:S=>S.ships,goal:10},
  {id:"ship100",name:"Busy Harbor",desc:"Guide 100 ships",gems:15,cur:S=>S.ships,goal:100},
  {id:"ship1k",name:"Harbor Master",desc:"Guide 1,000 ships",gems:30,cur:S=>S.ships,goal:1000},
  {id:"l10k",name:"Glow",desc:"Earn 10K light all time",gems:5,cur:S=>S.lifetime,goal:1e4},
  {id:"l1m",name:"Beacon",desc:"Earn 1M light all time",gems:15,cur:S=>S.lifetime,goal:1e6},
  {id:"l1b",name:"Lighthouse Legend",desc:"Earn 1B light all time",gems:40,cur:S=>S.lifetime,goal:1e9},
  {id:"own25",name:"Fully Stocked",desc:"Own 25 of any upgrade",gems:10,cur:S=>Math.max(0,...Object.values(S.owned)),goal:25},
  {id:"gold",name:"Gilded Hull",desc:"Catch a golden ship",gems:10,cur:S=>S.golden,goal:1},
  {id:"gold10",name:"Treasure Fleet",desc:"Catch 10 golden ships",gems:25,cur:S=>S.golden,goal:10},
  {id:"relight",name:"Rekindled",desc:"Relight the lamp once",gems:25,cur:S=>S.relights,goal:1},
];

/* Research projects at the Harbor Observatory. Levels are permanent (they survive a relight).
 * Cost in light = base * grow^level. Duration = time seconds * 1.6^level. */
export const RESEARCH = [
  {id:"mantle",name:"Incandescent Mantles",desc:"+25% light per tap per level",max:10,base:400,grow:4,time:20},
  {id:"clock",name:"Clockwork Rotation",desc:"+25% light per second per level",max:10,base:1200,grow:4,time:30},
  {id:"auto",name:"Clockwork Beam",desc:"The sweeping beam locks onto ships and guides them for you. Levels guide more often and pay more.",max:5,base:2500,grow:6,time:45},
  {id:"dues",name:"Harbor Dues",desc:"+50% light from every guided ship per level",max:10,base:3000,grow:4,time:30},
  {id:"birds",name:"Ornithology",desc:"Birds visit 30% more often and pay +50% per level",max:5,base:5000,grow:5,time:40},
  {id:"lure",name:"Bird Lure",desc:"Birds land at the lantern on their own after a few seconds, for 60% of the reward (+10% per level). Levels make them come sooner.",max:5,base:6000,grow:5,time:45},
  {id:"lanes",name:"Shipping Lanes",desc:"One more ship in the harbor at a time per level",max:4,base:15000,grow:6,time:60},
  {id:"lookout",name:"Lookout Post",desc:"Golden ships appear 20% more often per level",max:5,base:8000,grow:5,time:45},
  {id:"signals",name:"Fog Signals",desc:"Fog and storm ship bonuses +0.5x per level",max:5,base:20000,grow:6,time:60},
  {id:"charts",name:"Gilded Charts",desc:"Golden ships pay +50% per level",max:5,base:50000,grow:6,time:60},
  {id:"tides",name:"Tide Tables",desc:"+1 hour to the offline earnings cap per level",max:8,base:1e5,grow:5,time:90},
  {id:"optics",name:"Lumen Optics",desc:"Each lumen is worth +2% more per level",max:5,base:1e6,grow:8,time:120,needs:S=>S.relights>0,lock:"Relight once to unlock"},
];

/* Birds that fly over the harbor. Tap one for a bonus. */
export const BIRDS = {
  gull:{name:"Gull",size:1,v:2.1,color:"#e9f0f7"},
  albatross:{name:"Albatross",size:1.7,v:1.25,color:"#fff6c7"},
  petrel:{name:"Storm Petrel",size:.85,v:3,color:"#b98cff"},
};

ACH.push(
  {id:"birds10",name:"Birdwatcher",desc:"Catch 10 birds",gems:10,cur:S=>S.birds,goal:10},
  {id:"albatross",name:"Wandering Wings",desc:"Catch an albatross",gems:15,cur:S=>S.albatross,goal:1},
  {id:"storm25",name:"Any Port in a Storm",desc:"Guide 25 ships through fog or storm",gems:15,cur:S=>S.weatherShips,goal:25},
  {id:"res10",name:"Natural Philosopher",desc:"Complete 10 research levels",gems:20,cur:S=>Object.values(S.research).reduce((a,b)=>a+b,0),goal:10},
);

/* Ship classes. `w` = spawn weight, `v` = speed range, `value` = multiplier on the guide bonus.
 * Ghost ships never spawn by weight: they appear only at night (see scene.js). */
export const SHIPS = {
  fishing:{name:"Fishing boat",w:30,v:[.5,.8],value:.6},
  sloop:{name:"Sloop",w:24,v:[.4,.9],value:1},
  schooner:{name:"Schooner",w:15,v:[.4,.7],value:1.3},
  steamer:{name:"Steamer",w:14,v:[.45,.7],value:1.4},
  freighter:{name:"Freighter",w:8,v:[.25,.35],value:3},
  clipper:{name:"Clipper",w:9,v:[1.4,1.8],value:1.8},
  ghost:{name:"Ghost ship",w:0,v:[.3,.4],value:8},
};

/* Harbor Contracts: short rotating goals. `goal` is a [min,max] range; `round` snaps the target. */
export const CONTRACTS = [
  {kind:"ship",text:n=>`Guide ${n} ships`,goal:[15,40],gems:5},
  {kind:"night",text:n=>`Guide ${n} ships at night`,goal:[8,20],gems:6},
  {kind:"weather",text:n=>`Guide ${n} ships through fog or storm`,goal:[4,10],gems:8},
  {kind:"bird",text:n=>`Catch ${n} birds`,goal:[3,8],gems:6},
  {kind:"gold",text:n=>`Catch ${n} golden ship${n>1?"s":""}`,goal:[1,2],gems:8},
  {kind:"tap",text:n=>`Tap the lamp ${n} times`,goal:[150,400],round:50,gems:4},
  {kind:"combo",text:n=>`Reach a ${n}-ship guiding combo`,goal:[4,9],gems:7,max:true},
  {kind:"freighter",text:n=>`Guide ${n} freighter${n>1?"s":""}`,goal:[2,4],gems:6},
  {kind:"clipper",text:n=>`Guide ${n} clipper${n>1?"s":""} before they slip away`,goal:[2,5],gems:6},
];

ACH.push(
  {id:"ghost",name:"Ghost Light",desc:"Guide a ghost ship home",gems:15,cur:S=>S.shipsBy.ghost||0,goal:1},
  {id:"freight25",name:"Heavy Cargo",desc:"Guide 25 freighters",gems:10,cur:S=>S.shipsBy.freighter||0,goal:25},
  {id:"combo10",name:"Chain of Lights",desc:"Reach a 10-ship guiding combo",gems:10,cur:S=>S.bestCombo,goal:10},
  {id:"contracts10",name:"Harbor Contractor",desc:"Complete 10 contracts",gems:15,cur:S=>S.contractsDone,goal:10},
);
