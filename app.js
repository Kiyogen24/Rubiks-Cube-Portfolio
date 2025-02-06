import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from './node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Variables globales de base
let scene, camera, renderer, controls;
let rubiksCube;
const cubies = [];
let resetButton;
let originalMaterials = new Map(); // Pour stocker les matériaux originaux
let activeInfoCard = null; // Ajouter au début du fichier avec les autres variables globales
let overlay = null; // Ajouter aux variables globales
let isModalOpen = false; // Ajouter aux variables globales en haut du fichier
let currentSection = 'intro';
let isScrolling = false;
let menuBtn, menu; // Ajouter aux variables globales

// Paramètres du cube
const cubeSize = 1;
const gap = 0.001;
const positions = [-1, 0, 1];

// Couleurs pour les stickers
const stickerColors = {
  front: '#B90000',  // Rouge 
  back: '#ff8000',   // Orange 
  top: '#FFFFFF',    // Blanc 
  bottom: '#ffff00', // Jaune  
  right: '#000FFF',  // Bleu 
  left: '#00994C'    // Vert
};

// Ajoutez ces constantes au début du fichier
const CATEGORIES = {
  front: 'Compétences',
  back: 'Expériences',
  top: 'À propos', 
  bottom: 'Mon CV', 
  right: 'Formation',
  left: 'Projets'
};



// Modifier le format de FACE_PREVIEWS
const FACE_PREVIEWS = {
  front: {
    images: [
      ['assets/previews/python.jpg', 'assets/previews/javascript.png', 'assets/previews/java.png'],
      ['assets/previews/c.png', 'assets/previews/data_b.png', 'assets/previews/html.svg'],
      ['assets/previews/office.png', '', 'assets/previews/soft.avif']
    ]
  },
  back: {
    images: [
      ['', 'assets/previews/siemens.jpg', 'assets/previews/prof.png'],
      ['assets/previews/exp1.jpg', 'assets/previews/exp2.jpg', 'assets/previews/exp3.jpg'],
      ['assets/previews/proj1.jpg', 'assets/previews/proj2.jpg', 'assets/previews/proj3.jpg']
    ]
  },
  bottom: {
    images: [
      ['', '', ''],
      ['', 'assets/previews/cv_pr.png', ''],
      ['', '', '']
    ]
  }
};

const CUBE_CONTENT = {
  front: { // Compétences
    0: {
      title: "Python",
      description: "Maîtrise du langage et des bibliothèques liées à la data science et à l'IA",
      details: ["NumPy", "Pandas", "TensorFlow", "Keras"],
      icon: "fa-brands fa-python"
    },
    1: {
      title: "JavaScript", 
      description: "Maîtrise en développement Web moderne et dynamique",
      details: ["Javascipt", "React", "Node.js"],
      icon: "fa-brands fa-js"
    },
    2: {
      title: "Java",
      description: "Développement par objets",
      icon: "fa-brands fa-java"
    },
    3: {
      title: "C",
      icon: "fa-regular fa-file-code"
    },
    4: {
      title: "Bases De Données",
      description: "Maîtrise de la gestion des bases de données",
      details: ["SQL", "MongoDB"],
      icon: "fa-solid fa-database"
    },
    5: {
      title: "Dévelopement Web",
      description: "Maîtrise du dévelopement Web classique",
      details: ["HTML", "CSS"],
      icon: "fa-brands fa-html5"
    },
    6: {
      title: "Pack Office",
      description: "Maîtrise du Pack Office",
      details: ["Word", "Excel", "PowerPoint"],
      icon: "fa-regular fa-file-word"
    },
    8: {
      title: "Soft Skills",
      description: "Les qualités qui me décrivent le mieux", 
      details: ["Curiosité", "Persévérance", "Résolution des problèmes", "Organisé", "Gestion de Projet"],
      icon: "fa-regular fa-lightbulb"
    }
    },
    back: { // Expériences
      0: {
        title: "Tutorat étudiant",
        period: "02/2024 - 06/2024",
        description: "Indépendant",
        details: ["Accompagnement individuel d'une élève pour améliorer sa compréhension et ses résultats en mathématiques et en physico-chimie.","Développement de compétences pédagogiques et de communication pour rendre les notions scientifiques accessibles."],
        icon: "fa-solid fa-chalkboard-user"
      },
    1: {
      title: "Stage ouvrier chez Siemens Mobility France",
      period: "07/2023",
      description: "Assistant logistique",
      details: ["Gestion du magasin.", "Réception physique des marchandises et inspection des colis.", "Préparation des commandes", "Bases en VBA et gestion de projets."],
      icon: "fa-solid fa-industry"
    },
  },
  bottom: {
    4: {
      title: "Mon CV",
      details: [],
      icon: "fa-regular fa-file-pdf",
      file: true,
    },
  }
};

