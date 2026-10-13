// Importation des modules nécessaires depuis Three.js et nos fichiers internes
import * as THREE from 'three';
import { updateFaceTextures, createFaceTexture, setFaceMap } from './cube.js';
import { updateCubieHoverState, hidePreview } from '../cards/preview.js';
import { dropAll, updateLifts } from './lift.js';
import { onFrame } from './scene.js';
import { showStickerButtons, hideStickerButtons } from './sticker-buttons.js';
import { closeMenu } from '../ui/menu-state.js';
import { preloadPreviews } from '../ui/loader.js';
import { app } from '../globals.js';

// Stockage du cubie survolé (initialisé à null)
let hoveredCubie = null;
app.hoveredCubie = hoveredCubie;

// Sélection des éléments DOM pour la navigation
const themeBtn = document.querySelector('.theme-btn');
const cubeSection = document.getElementById('cube-section');

// Gère le mouvement de la souris pour actualiser le survol du cube
export function onMouseMove(event) {
  if (!app.isZoomed || app.isModalOpen) return;

  // Actualisation des coordonnées de la souris pour le raycasting
  app.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  app.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  app.raycaster.setFromCamera(app.mouse, app.camera);
  const intersects = app.raycaster.intersectObjects(app.cubies);

  // Détection du cubie sous le curseur
  const newHoveredCubie = intersects.length > 0 ? intersects[0].object : null;

  // Mise à jour de l'état de survol
  if (app.hoveredCubie !== newHoveredCubie) {
    if (app.hoveredCubie) {
      updateCubieHoverState(app.hoveredCubie, false);
    }
    app.hoveredCubie = newHoveredCubie;
    if (app.hoveredCubie) {
      updateCubieHoverState(app.hoveredCubie, true);
    }
  }
}

// Affiche ou masque le bouton Mélanger / Résoudre
function setShuffleButtonVisible(visible) {
  const btn = document.querySelector('.shuffle-btn');
  if (btn) btn.style.display = visible ? '' : 'none';
}

const ZOOM_DISTANCE = 6; // de la face à la caméra
// durées en s, raccourcies si l'utilisateur préfère réduire les animations
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const zoomDuration = () => (reducedMotion.matches ? 0.35 : 0.9);
const dezoomDuration = () => (reducedMotion.matches ? 0.35 : 0.8);
const FACE_NORMALS = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0),
};
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Orientation d'une caméra placée en `eye` et tournée vers `target`
function lookRotation(eye, target, up) {
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(eye, target, up));
}

// Vol de la caméra : sur un arc autour du cube (jamais au travers), toujours tournée vers son centre.
// Le haut de l'écran suit l'arc, et l'écart restant avec l'orientation d'arrivée (roulis) est rattrapé
// progressivement : pas de bascule brusque, même entre la vue de dessus et une face de côté.
// Un nouveau vol remplace celui en cours.
let flight = null;
const IDENTITY = new THREE.Quaternion();
const turnStep = new THREE.Quaternion();
const rollStep = new THREE.Quaternion();
const forward = new THREE.Vector3();

function flyCamera(endPosition, endQuaternion, duration, onDone) {
  const startDir = app.camera.position.clone().normalize();
  const endDir = endPosition.clone().normalize();
  const turn = new THREE.Quaternion().setFromUnitVectors(startDir, endDir);
  const carriedUp = new THREE.Vector3(0, 1, 0).applyQuaternion(app.camera.quaternion).applyQuaternion(turn);
  const wantedUp = new THREE.Vector3(0, 1, 0).applyQuaternion(endQuaternion);
  const endForward = endDir.clone().negate();
  flight = {
    startDir,
    turn,
    roll: Math.atan2(new THREE.Vector3().crossVectors(carriedUp, wantedUp).dot(endForward), carriedUp.dot(wantedUp)),
    startRadius: app.camera.position.length(),
    endRadius: endPosition.length(),
    startQuaternion: app.camera.quaternion.clone(),
    endQuaternion,
    endPosition,
    duration,
    elapsed: 0,
    onDone,
  };
}

