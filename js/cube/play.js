// Le jeu : tourner une rangée au doigt, mélanger, résoudre (Kociemba dans un worker, sinon à rebours)
import * as THREE from 'three';
import { S, $, reduced } from '../state.js';
import { t } from '../i18n.js';
import { SPACING } from './geometry.js';
import { AXES, clamp, easeInOut, lerp, springStep } from './math.js';
import { cube, cubies, pivot, project } from './scene.js';

const QUARTER = Math.PI / 2;

// Message sous le cube : '', 'shuffling', 'shuffled', 'solving' ou 'bravo' (retraduit si la langue change) ;
// après une résolution à la main, le score s'affiche dessous
const statusEl = $('#status');
const scoreEl = $('#score');
export function setStatus(key) {
  S.status = key;
  statusEl.textContent = key ? t()[key] : '';
  scoreEl.textContent = key === 'bravo' && S.score ? t().score(S.score.moves, S.score.time) : '';
}

// Le jeu est occupé : une rangée tourne, des mouvements attendent, le solveur cherche, ou c'est la fête
export const busy = () => Boolean(S.layer || S.queue.length || S.solving || S.celebrating);

// Prévient la page qu'un cube vient d'être résolu, à la main ou par le bouton (main.js : la célébration)
let solvedHandler = null;
export function onSolved(handler) {
  solvedHandler = handler;
}

// ---------- Une rangée ----------
function layerCubies(axis, layer) {
  if (layer === 'all') return cubies.slice(); // rotation du cube entier (x, y, z)
  return cubies.filter((c) => Math.round(c.position[axis] / SPACING) === layer);
}

function beginLayer(axis, layer) {
  cube.updateMatrixWorld(true);
  pivot.quaternion.identity();
  pivot.updateMatrixWorld(true);
  const group = layerCubies(axis, layer);
  group.forEach((c) => pivot.attach(c));
  S.layer = { axis, layer, group, anim: { x: 0, v: 0 }, vel: 0, target: null, scripted: null };
}

function setLayerAngle(angle) {
  S.layer.anim.x = angle;
  pivot.quaternion.setFromAxisAngle(AXES[S.layer.axis], angle);
}

// Remet un cubie pile sur la grille après un quart de tour, sinon les arrondis s'accumulent
const m4 = new THREE.Matrix4();
function snapCubie(c) {
  c.position.set(
    Math.round(c.position.x / SPACING) * SPACING,
    Math.round(c.position.y / SPACING) * SPACING,
    Math.round(c.position.z / SPACING) * SPACING,
  );
  m4.makeRotationFromQuaternion(c.quaternion);
  const el = m4.elements;
  [0, 1, 2, 4, 5, 6, 8, 9, 10].forEach((i) => (el[i] = Math.round(el[i])));
  c.quaternion.setFromRotationMatrix(m4);
  c.userData.rest.copy(c.position);
}

function finishLayer(record) {
  const L = S.layer;
  pivot.quaternion.setFromAxisAngle(AXES[L.axis], L.target);
  pivot.updateMatrixWorld(true);
  L.group.forEach((c) => {
    cube.attach(c);
    snapCubie(c);
  });
  pivot.quaternion.identity();
  const turns = Math.round(L.target / QUARTER);
  S.layer = null;
  S.markDirty = true;
  if (!record) return;
  if (turns) {
    S.moves.push({ axis: L.axis, layer: L.layer, turns });
    S.userMoves++;
  }
  if (isSolved()) {
    S.moves = [];
    if (S.userMoves) solvedHandler?.({ byHand: true, moves: S.userMoves, time: performance.now() - S.shuffledAt });
    else setStatus('');
  } else if (turns) {
    setStatus('shuffled');
  }
}

// Une solution ne s'occupe pas des centres : comme le logo d'un vrai cube, la photo du centre du haut peut
// finir tournée sur elle-même ; tout se remet droit en quittant le jeu (normalizeSolved)
const isCenter = (c) => Object.values(c.userData.grid).filter((v) => v !== 0).length < 2; // centres et cubie du milieu

