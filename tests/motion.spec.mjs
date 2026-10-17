import { test, expect } from '@playwright/test';
import { prepare, open, toCube, still } from './helpers.mjs';

// Faces dont les images sont affichées sur les stickers
const shownFaces = (page) =>
  page.evaluate(() => Object.keys(window.__scene.faces).filter((f) => window.__scene.faces[f].visible));

test('à l’accueil le cube vide tourne seul, puis ses images apparaissent au centre', async ({ page }) => {
  await prepare(page, { motion: true });
  await open(page);
  const start = await page.evaluate(() => window.__S.base.toArray());
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__S.base.toArray())).not.toEqual(start);
  expect(await page.evaluate(() => window.__scene.tiles.every((t) => !t.mesh.visible))).toBe(true);

  await page.evaluate(() => window.scrollTo(0, innerHeight));
  await page.waitForFunction(() => window.__S.mode === 'explore');
  await still(page);
  await expect.poll(() => shownFaces(page)).toEqual([await page.evaluate(() => window.__S.front)]);
  await expect
    .poll(() => page.evaluate(() => window.__scene.faces[window.__S.front].tiles.every((t) => t.mesh.visible)))
    .toBe(true);
});

test("les images suivent la face tournée vers l'écran", async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);
  await expect.poll(() => shownFaces(page)).toEqual(['back']);

  // au survol d'une case du patron, le nom de la face visée s'affiche au-dessus
  const right = page.locator('#net button[data-face="right"]');
  await right.hover();
  await expect.poll(() => right.evaluate((b) => getComputedStyle(b, '::after').opacity)).toBe('1');
  expect(await right.evaluate((b) => getComputedStyle(b, '::after').content)).toBe('"Projets"');
  await page.click('#net button[data-face="right"]');
  await still(page);
  await expect.poll(() => shownFaces(page)).toEqual(['right']);
  await expect(page.locator('#face-name')).toHaveText('Projets');
  await expect(page.locator('#net button[data-face="right"]')).toHaveAttribute('aria-current', 'true');
  // le fond prend la couleur de la face devant ; il redevient lavande à l'accueil
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'right');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.__S.mode === 'intro');
  await expect(page.locator('html')).not.toHaveAttribute('data-accent', /./);
});
