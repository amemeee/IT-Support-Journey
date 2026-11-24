/* Small helpers shared across the simulator. */

export const clone = o => JSON.parse(JSON.stringify(o));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const rand = (a, b) => a + Math.random() * (b - a);

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// "Nurul Aisyah binti Ahmad" -> "NA" (skips bin/binti/a/l/a/p and Dato')
export const initials = n => n.replace(/\b(binti|bin|a\/p|a\/l)\b|Dato'/g, '').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

// seconds -> "mm:ss"
export function fmt(s) {
  s = Math.max(0, Math.round(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

// shift clock: the shift starts at 08:47
export function clockTime(elapsed) {
  const sec = 8 * 3600 + 47 * 60 + elapsed;
  return [Math.floor(sec / 3600) % 24, Math.floor(sec / 60) % 60, sec % 60].map(n => String(n).padStart(2, '0'));
}

// localStorage that never throws (private windows, blocked storage)
export const storage = {
  get(k, d) {
    try { const v = localStorage.getItem('itsj:' + k); return v == null ? d : JSON.parse(v); } catch { return d; }
  },
  set(k, v) {
    try { localStorage.setItem('itsj:' + k, JSON.stringify(v)); } catch { /* ignore */ }
  }
};
