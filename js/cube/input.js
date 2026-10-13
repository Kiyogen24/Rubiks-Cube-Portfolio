import * as THREE from 'three';
import { app } from '../globals.js';
import { calculateCubiePosition, faceFromNormal } from './cube.js';
import { zoomToFace, getCentralCubie, onMouseMove } from './navigation.js';
import { queueMove } from './animator.js';
import { showInfoCard } from '../cards/overlay.js';
import { CUBE_CONTENT } from '../utils/constants.js';
import { openMenu, highlightMenuItem } from '../ui/menu-state.js';
import { isCubeSectionInView } from '../utils/view.js';

// Position de départ de la souris, pour distinguer un clic d'un glissement
let mouseStartX = 0;
let mouseStartY = 0;
// Glissement d'une couche en mode jeu
let dragStartIntersect = null;
let dragStartPoint = null;
let isGameDragging = false;

// Premier cubie sous le pointeur
function pickCubie(clientX, clientY) {
  app.mouse.x = (clientX / window.innerWidth) * 2 - 1;
  app.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
  app.raycaster.setFromCamera(app.mouse, app.camera);
  return app.raycaster.intersectObjects(app.cubies)[0] || null;
}

// Normale de la face touchée, dans le repère du monde
function worldNormal(intersection) {
  return intersection.face.normal.clone().transformDirection(intersection.object.matrixWorld);
}

function onMouseDown(e) {
  if (!isCubeSectionInView()) return;

  app.isDragging = false;
  mouseStartX = e.clientX;
  mouseStartY = e.clientY;
  dragStartPoint = { x: e.clientX, y: e.clientY };
  isGameDragging = false;

  // en mode jeu, un glissement commencé sur un cubie tourne une couche au lieu du cube entier
  dragStartIntersect = app.isPlayable ? pickCubie(e.clientX, e.clientY) : null;
  app.controls.enableRotate = !dragStartIntersect;
}

function onDragMove(e) {
  if (!isCubeSectionInView()) return;

  // au-delà d'un seuil, le mouvement est un glissement et non un clic
  if (Math.abs(e.clientX - mouseStartX) > 5 || Math.abs(e.clientY - mouseStartY) > 5) {
    app.isDragging = true;
  }
  if (app.isPlayable && dragStartIntersect) {
    const dx = e.clientX - dragStartPoint.x;
    const dy = e.clientY - dragStartPoint.y;
    if (Math.sqrt(dx * dx + dy * dy) > 8) isGameDragging = true;
  }
}

// Tourne la couche glissée, selon la face touchée et la direction du glissement
function rotateDraggedLayer(dx, dy) {
  const normal = worldNormal(dragStartIntersect);
  const pos = dragStartIntersect.object.userData.gridPos;

  // direction du glissement dans le repère du monde (l'axe y de l'écran est vers le bas)
  const camDir = new THREE.Vector3();
  app.camera.getWorldDirection(camDir);
  const cameraUp = app.camera.up.clone().applyQuaternion(app.camera.quaternion).normalize();
  const cameraRight = new THREE.Vector3().crossVectors(camDir, cameraUp).normalize();
  const dragWorld = cameraRight.clone().multiplyScalar(dx).add(cameraUp.clone().multiplyScalar(-dy)).normalize();

  // axe de rotation ≈ normale × glissement, ramené à l'axe principal le plus proche
  const rotAxis = new THREE.Vector3().crossVectors(normal, dragWorld).normalize();
  const ax = Math.abs(rotAxis.x);
  const ay = Math.abs(rotAxis.y);
  const az = Math.abs(rotAxis.z);
  let layer, number, orientation;
  if (ax >= ay && ax >= az) {
    layer = 'col';
    number = Math.round(pos.x);
    orientation = rotAxis.x > 0 ? 1 : 0;
  } else if (ay >= ax && ay >= az) {
    layer = 'row';
    number = Math.round(pos.y);
    orientation = rotAxis.y > 0 ? 1 : 0;
  } else {
    layer = 'depth';
    number = Math.round(pos.z);
    orientation = rotAxis.z > 0 ? 1 : 0;
  }

  // face tournée dans le même sens que la caméra : inverser pour garder un glissement intuitif
  if (normal.dot(camDir) > 0) orientation = orientation ? 0 : 1;

  queueMove(layer, number, orientation, 400, { highlight: true });
}

function onMouseUp(e) {
  if (!isCubeSectionInView()) return;

  if (app.isPlayable && isGameDragging && dragStartIntersect) {
    rotateDraggedLayer(e.clientX - dragStartPoint.x, e.clientY - dragStartPoint.y);
  } else if (!app.isDragging) {
    handleClick(e); // sans glissement, c'est un simple clic
  }

  dragStartIntersect = null;
  dragStartPoint = null;
  isGameDragging = false;
  app.isDragging = false;
  // la rotation du cube entier est toujours rétablie à la fin du geste
  app.controls.enableRotate = true;
}

// Clic sur le cube : zoom sur la face touchée, ou ouverture du contenu d'un sticker une fois zoomé
function handleClick(event) {
  if (!isCubeSectionInView() || app.isModalOpen || app.isPlayable) return;

  const intersection = pickCubie(event.clientX, event.clientY);
  if (!intersection) return;
  const faceType = faceFromNormal(worldNormal(intersection));
  const centralCubie = faceType && getCentralCubie(faceType);
  if (!centralCubie) return;

  if (app.isZoomed) {
    const position = calculateCubiePosition(intersection.object.userData.gridPos, faceType);
    const content = CUBE_CONTENT[faceType]?.[position];
    if (content?.hasContent) showInfoCard(event, faceType, position);
    else if (content?.link) window.open(content.link, '_blank', 'noopener');
  } else {
    document.querySelector('.container').style.overflow = 'hidden';
    zoomToFace(centralCubie, faceType);
    app.isZoomed = true;
    openMenu();
    highlightMenuItem(faceType, { scroll: true });
  }
}

export function setupInput() {
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onMouseUp);
  // survol des stickers en vue zoomée
  window.addEventListener('mousemove', onMouseMove);
}
