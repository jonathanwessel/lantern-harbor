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
  // seasonal beams: earned by finishing a season's challenges, never sold
  {id:"blossom",name:"Blossom Pink",hex:"#ff9ecf",cost:0,season:"spring"},
  {id:"regatta",name:"Regatta Lime",hex:"#b8f25a",cost:0,season:"summer"},
  {id:"maple",name:"Maple Orange",hex:"#ff8a3d",cost:0,season:"autumn"},
  {id:"frost",name:"Frost Blue",hex:"#9fd8ff",cost:0,season:"winter"},
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
  {id:"flares",name:"Flare Battery",desc:"One more flare and faster reloads per level",max:5,base:4000,grow:5,time:40},
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
  {kind:"ship",text:n=>`Guide ${n} ships`,goal:[15,40],gems:3},
  {kind:"night",text:n=>`Guide ${n} ships at night`,goal:[8,20],gems:3},
  {kind:"weather",text:n=>`Guide ${n} ships through fog or storm`,goal:[4,10],gems:4},
  {kind:"bird",text:n=>`Catch ${n} birds`,goal:[3,8],gems:3},
  {kind:"gold",text:n=>`Catch ${n} golden ship${n>1?"s":""}`,goal:[1,2],gems:4},
  {kind:"tap",text:n=>`Tap the lamp ${n} times`,goal:[150,400],round:50,gems:2},
  {kind:"combo",text:n=>`Reach a ${n}-ship guiding combo`,goal:[4,9],gems:4,max:true},
  {kind:"freighter",text:n=>`Guide ${n} freighter${n>1?"s":""}`,goal:[2,4],gems:3},
  {kind:"skua",text:n=>`Shoot down ${n} skua${n>1?"s":""}`,goal:[3,8],gems:3,need:S=>S.lifetime>=2000},
  {kind:"clipper",text:n=>`Guide ${n} clipper${n>1?"s":""} before they slip away`,goal:[2,5],gems:3},
];

ACH.push(
  {id:"ghost",name:"Ghost Light",desc:"Guide a ghost ship home",gems:15,cur:S=>S.shipsBy.ghost||0,goal:1},
  {id:"freight25",name:"Heavy Cargo",desc:"Guide 25 freighters",gems:10,cur:S=>S.shipsBy.freighter||0,goal:25},
  {id:"combo10",name:"Chain of Lights",desc:"Reach a 10-ship guiding combo",gems:10,cur:S=>S.bestCombo,goal:10},
  {id:"contracts10",name:"Harbor Contractor",desc:"Complete 10 contracts",gems:15,cur:S=>S.contractsDone,goal:10},
);

/* ---------- Keepers ---------- */
export const POSTS = [
  {id:"lamp",name:"Lamp Room",desc:"+10% light per tap per keeper level"},
  {id:"dock",name:"Dock",desc:"+10% light per guided ship per keeper level"},
  {id:"obs",name:"Observatory",desc:"Research 5% faster per keeper level"},
  {id:"look",name:"Lookout",desc:"Golden ships and birds 4% more often per keeper level"},
];

/* Each trait has a home post. At home a keeper works x1.5 and their perk applies. */
export const TRAITS = {
  nightowl:{name:"Night Owl",home:"lamp",perk:"Doubles the Lamp Room bonus at night"},
  salt:{name:"Old Salt",home:"dock",perk:"Auto-guided ships pay +5% more per level"},
  storm:{name:"Storm Sailor",home:"dock",perk:"Fog and storm ship bonus +0.1× per level"},
  scholar:{name:"Scholar",home:"obs",perk:"Finishing research early costs half the gems"},
  birder:{name:"Birder",home:"look",perk:"Birds pay +10% per level"},
  eagle:{name:"Eagle Eye",home:"look",perk:"Golden ships pay +10% per level"},
  sharp:{name:"Sharpshooter",home:"lamp",perk:"Fires flares at raiders on their own (every 6s, faster with levels)"},
};

/** Keeper level from seconds of service: 1 to start, then levels at 2m, 8m, 18m, 32m ... 2.7h for 10. */
export const keeperLevel = xp => Math.min(10, 1 + Math.floor(Math.sqrt(Math.max(0,xp)/120)));

export const KEEPER_NAMES = ["Agnes Pell","Tobias Wren","Mara Quill","Elias Thorne","Nell Harrow","Silas Moor","Ida Fenwick","Jory Calder",
  "Wynn Abernathy","Rosalind Tate","Ezra Locke","Hattie Bramble","Caspian Reed","Odile Marsh","Bram Kettle","Lark Penhallow",
  "Morwen Ash","Tamsin Gale","Arlo Finch","Bess Trelawny","Corin Hale","Delphine Rook","Gideon Pike","Juniper Vane",
  "Kit Rowan","Linnea Holt","Merrick Shaw","Poppy Carrow","Quentin Fogg","Sable Dunmore"];

ACH.push(
  {id:"keeper1",name:"First Mate",desc:"Hire your first keeper",gems:5,cur:S=>S.keepers.length,goal:1},
  {id:"crew4",name:"Full Watch",desc:"Staff all four posts",gems:15,cur:S=>new Set(S.keepers.filter(k=>k.post).map(k=>k.post)).size,goal:4},
  {id:"keeper10",name:"Seasoned Keeper",desc:"Train a keeper to level 10",gems:25,cur:S=>Math.max(0,...S.keepers.map(k=>keeperLevel(k.xp))),goal:10},
);

