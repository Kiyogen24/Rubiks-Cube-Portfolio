// Les trois temps du cube : l'accueil (il tourne, vide), l'exploration (au centre, ses contenus) et le jeu
import { S, $, root, reduced } from '../state.js';
import { closeCard } from '../cards/card.js';
import { updateCubeUi } from '../ui/controls.js';
import { nearestOrientation } from './geometry.js';
import { clearHover, dropLifts } from './hover.js';
import { busy, isSolved, normalizeSolved, resetCube, setStatus, solve, startSolver } from './play.js';

// Le cube arrive au centre : il se pose sur une face et ses images apparaissent
export function enterExplore() {
  if (S.mode !== 'intro') return;
  S.mode = 'explore';
  if (!S.drag || S.drag.type !== 'rotate') S.target = nearestOrientation(S.base);
  updateCubeUi();
}

// Retour à l'accueil (la page remonte) : les images s'effacent et le cube vide se remet à tourner
export function leaveExplore() {
  if (S.card && S.card.origin === 'sticker') closeCard(true);
  S.mode = 'intro';
  S.target = null;
  clearHover();
  updateCubeUi();
}

// Un clic sur le cube de l'accueil fait comme un défilement : le cube vient au centre
export function scrollToCube() {
  window.scrollTo({ top: $('#cube-view').offsetTop, behavior: reduced.matches ? 'auto' : 'smooth' });
}

export function enterPlay() {
  closeCard(true);
  clearHover();
  dropLifts();
  S.mode = 'play';
  S.userMoves = 0;
  S.zoom = 1;
  S.target = nearestOrientation(S.base);
  S.beforePlay = S.target.clone();
  root.classList.add('locked');
  setStatus(isSolved() ? '' : 'shuffled');
  startSolver();
  updateCubeUi();
  $('#shuffle').focus({ preventScroll: true });
}

// « Terminé » : le cube se résout s'il le faut, puis il reprend sa position et sa taille d'avant le jeu
export function exitPlay() {
  if (busy()) return;
  const done = () => {
    normalizeSolved();
    S.mode = 'explore';
    S.moves = [];
    S.zoom = 1;
    S.target = S.beforePlay || nearestOrientation(S.base);
    S.markDirty = true;
    root.classList.remove('locked');
    updateCubeUi();
    $('#play').focus({ preventScroll: true });
  };
  if (isSolved()) done();
  else solve(done);
}

// Sortie immédiate (l'accueil ou une carte demandés pendant le jeu) : le cube est remis en ordre d'un coup
export function exitPlayNow() {
  resetCube();
  root.classList.remove('locked');
  S.mode = 'explore';
  S.zoom = 1;
  setStatus('');
  updateCubeUi();
}
