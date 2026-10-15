import { test, expect } from '@playwright/test';
import {
  prepare,
  open,
  toCube,
  still,
  cubeAtHome,
  cubeOrientation,
  turnedSince,
  frontEdgePoint,
  drag,
} from './helpers.mjs';

async function play(page) {
  await prepare(page);
  await open(page);
  await toCube(page);
  await page.click('#play');
  await expect(page.locator('html')).toHaveClass(/locked/);
  await still(page);
}

async function shuffle(page) {
  await page.click('#shuffle');
  await expect(page.locator('#status')).toHaveText('À vous de jouer', { timeout: 30_000 });
  await still(page);
}

test('mélanger puis résoudre avec le solveur de Kociemba', async ({ page }) => {
  const logs = [];
  page.on('console', (m) => logs.push(m.text()));
  await play(page);
  await shuffle(page);
  expect(await cubeAtHome(page)).toBe(false);

  await page.click('#solve');
  await expect(page.locator('#status')).toHaveText('Résolution…');
  await page.waitForFunction(() => !window.__play.busy() && !window.__S.moves.length, null, { timeout: 40_000 });
  expect(logs.some((l) => l.includes('solution cubejs'))).toBe(true);
  // coins et arêtes exactement à leur place ; un centre peut rester tourné sur lui-même, comme le logo d'un vrai cube
  expect(await page.evaluate(() => window.__play.isSolved())).toBe(true);
  const placed = await page.evaluate(() =>
    window.__scene.cubies.every((c) => {
      const { x, y, z } = c.userData.grid;
      const center = [x, y, z].filter((v) => v !== 0).length < 2;
      return c.position.distanceTo(c.userData.home) < 1e-3 && (center || Math.abs(Math.abs(c.quaternion.w) - 1) < 1e-6);
    }),
  );
  expect(placed).toBe(true);
  await expect(page.locator('#status')).toHaveText('');
});

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

  // en dehors du cube, le glissé fait tourner le cube entier
  await drag(page, { x: 150, y: 450 }, { x: 200, y: 60 });
  expect(await turned()).toBeGreaterThan(0.3);
  expect(await moves()).toBe(1);
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
