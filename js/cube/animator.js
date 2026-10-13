import * as THREE from 'three';
import { app } from '../globals.js';

let isAnimating = false;
let isSolving = false;
let moveQueue = [];
let completedMoves = [];
let onSolvedCallback = null;

// Correspondance notation standard <-> représentation interne { layer, number, orientation }.
// orientation 1 = rotation de +90° autour de l'axe (col: x, row: y, depth: z) ;
// cw = orientation qui correspond au sens horaire de la notation (vu depuis la face concernée).
const NOTATION = {
  R: { layer: 'col', number: 1, cw: 0 },
  L: { layer: 'col', number: -1, cw: 1 },
  M: { layer: 'col', number: 0, cw: 1 },      // tranche centrale verticale, même sens que L
  x: { layer: 'col', number: 'all', cw: 0 },  // rotation du cube entier, même sens que R
  U: { layer: 'row', number: 1, cw: 0 },
  D: { layer: 'row', number: -1, cw: 1 },
  E: { layer: 'row', number: 0, cw: 1 },      // tranche équatoriale, même sens que D
  y: { layer: 'row', number: 'all', cw: 0 },  // même sens que U
  F: { layer: 'depth', number: 1, cw: 0 },
  B: { layer: 'depth', number: -1, cw: 1 },
  S: { layer: 'depth', number: 0, cw: 0 },    // tranche debout, même sens que F
  z: { layer: 'depth', number: 'all', cw: 0 } // même sens que F
};

// utilitaire : mappe la représentation interne d'un mouvement vers la notation standard du cube
function moveToAlg(m) {
  const base = Object.keys(NOTATION).find(k => NOTATION[k].layer === m.layer && NOTATION[k].number === m.number);
  if (!base) return '';
  return base + (m.orientation === NOTATION[base].cw ? '' : "'");
}

// convertit un algorithme en notation standard (ex. "x R U2 M'") en mouvements internes
function algToMoves(alg) {
  return alg.split(/\s+/).filter(Boolean).map(token => {
    const n = NOTATION[token[0]];
    const suffix = token.slice(1);
    if (!n || !['', "'", '2'].includes(suffix)) throw new Error(`Mouvement inconnu : ${token}`);
    return {
      layer: n.layer,
      number: n.number,
      orientation: suffix === "'" ? 1 - n.cw : n.cw,
      turns: suffix === '2' ? 2 : 1 // "2" = demi-tour
    };
  });
}

// Solveur Kociemba (cubejs) exécuté dans un worker, car son initialisation bloque plusieurs secondes
let solverWorker = null;
let solverFailed = false;
const solverRequests = new Map();
let nextSolverRequestId = 0;

function startSolver() {
  if (solverWorker || solverFailed || typeof Worker === 'undefined') return;
  solverWorker = new Worker(new URL('./solver-worker.js', import.meta.url));
  solverWorker.onmessage = (e) => {
    const request = solverRequests.get(e.data.id);
    if (!request) return;
    solverRequests.delete(e.data.id);
    if (e.data.ok) request.resolve(e.data);
    else request.reject(new Error(e.data.error));
  };
  // cubejs n'a pas pu être chargé (réseau, CDN...) : abandonner le worker pour basculer sur le repli
  solverWorker.onerror = (e) => {
    solverWorker.terminate();
    solverWorker = null;
    solverFailed = true;
    solverRequests.forEach(request => request.reject(new Error(e.message || 'solver worker error')));
    solverRequests.clear();
  };
  // précalcule les tables de Kociemba en arrière-plan (pendant le mélange)
  postToSolver('init').catch(() => {});
}

function postToSolver(cmd, payload = {}, timeout = 20000) {
  startSolver();
  if (!solverWorker) return Promise.reject(new Error('solver worker unavailable'));
  return new Promise((resolve, reject) => {
    const id = ++nextSolverRequestId;
    const timer = setTimeout(() => {
      solverRequests.delete(id);
      reject(new Error('solver timeout'));
    }, timeout);
    solverRequests.set(id, {
      resolve: (data) => { clearTimeout(timer); resolve(data); },
      reject: (err) => { clearTimeout(timer); reject(err); }
    });
    solverWorker.postMessage({ cmd, id, ...payload });
  });
}

// retourne la liste des cubies appartenant à une couche donnée
function getLayerCubies(layer, number) {
  return app.cubies.filter(cubie => {
    const p = cubie.userData.gridPos;
    if (!p) return false;
    if (number === 'all') return true; // rotation du cube entier (x, y, z)
    if (layer === 'row') return Math.abs(p.y - number) < 0.1;
    if (layer === 'col') return Math.abs(p.x - number) < 0.1;
    if (layer === 'depth') return Math.abs(p.z - number) < 0.1;
    return false;
  });
}

