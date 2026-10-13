import { test, expect } from '@playwright/test';
import { prepare, open, toCube, cellPos, cameraPosition, drag, cubeAtHome } from './helpers.mjs';

test('mélanger puis résoudre avec le solveur de Kociemba', async ({ page }) => {
  const logs = [];
  page.on('console', (m) => logs.push(m.text()));
  await prepare(page);
  await open(page);
  await toCube(page);

  const button = page.locator('#shuffle-solve');
  await expect(button).toHaveText('Mélanger');
  await button.click();
  await expect(button).toHaveText('Résoudre', { timeout: 30_000 });
  await expect(button).toBeEnabled();
  expect(await cubeAtHome(page)).toBe(false);

  await button.click();
  await expect(button).toHaveText('Mélanger', { timeout: 40_000 });
  await page.waitForTimeout(2500); // laisse passer la vérification périodique de l'état résolu

  expect(logs.some((l) => l.includes('solution cubejs'))).toBe(true);
  await expect(page.locator('.confetti-container')).toHaveCount(0);
  expect(await cubeAtHome(page)).toBe(true);
});

test('en mode jeu, glisser sur un sticker tourne une couche et non le cube', async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);
  const button = page.locator('#shuffle-solve');
  await button.click();
  await expect(button).toHaveText('Résoudre', { timeout: 30_000 });

  const moves = () => page.evaluate(async () => (await import('/js/cube/animator.js')).getCompletedMoves().length);
  const before = await moves();
  const camera = await cameraPosition(page);
  await drag(page, await cellPos(page, 'front', 4), { x: 120, y: 0 });
  await expect.poll(moves).toBe(before + 1);
  expect(await cameraPosition(page)).toEqual(camera);

  // en dehors du cube, le glissement fait tourner tout le cube
  await drag(page, { x: 150, y: 150 });
  expect(await cameraPosition(page)).not.toEqual(camera);
});

test("un coin tourné sur place n'est pas considéré comme résolu", async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);

  await page.evaluate(async () => {
    const THREE = await import('three');
    const { app } = await import('/js/globals.js');
    window.__corner = app.cubies.find((c) => c.userData.homePos.equals(new THREE.Vector3(1, 1, 1)));
    window.__corner.quaternion.setFromAxisAngle(new THREE.Vector3(1, 1, 1).normalize(), (2 * Math.PI) / 3);
  });
  await page.waitForTimeout(2000);
  await expect(page.locator('.confetti-container')).toHaveCount(0);

  // remis en place, le cube est de nouveau résolu : la résolution « manuelle » est détectée
  await page.evaluate(() => window.__corner.quaternion.identity());
  await expect(page.locator('.confetti-container')).toHaveCount(1, { timeout: 4000 });
});
