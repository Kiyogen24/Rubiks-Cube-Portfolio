// Survol d'un sticker : son cubie se soulève et une étiquette le nomme
import { S, $ } from '../state.js';
import { item, tagText } from '../content.js';
import { NORMALS } from './geometry.js';
import { springStep } from './math.js';
import { canvas, cube, cubies, faces, pick, tileByKey } from './scene.js';

const tag = $('#tag');

function setHover(tile, x, y) {
  if (S.hovered && S.hovered !== tile) S.hovered.cubie.userData.liftTarget = 0;
  S.hovered = tile;
  tile.cubie.userData.liftTarget = 0.08;
  tile.cubie.userData.liftNormal.set(...NORMALS[tile.face]);
  tag.textContent = tagText(tile.key);
  tag.dataset.accent = tile.face; // l'étiquette prend la couleur de la face
  tag.style.left = `${x}px`;
  tag.style.top = `${y}px`;
  tag.classList.add('on');
  const data = item(tile.key);
  canvas.classList.toggle('pointing', Boolean(data.hasContent || data.link));
}

export function clearHover() {
  if (S.hovered) S.hovered.cubie.userData.liftTarget = 0;
  S.hovered = null;
  tag.classList.remove('on');
  canvas.classList.remove('pointing');
}

export function hoverAt(clientX, clientY) {
  if (S.phase !== 'ready') return clearHover();
  const hit = pick(clientX, clientY);
  if (S.mode === 'intro') {
    canvas.classList.toggle('pointing', Boolean(hit)); // le cube vide invite au clic
    return;
  }
  if (S.mode !== 'explore') return clearHover();
  const tile = hit && hit.key && tileByKey[hit.key];
  if (!tile || !faces[tile.face].visible || tile.hidden || (S.card && S.card.key === tile.key)) return clearHover();
  setHover(tile, hit.x, hit.y);
}

// Tous les cubies reposés d'un coup (avant de jouer)
export function dropLifts() {
  cubies.forEach((c) => {
    c.userData.liftTarget = 0;
    c.userData.lift = { x: 0, v: 0 };
    c.position.copy(c.userData.rest);
  });
}

// Le cubie survolé monte un peu le long de sa face, les autres redescendent
export function updateLifts(dt) {
  cubies.forEach((c) => {
    const d = c.userData;
    if (d.liftTarget === 0 && Math.abs(d.lift.x) < 1e-4 && Math.abs(d.lift.v) < 1e-3) {
      if (d.lift.x !== 0 && c.parent === cube) c.position.copy(d.rest);
      d.lift.x = 0;
      d.lift.v = 0;
      return;
    }
    springStep(d.lift, d.liftTarget, dt, 1, 0.18);
    if (c.parent === cube) c.position.copy(d.rest).addScaledVector(d.liftNormal, d.lift.x);
  });
}
