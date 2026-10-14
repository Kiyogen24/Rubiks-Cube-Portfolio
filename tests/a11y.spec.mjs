import { test, expect } from '@playwright/test';
import { prepare, open, toCube, cameraStill } from './helpers.mjs';

test('au clavier : menu, face, sticker, carte, puis retour', async ({ page }) => {
  await prepare(page);
  await open(page);
  await toCube(page);

  // menu
  await page.focus('.menu-btn');
  await page.keyboard.press('Enter');
  await expect(page.locator('.menu-btn')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator('.menu-item[data-face="top"]')).toBeFocused();

  // face des expériences
  await page.focus('.menu-item[data-face="back"]');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.getElementById('cube-section').classList.contains('zoomed'));
  await cameraStill(page);

  // le sticker qui a le focus est mis en avant, Entrée ouvre sa carte
  const sticker = page.locator('.sticker-buttons button').first();
  await sticker.focus();
  await expect(page.locator('.sticker-tip.visible')).toHaveCount(1);
  await page.keyboard.press('Enter');
  const card = page.locator('.info-card.active[role="dialog"]');
  await expect(card).toBeFocused();
  await expect(card).toHaveAttribute('aria-labelledby', 'info-card-title');

  // Tab reste dans la carte
  await page.keyboard.press('Tab');
  await expect(card.locator('.close-button')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(card.locator('.close-button')).toBeFocused();

  // Échap ferme la carte et rend le focus au sticker, sans quitter le zoom
  await page.keyboard.press('Escape');
  await expect(page.locator('.info-card')).toHaveCount(0);
  await expect(sticker).toBeFocused();
  await expect(page.locator('#cube-section')).toHaveClass(/zoomed/);

  // Échap de nouveau : sortie du zoom, focus sur le bouton du menu
  await page.keyboard.press('Escape');
  await expect(page.locator('#cube-section')).not.toHaveClass(/zoomed/);
  await expect(page.locator('.menu-btn')).toBeFocused();
});

test('la langue de la page et les noms des commandes suivent le bouton FR / EN', async ({ page }) => {
  await prepare(page);
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('.theme-btn')).toHaveAttribute('aria-label', 'Changer de thème');

  await page.click('.lang-btn');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.theme-btn')).toHaveAttribute('aria-label', 'Toggle theme');
  await expect(page.locator('.lang-btn')).toHaveAttribute('aria-label', 'Switch to French');
  await expect(page.locator('#cube-section canvas')).toHaveAttribute('aria-label', /Interactive Rubik's Cube/);
});
