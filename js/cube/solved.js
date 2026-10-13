import * as THREE from 'three';
import { app } from '../globals.js';

// Les 24 rotations propres du cube (matrices de permutation signées de déterminant +1)
function generate24RotationMatrices() {
  const perms = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  const signs = [
    [1, 1, 1],
    [1, 1, -1],
    [1, -1, 1],
    [1, -1, -1],
    [-1, 1, 1],
    [-1, 1, -1],
    [-1, -1, 1],
    [-1, -1, -1],
  ];
  const mats = [];
  for (const p of perms) {
    for (const s of signs) {
      const m = [
        s[0] * (p[0] === 0 ? 1 : 0),
        s[1] * (p[0] === 1 ? 1 : 0),
        s[2] * (p[0] === 2 ? 1 : 0),
        s[0] * (p[1] === 0 ? 1 : 0),
        s[1] * (p[1] === 1 ? 1 : 0),
        s[2] * (p[1] === 2 ? 1 : 0),
        s[0] * (p[2] === 0 ? 1 : 0),
        s[1] * (p[2] === 1 ? 1 : 0),
        s[2] * (p[2] === 2 ? 1 : 0),
      ];
      const col0 = new THREE.Vector3(m[0], m[3], m[6]);
      const col1 = new THREE.Vector3(m[1], m[4], m[7]);
      const col2 = new THREE.Vector3(m[2], m[5], m[8]);
      const det = col0.dot(col1.clone().cross(col2));
      if (det > 0.5) mats.push(m);
    }
  }
  return mats;
}
const ROTATIONS = generate24RotationMatrices();

// Le cube est-il résolu, quelle que soit son orientation globale ?
export function isCubeSolved(epsilon = 0.25) {
  try {
    if (!app.cubies.length || !app.rubiksCube) return false;

    // positions courantes des cubies, relatives au centre du cube (repère du monde)
    const cubeCenter = new THREE.Vector3();
    app.rubiksCube.getWorldPosition(cubeCenter);
    const currents = app.cubies.map((c) => c.getWorldPosition(new THREE.Vector3()).sub(cubeCenter));
    const homes = app.cubies.map((c) => c.userData.homePos);

    for (const m of ROTATIONS) {
      const placed = homes.every((h, i) => {
        const r = new THREE.Vector3(
          m[0] * h.x + m[1] * h.y + m[2] * h.z,
          m[3] * h.x + m[4] * h.y + m[5] * h.z,
          m[6] * h.x + m[7] * h.y + m[8] * h.z,
        );
        return r.distanceTo(currents[i]) <= epsilon;
      });
      if (!placed) continue;

      // positions correctes : vérifier aussi l'orientation des coins et des arêtes
      // (un centre peut tourner sur lui-même sans changer les couleurs visibles)
      const mx = new THREE.Vector3(m[0], m[3], m[6]); // image de l'axe x par la rotation
      const my = new THREE.Vector3(m[1], m[4], m[7]); // image de l'axe y par la rotation
      const q = new THREE.Quaternion();
      const oriented = app.cubies.every((c, i) => {
        const h = homes[i];
        if ([h.x, h.y, h.z].filter((v) => v !== 0).length < 2) return true; // centres et cubie central
        c.getWorldQuaternion(q);
        return (
          new THREE.Vector3(1, 0, 0).applyQuaternion(q).distanceTo(mx) <= epsilon &&
          new THREE.Vector3(0, 1, 0).applyQuaternion(q).distanceTo(my) <= epsilon
        );
      });
      if (oriented) return true;
    }
    return false;
  } catch (e) {
    console.warn('[isCubeSolved] failed', e);
    return false;
  }
}
