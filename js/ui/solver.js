// « Résoudre » ouvre, à droite du cube, le choix de la méthode (mon réseau de neurones ou l'algorithme de
// Kociemba) avec les chiffres de leurs dernières résolutions, côte à côte ; « Confirmer » lance la résolution et le
// panneau garde ses chiffres jusqu'à ce qu'on touche au cube ou qu'on mélange. Sur un écran étroit, il s'ouvre en
// bas, par-dessus les commandes, et se ferme à la confirmation pour laisser voir la résolution.
import { S, $ } from '../state.js';
import { getLang, t } from '../i18n.js';
import { activeSolver, busy, chooseSolver, closeSolver, solve } from '../cube/play.js';
import { placeCubeUi } from './controls.js';

const panel = $('#solver');
const stats = $('#solver-stats');
const confirmButton = $('#solver-confirm');
const compact = window.matchMedia('(max-width: 1199px)');
const inputs = [...panel.querySelectorAll('input[name="solver"]')];
const METHODS = ['neural', 'kociemba'];

// 380 ms, 1,2 s
function duration(ms) {
  const number = new Intl.NumberFormat(getLang(), { maximumFractionDigits: 1 });
  return ms < 1000 ? `${Math.round(ms)} ms` : `${number.format(ms / 1000)} s`;
}

function renderStats(ui) {
  const solves = METHODS.map((m) => S.solves[m]);
  if (!solves.some(Boolean)) {
    stats.innerHTML = '';
    return;
  }
  const row = (label, value) =>
    `<tr><th scope="row">${label}</th>${solves.map((s) => `<td>${s ? value(s) : '–'}</td>`).join('')}</tr>`;
  stats.innerHTML = `
    <p class="solver-sub">${ui.stats}</p>
    <table>
      <thead><tr><td></td>${METHODS.map((m) => `<th scope="col">${ui.columns[m]}</th>`).join('')}</tr></thead>
      <tbody>
        ${row(ui.moves, (s) => s.moves)}
        ${row(ui.quarters, (s) => s.quarters)}
        ${row(ui.time, (s) => duration(s.ms))}
      </tbody>
    </table>`;
}

export function renderSolver() {
  const ui = t().solver;
  const method = activeSolver();
  const choosing = S.solverPanel === 'choose';
  $('#solver-title').textContent = ui.title;
  inputs.forEach((input) => {
    const m = input.value;
    const off = m === 'neural' && S.neuralUsable === false;
    input.checked = m === method;
    input.disabled = off || !choosing; // une fois confirmé, le choix ne bouge plus
    input.parentElement.classList.toggle('off', off);
    input.parentElement.title = off ? ui.neuralOff : '';
    input.parentElement.querySelector('.solver-name').textContent = ui[m];
  });
  confirmButton.hidden = !choosing;
  renderStats(ui);
}

// « Résoudre » : le panneau s'ouvre sur le choix, s'il y a quelque chose à résoudre
export function openSolver() {
  if (busy() || !S.moves.length) return;
  S.solverPanel = 'choose';
  renderSolver();
  placeCubeUi();
  confirmButton.focus({ preventScroll: true });
}

function confirm() {
  if (compact.matches) closeSolver();
  else S.solverPanel = 'result';
  renderSolver();
  solve();
}

export function setupSolver() {
  inputs.forEach((input) => input.addEventListener('change', () => chooseSolver(input.value)));
  confirmButton.addEventListener('click', confirm);
  $('#solver-close').addEventListener('click', () => {
    closeSolver();
    $('#solve').focus({ preventScroll: true });
  });
  renderSolver();
}
