import * as THREE from 'three';
import { app } from '../globals.js';

// En vue zoomée, le cubie survolé se soulève un peu vers l'écran.
// Mouvement amorti à chaque image : il suit la souris sans à-coup, même si elle change de sticker en route.
const LIFT = 0.08;
const TAU = 0.045; // s, environ 95 % du chemin en 135 ms
const NORMALS = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const lifts = new Map(); // cubie -> { normal, offset, target }

function place(cubie, normal, offset) {
  cubie.position
    .copy(cubie.userData.gridPos)
    .multiplyScalar(app.cubeSize + app.gap)
    .addScaledVector(normal, offset);
}

export function liftCubie(cubie, faceType) {
  if (reducedMotion.matches || !NORMALS[faceType]) return;
  const lift = lifts.get(cubie) || { offset: 0 };
  lift.normal = new THREE.Vector3(...NORMALS[faceType]);
  lift.target = LIFT;
  lifts.set(cubie, lift);
}

export function dropCubie(cubie) {
  const lift = lifts.get(cubie);
  if (lift) lift.target = 0;
}

// Tous les cubies reviennent immédiatement en place (sortie du zoom)
export function dropAll() {
  lifts.forEach((lift, cubie) => place(cubie, lift.normal, 0));
  lifts.clear();
}

export function updateLifts(dt) {
  const k = 1 - Math.exp(-dt / TAU);
  lifts.forEach((lift, cubie) => {
    lift.offset += (lift.target - lift.offset) * k;
    if (lift.target === 0 && lift.offset < 1e-3) {
      place(cubie, lift.normal, 0);
      lifts.delete(cubie);
    } else {
      place(cubie, lift.normal, lift.offset);
    }
  });
}
