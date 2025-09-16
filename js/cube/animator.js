import * as THREE from 'three';
import { app } from '../globals.js';

let isAnimating = false;
let moveQueue = [];
let completedMoves = [];
let onSolvedCallback = null;
let lastShuffleAlg = '';

// utilitaire : mappe la représentation interne d'un mouvement vers la notation standard du cube
function moveToAlg(m) {
  // m: { layer: 'col'|'row'|'depth', number: -1|0|1, orientation: 1|0 }
  const dir = m.orientation === 1 ? '' : "'";
  if (m.layer === 'col') {
    if (m.number === 1) return 'R' + dir;
    if (m.number === -1) return 'L' + dir;
    return 'M' + dir; // tranche centrale verticale
  }
  if (m.layer === 'row') {
    if (m.number === 1) return 'U' + dir;
    if (m.number === -1) return 'D' + dir;
    return 'E' + dir; // tranche équatoriale
  }
  if (m.layer === 'depth') {
    if (m.number === 1) return 'F' + dir;
    if (m.number === -1) return 'B' + dir;
    return 'S' + dir; // tranche debout
  }
  return '';
}

// retourne la liste des cubies appartenant à une couche donnée
function getLayerCubies(layer, number) {
  return app.cubies.filter(cubie => {
    const p = cubie.userData.gridPos;
    if (!p) return false;
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

// anime la rotation d'une couche donnée
function animateRotation(layer, number, orientation, duration = 400, recordMove = true, highlight = true) {
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
    const angle = (orientation === 1 ? 1 : -1) * Math.PI / 2;

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
    // détection solved lors d'une résolution automatique : si on a exécuté une séquence de solve,
    // et que completedMoves est vide => appeler le callback
    if (onSolvedCallback && completedMoves.length === 0) {
      onSolvedCallback();
    }
    return;
  }
  const move = moveQueue.shift();
  await animateRotation(move.layer, move.number, move.orientation, move.duration || 400, move.recordMove, move.highlight !== undefined ? move.highlight : true);

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

  // stocker l'algorithme de shuffle pour accélérer le solveur
  lastShuffleAlg = algParts.join(' ').trim();
  // marquer jouable
  app.isPlayable = true;
  processQueue();
}

export async function solve() {
  // si aucun mouvement enregistré et pas de lastShuffleAlg, le cube est déjà résolu
  if (completedMoves.length === 0 && !lastShuffleAlg) {
    console.log('solve() appelé mais completedMoves vide et pas de lastShuffleAlg -> cube déjà résolu');
    if (onSolvedCallback) onSolvedCallback();
    return;
  }
  // essayer d'utiliser cubejs (Kociemba) si disponible
  try {
    const cubejs = await import('cubejs');
    // préférer lastShuffleAlg si présent (plus rapide / fiable)
    const scrambleAlg = lastShuffleAlg || completedMoves.filter(m => m.isShuffle).map(m => moveToAlg(m)).join(' ').trim();
    console.log('scramble courant (from lastShuffleAlg/completedMoves):', scrambleAlg);
    // construire une représentation compacte de l'état du cube à partir des cubies (positions de grille)
    try {
      const state = app.cubies ? app.cubies.map((c, i) => {
        const g = c.userData.gridPos || {x:'?',y:'?',z:'?'};
        const h = c.userData.homePos || {x:'?',y:'?',z:'?'};
        return `${i}:home(${h.x},${h.y},${h.z})->pos(${g.x},${g.y},${g.z})`;
      }).slice(0,24).join(' | ') : 'no-cubies';
    console.log('sample cube state (indices):', state);
  } catch(e) { console.warn('failed to build cube state debug:', e); }
    let solutionAlg = '';
    if (scrambleAlg.length > 0) {
      // cubejs.solve accepte une chaîne scramble et retourne un algorithme solution
      if (typeof cubejs.solve === 'function') {
        solutionAlg = cubejs.solve(scrambleAlg);
      } else if (cubejs.default && typeof cubejs.default.solve === 'function') {
        solutionAlg = cubejs.default.solve(scrambleAlg);
      }
    }

    if (solutionAlg && solutionAlg.length) {
  console.log('cubejs a retourné une solution:', solutionAlg);
      // parser solutionAlg en mouvements et les mettre en file
      const moves = solutionAlg.split(/\s+/).filter(Boolean);
      moves.forEach(mv => {
        // parser prime et base
        const prime = mv.endsWith("'");
        const base = prime ? mv.slice(0,-1) : mv;
        // mapper la base vers notre représentation interne
        let layer, number, orientation;
        switch(base) {
          case 'R': layer='col'; number=1; break;
          case 'L': layer='col'; number=-1; break;
          case 'M': layer='col'; number=0; break;
          case 'U': layer='row'; number=1; break;
          case 'D': layer='row'; number=-1; break;
          case 'E': layer='row'; number=0; break;
          case 'F': layer='depth'; number=1; break;
          case 'B': layer='depth'; number=-1; break;
          case 'S': layer='depth'; number=0; break;
          default: layer=undefined;
        }
        if (layer) {
          orientation = prime ? 0 : 1;
          // utiliser une durée plus courte pour l'auto-solve et désactiver la surbrillance (action du bouton)
          moveQueue.push({ layer, number, orientation, duration: 120, recordMove: false, highlight: false });
        }
      });
      // vider completedMoves car on résout
      completedMoves = [];
      // vider lastShuffleAlg car on l'utilise maintenant
      lastShuffleAlg = '';
      processQueue();
      return;
    }
  } catch (e) {
  console.warn('cubejs non disponible ou a échoué :', e);
  }

  // Repli : pousser l'inverse des completedMoves dans l'ordre inverse
  const toSolve = completedMoves.slice().reverse();
  completedMoves = []; // on reconstruit si besoin pendant l'exécution
  lastShuffleAlg = '';
  toSolve.forEach(m => {
    moveQueue.push({ layer: m.layer, number: m.number, orientation: m.orientation ? 0 : 1, duration: 120, recordMove: false, highlight: false });
  });
  processQueue();
}

// empile un mouvement dans la file (utilisé pour interactions manuelles)
export function queueMove(layer, number, orientation, duration = 400, options = {}) {
  const highlight = options.highlight !== undefined ? options.highlight : true;
  moveQueue.push({ layer, number, orientation, duration, recordMove: true, highlight });
  processQueue();
}

export function registerOnSolved(cb) { onSolvedCallback = cb; }

export function isBusy() { return isAnimating || moveQueue.length > 0; }

export function getCompletedMoves() { return completedMoves; }

export function resetMoves() { completedMoves = []; moveQueue = []; lastShuffleAlg = ''; }

export default { shuffle, solve, queueMove, registerOnSolved, isBusy, resetMoves };
