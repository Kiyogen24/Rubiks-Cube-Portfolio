// Point d'entrée : chargement (le cube sert de chargeur s'il le faut), boucle d'animation, langue, thème et boutons
import { S, $, root, reduced, sleep, store, waitFor } from './state.js';
import { getLang, setLang, t } from './i18n.js';
import { CUBE_CONTENT } from './utils/constants.js';
import { closeCard, openFromButton, refreshCard, updateCard } from './cards/card.js';
import { netButtons, placeCubeUi, setFront, updateCubeUi, updateMark } from './ui/controls.js';
import { TILT, faceForward } from './cube/geometry.js';
import { updateLifts } from './cube/hover.js';
import { setupInput } from './cube/input.js';
import { clamp, springStep } from './cube/math.js';
import { enterExplore, enterPlay, exitPlay, exitPlayNow, leaveExplore } from './cube/modes.js';
import { turnTo, updateOrientation } from './cube/orientation.js';
import { onSolved, onSolverChange, setStatus, shuffle, updateLayer } from './cube/play.js';
import { canvas, cube, render, resize, snapFraming, updateCamera, updateTiles, warmUp } from './cube/scene.js';
import { loadImage } from './cube/textures.js';
import { celebrate } from './ui/celebrate.js';
import { measureContact, renderContact, setupContact } from './ui/contact.js';
import { openSolver, renderSolver, setupSolver } from './ui/solver.js';

const intro = $('#intro');
const cubeView = $('#cube-view');
const contact = $('#contact');
const loading = $('#loading');
const langButtons = [...document.querySelectorAll('.lang button')];

// ---------- Langue et thème ----------
function applyLang() {
  const ui = t();
  root.lang = getLang();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = ui[el.dataset.i18n];
  });
  document
    .querySelectorAll('[data-i18n-label]')
    .forEach((el) => el.setAttribute('aria-label', ui[el.dataset.i18nLabel]));
  canvas.setAttribute('aria-label', ui.cube);
  $('#net').setAttribute('aria-label', ui.faces);
  netButtons.forEach((b) => b.setAttribute('aria-label', ui.labels[b.dataset.face]));
  langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  if (S.front) setFront(S.front);
  setStatus(S.status);
  refreshCard();
  renderContact();
  renderSolver();
}
langButtons.forEach((b) =>
  b.addEventListener('click', () => {
    setLang(b.dataset.lang);
    applyLang();
  }),
);
// le thème est posé avant le premier affichage (index.html) ; le bouton le change et le retient
$('#theme').addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  store('theme', root.dataset.theme);
});

// ---------- Boutons ----------
$('#play').addEventListener('click', enterPlay);
$('#done').addEventListener('click', exitPlay);
$('#shuffle').addEventListener('click', shuffle);
$('#solve').addEventListener('click', openSolver);
$('#card-close').addEventListener('click', () => closeCard());
for (const [id, kind] of [
  ['#open-about', 'about'],
  ['#open-cv', 'cv'],
]) {
  $(id).addEventListener('click', (e) => {
    if (S.mode === 'play') exitPlayNow();
    openFromButton(kind, e.currentTarget);
  });
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.card) closeCard();
});
// le nom ramène à l'accueil
$('#home').addEventListener('click', (e) => {
  e.preventDefault();
  if (S.mode === 'play') exitPlayNow();
  closeCard(true);
  window.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
});
// le patron : un clic tourne le cube vers la face
netButtons.forEach((b) =>
  b.addEventListener('click', async () => {
    if (S.phase !== 'ready' || S.mode !== 'explore') return;
    if (S.card) {
      closeCard(true);
      await waitFor(() => !S.card, 700);
    }
    turnTo(b.dataset.face);
  }),
);

// ---------- Défilement ----------
// 0 à l'accueil, 1 au cube : mesuré sur la section du cube, dont la hauteur ne bouge pas quand la barre
// du navigateur du téléphone se replie
function readScroll() {
  S.scrollP = clamp(window.scrollY / Math.max(1, cubeView.offsetTop));
  S.contactP = clamp((window.scrollY - cubeView.offsetTop) / Math.max(1, contact.offsetTop - cubeView.offsetTop));
}
window.addEventListener('scroll', readScroll, { passive: true });
window.addEventListener('resize', () => {
  resize();
  readScroll();
  measureContact();
});