// Début d'un glissé sur un sticker : des deux axes du plan de la face touchée, on garde celui que le geste suit le mieux
export function startLayerDrag(d, tx, ty) {
  cube.updateMatrixWorld(true);
  const p = cube.worldToLocal(d.hit.point.clone());
  const n = d.hit.localNormal;
  const len = Math.hypot(tx, ty);
  let best = null;
  for (const name of ['x', 'y', 'z']) {
    const a = AXES[name];
    if (Math.abs(a.dot(n)) > 0.5) continue;
    const tan = new THREE.Vector3().crossVectors(a, p);
    if (tan.lengthSq() < 1e-6) continue;
    tan.normalize();
    const p0 = project(cube.localToWorld(p.clone()));
    const p1 = project(cube.localToWorld(p.clone().addScaledVector(tan, 0.2)));
    const sx = p1.x - p0.x;
    const sy = p1.y - p0.y;
    const sl = Math.hypot(sx, sy);
    if (sl < 1e-3) continue;
    const align = (tx * sx + ty * sy) / (len * sl);
    if (!best || Math.abs(align) > Math.abs(best.align)) {
      const rPerp = Math.max(1.2, p.clone().addScaledVector(a, -p.dot(a)).length());
      best = { name, align, dir: { x: sx / sl, y: sy / sl }, pxPerRad: (sl / 0.2) * rPerp };
    }
  }
  if (!best) {
    d.type = 'rotate';
    return;
  }
  beginLayer(best.name, Math.round(d.hit.cubie.position[best.name] / SPACING));
  d.type = 'layer';
  d.dir = best.dir;
  d.pxPerRad = best.pxPerRad;
}

// Un geste, un quart de tour. Pendant le glissé, la rangée suit le doigt (un peu plus vite que lui) ; passé un
// tiers de quart de tour, elle se cale d'elle-même sur le quart de tour et le geste est terminé : la suite du
// glissé ne fait plus rien, et une rangée ne fait jamais deux quarts de tour d'un coup
const GAIN = 1.4;
const COMMIT = 0.49; // environ 28°
export function dragLayer(d, clientX, clientY, dt) {
  const L = S.layer;
  const along = (clientX - d.sx) * d.dir.x + (clientY - d.sy) * d.dir.y;
  const angle = (along / d.pxPerRad) * GAIN;
  L.vel = lerp(L.vel, (angle - L.anim.x) / dt, 0.5);
  if (Math.abs(angle) >= COMMIT) {
    L.anim.v = clamp(L.vel, -6, 6); // le calage part de la vitesse du doigt
    L.target = Math.sign(angle) * QUARTER;
    d.type = 'committed';
    return;
  }
  setLayerAngle(angle);
}

// Lâchée avant de se caler, la rangée revient en place, sauf petit coup rapide qui fait le quart de tour
export function releaseLayer(still) {
  const L = S.layer;
  if (still) L.vel *= 0.2;
  const a = L.anim.x;
  const flick = Math.abs(a) > 0.15 && Math.abs(L.vel) > 4 && Math.sign(L.vel) === Math.sign(a);
  L.target = flick ? Math.sign(a) * QUARTER : 0;
}

