// Sous le cube : le patron (la face devant allumée), son nom, le bouton Jouer, puis les commandes du jeu ;
// et la pastille de la barre, qui reproduit la face tournée vers soi
import * as THREE from 'three';
import { S, $ } from '../state.js';
import { t } from '../i18n.js';
import { KEYS } from '../content.js';
import { BODY, COLORS, FACES, NORMALS, SPACING, cellIndex } from '../cube/geometry.js';
import { clamp } from '../cube/math.js';
import { blackMaterial, camera, cube, cubies, project } from '../cube/scene.js';

const cubeUi = $('#cube-ui');
const contacts = $('#contacts');
const markSquares = [...document.querySelectorAll('#mark span')];
export const netButtons = [...document.querySelectorAll('#net button')];

// Rien sous le cube à l'accueil ; au centre, le patron et le jeu ; en jeu, ses commandes
export function updateCubeUi() {
  $('#row-explore').hidden = S.mode !== 'explore';
  $('#row-play').hidden = S.mode !== 'play';
  contacts.classList.toggle('away', Boolean(S.card) && !S.narrow);
}

// Les commandes suivent le cube, juste en dessous
export function placeCubeUi() {
  const c = project(new THREE.Vector3().setFromMatrixPosition(cube.matrixWorld));
  const radius =
    ((2.45 * S.scale.x) / (S.view.dist.x * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * (S.height / 2);
  const w = cubeUi.offsetWidth;
  const h = cubeUi.offsetHeight;
  const x = w > S.width - 32 ? (S.width - w) / 2 : clamp(c.x - w / 2, 16, S.width - w - 16);
  const below = c.y + radius * 0.98 + (S.mode === 'explore' ? 44 : 10);
  const y = Math.min(below, S.height - h - 24);
  cubeUi.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  cubeUi.classList.toggle('over', below > y + 1); // le cube déborde sur les commandes
  const hidden =
    S.phase !== 'ready' ||
    S.mode === 'intro' ||
    (S.mode === 'explore' && S.scrollP < 0.85) ||
    (S.card && S.card.origin === 'sticker') ||
    Boolean(S.opening) ||
    (S.narrow && Boolean(S.card));
  cubeUi.classList.toggle('on', !hidden);
  cubeUi.inert = hidden;
}

// La face devant : allumée dans le patron, nommée à côté avec son nombre de contenus
export function setFront(face) {
  S.front = face;
  netButtons.forEach((b) => b.setAttribute('aria-current', String(b.dataset.face === face)));
  $('#face-name').textContent = t().labels[face];
  $('#face-count').textContent = t().items(KEYS[face].length);
  S.markDirty = true;
}

// Pastille de la barre : la face tournée vers soi, case par case (elle suit aussi le jeu)
export function updateMark() {
  cube.updateMatrixWorld(true);
  const cam = cube.worldToLocal(new THREE.Vector3(0, 0, 50)).normalize();
  let face = 'front';
  let best = -2;
  FACES.forEach((f) => {
    const d = new THREE.Vector3(...NORMALS[f]).dot(cam);
    if (d > best) {
      best = d;
      face = f;
    }
  });
  const n = new THREE.Vector3(...NORMALS[face]);
  const axis = ['x', 'y', 'z'][NORMALS[face].findIndex((v) => v !== 0)];
  const sign = NORMALS[face].find((v) => v !== 0);
  const cells = new Array(9).fill(COLORS[face]);
  const local = new THREE.Vector3();
  cubies.forEach((c) => {
    const g = {
      x: Math.round(c.position.x / SPACING),
      y: Math.round(c.position.y / SPACING),
      z: Math.round(c.position.z / SPACING),
    };
    if (g[axis] !== sign) return;
    for (let i = 0; i < 6; i++) {
      local.set(...NORMALS[FACES[i]]).applyQuaternion(c.quaternion);
      if (local.dot(n) > 0.9) {
        cells[cellIndex(face, g)] = c.material[i] === blackMaterial ? BODY : COLORS[FACES[i]];
        break;
      }
    }
  });
  markSquares.forEach((s, i) => (s.style.background = cells[i]));
}
