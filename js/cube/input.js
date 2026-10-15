// Souris, doigt et clavier sur le cube : le tourner, tourner une rangée en jeu, ouvrir un sticker,
// et en jeu, le rapprocher ou l'éloigner (molette, deux doigts)
import * as THREE from 'three';
import { S } from '../state.js';
import { openSticker } from '../cards/card.js';
import { KEYS, item } from '../content.js';
import { clearHover, hoverAt } from './hover.js';
import { X, Y, clamp, qAxis } from './math.js';
import { scrollToCube } from './modes.js';
import { snapFromThrow, turnByKeys, turnTo } from './orientation.js';
import { busy, dragLayer, releaseLayer, startLayerDrag, turnFace } from './play.js';
import { canvas, faces, pick, tileByKey } from './scene.js';

const SPEED = 0.009; // radians par pixel glissé
const ZOOM = { min: 0.7, max: 1.6 }; // distance de la caméra, par rapport à celle du jeu
const touches = new Map(); // doigts posés sur le cube

const zoomTo = (value) => (S.zoom = clamp(value, ZOOM.min, ZOOM.max));
const spread = () => {
  const [a, b] = [...touches.values()];
  return Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
};
const midpoint = () => {
  const [a, b] = [...touches.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
};

// Le cube entier suit le pointeur dans toutes les directions et garde sa vitesse pour le lâcher
function spin(dx, dy, dt) {
  S.base.premultiply(qAxis(Y, dx * SPEED)).premultiply(qAxis(X, dy * SPEED));
  S.w.lerp(new THREE.Vector3(dy * SPEED, dx * SPEED, 0).divideScalar(dt), 0.5);
  S.target = null;
}

function onPointerDown(e) {
  if (e.pointerType === 'touch') touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (S.phase !== 'ready' || e.button > 0 || S.celebrating) return;
  // en jeu, deux doigts tournent le cube entier et, en s'écartant, le rapprochent ;
  // une rangée en cours va au quart de tour le plus proche
  if (S.mode === 'play' && touches.size === 2) {
    if (S.drag?.type === 'layer') releaseLayer(true);
    S.drag = { type: 'pinch', spread: spread(), zoom: S.zoom, mid: midpoint(), t: performance.now() };
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  if (S.drag || touches.size > 1) return; // un seul doigt à la fois
  const hit = pick(e.clientX, e.clientY);
  const now = performance.now();
  const start = {
    pointerId: e.pointerId,
    hit,
    sx: e.clientX,
    sy: e.clientY,
    last: { x: e.clientX, y: e.clientY, t: now },
    moved: 0,
  };
  // en jeu, un glissé sur le cube tourne une rangée ; ailleurs, il tourne le cube entier
  if (S.mode === 'play' && hit && !busy()) S.drag = { type: 'layer-pending', ...start };
  else if (hit || S.mode !== 'intro') S.drag = { type: 'rotate', ...start };
  else return;
  canvas.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const d = S.drag;
  if (!d) {
    if (e.pointerType === 'mouse') hoverAt(e.clientX, e.clientY);
    return;
  }
  if (d.type === 'pinch') {
    if (touches.size < 2) return;
    zoomTo((d.zoom * d.spread) / spread());
    const mid = midpoint();
    const now = performance.now();
    spin(mid.x - d.mid.x, mid.y - d.mid.y, Math.max(1, now - d.t) / 1000);
    d.mid = mid;
    d.t = now;
    return;
  }
  if (e.pointerId !== d.pointerId) return;
  const now = performance.now();
  const dt = Math.max(1, now - d.last.t) / 1000;
  const dx = e.clientX - d.last.x;
  const dy = e.clientY - d.last.y;
  d.moved += Math.abs(dx) + Math.abs(dy);
  if (d.type === 'rotate') {
    if (d.moved < 4) return;
    spin(dx, dy, dt);
    canvas.classList.add('dragging');
    clearHover();
  } else if (d.type === 'layer-pending') {
    const tx = e.clientX - d.sx;
    const ty = e.clientY - d.sy;
    if (Math.hypot(tx, ty) > 8) startLayerDrag(d, tx, ty);
  } else if (d.type === 'layer') {
    dragLayer(d, e.clientX, e.clientY, dt);
  }
  d.last = { x: e.clientX, y: e.clientY, t: now };
}

function onRelease(e) {
  touches.delete(e.pointerId);
  const d = S.drag;
  if (!d) return;
  if (d.type === 'pinch') {
    if (touches.size) return; // le geste finit quand les deux doigts sont levés
    S.drag = null;
    if (performance.now() - d.t > 80) S.w.multiplyScalar(0.2); // les doigts s'étaient arrêtés
    snapFromThrow();
    return;
  }
  if (e.pointerId !== d.pointerId) return;
  S.drag = null;
  canvas.classList.remove('dragging');
  const still = performance.now() - d.last.t > 80; // le pointeur s'était arrêté avant le lâcher
  if (d.type === 'rotate') {
    if (d.moved < 6) {
      if (e.type === 'pointerup') handleClick(d.hit);
      return;
    }
    if (still) S.w.multiplyScalar(0.2);
    // le cube se pose bien droit, sur la face la plus proche : en jeu aussi, les rangées restent lisibles
    if (S.mode === 'intro') scrollToCube();
    else snapFromThrow();
  } else if (d.type === 'layer') {
    releaseLayer(still);
  }
  // 'committed' : la rangée s'est déjà calée pendant le glissé
}

// En jeu, la page ne défile pas : la molette (ou le pincement du pavé tactile) rapproche ou éloigne le cube
function onWheel(e) {
  if (S.mode !== 'play') return;
  e.preventDefault();
  const pixels = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * S.height : e.deltaY;
  zoomTo(S.zoom * Math.exp(pixels * (e.ctrlKey ? 0.01 : 0.0015)));
}

function handleClick(hit) {
  if (!hit) return;
  if (S.mode === 'intro') {
    scrollToCube(); // le cube vient au centre, se pose, et ses images apparaissent
    return;
  }
  if (S.mode !== 'explore') return;
  const tile = hit.key && tileByKey[hit.key];
  const data = tile && item(tile.key);
  if (tile && faces[tile.face].visible && data && (data.hasContent || data.link)) {
    if (!data.hasContent) window.open(data.link, '_blank', 'noopener');
    else openSticker(tile.key);
  } else if (!faces[hit.face].visible) {
    turnTo(hit.face);
  }
}

// Clavier : les flèches tournent le cube d'un quart de tour, Entrée l'amène au centre puis ouvre la face devant
function onKeyDown(e) {
  if (S.phase !== 'ready' || S.mode === 'play') return;
  const arrows = { ArrowLeft: [Y, -1], ArrowRight: [Y, 1], ArrowUp: [X, -1], ArrowDown: [X, 1] };
  if (arrows[e.key]) {
    e.preventDefault();
    turnByKeys(...arrows[e.key]);
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (S.mode === 'intro') {
      scrollToCube();
    } else {
      const key = KEYS[S.front].find((k) => item(k).hasContent);
      if (key) openSticker(key, canvas);
    }
  }
}

// Clavier en jeu : U, D, L, R, F, B tournent une face (Maj : dans l'autre sens), les flèches le cube entier
function onPlayKey(e) {
  if (S.mode !== 'play' || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target instanceof Element && e.target.closest('input, textarea')) return;
  const arrows = { ArrowLeft: [Y, -1], ArrowRight: [Y, 1], ArrowUp: [X, -1], ArrowDown: [X, 1] };
  const letter = /^Key([UDLRFB])$/.exec(e.code)?.[1];
  if (arrows[e.key]) {
    e.preventDefault();
    turnByKeys(...arrows[e.key]);
  } else if (letter) {
    e.preventDefault();
    turnFace(letter, e.shiftKey);
  }
}

export function setupInput() {
  // un doigt posé sur le cube le fait tourner ; ailleurs, la page défile
  canvas.addEventListener(
    'touchstart',
    (e) => {
      const touch = e.touches[0];
      if (S.phase === 'ready' && touch && pick(touch.clientX, touch.clientY)) e.preventDefault();
    },
    { passive: false },
  );
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onRelease);
  canvas.addEventListener('pointercancel', onRelease);
  canvas.addEventListener('pointerleave', () => {
    if (!S.drag) clearHover();
  });
  canvas.addEventListener('keydown', onKeyDown);
  window.addEventListener('keydown', onPlayKey);
  window.addEventListener('wheel', onWheel, { passive: false });
}
