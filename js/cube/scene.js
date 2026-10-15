// La scène 3D : rendu et caméra (cadrage selon le moment), les 27 cubies et les images de leurs stickers
import * as THREE from 'three';
import { S, $ } from '../state.js';
import { item } from '../content.js';
import { BODY, FACES, NORMALS, SPACING, cellIndex } from './geometry.js';
import { Y, Z, clamp, easeInOut, easeOut, easeOutBack, lerp, qAxis, springStep } from './math.js';
import { avatarTexture, stickerTexture, tileTexture } from './textures.js';

export const canvas = $('#cube');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 100);
scene.add(new THREE.AmbientLight(0xffffff, 0.74));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.52);
keyLight.position.set(10, 10, 10);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.16);
fillLight.position.set(-10, -10, -10);
scene.add(keyLight, fillLight);

export const cube = new THREE.Group();
scene.add(cube);
export const pivot = new THREE.Group(); // rangée en train de tourner (jeu)
cube.add(pivot);

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const tileGeometry = new THREE.PlaneGeometry(0.86, 0.86);
const surface = { roughness: 0.8, metalness: 0.1 };
export const blackMaterial = new THREE.MeshStandardMaterial({ color: BODY, ...surface });
const stickerMaterials = {};
const stickerMaterial = (face) =>
  (stickerMaterials[face] ||= new THREE.MeshStandardMaterial({ map: stickerTexture(face), ...surface }));
let avatarMaterial = null;

export const cubies = [];
export const tiles = []; // images des contenus, une par sticker qui en a un
export const tileByKey = {};
export const faces = {}; // par face : normale, images, visibilité
FACES.forEach((face) => {
  const normal = new THREE.Vector3(...NORMALS[face]);
  faces[face] = {
    normal,
    base: new THREE.Quaternion().setFromUnitVectors(Z, normal),
    visible: false,
    angle: 0,
    tiles: [],
  };
});

for (const x of [-1, 0, 1]) {
  for (const y of [-1, 0, 1]) {
    for (const z of [-1, 0, 1]) {
      const grid = { x, y, z };
      const outside = (face) => x * NORMALS[face][0] + y * NORMALS[face][1] + z * NORMALS[face][2] === 1;
      const materials = FACES.map((face) => {
        if (!outside(face)) return blackMaterial;
        if (face === 'top' && x === 0 && z === 0) {
          return (avatarMaterial ||= new THREE.MeshStandardMaterial({
            map: avatarTexture('assets/pp.png'),
            ...surface,
          }));
        }
        return stickerMaterial(face);
      });
      const cubie = new THREE.Mesh(boxGeometry, materials);
      const home = new THREE.Vector3(x, y, z).multiplyScalar(SPACING);
      cubie.userData = {
        grid,
        home,
        rest: home.clone(),
        lift: { x: 0, v: 0 },
        liftTarget: 0,
        liftNormal: new THREE.Vector3(),
      };
      cubie.position.copy(home);
      cube.add(cubie);
      cubies.push(cubie);

      FACES.filter(outside).forEach((face) => {
        const cell = cellIndex(face, grid);
        const key = `${face}_${cell}`;
        const data = item(key);
        if (!data) return;
        const material = new THREE.MeshBasicMaterial({
          map: tileTexture(data.preview),
          transparent: true,
          depthWrite: false,
          opacity: 0,
        });
        const mesh = new THREE.Mesh(tileGeometry, material);
        mesh.position.copy(faces[face].normal).multiplyScalar(0.504);
        mesh.quaternion.copy(faces[face].base);
        mesh.renderOrder = 1;
        mesh.visible = false;
        mesh.raycast = () => {};
        cubie.add(mesh);
        const ring = Math.abs(Math.floor(cell / 3) - 1) + Math.abs((cell % 3) - 1); // 0 au centre, 2 aux coins
        const tile = { key, face, cubie, mesh, ring, t: 0, target: 0, wait: 0, hidden: false };
        tiles.push(tile);
        faces[face].tiles.push(tile);
        tileByKey[key] = tile;
      });
    }
  }
}

