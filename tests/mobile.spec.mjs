import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers.mjs';

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

  test('redirige vers la page mobile, en anglais, avec le CV et les contacts', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/index.html');
    await expect(page).toHaveURL(/mobile\.html$/);
    await expect(page.locator('h1')).toHaveText('Mobile Version in Development');
    await expect(page.locator('#cvLink')).toHaveAttribute('href', 'assets/previews/cv_en.pdf');
    await expect(page.locator('.contact-link')).toHaveCount(5);
    await expect(page.locator('#forceDesktop')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);

    // chaque bouton de contact tient sur une ligne
    const heights = await page.locator('.contact-link').evaluateAll((els) => els.map((e) => e.offsetHeight));
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(2);

    await page.click('#langBtn');
    await expect(page.locator('h1')).toHaveText('Version Mobile en Développement');
    await expect(page.locator('#cvLink')).toHaveAttribute('href', 'assets/previews/cv.pdf');
    expect(errors).toEqual([]);
  });
});

test.describe('prototype mobile1', () => {
  test.use(phone);

  test('toucher une case ouvre une carte sans erreur', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/mobile1.html');
    await page.locator('.cubie-mobile[data-has-content]').first().evaluate((el) => el.click());
    await expect(page.locator('.info-card')).toHaveCount(1);
    await expect(page.locator('a.social-link[href*="github"]')).toHaveAttribute('href', 'https://github.com/Kiyogen24');
    expect(errors).toEqual([]);
  });
});
