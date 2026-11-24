/* CCTV feeds drawn on a canvas: four simple greyscale scenes in a
   320×180 coordinate space, plus static/"NO SIGNAL" for dead cameras. */
import { clockTime } from './util.js';

const SCENES = {
  lobby(g, t) {
    g.fillStyle = '#2b2b2b'; g.fillRect(0, 0, 320, 180);
    g.fillStyle = '#3b3b3b'; g.beginPath(); g.moveTo(0, 180); g.lineTo(60, 110); g.lineTo(260, 110); g.lineTo(320, 180); g.fill();
    g.strokeStyle = '#4a4a4a'; g.lineWidth = 1;
    for (let x = -200; x < 520; x += 40) { g.beginPath(); g.moveTo(160 + (x - 160) * .4, 110); g.lineTo(x, 180); g.stroke(); }
    g.fillStyle = '#1c1c1c'; g.fillRect(200, 38, 64, 72); // glass door
    g.strokeStyle = '#6a6a6a'; g.strokeRect(200, 38, 64, 72); g.beginPath(); g.moveTo(232, 38); g.lineTo(232, 110); g.stroke();
    g.fillStyle = '#555'; g.fillRect(40, 88, 110, 30); g.fillStyle = '#666'; g.fillRect(40, 84, 110, 6); // reception desk
    g.fillStyle = '#4d4d4d'; g.font = 'bold 13px Inter, sans-serif'; g.fillText('XYZ100', 70, 58);
    const walk = (off, speed, y, s) => {
      const x = ((t * speed + off) % 380) - 30;
      const leg = Math.sin(t * 8 + off) * 4 * s;
      g.fillStyle = '#0d0d0d';
      g.beginPath(); g.arc(x, y - 30 * s, 6 * s, 0, 7); g.fill();
      g.fillRect(x - 6 * s, y - 23 * s, 12 * s, 20 * s);
      g.fillRect(x - 5 * s + leg, y - 3 * s, 4 * s, 14 * s); g.fillRect(x + 1 * s - leg, y - 3 * s, 4 * s, 14 * s);
    };
    walk(0, 22, 140, 1.1); walk(190, 14, 122, .8);
  },
  pantry(g, t) {
    g.fillStyle = '#2e2e2e'; g.fillRect(0, 0, 320, 180);
    g.fillStyle = '#3a3a3a'; g.fillRect(0, 120, 320, 60);
    g.fillStyle = '#4b4b4b'; g.fillRect(20, 70, 190, 30); g.fillStyle = '#5c5c5c'; g.fillRect(20, 66, 190, 6); // counter
    g.fillStyle = '#222'; g.fillRect(40, 30, 60, 26); g.fillRect(120, 30, 60, 26); // cabinets
    g.fillStyle = '#5a5a5a'; g.fillRect(236, 26, 52, 98); g.fillStyle = '#444'; g.fillRect(236, 62, 52, 2); g.fillRect(280, 36, 3, 18); g.fillRect(280, 72, 3, 30); // fridge
    g.fillStyle = '#505050'; g.beginPath(); g.ellipse(120, 140, 56, 12, 0, 0, 7); g.fill(); // table
    g.fillStyle = '#ddd'; g.fillRect(110, 130, 7, 8); // mug
    const cyc = t % 16; // somebody keeps visiting the fridge
    if (cyc < 6) {
      const x = cyc < 1.5 ? 330 - cyc * 40 : cyc > 4.5 ? 270 + (cyc - 4.5) * 40 : 270;
      g.fillStyle = '#0d0d0d';
      g.beginPath(); g.arc(x, 66, 7, 0, 7); g.fill(); g.fillRect(x - 8, 74, 16, 30); g.fillRect(x - 7, 104, 6, 18); g.fillRect(x + 1, 104, 6, 18);
      if (cyc > 1.5 && cyc < 4.5) { g.fillStyle = '#5a5a5a'; g.fillRect(288, 26, 18, 98); } // fridge door open
    }
  },
  server(g, t) {
    g.fillStyle = '#161616'; g.fillRect(0, 0, 320, 180);
    g.fillStyle = '#202020'; g.fillRect(0, 150, 320, 30);
    for (let r = 0; r < 5; r++) {
      const x = 18 + r * 60;
      g.fillStyle = '#2d2d2d'; g.fillRect(x, 24, 44, 128);
      g.fillStyle = '#242424';
      for (let y = 30; y < 146; y += 10) g.fillRect(x + 4, y, 36, 7);
      for (let y = 30; y < 146; y += 10) {
        if (Math.sin(t * (3 + r) + y * .7 + r) > .2) { g.fillStyle = '#f0f0f0'; g.fillRect(x + 34, y + 2, 3, 3); }
      }
    }
  },
  carpark(g, t) {
    g.fillStyle = '#262626'; g.fillRect(0, 0, 320, 180);
    g.fillStyle = '#333'; g.beginPath(); g.moveTo(0, 180); g.lineTo(80, 70); g.lineTo(240, 70); g.lineTo(320, 180); g.fill();
    g.strokeStyle = '#8a8a8a'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(90 + i * 28, 75); g.lineTo(20 + i * 56, 175); g.stroke(); }
    g.fillStyle = '#3d3d3d'; g.fillRect(30, 20, 18, 150); g.fillRect(270, 20, 18, 150); // pillars
    const car = (x, y, w) => { g.fillStyle = '#141414'; g.fillRect(x, y, w, w * .45); g.fillStyle = '#4a4a4a'; g.fillRect(x + w * .15, y + 4, w * .7, w * .16); };
    car(70, 120, 60); car(180, 112, 54);
    g.fillStyle = Math.sin(t * 23) > .85 ? '#3a3a3a' : '#bdbdbd'; g.fillRect(120, 6, 80, 4); // flickering light
  }
};
const SCENE_ORDER = ['lobby', 'pantry', 'server', 'carpark'];

