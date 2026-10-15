// Célébrations : un petit bond quand le bouton résout le cube ; une vraie fête quand on l'a résolu à la main
// après un mélange (tour de joie, confettis-stickers, score), puis la page descend vers « Écrivez-moi »
import * as THREE from 'three';
import { S, $, reduced } from '../state.js';
import { exitPlay } from '../cube/modes.js';
import { flourish } from '../cube/orientation.js';
import { setStatus } from '../cube/play.js';
import { cube, project } from '../cube/scene.js';
import { burst } from './confetti.js';
import { showSolvedContact } from './contact.js';

const statusEl = $('#status');
let token = 0;

const cubeOnScreen = () => project(new THREE.Vector3().setFromMatrixPosition(cube.matrixWorld));

// le cube saute : une impulsion sur le ressort de sa taille (main.js), qui rebondit un peu en revenant
function hop(power) {
  if (!reduced.matches) S.scale.v += power;
}

function pop(el) {
  el.classList.remove('pop');
  void el.offsetWidth; // relance l'animation
  el.classList.add('pop');
}

export function celebrate({ byHand, moves, time }) {
  const fast = reduced.matches;
  if (!byHand || !S.scrambled) {
    // résolu par le bouton, ou à la main sans mélange : un petit bond et une bouffée de stickers
    if (byHand) {
      S.score = null;
      setStatus('bravo');
      pop(statusEl);
    }
    hop(1.2);
    if (!fast) {
      const c = cubeOnScreen();
      burst({ x: c.x, y: c.y - 40, count: 26, angle: -Math.PI / 2, spread: 2.2, speed: 700, size: 9 });
    }
    return;
  }

  // résolu à la main après un mélange : la vraie fête
  S.scrambled = false;
  S.celebrating = true;
  S.score = { moves, time };
  setStatus('bravo');
  pop(statusEl);
  navigator.vibrate?.([18, 40, 28]); // sur les téléphones qui le permettent, au même moment
  if (!fast) {
    hop(2.6);
    flourish(2, 1.6);
    const c = cubeOnScreen();
    burst({ x: c.x, y: c.y, count: 90, speed: 1100, size: 12 });
    setTimeout(() => {
      const h = window.innerHeight;
      burst({ x: 0, y: h, count: 55, angle: -Math.PI / 3, spread: 0.7, speed: 1800, size: 12 });
      burst({ x: window.innerWidth, y: h, count: 55, angle: (-2 * Math.PI) / 3, spread: 0.7, speed: 1800, size: 12 });
    }, 220);
  }

  // la récompense d'abord, ensuite seulement la page descend vers « Écrivez-moi », au message adapté
  const mine = ++token;
  setTimeout(
    () => {
      S.celebrating = false;
      if (mine !== token || S.mode !== 'play') return;
      showSolvedContact(moves);
      exitPlay();
      window.scrollTo({ top: $('#contact').offsetTop, behavior: fast ? 'auto' : 'smooth' });
      $('#mail').focus({ preventScroll: true });
    },
    fast ? 1600 : 3200,
  );
}
