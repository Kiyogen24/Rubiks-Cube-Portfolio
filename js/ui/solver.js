// En jeu, à droite du cube, après le premier clic sur « Résoudre » : le choix de la méthode (mon réseau de
// neurones ou l'algorithme de Kociemba) et les chiffres de leurs dernières résolutions, côte à côte. Sur un écran
// étroit, seul le choix reste, en haut ; le message sous le cube donne le nombre de coups.
import { S, $ } from '../state.js';
import { getLang, t } from '../i18n.js';
import { activeSolver, chooseSolver } from '../cube/play.js';

const panel = $('#solver');
const stats = $('#solver-stats');
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
  $('#solver-title').textContent = ui.title;
  inputs.forEach((input) => {
    const m = input.value;
    const off = m === 'neural' && S.neuralUsable === false;
    input.checked = m === method;
    input.disabled = off;
    input.parentElement.querySelector('.solver-name').textContent = ui[m];
    input.parentElement.title = off ? ui.neuralOff : '';
  });
  renderStats(ui);
}

export function setupSolver() {
  inputs.forEach((input) => input.addEventListener('change', () => chooseSolver(input.value)));
  renderSolver();
}
