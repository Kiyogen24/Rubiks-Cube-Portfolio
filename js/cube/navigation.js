// Importation des modules nécessaires depuis Three.js et nos fichiers internes
import * as THREE from 'three';
import { updateFaceTextures, createFaceTexture, setFaceMap } from './cube.js';
import { updateCubieHoverState, hidePreview } from '../cards/preview.js';
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

// Zoom sur une face du cube en fonction de son type : top, bottom, front, back, right ou left
export function zoomToFace(face, faceType) {
  // Prevent zoom when game mode is active
  if (app.isPlayable) return;

  // Hide the shuffle/solve button immediately to avoid interactions during zoom
  setShuffleButtonVisible(false);

  // Sauvegarde la position et rotation initiale de la caméra lors du premier zoom
  if (!app.isZoomed) {
    app.lastCameraPosition = app.camera.position.clone();
    app.lastCameraRotation = app.camera.quaternion.clone();
  }

  // Calcul de la position cible de zoom
  const targetPosition = face.position.clone();
  const distance = 6;
  app.controls.enabled = false;
  app.cameraAnimating = true;

  // Désactivation temporaire des boutons de navigation
  document.querySelectorAll('.nav-button').forEach((btn) => {
    btn.classList.add('disabled');
  });

  // Si la face est 'top' ou 'bottom', animation en deux étapes
  if (faceType === 'top' || faceType === 'bottom') {
    const startPos = app.camera.position.clone();

    // Calcul des angles par rapport aux 4 côtés du cube
    const angles = [
      { x: distance, z: 0 }, // droite
      { x: -distance, z: 0 }, // gauche
      { x: 0, z: distance }, // avant
      { x: 0, z: -distance }, // arrière
    ].map((pos) => ({
      position: pos,
      angle: new THREE.Vector3(pos.x, 0, pos.z).angleTo(
        new THREE.Vector3(app.camera.position.x - targetPosition.x, 0, app.camera.position.z - targetPosition.z),
      ),
    }));

    // Choix du côté le plus proche de la position actuelle
    const closestSide = angles.reduce((prev, current) => (prev.angle < current.angle ? prev : current));

    // Position intermédiaire selon le côté sélectionné
    const intermediatePos = new THREE.Vector3(
      targetPosition.x + closestSide.position.x,
      app.camera.position.y,
      targetPosition.z + closestSide.position.z,
    );

    // Position finale en hauteur, selon 'top' ou 'bottom'
    const finalPos = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y + (faceType === 'top' ? distance : -distance),
      targetPosition.z,
    );

    // Durées pour les deux étapes de l'animation
    const step1Duration = 500;
    const step2Duration = 1000;
    let startTime = Date.now();

    // Animation de l'étape intermédiaire
    function animateStep1() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / step1Duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      app.camera.position.lerpVectors(startPos, intermediatePos, easeProgress);
      app.camera.lookAt(targetPosition);

      if (progress < 1) {
        requestAnimationFrame(animateStep1);
      } else {
        startTime = Date.now();
        animateStep2();
      }
    }

    // Animation finale : mouvement vers la position finale et rotation
    function animateStep2() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / step2Duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      app.camera.position.lerpVectors(intermediatePos, finalPos, easeProgress);

      const upVector = faceType === 'top' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
      const lookMatrix = new THREE.Matrix4().lookAt(finalPos, targetPosition, upVector);
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
      app.camera.quaternion.slerpQuaternions(app.camera.quaternion, targetQuat, easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animateStep2);
      } else {
        finishZoom(faceType);
      }
    }

    animateStep1();
  } else {
    // Pour les autres faces, une animation simple est utilisée
    let cameraOffset;

    // Définition de l'offset selon le type de face
    switch (faceType) {
      case 'front':
        cameraOffset = new THREE.Vector3(0, 0, distance);
        break;
      case 'back':
        cameraOffset = new THREE.Vector3(0, 0, -distance);
        break;
      case 'right':
        cameraOffset = new THREE.Vector3(distance, 0, 0);
        break;
      case 'left':
        cameraOffset = new THREE.Vector3(-distance, 0, 0);
        break;
    }

    // Calcul de la position cible de la caméra
    const targetCameraPos = targetPosition.clone().add(cameraOffset);
    const startPos = app.camera.position.clone();
    const duration = 1000;
    const startTime = Date.now();

    // Animation de la transition
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      app.camera.position.lerpVectors(startPos, targetCameraPos, easeProgress);
      app.camera.lookAt(targetPosition);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        finishZoom(faceType);
      }
    }

    animate();
  }
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

  // Nettoyage de l'interface utilisateur
  const body = document.querySelector('.container');
  body.style.overflow = 'auto';
  app.menuBtn.classList.remove('open');
  app.menu.classList.remove('active');
  app.menuOpen = false;
  app.resetButton.style.display = 'none';

  // Suppression du contenu de la face s'il existe
  const container = document.getElementById('face-content');
  if (container) container.remove();

  // Restaurer le bouton Mélanger/Résoudre
  setShuffleButtonVisible(true);

  // Réinitialisation progressive des cubies et de la caméra
  requestAnimationFrame(() => {
    app.cubies.forEach((cubie) => {
      cubie.scale.set(1, 1, 1);
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

    // Animation de retour de la caméra à sa position d'origine
    const startPos = app.camera.position.clone();
    const endPos = app.lastCameraPosition.clone();
    if (endPos.length() < 7) endPos.normalize().multiplyScalar(7);

    const duration = 1000;
    const startTime = Date.now();

    function update() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      app.camera.position.lerpVectors(startPos, endPos, easeProgress);
      app.camera.lookAt(0, 0, 0);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        app.camera.position.copy(endPos);
        app.camera.lookAt(0, 0, 0);
        app.controls.enabled = true;
        app.cameraAnimating = false;
      }
    }

    requestAnimationFrame(update);
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
    });

    // Affiche ou cache le menu et le bouton thème suivant la section active
    const isCubeSection = currentIndex === 1;
    // Hide menu button when game mode active
    app.menuBtn.style.display = isCubeSection && !app.isPlayable ? 'flex' : 'none';
    themeBtn.classList.toggle('hidden', isCubeSection);

    // Show shuffle button only on cube section and only when not zoomed
    setShuffleButtonVisible(isCubeSection && !app.isZoomed);

    // Ferme le menu si on quitte la section du cube
    if (!isCubeSection && app.menu.classList.contains('active')) {
      app.menu.classList.remove('active');
      app.menuBtn.classList.remove('open');
    }
  }

  // Clic sur les boutons de navigation : défilement vers la bonne section
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      sections[index].scrollIntoView({ behavior: 'smooth' });
    });
  });

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
