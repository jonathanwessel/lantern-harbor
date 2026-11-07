/* Small shared helpers. */

import { settings } from "./settings.js";

/** Number format from Settings: short "1.23K" (default), scientific "1.23e6", or full "1,234,567". */
export const fmt = n => {
  n = Math.floor(n);
  if (!Number.isFinite(n)) return "0";
  if (settings.numbers === "full") return n.toLocaleString("en-US");
  if (settings.numbers === "sci" && n >= 1e6) return n.toExponential(2).replace("e+", "e");
  const u = [[1e12,"T"],[1e9,"B"],[1e6,"M"],[1e3,"K"]];
  for (const [v,s] of u) if (n >= v) return (n/v).toFixed(n>=v*100?0:n>=v*10?1:2) + s;
  return String(n);
};

export const $ = id => document.getElementById(id);
