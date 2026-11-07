/* Device settings (sound, motion, number format). Stored apart from the game save under SETTINGS_KEY,
 * so they stay with the device and are not carried along by Export save. */

export const SETTINGS_KEY = "lh-settings";

const prefersReduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };

export const SETTINGS_DEFAULTS = {
  sound: true,        // master switch
  ambience: .5,       // waves, wind, rain, foghorn (0..1)
  effects: .7,        // taps, chimes, birds, thunder (0..1)
  haptics: true,      // vibration on phones that support it
  reduceMotion: prefersReduced(),
  numbers: "short",   // "short" 1.23M · "sci" 1.23e6 · "full" 1,234,567
};

function read() {
  try { const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"); if (s && typeof s === "object") return { ...SETTINGS_DEFAULTS, ...s }; } catch (e) {}
  return { ...SETTINGS_DEFAULTS };
}

export const settings = read();
const listeners = [];

export function onSettings(fn) { listeners.push(fn); }

export function setSetting(k, v) {
  if (!(k in SETTINGS_DEFAULTS)) return;
  settings[k] = v;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
  listeners.forEach(fn => { try { fn(k, v); } catch (e) {} });
}

/** Short vibration on supported phones, if enabled. */
export function buzz(pattern) {
  if (!settings.haptics) return;
  // Browsers only allow vibration after the player has tapped the page at least once.
  try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(pattern); } catch (e) {}
}