const CUBIE_CONTENT = {
  front: {
    0: {
      preview: 'assets/previews/python.jpg',
      icon: 'fa-brands fa-python',
      hasContent: true
    },
    1: {
      preview: 'assets/previews/javascript.png', 
      icon: 'fa-brands fa-js',
      hasContent: true
    },
    2: {
      preview: 'assets/previews/java.png',
      icon: 'fa-brands fa-java',
      hasContent: true
    },
    3: {
      preview: 'assets/previews/c.png',
      icon: 'fa-regular fa-file-code',
      hasContent: false
    },
    4: {
      preview: 'assets/previews/data_b.png',
      icon: 'fa-solid fa-database',
      hasContent: true
    },
    5: {
      preview: 'assets/previews/html.svg',
      icon: 'fa-brands fa-html5',
      hasContent: true
    },
    6: {
      preview: 'assets/previews/office.png',
      icon: 'fa-regular fa-file-word',
      hasContent: true
    },
    8: {
      preview: 'assets/previews/soft.avif',
      icon: 'fa-regular fa-lightbulb',
      hasContent: true
    }
  },
  back: {
    0: {
      preview: 'assets/previews/prof.png',
      icon: 'fa-solid fa-chalkboard-user',
      hasContent: true
    },
    1: {
      preview: 'assets/previews/siemens.jpg',
      icon: 'fa-solid fa-industry', 
      hasContent: true
    }
  },
  bottom: {
    4: {
      preview: 'assets/previews/cv_pr.png',
      icon: 'fa-regular fa-file-pdf',
      hasContent: true
    }
  }
};

// Créez un élément pour afficher le titre
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

// Ajouter les variables d'état
let isZoomed = false;
let isDragging = false;
let mouseStartX = 0;
let mouseStartY = 0;
let lastCameraPosition = null;
let lastCameraRotation = null;


// Créer le bouton avant init()
resetButton = document.createElement('button');
resetButton.id = 'reset';
resetButton.setAttribute('aria-label', 'Retour');
resetButton.addEventListener('click', dezoom);
document.body.appendChild(resetButton);

const themeBtn = document.querySelector('.theme-btn');
const themeIcon = document.querySelector('.theme-icon');
const currentTheme = localStorage.getItem('theme');

themeBtn.addEventListener('click', function() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  
  // Changer l'icône
  const themeIcon = document.querySelector('.theme-icon');
  themeIcon.classList.remove(isDark ? 'fa-moon' : 'fa-sun');
  themeIcon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
});

// Fonction d'initialisation
function init() {
  // Création de la scène
  scene = new THREE.Scene();

  // Configuration de la caméra
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(5, 5, 7);
  camera.lookAt(0, 0, 0);

  // Configuration du rendu avec meilleure qualité
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    precision: 'highp',
    powerPreference: "high-performance"
  });
  
  // Augmenter la résolution du rendu
  const pixelRatio = window.devicePixelRatio;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Déplacer le renderer dans la section cube
  const cubeSection = document.getElementById('cube-section');
  cubeSection.appendChild(renderer.domElement);
  renderer.domElement.style.position = 'absolute';

  // Contrôles
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.rotateSpeed = 0.5; // Ralentir la rotation
  controls.minDistance = 5;   // Distance minimale
  controls.maxDistance = 15;  // Distance maximale

  // Éclairage
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-10, -10, -10);
  scene.add(fillLight);

  // Ajouter des logs de débogage
  console.log("Scene créée:", scene);
  console.log("Camera position:", camera.position);
  
  createRubiksCube();
  console.log("Nombre de cubies:", cubies.length);
  console.log("Position du Rubik's Cube:", rubiksCube.position);

  // Supprimer les event listeners
  window.addEventListener('resize', onWindowResize);

  window.addEventListener('mousedown', (e) => {
    const cubeSection = document.getElementById('cube-section');
    const rect = cubeSection.getBoundingClientRect();
    const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;

    if (!isCubeVisible) return;

    isDragging = false;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
  });

    window.addEventListener('mousemove', (e) => {
        const cubeSection = document.getElementById('cube-section');
        const rect = cubeSection.getBoundingClientRect();
        const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;

        if (!isCubeVisible) return;

        if (Math.abs(e.clientX - mouseStartX) > 5 || Math.abs(e.clientY - mouseStartY) > 5) {
            isDragging = true;
        }
    });

    window.addEventListener('mouseup', (e) => {
        const cubeSection = document.getElementById('cube-section');
        const rect = cubeSection.getBoundingClientRect();
        const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;

        if (!isCubeVisible) return;

        if (!isDragging) {
            handleClick(e);
        }
        isDragging = false;
    });

  createOverlay(); // Ajouter à init()
  setupNavigation();
}