// Appelé à chaque image après OrbitControls, qui ne doit pas reprendre la main pendant le vol
function updateFlight(dt) {
  if (!flight) return;
  flight.elapsed += dt;
  const progress = Math.min(flight.elapsed / flight.duration, 1);
  const eased = easeOutCubic(progress);
  turnStep.slerpQuaternions(IDENTITY, flight.turn, eased);
  app.camera.position
    .copy(flight.startDir)
    .applyQuaternion(turnStep)
    .multiplyScalar(THREE.MathUtils.lerp(flight.startRadius, flight.endRadius, eased));
  forward.copy(app.camera.position).normalize().negate();
  rollStep.setFromAxisAngle(forward, flight.roll * eased);
  app.camera.quaternion.copy(flight.startQuaternion).premultiply(turnStep).premultiply(rollStep);
  if (progress < 1) return;

  // inertie résiduelle d'OrbitControls appliquée tout de suite, sinon la caméra dériverait après le vol
  app.controls.enableDamping = false;
  app.controls.update();
  app.controls.enableDamping = true;
  app.camera.position.copy(flight.endPosition);
  app.camera.quaternion.copy(flight.endQuaternion);
  const { onDone } = flight;
  flight = null;
  onDone();
}

// Zoom sur une face du cube en fonction de son type : top, bottom, front, back, right ou left
export function zoomToFace(face, faceType) {
  // Prevent zoom when game mode is active
  if (app.isPlayable) return;

  // Hide the shuffle/solve button immediately to avoid interactions during zoom
  setShuffleButtonVisible(false);

  // Sauvegarde la position de la caméra lors du premier zoom
  if (!app.isZoomed) app.lastCameraPosition = app.camera.position.clone();
  preloadPreviews(faceType);

  app.controls.enabled = false;
  app.cameraAnimating = true;

  // Désactivation temporaire des boutons de navigation
  document.querySelectorAll('.nav-button').forEach((btn) => {
    btn.classList.add('disabled');
  });

  // Caméra face à la face, à distance fixe ; vue de dessus avec l'avant en bas, de dessous avec l'avant en haut
  const target = face.position.clone();
  const endPosition = target.clone().addScaledVector(FACE_NORMALS[faceType], ZOOM_DISTANCE);
  const up =
    faceType === 'top'
      ? new THREE.Vector3(0, 0, -1)
      : faceType === 'bottom'
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(0, 1, 0);
  flyCamera(endPosition, lookRotation(endPosition, target, up), zoomDuration(), () => finishZoom(faceType));
}

// Finalisation du zoom : mise à jour de l'interface et des textures de la face
export function finishZoom(faceType) {
  cubeSection.classList.add('zoomed');
  app.cameraAnimating = false;

  // Mise à jour des textures pour chaque cubie de la face
  const faceCubies = getFaceCubies(faceType);
  faceCubies.forEach((cubie) => {
    updateFaceTextures(cubie, faceType);
  });
  // stickers accessibles au clavier
  showStickerButtons(faceType, faceCubies);

  app.isZoomed = true;
  app.resetButton.style.display = 'block';

  // Masquer le bouton Mélanger/Résoudre quand on est en zoom
  setShuffleButtonVisible(false);
}

