// Outils communs aux tests : préparation de la page et accès à l'état du cube 3D

// Langue et thème posés une seule fois avant le premier chargement.
// Sans `motion`, l'utilisateur préfère réduire les animations : le cube vide ne tourne pas à l'accueil
// et les mouvements sont presque instantanés, pour que les tests ne dépendent pas du temps.
export async function prepare(page, { lang = 'fr', theme = 'light', motion = false } = {}) {
  if (!motion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    ({ lang, theme }) => {
      if (sessionStorage.getItem('test-init')) return;
      sessionStorage.setItem('test-init', '1');
      localStorage.setItem('lang', lang);
      localStorage.setItem('theme', theme);
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

// Ouvre la page et attend que le cube soit prêt. Les modules importés ici sont ceux de la page
// (même adresse, même instance) : leur état est exposé sur window pour les tests synchrones.
export async function open(page) {
  await page.goto('/');
  await page.evaluate(async () => {
    window.__THREE = await import('three');
    window.__S = (await import('/js/state.js')).S;
    window.__scene = await import('/js/cube/scene.js');
    window.__play = await import('/js/cube/play.js');
  });
  await page.waitForFunction(() => window.__S.phase === 'ready');
}

// Attend que le cube soit posé et que le cadrage ne bouge plus
export async function still(page) {
  await page.waitForFunction(() => {
    const S = window.__S;
    const f = window.__scene.framingTarget();
    const framed = Math.abs(S.view.dist.x - f.dist) < 0.02 && Math.abs(S.view.shift.x - f.shift) < 0.002;
    const posed = !S.target || 2 * Math.acos(Math.min(1, Math.abs(S.base.dot(S.target)))) < 0.01;
    return framed && posed && S.w.length() < 0.02 && !window.__play.busy();
  });
  await page.waitForTimeout(100);
}

// Défile jusqu'au cube et attend qu'il soit au centre
export async function toCube(page) {
  await page.evaluate(() => window.scrollTo(0, innerHeight));
  await page.waitForFunction(() => window.__S.mode === 'explore');
  await still(page);
}

// Centre à l'écran de l'image d'un sticker (« face_case »)
export function stickerPoint(page, key) {
  return page.evaluate((key) => {
    const r = window.__scene.stickerRect(window.__scene.tileByKey[key]);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }, key);
}

// Point de la face tournée vers soi, au milieu d'un de ses bords
export function frontEdgePoint(page) {
  return page.evaluate(() => {
    const { cube, project } = window.__scene;
    const normals = {
      right: [1, 0, 0],
      left: [-1, 0, 0],
      top: [0, 1, 0],
      bottom: [0, -1, 0],
      front: [0, 0, 1],
      back: [0, 0, -1],
    };
    const n = normals[window.__S.front];
    const p = n.map((v) => v * 1.5);
    p[n.findIndex((v) => v === 0)] = 1;
    cube.updateMatrixWorld(true);
    return project(cube.localToWorld(new window.__THREE.Vector3(...p)));
  });
}

// Tourne la face vers soi avec le patron, puis clique le sticker et attend que sa carte soit ouverte
export async function openSticker(page, key) {
  const face = key.split('_')[0];
  if ((await page.evaluate(() => window.__S.front)) !== face) {
    await page.click(`#net button[data-face="${face}"]`);
    await still(page);
  }
  const p = await stickerPoint(page, key);
  await page.mouse.move(p.x, p.y);
  await page.mouse.click(p.x, p.y);
  await cardOpen(page);
  return page.locator('#card');
}

export async function cardOpen(page) {
  await page.waitForFunction(() => window.__S.card?.target === 1 && window.__S.card.p.x > 0.99);
}

export async function closeCard(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !window.__S.card);
}

// Le cube est-il exactement dans sa position d'origine (positions et orientations, centres compris) ?
export function cubeAtHome(page) {
  return page.evaluate(() =>
    window.__scene.cubies.every(
      (c) => c.position.distanceTo(c.userData.home) < 1e-3 && Math.abs(Math.abs(c.quaternion.w) - 1) < 1e-6,
    ),
  );
}

export function cubeOrientation(page) {
  return page.evaluate(() => window.__S.base.toArray());
}

// Angle (en radians) dont le cube entier a tourné depuis `orientation` (donnée par cubeOrientation)
export function turnedSince(page, orientation) {
  return page.evaluate(
    (q) => 2 * Math.acos(Math.min(1, Math.abs(window.__S.base.dot(new window.__THREE.Quaternion(...q))))),
    orientation,
  );
}

// Glisser sur le canvas
export async function drag(page, from, by = { x: 180, y: 0 }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(from.x + (by.x * i) / 8, from.y + (by.y * i) / 8);
  await page.mouse.up();
}

// Âge attendu sur la carte « À propos » (né le 20/10/2004)
export function expectedAge(now = new Date()) {
  const birth = new Date(2004, 9, 20);
  const passed = now.getMonth() > 9 || (now.getMonth() === 9 && now.getDate() >= 20);
  return now.getFullYear() - birth.getFullYear() - (passed ? 0 : 1);
}
