import * as THREE from 'three';
import { app } from '../globals.js';
import { onFrame } from './scene.js';
import { calculateCubiePosition } from './cube.js';
import { CUBE_CONTENT, STICKER_LABELS } from '../utils/constants.js';
import { isCubeSectionInView } from '../utils/view.js';

// Contenus sur les stickers : comme les lieux sur un globe, l'icône et le nom de chaque contenu apparaissent
// sur les stickers de la face tournée vers l'écran, du centre vers les bords, et s'effacent quand elle s'en détourne.
const NORMALS = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};
// encre foncée sur les stickers clairs (blanc, jaune, orange), blanche sur les autres
const INK = { top: '#15132b', bottom: '#15132b', back: '#15132b', front: '#ffffff', right: '#ffffff', left: '#ffffff' };
const SHOW_AT = 0.55; // la face regarde assez l'écran (cosinus de l'angle)
const HIDE_AT = 0.4; // écart avec SHOW_AT : pas de clignotement à la limite
const STAGGER = 0.06; // s : le centre, puis les bords, puis les coins
const SHOW_DURATION = 0.32; // s
const HIDE_DURATION = 0.16; // s, sortie plus rapide que l'entrée
const SIZE = 256; // côté de la texture
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const faces = {}; // face -> { normal, visible, labels }
const labels = [];
const geometry = new THREE.PlaneGeometry(0.86, 0.86);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const tmpNormal = new THREE.Vector3();
const tmpUp = new THREE.Vector3();
const tmpFaceUp = new THREE.Vector3();
const tmpTurn = new THREE.Quaternion();
const tmpCross = new THREE.Vector3();
const tmpCenter = new THREE.Vector3();
const tmpToCamera = new THREE.Vector3();
const cubeRotation = new THREE.Quaternion();

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
// léger dépassement à l'arrivée, comme un repère qui se pose
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

