import { test, expect } from '@playwright/test';
import {
  prepare,
  watchErrors,
  open,
  toCube,
  zoomTo,
  zoomOut,
  openCard,
  closeCard,
  cellPos,
  cameraPosition,
  drag,
  expectedAge,
} from './helpers.mjs';

test('la page se charge sans erreur', async ({ page }) => {
  const errors = watchErrors(page);
  await prepare(page, { motion: true });
  await open(page);
  await expect(page.locator('.typing-text')).toHaveCSS('animation-play-state', /running/);
  await toCube(page);
  expect(errors).toEqual([]);
});

test('les cartes en français reprennent le CV', async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);

  await zoomTo(page, 'back');
  let card = await openCard(page, 'back', 0);
  await expect(card).toContainText('Dassault Systèmes (DELMIA)');
  await expect(card).toContainText("L'agent surpasse les baselines heuristiques kanban");
  await closeCard(page);
  card = await openCard(page, 'back', 1);
  await expect(card).toContainText('Labelbox (Alignerr)');
  await closeCard(page);

  await zoomTo(page, 'left');
  card = await openCard(page, 'left', 0);
  await expect(card).toContainText('The University of Tokyo (Todai)');
  await closeCard(page);

  await zoomTo(page, 'top');
  card = await openCard(page, 'top', 6);
  await expect(card.locator('.card-facts > div', { hasText: 'Âge' })).toContainText(`${expectedAge()} ans`);
  await closeCard(page);

  await zoomTo(page, 'bottom');
  card = await openCard(page, 'bottom', 4);
  await expect(card.locator('iframe')).toHaveAttribute('src', 'assets/previews/cv.pdf');
});

test('la version anglaise traduit les cartes, le CV et les liens', async ({ page }) => {
  await prepare(page, { lang: 'en' });
  await open(page);
  await toCube(page);

  await zoomTo(page, 'back');
  let card = await openCard(page, 'back', 0);
  await expect(card).toContainText('R&D Internship in Deep Reinforcement Learning');
  await closeCard(page);

  await zoomTo(page, 'right');
  card = await openCard(page, 'right', 2);
  const broken = await card
    .locator('img')
    .evaluateAll((imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')));
  expect(broken).toEqual([]);
  await closeCard(page);

  await zoomTo(page, 'bottom');
  card = await openCard(page, 'bottom', 4);
  await expect(card.locator('iframe')).toHaveAttribute('src', 'assets/previews/cv_en.pdf');
  await closeCard(page);

  await zoomOut(page);
  await page.evaluate(() => document.getElementById('footer-section').scrollIntoView());
  const cvLink = page.locator('.social-link[download]');
  await expect(cvLink).toHaveAttribute('href', 'assets/previews/cv_en.pdf');
  await expect(cvLink).toContainText('Download Resume');

  // un lien rapide du pied de page met en avant la bonne entrée du menu
  await page.click('.quick-link[data-face="back"]');
  await expect(page.locator('.menu-item.active')).toHaveAttribute('data-face', 'back', { timeout: 6000 });
});

test('on ne peut pas faire tourner le cube en mode zoom après une carte', async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);
  await zoomTo(page, 'back');
  await openCard(page, 'back', 0);
  await closeCard(page);

  const before = await cameraPosition(page);
  await drag(page);
  expect(await cameraPosition(page)).toEqual(before);

  // en sortant du zoom, la rotation revient
  await zoomOut(page);
  const home = await cameraPosition(page);
  await drag(page);
  expect(await cameraPosition(page)).not.toEqual(home);
});

test("un clic rapide sur un sticker ne laisse pas d'aperçu derrière la carte", async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);
  await zoomTo(page, 'back');
  for (const index of [0, 1, 2]) {
    const p = await cellPos(page, 'back', index);
    await page.mouse.click(p.x, p.y);
    await page.locator('.info-card.active').waitFor();
    await page.waitForTimeout(400);
    await expect(page.locator('.preview-popup.visible')).toHaveCount(0);
    await closeCard(page);
    await page.mouse.move(20, 450);
  }
});

test('les textures de survol sont libérées', async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);
  await zoomTo(page, 'front');
  const textures = () => page.evaluate(async () => (await import('/js/globals.js')).app.renderer.info.memory.textures);
  const before = await textures();
  const a = await cellPos(page, 'front', 0);
  const b = await cellPos(page, 'front', 1);
  for (let i = 0; i < 20; i++) {
    await page.mouse.move(a.x, a.y);
    await page.waitForTimeout(60);
    await page.mouse.move(b.x, b.y);
    await page.waitForTimeout(60);
  }
  await page.mouse.move(20, 450);
  await page.waitForTimeout(300);
  expect((await textures()) - before).toBeLessThanOrEqual(2);
});