// Fonctions de base
function createCubie(size, gridPosition) {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const materials = [];
  const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
  
  for (let i = 0; i < 6; i++) {
    const faceName = faceNames[i];
    const material = createStickerMaterial(faceName, gridPosition);
    materials.push(material);
  }

  const mesh = new THREE.Mesh(geometry, materials);
  originalMaterials.set(mesh.uuid, materials.map(m => m.clone()));
  
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.rubikPosition = mesh.position.clone();
  mesh.userData.hoverable = true;
  mesh.userData.clickable = true;

  return mesh;
}

function createStickerMaterial(faceName, gridPosition) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Fond noir avec dégradé
  const gradient1 = ctx.createRadialGradient(
    256, 256, 0,
    256, 256, 256
  );
  gradient1.addColorStop(0, '#222');
  gradient1.addColorStop(1, '#000');
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, 512, 512);

  // Sticker avec dégradé subtil
  const margin = 32;
  const stickerSize = 448;
  const radius = 35;
  
  const gradient = ctx.createLinearGradient(margin, margin, stickerSize + margin, stickerSize + margin);
  gradient.addColorStop(0, stickerColors[faceName]); 
  gradient.addColorStop(1, shadeColor(stickerColors[faceName], -10));
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
  ctx.fill();



  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0.1,
    roughness: 0.8
  });
}


// Fonction utilitaire pour assombrir une couleur
function shadeColor(color, percent) {
  const num = parseInt(color.replace('#',''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

function createRubiksCube() {
  rubiksCube = new THREE.Group();
  
  for (let x of positions) {
    for (let y of positions) {
      for (let z of positions) {
        const gridPosition = new THREE.Vector3(x, y, z);
        const cubie = createCubie(cubeSize, gridPosition);
        cubie.position.set(
          x * (cubeSize + gap),
          y * (cubeSize + gap),
          z * (cubeSize + gap)
        );
        cubie.userData.gridPos = gridPosition;
        rubiksCube.add(cubie);
        cubies.push(cubie);
        
        // Log pour chaque cubie
        console.log(`Cubie créé à la position: x=${x}, y=${y}, z=${z}`);
      }
    }
  }
  
  scene.add(rubiksCube);
  console.log("Rubik's Cube ajouté à la scène");
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Ajouter cette fonction pour obtenir tous les cubies d'une face
function getFaceCubies(faceType) {
  let cubiesOnFace = [];
  switch(faceType) {
    case 'front':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.z - 1) < 0.1);
      break;
    case 'back':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.z + 1) < 0.1);
      break;
    case 'right':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.x - 1) < 0.1);
      break;
    case 'left':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.x + 1) < 0.1);
      break;
    case 'top':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.y - 1) < 0.1);
      break;
    case 'bottom':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.y + 1) < 0.1);
      break;
  }
  return cubiesOnFace;
}

