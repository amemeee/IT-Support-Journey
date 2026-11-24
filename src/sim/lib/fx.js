/* Feedback effects: toasts, sounds, confetti, floating points. */
import { reactive } from 'vue';
import { rand } from './util.js';

/* ---------- toasts (rendered by components/Toasts.vue) ---------- */
export const toasts = reactive([]);
let toastId = 0;
export function toast(msg, kind = 'info') {
  const t = { id: ++toastId, msg, kind, out: false };
  toasts.push(t);
  setTimeout(() => { t.out = true; }, 3600);
  setTimeout(() => { const i = toasts.indexOf(t); if (i >= 0) toasts.splice(i, 1); }, 4100);
}

/* ---------- sounds (Web Audio, no files) ---------- */
let actx;
let mutedRef = () => false;
export function setMutedSource(fn) { mutedRef = fn; }

const SOUNDS = {
  ticket: [[660, 0, .08], [880, .09, .1]],
  good: [[523, 0, .1], [659, .1, .1], [784, .2, .18]],
  bad: [[220, 0, .18], [180, .16, .22]],
  click: [[1200, 0, .03]],
  level: [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .3]],
  msg: [[990, 0, .05]]
};
export function beep(type) {
  if (mutedRef()) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    (SOUNDS[type] || []).forEach(([f, t, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type === 'bad' ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(.0001, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.12, actx.currentTime + t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + t + d);
      o.connect(g); g.connect(actx.destination);
      o.start(actx.currentTime + t); o.stop(actx.currentTime + t + d + .02);
    });
  } catch { /* audio unavailable */ }
}

/* ---------- floating "+120" next to the score ---------- */
export function floatText(text, x, y, kind) {
  const el = document.createElement('div');
  el.className = 'float-pts ' + kind;
  el.textContent = text;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/* ---------- confetti on a full-screen canvas (registered by App.vue) ---------- */
let cv, cx, parts = [], raf = null;
export function setConfettiCanvas(el) { cv = el; cx = el.getContext('2d'); }
export function confetti(n = 140) {
  if (!cv || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ['#ffffff', '#e0e0e0', '#bdbdbd', '#8a8a8a', '#ffffff', '#5c5c5c'];
  for (let i = 0; i < n; i++) parts.push({
    x: innerWidth / 2 + rand(-120, 120), y: innerHeight / 3, vx: rand(-9, 9), vy: rand(-13, -4),
    r: rand(4, 8), c: colors[i % colors.length], rot: rand(0, 6), vr: rand(-.3, .3), life: 1
  });
  if (!raf) raf = requestAnimationFrame(step);
}
function step() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .99; p.rot += p.vr; p.life -= .007;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = Math.max(0, p.life);
    cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); cx.restore();
  });
  parts = parts.filter(p => p.life > 0 && p.y < cv.height + 40);
  raf = parts.length ? requestAnimationFrame(step) : (cx.clearRect(0, 0, cv.width, cv.height), null);
}
