// Importations de modules essentiels
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStickerMaterial, calculateCubiePosition, createRubiksCube, updateFaceTextures } from './cube/cube.js';
import { zoomToFace, setupNavigation, dezoom, setupControls, onMouseMove, getCentralCubie } from './cube/navigation.js';
import { createOverlay, showInfoCard } from './cards/overlay.js';
import { displayPreview, hidePreview } from './cards/preview.js';
import { CATEGORIES, CUBE_CONTENT, stickerColors, SITE_I18N } from './utils/constants.js';
import { app } from './globals.js';
import { shuffle, solve, queueMove, registerOnSolved, isBusy, resetMoves } from './cube/animator.js';
import { LanguageManager } from './language-manager.js';


// Variables globales
let currentSection = 'intro';
let resetButton;
let menuBtn = document.querySelector('.menu-btn');
let menu = document.querySelector('.menu');

// Fallback in case elements are not yet in DOM
if (!menuBtn) {
  document.addEventListener('DOMContentLoaded', () => {
    menuBtn = document.querySelector('.menu-btn');
    menu = document.querySelector('.menu');
    app.menuBtn = menuBtn;
    app.menu = menu;
    if (menuBtn) attachMenuBtnListener(menuBtn);
  });
}

function attachMenuBtnListener(btn) {
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    // Prevent opening when game mode active
    if (app.isPlayable) {
      // ensure menu is closed
      try { app.menu.classList.remove('active'); app.menuBtn.classList.remove('open'); app.menuOpen = false; } catch(e){}
      return;
    }

    // Toggle
    if (!app.menuOpen) {
      btn.classList.add('open');
      if (app.menu) app.menu.classList.add('active');
      app.menuOpen = true;
    } else {
      btn.classList.remove('open');
      if (app.menu) app.menu.classList.remove('active');
      app.menuOpen = false;
    }
  });
}

// attach immediately if element exists
if (menuBtn) attachMenuBtnListener(menuBtn);
app.menuBtn = menuBtn;
app.menu = menu;
// Bouton Mélanger / Assembler (créé dynamiquement)
app.shuffleSolveButton = document.createElement('button');
app.shuffleSolveButton.id = 'shuffle-solve';
app.shuffleSolveButton.setAttribute('aria-label', 'Mélanger le cube');
app.shuffleSolveButton.textContent = '';
app.shuffleSolveButton.className = 'shuffle-btn';
document.body.appendChild(app.shuffleSolveButton);

