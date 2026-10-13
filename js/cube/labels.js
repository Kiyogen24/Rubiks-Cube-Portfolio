import * as THREE from 'three';
import { app } from '../globals.js';
import { onFrame } from './scene.js';
import { isCubeSectionInView } from '../utils/view.js';
import { stickerColors } from '../utils/constants.js';

// Étiquettes des faces : comme les lieux sur un globe, le nom d'une catégorie apparaît
// quand sa face se tourne vers l'écran et disparaît quand elle s'en détourne.
const NORMALS = {
  top: [0, 1, 0],
  front: [0, 0, 1],
  right: [1, 0, 0],
  back: [0, 0, -1],
  left: [-1, 0, 0],
  bottom: [0, -1, 0],
};
const SHOW_AT = 0.55; // la face regarde assez la caméra (cosinus de l'angle)
const HIDE_AT = 0.45; // écart avec SHOW_AT : pas de clignotement à la limite
const FACE_DISTANCE = 1.55; // du centre du cube à la surface des stickers
const STAGGER = 60; // ms entre des étiquettes qui apparaissent ensemble

const labels = [];
const anchor = new THREE.Vector3();
const normal = new THREE.Vector3();
const up = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const inPlaneUp = new THREE.Vector3();
const toCamera = new THREE.Vector3();
const cubeRotation = new THREE.Quaternion();

function labelsAllowed() {
  return (
    !app.isZoomed &&
    !app.cameraAnimating &&
    !app.isPlayable &&
    !app.isModalOpen &&
    !app.openingPlaying &&
    !app.hintsShowing &&
    isCubeSectionInView()
  );
}

function update() {
  const allowed = labelsAllowed();
  app.rubiksCube.getWorldQuaternion(cubeRotation);
  up.set(0, 1, 0).applyQuaternion(app.camera.quaternion); // haut de l'écran, dans le monde
  let appearing = 0;

  labels.forEach((label) => {
    normal.fromArray(label.normal).applyQuaternion(cubeRotation);
    anchor.fromArray(label.normal).multiplyScalar(FACE_DISTANCE);
    app.rubiksCube.localToWorld(anchor);
    const facing = toCamera.subVectors(app.camera.position, anchor).normalize().dot(normal);
    const visible = allowed && facing > (label.visible ? HIDE_AT : SHOW_AT);

    if (visible !== label.visible) {
      label.visible = visible;
      label.el.style.transitionDelay = visible ? `${appearing++ * STAGGER}ms` : '0ms';
      label.el.classList.toggle('visible', visible);
    }
    if (!visible) return;

    // l'étiquette se place sur le sticker du milieu de la rangée du haut (la photo du centre reste visible) :
    // en haut de la face pour les côtés, vers le haut de l'écran pour le dessus et le dessous
    const reference = Math.abs(normal.y) < 0.5 ? WORLD_UP : up;
    inPlaneUp.copy(reference).addScaledVector(normal, -reference.dot(normal));
    if (inPlaneUp.lengthSq() > 1e-6) anchor.addScaledVector(inPlaneUp.normalize(), 1);
    anchor.project(app.camera);
    const x = (anchor.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-anchor.y * 0.5 + 0.5) * window.innerHeight;
    label.wrapper.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  });
}

// Textes des étiquettes dans la langue choisie
export function setLabelTexts(categories) {
  labels.forEach((label) => {
    if (categories?.[label.face]) label.text.textContent = categories[label.face];
  });
}

export function setupLabels() {
  const section = document.getElementById('cube-section');
  Object.entries(NORMALS).forEach(([face, normal]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'face-label';
    wrapper.setAttribute('aria-hidden', 'true'); // décoratif : les catégories sont aussi dans le menu
    // pastille de la couleur de la face, comme un sticker, puis le nom de la catégorie
    wrapper.innerHTML = `<div class="face-label__pill"><span class="face-label__dot" style="background:${stickerColors[face]}"></span><span></span></div>`;
    section.appendChild(wrapper);
    labels.push({
      face,
      normal,
      wrapper,
      el: wrapper.firstElementChild,
      text: wrapper.querySelector('span:last-child'),
      visible: false,
    });
  });
  onFrame(update);
}
