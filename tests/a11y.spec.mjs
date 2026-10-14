import { test, expect } from '@playwright/test';
import { prepare, open, still, cardOpen } from './helpers.mjs';

test('au clavier : le cube, une carte, puis retour', async ({ page }) => {
  await prepare(page);
  await open(page);

  // Entrée sur le cube l'amène au centre
  await page.focus('#cube');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__S.mode === 'explore');
  await still(page);

  // les flèches le tournent d'un quart de tour
  const front = await page.evaluate(() => window.__S.front);
  await page.keyboard.press('ArrowRight');
  await still(page);
  await expect.poll(() => page.evaluate(() => window.__S.front)).not.toBe(front);
  await page.keyboard.press('ArrowLeft');
  await still(page);
  await expect.poll(() => page.evaluate(() => window.__S.front)).toBe(front);

  // Entrée ouvre le premier contenu de la face devant, le focus va sur son titre
  await page.keyboard.press('Enter');
  await cardOpen(page);
  await expect(page.locator('#card-title')).toBeFocused();
  await expect(page.locator('#card')).toHaveAttribute('aria-labelledby', 'card-title');

  // Échap la ferme et rend le focus au cube
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !window.__S.card);
  await expect(page.locator('#cube')).toBeFocused();
});

test('la langue de la page et les noms des commandes suivent le bouton FR / EN', async ({ page }) => {
  await prepare(page);
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('#theme')).toHaveAttribute('aria-label', 'Changer de thème');
  await expect(page.locator('.lang button[data-lang="fr"]')).toHaveAttribute('aria-pressed', 'true');

  await page.click('.lang button[data-lang="en"]');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#theme')).toHaveAttribute('aria-label', 'Switch theme');
  await expect(page.locator('.lang')).toHaveAttribute('aria-label', 'Language');
  await expect(page.locator('.lang button[data-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#cube')).toHaveAttribute('aria-label', /each face is a part of the portfolio/);
  await expect(page.locator('.tagline')).toContainText('University of Tokyo');
  expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('en');
});

test('le thème sombre se garde d’une visite à l’autre', async ({ page }) => {
  await prepare(page);
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.click('#theme');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
