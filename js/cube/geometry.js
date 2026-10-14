// Le cube : ses faces et leurs couleurs, la case de chaque sticker et les 24 façons de le poser
import * as THREE from 'three';
import { X, Y, Z, qAxis } from './math.js';

export const FACES = ['right', 'left', 'top', 'bottom', 'front', 'back']; // ordre des matériaux d'un BoxGeometry
export const COLORS = {
  right: '#000FFF',
  left: '#00994C',
  top: '#FFFFFF',
  bottom: '#FFE100',
  front: '#B90000',
  back: '#FF8000',
};
export const BODY = '#0c0c0e'; // le plastique noir du cube
export const NORMALS = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};
// Haut de chaque face quand on la regarde de face
const UPS = {
  right: [0, 1, 0],
  left: [0, 1, 0],
  front: [0, 1, 0],
  back: [0, 1, 0],
  top: [0, 0, -1],
  bottom: [0, 0, 1],
};
export const SPACING = 1.001; // les cubies se touchent

// Case (0 à 8) d'un cubie sur une face vue de face : de gauche à droite, puis de haut en bas
export function cellIndex(face, p) {
  switch (face) {
    case 'right':
      return (2 - (p.y + 1)) * 3 + (2 - (p.z + 1));
    case 'left':
      return (2 - (p.y + 1)) * 3 + (p.z + 1);
    case 'back':
      return (2 - (p.y + 1)) * 3 + (2 - (p.x + 1));
    case 'front':
      return (2 - (p.y + 1)) * 3 + (p.x + 1);
    default:
      return (2 - (p.z + 1)) * 3 + (p.x + 1);
  }
}

// Légèrement penché, pour voir trois faces
export const TILT = qAxis(X, 0.32).multiply(qAxis(Y, -0.45));

// Orientation qui montre `face` de face, tournée de `roll` autour de l'axe de vue
export function faceForward(face, roll = 0) {
  const n = new THREE.Vector3(...NORMALS[face]);
  const u = new THREE.Vector3(...UPS[face]);
  const r = new THREE.Vector3().crossVectors(u, n);
  const m = new THREE.Matrix4().makeBasis(r, u, n).transpose();
  return qAxis(Z, roll).multiply(new THREE.Quaternion().setFromRotationMatrix(m));
}

const ORIENTATIONS = FACES.flatMap((face) => [0, 1, 2, 3].map((k) => faceForward(face, (k * Math.PI) / 2)));

// Parmi les 24 poses (penchées), la plus proche de q
export function nearestOrientation(q) {
  const untilted = TILT.clone().invert().multiply(q);
  let best = ORIENTATIONS[0];
  let bestDot = -1;
  for (const o of ORIENTATIONS) {
    const d = Math.abs(untilted.dot(o));
    if (d > bestDot) {
      bestDot = d;
      best = o;
    }
  }
  return TILT.clone().multiply(best);
}
