// Confettis en forme de stickers : un carré de couleur sur le plastique noir du cube, qui tourne en tombant.
// Dessinés sur un canvas par-dessus la page, seulement pendant qu'il en reste.
import { BODY, COLORS } from '../cube/geometry.js';

const canvas = document.createElement('canvas');
canvas.className = 'confetti';
canvas.setAttribute('aria-hidden', 'true');
document.body.append(canvas);
const g = canvas.getContext('2d');
const palette = Object.values(COLORS);
const pieces = [];
let running = false;
let last = 0;

function fit() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', () => running && fit());

// Une gerbe de `count` stickers partant de (x, y) dans la direction `angle` (0 = vers la droite, -π/2 = vers le
// haut), dans un éventail `spread`, à une vitesse autour de `speed` (px/s)
export function burst({ x, y, count = 60, angle = -Math.PI / 2, spread = 2 * Math.PI, speed = 900, size = 11 }) {
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const v = speed * (0.45 + Math.random() * 0.75);
    pieces.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      size: size * (0.7 + Math.random() * 0.6),
      color: palette[Math.floor(Math.random() * palette.length)],
      rot: Math.random() * 2 * Math.PI,
      vr: (Math.random() - 0.5) * 14,
      flip: Math.random() * 2 * Math.PI,
      vflip: 5 + Math.random() * 9,
      age: 0,
      life: 2.2 + Math.random() * 1.3,
    });
  }
  if (running) return;
  running = true;
  fit();
  last = performance.now();
  requestAnimationFrame(frame);
}

function draw(p, alpha) {
  const s = p.size;
  const inset = s * 0.15;
  g.save();
  g.globalAlpha = alpha;
  g.translate(p.x, p.y);
  g.rotate(p.rot);
  g.scale(1, Math.cos(p.flip)); // le sticker tourne sur lui-même en tombant
  g.fillStyle = BODY;
  g.beginPath();
  g.roundRect(-s / 2, -s / 2, s, s, s * 0.24);
  g.fill();
  g.fillStyle = p.color;
  g.beginPath();
  g.roundRect(-s / 2 + inset, -s / 2 + inset, s - 2 * inset, s - 2 * inset, s * 0.16);
  g.fill();
  g.restore();
}

function frame(now) {
  const dt = Math.min(0.04, (now - last) / 1000);
  last = now;
  g.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const drag = Math.exp(-2.2 * dt); // la résistance de l'air
  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    p.age += dt;
    p.vy += 1500 * dt; // la gravité
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.flip += p.vflip * dt;
    if (p.age > p.life || p.y > window.innerHeight + 40) {
      pieces.splice(i, 1);
      continue;
    }
    draw(p, Math.min(1, (p.life - p.age) / 0.5));
  }
  if (pieces.length) {
    requestAnimationFrame(frame);
  } else {
    running = false;
    g.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}
