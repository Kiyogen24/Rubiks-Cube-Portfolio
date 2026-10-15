import { test, expect } from '@playwright/test';
import {
  prepare,
  watchErrors,
  open,
  toCube,
  still,
  openSticker,
  closeCard,
  cardOpen,
  stickerPoint,
  expectedAge,
} from './helpers.mjs';

test('la page se charge sans erreur, du nom jusqu’au cube', async ({ page }) => {
  const errors = watchErrors(page);
  await prepare(page, { motion: true });
  await open(page);
  await expect(page.locator('h1')).toHaveText('Romain Goldenchtein');
  await expect(page.locator('.tagline')).toContainText('Université de Tokyo');
  await expect(page.locator('#cube-ui')).not.toHaveClass(/\bon\b/);

  // un clic sur le cube le fait venir au centre, avec le patron et le bouton Jouer
  const center = await page.evaluate(() => window.__scene.project(new window.__THREE.Vector3()));
  await page.mouse.click(center.x, center.y);
  await page.waitForFunction(() => window.__S.mode === 'explore');
  await expect(page.locator('#cube-ui')).toHaveClass(/\bon\b/);
  await expect(page.locator('#play')).toBeVisible();
  expect(errors).toEqual([]);
});

test('les cartes en français reprennent le CV', async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);

  let card = await openSticker(page, 'back_0');
  await expect(card.locator('h2')).toHaveText('Stage R&D en Deep Reinforcement Learning');
  await expect(card.locator('#card-org')).toHaveText('Dassault Systèmes (DELMIA)');
  await expect(card).toContainText("L'agent surpasse les baselines heuristiques kanban");
  // « Suivant » ouvre le sticker suivant de la même face
  await card.locator('.next').click();
  await page.waitForFunction(() => window.__S.card?.key === 'back_1');
  await cardOpen(page);
  await expect(card.locator('#card-org')).toHaveText('Labelbox (Alignerr)');
  await closeCard(page);

  card = await openSticker(page, 'left_0');
  await expect(card).toContainText('The University of Tokyo (Todai)');
  await closeCard(page);

  card = await openSticker(page, 'top_6');
  await expect(card.locator('.facts > div', { hasText: 'Âge' })).toContainText(`${expectedAge()} ans`);
  await closeCard(page);
});

test('« Mon CV » et « À propos » s’ouvrent depuis leur bouton', async ({ page }) => {
  await prepare(page);
  await open(page);

  await page.click('#open-cv');
  await cardOpen(page);
  const card = page.locator('#card');
  await expect(card.locator('h2')).toHaveText('Mon CV');
  await expect(card.locator('.cv-sheet img')).toHaveAttribute('src', 'assets/cv/cv-fr-1.webp');
  expect(await card.locator('.cv-sheet img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(card.locator('#card-foot a')).toHaveAttribute('href', 'assets/previews/cv.pdf');
  // la carte du CV prend la couleur de sa face : un bouton jaune
  await expect(card).toHaveAttribute('data-accent', 'bottom');
  await expect(card.locator('#card-foot a')).toHaveCSS('background-color', 'rgb(255, 225, 0)');
  await closeCard(page);
  await expect(page.locator('#open-cv')).toBeFocused();

  await page.click('#open-about');
  await cardOpen(page);
  await expect(card.locator('#card-meta')).toContainText(`${expectedAge()} ans`);
  await expect(card.locator('#card-foot a')).toHaveText(['LinkedIn', 'GitHub', 'Email']);
  await closeCard(page);
});

test('la version anglaise traduit les cartes, le CV et les liens', async ({ page }) => {
  await prepare(page, { lang: 'en' });
  await open(page);
  await expect(page.locator('#open-cv')).toHaveText('My CV');
  await toCube(page);

  let card = await openSticker(page, 'back_0');
  await expect(card.locator('h2')).toHaveText('R&D Internship in Deep Reinforcement Learning');
  await closeCard(page);

  card = await openSticker(page, 'right_2');
  await expect(card.locator('h2')).toHaveText('Portfolio');
  const images = card.locator('.card-body img');
  await expect(images).toHaveCount(3);
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true);
  }
  await closeCard(page);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.__S.mode === 'intro');
  await still(page);
  await page.click('#open-cv');
  await cardOpen(page);
  await expect(card.locator('h2')).toHaveText('My Resume');
  await expect(card.locator('.cv-sheet img')).toHaveAttribute('src', 'assets/cv/cv-en-1.webp');
  await expect(card.locator('#card-foot a')).toHaveAttribute('href', 'assets/previews/cv_en.pdf');

  // la carte ouverte change de langue avec la page
  await page.click('.lang button[data-lang="fr"]');
  await expect(card.locator('h2')).toHaveText('Mon CV');
  await expect(card.locator('#card-foot a')).toHaveAttribute('href', 'assets/previews/cv.pdf');
});

test('un grand lancer à la molette depuis l’accueil s’arrête au cube', async ({ page }) => {
  await prepare(page);
  await open(page);
  await page.mouse.move(700, 450);
  // comme un pavé tactile : des crans rapprochés qui ralentissent (l'élan)
  let delta = 500;
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, delta);
    delta *= 0.9;
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => Math.round(scrollY / innerHeight))).toBe(1);
  await page.waitForFunction(() => window.__S.mode === 'explore');
});

test('« Écrivez-moi », la dernière section : un mail au sujet rempli, l’adresse à copier', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await prepare(page);
  await open(page);
  await page.evaluate(() => window.scrollTo(0, document.getElementById('contact').offsetTop));
  await page.waitForFunction(() => window.__S.contactP > 0.99 && window.__S.mode === 'intro');
  await expect(page.locator('#contact-title')).toHaveText('Écrivez-moi');
  await expect(page.locator('#mail')).toHaveAttribute(
    'href',
    'mailto:r.goldenchtein@proton.me?subject=Contact%20depuis%20votre%20portfolio',
  );
  await page.click('#copy-mail');
  await expect(page.locator('#copy-label')).toHaveText('Adresse copiée');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('r.goldenchtein@proton.me');

  await page.click('.lang button[data-lang="en"]');
  await expect(page.locator('#contact-title')).toHaveText('Write to me');
  await expect(page.locator('#mail')).toHaveAttribute('href', /subject=Contact%20from%20your%20portfolio/);
});

test('le survol nomme le sticker, et remonter à l’accueil ferme la carte et vide le cube', async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);

  const p = await stickerPoint(page, 'back_0');
  await page.mouse.move(p.x, p.y);
  await expect(page.locator('#tag')).toHaveClass(/\bon\b/);
  await expect(page.locator('#tag')).toHaveText('Dassault Systèmes (DELMIA)');
  await page.mouse.move(20, 450);
  await expect(page.locator('#tag')).not.toHaveClass(/\bon\b/);

  await openSticker(page, 'back_0');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => !window.__S.card && window.__S.mode === 'intro');
  await expect(page.locator('#card')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__scene.tiles.every((t) => !t.mesh.visible))).toBe(true);
});
