import { test, expect } from '@playwright/test';
import { prepare, open, toCube, zoomTo, zoomOut, cubeAtHome, cameraPosition, visibleLabelFaces } from './helpers.mjs';

test('au repos, le cube tourne seul et se remet en place dès que la souris bouge', async ({ page }) => {
  await prepare(page, { motion: true });
  await open(page);
  await toCube(page);
  const start = await cameraPosition(page);

  await page.evaluate(async () => {
    window.__app = (await import('/js/globals.js')).app;
  });
  await page.waitForFunction(() => window.__app.idleTwisting, null, { timeout: 20_000 });
  expect(await cameraPosition(page)).not.toEqual(start);

  await page.mouse.move(100, 100);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__app.idleTwisting)).toBe(false);
  expect(await cubeAtHome(page)).toBe(true);
  await expect(page.locator('.confetti-container')).toHaveCount(0);
});

test("les contenus apparaissent sur les stickers de la face tournée vers l'écran", async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);
  await expect.poll(() => visibleLabelFaces(page)).toEqual(['front']);

  await zoomTo(page, 'right');
  await expect.poll(() => visibleLabelFaces(page)).toEqual(['right']);
  await zoomOut(page);
  await expect.poll(() => visibleLabelFaces(page)).toEqual(['front']);
});