export function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!w || !h) return;
  S.width = w;
  S.height = h;
  S.narrow = w <= 760;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// Cadrages : à l'accueil le cube est à côté du nom ; en défilant (ou d'un clic) il vient au centre, plus grand,
// comme pour le jeu ; la carte d'un sticker le décale à droite, sa face bien de face
export function framingTarget() {
  const n = S.narrow;
  const a = S.width / S.height;
  if (S.phase === 'boot' || S.phase === 'loading') return { shift: 0, lift: 0.03, dist: n ? 18 : 12 };
  if ((S.card && S.card.origin === 'sticker') || S.opening) {
    return n ? { shift: 0, lift: 0.3, dist: 19 } : { shift: 0.245, lift: 0.02, dist: Math.max(8.2, 10.5 / a) };
  }
  const room = n ? { shift: 0, lift: 0.1, dist: 16 } : { shift: 0, lift: 0.07, dist: Math.max(9.4, 13 / a) };
  if (S.mode === 'play') return { ...room, dist: room.dist * S.zoom };
  const home = n ? { shift: 0, lift: 0.19, dist: 16.5 } : { shift: 0.21, lift: 0.05, dist: Math.max(11, 15 / a) };
  // en descendant encore, vers « Contactez-moi », le cube retourne à côté du texte, plus petit qu'à l'accueil
  if (S.contactP > 0) {
    const end = n ? phoneContactFraming() : { shift: 0.25, lift: 0.04, dist: home.dist * 1.35 };
    const c = easeInOut(S.contactP);
    return {
      shift: lerp(room.shift, end.shift, c),
      lift: lerp(room.lift, end.lift, c),
      dist: lerp(room.dist, end.dist, c),
    };
  }
  const e = easeInOut(S.scrollP);
  return {
    shift: lerp(home.shift, room.shift, e),
    lift: lerp(home.lift, room.lift, e),
    dist: lerp(home.dist, room.dist, e),
  };
}
// Sur téléphone, le texte de « Contactez-moi » est en bas : le cube se met dans la place libre au-dessus,
// et s'en va vers le haut s'il n'y en a pas assez
function phoneContactFraming() {
  const top = 76; // sous la barre
  const free = S.contactTextTop - top - 16;
  const radius = Math.min(130, free * 0.38); // le cube penché déborde un peu de ce rayon
  if (radius < 60) return { shift: 0, lift: 0.9, dist: 26 };
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  return { shift: 0, lift: 0.5 - (top + free * 0.46) / S.height, dist: (2.45 * S.height) / (2 * tan * radius) };
}
export function snapFraming() {
  const f = framingTarget();
  for (const k of ['shift', 'lift', 'dist']) S.view[k] = { x: f[k], v: 0 };
}
export function updateCamera(dt, fast) {
  const f = framingTarget();
  const response = fast ? 0.12 : 0.4;
  springStep(S.view.shift, f.shift, dt, 1, response);
  springStep(S.view.lift, f.lift, dt, 1, response);
  springStep(S.view.dist, f.dist, dt, 1, response);
  camera.position.set(0, 0, S.view.dist.x);
  camera.lookAt(0, 0, 0);
}

