/* Procedural audio with the Web Audio API. No sound files: everything is synthesized.
 *
 * Ambience: rolling waves (filtered noise with a slow swell), wind, rain in storms, a distant foghorn
 * in fog and the Fog Bell if you own one. Effects: taps, guided ships (notes climb a pentatonic scale
 * with your combo), golden ships, birds, thunder, purchases and chimes.
 *
 * Browsers only allow audio after a user gesture, so unlock() is called from the first tap/key.
 * Every call is a safe no-op if audio is off or unsupported.
 */
import { settings, onSettings } from "./settings.js";

let ac = null, master, ambBus, fxBus, noise;
let waves, wind, rain;               // {src, gain, filter}
let nextHorn = 0, nextBell = 0, lastThunder = 0;
const env = { fog: 0, storm: 0, day: 0, bell: false };

const now = () => ac.currentTime;

function makeNoise() {
  const b = ac.createBuffer(1, ac.sampleRate*2, ac.sampleRate), d = b.getChannelData(0);
  let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random()*2-1; last = (last + .02*w)/1.02; d[i] = w*.6 + last*2.4; }
  return b;
}

function noiseLayer(type, freq, q, bus) {
  const src = ac.createBufferSource(); src.buffer = noise; src.loop = true; src.playbackRate.value = .8 + Math.random()*.4;
  const filter = ac.createBiquadFilter(); filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
  const gain = ac.createGain(); gain.gain.value = 0;
  src.connect(filter).connect(gain).connect(bus); src.start();
  return { src, gain, filter };
}

function applyVolumes() {
  if (!ac) return;
  const t = now();
  master.gain.setTargetAtTime(settings.sound ? 1 : 0, t, .1);
  ambBus.gain.setTargetAtTime(settings.ambience*.8, t, .2);
  fxBus.gain.setTargetAtTime(settings.effects*.8, t, .05);
}

/** Create or resume the audio context. Call from a user gesture. */
export function unlock() {
  if (!settings.sound) return;
  try {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ac = new AC(); master = ac.createGain();
      // gentle limiter so stacked sounds (storm + thunder + combo) never clip
      const lim = ac.createDynamicsCompressor(); lim.threshold.value = -10; lim.knee.value = 8; lim.ratio.value = 12; lim.attack.value = .003; lim.release.value = .25;
      master.connect(lim).connect(ac.destination);
      ambBus = ac.createGain(); fxBus = ac.createGain(); ambBus.connect(master); fxBus.connect(master);
      noise = makeNoise();
      waves = noiseLayer("lowpass", 420, .7, ambBus);
      wind = noiseLayer("bandpass", 900, .6, ambBus);
      rain = noiseLayer("highpass", 2500, .5, ambBus);
      applyVolumes();
    }
    if (ac.state === "suspended") ac.resume();
  } catch (e) { ac = null; }
}

onSettings(k => { if (k === "sound" && settings.sound) unlock(); applyVolumes(); });

/* Pause audio while the tab is hidden. */
document.addEventListener("visibilitychange", () => { if (!ac) return; try { document.hidden ? ac.suspend() : settings.sound && ac.resume(); } catch (e) {} });

/** Called ~4x a second with the harbor's state; drives the ambience mix and the foghorn/bell. */
export function ambience(e) {
  Object.assign(env, e);
  if (!ac || ac.state !== "running") return;
  const t = now(), swell = .55 + .45*Math.sin(t*.45) * Math.sin(t*.13+1);
  waves.gain.gain.setTargetAtTime((.2 + .14*swell)*(1 + env.storm*.6), t, .4);
  waves.filter.frequency.setTargetAtTime(380 + 260*swell + 500*env.storm, t, .4);
  wind.gain.gain.setTargetAtTime(.03 + .03*(1-env.day) + .13*env.storm, t, .8);
  wind.filter.frequency.setTargetAtTime(700 + 400*Math.sin(t*.21) + 600*env.storm, t, .8);
  rain.gain.gain.setTargetAtTime(.13*env.storm, t, .8);
  if (env.fog > .5) {
    if (t > nextHorn) { if (nextHorn) foghorn(); nextHorn = t + 14 + Math.random()*8; }
    if (env.bell && t > nextBell) { if (nextBell) bell(); nextBell = t + 7 + Math.random()*4; }
  } else { nextHorn = 0; nextBell = 0; }
}

