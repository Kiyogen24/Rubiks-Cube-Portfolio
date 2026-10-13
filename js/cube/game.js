import { app } from '../globals.js';
import { shuffle, solve, registerOnSolved, isBusy, resetMoves } from './animator.js';
import { updateFaceTextures } from './cube.js';
import { isCubeSolved } from './solved.js';
import { closeMenu } from '../ui/menu.js';
import { triggerConfetti } from '../ui/confetti.js';
import { showRotateHintOnce } from '../ui/hints.js';

const FACES = ['right', 'left', 'top', 'bottom', 'front', 'back'];

// Libellé du bouton Mélanger / Résoudre (clé de traduction, réappliquée au changement de langue)
let buttonKey = 'shuffleBtn';

export function updateGameButton() {
  const label = app.langManager.translate(buttonKey, 'ui');
  app.shuffleSolveButton.textContent = label;
  app.shuffleSolveButton.setAttribute('aria-label', label);
}

function setGameButton(key, disabled = false) {
  buttonKey = key;
  app.shuffleSolveButton.disabled = disabled;
  updateGameButton();
}

// Mode jeu : menu et bouton de langue masqués, rotation du cube entier sans zoom ni déplacement
function enterGameMode() {
  closeMenu();
  app.menu.style.pointerEvents = 'none';
  app.menu.setAttribute('aria-hidden', 'true');
  app.menuBtn.style.display = 'none';
  app.menuBtn.style.pointerEvents = 'none';
  app.menuBtn.setAttribute('aria-hidden', 'true');
  if (app.langBtn) app.langBtn.style.display = 'none';

  app.isPlayable = true;
  app.controls.enabled = true;
  app.controls.enableRotate = true;
  app.controls.enableZoom = false;
  app.controls.enablePan = false;
}

// Retour au portfolio
function exitGameMode() {
  app.isPlayable = false;
  setGameButton('shuffleBtn');

  app.controls.enabled = true;
  app.controls.enableZoom = true;
  app.controls.enableRotate = true;

  app.menuBtn.style.display = '';
  app.menuBtn.style.pointerEvents = '';
  app.menuBtn.removeAttribute('aria-hidden');
  app.menu.style.pointerEvents = '';
  app.menu.removeAttribute('aria-hidden');
  if (app.langBtn) app.langBtn.style.display = '';
}

// Replace exactement les cubies (positions, rotations) et rafraîchit les textures
export function resetRubikToHome() {
  const spacing = app.cubeSize + app.gap;
  app.rubiksCube.position.set(0, 0, 0);
  app.rubiksCube.quaternion.identity();
  app.cubies.forEach((cubie) => {
    const home = cubie.userData.homePos;
    cubie.position.copy(home).multiplyScalar(spacing);
    cubie.userData.gridPos.copy(home);
    cubie.quaternion.identity();
  });
  app.rubiksCube.updateMatrixWorld(true);
  FACES.forEach((faceType) => app.cubies.forEach((cubie) => updateFaceTextures(cubie, faceType)));
}

function onGameButtonClick() {
  if (isBusy() || app.openingPlaying) return; // attendre la fin des animations

  if (!app.isPlayable) {
    // nouveau mélange : « Résoudre » ne doit défaire que celui-ci
    resetMoves();
    setGameButton('shuffling', true);
    enterGameMode();
    shuffle(25);

    const interval = setInterval(() => {
      if (isBusy()) return;
      clearInterval(interval);
      setGameButton('solveBtn');
      showRotateHintOnce();
    }, 150);
  } else {
    // résolution automatique, le retour au portfolio se fait dans le callback onSolved
    setGameButton('solving', true);
    app.isAutoSolving = true;
    solve();
  }
}

export function setupGame() {
  app.shuffleSolveButton = document.createElement('button');
  app.shuffleSolveButton.id = 'shuffle-solve';
  app.shuffleSolveButton.className = 'shuffle-btn';
  app.shuffleSolveButton.addEventListener('click', onGameButtonClick);
  document.body.appendChild(app.shuffleSolveButton);

  // État résolu au dernier contrôle (null avant le premier)
  let lastSolved = null;

  // Fin de la résolution automatique
  registerOnSolved(() => {
    // la solution peut laisser des centres tournés sur eux-mêmes
    resetRubikToHome();
    exitGameMode();
    resetMoves();
    app.isAutoSolving = false;
    // déjà traité : le contrôle périodique ne doit pas le prendre pour une résolution manuelle
    lastSolved = true;
  });

  // Contrôle régulier de l'état résolu, pour détecter une résolution à la main
  // (ignoré pendant l'ouverture et les torsions au repos, qui reviennent d'elles-mêmes à l'état résolu)
  setInterval(() => {
    if (app.openingPlaying || app.idleTwisting) return;
    const solved = isCubeSolved();
    if (lastSolved === null) {
      lastSolved = solved;
      return;
    }
    if (solved && !lastSolved && !app.isAutoSolving) {
      resetRubikToHome();
      triggerConfetti(3500);
      resetMoves();
      exitGameMode();
    }
    lastSolved = solved;
  }, 800);
}