// Modifier la fonction zoomToFace
function zoomToFace(face, normal, faceType) {
  lastCameraPosition = camera.position.clone();
  lastCameraRotation = camera.quaternion.clone();
  
  const targetPosition = face.position.clone();
  const distance = 6;
  
  // Calculer l'orientation finale avec des vecteurs normalisés
  let cameraOffset;
  let upVector = new THREE.Vector3(0, 1, 0);
  
  switch(faceType) {
    case 'front':  
      cameraOffset = new THREE.Vector3(0, 0, distance);
      break;
    case 'back':   
      cameraOffset = new THREE.Vector3(0, 0, -distance);
      break;
    case 'right':  
      cameraOffset = new THREE.Vector3(distance, 0, 0);
      break;
    case 'left':   
      cameraOffset = new THREE.Vector3(-distance, 0, 0);
      break;
    case 'top':    
      cameraOffset = new THREE.Vector3(0, distance, 0);
      upVector = new THREE.Vector3(0, 0, -1);
      break;
    case 'bottom': 
      cameraOffset = new THREE.Vector3(0, -distance, 0);
      upVector = new THREE.Vector3(0, 0, 1);
      break;
  }

  const targetCameraPos = targetPosition.clone().add(cameraOffset);


  // Animation fluide
  controls.enabled = false;
  const duration = 1000;
  const startTime = Date.now();
  const startPos = camera.position.clone();
  const lookDirection = targetPosition.clone().sub(targetCameraPos).normalize();
  const rightVector = new THREE.Vector3().crossVectors(upVector, lookDirection).normalize();
  const adjustedUpVector = new THREE.Vector3().crossVectors(lookDirection, rightVector).normalize();

  const targetMatrix = new THREE.Matrix4().makeBasis(
    rightVector,
    adjustedUpVector,
    lookDirection.negate()
  );
  const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(targetMatrix);
  const startQuaternion = camera.quaternion.clone();


  function updateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    camera.position.lerpVectors(startPos, targetCameraPos, easeProgress);
    camera.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, easeProgress);

    if (progress < 1) {
      requestAnimationFrame(updateCamera);
    } else {
      // Animation terminée, mettre à jour les textures
      isZoomed = true;
      const faceCubies = getFaceCubies(faceType);
      faceCubies.forEach(cubie => {
        updateFaceTextures(cubie, faceType, true);
      });
      resetButton.style.display = 'block';
    }
  }

  updateCamera();

  // Afficher le bouton retour
  resetButton.style.display = 'block';
}

// Nouvelle fonction de dézoom
function dezoom() {
    if (!isZoomed || !lastCameraPosition) return;

    isZoomed = false;

    // Réinitialiser tous les cubies
    cubies.forEach(cubie => {
      // Réinitialiser l'échelle
      cubie.scale.set(1, 1, 1);
      
      // Réinitialiser les matériaux
      ['right', 'left', 'top', 'bottom', 'front', 'back'].forEach(faceType => {
          updateFaceTextures(cubie, faceType, false);
      });
  });

  // Réinitialiser les variables de hover
  if (hoveredCubie) {
      updateCubieHoverState(hoveredCubie, false);
      hoveredCubie = null;
  }
  hidePreview();

    // Réactiver le scroll
    const body = document.querySelector('.container');
    body.style.overflow = 'auto';

    menuBtn.classList.remove('open');
    menu.classList.remove('active');
    menuOpen = false;

    resetButton.style.display = 'none';
    

    // Cacher le menu et réinitialiser son état
    menuBtn.classList.remove('open');
    menu.classList.remove('active');
    menuOpen = false;

    // Cacher le bouton retour
    resetButton.style.display = 'none';
    
    // Supprimer les éléments de la face
    const container = document.getElementById('face-content');
    if (container) {
      container.remove();
    }

    const duration = 1000;
    const startTime = Date.now();
    const startPos = camera.position.clone();
    let endPos = lastCameraPosition.clone();

    // Vérifier si la caméra est trop proche
    const minDistance = 7;
    const distanceFromCenter = endPos.length();
    
    if (distanceFromCenter < minDistance) {
      // Calculer la direction normalisée depuis l'origine
      const direction = endPos.clone().normalize();
      // Appliquer la distance minimale dans cette direction
      endPos = direction.multiplyScalar(minDistance);
    }

    function updateCamera() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPos, endPos, easeProgress);
      camera.lookAt(0, 0, 0);

      if (progress < 1) {
        requestAnimationFrame(updateCamera);
      } else {
        controls.enabled = true;
        titleElement.style.opacity = '0';
      }
    }
    updateCamera();

    cubies.forEach(cubie => {
      ['right', 'left', 'top', 'bottom', 'front', 'back'].forEach(faceType => {
        updateFaceTextures(cubie, faceType, false);
      });
    });
}

// Ajouter les autres éléments DOM
function createOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && activeInfoCard) {
      activeInfoCard.querySelector('.close-button').click();
    }
  });
  document.body.appendChild(overlay);
}

