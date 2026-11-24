/* One animation loop for every CCTV canvas on screen (~9 fps).
   Canvases register when mounted and unregister when removed;
   the loop stops when none are left. */
import { drawFeed } from './cctv.js';

const feeds = new Set(); // { canvas, frame(t) }
let raf = null, last = 0;

export function addFeed(feed) { feeds.add(feed); if (!raf) raf = requestAnimationFrame(loop); }
export function removeFeed(feed) { feeds.delete(feed); }

function loop(now) {
  if (!feeds.size) { raf = null; return; }
  if (now - last > 110) {
    last = now;
    feeds.forEach(f => { if (f.canvas.offsetParent !== null) f.frame(now / 1000); });
  }
  raf = requestAnimationFrame(loop);
}

export { drawFeed };