// arrondit une valeur de grille à -1, 0 ou 1
function roundGridVal(v) {
  // assure -1, 0 ou 1
  if (Math.abs(v - 1) < 0.3) return 1;
  if (Math.abs(v + 1) < 0.3) return -1;
  return 0;
}

// fait tourner une position de grille autour d'un axe et renvoie la nouvelle position arrondie
function rotateVecGrid(pos, axis, angle) {
  const v = new THREE.Vector3(pos.x, pos.y, pos.z);
  const q = new THREE.Quaternion();
  if (axis === 'x') q.setFromAxisAngle(new THREE.Vector3(1,0,0), angle);
  if (axis === 'y') q.setFromAxisAngle(new THREE.Vector3(0,1,0), angle);
  if (axis === 'z') q.setFromAxisAngle(new THREE.Vector3(0,0,1), angle);
  v.applyQuaternion(q);
  return new THREE.Vector3(roundGridVal(v.x), roundGridVal(v.y), roundGridVal(v.z));
}

// anime la rotation d'une couche donnée (turns = 2 pour un demi-tour)
function animateRotation(layer, number, orientation, duration = 400, recordMove = true, highlight = true, turns = 1) {
  return new Promise(resolve => {
    if (!app.scene || !app.rubiksCube) return resolve();

    const axis = layer === 'col' ? 'x' : layer === 'row' ? 'y' : 'z';
    const cubies = getLayerCubies(layer, number);
    if (!cubies.length) return resolve();

    isAnimating = true;

    // petite animation de surbrillance : modifier emissiveIntensity sur les matériaux (si highlight)
    if (highlight) {
      cubies.forEach(c => {
        if (Array.isArray(c.material)) {
          c.material.forEach(m => {
            if (m && m.emissive !== undefined) {
              m.userData_prevEmissive = m.emissive.clone ? m.emissive.clone() : null;
              m.userData_prevEmissiveIntensity = m.emissiveIntensity || 0;
              try { m.emissive.setHex(0xffffff); } catch(e){}
              m.emissiveIntensity = 0.25;
            }
          });
        }
      });
    }

    // créer un pivot à l'origine du monde
    const pivot = new THREE.Object3D();
    pivot.position.set(0,0,0);
    app.scene.add(pivot);

    // attacher les cubies au pivot tout en préservant leurs transforms mondiaux
    cubies.forEach(c => pivot.attach(c));

    const start = performance.now();
    const from = 0;
    const angle = (orientation === 1 ? 1 : -1) * turns * Math.PI / 2;

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * t); // easeInOut
      pivot.rotation[axis] = from + angle * eased;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        // finaliser la rotation : mettre à jour gridPos pour chaque cubie
        cubies.forEach(c => {
          // calculer la nouvelle position de grille
          const newGrid = rotateVecGrid(c.userData.gridPos, axis, angle);
          c.userData.gridPos.copy(newGrid);
          // rattacher au groupe rubiksCube
          app.rubiksCube.attach(c);

          // restaurer emissive seulement si on l'avait modifié
          if (highlight && Array.isArray(c.material)) {
            c.material.forEach(m => {
              if (m && m.emissive !== undefined) {
                try {
                  if (m.userData_prevEmissive) m.emissive.copy(m.userData_prevEmissive);
                } catch(e){}
                m.emissiveIntensity = m.userData_prevEmissiveIntensity || 0;
                delete m.userData_prevEmissive;
                delete m.userData_prevEmissiveIntensity;
              }
            });
          }
        });

        app.scene.remove(pivot);
        isAnimating = false;

        // NOTE: ne pas pousser dans completedMoves ici — processQueue gère l'enregistrement
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}

// traitement de la file de mouvements
async function processQueue() {
  if (isAnimating) return;
  if (!moveQueue.length) {
    // fin d'une résolution automatique : prévenir l'interface
    if (isSolving) {
      isSolving = false;
      if (onSolvedCallback) onSolvedCallback();
    }
    return;
  }
  const move = moveQueue.shift();
  await animateRotation(move.layer, move.number, move.orientation, move.duration || 400, move.recordMove, move.highlight !== undefined ? move.highlight : true, move.turns || 1);

  // enregistrer le mouvement terminé ici pour inclure des métadonnées (isShuffle)
  try {
    if (move.recordMove) {
      completedMoves.push({ layer: move.layer, number: move.number, orientation: move.orientation, isShuffle: !!move.isShuffle, timestamp: Date.now() });
    }
  } catch(e) { console.warn('failed to record completed move', e); }

  // continuer
  processQueue();
}

// Mélange intelligent : évite que des mouvements consécutifs s'annulent ou se répètent
export function shuffle(nMoves = 25) {
  // charger le solveur pendant le mélange pour qu'il soit prêt au moment de résoudre
  startSolver();

  // planifier des mouvements aléatoires
  const axes = ['row','col','depth'];
  const algParts = [];
  let prev = null; // dernier mouvement généré

  for (let i = 0; i < nMoves; i++) {
    let attempt = 0;
    let chosen = null;
    while (attempt < 50) {
      attempt++;
      const axis = axes[Math.floor(Math.random() * axes.length)];
      const number = [-1,0,1][Math.floor(Math.random()*3)];
      const orientation = Math.random() > 0.5 ? 1 : 0;

      // règle : ne pas choisir exactement la même couche (layer+number) que le précédent
      // et ne pas choisir l'inverse (même layer+number mais orientation inverse) qui annulerait
      if (prev) {
        if (prev.layer === axis && prev.number === number) {
          // si même couche et même orientation -> redondant, rejeter
          if (prev.orientation === orientation) continue;
          // si même couche et orientation inverse -> annulation, rejeter
          if (prev.orientation !== orientation) continue;
        }
      }

      // règle additionnelle : éviter de faire un mouvement qui annule le mouvement d'il y a 2 pas
      if (algParts.length >= 2) {
        const lastAlg = algParts[algParts.length-1];
        const prevPrevAlg = algParts[algParts.length-2];
        // simple heuristique : si on génère la même notation que prevPrevAlg, éviter
        const candidateAlg = moveToAlg({layer:axis, number, orientation});
        if (candidateAlg === prevPrevAlg) continue;
      }

      chosen = { layer: axis, number, orientation };
      break;
    }

    // si on n'a pas trouvé de mouvement valide après tentatives, tomber en backoff et générer sans contrainte
    if (!chosen) {
      const axis = axes[Math.floor(Math.random() * axes.length)];
      const number = [-1,0,1][Math.floor(Math.random()*3)];
      const orientation = Math.random() > 0.5 ? 1 : 0;
      chosen = { layer: axis, number, orientation };
    }

    prev = chosen;
    moveQueue.push({ layer: chosen.layer, number: chosen.number, orientation: chosen.orientation, duration: 300, recordMove: true, highlight: false, isShuffle: true });
    algParts.push(moveToAlg(chosen));
  }

  // marquer jouable
  app.isPlayable = true;
  processQueue();
}

export async function solve() {
  // si aucun mouvement n'a été enregistré, le cube est déjà résolu
  if (completedMoves.length === 0) {
    if (onSolvedCallback) onSolvedCallback();
    return;
  }
  isSolving = true;

  // historique complet : mélange + mouvements manuels
  const history = completedMoves.slice();
  completedMoves = [];

  let solutionMoves = null;
  try {
    // cubejs (Kociemba) : réorientation du cube entier puis solution en mouvements de faces
    const { upright, solution } = await postToSolver('solve', { alg: history.map(moveToAlg).join(' ') });
    console.log('[animator] solution cubejs :', `${upright} ${solution}`.trim());
    solutionMoves = algToMoves(`${upright} ${solution}`);
  } catch (e) {
    console.warn('[animator] cubejs non disponible ou a échoué, repli sur l\'inverse des mouvements :', e);
  }

  // Repli : rejouer l'inverse de l'historique dans l'ordre inverse
  if (!solutionMoves) {
    solutionMoves = history.reverse().map(m => ({ layer: m.layer, number: m.number, orientation: m.orientation ? 0 : 1, turns: 1 }));
  }

  // durée plus courte pour l'auto-solve et pas de surbrillance (action du bouton)
  solutionMoves.forEach(m => {
    moveQueue.push({ ...m, duration: 120 * m.turns, recordMove: false, highlight: false });
  });
  processQueue();
}

// empile un mouvement dans la file (utilisé pour interactions manuelles)
export function queueMove(layer, number, orientation, duration = 400, options = {}) {
  // ignoré pendant une résolution automatique : il fausserait la solution en cours
  if (isSolving) return;
  const highlight = options.highlight !== undefined ? options.highlight : true;
  moveQueue.push({ layer, number, orientation, duration, recordMove: true, highlight });
  processQueue();
}

export function registerOnSolved(cb) { onSolvedCallback = cb; }

export function isBusy() { return isAnimating || isSolving || moveQueue.length > 0; }

export function getCompletedMoves() { return completedMoves; }

export function resetMoves() { completedMoves = []; moveQueue = []; }

export default { shuffle, solve, queueMove, registerOnSolved, isBusy, resetMoves };