// Ajoutez la gestion du raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getCentralCubie(faceType) {
  // Position du cubie central selon la face
  let position;
  switch(faceType) {
    case 'front':  position = new THREE.Vector3(0, 0, 1); break;
    case 'back':   position = new THREE.Vector3(0, 0, -1); break;
    case 'right':  position = new THREE.Vector3(1, 0, 0); break;
    case 'left':   position = new THREE.Vector3(-1, 0, 0); break;
    case 'top':    position = new THREE.Vector3(0, 1, 0); break;
    case 'bottom': position = new THREE.Vector3(0, -1, 0); break;
  }

  // Trouver le cubie correspondant
  return cubies.find(cubie => 
    cubie.userData.gridPos.equals(position)
  );
}

// Fonction pour créer et afficher la carte d'information
function showInfoCard(event, faceType, cubePosition) {
    if (!overlay) createOverlay();

    // Nettoyer les effets hover avant d'ouvrir la carte
    if (hoveredCubie) {
      hoveredCubie.scale.set(1, 1, 1);
      updateFaceTextures(hoveredCubie, hoveredCubie.userData.hoveredFace, true);
      hoveredCubie.userData.hoveredFace = null;
      hoveredCubie = null;
    }
    hidePreview();
  
    
    isModalOpen = true;
    controls.enabled = false; // Désactiver les contrôles du cube
    overlay.classList.add('active');

    // Activer l'overlay
    overlay.classList.add('active');

    // Fermer la carte précédente si elle existe
    if (activeInfoCard) {
        activeInfoCard.remove();
    }

    const card = document.createElement('div');
    card.className = 'info-card';
    card.setAttribute('data-face', faceType);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onclick = () => {
        isModalOpen = false;
        controls.enabled = true;
        card.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => card.remove(), 300);
        activeInfoCard = null;
    };

    const content = document.createElement('div');
    const contentData = CUBE_CONTENT[faceType]?.[cubePosition];


    if (contentData) {
      content.innerHTML = contentData.file 
        ? `<div class="pdf-view">
         <object 
           data="assets/previews/cv.pdf" 
           type="application/pdf" 
           width="100%" 
           height="90%">
           <p>Impossible d'afficher le PDF. <a href="assets/previews/cv.pdf" target="_blank">Cliquez ici pour le télécharger</a></p>
         </object>
         <a href="assets/previews/cv.pdf" class="pdf-download-link" download>
           <i class="fas fa-download"></i> Télécharger le CV
         </a>
       </div>`
        : `<div class="card-header">
        <i class="${contentData.icon} card-icon"></i>
        <h2>${contentData.title}</h2>
          </div>
          <div class="card-content">
        ${contentData.description ? `<p class="card-content">${contentData.description}</p>` : ''}
        ${contentData.details && contentData.details.length > 0 
          ? `<ul class="details-list">
          ${contentData.details.map(detail => `<li>${detail}</li>`).join('')}
        </ul>`
          : ''
        }
          </div>`;
    } else {
      content.innerHTML = `
          <h2>${CATEGORIES[faceType]}</h2>
          <p>Bientôt...</p>
      `;
  }

    card.appendChild(closeBtn);
    card.appendChild(content);
    document.body.appendChild(card);
    
    // Animation d'ouverture
    requestAnimationFrame(() => {
        card.classList.add('active');
    });

    activeInfoCard = card;
}


let hoveredCubie = null;

function onMouseMove(event) {
  if (!isZoomed || isModalOpen) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubies);

  const newHoveredCubie = intersects.length > 0 ? intersects[0].object : null;

  if (hoveredCubie !== newHoveredCubie) {
    if (hoveredCubie) {
      updateCubieHoverState(hoveredCubie, false);
    }
    hoveredCubie = newHoveredCubie;
    if (hoveredCubie) {
      updateCubieHoverState(hoveredCubie, true);
    }
  }
}




let previewElement = null;

