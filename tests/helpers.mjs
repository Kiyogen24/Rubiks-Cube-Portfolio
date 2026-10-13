// Outils communs aux tests : préparation de la page et interactions avec le cube 3D

// Langue, thème et aides déjà vues, posés une seule fois avant le premier chargement.
// Sans `motion`, l'utilisateur préfère réduire les animations : pas d'ouverture ni de mouvement au repos,
// pour que les tests ne dépendent pas du temps passé sans interaction.
export async function prepare(page, { lang = 'fr', theme = 'light', motion = false } = {}) {
  if (!motion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    ({ lang, theme }) => {
      if (sessionStorage.getItem('test-init')) return;
      sessionStorage.setItem('test-init', '1');
      localStorage.setItem('lang', lang);
      localStorage.setItem('theme', theme);
      localStorage.setItem('hasSeenCubeHints', 'true');
      localStorage.setItem('hasSeenRotateHint', 'true');
    },
    { lang, theme },
  );
}

// Collecte les erreurs JavaScript, les erreurs console et les requêtes en échec
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  return errors;
}

export async function open(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => document.body.classList.contains('loaded'));
}

// Fait défiler jusqu'à la section du cube et attend qu'elle occupe l'écran
export async function toCube(page) {
  await page.evaluate(() => document.getElementById('cube-section').scrollIntoView());
  await page.waitForFunction(() => Math.abs(document.getElementById('cube-section').getBoundingClientRect().top) < 2);
  await page.waitForTimeout(300);
}

// Attend la fin d'une animation de zoom ou de dézoom
// (waitForFunction n'attend pas les promesses : l'état est exposé sur window pour un test synchrone)
export async function cameraStill(page) {
  await page.evaluate(async () => {
    window.__app = (await import('/js/globals.js')).app;
  });
  await page.waitForFunction(() => !window.__app.cameraAnimating);
  await page.waitForTimeout(100);
}

export async function zoomTo(page, face) {
  const menuOpen = await page.locator('.menu').evaluate((m) => m.classList.contains('active'));
  if (!menuOpen) await page.click('.menu-btn');
  await page.click(`.menu-item[data-face="${face}"]`);
  await page.waitForFunction(() => document.getElementById('cube-section').classList.contains('zoomed'));
  await page.waitForTimeout(150);
  await cameraStill(page);
}

export async function zoomOut(page) {
  await page.click('#reset');
  await page.waitForFunction(() => !document.getElementById('cube-section').classList.contains('zoomed'));
  await cameraStill(page);
}

// Position à l'écran du sticker `index` (0 à 8) d'une face
export function cellPos(page, face, index) {
  return page.evaluate(
    async ({ face, index }) => {
      const THREE = await import('three');
      const { app } = await import('/js/globals.js');
      const { calculateCubiePosition } = await import('/js/cube/cube.js');
      const normals = {
        front: [0, 0, 1],
        back: [0, 0, -1],
        right: [1, 0, 0],
        left: [-1, 0, 0],
        top: [0, 1, 0],
        bottom: [0, -1, 0],
      };
      const n = new THREE.Vector3(...normals[face]);
      const cubie = app.cubies.find((c) => {
        const p = c.userData.gridPos;
        return new THREE.Vector3(p.x, p.y, p.z).dot(n) > 0.5 && calculateCubiePosition(p, face) === index;
      });
      const v = new THREE.Vector3();
      cubie.getWorldPosition(v);
      v.add(n.multiplyScalar(0.5)).project(app.camera);
      return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
    },
    { face, index },
  );
}

// Survole puis clique un sticker et renvoie la carte ouverte
export async function openCard(page, face, index) {
  const p = await cellPos(page, face, index);
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(150);
  await page.mouse.click(p.x, p.y);
  const card = page.locator('.info-card.active');
  await card.waitFor();
  return card;
}

export async function closeCard(page) {
  await page.click('.info-card.active .close-button');
  await page.locator('.info-card').waitFor({ state: 'detached' });
}

// Le cube est-il exactement dans sa position d'origine (positions et orientations) ?
export function cubeAtHome(page) {
  return page.evaluate(async () => {
    const { app } = await import('/js/globals.js');
    return app.cubies.every(
      (c) => c.userData.gridPos.equals(c.userData.homePos) && Math.abs(Math.abs(c.quaternion.w) - 1) < 1e-6,
    );
  });
}

// Textes des étiquettes de faces visibles
export function visibleLabels(page) {
  return page.locator('.face-label__pill.visible').allTextContents();
}

export function cameraPosition(page) {
  return page.evaluate(async () => {
    const { app } = await import('/js/globals.js');
    return app.camera.position.toArray();
  });
}

// Glisser sur le canvas (rotation de la caméra hors du mode zoom)
export async function drag(page, from = { x: 600, y: 450 }, by = { x: 250, y: 80 }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(from.x + (by.x * i) / 10, from.y + (by.y * i) / 10);
  await page.mouse.up();
  await page.waitForTimeout(600);
}

// Âge attendu sur la carte « À propos » (né le 20/10/2004)
export function expectedAge(now = new Date()) {
  const birth = new Date(2004, 9, 20);
  const passed = now.getMonth() > 9 || (now.getMonth() === 9 && now.getDate() >= 20);
  return now.getFullYear() - birth.getFullYear() - (passed ? 0 : 1);
}