// Clavier : U, D, L, R, F, B tournent la face vue en haut, en bas, à gauche, à droite, devant ou derrière,
// dans le sens des aiguilles d'une montre vu depuis cette face (`inverse` : dans l'autre sens)
const VIEW = { U: [0, 1, 0], D: [0, -1, 0], L: [-1, 0, 0], R: [1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
export function turnFace(letter, inverse) {
  if (S.solving || S.celebrating || S.drag) return;
  const n = new THREE.Vector3(...VIEW[letter]).applyQuaternion((S.target || S.base).clone().invert());
  const axis = ['x', 'y', 'z'].reduce((best, k) => (Math.abs(n[k]) > Math.abs(n[best]) ? k : best), 'x');
  const side = Math.sign(n[axis]);
  S.queue.push({ axis, layer: side, turns: inverse ? side : -side, duration: 0.16, record: true });
}

export function updateLayer(dt) {
  const L = S.layer;
  if (!L) {
    runQueue();
    return;
  }
  if (L.scripted) {
    L.scripted.t += dt / L.scripted.duration;
    setLayerAngle(L.target * easeInOut(Math.min(1, L.scripted.t)));
    if (L.scripted.t >= 1) {
      finishLayer(L.record); // un tour au clavier compte comme un tour à la main
      if (!S.queue.length) S.queueDone?.();
    }
    return;
  }
  if (L.target === null) return; // la rangée suit encore le doigt
  springStep(L.anim, L.target, dt, 1, 0.18); // calage net, sans rebond
  pivot.quaternion.setFromAxisAngle(AXES[L.axis], L.anim.x);
  if (Math.abs(L.anim.x - L.target) < 0.002 && Math.abs(L.anim.v) < 0.02) finishLayer(true);
}

function runQueue() {
  if (!S.queue.length || S.drag) return;
  const m = S.queue.shift();
  beginLayer(m.axis, m.layer);
  S.layer.record = Boolean(m.record);
  S.layer.target = m.turns * QUARTER;
  S.layer.scripted = { t: 0, duration: reduced.matches ? 0.001 : m.duration };
}

// ---------- Mélanger, résoudre ----------
export function shuffle() {
  if (busy()) return;
  const list = [];
  let lastAxis = null;
  for (let i = 0; i < 22; i++) {
    let axis;
    do {
      axis = ['x', 'y', 'z'][Math.floor(Math.random() * 3)];
    } while (axis === lastAxis);
    lastAxis = axis;
    const turns = [1, -1, 2][Math.floor(Math.random() * 3)];
    list.push({ axis, layer: Math.random() < 0.5 ? -1 : 1, turns, duration: 0.1 });
  }
  list.forEach((m) => S.moves.push({ axis: m.axis, layer: m.layer, turns: m.turns }));
  S.userMoves = 0;
  S.scrambled = false;
  S.score = null;
  setStatus('shuffling');
  S.queue.push(...list);
  S.queueDone = () => {
    S.queueDone = null;
    S.scrambled = true; // le chrono part quand le mélange est fini
    S.shuffledAt = performance.now();
    setStatus('shuffled');
  };
}

let solveToken = 0;
export async function solve(then) {
  if (busy()) return;
  const history = S.moves.slice();
  S.moves = [];
  if (!history.length) {
    then?.();
    return;
  }
  S.solving = true;
  S.scrambled = false; // résolu par le bouton, pas à la main
  setStatus('solving');
  const token = solveToken;
  let moves = null;
  try {
    // cubejs (Kociemba) : le cube entier est d'abord remis droit (centres à leur place), puis résolu
    const alg = history.map(moveToAlg).filter(Boolean).join(' ');
    const { upright, solution } = await postToSolver('solve', { alg });
    console.log('[jeu] solution cubejs :', `${upright} ${solution}`.trim());
    moves = algToMoves(`${upright} ${solution}`);
  } catch (e) {
    console.warn('[jeu] cubejs indisponible, résolution à rebours :', e);
  }
  if (token !== solveToken) return; // le cube a été remis en ordre entre-temps
  S.solving = false;
  moves ||= history.reverse().map((m) => ({ ...m, turns: -m.turns }));
  const finish = () => {
    S.queueDone = null;
    S.userMoves = 0;
    setStatus('');
    solvedHandler?.({ byHand: false });
    then?.();
  };
  if (!moves.length) {
    finish();
    return;
  }
  S.queue.push(...moves.map((m) => ({ ...m, duration: 0.13 * Math.abs(m.turns) })));
  S.queueDone = finish;
}

// Résolu, quelle que soit l'orientation : coins et arêtes ont tourné ensemble autour du centre
// (un centre tourné sur lui-même ne change pas les couleurs, il compte comme à sa place)
export function isSolved() {
  const q0 = cubies[0].quaternion;
  const p = new THREE.Vector3();
  return cubies.every(
    (c) =>
      (isCenter(c) || Math.abs(c.quaternion.dot(q0)) > 0.999) &&
      p.copy(c.userData.home).applyQuaternion(q0).distanceTo(c.position) < 0.01,
  );
}

// Résolu dans une autre orientation : la rotation commune passe au cube entier
export function normalizeSolved() {
  const q0 = cubies[0].quaternion.clone();
  if (Math.abs(q0.w) < 0.9999) {
    S.base.multiply(q0);
    cube.quaternion.copy(S.base);
  }
  cubies.forEach((c) => {
    c.quaternion.identity();
    c.position.copy(c.userData.home);
    c.userData.rest.copy(c.userData.home);
  });
}

// Remise en ordre immédiate, sans animation
export function resetCube() {
  solveToken++;
  S.solving = false;
  S.scrambled = false;
  S.queue.length = 0;
  S.queueDone = null;
  if (S.layer) {
    S.layer.group.forEach((c) => cube.attach(c));
    pivot.quaternion.identity();
    S.layer = null;
  }
  cubies.forEach((c) => {
    c.quaternion.identity();
    c.position.copy(c.userData.home);
    c.userData.rest.copy(c.userData.home);
  });
  S.moves = [];
  S.markDirty = true;
}

// ---------- Solveur de Kociemba (cubejs), dans un worker car son initialisation bloque plusieurs secondes ----------
// Notation standard → rangée. Un quart de tour positif fait +90° autour de l'axe ;
// `cw` est le sens horaire de la notation, vu depuis la face concernée.
const NOTATION = {
  R: { axis: 'x', layer: 1, cw: -1 },
  L: { axis: 'x', layer: -1, cw: 1 },
  M: { axis: 'x', layer: 0, cw: 1 }, // tranche du milieu, dans le sens de L
  x: { axis: 'x', layer: 'all', cw: -1 }, // le cube entier, dans le sens de R
  U: { axis: 'y', layer: 1, cw: -1 },
  D: { axis: 'y', layer: -1, cw: 1 },
  E: { axis: 'y', layer: 0, cw: 1 }, // dans le sens de D
  y: { axis: 'y', layer: 'all', cw: -1 }, // dans le sens de U
  F: { axis: 'z', layer: 1, cw: -1 },
  B: { axis: 'z', layer: -1, cw: 1 },
  S: { axis: 'z', layer: 0, cw: -1 }, // dans le sens de F
  z: { axis: 'z', layer: 'all', cw: -1 }, // dans le sens de F
};

function moveToAlg({ axis, layer, turns }) {
  const name = Object.keys(NOTATION).find((k) => NOTATION[k].axis === axis && NOTATION[k].layer === layer);
  const quarters = ((turns % 4) + 4) % 4; // 1, 2 ou 3 quarts de tour positifs
  if (!name || !quarters) return '';
  if (quarters === 2) return `${name}2`;
  return name + ((quarters === 1) === (NOTATION[name].cw === 1) ? '' : "'");
}

function algToMoves(alg) {
  return alg
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const n = NOTATION[token[0]];
      const suffix = token.slice(1);
      if (!n || !['', "'", '2'].includes(suffix)) throw new Error(`Mouvement inconnu : ${token}`);
      const turns = suffix === '2' ? 2 * n.cw : suffix === "'" ? -n.cw : n.cw;
      return { axis: n.axis, layer: n.layer, turns };
    });
}