/* ---------- Synth voices ---------- */
function tone({ f, type="sine", dur=.3, vol=.2, at=0, attack=.005, f2, bus=fxBus, detune=0 }) {
  const t = now() + at, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t+dur); o.detune.value = detune;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t+attack); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
  o.connect(g).connect(bus); o.start(t); o.stop(t+dur+.05);
}

function noiseHit({ freq=400, type="lowpass", dur=1, vol=.4, at=0, attack=.02 }) {
  const t = now() + at, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noise; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t+attack); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
  s.connect(f).connect(g).connect(fxBus); s.start(t, Math.random()); s.stop(t+dur+.05);
}

function foghorn() {
  const t = now(), o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = "sawtooth"; o2.type = "sawtooth"; o.frequency.value = 98; o2.frequency.value = 98.7;
  f.type = "lowpass"; f.frequency.value = 320;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t+.5); g.gain.setValueAtTime(.16, t+1.6); g.gain.exponentialRampToValueAtTime(.0001, t+3.2);
  o.connect(f); o2.connect(f); f.connect(g).connect(ambBus); o.start(t); o2.start(t); o.stop(t+3.3); o2.stop(t+3.3);
}

function bell() {
  [[1,.18],[2.01,.08],[2.76,.07],[5.4,.03]].forEach(([m,v]) => tone({ f:233*m, dur:3.2/m**.3, vol:v, attack:.002, bus:ambBus }));
}

/* Pentatonic scale from C5, so combo notes always sound good together. */
const PENTA = [0,2,4,7,9];
const note = i => 523.25 * Math.pow(2, (PENTA[i%5] + 12*Math.floor(i/5))/12);

const SFX = {
  tap: () => tone({ f:1320+Math.random()*80, f2:900, type:"sine", dur:.09, vol:.07 }),
  guide: n => { const f = note(Math.min(n-1, 12)); tone({ f, type:"triangle", dur:.45, vol:.16 }); tone({ f:f*2, type:"sine", dur:.25, vol:.05, at:.01 }); },
  autoGuide: () => tone({ f:note(0)/2, type:"triangle", dur:.35, vol:.08 }),
  ghost: () => { tone({ f:330, f2:220, type:"sine", dur:1.4, vol:.12, attack:.3 }); tone({ f:332, f2:221, type:"sine", dur:1.4, vol:.1, attack:.3, detune:12 }); },
  gold: () => [0,2,4,5,7].forEach((i,k) => tone({ f:note(i+5), type:"triangle", dur:.35, vol:.12, at:k*.06 })),
  bird: () => { tone({ f:1900, f2:2600, type:"sine", dur:.08, vol:.08 }); tone({ f:2100, f2:2900, type:"sine", dur:.08, vol:.07, at:.09 }); },
  gull: () => { const o = 1+Math.random()*.15; tone({ f:1500*o, f2:950*o, type:"sawtooth", dur:.22, vol:.025 }); tone({ f:1400*o, f2:900*o, type:"sawtooth", dur:.2, vol:.02, at:.26 }); },
  thunder: () => { if (now() - lastThunder < 1) return; lastThunder = now(); const d = .3+Math.random()*.9;
    noiseHit({ freq:180, dur:2.8, vol:.55, at:d, attack:.05 }); noiseHit({ freq:900, dur:.4, vol:.15, at:d }); },
  buy: () => tone({ f:660, f2:880, type:"square", dur:.06, vol:.03 }),
  chime: () => [0,2,4].forEach((i,k) => tone({ f:note(i+5), type:"sine", dur:.7, vol:.1, at:k*.08 })),
  relight: () => { noiseHit({ freq:600, type:"bandpass", dur:1.2, vol:.25, attack:.4 }); [0,2,4,7].forEach((i,k) => tone({ f:note(i), type:"triangle", dur:1.6, vol:.1, at:.5+k*.12 })); },
  error: () => tone({ f:220, f2:180, type:"square", dur:.12, vol:.03 }),
};

/** Play a named sound effect. */
export function sfx(name, arg) {
  if (!ac || !settings.sound || ac.state !== "running") return;
  try { SFX[name] && SFX[name](arg); } catch (e) { console.warn("Lantern Harbor: sound", name, e); }
}
