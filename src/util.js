/* Small shared helpers. */

/** Compact number format: 1234 -> "1.23K". */
export const fmt = n => {
  n = Math.floor(n);
  const u = [[1e12,"T"],[1e9,"B"],[1e6,"M"],[1e3,"K"]];
  for (const [v,s] of u) if (n >= v) return (n/v).toFixed(n>=v*100?0:n>=v*10?1:2) + s;
  return String(n);
};

export const $ = id => document.getElementById(id);
