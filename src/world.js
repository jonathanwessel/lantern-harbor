/* The living harbor: day/night cycle and weather. Transient (not saved). */
import { S, lvl } from "./state.js";
import { HARBORS } from "./config.js";

/** The harbor you are at. */
export const harbor = () => HARBORS[S.harbor] || HARBORS.lantern;
export const mods = () => harbor().mods;

/** One full day/night cycle, in ms. Night is the longest stretch. */
export const CYCLE = 6*60*1000;

const smooth = (a,b,x) => { const t = Math.min(1, Math.max(0, (x-a)/(b-a))); return t*t*(3-2*t); };

/** 0..1 position in the cycle. At Lantern Harbor: 0-.55 night, .55-.65 dawn, .65-.9 day, .9-1 dusk;
 *  other harbors move those points (see HARBORS[].cycle). */
export const dayPhase = (now=Date.now()) => (now % CYCLE) / CYCLE;

/** 0 = deep night, 1 = full day. */
export const daylight = (ph=dayPhase()) => { const c = harbor().cycle; return smooth(c.dawn,c.day,ph) - smooth(c.dusk,1,ph); };

export const isNight = () => daylight() < .15;
export const isDay = () => daylight() > .85;
export function timeName() {
  const d = daylight(), ph = dayPhase();
  return d < .15 ? "Night" : d > .85 ? "Day" : ph < harbor().cycle.dusk ? "Dawn" : "Dusk";
}

/* ---------- Weather ---------- */
export const weather = { kind:"clear", start:0, until:0 };

/** Called once a second. Returns true when the weather changed. */
export function tickWeather(now=Date.now()) {
  if (weather.kind !== "clear") {
    if (now > weather.until) { weather.kind = "clear"; return true; }
    return false;
  }
  if (Math.random() < 1/120) {
    weather.kind = Math.random() < .55 ? "fog" : "storm";
    weather.start = now; weather.until = now + 35000 + Math.random()*20000;
    return true;
  }
  return false;
}

export const foggy = () => weather.kind === "fog";
export const stormy = () => weather.kind === "storm";
export const badWeather = () => weather.kind !== "clear";

/** Multiplier on ship bonuses from the weather. */
export const weatherShipMult = () => foggy() ? 3 + .5*lvl("signals") : stormy() ? 2 + .5*lvl("signals") : 1;

/** Local name for the current weather ("Fog" at Lantern Harbor, "Blizzard" in the fjord...). */
export const weatherName = (kind=weather.kind) => harbor().weather[kind] || kind;
