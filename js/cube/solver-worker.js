// Worker de résolution, hors du thread principal, avec la méthode choisie : mon réseau de neurones sur la carte
// graphique (WebGPU), ou cubejs (algorithme de Kociemba), qui prend aussi le relais si le réseau échoue.
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

// Le réseau sert tant que la carte graphique et ses poids n'ont pas échoué ; trop lent (poids encore en route),
// Kociemba le remplace pour cette fois
let broken = false;
const neuralUsable = async () => !broken && (await NeuralSolver.usable());
const TOO_SLOW = new Error('délai dépassé');
const timeout = (ms) => new Promise((resolve, reject) => setTimeout(() => reject(TOO_SLOW), ms));

self.onmessage = async (event) => {
  const { cmd, id, alg, method } = event.data;
  try {
    if (cmd === 'init') {
      // à l'entrée dans le jeu : la page apprend si le réseau peut tourner ici ; sinon Kociemba se prépare
      const neural = await neuralUsable();
      if (!neural) initKociemba();
      self.postMessage({ id, ok: true, neural });
    } else if (cmd === 'load') {
      // au mélange, ou quand on choisit une méthode : elle se prépare pendant qu'on joue
      if (method === 'kociemba') initKociemba();
      else if (await neuralUsable()) NeuralSolver.load().catch(() => {});
      self.postMessage({ id, ok: true });
    } else if (cmd === 'solve') {
      const cube = new Cube();
      cube.move(alg);
      const upright = cube.upright();
      cube.move(upright);
      let found = null;
      if (method !== 'kociemba' && (await neuralUsable())) {
        try {
          const result = await Promise.race([NeuralSolver.solve(cube.asString()), timeout(10000)]);
          if (result.solution !== null) found = { ...result, solver: 'neural' };
        } catch (e) {
          if (e !== TOO_SLOW) broken = true;
          console.warn('[jeu] réseau de neurones indisponible, Kociemba prend le relais :', e);
        }
      }
      if (!found) {
        initKociemba();
        const start = performance.now();
        found = { solution: cube.solve(), solver: 'kociemba', ms: performance.now() - start };
      }
      self.postMessage({ id, ok: true, upright, ...found, neural: await neuralUsable() });
    }
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e && e.message) || e) });
  }
};
