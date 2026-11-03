// Sans carte graphique (--use-angle=swiftshader, dans la configuration, cache WebGPU), mon réseau de neurones tourne
// sur le processeur, en WebAssembly SIMD
import { test, expect } from '@playwright/test';
import { play, shuffle } from './helpers.mjs';

test('sans WebGPU, mon réseau de neurones résout le cube sur le processeur', async ({ page }) => {
  const logs = [];
  page.on('console', (m) => logs.push(m.text()));
  await play(page);
  expect(await page.evaluate(async () => Boolean(await navigator.gpu?.requestAdapter()))).toBe(false);
  await shuffle(page);
  await page.click('#solve');
  await expect(page.locator('#solver input[value="neural"]')).toBeChecked();
  await page.click('#solver-confirm');
  await page.waitForFunction(() => !window.__play.busy() && !window.__S.moves.length, null, { timeout: 60_000 });
  expect(await page.evaluate(() => window.__play.isSolved())).toBe(true);
  expect(logs.some((l) => l.includes('solution neural'))).toBe(true);
  await expect(page.locator('#status')).toHaveText(/^Résolu par mon réseau de neurones en \d+ coups$/);
});
