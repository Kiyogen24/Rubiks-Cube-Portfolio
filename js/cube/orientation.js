// Orientation du cube entier : un ressort vers une face, l'élan d'un lancer, la rotation lente de l'accueil
import * as THREE from 'three';
import { S } from '../state.js';
import { TILT, faceForward, nearestOrientation } from './geometry.js';
import { Y, angleBetween, easeOut, qAxis, springQuat } from './math.js';

// Au lâcher, l'élan est projeté comme un défilement, puis le cube se pose sur la face la plus proche de ce point
export function snapFromThrow() {
  const speed = S.w.length();
  const projected = S.base.clone();
  if (speed > 1e-4) projected.premultiply(qAxis(S.w.clone().normalize(), Math.min(Math.PI, speed * 0.25)));
  S.target = nearestOrientation(projected);
}

export function turnTo(face) {
  S.target = TILT.clone().multiply(faceForward(face));
}

// La face bien de face (sans le penché), dans le quart de tour le plus proche de la pose actuelle
export function frontalFor(face) {
  let best = null;
  let bestDot = -1;
  for (let k = 0; k < 4; k++) {
    const q = faceForward(face, (k * Math.PI) / 2);
    const d = Math.abs(q.dot(S.base));
    if (d > bestDot) {
      bestDot = d;
      best = q;
    }
  }
  return best;
}

// Flèches du clavier : un quart de tour du cube entier
export function turnByKeys(axis, sign) {
  const snapped = nearestOrientation(S.target || S.base);
  const untilted = TILT.clone().invert().multiply(snapped);
  S.target = TILT.clone()
    .multiply(qAxis(axis, (sign * Math.PI) / 2))
    .multiply(untilted);
}

// Tour de joie : le cube entier fait `turns` tours sur lui-même, vite puis en ralentissant, et se repose
export function flourish(turns, duration) {
  S.flourish = { t: 0, duration, angle: turns * 2 * Math.PI, start: S.base.clone() };
  S.target = null;
  S.w.set(0, 0, 0);
}

export function updateOrientation(dt, fast) {
  if (S.flourish) {
    const f = S.flourish;
    f.t = Math.min(1, f.t + dt / f.duration);
    S.base.copy(qAxis(Y, f.angle * easeOut(f.t)).multiply(f.start));
    if (f.t === 1) {
      S.flourish = null;
      S.target = nearestOrientation(S.base);
    }
    return;
  }
  if (S.drag && S.drag.type === 'rotate') return; // le cube suit le pointeur
  if (S.target) {
    springQuat(S.base, S.w, S.target, dt, fast ? 1 : 0.8, fast ? 0.2 : 0.42);
    if (S.mode === 'intro' && S.phase === 'ready' && angleBetween(S.base, S.target) < 0.01) S.target = null;
  } else if (S.mode === 'intro' && S.phase === 'ready' && !fast) {
    // le cube vide tourne sur lui-même, légèrement penché
    S.w.lerp(new THREE.Vector3(0, 0.45, 0), 1 - Math.exp(-dt / 0.8));
    S.base.premultiply(qAxis(S.w.clone().normalize(), S.w.length() * dt));
  } else if (S.w.lengthSq() > 1e-8) {
    const speed = S.w.length();
    S.base.premultiply(qAxis(S.w.clone().divideScalar(speed), speed * dt));
    if (S.phase === 'ready') S.w.multiplyScalar(Math.exp(-dt / 0.35));
  }
}