// Ce qui est sous le pointeur : le cubie, la face du cube touchée et le sticker (« face_case » d'origine)
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
export function pick(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(cubies, false)[0];
  if (!hit) return null;
  const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  const localNormal = worldNormal.applyQuaternion(cube.quaternion.clone().invert());
  const face = FACES.find((f) => new THREE.Vector3(...NORMALS[f]).dot(localNormal) > 0.9);
  if (!face) return null;
  const normal = new THREE.Vector3(...NORMALS[face]);
  // la face d'origine du sticker, qui a pu changer de place en jeu
  const homeFace = FACES.find(
    (f) => new THREE.Vector3(...NORMALS[f]).applyQuaternion(hit.object.quaternion).dot(normal) > 0.9,
  );
  return {
    cubie: hit.object,
    face,
    key: homeFace ? `${homeFace}_${cellIndex(homeFace, hit.object.userData.grid)}` : null,
    point: hit.point.clone(),
    localNormal: normal,
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

// Point de la scène → position à l'écran
export function project(v) {
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * S.width, y: (-p.y * 0.5 + 0.5) * S.height };
}

// Rectangle à l'écran du carré blanc d'un sticker (départ et arrivée de l'image qui vole vers la carte)
export function stickerRect(tile) {
  tile.cubie.updateMatrixWorld(true);
  tile.mesh.updateMatrixWorld(true);
  const rect = canvas.getBoundingClientRect();
  const half = 0.43 * (212 / 256); // le carré blanc dessiné dans la texture
  const corners = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ].map(([a, b]) => project(new THREE.Vector3(a, b, 0).applyMatrix4(tile.mesh.matrixWorld)));
  const xs = corners.map((p) => p.x + rect.left);
  const ys = corners.map((p) => p.y + rect.top);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

// Images des stickers : celles de la face tournée vers soi apparaissent, du centre vers les bords,
// et tournent par quarts de tour pour rester droites. Renvoie la face la plus tournée vers soi.
const camPos = new THREE.Vector3();
const nv = new THREE.Vector3();
const center = new THREE.Vector3();
const up = new THREE.Vector3();
const faceUp = new THREE.Vector3();
const cross = new THREE.Vector3();
export function updateTiles(dt, fast) {
  cube.updateMatrixWorld(true);
  camPos.copy(camera.position);
  let best = null;
  let bestFacing = -2;
  FACES.forEach((name) => {
    const fc = faces[name];
    nv.copy(fc.normal).applyQuaternion(cube.quaternion);
    center
      .copy(fc.normal)
      .multiplyScalar(1.5 * S.scale.x)
      .applyQuaternion(cube.quaternion);
    const facing = camPos.clone().sub(center).normalize().dot(nv);
    if (facing > bestFacing) {
      bestFacing = facing;
      best = name;
    }
    up.copy(Y).addScaledVector(nv, -Y.dot(nv));
    if (up.lengthSq() > 1e-6) {
      up.normalize();
      faceUp.set(0, 1, 0).applyQuaternion(fc.base).applyQuaternion(cube.quaternion);
      const angle = Math.atan2(cross.crossVectors(faceUp, up).dot(nv), faceUp.dot(up));
      const target = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
      fc.angle += Math.atan2(Math.sin(target - fc.angle), Math.cos(target - fc.angle)) * (1 - Math.exp(-dt / 0.06));
      const turn = qAxis(Z, fc.angle);
      fc.tiles.forEach((tl) => tl.mesh.quaternion.copy(fc.base).multiply(turn));
    }
    const visible = S.mode === 'explore' && facing > (fc.visible ? 0.4 : 0.55);
    if (visible !== fc.visible) {
      fc.visible = visible;
      fc.tiles.forEach((tl) => {
        tl.target = visible ? 1 : 0;
        tl.wait = visible && !fast ? tl.ring * 0.06 : 0;
      });
    }
  });
  tiles.forEach((tl) => {
    if (tl.wait > 0) {
      tl.wait -= dt;
      return;
    }
    tl.t = clamp(tl.t + ((tl.target ? 1 : -1) * dt) / (tl.target ? 0.32 : 0.16));
    tl.mesh.visible = tl.t > 0.001 && !tl.hidden;
    tl.mesh.material.opacity = easeOut(tl.t);
    tl.mesh.scale.setScalar(fast ? 1 : tl.target ? 0.7 + 0.3 * easeOutBack(tl.t) : 0.9 + 0.1 * tl.t);
  });
  return best;
}

// Les images des stickers et leur matériau partent vers la carte graphique pendant l'accueil : sans cela, la page
// se fige un instant quand le cube arrive au centre et qu'elles apparaissent pour la première fois
export function warmUp() {
  tiles.forEach((tl) => {
    renderer.initTexture(tl.mesh.material.map);
    tl.mesh.visible = true;
  });
  renderer.compile(scene, camera);
  tiles.forEach((tl) => (tl.mesh.visible = false));
}

export function render() {
  camera.setViewOffset(S.width, S.height, -S.view.shift.x * S.width, S.view.lift.x * S.height, S.width, S.height);
  renderer.render(scene, camera);
}
