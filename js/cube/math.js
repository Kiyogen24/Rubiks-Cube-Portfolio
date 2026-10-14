// Outils de calcul : bornes, courbes d'animation, ressorts et rotations
import * as THREE from 'three';

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);
export const easeOutBack = (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);

export const X = new THREE.Vector3(1, 0, 0);
export const Y = new THREE.Vector3(0, 1, 0);
export const Z = new THREE.Vector3(0, 0, 1);
export const AXES = { x: X, y: Y, z: Z };
export const qAxis = (axis, angle) => new THREE.Quaternion().setFromAxisAngle(axis, angle);
// Angle (en radians) entre deux orientations
export const angleBetween = (a, b) => 2 * Math.acos(clamp(Math.abs(a.dot(b))));

// Ressort réglé comme chez Apple : amortissement (1 = sans rebond) et réponse (en secondes).
// `s` = { x, v } repart toujours de sa position et de sa vitesse : une animation se reprend à tout moment.
export function springStep(s, target, dt, zeta = 1, response = 0.4) {
  const k = Math.pow((2 * Math.PI) / response, 2);
  const c = (4 * Math.PI * zeta) / response;
  const steps = Math.max(1, Math.ceil(dt * 240));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    s.v += (k * (target - s.x) - c * s.v) * h;
    s.x += s.v * h;
  }
}

// Le même ressort pour une orientation `q`, avec sa vitesse angulaire `w` (gardée d'un geste à l'autre)
const tmp = {
  d: new THREE.Quaternion(),
  inv: new THREE.Quaternion(),
  err: new THREE.Vector3(),
  acc: new THREE.Vector3(),
  step: new THREE.Quaternion(),
  axis: new THREE.Vector3(),
};
export function springQuat(q, w, target, dt, zeta = 0.8, response = 0.4) {
  const k = Math.pow((2 * Math.PI) / response, 2);
  const c = (4 * Math.PI * zeta) / response;
  const steps = Math.max(1, Math.ceil(dt * 240));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    tmp.d.copy(target).multiply(tmp.inv.copy(q).invert());
    if (tmp.d.w < 0) tmp.d.set(-tmp.d.x, -tmp.d.y, -tmp.d.z, -tmp.d.w);
    const sinHalf = Math.sqrt(Math.max(0, 1 - tmp.d.w * tmp.d.w));
    const angle = 2 * Math.atan2(sinHalf, tmp.d.w);
    if (sinHalf > 1e-6) tmp.err.set(tmp.d.x, tmp.d.y, tmp.d.z).multiplyScalar(angle / sinHalf);
    else tmp.err.set(0, 0, 0);
    tmp.acc.copy(tmp.err).multiplyScalar(k).addScaledVector(w, -c);
    w.addScaledVector(tmp.acc, h);
    const speed = w.length();
    if (speed > 1e-9) {
      tmp.step.setFromAxisAngle(tmp.axis.copy(w).divideScalar(speed), speed * h);
      q.premultiply(tmp.step);
    }
  }
  q.normalize();
}
