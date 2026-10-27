// Les deux solveurs du bouton « Résoudre » : mon réseau de neurones (WebGPU), et Kociemba (cubejs) quand il
// manque. En local, ces tests utilisent la carte graphique (--use-angle=swiftshader, dans la configuration, cache
// WebGPU) ; en CI, sans carte graphique, Kociemba résout le cube et le test du réseau est sauté.
import { test, expect } from '@playwright/test';
import { cubeAtHome, play, shuffle } from './helpers.mjs';

if (!process.env.CI) test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } });

// En jeu : mélanger, puis « Résoudre » ; retourne les messages de la console
async function shuffleAndSolve(page) {
  const logs = [];
  page.on('console', (m) => logs.push(m.text()));
  await shuffle(page);
  expect(await cubeAtHome(page)).toBe(false);

  await page.click('#solve');
  await expect(page.locator('#status')).toHaveText('Résolution…');
  await page.waitForFunction(() => !window.__play.busy() && !window.__S.moves.length, null, { timeout: 40_000 });
  // coins et arêtes exactement à leur place ; un centre peut rester tourné sur lui-même, comme le logo d'un vrai cube
  expect(await page.evaluate(() => window.__play.isSolved())).toBe(true);
  const placed = await page.evaluate(() =>
    window.__scene.cubies.every((c) => {
      const { x, y, z } = c.userData.grid;
      const center = [x, y, z].filter((v) => v !== 0).length < 2;
      return c.position.distanceTo(c.userData.home) < 1e-3 && (center || Math.abs(Math.abs(c.quaternion.w) - 1) < 1e-6);
    }),
  );
  expect(placed).toBe(true);
  return logs;
}

test('mélanger puis résoudre avec Kociemba quand mon réseau de neurones manque', async ({ page }) => {
  await page.route('**/neural-solver.bin', (route) => route.abort());
  await play(page);
  const logs = await shuffleAndSolve(page);
  expect(logs.some((l) => l.includes('solution kociemba'))).toBe(true);
  await expect(page.locator('#status')).toHaveText('');
});

test('mélanger puis résoudre avec mon réseau de neurones, sur la carte graphique', async ({ page }) => {
  await play(page);
  test.skip(!(await page.evaluate(async () => Boolean(await navigator.gpu?.requestAdapter()))), 'pas de WebGPU');
  const logs = await shuffleAndSolve(page);
  expect(logs.some((l) => l.includes('solution neural'))).toBe(true);
  // le message dit qui l'a résolu, et reste affiché
  await expect(page.locator('#status')).toHaveText(/^Résolu par mon réseau de neurones en \d+ coups$/);
});
