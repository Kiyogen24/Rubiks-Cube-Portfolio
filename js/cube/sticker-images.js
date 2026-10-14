import * as THREE from 'three';
import { app } from '../globals.js';
import { onFrame } from './scene.js';
import { calculateCubiePosition } from './cube.js';
import { CUBE_CONTENT } from '../utils/constants.js';
import { isCubeSectionInView } from '../utils/view.js';

// Images des contenus sur les stickers : comme les lieux sur un globe, elles apparaissent sur les stickers
// de la face tournée vers l'écran, du centre vers les bords, et s'effacent quand elle s'en détourne.
const NORMALS = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};
const SHOW_AT = 0.55; // la face regarde assez l'écran (cosinus de l'angle)
const HIDE_AT = 0.4; // écart avec SHOW_AT : pas de clignotement à la limite
const STAGGER = 0.06; // s : le centre, puis les bords, puis les coins
const SHOW_DURATION = 0.32; // s
const HIDE_DURATION = 0.16; // s, sortie plus rapide que l'entrée
const TURN_TAU = 0.06; // s, quart de tour de l'image pour rester droite à l'écran
const SIZE = 256; // côté de la texture
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const faces = {}; // face -> { normal, base, angle, visible, tiles }
const tiles = [];
const geometry = new THREE.PlaneGeometry(0.86, 0.86);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const QUARTER = Math.PI / 2;
const tmpNormal = new THREE.Vector3();
const tmpUp = new THREE.Vector3();
const projectedUp = new THREE.Vector3();
const tmpFaceUp = new THREE.Vector3();
const tmpCross = new THREE.Vector3();
const tmpCenter = new THREE.Vector3();
const tmpToCamera = new THREE.Vector3();
const tmpTurn = new THREE.Quaternion();
const cubeRotation = new THREE.Quaternion();

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
// léger dépassement à l'arrivée, comme un repère qui se pose
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

// Tuile blanche arrondie, puis l'image recadrée au carré (sans la déformer)
function draw(tile) {
  const { ctx, image, texture } = tile;
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(22, 22, SIZE - 44, SIZE - 44, 26);
  ctx.fill();
  if (image) {
    const inner = SIZE - 68;
    const scale = Math.max(inner / image.width, inner / image.height);
    const w = inner / scale;
    const h = inner / scale;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(34, 34, inner, inner, 18);
    ctx.clip();
    ctx.drawImage(image, (image.width - w) / 2, (image.height - h) / 2, w, h, 34, 34, inner, inner);
    ctx.restore();
  }
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

// Faces dont les images sont affichées
export function visibleFaces() {
  return Object.keys(faces).filter((face) => faces[face].visible);
}

// Écart angulaire le plus court entre deux angles
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

function update(dt) {
  const allowed = !app.isPlayable && !app.isModalOpen && isCubeSectionInView();
  app.rubiksCube.getWorldQuaternion(cubeRotation);
  tmpUp.set(0, 1, 0).applyQuaternion(app.camera.quaternion); // haut de l'écran, dans le monde

  Object.values(faces).forEach((face) => {
    tmpNormal.copy(face.normal).applyQuaternion(cubeRotation);
    tmpCenter.copy(face.normal).multiplyScalar(1.5);
    app.rubiksCube.localToWorld(tmpCenter);
    const facing = tmpToCamera.subVectors(app.camera.position, tmpCenter).normalize().dot(tmpNormal);

    // l'image tourne par quarts de tour pour rester droite à l'écran (une tuile carrée reste alignée sur son sticker)
    projectedUp.copy(tmpUp).addScaledVector(tmpNormal, -tmpUp.dot(tmpNormal));
    if (projectedUp.lengthSq() > 1e-6) {
      projectedUp.normalize();
      tmpFaceUp.set(0, 1, 0).applyQuaternion(face.base).applyQuaternion(cubeRotation);
      const angle = Math.atan2(
        tmpCross.crossVectors(tmpFaceUp, projectedUp).dot(tmpNormal),
        tmpFaceUp.dot(projectedUp),
      );
      const target = Math.round(angle / QUARTER) * QUARTER;
      face.angle += angleDelta(face.angle, target) * (1 - Math.exp(-dt / TURN_TAU));
      tmpTurn.setFromAxisAngle(Z_AXIS, face.angle);
      face.tiles.forEach((tile) => tile.mesh.quaternion.copy(face.base).multiply(tmpTurn));
    }

    const visible = allowed && facing > (face.visible ? HIDE_AT : SHOW_AT);
    if (visible === face.visible) return;
    face.visible = visible;
    face.tiles.forEach((tile) => {
      tile.target = visible ? 1 : 0;
      tile.wait = visible ? tile.ring * STAGGER : 0;
    });
  });

  tiles.forEach((tile) => {
    if (tile.wait > 0) {
      tile.wait -= dt;
      return;
    }
    const duration = tile.target ? SHOW_DURATION : HIDE_DURATION;
    tile.t = Math.min(1, Math.max(0, tile.t + ((tile.target ? 1 : -1) * dt) / duration));
    const { mesh } = tile;
    mesh.visible = tile.t > 0.001;
    if (!mesh.visible) return;
    mesh.material.opacity = easeOut(tile.t);
    const scale = reducedMotion.matches ? 1 : tile.target ? 0.7 + 0.3 * easeOutBack(tile.t) : 0.9 + 0.1 * tile.t;
    mesh.scale.setScalar(scale);
  });
}

export function setupStickerImages() {
  Object.entries(NORMALS).forEach(([face, normal]) => {
    const vector = new THREE.Vector3(...normal);
    // orientation de base : le plan de l'image tourné vers l'extérieur de la face
    const base = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, vector);
    faces[face] = { normal: vector, base, angle: 0, visible: false, tiles: [] };
  });

  Object.entries(CUBE_CONTENT).forEach(([face, items]) => {
    Object.entries(items).forEach(([key, content]) => {
      const position = Number(key);
      const cubie = cubieAt(face, position);
      if (!cubie || !content.preview) return;

      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SIZE;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace; // sinon les couleurs de l'image sont éclaircies une seconde fois (voile blanc)
      texture.anisotropy = app.renderer.capabilities.getMaxAnisotropy();
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 });
      const mesh = new THREE.Mesh(geometry, material);
      // posée juste au-dessus du sticker, tournée vers l'extérieur
      mesh.position.copy(faces[face].normal).multiplyScalar(0.504);
      mesh.quaternion.copy(faces[face].base);
      mesh.visible = false;
      mesh.renderOrder = 1;
      mesh.raycast = () => {}; // les clics et le survol visent le cubie, pas son image
      cubie.add(mesh);

      // anneau : 0 au centre de la face, 1 sur les bords, 2 aux coins
      const row = Math.floor(position / 3);
      const col = position % 3;
      const tile = {
        mesh,
        texture,
        ctx: canvas.getContext('2d'),
        image: null,
        ring: Math.abs(row - 1) + Math.abs(col - 1),
        t: 0,
        target: 0,
        wait: 0,
      };
      draw(tile);
      const image = new Image();
      image.onload = () => {
        tile.image = image;
        draw(tile);
      };
      image.src = content.preview;
      tiles.push(tile);
      faces[face].tiles.push(tile);
    });
  });

  onFrame(update);
}