function displayPreview(imageSrc, event) {
  if (!previewElement) {
    previewElement = document.createElement('div');
    previewElement.className = 'preview-popup';
    document.body.appendChild(previewElement);
  }

  const rect = document.querySelector('#cube-section').getBoundingClientRect();
  previewElement.style.display = 'block';
  
  // Calculer la position centrée
  const cubieCenterX = event.clientX;
  const cubieCenterY = event.clientY;
  
  setTimeout(() => {
    previewElement.classList.add('visible');
    previewElement.style.left = `${cubieCenterX}px`;
    previewElement.style.top = `${cubieCenterY}px`;
    previewElement.style.backgroundImage = `url(${imageSrc})`;
  }, 0);
}

function hidePreview() {
  if (previewElement) {
      previewElement.classList.remove('visible');

  }
}

// Add event listener
window.addEventListener('mousemove', onMouseMove);




// Modifier handleClick
function handleClick(event) {
    // Vérifier si nous sommes dans la section cube
    const cubeSection = document.getElementById('cube-section');
    const rect = cubeSection.getBoundingClientRect();
    const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;
    
    if (!isCubeVisible || isModalOpen) return; 
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubies);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        const normal = intersection.face.normal.clone();
        normal.transformDirection(intersection.object.matrixWorld);
        
        let faceType;
        const epsilon = 0.1;
        if (Math.abs(normal.z) > 1 - epsilon) faceType = normal.z > 0 ? 'front' : 'back';
        else if (Math.abs(normal.x) > 1 - epsilon) faceType = normal.x > 0 ? 'right' : 'left';
        else if (Math.abs(normal.y) > 1 - epsilon) faceType = normal.y > 0 ? 'top' : 'bottom';

        const centralCubie = getCentralCubie(faceType);
        
        if (centralCubie) {
          if (isZoomed) {
            const clickedCubie = intersection.object;
            const pos = clickedCubie.userData.gridPos;
            
            // Calcul différent selon la face
            let position;
            switch(faceType) {
                case 'right':
                    // Inverser la colonne pour back
                    const rowR = 2 - Math.floor(pos.y + 1); // 0,1,2 de haut en bas
                    const colR = 2 - Math.floor(pos.z + 1); // Inverser l'ordre des colonnes
                    position = rowR * 3 + colR;
                    console.log('Position calculée (back):', {
                        x: pos.y,
                        z: pos.x,
                        position: position
              });
                    break;
                case 'left':
                    // Pour right/left: y determine la ligne (haut en bas), z determine la colonne (gauche à droite)
                    const row = 2 - Math.floor(pos.y + 1);  // 0,1,2 de haut en bas
                    const col = Math.floor(pos.z + 1);      // 0,1,2 de gauche à droite
                    position = row * 3 + col;
                    console.log('Position calculée (right/left):', {
                      x: pos.y,
                      z: pos.x,
                      position: position
                  });
                    break;
                
                case 'back':
                      // Inverser la colonne pour back
                      const rowB = 2 - Math.floor(pos.y + 1); // 0,1,2 de haut en bas
                      const colB = 2 - Math.floor(pos.x + 1); // Inverser l'ordre des colonnes
                      position = rowB * 3 + colB;
                      console.log('Position calculée (back):', {
                          x: pos.y,
                          z: pos.x,
                          position: position
                });
                      break;
                case 'front':
                    // Pour front/back: y determine la ligne (haut en bas), x determine la colonne (gauche à droite)
                    const rowFB = 2 - Math.floor(pos.y + 1); // 0,1,2 de haut en bas
                    const colFB = Math.floor(pos.x + 1);     // 0,1,2 de gauche à droite
                    position = rowFB * 3 + colFB;
                    console.log('Position calculée (front/back):', {
                      x: pos.y,
                      z: pos.x,
                      position: position
                  });
                    break;
                    
                case 'top':
                case 'bottom':
                    // Pour top/bottom: z determine la ligne (haut en bas), x determine la colonne (gauche à droite)
                    const rowTB = 2 - Math.floor(pos.z + 1); // 0,1,2 de haut en bas
                    const colTB = Math.floor(pos.x + 1);     // 0,1,2 de gauche à droite
                    position = rowTB * 3 + colTB;
                    console.log('Position calculée (top/bottom):', {
                      x: pos.z,
                      z: pos.x,
                      position: position
                  });
                    break;
            }
            
            showInfoCard(event, faceType, position);
          } else {
              // Sinon, on zoome sur la face
              const container = document.querySelector('.container');
              container.style.overflow = 'hidden';
              
              zoomToFace(centralCubie, normal, faceType);
              isZoomed = true;

              if (!menuOpen) {
                  menuBtn.classList.add('open');
                  menu.classList.add('active');
                  menuOpen = true;
              }

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

// Boucle d'animation simplifiée
function animate() {
  requestAnimationFrame(animate);
  
  if (controls) {
    controls.update();
  }
  
  if (scene && camera && renderer) {
    renderer.render(scene, camera);
  } else {
    console.error("Éléments manquants pour le rendu:", {
      scene: !!scene,
      camera: !!camera,
      renderer: !!renderer
    });
  }
}

function updateFaceTextures(cubie, faceType, isActive) {
  const faceIndex = ['right', 'left', 'top', 'bottom', 'front', 'back'].indexOf(faceType);
  if (faceIndex === -1) return;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  const margin = 32;
  const stickerSize = 448;
  const radius = 35;
  const baseColor = stickerColors[faceType];

  // Fond de base
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
  ctx.fill();

  // Bande lumineuse pour les cubies avec contenu en mode zoom
  const position = calculateCubiePosition(cubie.userData.gridPos, faceType);
  const content = CUBIE_CONTENT[faceType]?.[position];
  
  if (isZoomed && content?.preview) {
    // Ajouter une bande lumineuse diagonale statique
    const gradient = ctx.createLinearGradient(
      margin, margin,
      stickerSize + margin, stickerSize + margin
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.save();
    ctx.clip();
    ctx.fillStyle = gradient;
    ctx.fillRect(margin, margin, stickerSize, stickerSize);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  cubie.material[faceIndex].map = texture;
  cubie.material[faceIndex].needsUpdate = true;
}

function updateCubieHoverState(cubie, isHovered) {
  if (!isZoomed) return;

  const intersects = raycaster.intersectObject(cubie);
  
  if (intersects.length > 0 && isHovered) {
    const normal = intersects[0].face.normal.clone();
    normal.transformDirection(cubie.matrixWorld);
    
    let faceType;
    const epsilon = 0.1;
    if (Math.abs(normal.z) > 1 - epsilon) faceType = normal.z > 0 ? 'front' : 'back';
    else if (Math.abs(normal.x) > 1 - epsilon) faceType = normal.x > 0 ? 'right' : 'left';
    else if (Math.abs(normal.y) > 1 - epsilon) faceType = normal.y > 0 ? 'top' : 'bottom';
    
    const position = calculateCubiePosition(cubie.userData.gridPos, faceType);
    const content = CUBIE_CONTENT[faceType]?.[position];

    if (content?.preview) {
      cubie.userData.hoveredFace = faceType;
      cubie.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
      applyHoverEffects(cubie, faceType, content);
      if (content?.hasContent) {
      renderer.domElement.style.cursor = 'pointer';
      }
    }
  } else {
    if (cubie.userData.hoveredFace) {
      cubie.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      updateFaceTextures(cubie, cubie.userData.hoveredFace, true);
      cubie.userData.hoveredFace = null;
      renderer.domElement.style.cursor = 'default';
    }
    hidePreview();
  }
}




function applyHoverEffects(cubie, faceType, content) {
  const faceIndex = ['right', 'left', 'top', 'bottom', 'front', 'back'].indexOf(faceType);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  const margin = 32;
  const stickerSize = 448;
  const radius = 35;
  const baseColor = stickerColors[faceType];

  // Fond avec effet Minecraft
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
  ctx.fill();

  // Affichage de la preview
  if (content.preview) {
    
    // Application de la texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    cubie.material[faceIndex].map = texture;
    cubie.material[faceIndex].needsUpdate = true;
    
    const vector = new THREE.Vector3();
    cubie.getWorldPosition(vector);
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    displayPreview(content.preview, {
      clientX: x - 100,
      clientY: y - 100
    });
  }

  if (content.hasContent) {
  // Ajout du "+"
  const plusSize = 100;
  const padding = 60;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(stickerSize - padding, stickerSize - padding, plusSize/2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = baseColor;
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', stickerSize - padding, stickerSize - padding);

  }

}


// Nouvelle fonction pour calculer la position selon la face
function calculateCubiePosition(pos, faceType) {
  switch(faceType) {
    case 'right':
      return (2 - Math.floor(pos.y + 1)) * 3 + (2 - Math.floor(pos.z + 1));
    case 'left':
      return (2 - Math.floor(pos.y + 1)) * 3 + Math.floor(pos.z + 1);
    case 'back':
      return (2 - Math.floor(pos.y + 1)) * 3 + (2 - Math.floor(pos.x + 1));
    case 'front':
      return (2 - Math.floor(pos.y + 1)) * 3 + Math.floor(pos.x + 1);
    case 'top':
    case 'bottom':
      return (2 - Math.floor(pos.z + 1)) * 3 + Math.floor(pos.x + 1);
    default:
      return -1;
  }
}

// Modifier la fonction setupNavigation
function setupNavigation() {
  const container = document.querySelector('.container');
  const sections = Array.from(document.querySelectorAll('section'));
  const buttons = document.querySelectorAll('.nav-button');
  menuBtn = document.querySelector('.menu-btn');
  menu = document.querySelector('.menu');
  
  function updateUI() {
      const currentScroll = container.scrollTop;
      const windowHeight = window.innerHeight;
      const currentIndex = Math.round(currentScroll / windowHeight);
      
      // Gérer la visibilité de l'indicateur de scroll
      const scrollIndicator = document.querySelector('.scroll-indicator');
      if (scrollIndicator) {
          scrollIndicator.classList.toggle('hidden', currentIndex !== 0);
      }

      buttons.forEach((button, index) => {
          button.classList.toggle('active', index === currentIndex);
      });
      
      // Gérer la visibilité du menu et du bouton thème
      const isCubeSection = currentIndex === 1;
      menuBtn.style.display = isCubeSection ? 'flex' : 'none';
      themeBtn.classList.toggle('hidden', isCubeSection);
      
      if (!isCubeSection && menu.classList.contains('active')) {
          menu.classList.remove('active');
          menuBtn.classList.remove('open');
      }
  }

    // Gérer le clic sur les boutons
    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            sections[index].scrollIntoView({ behavior: 'smooth' });
        });
    });


    document.querySelectorAll('.quick-link[data-face]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const faceType = link.getAttribute('data-face');
        
        // Scroll vers la section cube
        document.getElementById('cube-section').scrollIntoView({ behavior: 'smooth' });
        
        // Attendre la fin du scroll avant de zoomer
        setTimeout(() => {
          const centralCubie = getCentralCubie(faceType);
          if (centralCubie) {
            let normal = new THREE.Vector3();
            switch(faceType) {
              case 'front': normal.set(0, 0, 1); break;
              case 'back': normal.set(0, 0, -1); break;
              case 'right': normal.set(1, 0, 0); break;
              case 'left': normal.set(-1, 0, 0); break;
              case 'top': normal.set(0, 1, 0); break;
              case 'bottom': normal.set(0, -1, 0); break;
            }

            // Ouvrir le menu et activer l'élément correspondant
            if (!menuOpen) {
              menuBtn.classList.add('open');
              menu.classList.add('active');
              menuOpen = true;
            }

            // Activer l'élément du menu correspondant
            document.querySelectorAll('.menu-item').forEach(item => {
              item.classList.remove('active');
              if (item.querySelector('h3').textContent === CATEGORIES[faceType]) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            });
            
            zoomToFace(centralCubie, normal, faceType);
            isZoomed = true;
          }
        }, 1000); // Délai pour laisser le scroll se terminer
      });
    });

    // Écouter le scroll
    container.addEventListener('scroll', () => {
        updateUI();
    }, { passive: true });

    // État initial
    updateUI();
}

// Démarrage
init();
animate();

// Menu hamburger
menuBtn = document.querySelector('.menu-btn');
menu = document.querySelector('.menu');
let menuOpen = false;


// Après l'initialisation du menu
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
      const category = item.querySelector('h3').textContent;
      // Trouver le type de face correspondant à la catégorie
      const faceType = Object.keys(CATEGORIES).find(key => CATEGORIES[key] === category);
      
      if (faceType) {
          const centralCubie = getCentralCubie(faceType);
          if (centralCubie) {
              // Créer un vecteur normal pour la face
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
              isZoomed = true;

              // Activer l'élément du menu
              document.querySelectorAll('.menu-item').forEach(menuItem => {
                  menuItem.classList.remove('active');
              });
              item.classList.add('active');
          }
      }
  });
});

// Modification de l'événement du menu hamburger
menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('open');
  menu.classList.toggle('active');
  menuOpen = !menuOpen;
});