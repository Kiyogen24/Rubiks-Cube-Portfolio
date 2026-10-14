import * as THREE from 'three';
import { CUBE_CONTENT } from '../utils/constants.js';
import { calculateCubiePosition } from '../cube/cube.js';
import { liftCubie, dropCubie } from '../cube/lift.js';
import { app } from '../globals.js';

// Survol d'un sticker qui a un contenu : le cubie se soulève un peu et une étiquette nomme le contenu
let tip = null;
let hovered = null; // { cubie, face }
const stickerCenter = new THREE.Vector3();
const NORMALS = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};

function titleOf(content) {
  const lang = app.langManager?.currentLang || 'fr';
  return (content.i18n?.[lang]?.title || content.title).trim();
}

// Étiquette au-dessus et à droite du point visé (souris, ou centre du sticker au clavier)
function showTip(content, x, y) {
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'sticker-tip';
    tip.setAttribute('aria-hidden', 'true'); // au clavier, le nom est déjà celui du bouton du sticker
    document.body.appendChild(tip);
  }
  tip.textContent = titleOf(content);
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
  tip.classList.add('visible');
}

// Masque l'étiquette (le survol reste actif)
export function hidePreview() {
  tip?.classList.remove('visible');
}

// Fin du survol : le cubie redescend, l'étiquette disparaît
export function clearHover() {
  if (hovered) dropCubie(hovered.cubie);
  hovered = null;
  app.hoveredCubie = null;
  hidePreview();
  if (app.renderer) app.renderer.domElement.style.cursor = '';
}

// Survol de la case `face` du cubie, au point `point` de l'écran ; sans contenu, le survol s'arrête
export function setHover(cubie, face, point) {
  const content = CUBE_CONTENT[face]?.[calculateCubiePosition(cubie.userData.gridPos, face)];
  if (!content?.preview) {
    clearHover();
    return;
  }
  if (hovered?.cubie !== cubie || hovered?.face !== face) {
    clearHover();
    hovered = { cubie, face };
    app.hoveredCubie = cubie;
    if (!app.idleTwisting) liftCubie(cubie, face);
  }
  showTip(content, point.x, point.y);
  // vue d'ensemble : un clic zoome sur la face ; en vue zoomée, seuls les contenus ouvrent quelque chose
  const clickable = !app.isZoomed || content.hasContent || content.link;
  app.renderer.domElement.style.cursor = clickable ? 'pointer' : '';
}

// Clavier : le sticker qui a le focus est mis en avant comme au survol, l'étiquette posée sur lui
export function focusSticker(cubie, face) {
  stickerCenter.fromArray(NORMALS[face]).multiplyScalar(0.5); // centre de la case, sur la surface du cubie
  cubie.localToWorld(stickerCenter).project(app.camera);
  setHover(cubie, face, {
    x: (stickerCenter.x * 0.5 + 0.5) * window.innerWidth,
    y: (-stickerCenter.y * 0.5 + 0.5) * window.innerHeight,
  });
}

export function blurSticker(cubie) {
  if (hovered?.cubie === cubie) clearHover();
}
