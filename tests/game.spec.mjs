import { test, expect } from '@playwright/test';
import {
  prepare,
  open,
  still,
  cubeAtHome,
  cubeOrientation,
  turnedSince,
  frontEdgePoint,
  drag,
  play,
  shuffle,
} from './helpers.mjs';

test('en jeu, glisser sur un sticker tourne une rangée, et à côté tout le cube', async ({ page }) => {
  await play(page);
  const moves = () => page.evaluate(() => window.__S.moves.length);
  const orientation = await cubeOrientation(page);
  const turned = () => turnedSince(page, orientation);

  await drag(page, await frontEdgePoint(page), { x: 180, y: 0 });
  await expect.poll(moves).toBe(1);
  await still(page);
  expect(await turned()).toBeLessThan(0.01);
  await expect(page.locator('#status')).toHaveText('À vous de jouer');

  // en dehors du cube, le glissé fait tourner le cube entier, qui reste là où on le lâche (ni élan ni recalage)
  await drag(page, { x: 150, y: 450 }, { x: 200, y: 60 });
  expect(await turned()).toBeGreaterThan(0.3);
  expect(await moves()).toBe(1);
  const released = await cubeOrientation(page);
  await page.waitForTimeout(800);
  expect(await turnedSince(page, released)).toBeLessThan(0.001);
});

test('un geste, un quart de tour : un petit glissé revient, un très long n’en fait qu’un ; le clavier aussi', async ({
  page,
}) => {
  await play(page);
  const moves = () => page.evaluate(() => window.__S.moves.length);
  const p = await frontEdgePoint(page);
  await drag(page, p, { x: 30, y: 0 });
  await page.waitForFunction(() => !window.__S.layer);
  expect(await moves()).toBe(0);
  await drag(page, p, { x: 400, y: 0 });
  await page.waitForFunction(() => !window.__S.layer);
  expect(await moves()).toBe(1);

  // au clavier, F tourne la face tournée vers l'écran ; Maj + F la tourne dans l'autre sens
  await page.keyboard.press('f');
  await expect.poll(moves).toBe(2);
  await page.keyboard.press('Shift+F');
  await expect.poll(moves).toBe(3);
  const [turn, back] = await page.evaluate(() => window.__S.moves.slice(-2));
  expect(back).toEqual({ ...turn, turns: -turn.turns });
});

test('en jeu, la molette rapproche ou éloigne le cube sans faire défiler la page', async ({ page }) => {
  await play(page);
  const distance = () => page.evaluate(() => window.__scene.framingTarget().dist);
  const start = await distance();
  const scroll = await page.evaluate(() => scrollY);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, -400);
  await expect.poll(distance).toBeLessThan(start);
  // rapproché, le cube passe sous les commandes : les textes s'effacent, les boutons restent
  await expect(page.locator('#cube-ui')).toHaveClass(/\bover\b/);
  await expect(page.locator('.hint')).toHaveCSS('opacity', '0');
  await expect(page.locator('#shuffle')).toBeVisible();
  await page.mouse.wheel(0, 800);
  await expect.poll(distance).toBeGreaterThan(start);
  await expect(page.locator('#cube-ui')).not.toHaveClass(/\bover\b/);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
});

test('« Terminé » remet le cube en ordre, à sa place et à sa taille d’avant le jeu', async ({ page }) => {
  await play(page);
  const orientation = await cubeOrientation(page);
  const distance = () => page.evaluate(() => window.__scene.framingTarget().dist);
  await shuffle(page);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, -400);
  await drag(page, { x: 150, y: 450 }, { x: 200, y: 60 });
  expect(await turnedSince(page, orientation)).toBeGreaterThan(0.3);

  await page.click('#done');
  await page.waitForFunction(() => window.__S.mode === 'explore', null, { timeout: 40_000 });
  await expect(page.locator('html')).not.toHaveClass(/locked/);
  await still(page);
  expect(await cubeAtHome(page)).toBe(true);
  expect(await turnedSince(page, orientation)).toBeLessThan(0.01);
  expect(await page.evaluate(() => window.__S.zoom)).toBe(1);
  expect(await distance()).toBeGreaterThan(9);
  await expect(page.locator('#play')).toBeFocused();
});

test('résolu à la main après un mélange : la fête, puis « Contactez-moi » au message adapté', async ({ page }) => {
  await play(page);
  // un quart de tour à la main, puis trois autres dans le même sens : le cube revient résolu
  const p = await frontEdgePoint(page);
  const turn = async () => {
    await drag(page, p, { x: 160, y: 0 });
    await page.waitForFunction(() => !window.__S.layer);
  };
  await turn();
  // comme après un mélange au bouton, il y a 1 min 23 s
  await page.evaluate(() => {
    window.__S.scrambled = true;
    window.__S.shuffledAt = performance.now() - 83_000;
    window.__S.userMoves = 0;
  });
  await turn();
  await turn();
  await turn();
  await expect(page.locator('#status')).toHaveText('Résolu, bravo !');
  await expect(page.locator('#score')).toHaveText(/^3 mouvements · 1 min \d\d s$/);

  // la récompense d'abord, puis la page descend vers « Contactez-moi », dont le message a changé
  await page.waitForFunction(() => window.__S.contactP > 0.99, null, { timeout: 10_000 });
  await expect(page.locator('html')).not.toHaveClass(/locked/);
  await expect(page.locator('#contact-title')).toHaveText('Vous avez résolu le Cube ?!');
  await expect(page.locator('#contact-lead')).toContainText('En 3 mouvements');
  await expect(page.locator('#mail')).toHaveAttribute('href', /subject=J%E2%80%99ai%20r%C3%A9solu/);
  await expect(page.locator('#mail')).toBeFocused();
});

test('un coin tourné sur place n’est pas résolu, un centre tourné sur lui-même l’est', async ({ page }) => {
  await prepare(page);
  await open(page);
  const solved = () => page.evaluate(() => window.__play.isSolved());
  expect(await solved()).toBe(true);

  // un coin tourné d'un tiers de tour : les couleurs ne sont plus à leur place
  await page.evaluate(() => {
    const { Vector3 } = window.__THREE;
    window.__corner = window.__scene.cubies.find((c) => c.userData.home.distanceTo(new Vector3(1, 1, 1)) < 0.01);
    window.__corner.quaternion.setFromAxisAngle(new Vector3(1, 1, 1).normalize(), (2 * Math.PI) / 3);
  });
  expect(await solved()).toBe(false);
  await page.evaluate(() => window.__corner.quaternion.identity());
  expect(await solved()).toBe(true);

  // le centre du haut tourné d'un quart de tour : mêmes couleurs, toujours résolu
  await page.evaluate(() => {
    const { Vector3 } = window.__THREE;
    const top = window.__scene.cubies.find((c) => c.userData.home.distanceTo(new Vector3(0, 1, 0)) < 0.01);
    top.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
  });
  expect(await solved()).toBe(true);
});