// Réinitialise la scène en sortant du mode zoom
export function dezoom() {
  if (!app.isZoomed || !app.lastCameraPosition) return;

  app.isZoomed = false;
  app.isDragging = false;
  app.cameraAnimating = true;
  cubeSection.classList.remove('zoomed');

  // Réactivation des boutons de navigation
  document.querySelectorAll('.nav-button').forEach((btn) => {
    btn.classList.remove('disabled');
  });

  // Nettoyage de l'interface utilisateur ; le focus clavier passe des stickers au bouton du menu
  const focusWasInZoom = document.activeElement?.closest('.sticker-buttons, #reset');
  hideStickerButtons();
  const body = document.querySelector('.container');
  body.style.overflow = 'auto';
  closeMenu();
  app.resetButton.style.display = 'none';
  if (focusWasInZoom) app.menuBtn.focus({ preventScroll: true });

  // Suppression du contenu de la face s'il existe
  const container = document.getElementById('face-content');
  if (container) container.remove();

  // Restaurer le bouton Mélanger/Résoudre
  setShuffleButtonVisible(true);

  // Retour de la caméra à sa position d'avant le zoom
  const endPosition = app.lastCameraPosition.clone();
  if (endPosition.length() < 7) endPosition.normalize().multiplyScalar(7);
  const endQuaternion = lookRotation(endPosition, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
  flyCamera(endPosition, endQuaternion, dezoomDuration(), () => {
    app.controls.enabled = true;
    app.cameraAnimating = false;
  });

  // Réinitialisation des cubies (position et textures)
  dropAll();
  requestAnimationFrame(() => {
    app.cubies.forEach((cubie) => {
      // On ne réinitialise pas le cubie central top
      if (
        cubie.userData.gridPos &&
        cubie.userData.gridPos.x === 0 &&
        cubie.userData.gridPos.y === 1 &&
        cubie.userData.gridPos.z === 0
      ) {
        return;
      }
      // Réinitialisation des textures de toutes les faces
      ['right', 'left', 'top', 'bottom', 'front', 'back'].forEach((faceType) => {
        const texture = createFaceTexture(faceType, false);
        const faceIndex = ['right', 'left', 'top', 'bottom', 'front', 'back'].indexOf(faceType);
        setFaceMap(cubie.material[faceIndex], texture);
      });
    });
  });

  // Réinitialisation de l'effet sur le cubie survolé
  if (app.hoveredCubie) {
    updateCubieHoverState(app.hoveredCubie, false);
    app.hoveredCubie = null;
  }
  hidePreview();
}

// Retourne les cubies appartenant à une face donnée du cube
function getFaceCubies(faceType) {
  let cubiesOnFace = [];
  switch (faceType) {
    case 'front':
      cubiesOnFace = app.cubies.filter((cubie) => Math.abs(cubie.userData.gridPos.z - 1) < 0.1);
      break;
    case 'back':
      cubiesOnFace = app.cubies.filter((cubie) => Math.abs(cubie.userData.gridPos.z + 1) < 0.1);
      break;
    case 'right':
      cubiesOnFace = app.cubies.filter((cubie) => Math.abs(cubie.userData.gridPos.x - 1) < 0.1);
      break;
    case 'left':
      cubiesOnFace = app.cubies.filter((cubie) => Math.abs(cubie.userData.gridPos.x + 1) < 0.1);
      break;
    case 'top':
      cubiesOnFace = app.cubies.filter((cubie) => Math.abs(cubie.userData.gridPos.y - 1) < 0.1);
      break;
    case 'bottom':
      cubiesOnFace = app.cubies.filter((cubie) => Math.abs(cubie.userData.gridPos.y + 1) < 0.1);
      break;
  }
  return cubiesOnFace;
}

// Retourne le cubie central correspondant à une face donnée
export function getCentralCubie(faceType) {
  // Définition de la position centrale attendue
  let position;
  switch (faceType) {
    case 'front':
      position = new THREE.Vector3(0, 0, 1);
      break;
    case 'back':
      position = new THREE.Vector3(0, 0, -1);
      break;
    case 'right':
      position = new THREE.Vector3(1, 0, 0);
      break;
    case 'left':
      position = new THREE.Vector3(-1, 0, 0);
      break;
    case 'top':
      position = new THREE.Vector3(0, 1, 0);
      break;
    case 'bottom':
      position = new THREE.Vector3(0, -1, 0);
      break;
  }

  // Recherche du cubie dont la position correspond à celle attendue
  return app.cubies.find((cubie) => cubie.userData.gridPos.equals(position));
}

// Configuration de la navigation entre les sections de la page
export function setupNavigation() {
  const container = document.querySelector('.container');
  const sections = Array.from(document.querySelectorAll('section'));
  const buttons = document.querySelectorAll('.nav-button');

  // Met à jour l'UI en fonction de la position de scroll
  function updateUI() {
    const currentScroll = container.scrollTop;
    const windowHeight = window.innerHeight;
    const currentIndex = Math.round(currentScroll / windowHeight);

    // Gestion de la visibilité de l'indicateur de scroll
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
      scrollIndicator.classList.toggle('hidden', currentIndex !== 0);
    }

    // Active le bouton correspondant à la section courante
    buttons.forEach((button, index) => {
      button.classList.toggle('active', index === currentIndex);
      if (index === currentIndex) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });

    // Affiche ou cache le menu et le bouton thème suivant la section active
    const isCubeSection = currentIndex === 1;
    // Hide menu button when game mode active
    app.menuBtn.style.display = isCubeSection && !app.isPlayable ? 'flex' : 'none';
    themeBtn.classList.toggle('hidden', isCubeSection);

    // Show shuffle button only on cube section and only when not zoomed
    setShuffleButtonVisible(isCubeSection && !app.isZoomed);

    // Ferme le menu si on quitte la section du cube
    if (!isCubeSection && app.menu.classList.contains('active')) closeMenu();
  }

  // Clic sur les boutons de navigation : défilement vers la bonne section
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      sections[index].scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Échap : sortie du zoom (une carte ouverte se ferme d'abord, voir overlay.js)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && app.isZoomed && !app.isModalOpen) dezoom();
  });

  // Vol de la caméra et soulèvement des cubies survolés, à chaque image
  onFrame(updateFlight);
  onFrame(updateLifts);

  // Mise à jour de l'UI lors du défilement
  container.addEventListener(
    'scroll',
    () => {
      updateUI();
    },
    { passive: true },
  );

  // Mise à jour initiale de l'UI
  updateUI();
}
