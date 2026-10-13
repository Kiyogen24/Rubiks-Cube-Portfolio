import { app } from '../globals.js';
import { applyMovesInstantly, playMoves, hurryMoves } from './animator.js';
import { resetRubikToHome } from './game.js';
import { isCubeSectionInView } from '../utils/view.js';

// Ouverture : à la première arrivée sur le cube (une fois par session), le cube est mélangé et se résout seul.
// Un clic ou une touche accélère la fin ; rien ne se passe si l'utilisateur préfère réduire les animations.
// (pas la molette : l'inertie d'un pavé tactile continue d'en envoyer après l'arrivée sur le cube)
const MOVES = 9;
const MOVE_DURATION = 190; // ms
const START_DELAY = 350; // ms, le temps de voir le cube mélangé

// Mélange de faces extérieures uniquement (les centres restent en place), sans annulations immédiates
function randomScramble(count) {
  const layers = ['row', 'col', 'depth'];
  const moves = [];
  while (moves.length < count) {
    const move = {
      layer: layers[Math.floor(Math.random() * 3)],
      number: Math.random() < 0.5 ? -1 : 1,
      orientation: Math.random() < 0.5 ? 0 : 1,
    };
    const prev = moves[moves.length - 1];
    if (prev && prev.layer === move.layer && prev.number === move.number) continue;
    moves.push(move);
  }
  return moves;
}

export function setupOpening() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (sessionStorage.getItem('hasSeenOpening')) return;

  const scramble = randomScramble(MOVES);
  const solution = scramble
    .slice()
    .reverse()
    .map((m) => ({ ...m, orientation: 1 - m.orientation }));
  applyMovesInstantly(scramble);
  app.openingPlaying = true;

  let finished;
  app.openingDone = new Promise((resolve) => (finished = resolve));

  const container = document.querySelector('.container');
  let duration = MOVE_DURATION;
  const hurry = () => {
    if (!isCubeSectionInView()) return;
    duration = 40;
    hurryMoves(duration);
  };
  const events = ['pointerdown', 'keydown'];
  events.forEach((type) => window.addEventListener(type, hurry, { passive: true }));

  async function play() {
    sessionStorage.setItem('hasSeenOpening', 'true');
    await playMoves(solution, duration);
    events.forEach((type) => window.removeEventListener(type, hurry));
    resetRubikToHome(); // positions exactes et textures à jour
    app.openingPlaying = false;
    finished();
  }

  // démarre quand la section du cube occupe l'écran
  const onScroll = () => {
    if (!isCubeSectionInView()) return;
    container.removeEventListener('scroll', onScroll);
    setTimeout(play, START_DELAY);
  };
  container.addEventListener('scroll', onScroll, { passive: true });
  requestAnimationFrame(onScroll); // page rechargée directement sur le cube
}
