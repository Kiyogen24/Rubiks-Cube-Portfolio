// Worker de résolution : charge cubejs (algorithme de Kociemba) hors du thread principal,
// car Cube.initSolver() bloque plusieurs secondes.
importScripts('https://unpkg.com/cubejs@1.3.2/lib/cube.js', 'https://unpkg.com/cubejs@1.3.2/lib/solve.js');

let initialized = false;

self.onmessage = (event) => {
  const { cmd, id, alg } = event.data;
  try {
    if (!initialized) {
      Cube.initSolver();
      initialized = true;
    }
    if (cmd === 'init') {
      self.postMessage({ id, ok: true });
    } else if (cmd === 'solve') {
      const cube = new Cube();
      cube.move(alg);
      // réorienter le cube (centres à leur place), puis résoudre avec des mouvements de faces
      const upright = cube.upright();
      cube.move(upright);
      self.postMessage({ id, ok: true, upright, solution: cube.solve() });
    }
  } catch (e) {
    self.postMessage({ id, ok: false, error: String((e && e.message) || e) });
  }
};
