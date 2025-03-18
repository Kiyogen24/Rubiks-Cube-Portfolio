// Importations de modules essentiels
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStickerMaterial, calculateCubiePosition, createRubiksCube } from './cube/cube.js';
import { zoomToFace, setupNavigation, dezoom, setupControls, onMouseMove, getCentralCubie } from './cube/navigation.js';
import { createOverlay, showInfoCard } from './cards/overlay.js';
import { displayPreview, hidePreview } from './cards/preview.js';
import { CATEGORIES, CUBE_CONTENT, stickerColors } from './utils/constants.js';
import { app } from './globals.js';


// Variables globales
let currentSection = 'intro';
let resetButton;
let menuBtn = document.querySelector('.menu-btn');
let menu = document.querySelector('.menu');

// Expose des éléments dans l'objet global "app"
app.resetButton = resetButton;
app.menuBtn = menuBtn;
app.menu = menu;

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
    const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;

    if (!isCubeVisible) return;

    app.isDragging = false;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    const cubeSection = document.getElementById('cube-section');
    const rect = cubeSection.getBoundingClientRect();
    const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;

    if (!isCubeVisible) return;

    // Si le déplacement de la souris dépasse un seuil, on considère l'action comme un glissement
    if (Math.abs(e.clientX - mouseStartX) > 5 || Math.abs(e.clientY - mouseStartY) > 5) {
      app.isDragging = true;
    }
  });

  window.addEventListener('mouseup', (e) => {
    const cubeSection = document.getElementById('cube-section');
    const rect = cubeSection.getBoundingClientRect();
    const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;

    if (!isCubeVisible) return;

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

  // Gestion des indicateurs d'aide
  setupHints();
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
  const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;
  
  if (!isCubeVisible || app.isModalOpen) return; 
  
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

        // Ouverture du menu si ce n'est pas déjà fait
        if (!app.menuOpen) {
          app.menuBtn.classList.add('open');
          app.menu.classList.add('active');
          app.menuOpen = true;
        }

        // Activation de l'élément de menu correspondant à la face
        document.querySelectorAll('.menu-item').forEach(item => {
          item.classList.remove('active');
          if (item.querySelector('h3').textContent === CATEGORIES[faceType]) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
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

// Ajout d'événements sur le menu pour réagir aux clics sur les catégories
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    const category = item.querySelector('h3').textContent;
    // Trouver le type de face correspondant à la catégorie sélectionnée
    const faceType = Object.keys(CATEGORIES).find(key => CATEGORIES[key] === category);
    
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
          case 'front': normal.set(0, 0, 1); break;
          case 'back': normal.set(0, 0, -1); break;
          case 'right': normal.set(1, 0, 0); break;
          case 'left': normal.set(-1, 0, 0); break;
          case 'top': normal.set(0, 1, 0); break;
          case 'bottom': normal.set(0, -1, 0); break;
        }
        
        zoomToFace(centralCubie, normal, faceType);
        app.isZoomed = true;

        // Activation visuelle du menu sélectionné
        document.querySelectorAll('.menu-item').forEach(menuItem => {
          menuItem.classList.remove('active');
        });
        item.classList.add('active');
      }
    }
  });
});


// Fonction pour gérer les indicateurs d'aide
function setupHints() {
  const clickHint = document.getElementById('click-hint');
  const navHint = document.getElementById('nav-hint');
  const container = document.querySelector('.container');
  
  // Vérifier si c'est la première visite
  const hasSeenHints = localStorage.getItem('hasSeenCubeHints');
  
  if (!hasSeenHints) {
    // Détecter quand l'utilisateur arrive sur la section du cube
    container.addEventListener('scroll', function() {
      const cubeSection = document.getElementById('cube-section');
      const rect = cubeSection.getBoundingClientRect();
      
      // Si la section du cube est visible à l'écran
      if (rect.top === 0 && rect.bottom === window.innerHeight) {
        // Afficher les indicateurs après un court délai
        setTimeout(() => {
          clickHint.classList.add('visible');
          navHint.classList.add('visible');
          
          // Masquer les indicateurs après 6 secondes
          setTimeout(() => {
            clickHint.classList.remove('visible');
            navHint.classList.remove('visible');
            
            // Marquer comme vu
            localStorage.setItem('hasSeenCubeHints', 'true');
          }, 6000);
        }, 1000);
      }
    }, { passive: true });
    
    // Masquer les indicateurs si l'utilisateur interagit avec le cube
    document.getElementById('cube-section').addEventListener('click', () => {
      clickHint.classList.remove('visible');
      navHint.classList.remove('visible');
      localStorage.setItem('hasSeenCubeHints', 'true');
    });
    
    // Masquer les indicateurs si l'utilisateur utilise la navigation
    document.querySelectorAll('.nav-button').forEach(btn => {
      btn.addEventListener('click', () => {
        clickHint.classList.remove('visible');
        navHint.classList.remove('visible');
        localStorage.setItem('hasSeenCubeHints', 'true');
      });
    });
  }
}

// Gestion du clic sur le menu hamburger pour l'ouverture/fermeture du menu
app.menuBtn.addEventListener('click', () => {
  app.menuBtn.classList.toggle('open');
  app.menu.classList.toggle('active');
  app.menuOpen = !app.menuOpen;
});

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
// Fermer le dropdown quand on clique ailleurs
document.addEventListener('click', (e) => {
  if (!e.target.closest('.language-btn')) {
    document.querySelector('.language-btn').classList.remove('active');
  }
});
*/