// Création et ajout d'un élément pour afficher le titre de la carte
const titleElement = document.createElement('div');
titleElement.id = 'titleElement';
titleElement.style.cssText = `
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2em;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  font-family: Arial, sans-serif;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;
document.body.appendChild(titleElement);

// Variables servant à suivre la position initiale de la souris pour le glissement
let mouseStartX = 0;
let mouseStartY = 0;
// Variables pour le mode jeu (drag de rotation)
let dragStartIntersect = null;
let dragStartPoint = null;
let isGameDragging = false;
let dragStartedOnCubie = false; // nouveau: mémorise si le drag a commencé sur un cubie

// Création du bouton "reset" avant l'initialisation
app.resetButton = document.createElement('button');
app.resetButton.id = 'reset';
app.resetButton.setAttribute('aria-label', 'Retour');
app.resetButton.addEventListener('click', dezoom);
document.body.appendChild(app.resetButton);

// Références aux autres éléments du DOM
const themeBtn = document.querySelector('.theme-btn');
const cubeSection = document.getElementById('cube-section');

// Basculer le thème (clair/sombre) lors du clic sur le bouton thématique
themeBtn.addEventListener('click', function() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  const themeIcon = document.querySelector('.theme-icon');
  themeIcon.classList.remove('fa-moon', 'fa-sun');
  themeIcon.classList.add(newTheme === 'dark' ? 'fa-moon' : 'fa-sun');
});

// Gestion du mouvement de la souris
window.addEventListener('mousemove', onMouseMove);

// Fonction permettant de précharger les images utilisées dans le cube
function preloadImages() {
    const imagesToPreload = new Set();
    
    // Collecte de toutes les URL d'images disponibles dans CUBE_CONTENT
    Object.values(CUBE_CONTENT).forEach(face => {
      Object.values(face).forEach(content => {
        if (content.preview) {
          imagesToPreload.add(content.preview);
        }
      });
    });
  
    // Création d'une promesse pour chaque image à charger
    const preloadPromises = Array.from(imagesToPreload).map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
      });
    });
  
    // Attente du chargement de toutes les images
    return Promise.all(preloadPromises)
      .then(() => console.log('Toutes les images sont préchargées'))
      .catch(failed => console.warn('Certaines images n\'ont pas pu être chargées:', failed));
}

// Fonction d'initialisation principale
function init() {
  preloadImages();

  // Détermination du thème initial à partir de la préférence système ou stockée
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const storedTheme = localStorage.getItem('theme');
  const initialTheme = storedTheme || systemTheme;

  // Application et sauvegarde du thème initial
  document.documentElement.setAttribute('data-theme', initialTheme);
  localStorage.setItem('theme', initialTheme);

  // Mise à jour de l'icône du thème 
  const themeIcon = document.querySelector('.theme-icon');
  themeIcon.classList.remove('fa-sun', 'fa-moon');
  themeIcon.classList.add(initialTheme === 'dark' ? 'fa-moon' : 'fa-sun');

  // Écoute des changements du thème système pour ajuster dynamiquement
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) { // S'applique uniquement en l'absence de préférence utilisateur
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      themeIcon.classList.remove('fa-sun', 'fa-moon');
      themeIcon.classList.add(newTheme === 'dark' ? 'fa-moon' : 'fa-sun');
    }
  });

  // Masquer le contenu principal durant le chargement
  document.querySelector('.container').style.visibility = 'hidden';
  
  // Fonction pour masquer l'écran de chargement une fois que tout est prêt
  function hideLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    loadingScreen.classList.add('fade-out');
    document.querySelector('.container').style.visibility = 'visible';
    
    // Suppression de l'écran de chargement après l'animation
    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }
  
  // Simulation d'un délai de chargement avant de masquer l'écran
  setTimeout(hideLoadingScreen, 3000);

  // Création de la scène Three.js
  app.scene = new THREE.Scene();

  // Configuration et positionnement de la caméra
  app.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  app.camera.position.set(5, 5, 7);
  app.camera.lookAt(0, 0, 0);

  // Configuration du renderer avec antialiasing et transparence
  app.renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    precision: 'highp',
    powerPreference: "high-performance"
  });
  
  // Ajustement de la résolution en fonction du pixelRatio de l'appareil
  const pixelRatio = window.devicePixelRatio;
  app.renderer.setPixelRatio(pixelRatio);
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.renderer.shadowMap.enabled = true;
  app.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Insertion du renderer dans la section dédiée au cube
  cubeSection.appendChild(app.renderer.domElement);
  app.renderer.domElement.style.position = 'absolute';

  /*
  // Code désactivé pour le style "grabbing" de la souris
  cubeSection.addEventListener('mousedown', () => {
      if (!app.isZoomed) {
          cubeSection.classList.add('grabbing');
      }
  });
  cubeSection.addEventListener('mouseup', () => {
      cubeSection.classList.remove('grabbing');
  });
  cubeSection.addEventListener('mouseleave', () => {
      cubeSection.classList.remove('grabbing');
  });
  */

  // Mise en place des contrôles Orbit pour la caméra
  app.controls = new OrbitControls(app.camera, app.renderer.domElement);
  app.controls.enableDamping = true;
  app.controls.dampingFactor = 0.05;
  app.controls.enablePan = false;
  app.controls.rotateSpeed = 0.5; // Rotation ralentit pour un meilleur contrôle
  app.controls.minDistance = 5;
  app.controls.maxDistance = 15;

  // NOTE: le code précédent tentant d'élargir minPolarAngle/maxPolarAngle a été retiré
  // car il ne fonctionnait pas comme attendu. Conserver le comportement par défaut
  // d'OrbitControls pour éviter des effets indésirables.
  
  // Confetti animation (simple, injectée dynamiquement). Appel: triggerConfetti(durationMs)
  app.triggerConfetti = function(duration = 3000) {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    container.style.position = 'fixed';
    container.style.left = 0;
    container.style.top = 0;
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.overflow = 'hidden';
    container.style.zIndex = 9999;

    const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#4cd964', '#5ac8fa', '#007aff', '#5856d6'];
    const count = 80;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      const size = Math.floor(Math.random() * 10) + 6;
      el.style.position = 'absolute';
      el.style.width = `${size}px`;
      el.style.height = `${size * 0.6}px`;
      el.style.left = Math.random() * 100 + '%';
      el.style.top = (-10 - Math.random() * 20) + '%';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.opacity = (0.6 + Math.random() * 0.4).toString();
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      el.style.borderRadius = '2px';
      el.style.willChange = 'transform, top, opacity';

      // random fall duration and horizontal drift
      const fall = 1500 + Math.random() * 2000;
      const horizontal = (Math.random() - 0.5) * 200; // px

      el.animate([
        { transform: `translate3d(0,0,0) rotate(${Math.random() * 360}deg)`, top: el.style.top, opacity: 1 },
        { transform: `translate3d(${horizontal}px, 100vh, 0) rotate(${Math.random() * 720}deg)`, top: '100vh', opacity: 0.8 }
      ], {
        duration: fall + Math.random() * 800,
        iterations: 1,
        easing: 'cubic-bezier(.2,.7,.2,1)'
      });

      container.appendChild(el);
    }

    document.body.appendChild(container);
    setTimeout(() => {
      if (container && container.parentNode) container.parentNode.removeChild(container);
    }, duration + 1000);
  }

  // Ajout de l'éclairage à la scène
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  app.scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 10, 10);
  app.scene.add(directionalLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-10, -10, -10);
  app.scene.add(fillLight);

  // Logs de débogage pour vérifier la scène et la position de la caméra
  console.log("Scene créée:", app.scene);
  console.log("Camera position:", app.camera.position);
  
  // Création et positionnement du Rubik's Cube
  createRubiksCube();
  console.log("Nombre de cubies:", app.cubies.length);
  console.log("Position du Rubik's Cube:", app.rubiksCube.position);

  // Gestion de l'événement de redimensionnement de l'écran
  window.addEventListener('resize', onWindowResize);

  // Gestion des événements de la souris pour le glisser/détecter un clic
  window.addEventListener('mousedown', (e) => {
    const cubeSection = document.getElementById('cube-section');
    const rect = cubeSection.getBoundingClientRect();
    // Vérifier si la section cube occupe toute la hauteur de la fenêtre
  // Tolérance sur la détection "plein écran" pour éviter les faux négatifs
  const _eps = 2; // tolérance en pixels
  const isCubeVisible = rect.top <= 1 && rect.bottom >= window.innerHeight - _eps;

    if (!isCubeVisible) return;

    app.isDragging = false;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;

    // Prepare drag for game-mode rotations
    dragStartIntersect = null;
    dragStartPoint = { x: e.clientX, y: e.clientY };
    isGameDragging = false;

    // Raycast to find starting cubie for potential game drag (only in game mode)
    dragStartIntersect = null;
    if (app.isPlayable) {
      app.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      app.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      app.raycaster.setFromCamera(app.mouse, app.camera);
      const intersects = app.raycaster.intersectObjects(app.cubies);
      if (intersects.length > 0) {
        dragStartIntersect = intersects[0];
      }
    }

    // Memorize whether the drag began on a cubie and toggle whole-cube rotation accordingly (only meaningful in game mode)
    dragStartedOnCubie = app.isPlayable && !!dragStartIntersect;
    try {
      if (app.controls) {
        if (app.isPlayable) {
          app.controls.enableRotate = !dragStartedOnCubie;
        } else {
          app.controls.enableRotate = true;
        }
      }
    } catch (e) {}
  });

  window.addEventListener('mousemove', (e) => {
    const cubeSection = document.getElementById('cube-section');
    const rect = cubeSection.getBoundingClientRect();
  // Tolérance sur la détection "plein écran" pour éviter les faux négatifs
  const _eps = 2; // tolérance en pixels
  const isCubeVisible = rect.top <= 1 && rect.bottom >= window.innerHeight - _eps;

    if (!isCubeVisible) return;

    // Si le déplacement de la souris dépasse un seuil, on considère l'action comme un glissement
    if (Math.abs(e.clientX - mouseStartX) > 5 || Math.abs(e.clientY - mouseStartY) > 5) {
      app.isDragging = true;
    }

    // Si on est en mode jeu et qu'on a commencé sur un cubie, activer le drag de jeu
    if (app.isPlayable && dragStartIntersect) {
      const dx = e.clientX - dragStartPoint.x;
      const dy = e.clientY - dragStartPoint.y;
      if (Math.sqrt(dx*dx + dy*dy) > 8) {
        isGameDragging = true;
      }
    }
  });

  window.addEventListener('mouseup', (e) => {
    const cubeSection = document.getElementById('cube-section');
    const rect = cubeSection.getBoundingClientRect();
  // Tolérance sur la détection "plein écran" pour éviter les faux négatifs
  const _eps = 2; // tolérance en pixels
  const isCubeVisible = rect.top <= 1 && rect.bottom >= window.innerHeight - _eps;

    if (!isCubeVisible) return;

    // Si on est en mode jeu et que l'utilisateur a glissé, effectuer une rotation de couche
    if (app.isPlayable && isGameDragging && dragStartIntersect) {
      const dx = e.clientX - dragStartPoint.x;
      const dy = e.clientY - dragStartPoint.y;

      // Determine move based on face and drag direction (improved algorithm)
      const normal = dragStartIntersect.face.normal.clone();
      normal.transformDirection(dragStartIntersect.object.matrixWorld);

      const pos = dragStartIntersect.object.userData.gridPos;

      function roundNum(v) { return Math.round(v); }

      // Build camera-based directions
      const camDir = new THREE.Vector3();
      app.camera.getWorldDirection(camDir);
      const cameraUp = app.camera.up.clone().applyQuaternion(app.camera.quaternion).normalize();
      const cameraRight = new THREE.Vector3().crossVectors(camDir, cameraUp).normalize();

      // Convert screen drag to world-space direction (invert Y because screen Y goes down)
      const dragWorld = cameraRight.clone().multiplyScalar(dx).add(cameraUp.clone().multiplyScalar(-dy)).normalize();

      // Rotation axis approximated by cross(normal, drag) -> invert pour corriger sens du swipe
      const rotAxis = new THREE.Vector3().crossVectors(normal, dragWorld).normalize();

      // Pick principal axis (x -> col, y -> row, z -> depth)
      const ax = Math.abs(rotAxis.x), ay = Math.abs(rotAxis.y), az = Math.abs(rotAxis.z);
      let layer, number, orientation;
      if (ax >= ay && ax >= az) {
        layer = 'col';
        number = roundNum(pos.x);
        orientation = rotAxis.x > 0 ? 1 : 0;
      } else if (ay >= ax && ay >= az) {
        layer = 'row';
        number = roundNum(pos.y);
        orientation = rotAxis.y > 0 ? 1 : 0;
      } else {
        layer = 'depth';
        number = roundNum(pos.z);
        orientation = rotAxis.z > 0 ? 1 : 0;
      }

      if (layer !== undefined) {
        // Flip orientation if camera is on the same side as the face normal to keep drag direction intuitive
        try {
          const camDirForFlip = new THREE.Vector3();
          app.camera.getWorldDirection(camDirForFlip);
          const faceDot = normal.dot(camDirForFlip);
          if (faceDot > 0) {
            orientation = orientation ? 0 : 1;
          }
        } catch (e) {}

        queueMove(layer, number, orientation, 400, { highlight: true });
      }

      // reset drag state
      dragStartIntersect = null;
      isGameDragging = false;
      dragStartPoint = null;

      // toujours réactiver la rotation entière du cube après la fin du drag
      try { if (app.controls) app.controls.enableRotate = true; } catch(e){}
      dragStartedOnCubie = false;

      return;
    }

    // Si aucun glissement n'est détecté, traiter comme un simple clic
    if (!app.isDragging) {
      handleClick(e);
    }
    app.isDragging = false;
  });

  // Création de la superposition pour les informations
  createOverlay();
  // Initialisation de la navigation du Rubik's Cube
  setupNavigation();

  // Initialisation du gestionnaire de langue
  const langManager = new LanguageManager();
  app.langManager = langManager;
  
  // Fonction utilitaire pour appliquer les traductions au DOM
  function applyTranslations(lang) {
    try {
      const t = langManager.translations[lang] || langManager.translations[langManager.currentLang] || {};
      const ui = t.ui || {};
  
      // Mise à jour du bouton shuffle/solve
      if (app.isPlayable) {
        app.shuffleSolveButton.textContent = ui.solveBtn || app.shuffleSolveButton.textContent || 'Résoudre';
        app.shuffleSolveButton.setAttribute('aria-label', ui.solveBtn || 'Résoudre');
      } else {
        app.shuffleSolveButton.textContent = ui.shuffleBtn || 'Mélanger';
        app.shuffleSolveButton.setAttribute('aria-label', ui.shuffleBtn || 'Mélanger');
      }
  
      // Reset button aria-label
      if (app.resetButton) app.resetButton.setAttribute('aria-label', ui.resetBtn || app.resetButton.getAttribute('aria-label'));
  
      // Hints
      const clickHintText = document.querySelector('#click-hint .hint-text');
      if (clickHintText) clickHintText.textContent = ui.clickHint || clickHintText.textContent;
      const navHintText = document.querySelector('#nav-hint .hint-text');
      if (navHintText) navHintText.textContent = ui.navHint || navHintText.textContent;
      const scrollTextEl = document.querySelector('.scroll-text');
      if (scrollTextEl) scrollTextEl.textContent = ui.scrollText || scrollTextEl.textContent;
  
      // Menu items (order in DOM: top, front, right, back, left, bottom)
      const menuKeysOrder = ['top','front','right','back','left','bottom'];
      const descKeys = ['about','skills','projects','experience','education','resume'];
      document.querySelectorAll('.menu-item').forEach((item, idx) => {
        const key = menuKeysOrder[idx];
        // ensure menu items have a stable data-face key (used to map regardless of language)
        try { item.dataset.face = key; } catch(e){}
        const h3 = item.querySelector('h3');
        const p = item.querySelector('p');
        if (h3 && t.categories && t.categories[key]) h3.textContent = t.categories[key];
        if (p && ui.menuDesc && ui.menuDesc[descKeys[idx]]) p.textContent = ui.menuDesc[descKeys[idx]];
      });
  
      // Page level texts from SITE_I18N (intro, loading, device note)
      try {
        const site = SITE_I18N[lang] || SITE_I18N[langManager.currentLang] || SITE_I18N['fr'];
        if (site) {
          if (site.pageTitle) document.title = site.pageTitle;
          const loadingEl = document.querySelector('.loading-text');
          if (loadingEl && site.loadingText) loadingEl.textContent = site.loadingText;
          const deviceNoteEl = document.getElementById('device-note');
          if (deviceNoteEl && site.deviceNote) deviceNoteEl.textContent = site.deviceNote;
          const typingEl = document.querySelector('.typing-text');
          if (typingEl && site.typingText) typingEl.innerHTML = site.typingText;
          // Intro paragraphs
          const introText = document.querySelector('.intro-text');
          if (introText && site.intro && Array.isArray(site.intro.paragraphs)) {
            // join with '<br>' between paragraphs to avoid trailing <br> at the end
            introText.innerHTML = site.intro.paragraphs.map(p => `<p>${p}</p>`).join('<br>');
          }
        }
      } catch(e) { console.warn('[applyTranslations] SITE_I18N update failed', e); }
  
      // Footer titles
      const footTitles = document.querySelectorAll('.footer-title');
      if (footTitles.length >= 3) {
        footTitles[0].textContent = ui.contact || footTitles[0].textContent;
        footTitles[1].textContent = ui.socialNetworks || footTitles[1].textContent;
        footTitles[2].textContent = ui.navigation || footTitles[2].textContent;
      }
  
      // Quick links
      document.querySelectorAll('.quick-link').forEach(a => {
        const face = a.getAttribute('data-face');
        if (!face) {
          a.textContent = ui.homeLabel || (lang === 'fr' ? 'Accueil' : 'Home');
        } else {
          if (t.categories && t.categories[face]) a.textContent = t.categories[face];
        }
      });
  
      // Update language button label if present
      if (app.langBtn) {
        const codeEl = app.langBtn.querySelector('.lang-code');
        if (codeEl) codeEl.textContent = (lang || langManager.currentLang).toUpperCase();
      }
  
      // reposition hints if necessary
      try { app._hints && typeof app._hints.positionHints === 'function' && app._hints.positionHints(); } catch(e){}
    } catch(e) { console.warn('[applyTranslations] failed', e); }
  }
  
  // Initialiser et lier le LanguageManager avant les hints pour que setupHints puisse utiliser les traductions
  langManager.init().then(() => {
    applyTranslations(langManager.currentLang);
    langManager.onLanguageChange((lang) => applyTranslations(lang));
    // initialiser les hints après avoir appliqué les traductions
    try { setupHints(); } catch(e) { console.warn('[setupHints] failed to start', e); }
  }).catch(e => console.warn('LanguageManager init failed', e));
  
  // Création du bouton langue (à côté du thème)
  try {
    const themeBtn = document.querySelector('.theme-btn');
    const langBtn = document.createElement('button');
    langBtn.className = 'lang-btn';
    langBtn.setAttribute('aria-label', 'Langue');
    langBtn.innerHTML = `<span class="lang-code">${(langManager.currentLang||'fr').toUpperCase()}</span>`;
    langBtn.addEventListener('click', (ev) => {
      const next = (langManager.currentLang === 'fr') ? 'en' : 'fr';
      langManager.setLanguage(next);
    });
    // insert after theme button when available
    if (themeBtn && themeBtn.parentElement) themeBtn.parentElement.insertBefore(langBtn, themeBtn.nextSibling);
    else document.body.appendChild(langBtn);
    app.langBtn = langBtn;
  } catch(e) { console.warn('[langBtn] creation failed', e); }
}

// Ajustement de la scène lors du redimensionnement de la fenêtre
function onWindowResize() {
  app.camera.aspect = window.innerWidth / window.innerHeight;
  app.camera.updateProjectionMatrix();
  app.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Gestion du clic sur un cubie
function handleClick(event) {
  const cubeSection = document.getElementById('cube-section');
  const rect = cubeSection.getBoundingClientRect();
  // Tolérance sur la détection "plein écran" pour éviter les faux négatifs
  const _eps = 2; // tolérance en pixels
  const isCubeVisible = rect.top <= 1 && rect.bottom >= window.innerHeight - _eps;
  
  if (!isCubeVisible || app.isModalOpen) return; 

  // Si on est en mode jeu, ignorer totalement les clics sur les cubies / UI portfolio
  if (app.isPlayable) {
    // Empêcher aussi la propagation vers d'autres handlers
    try { event.stopPropagation(); event.preventDefault(); } catch(e){}
    return;
  }
  
  // Calcul des coordonnées normalisées de la souris
  app.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  app.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  app.raycaster.setFromCamera(app.mouse, app.camera);
  const intersects = app.raycaster.intersectObjects(app.cubies);

  if (intersects.length > 0) {
    const intersection = intersects[0];
    const normal = intersection.face.normal.clone();
    normal.transformDirection(intersection.object.matrixWorld);
    
    let faceType;
    const epsilon = 0.1;  // Tolérance pour la détection de la face
    if (Math.abs(normal.z) > 1 - epsilon) faceType = normal.z > 0 ? 'front' : 'back';
    else if (Math.abs(normal.x) > 1 - epsilon) faceType = normal.x > 0 ? 'right' : 'left';
    else if (Math.abs(normal.y) > 1 - epsilon) faceType = normal.y > 0 ? 'top' : 'bottom';

    const centralCubie = getCentralCubie(faceType);
    
    if (centralCubie) {
      if (app.isZoomed) {
        // Si on est déjà zoomé, gérer le clic sur un cubie pour afficher une info ou ouvrir un lien
        const clickedCubie = intersection.object;
        const pos = clickedCubie.userData.gridPos;
        
        let position;
        switch(faceType) {
          case 'right':
            // Inversion de la rangée et de la colonne pour la face droite
            const rowR = 2 - Math.floor(pos.y + 1);
            const colR = 2 - Math.floor(pos.z + 1);
            position = rowR * 3 + colR;
            console.log('Position calculée (back):', {
              x: pos.y,
              z: pos.x,
              position: position
            });
            break;
          case 'left':
            // Pour les faces droite et gauche : y pour la ligne, z pour la colonne
            const row = 2 - Math.floor(pos.y + 1);
            const col = Math.floor(pos.z + 1);
            position = row * 3 + col;
            console.log('Position calculée (right/left):', {
              x: pos.y,
              z: pos.x,
              position: position
            });
            break;
          case 'back':
            // Inversion de la colonne pour la face arrière
            const rowB = 2 - Math.floor(pos.y + 1);
            const colB = 2 - Math.floor(pos.x + 1);
            position = rowB * 3 + colB;
            console.log('Position calculée (back):', {
              x: pos.y,
              z: pos.x,
              position: position
            });
            break;
          case 'front':
            // Pour la face avant : y détermine la ligne, x détermine la colonne
            const rowFB = 2 - Math.floor(pos.y + 1);
            const colFB = Math.floor(pos.x + 1);
            position = rowFB * 3 + colFB;
            console.log('Position calculée (front/back):', {
              x: pos.y,
              z: pos.x,
              position: position
            });
            break;
          case 'top':
          case 'bottom':
            // Pour la face supérieure ou inférieure : z pour la ligne, x pour la colonne
            const rowTB = 2 - Math.floor(pos.z + 1);
            const colTB = Math.floor(pos.x + 1);
            position = rowTB * 3 + colTB;
            console.log('Position calculée (top/bottom):', {
              x: pos.z,
              z: pos.x,
              position: position
            });
            break;
        }
        
        // Affiche l'info ou ouvre le lien associé si disponible
        if (CUBE_CONTENT[faceType] && CUBE_CONTENT[faceType][position] && CUBE_CONTENT[faceType][position].hasContent) {
          showInfoCard(event, faceType, position);
        } else if (CUBE_CONTENT[faceType] && CUBE_CONTENT[faceType][position] && CUBE_CONTENT[faceType][position].link) {
          window.open(CUBE_CONTENT[faceType][position].link, "_blank");
        }
      } else {
        // Sinon, zoomer sur la face cliquée
        const container = document.querySelector('.container');
        container.style.overflow = 'hidden';
        
        zoomToFace(centralCubie, normal, faceType);
        app.isZoomed = true;

        // Empêcher l'ouverture du menu automatique si on est en mode jeu
        if (!app.isPlayable) {
          // Ouverture du menu si ce n'est pas déjà fait
          if (!app.menuOpen) {
            app.menuBtn.classList.add('open');
            app.menu.classList.add('active');
            app.menuOpen = true;
          }

          // Activation de l'élément de menu correspondant à la face
          document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            try {
              if (item.dataset && item.dataset.face === faceType) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            } catch(e) {}
          });
        } else {
          // En mode jeu, s'assurer que le menu reste fermé
          try { app.menu.classList.remove('active'); app.menuBtn.classList.remove('open'); app.menuOpen = false; } catch(e){}
        }
      }
    }
  }
}

// Boucle d'animation continue pour le rendu de la scène
function animate() {
  requestAnimationFrame(animate);
  
  if (app.controls) {
    app.controls.update();
  }
  
  if (app.scene && app.camera && app.renderer) {
    app.renderer.render(app.scene, app.camera);
  } else {
    console.error("Éléments manquants pour le rendu:", {
      scene: !!app.scene,
      camera: !!app.camera,
      renderer: !!app.renderer
    });
  }
}

// Lancement de l'application
init();
animate();


// Comportement du bouton Mélanger / Assembler
function enterGameModeUI() {
  // Fermer le menu et masquer les interactions de portfolio
  if (app.menu) {
    app.menu.classList.remove('active');
    // disable pointer events on the menu while in game mode
    try { app.menu.style.pointerEvents = 'none'; app.menu.setAttribute('aria-hidden', 'true'); } catch(e){}
  }
  if (app.menuBtn) {
    app.menuBtn.classList.remove('open');
    // hide and disable pointer on menu button to avoid opening
    try { app.menuBtn.style.display = 'none'; app.menuBtn.style.pointerEvents = 'none'; app.menuBtn.setAttribute('aria-hidden', 'true'); } catch(e){}
  }
  app.menuOpen = false;

  // activer le mode jeu : désactiver zoom/pan mais garder la rotation entière du cube
  app.isPlayable = true;
  if (app.controls) {
    app.controls.enabled = true; // keep controls enabled for rotate
    app.controls.enableRotate = true;
    app.controls.enableZoom = false;
    app.controls.enablePan = false;
  }

  // masquer le bouton menu pendant le mode jeu
  try { if (app.menuBtn) app.menuBtn.style.display = 'none'; } catch(e){}
  // masquer le bouton langue
  try { if (app.langBtn) app.langBtn.style.display = 'none'; } catch(e){}
}

function exitGameModeUI() {
  // Remettre l'UI du portfolio en place
  app.isPlayable = false;
  app.shuffleSolveButton.disabled = false;
  app.shuffleSolveButton.textContent = (app.langManager && app.langManager.translate) ? app.langManager.translate('shuffleBtn','ui') : 'Mélanger';

  // réactiver contrôles caméra
  if (app.controls) {
    app.controls.enabled = true;
    app.controls.enableZoom = true;
    app.controls.enableRotate = true;
    app.controls.enablePan = true;
  }

  // restaurer menu btn visibility via navigation.updateUI (no direct style)
  try { if (app.menuBtn) { app.menuBtn.style.display = ''; app.menuBtn.style.pointerEvents = ''; app.menuBtn.removeAttribute('aria-hidden'); } } catch(e){}
  try { if (app.menu) { app.menu.style.pointerEvents = ''; app.menu.removeAttribute('aria-hidden'); } } catch(e){}

  // restaurer le bouton langue
  try { if (app.langBtn) app.langBtn.style.display = ''; } catch(e){}

  // Recalibrer l'orientation globale du Rubik afin que les faces correspondent au portfolio
  try {
    const recalibrated = typeof recalibrateRubikOrientation === 'function' && recalibrateRubikOrientation();
    if (recalibrated) {
      // Mettre à jour les textures de chaque face pour refléter la nouvelle orientation
      const faces = ['right','left','top','bottom','front','back'];
      faces.forEach(faceType => {
        app.cubies.forEach(cubie => {
          try { updateFaceTextures(cubie, faceType, false); } catch(e) {}
        });
      });
    }
  } catch(e) { console.warn('[exitGameModeUI] recalibration failed', e); }
}

// Empêcher toute ouverture programmatique du menu pendant le mode jeu
// (observer + blocage des clics). Ceci renforce le guard dans le click handler.
(function setupMenuGameBlocker(){
  try {
    if (!app.menu) return;

    // Block clicks inside the menu while game mode is active
    app.menu.addEventListener('click', (ev) => {
      if (app.isPlayable) {
        ev.stopPropagation();
        ev.preventDefault();
      }
    }, true);

    // Also block pointer events on the whole menu (defensive, in case styles are changed)
    // MutationObserver to revert any programmatic attempts to add 'active' class
    const observer = new MutationObserver((mutations) => {
      if (!app.isPlayable) return;
      mutations.forEach(m => {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          if (app.menu.classList.contains('active')) {
            app.menu.classList.remove('active');
            try { if (app.menuBtn) app.menuBtn.classList.remove('open'); } catch(e){}
            app.menuOpen = false;
            console.log('[debug] Menu opening reverted because game-mode is active');
          }
        }
      });
    });

    observer.observe(app.menu, { attributes: true, attributeFilter: ['class'] });

    // expose observer so it can be disconnected later if needed
    app._menuGameObserver = observer;
  } catch(e) { console.warn('[menu blocker] failed to setup', e); }
})();

app.shuffleSolveButton.addEventListener('click', async (e) => {
  if (isBusy()) return; // attendre la fin des animations

  const label = app.shuffleSolveButton.textContent;
  const shuffleLabel = (app.langManager && app.langManager.translate) ? app.langManager.translate('shuffleBtn','ui') : 'Mélanger';
  const solvingLabel = (app.langManager && app.langManager.translate) ? app.langManager.translate('solveBtn','ui') : 'Résoudre';
  if (label === shuffleLabel) {
    // clear previous move history to avoid huge scrambles
    try { resetMoves(); } catch(e) { console.warn('resetMoves failed before shuffle', e); }

    // Démarrer le mélange
    app.shuffleSolveButton.disabled = true;
    app.shuffleSolveButton.textContent = (app.langManager && app.langManager.translate) ? app.langManager.translate('shuffling','ui') : 'Mélange...';
    enterGameModeUI();
    shuffle(25);

    // attendre la fin du mélange
    const interval = setInterval(() => {
      if (!isBusy()) {
        clearInterval(interval);
        app.shuffleSolveButton.disabled = false;
        app.shuffleSolveButton.textContent = solvingLabel;
        // afficher le hint post-mélange une seule fois si disponible
        try {
          if (app._hints && typeof app._hints.showRotateHintOnce === 'function') {
            // positionner d'abord correctement
            try { app._hints.positionHints(); } catch(e){}
            try { app._hints.showRotateHintOnce(); } catch(e){ console.warn('[hints] showRotateHintOnce failed', e); }
          }
        } catch(e) { console.warn('[hints] failed to trigger rotate hint', e); }
      }
    }, 150);
  } else if (label === solvingLabel) {
    // Lancer la résolution automatique
    if (isBusy()) return;
    app.shuffleSolveButton.disabled = true;
    app.shuffleSolveButton.textContent = (app.langManager && app.langManager.translate) ? app.langManager.translate('solving','ui') : 'Résolution...';
    app.isAutoSolving = true; // Indiquer que la résolution automatique est en cours
    solve();
    // onSolved callback gèrera le retour d'UI
  }
});

// Quand le solveur a fini, revenir au portfolio
registerOnSolved(() => {
  // réactiver l'UI portfolio
  exitGameModeUI();
  // réinitialiser les mouvements stockés
  resetMoves();
  app.isAutoSolving = false; // Réinitialiser l'état de résolution automatique

  // Réinitialiser le label du bouton si le cube est résolu manuellement
  const isSolved = app.cubies.every(cubie => {
    const pos = cubie.userData.gridPos;
    return pos.x === 0 && pos.y === 0 && pos.z === 0; // Vérifie si chaque cubie est à sa position d'origine
  });

  if (isSolved) {
    app.shuffleSolveButton.textContent = 'Mélanger';
  }
});

// Détection automatique de l'état "résolu" (pour mouvements manuels)
let __lastSolvedState = null;
let __solvedInitDone = false;
let __solveCheckCounter = 0;
if (typeof app.isAutoSolving === 'undefined') app.isAutoSolving = false;

// Pré-calcul des 24 matrices de rotation propres (déterminant = +1)
function generate24RotationMatrices() {
  const perms = [
    [0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]
  ];
  const signs = [[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1]];
  const mats = [];
  for (const p of perms) {
    for (const s of signs) {
      // construire la matrice 3x3 en colonnes
      const m = [
        s[0] * (p[0] === 0 ? 1 : 0), s[1] * (p[0] === 1 ? 1 : 0), s[2] * (p[0] === 2 ? 1 : 0),
        s[0] * (p[1] === 0 ? 1 : 0), s[1] * (p[1] === 1 ? 1 : 0), s[2] * (p[1] === 2 ? 1 : 0),
        s[0] * (p[2] === 0 ? 1 : 0), s[1] * (p[2] === 1 ? 1 : 0), s[2] * (p[2] === 2 ? 1 : 0)
      ];
      // calcul du déterminant via colonnes
      const col0 = new THREE.Vector3(m[0], m[3], m[6]);
      const col1 = new THREE.Vector3(m[1], m[4], m[7]);
      const col2 = new THREE.Vector3(m[2], m[5], m[8]);
      const det = col0.dot(col1.clone().cross(col2));
      if (det > 0.5) mats.push(m);
    }
  }
  return mats;
}
const __rotationMatrices24 = generate24RotationMatrices();

function isCubeSolvedRobust(epsilon = 0.25) {
  try {
    if (!app.cubies || app.cubies.length === 0 || !app.rubiksCube) return false;

    // position du centre du cube en world-space
    const cubeCenter = new THREE.Vector3();
    app.rubiksCube.getWorldPosition(cubeCenter);

    // positions courantes centrées (world-space) des cubies
    const currents = app.cubies.map(c => {
      const w = new THREE.Vector3();
      c.getWorldPosition(w);
      return w.sub(cubeCenter);
    });

    // positions home attendues (locales, relatives au centre)
    const homes = app.cubies.map(c => {
      if (!c.userData || !c.userData.homePos) throw new Error('homePos manquant');
      return c.userData.homePos.clone();
    });

    // tester les 24 rotations propres
    for (let ri = 0; ri < __rotationMatrices24.length; ri++) {
      const m = __rotationMatrices24[ri];
      let ok = true;
      for (let i = 0; i < homes.length; i++) {
        const h = homes[i];
        const r = new THREE.Vector3(
          m[0]*h.x + m[1]*h.y + m[2]*h.z,
          m[3]*h.x + m[4]*h.y + m[5]*h.z,
          m[6]*h.x + m[7]*h.y + m[8]*h.z
        );
        if (r.distanceTo(currents[i]) > epsilon) { ok = false; break; }
      }
      if (ok) {
        // console.log('[debug] solved detected with rotation index', ri);
        return true;
      }
    }
    return false;
  } catch (e) {
    console.warn('[isCubeSolvedRobust] failed', e);
    return false;
  }
}

// Intervalle de contrôle régulier de l'état résolu (mouvements manuels)
setInterval(() => {
  __solveCheckCounter++;
  const isSolved = isCubeSolvedRobust(0.25);

  // logs de debug 1 fois sur 5
  /*
  if (__solveCheckCounter % 5 === 0) {
    try {
      console.log('[debug] solve-check #' + __solveCheckCounter + ' - isSolved=', isSolved, 'isAutoSolving=', !!app.isAutoSolving);
      const sample = app.cubies.slice(0, 27).map((c, i) => {
        const p = c.userData.gridPos || {}; const h = c.userData.homePos || {};
        return `${i}: pos(${p.x?.toFixed?.(2)||p.x},${p.y?.toFixed?.(2)||p.y},${p.z?.toFixed?.(2)||p.z}) home(${h.x},${h.y},${h.z})`;
      }).join(' | ');
      console.log('[debug] cube state sample:', sample);
    } catch(e) { console.warn('[debug] failed to print cube state sample', e); }
  }*/

  if (!__solvedInitDone) {
    __lastSolvedState = isSolved;
    __solvedInitDone = true;
    return;
  }

  if (isSolved && !__lastSolvedState) {
    __lastSolvedState = true;
    console.log('[debug] cube detected as SOLVED (manual). isAutoSolving=', !!app.isAutoSolving);
    if (!app.isAutoSolving) {
      // Reset the cube to its initial physical positions to avoid orientation/overlay issues
      try { typeof resetRubikToHome === 'function' && resetRubikToHome(); } catch (e) { console.warn('[manual-solved] resetRubikToHome failed', e); }

      // Confetti and UI reset
      try { app.triggerConfetti && app.triggerConfetti(3500); } catch (e) { console.warn(e); }
      try { app.shuffleSolveButton.textContent = 'Mélanger'; app.shuffleSolveButton.disabled = false;
            console.log('[debug] UI button reset to Mélanger'); } catch (e) { console.warn(e); }

      // restore portfolio UI and reset move history so future solve uses only new scramble
      try {
        resetMoves();
      } catch (e) { console.warn('resetMoves failed on manual solved', e); }
      try {
        exitGameModeUI();
      } catch (e) { console.warn('exitGameModeUI failed on manual solved', e); }

    }
  } else if (!isSolved) {
    __lastSolvedState = false;
  }
}, 800);

// Ajout : fonction pour réinitialiser le Rubik au Home (positions et rotations) et rafraîchir les textures
function resetRubikToHome() {
  try {
    if (!app.cubies || app.cubies.length === 0 || !app.rubiksCube) return false;
    const spacing = (typeof app.cubeSize !== 'undefined' ? app.cubeSize : 1) + (typeof app.gap !== 'undefined' ? app.gap : 0.05);

    // Reset groupe rotation/position
    app.rubiksCube.position.set(0,0,0);
    app.rubiksCube.rotation.set(0,0,0);
    app.rubiksCube.quaternion.identity();
    app.rubiksCube.updateMatrixWorld(true);

    // Reset each cubie to its home grid position and reset orientation
    app.cubies.forEach(cubie => {
      try {
        const h = cubie.userData.homePos ? cubie.userData.homePos.clone() : (cubie.userData.gridPos ? cubie.userData.gridPos.clone() : new THREE.Vector3());
        cubie.position.set(h.x * spacing, h.y * spacing, h.z * spacing);
        cubie.userData.gridPos = h.clone();
        cubie.rotation.set(0,0,0);
        cubie.quaternion.identity();
        cubie.updateMatrixWorld(true);
      } catch (e) {
        console.warn('[resetRubikToHome] failed for cubie', e);
      }
    });

    // Refresh textures for all faces
    const faces = ['right','left','top','bottom','front','back'];
    faces.forEach(faceType => {
      app.cubies.forEach(cubie => {
        try { updateFaceTextures(cubie, faceType, false); } catch(e) {}
      });
    });

    console.log('[debug] resetRubikToHome applied');
    return true;
  } catch (e) {
    console.warn('[resetRubikToHome] failed', e);
    return false;
  }
}

// Ajout d'événements sur le menu pour réagir aux clics sur les catégories
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    // Bloquer toute interaction du menu lorsque le mode jeu est activé
    if (app.isPlayable) {
      console.log('[debug] menu-item click ignored because game mode is active');
      return;
    }

    // Prefer data-face attribute (stable regardless of language), fallback to matching category text
    let faceType = item.dataset && item.dataset.face ? item.dataset.face : null;
    if (!faceType) {
      const category = item.querySelector('h3') ? item.querySelector('h3').textContent : '';
      faceType = Object.keys(CATEGORIES).find(key => CATEGORIES[key] === category);
    }
    
    if (faceType) {
      const centralCubie = getCentralCubie(faceType);
      if (centralCubie) {
        // Pour mobile, fermeture automatique du menu
        if (window.innerWidth < 768) {
          app.menuBtn.classList.remove('open');
          app.menu.classList.remove('active');
          app.menuOpen = false;
        }
        // Définir un vecteur normal pour la face concernée
        let normal = new THREE.Vector3();
        switch(faceType) {
          case 'front':
          case 'back':
          case 'right':
          case 'left':
          case 'top':
          case 'bottom':
            normal.set(0, 0, 0); // Valeur par défaut, ne devrait pas arriver
        }
        
        zoomToFace(centralCubie, normal, faceType);
        app.isZoomed = true;

        // Activation visuelle du menu sélectionné
        document.querySelectorAll('.menu-item').forEach(menuItem => {
          menuItem.classList.remove('active');
        });
        try { item.classList.add('active'); } catch(e){}
      }
    }
  });
});

// Fonction pour gérer les indicateurs d'aide
function setupHints() {
  const clickHint = document.getElementById('click-hint');
  const navHint = document.getElementById('nav-hint');
  const container = document.querySelector('.container');
  const cubeSection = document.getElementById('cube-section');

  if (!clickHint || !navHint || !cubeSection) return;

  // crée le rotate-hint (post-shuffle) s'il n'existe pas
  function createRotateHint() {
    let rotate = document.getElementById('rotate-hint');
    if (rotate) return rotate;
    rotate = document.createElement('div');
    rotate.id = 'rotate-hint';
    rotate.className = 'cube-hint rotate-hint';
    // Use translated text if available
    const txt = (app.langManager && typeof app.langManager.translate === 'function') ? app.langManager.translate('rotateHint','ui') : 'Faites glisser une face pour la pivoter';
    rotate.innerHTML = `
      <div class="hint-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12a9 9 0 10-2.65 6.06" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 3v6h-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="hint-text">${txt}</div>
    `;
    document.body.appendChild(rotate);
    return rotate;
  }

  const rotateHint = createRotateHint();

  // Positionne dynamiquement les hints pour éviter chevauchements et mauvais placement
  function positionHints() {
    try {
      const rect = cubeSection.getBoundingClientRect();

      // positionner clickHint CENTRÉ sur le cube (au milieu du bounding box)
      clickHint.style.position = 'fixed';
      clickHint.style.left = (rect.left + rect.width / 2) + 'px';
      clickHint.style.top = (rect.top + rect.height / 2) + 'px';
      clickHint.style.transform = 'translate(-50%, -50%)';

      // positionner navHint à gauche, aligné au centre des boutons de navigation si possible
      const navButtons = document.querySelectorAll('.nav-button');
      if (navButtons && navButtons.length > 0) {
        const nbRect = navButtons[0].getBoundingClientRect();
        navHint.style.position = 'fixed';
        navHint.style.left = (nbRect.left + nbRect.width + 18) + 'px';
        // centre vertical sur la pile de boutons
        const topMost = navButtons[0].getBoundingClientRect().top;
        const bottomMost = navButtons[navButtons.length - 1].getBoundingClientRect().bottom;
        const center = (topMost + bottomMost) / 2;
        navHint.style.top = center + 'px';
        navHint.style.transform = 'translateY(-50%)';
      } else {
        navHint.style.position = 'fixed';
        navHint.style.left = '80px';
        navHint.style.top = (rect.top + rect.height * 0.4) + 'px';
        navHint.style.transform = 'translateY(-50%)';
      }

      // rotate hint bottom-centered relative to cube
      // positionner rotateHint au-dessus du bouton "Mélanger/Résoudre" si présent,
      // sinon fallback centré en bas du cube (avec léger offset pour éviter superposition)
      rotateHint.style.position = 'fixed';
      const solveBtn = (typeof app !== 'undefined' && app.shuffleSolveButton) ? app.shuffleSolveButton : document.querySelector('.shuffle-solve-btn, #shuffle-solve-btn, .solve-btn, .shuffle-btn');
      if (solveBtn) {
        const sRect = solveBtn.getBoundingClientRect();
        const rRect = rotateHint.getBoundingClientRect();
        // centrer horizontalement sur le bouton et placer juste au-dessus avec un gap
        rotateHint.style.left = (sRect.left + sRect.width / 2) + 'px';
        rotateHint.style.top = (sRect.top - (rRect.height || 84) - 12) + 'px';
        rotateHint.style.transform = 'translateX(-50%)';
        rotateHint.style.zIndex = '250';
      } else {
        rotateHint.style.left = (rect.left + rect.width / 2) + 'px';
        rotateHint.style.top = (rect.bottom - Math.min(180, rect.height * 0.28) - 18) + 'px';
        rotateHint.style.transform = 'translateX(-50%)';
      }
    } catch (e) {
      // fail silently
    }
  }

  // Masque toutes les aides visibles
  function hideAllHints() {
    try { clickHint.classList.remove('visible'); } catch(e){}
    try { navHint.classList.remove('visible'); } catch(e){}
    try { rotateHint.classList.remove('visible'); rotateHint.classList.remove('pulse-rotate'); } catch(e){}
  }

  // Affiche le rotate-hint une seule fois après le shuffle (si l'utilisateur ne l'a pas déjà vu)
  function showRotateHintOnce() {
    try {
      if (localStorage.getItem('hasSeenRotateHint')) return;
      // on ne montre le hint que si l'utilisateur est en mode jeu et que le cube est visible
      const rect = cubeSection.getBoundingClientRect();
  // Tolérance sur la détection "plein écran"
  const _eps_local = 2;
  if (!(rect.top <= 1 && rect.bottom >= window.innerHeight - _eps_local)) return;

      positionHints();
      // refresh text in case language changed since creation
      try { rotateHint.querySelector('.hint-text').textContent = app.langManager.translate('rotateHint','ui'); } catch(e){}
      rotateHint.classList.add('visible');
      // petite animation d'attention
      rotateHint.classList.add('pulse-rotate');

      // cacher au premier contact avec le cube (mousedown/touchstart) ou après 8s
      const dismiss = () => {
        rotateHint.classList.remove('visible');
        rotateHint.classList.remove('pulse-rotate');
        localStorage.setItem('hasSeenRotateHint', 'true');
        window.removeEventListener('mousedown', onInteract);
        window.removeEventListener('touchstart', onInteract);
      };
      const onInteract = () => dismiss();
      window.addEventListener('mousedown', onInteract, { once: true });
      window.addEventListener('touchstart', onInteract, { once: true });
      setTimeout(() => dismiss(), 8000);
    } catch (e) { console.warn('[showRotateHintOnce] failed', e); }
  }

  // Display initial hints only on first visit (existing behaviour improved)
  const hasSeenHints = localStorage.getItem('hasSeenCubeHints');
  if (!hasSeenHints) {
    const onContainerScroll = function() {
      const rect = cubeSection.getBoundingClientRect();
  // Tolérance sur la détection "plein écran"
  const _eps_local2 = 2;
  if (rect.top <= 1 && rect.bottom >= window.innerHeight - _eps_local2) {
        // position then show
        positionHints();
        setTimeout(() => {
          clickHint.classList.add('visible');
          navHint.classList.add('visible');
          // hide after 6s
          setTimeout(() => {
            hideAllHints();
            localStorage.setItem('hasSeenCubeHints', 'true');
          }, 6000);
        }, 800);
        container.removeEventListener('scroll', onContainerScroll);
      }
    };
    container.addEventListener('scroll', onContainerScroll, { passive: true });

    // Dismiss on first click in cube-section or nav buttons
    const dismissHints = () => {
      hideAllHints();
      localStorage.setItem('hasSeenCubeHints', 'true');
    };
    cubeSection.addEventListener('click', dismissHints, { once: true });
    document.querySelectorAll('.nav-button').forEach(btn => btn.addEventListener('click', dismissHints, { once: true }));
  } else {
    // ensure hints are hidden if already seen
    hideAllHints();
  }

  // Reposition on resize and scroll
  window.addEventListener('resize', () => positionHints());
  window.addEventListener('orientationchange', () => positionHints());
  // reposition when camera/cube might move (safeguard) every 250ms while visible
  let repositionInterval = null;
  function startRepositionLoop() {
    if (repositionInterval) return;
    repositionInterval = setInterval(() => positionHints(), 250);
  }
  function stopRepositionLoop() { if (repositionInterval) { clearInterval(repositionInterval); repositionInterval = null; } }

  // start reposition loop only while any hint is visible
  const observer = new MutationObserver(() => {
    const anyVisible = clickHint.classList.contains('visible') || navHint.classList.contains('visible') || rotateHint.classList.contains('visible');
    if (anyVisible) startRepositionLoop(); else stopRepositionLoop();
  });
  observer.observe(clickHint, { attributes: true, attributeFilter: ['class'] });
  observer.observe(navHint, { attributes: true, attributeFilter: ['class'] });
  observer.observe(rotateHint, { attributes: true, attributeFilter: ['class'] });

  // expose utility to other modules
  app._hints = {
    showRotateHintOnce,
    positionHints,
    hideAllHints
  };
}

// Fonction pour adapter la navigation lors du redimensionnement
function adaptNavigation() {
  app.controls.enableZoom = true;
  app.controls.rotateSpeed = 0.5;
  app.controls.enablePan = true;
}

// Appel de la fonction d'adaptation sur redimensionnement de la fenêtre
window.addEventListener('resize', () => {
  onWindowResize();
  adaptNavigation();
});

/*
// Sélecteur de langue - code désactivé
const langBtn = document.querySelector('.selected-lang');
const langDropdown = document.querySelector('.lang-dropdown');
const langOptions = document.querySelectorAll('.lang-dropdown button');

langBtn.addEventListener('click', () => {
  langBtn.parentElement.classList.toggle('active');
});
*/

// Old naive solved-detection block removed — using isCubeSolvedRobust() implementation above.