// Glyphe et police d'une icône Font Awesome, lus sur un élément temporaire
function iconGlyph(iconClass) {
  const i = document.createElement('i');
  i.className = iconClass;
  i.style.position = 'absolute';
  i.style.visibility = 'hidden';
  document.body.appendChild(i);
  const before = getComputedStyle(i, '::before');
  const glyph = before.content.replace(/^["']|["']$/g, '');
  const font = `${before.fontWeight} 72px ${before.fontFamily}`;
  i.remove();
  return { glyph, font };
}

function labelText(face, position, content, lang) {
  return STICKER_LABELS[lang]?.[face]?.[position] || content.i18n?.[lang]?.title?.trim() || content.title.trim();
}

function draw(label, lang) {
  const { ctx, icon, face, position, content, texture } = label;
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = INK[face];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // nom en une ligne, ou en deux s'il est long ; l'icône remonte pour lui laisser la place
  const text = labelText(face, position, content, lang);
  const maxWidth = SIZE * 0.88;
  const fits = (line, size) => {
    ctx.font = `700 ${size}px Raleway, sans-serif`;
    return ctx.measureText(line).width <= maxWidth;
  };
  let lines = [text];
  let size = 42;
  if (!fits(text, size)) {
    const words = text.split(' ');
    const cut = words.length > 1 ? Math.ceil(words.length / 2) : 0;
    if (cut) lines = [words.slice(0, cut).join(' '), words.slice(cut).join(' ')];
    while (size > 24 && !lines.every((line) => fits(line, size))) size -= 2;
  }
  const lineHeight = size * 1.1;
  const textTop = SIZE * 0.86 - lineHeight * (lines.length - 1);
  if (icon.glyph && icon.glyph !== 'none') {
    ctx.font = icon.font;
    ctx.fillText(icon.glyph, SIZE / 2, textTop - SIZE * 0.3);
  }
  ctx.font = `700 ${size}px Raleway, sans-serif`;
  lines.forEach((line, i) => ctx.fillText(line, SIZE / 2, textTop + i * lineHeight));
  texture.needsUpdate = true;
}

// Cubie qui porte la case `position` de la face, dans la position d'origine du cube
function cubieAt(face, position) {
  const axis = NORMALS[face].findIndex((v) => v !== 0);
  const sign = NORMALS[face][axis];
  return app.cubies.find((c) => {
    const home = c.userData.homePos.toArray();
    return home[axis] === sign && calculateCubiePosition(c.userData.homePos, face) === position;
  });
}

// Redessine les noms dans la langue choisie
export function setStickerLabelsLanguage(lang) {
  labels.forEach((label) => draw(label, lang));
}

// Faces dont les contenus sont affichés (tests)
export function visibleFaces() {
  return Object.keys(faces).filter((face) => faces[face].visible);
}

function update(dt) {
  const allowed = !app.isPlayable && !app.isModalOpen && isCubeSectionInView();
  app.rubiksCube.getWorldQuaternion(cubeRotation);

  Object.values(faces).forEach((face) => {
    tmpNormal.copy(face.normal).applyQuaternion(cubeRotation);
    tmpCenter.copy(face.normal).multiplyScalar(1.5);
    app.rubiksCube.localToWorld(tmpCenter);
    const facing = tmpToCamera.subVectors(app.camera.position, tmpCenter).normalize().dot(tmpNormal);

    // le haut du contenu suit le haut de l'écran, projeté sur la face (lisible quel que soit l'angle de vue)
    tmpUp.set(0, 1, 0).applyQuaternion(app.camera.quaternion);
    tmpUp.addScaledVector(tmpNormal, -tmpUp.dot(tmpNormal));
    if (tmpUp.lengthSq() > 1e-6) {
      tmpUp.normalize();
      tmpFaceUp.set(0, 1, 0).applyQuaternion(face.base).applyQuaternion(cubeRotation);
      const angle = Math.atan2(tmpCross.crossVectors(tmpFaceUp, tmpUp).dot(tmpNormal), tmpFaceUp.dot(tmpUp));
      tmpTurn.setFromAxisAngle(Z_AXIS, angle);
      face.labels.forEach((label) => label.mesh.quaternion.copy(face.base).multiply(tmpTurn));
    }

    const visible = allowed && facing > (face.visible ? HIDE_AT : SHOW_AT);
    if (visible === face.visible) return;
    face.visible = visible;
    face.labels.forEach((label) => {
      label.target = visible ? 1 : 0;
      label.wait = visible ? label.ring * STAGGER : 0;
    });
  });

  labels.forEach((label) => {
    if (label.wait > 0) {
      label.wait -= dt;
      return;
    }
    const duration = label.target ? SHOW_DURATION : HIDE_DURATION;
    label.t = Math.min(1, Math.max(0, label.t + ((label.target ? 1 : -1) * dt) / duration));
    const { mesh } = label;
    mesh.visible = label.t > 0.001;
    if (!mesh.visible) return;
    mesh.material.opacity = easeOut(label.t);
    const scale = reducedMotion.matches ? 1 : label.target ? 0.7 + 0.3 * easeOutBack(label.t) : 0.9 + 0.1 * label.t;
    mesh.scale.setScalar(scale);
  });
}

export async function setupStickerLabels(lang = 'fr') {
  // polices des icônes et du texte chargées avant de dessiner sur les textures
  await Promise.all(
    [
      '900 80px "Font Awesome 6 Free"',
      '400 80px "Font Awesome 6 Free"',
      '400 80px "Font Awesome 6 Brands"',
      '700 34px Raleway',
    ].map((font) => document.fonts.load(font).catch(() => null)),
  );

  Object.entries(NORMALS).forEach(([face, normal]) => {
    const vector = new THREE.Vector3(...normal);
    // orientation de base : le plan du contenu tourné vers l'extérieur de la face
    const base = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, vector);
    faces[face] = { normal: vector, base, visible: false, labels: [] };
  });

  Object.entries(CUBE_CONTENT).forEach(([face, items]) => {
    Object.entries(items).forEach(([key, content]) => {
      const position = Number(key);
      const cubie = cubieAt(face, position);
      if (!cubie) return;

      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SIZE;
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = app.renderer.capabilities.getMaxAnisotropy();
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 });
      const mesh = new THREE.Mesh(geometry, material);
      const normal = faces[face].normal;
      // posé juste au-dessus du sticker, tourné vers l'extérieur (le haut du texte suit la vue de la face)
      mesh.position.copy(normal).multiplyScalar(0.504);
      mesh.quaternion.copy(faces[face].base);
      mesh.visible = false;
      mesh.renderOrder = 1;
      mesh.raycast = () => {}; // les clics et le survol visent le cubie, pas son contenu
      cubie.add(mesh);

      // anneau : 0 au centre de la face, 1 sur les bords, 2 aux coins
      const row = Math.floor(position / 3);
      const col = position % 3;
      const label = {
        mesh,
        face,
        position,
        content,
        texture,
        ctx: canvas.getContext('2d'),
        icon: iconGlyph(content.icon || 'fa-solid fa-cube'),
        ring: Math.abs(row - 1) + Math.abs(col - 1),
        t: 0,
        target: 0,
        wait: 0,
      };
      draw(label, lang);
      labels.push(label);
      faces[face].labels.push(label);
    });
  });

  onFrame(update);
}