/* ---------- New Shores: harbors ----------
 * need = relights required to discover it. cycle = day/night phase points (dawn starts, day starts,
 * dusk starts). mods multiply tap light, light per second, guided-ship light, bird and golden-ship rates. */
export const HARBORS = {
  lantern:{name:"Lantern Harbor",need:0,blurb:"A sheltered harbor on a temperate coast, where it all began.",
    cycle:{dawn:.55,day:.65,dusk:.9}, mods:{tap:1,sec:1,ship:1,birds:1,gold:1},
    weather:{fog:"Fog",storm:"Storm"}, rules:["Balanced nights and days","No modifiers"]},
  fjord:{name:"Frostwatch Fjord",need:2,blurb:"Steep peaks, drifting ice and long polar nights under the aurora.",
    cycle:{dawn:.7,day:.78,dusk:.93}, mods:{tap:1,sec:.8,ship:2,birds:.6,gold:1},
    weather:{fog:"Blizzard",storm:"Polar gale"}, rules:["Long nights (ships ×2 at night)","Guided ships pay ×2","Light per second ×0.8","Fewer birds"]},
  reef:{name:"Sunreef Atoll",need:5,blurb:"Turquoise shallows, palms and long sunny days broken by sudden squalls.",
    cycle:{dawn:.35,day:.42,dusk:.9}, mods:{tap:1,sec:1.25,ship:.8,birds:2,gold:1.5},
    weather:{fog:"Sea mist",storm:"Squall"}, rules:["Long days (birds ×2 by day)","Light per second ×1.25","Birds twice as common","Golden ships 50% more often","Guided ships pay ×0.8"]},
};
/** Each harbor you discover adds this much to all light, everywhere. */
export const NETWORK_BONUS = .1;

ACH.push(
  {id:"fjord",name:"Northern Lights",desc:"Visit Frostwatch Fjord",gems:20,cur:S=>S.visited.includes("fjord")?1:0,goal:1},
  {id:"reef",name:"Island Time",desc:"Visit Sunreef Atoll",gems:25,cur:S=>S.visited.includes("reef")?1:0,goal:1},
);

ACH.push(
  {id:"skua1",name:"Flare Up",desc:"Shoot down a skua",gems:5,cur:S=>S.skuas,goal:1},
  {id:"raid5",name:"Raid Breaker",desc:"Repel 5 skua raids",gems:15,cur:S=>S.raids,goal:5},
  {id:"skua100",name:"Sharp Eyes",desc:"Shoot down 100 skuas",gems:20,cur:S=>S.skuas,goal:100},
);

/* ---------- Seasons (one per real week, see seasons.js) ---------- */
export const SEASONS = [
  {id:"spring",name:"Spring Migration",color:"blossom",gems:30,blurb:"The flocks are flying north. Birds everywhere.",
    mods:{birds:2,birdPay:1.5}, rules:["Birds twice as common","Birds pay ×1.5"],
    tasks:[{kind:"bird",goal:30,text:"Catch 30 birds"},{kind:"albatross",goal:2,text:"Catch 2 albatrosses"},{kind:"day",goal:50,text:"Guide 50 ships by day"}]},
  {id:"summer",name:"Summer Regatta",color:"regatta",gems:30,blurb:"Racing clippers crowd the harbor under bunting and long skies.",
    mods:{lanes:1,clipper:3,combo:3}, rules:["One more ship at a time","Clippers three times as common","Combo window +3s"],
    tasks:[{kind:"clipper",goal:15,text:"Guide 15 clippers"},{kind:"combo",goal:12,max:true,text:"Reach a 12-ship combo"},{kind:"ship",goal:150,text:"Guide 150 ships"}]},
  {id:"autumn",name:"Autumn Gales",color:"maple",gems:30,blurb:"Gales sweep the coast, and the skuas ride in on them.",
    mods:{weather:2,gale:1,raids:1.5}, rules:["Fog and storms twice as often","Bad-weather ships +1×","Skua raids 50% more often"],
    tasks:[{kind:"weather",goal:40,text:"Guide 40 ships through bad weather"},{kind:"skua",goal:20,text:"Shoot down 20 skuas"},{kind:"raid",goal:2,text:"Repel 2 skua raids"}]},
  {id:"winter",name:"Winter Ice",color:"frost",gems:30,blurb:"Ice on the water and the longest nights of the year.",
    mods:{night:3,ghost:2,goldPay:1.5}, rules:["Ships pay ×3 at night","Ghost ships twice as common","Golden ships pay ×1.5"],
    tasks:[{kind:"ghost",goal:3,text:"Guide 3 ghost ships"},{kind:"night",goal:60,text:"Guide 60 ships at night"},{kind:"gold",goal:5,text:"Catch 5 golden ships"}]},
];

ACH.push(
  {id:"season1",name:"Seasoned",desc:"Finish a season's three challenges",gems:15,cur:S=>S.seasonsDone,goal:1},
  {id:"season4",name:"A Year at Sea",desc:"Earn all four seasonal beams",gems:40,cur:S=>["blossom","regatta","maple","frost"].filter(c=>S.colors.includes(c)).length,goal:4},
);
