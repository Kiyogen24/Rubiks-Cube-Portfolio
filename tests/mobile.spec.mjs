import { test, expect } from '@playwright/test';
import { prepare, watchErrors, open, still, stickerPoint, cardOpen } from './helpers.mjs';

const phone = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

test.describe('téléphone en anglais', () => {
  test.use({ ...phone, locale: 'en-US' });

  test('le téléphone reçoit le site, le cube et ses cartes, sans défilement horizontal', async ({ page }) => {
    const errors = watchErrors(page);
    await prepare(page, { lang: 'en' });
    await open(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);

    // toucher le cube l'amène au centre, toucher un sticker ouvre sa carte en bas de l'écran
    const center = await page.evaluate(() => window.__scene.project(new window.__THREE.Vector3()));
    await page.touchscreen.tap(center.x, center.y);
    await page.waitForFunction(() => window.__S.mode === 'explore');
    await still(page);
    const key = await page.evaluate(
      () => window.__scene.tiles.find((t) => t.face === window.__S.front && t.ring === 0).key,
    );
    const p = await stickerPoint(page, key);
    await page.touchscreen.tap(p.x, p.y);
    await cardOpen(page);
    const box = await page.locator('#card').boundingBox();
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.y + box.height)).toBe(844);
    await page.locator('#card-close').tap();
    await page.waitForFunction(() => !window.__S.card);

    // en jeu, écarter deux doigts rapproche le cube, sans tourner de rangée
    await page.locator('#play').tap();
    await still(page);
    const client = await page.context().newCDPSession(page);
    const fingers = (type, gap) =>
      client.send('Input.dispatchTouchEvent', {
        type,
        touchPoints:
          gap === null
            ? []
            : [
                { id: 1, x: 195 - gap, y: 330 },
                { id: 2, x: 195 + gap, y: 330 },
              ],
      });
    await fingers('touchStart', 40);
    for (let gap = 60; gap <= 140; gap += 20) await fingers('touchMove', gap);
    await fingers('touchEnd', null);
    expect(await page.evaluate(() => window.__S.zoom)).toBeLessThan(0.8);
    expect(await page.evaluate(() => window.__S.moves.length)).toBe(0);
    expect(errors).toEqual([]);
  });
});

test.describe('ancienne page mobile', () => {
  test.use(phone);

  test('elle renvoie à l’accueil', async ({ page }) => {
    await page.goto('/mobile.html');
    await expect(page).toHaveURL(/\/$/);
  });
});
