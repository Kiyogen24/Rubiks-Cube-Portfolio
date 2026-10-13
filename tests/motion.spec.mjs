import { test, expect } from '@playwright/test';
import { prepare, open, toCube, zoomTo, zoomOut, cubeAtHome, cameraPosition, visibleLabels } from './helpers.mjs';

test('à la première arrivée, le cube mélangé se résout seul, sans confettis', async ({ page }) => {
  await prepare(page, { motion: true });
  await open(page);
  expect(await cubeAtHome(page)).toBe(false); // mélangé, caché derrière l'introduction

  await toCube(page);
  await expect.poll(() => cubeAtHome(page), { timeout: 8000 }).toBe(true);
  await expect(page.locator('#shuffle-solve')).toHaveText('Mélanger');
  await expect.poll(() => visibleLabels(page)).toEqual(['Compétences']);
  await page.waitForTimeout(1800); // vérification périodique de l'état résolu
  await expect(page.locator('.confetti-container')).toHaveCount(0);

  // une seule fois par session
  await page.reload();
  await page.waitForFunction(() => document.body.classList.contains('loaded'));
  expect(await cubeAtHome(page)).toBe(true);
});

test("un clic accélère l'ouverture", async ({ page }) => {
  await prepare(page, { motion: true });
  await open(page);
  await toCube(page);
  await page.waitForTimeout(400);
  await page.mouse.click(120, 650); // à côté du cube
  await expect.poll(() => cubeAtHome(page), { timeout: 1500 }).toBe(true);
});

test('au repos, le cube tourne seul et se remet en place dès que la souris bouge', async ({ page }) => {
  await prepare(page, { motion: true });
  await page.addInitScript(() => sessionStorage.setItem('hasSeenOpening', 'true'));
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

test('les étiquettes nomment la face de devant et disparaissent en vue zoomée', async ({ page }) => {
  await prepare(page, { lang: 'en' });
  await open(page);
  await toCube(page);
  await expect.poll(() => visibleLabels(page)).toEqual(['Skills']);

  await zoomTo(page, 'right');
  expect(await visibleLabels(page)).toEqual([]);
  await zoomOut(page);
  await expect.poll(() => visibleLabels(page)).toEqual(['Skills']);
});
