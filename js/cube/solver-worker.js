// Worker de résolution, hors du thread principal. Mon réseau de neurones résout le cube sur la carte
// graphique (WebGPU) ; sans WebGPU, ou s'il échoue, cubejs prend le relais (algorithme de Kociemba).
// cubejs sert aussi à lire le cube : il rejoue les mouvements, le remet droit (centres à leur place) et donne
// ses 54 facettes.
importScripts(
  'https://unpkg.com/cubejs@1.3.2/lib/cube.js',
  'https://unpkg.com/cubejs@1.3.2/lib/solve.js',
  'neural-solver.js',
);

const { NeuralSolver } = self;

// Cube.initSolver() bloque plusieurs secondes : seulement quand Kociemba sert
let initialized = false;
function initKociemba() {
  if (!initialized) {
    Cube.initSolver();
    initialized = true;
  }
}

const timeout = (ms) => new Promise((resolve, reject) => setTimeout(() => reject(new Error('délai dépassé')), ms));

self.onmessage = async (event) => {
  const { cmd, id, alg } = event.data;
  try {
    if (cmd === 'init') {
      // à l'entrée dans le jeu : sans réseau, Kociemba se prépare pendant le mélange
      if (!NeuralSolver.available()) initKociemba();
      self.postMessage({ id, ok: true });
    } else if (cmd === 'load') {
      // au mélange : les poids du réseau se téléchargent pendant qu'on joue
      if (NeuralSolver.available()) NeuralSolver.load().catch(() => {});
      self.postMessage({ id, ok: true });
    } else if (cmd === 'solve') {
      const cube = new Cube();
      cube.move(alg);
      const upright = cube.upright();
      cube.move(upright);
      let solution = null;
      if (NeuralSolver.available()) {
        try {
          solution = await Promise.race([NeuralSolver.solve(cube.asString()), timeout(10000)]);
        } catch (e) {
          console.warn('[jeu] réseau de neurones indisponible, Kociemba prend le relais :', e);
        }
      }
      const solver = solution === null ? 'kociemba' : 'neural';
      if (solution === null) {
        initKociemba();
        solution = cube.solve();
      }
      self.postMessage({ id, ok: true, upright, solution, solver });
    }
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e && e.message) || e) });
  }
};