let worker = null;
let workerFailed = false;
const requests = new Map();
let nextRequestId = 0;

// Lancé dès qu'on entre dans le jeu : les tables de Kociemba se calculent pendant le mélange
export function startSolver() {
  if (worker || workerFailed || typeof Worker === 'undefined') return;
  worker = new Worker(new URL('./solver-worker.js', import.meta.url));
  worker.onmessage = (e) => {
    const request = requests.get(e.data.id);
    if (!request) return;
    requests.delete(e.data.id);
    if (e.data.ok) request.resolve(e.data);
    else request.reject(new Error(e.data.error));
  };
  // cubejs n'a pas pu être chargé (réseau, CDN…) : on résoudra à rebours
  worker.onerror = (e) => {
    worker.terminate();
    worker = null;
    workerFailed = true;
    requests.forEach((request) => request.reject(new Error(e.message || 'solver worker error')));
    requests.clear();
  };
  postToSolver('init').catch(() => {});
}

function postToSolver(cmd, payload = {}, timeout = 20000) {
  startSolver();
  if (!worker) return Promise.reject(new Error('solver worker unavailable'));
  return new Promise((resolve, reject) => {
    const id = ++nextRequestId;
    const timer = setTimeout(() => {
      requests.delete(id);
      reject(new Error('solver timeout'));
    }, timeout);
    requests.set(id, {
      resolve: (data) => {
        clearTimeout(timer);
        resolve(data);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });
    worker.postMessage({ cmd, id, ...payload });
  });
}
