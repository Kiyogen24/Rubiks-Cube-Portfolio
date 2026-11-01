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

// Pourquoi le réseau ne peut pas servir ici : null s'il le peut, 'webgpu', 'gpu', ou 'failed' quand la carte
// graphique ou ses poids ont échoué ; trop lent, Kociemba le remplace seulement pour cette fois
let failed = false;
const neuralReason = async () => (failed ? 'failed' : NeuralSolver.unusable());
const TOO_SLOW = new Error('délai dépassé');
const timeout = (ms) => new Promise((resolve, reject) => setTimeout(() => reject(TOO_SLOW), ms));
// les poids arrivent : la page affiche la progression pendant une résolution
const loadNeural = () => NeuralSolver.load((progress) => self.postMessage({ progress }));

self.onmessage = async (event) => {
  const { cmd, id, alg, method } = event.data;
  try {
    if (cmd === 'init') {
      // à l'entrée dans le jeu : la page apprend si le réseau peut tourner ici ; sinon Kociemba se prépare
      const reason = await neuralReason();
      if (reason) initKociemba();
      self.postMessage({ id, ok: true, reason });
    } else if (cmd === 'load') {
      // au mélange, ou quand on choisit une méthode : elle se prépare pendant qu'on joue (sans télécharger les poids
      // si le navigateur demande d'économiser les données : ils arriveront à la résolution)
      if (method === 'kociemba') initKociemba();
      else if (!(await neuralReason()) && !navigator.connection?.saveData) loadNeural().catch(() => {});
      self.postMessage({ id, ok: true });
    } else if (cmd === 'solve') {
      const cube = new Cube();
      cube.move(alg);
      const upright = cube.upright();
      cube.move(upright);
      let found = null;
      if (method !== 'kociemba' && !(await neuralReason())) {
        try {
          // les poids peuvent mettre du temps à arriver sur un téléphone ; la recherche, elle, est rapide
          await Promise.race([loadNeural(), timeout(60000)]);
          const result = await Promise.race([NeuralSolver.solve(cube.asString()), timeout(10000)]);
          if (result.solution !== null) found = { ...result, solver: 'neural' };
        } catch (e) {
          if (e !== TOO_SLOW) failed = true;
          console.warn('[jeu] réseau de neurones indisponible, Kociemba prend le relais :', e);
        }
      }
      if (!found) {
        initKociemba();
        const start = performance.now();
        found = { solution: cube.solve(), solver: 'kociemba', ms: performance.now() - start };
      }
      self.postMessage({ id, ok: true, upright, ...found, reason: await neuralReason() });
    }
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e && e.message) || e) });
  }
};