// Molette et pavé tactile : un geste, une page. Sinon un grand lancer passe de l'accueil à « Contactez-moi »
// sans s'arrêter au cube ; l'élan qui suit un geste est ignoré tant qu'il dure. (Au doigt, le défilement
// natif s'arrête à chaque page : scroll-snap-stop.) En jeu, la molette zoome (cube/input.js).
const pages = [...document.querySelectorAll('.page')];
// Un geste dure tant que les crans s'enchaînent : chacun relance un minuteur, et le geste ne finit que si le
// minuteur arrive au bout. L'élan d'un pavé tactile, même irrégulier, reste un seul geste ; et si la page se fige
// un instant, les crans en attente passent avant le minuteur : le geste n'est pas coupé en deux.
let gesture = false;
let gestureEnd = 0;
window.addEventListener(
  'wheel',
  (e) => {
    if (S.mode === 'play' || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (e.target instanceof Element && e.target.closest('.card, textarea')) return; // une carte, un message défilent
    e.preventDefault();
    const fresh = !gesture;
    gesture = true;
    clearTimeout(gestureEnd);
    gestureEnd = setTimeout(() => (gesture = false), 250);
    if (!fresh) return;
    const current = pages.reduce(
      (best, p, i) =>
        Math.abs(p.offsetTop - window.scrollY) < Math.abs(pages[best].offsetTop - window.scrollY) ? i : best,
      0,
    );
    const next = clamp(current + Math.sign(e.deltaY), 0, pages.length - 1);
    if (next !== current) {
      window.scrollTo({ top: pages[next].offsetTop, behavior: reduced.matches ? 'auto' : 'smooth' });
    }
  },
  { passive: false },
);

// ---------- Chargement : le cube ne sert de chargeur que si les images tardent ----------
const previews = Object.values(CUBE_CONTENT).flatMap((cells) => Object.values(cells).map((it) => it.preview));
const everything = () => Promise.all([...previews.map(loadImage), loadImage('assets/pp.png'), document.fonts?.ready]);

function showIntro() {
  S.phase = 'ready';
  loading.hidden = true;
  root.classList.remove('is-ready');
  void root.offsetWidth; // relance l'entrée du texte
  root.classList.add('is-ready');
  loadImage(`assets/cv/cv-${getLang()}-1.webp`); // le CV est prêt quand on l'ouvre
  requestAnimationFrame(warmUp);
}
function startLoader() {
  S.phase = 'loading';
  S.scale = { x: 0.32, v: 0 };
  S.w.set(0.6, 7, 0);
  S.target = null;
  loading.hidden = false;
  root.classList.remove('is-ready');
  snapFraming();
}
// le ressort part de la vitesse du chargement : pas de coupure
function land() {
  S.phase = 'landing';
  S.target = TILT.clone().multiply(faceForward('back'));
  loading.hidden = true;
}
async function boot() {
  const all = everything();
  const quick = await Promise.race([all.then(() => true), sleep(320).then(() => false)]);
  if (quick) {
    S.phase = 'ready';
    snapFraming();
    showIntro();
    return;
  }
  startLoader();
  await all;
  land();
}
function updateLoader(dt, fast) {
  if (S.phase === 'loading') {
    S.w.set(0.6, 7, 0);
    S.scale.x = 0.32;
  } else if (S.phase === 'landing') {
    springStep(S.scale, 1, dt, fast ? 1 : 0.72, 0.55);
    if (S.scale.x > 0.75 && !root.classList.contains('is-ready')) {
      showIntro();
      S.phase = 'landing';
    }
    if (Math.abs(S.scale.x - 1) < 0.004 && Math.abs(S.scale.v) < 0.02 && S.w.length() < 0.05) {
      S.scale = { x: 1, v: 0 };
      S.phase = 'ready';
      S.target = null; // le cube vide se remet à tourner
    }
  }
}

// ---------- Une image ----------
function update(dt) {
  const fast = reduced.matches;
  updateLoader(dt, fast);
  if (S.phase === 'ready') springStep(S.scale, 1, dt, 0.4, 0.5); // les bonds des célébrations
  updateOrientation(dt, fast);
  // le défilement fait passer de l'accueil au cube, et retour
  if (S.phase === 'ready' && S.mode !== 'play' && !S.drag) {
    // le cube s'explore sur sa page ; à l'accueil et sur « Contactez-moi », il tourne, vide, à côté du texte
    if (S.mode === 'intro' && S.scrollP > 0.55 && S.contactP < 0.45) enterExplore();
    else if (S.mode === 'explore' && (S.scrollP < 0.45 || S.contactP > 0.55)) leaveExplore();
  }
  if (S.card && S.card.target === 1 && (Math.abs(S.scrollP - S.card.scrollAt) > 0.15 || S.contactP > 0.15)) {
    closeCard(true);
  }
  // le texte d'accueil s'efface dès qu'on descend, avant de croiser le cube (plus tôt sur téléphone)
  const introOpacity = clamp(1 - S.scrollP / (S.narrow ? 0.16 : 0.42));
  intro.style.opacity = String(introOpacity);
  intro.style.visibility = introOpacity < 0.01 ? 'hidden' : '';
  // au centre, le fond prend un peu la couleur de la face tournée vers soi
  const accent = S.mode === 'intro' ? undefined : S.front;
  if (root.dataset.accent !== accent) {
    if (accent) root.dataset.accent = accent;
    else delete root.dataset.accent;
  }
  cube.quaternion.copy(S.base);
  cube.scale.setScalar(S.scale.x);
  if (S.markDirty) {
    S.markDirty = false;
    updateMark();
  }
  updateCamera(dt, fast);
  updateLayer(dt);
  updateLifts(dt);
  const front = updateTiles(dt, fast);
  if (front !== S.front && S.mode !== 'play' && S.phase !== 'loading') setFront(front);
  updateCard(dt);
  placeCubeUi();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

resize();
readScroll();
setupInput();
setupContact();
onSolved(celebrate);
onSolverChange(renderSolver);
setupSolver();
applyLang();
setFront('back');
updateCubeUi();
snapFraming();
requestAnimationFrame(frame);
boot();
