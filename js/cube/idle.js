import * as THREE from 'three';
import { app } from '../globals.js';
import { onFrame } from './scene.js';
import { isBusy } from './animator.js';
import { isCubeSectionInView } from '../utils/view.js';
import { clearHover } from '../cards/preview.js';

// Mouvement au repos : sans interaction, le cube tourne lentement, flotte et tourne parfois une face.
// Coupé en vue zoomée, en mode jeu et si l'utilisateur préfère réduire les animations.
const IDLE_DELAY = 4; // s sans interaction avant de démarrer
const SPIN_RPM = 1; // tours par minute
const FLOAT_HEIGHT = 0.05;
const FLOAT_PERIOD = 6; // s
const TWIST_DURATION = 0.55; // s pour un quart de tour
const TWIST_HOLD = 0.3; // s avant de revenir
const SETTLE_DURATION = 0.18; // s pour revenir en place quand l'utilisateur reprend la main
const FIRST_TWIST = 2.5; // s après la pleine intensité
const TWIST_EVERY = [6, 10]; // s entre deux torsions

const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

let idleFor = 0; // s depuis la dernière interaction
let intensity = 0; // 0 → 1
let floatPhase = 0;
let nextTwistIn = FIRST_TWIST;
let twist = null;
const twistRotation = new THREE.Quaternion();

// Tourne la face de la torsion en cours ; à 0, les cubies retrouvent exactement leur place
function setTwistAngle(angle) {
  const spacing = app.cubeSize + app.gap;
  twistRotation.setFromAxisAngle(AXES[twist.axis], angle);
  twist.cubies.forEach((c) => {
    c.position.copy(c.userData.gridPos).multiplyScalar(spacing).applyQuaternion(twistRotation);
    c.quaternion.copy(twistRotation);
  });
}

function startTwist() {
  const axis = ['x', 'y', 'z'][Math.floor(Math.random() * 3)];
  const side = Math.random() < 0.5 ? -1 : 1; // face extérieure : les centres ne bougent pas
  twist = {
    axis,
    cubies: app.cubies.filter((c) => Math.abs(c.userData.gridPos[axis] - side) < 0.1),
    target: ((Math.random() < 0.5 ? -1 : 1) * Math.PI) / 2,
    angle: 0,
    time: 0,
    settling: false,
  };
  app.idleTwisting = true;
}

function endTwist() {
  setTwistAngle(0);
  twist = null;
  app.idleTwisting = false;
}

function advanceTwist(dt) {
  twist.time += dt;
  const t = twist.time;
  if (twist.settling) {
    const p = Math.min(t / SETTLE_DURATION, 1);
    twist.angle = twist.from * (1 - easeOut(p));
    if (p === 1) return endTwist();
  } else if (t < TWIST_DURATION) {
    twist.angle = twist.target * easeInOut(t / TWIST_DURATION);
  } else if (t < TWIST_DURATION + TWIST_HOLD) {
    twist.angle = twist.target;
  } else if (t < 2 * TWIST_DURATION + TWIST_HOLD) {
    twist.angle = twist.target * (1 - easeInOut((t - TWIST_DURATION - TWIST_HOLD) / TWIST_DURATION));
  } else {
    return endTwist();
  }
  setTwistAngle(twist.angle);
}

// L'utilisateur reprend la main : la face tournée revient en place, immédiatement s'il appuie
// (le clic doit viser les cubies à leur vraie place)
function onInteraction(e) {
  idleFor = 0;
  if (!twist) return;
  if (e.type === 'pointerdown') {
    endTwist();
  } else if (!twist.settling) {
    Object.assign(twist, { settling: true, from: twist.angle, time: 0 });
  }
}

function update(dt) {
  idleFor += dt;
  const allowed =
    !reducedMotion.matches &&
    !app.isZoomed &&
    !app.cameraAnimating &&
    !app.isPlayable &&
    !app.isModalOpen &&
    !isBusy() &&
    isCubeSectionInView();

  if (!allowed) {
    intensity = 0;
    nextTwistIn = FIRST_TWIST;
    if (twist) endTwist();
  } else {
    // démarrage progressif, arrêt rapide
    const target = idleFor > IDLE_DELAY ? 1 : 0;
    if (target && intensity < 0.01) clearHover(); // le cube va tourner sous la souris
    const tau = target > intensity ? 0.8 : 0.15;
    intensity += (target - intensity) * (1 - Math.exp(-dt / tau));
  }

  // rotation lente (OrbitControls compte l'angle par image à 60 Hz : vitesse ramenée au temps réel)
  app.controls.autoRotate = intensity > 0.001;
  app.controls.autoRotateSpeed = SPIN_RPM * intensity * dt * 60;

  floatPhase += (dt * 2 * Math.PI) / FLOAT_PERIOD;
  app.rubiksCube.position.y = FLOAT_HEIGHT * intensity * Math.sin(floatPhase);

  if (twist) {
    advanceTwist(dt);
  } else if (intensity > 0.95) {
    nextTwistIn -= dt;
    if (nextTwistIn <= 0) {
      startTwist();
      nextTwistIn = TWIST_EVERY[0] + Math.random() * (TWIST_EVERY[1] - TWIST_EVERY[0]);
    }
  }
}

export function setupIdle() {
  ['pointerdown', 'pointermove', 'wheel', 'keydown'].forEach((type) =>
    window.addEventListener(type, onInteraction, { passive: true }),
  );
  onFrame(update);
}