// draw one frame of camera `cam` (index i) at time t (seconds)
export function drawFeed(canvas, cam, i, t, elapsed) {
  const g = canvas.getContext('2d'), k = canvas.width / 320;
  g.save(); g.scale(k, k);
  if (cam.status === 'Online') {
    SCENES[cam.scene || SCENE_ORDER[i % 4]](g, t);
    for (let n = 0; n < 260; n++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .08})`; g.fillRect(Math.random() * 320, Math.random() * 180, 2, 2); }
  } else {
    for (let y = 0; y < 180; y += 4) for (let x = 0; x < 320; x += 4) {
      const v = cam.status === 'Booting' ? 10 + Math.random() * 25 : Math.random() * 200;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 4, 4);
    }
    const label = cam.status === 'Booting' ? 'CONNECTING' + '.'.repeat(1 + Math.floor(t * 3) % 3) : 'NO SIGNAL';
    g.fillStyle = '#000'; g.fillRect(96, 74, 128, 32); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(96.5, 74.5, 127, 31);
    g.fillStyle = '#fff'; g.font = 'bold 13px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillText(label, 160, 95); g.textAlign = 'left';
  }
  // scanlines and on-screen text, like a real NVR
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < 180; y += 3) g.fillRect(0, y, 320, 1);
  const [hh, mm, ss] = clockTime(elapsed);
  g.font = '9px "JetBrains Mono", monospace';
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(4, 4, g.measureText(cam.id).width + 8, 13); g.fillRect(222, 4, 94, 13);
  g.fillStyle = '#fff'; g.fillText(cam.id, 8, 14); g.fillText(`MON ${hh}:${mm}:${ss}`, 228, 14);
  if (cam.status === 'Online' && Math.floor(t * 1.5) % 2) { g.beginPath(); g.arc(12, 168, 3, 0, 7); g.fill(); g.fillText('REC', 18, 171); }
  g.restore();
}
