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

// Paramètres du cube
const cubeSize = 1;
const gap = 0;
const positions = [-1, 0, 1];

// Couleurs pour les stickers
const stickerColors = {
  front:  '#FF5900',
  back:   '#ff0000', 
  top:    '#ffffff',
  bottom: '#ffff00',
  right:  '#008000',
  left:   '#0000ff'  
};

// Ajoutez ces constantes au début du fichier
const CATEGORIES = {
  front: 'Compétences',
  back: 'Expériences',
  top: 'Contact',
  bottom: 'Passions',
  right: 'Formation',
  left: 'Projets'
};



// Modifier le format de FACE_PREVIEWS
const FACE_PREVIEWS = {
  front: {
    images: [
      ['assets/previews/javascript.png', 'assets/previews/python.jpg', 'assets/previews/java.png'],
      ['assets/previews/react.png', 'assets/previews/node.png', 'assets/previews/mysql.png'],
      ['assets/previews/html.png', 'assets/previews/css.png', 'assets/previews/php.png']
    ]
  },
  back: {
    images: [
      ['assets/previews/stage1.jpg', 'assets/previews/stage2.jpg', 'assets/previews/stage3.jpg'],
      ['assets/previews/exp1.jpg', 'assets/previews/exp2.jpg', 'assets/previews/exp3.jpg'],
      ['assets/previews/proj1.jpg', 'assets/previews/proj2.jpg', 'assets/previews/proj3.jpg']
    ]
  }
};


// Créez un élément pour afficher le titre
const titleElement = document.createElement('div');
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
resetButton.textContent = 'Retour';
resetButton.id = 'reset';
resetButton.style.cssText = `
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  display: none;
`;
resetButton.addEventListener('click', dezoom);
document.body.appendChild(resetButton);

// Fonction d'initialisation
function init() {
  // Création de la scène
  scene = new THREE.Scene();

  // Configuration de la caméra
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(5, 5, 7);
  camera.lookAt(0, 0, 0);

  // Configuration du rendu
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true  // Rend le fond transparent
  });
  renderer.setClearColor(0x000000, 0); // Fond transparent
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Contrôles
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.rotateSpeed = 0.5; // Ralentir la rotation
  controls.minDistance = 5;   // Distance minimale
  controls.maxDistance = 15;  // Distance maximale

  // Éclairage
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  // Ajouter des logs de débogage
  console.log("Scene créée:", scene);
  console.log("Camera position:", camera.position);
  
  createRubiksCube();
  console.log("Nombre de cubies:", cubies.length);
  console.log("Position du Rubik's Cube:", rubiksCube.position);

  // Supprimer les event listeners
  window.addEventListener('resize', onWindowResize);

  window.addEventListener('mousedown', (e) => {
    isDragging = false;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (Math.abs(e.clientX - mouseStartX) > 5 || Math.abs(e.clientY - mouseStartY) > 5) {
      isDragging = true;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDragging) {
      handleClick(e);
    }
    isDragging = false;
  });

  createOverlay(); // Ajouter à init()
}

// Fonctions de base
function createCubie(size) {
  const geometry = new RoundedBoxGeometry(size, size, size, 5, 0.1);
  const materials = [];
  const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
  
  for (let i = 0; i < 6; i++) {
    const faceName = faceNames[i];
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fond noir
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 256, 256);
    
    // Sticker de base
    ctx.fillStyle = stickerColors[faceName];
    const radius = 20;
    const margin = 24;
    const size = 208;
    ctx.beginPath();
    ctx.roundRect(margin, margin, size, size, radius);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.1,
      roughness: 0.8
    });
    materials.push(material);
  }

  const mesh = new THREE.Mesh(geometry, materials);
  originalMaterials.set(mesh.uuid, materials.map(m => m.clone()));
  
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.rubikPosition = mesh.position.clone(); 

  // Ajouter l'interactivité
  mesh.userData.hoverable = true;
  mesh.userData.clickable = true;

  return mesh;
}

function createRubiksCube() {
  rubiksCube = new THREE.Group();
  
  for (let x of positions) {
    for (let y of positions) {
      for (let z of positions) {
        const cubie = createCubie(cubeSize);
        cubie.position.set(
          x * (cubeSize + gap),
          y * (cubeSize + gap),
          z * (cubeSize + gap)
        );
        cubie.userData.gridPos = new THREE.Vector3(x, y, z);
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
  const distance = 5;
  
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

  // Calcul amélioré de la matrice de rotation
  const lookDirection = targetPosition.clone().sub(targetCameraPos).normalize();
  const rightVector = new THREE.Vector3().crossVectors(upVector, lookDirection).normalize();
  const adjustedUpVector = new THREE.Vector3().crossVectors(lookDirection, rightVector).normalize();

  const targetMatrix = new THREE.Matrix4().makeBasis(
    rightVector,
    adjustedUpVector,
    lookDirection.negate()
  );

  const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(targetMatrix);

  // Animation fluide
  controls.enabled = false;
  const duration = 1000;
  const startTime = Date.now();
  const startPos = camera.position.clone();
  const startQuaternion = camera.quaternion.clone();

  function updateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    camera.position.lerpVectors(startPos, targetCameraPos, easeProgress);
    camera.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, easeProgress);

    if (progress < 1) {
      requestAnimationFrame(updateCamera);
    }
  }

  updateCamera();

  // Afficher le bouton retour
  resetButton.style.display = 'block';

  // Mettre à jour tous les cubies de la face
  const faceCubies = getFaceCubies(faceType);
  faceCubies.forEach(cubie => {
    updateFaceTextures(cubie, faceType, true);
  });
}

// Nouvelle fonction de dézoom
function dezoom() {
  if (!isZoomed || !lastCameraPosition) return;

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
  const endPos = lastCameraPosition;

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
      isZoomed = false;
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
function showInfoCard(event, faceType, imageIndex) {
    if (!overlay) createOverlay();
    
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
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => {
        isModalOpen = false;
        controls.enabled = true; // Réactiver les contrôles
        card.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => card.remove(), 300);
        activeInfoCard = null;
    };

    const content = document.createElement('div');
    content.innerHTML = `
        <h2>${CATEGORIES[faceType]}</h2>
        <div class="card-content">
            <!-- Ajoutez ici le contenu spécifique à chaque carte -->
            <p>Contenu détaillé pour ${CATEGORIES[faceType]}</p>
        </div>
    `;

    card.appendChild(closeBtn);
    card.appendChild(content);
    document.body.appendChild(card);
    
    // Animation d'ouverture
    requestAnimationFrame(() => {
        card.classList.add('active');
    });

    activeInfoCard = card;
}

// Modifier handleClick
function handleClick(event) {
    if (isModalOpen) return; // Ignorer les clics quand le modal est ouvert
    
    if (isZoomed) {
        // Si on est en mode zoom, vérifier si on clique sur un cubie avec une image
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cubies);

        if (intersects.length > 0) {
            const cubie = intersects[0].object;
            const pos = cubie.userData.gridPos;
            const rowIndex = 2 - Math.floor((pos.y + 1));
            const colIndex = Math.floor((pos.x + 1));

            // Déterminer la face cliquée
            const normal = intersects[0].face.normal.clone();
            normal.transformDirection(cubie.matrixWorld);
            
            const epsilon = 0.1;
            let faceType;
            if (Math.abs(normal.z) > 1 - epsilon) faceType = normal.z > 0 ? 'front' : 'back';
            else if (Math.abs(normal.x) > 1 - epsilon) faceType = normal.x > 0 ? 'right' : 'left';
            else if (Math.abs(normal.y) > 1 - epsilon) faceType = normal.y > 0 ? 'top' : 'bottom';

            // Vérifier si ce cubie a une image
            if (FACE_PREVIEWS[faceType] && 
                FACE_PREVIEWS[faceType].images[rowIndex] && 
                FACE_PREVIEWS[faceType].images[rowIndex][colIndex]) {
                showInfoCard(event, faceType, rowIndex * 3 + colIndex);
            }
        }
        return;
    }

    // Le reste du code handleClick existant pour la gestion du zoom...
    if (isZoomed || controls.getDistance() !== controls.target.distanceTo(camera.position)) {
        return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubies);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        const normal = intersection.face.normal.clone();
        normal.transformDirection(intersection.object.matrixWorld);
        
        // Déterminer la face avec une meilleure précision
        let faceType;
        const epsilon = 0.1;
        if (Math.abs(normal.z) > 1 - epsilon) faceType = normal.z > 0 ? 'front' : 'back';
        else if (Math.abs(normal.x) > 1 - epsilon) faceType = normal.x > 0 ? 'right' : 'left';
        else if (Math.abs(normal.y) > 1 - epsilon) faceType = normal.y > 0 ? 'top' : 'bottom';

        // Obtenir le cubie central de la face
        const centralCubie = getCentralCubie(faceType);
        
        if (centralCubie) {
            titleElement.textContent = CATEGORIES[faceType];
            titleElement.style.opacity = '1';
            zoomToFace(centralCubie, normal, faceType);
            isZoomed = true;
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

// Modifier la fonction updateFaceTextures
function updateFaceTextures(cubie, faceType, showPreviews = false) {
  if (!cubie) return;
  
  const faceIndex = ['right', 'left', 'top', 'bottom', 'front', 'back'].indexOf(faceType);
  if (faceIndex === -1) return;

  if (showPreviews && FACE_PREVIEWS[faceType]) {
    const pos = cubie.userData.gridPos;
    // Inverser rowIndex pour commencer par le haut
    const rowIndex = 2 - Math.floor((pos.y + 1));
    const colIndex = Math.floor((pos.x + 1));
    
    console.log(`Tentative de chargement image pour cubie à position: x=${pos.x}, y=${pos.y}, z=${pos.z}`);
    console.log(`Indices calculés: row=${rowIndex}, col=${colIndex}`);
    
    // Vérifier si l'image existe pour cette position
    if (FACE_PREVIEWS[faceType].images[rowIndex] && 
        FACE_PREVIEWS[faceType].images[rowIndex][colIndex]) {
      
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, 256, 256);
      
      const img = new Image();
      
      img.onerror = () => {
        console.log(`Erreur de chargement pour l'image: ${FACE_PREVIEWS[faceType].images[rowIndex][colIndex]}`);
        // Garder le sticker original en cas d'erreur
        const originals = originalMaterials.get(cubie.uuid);
        if (originals) {
          cubie.material[faceIndex] = originals[faceIndex].clone();
        }
      };
      
      img.onload = () => {
        console.log(`Image chargée avec succès: ${img.src}`);
        ctx.drawImage(img, 24, 24, 208, 208);
        const texture = new THREE.CanvasTexture(canvas);
        cubie.material[faceIndex].map = texture;
        cubie.material[faceIndex].map.needsUpdate = true;
      };
      
      img.src = FACE_PREVIEWS[faceType].images[rowIndex][colIndex];
    } else {
      console.log(`Pas d'image trouvée pour position row=${rowIndex}, col=${colIndex}`);
      // Garder le sticker original si pas d'image
      const originals = originalMaterials.get(cubie.uuid);
      if (originals) {
        cubie.material[faceIndex] = originals[faceIndex].clone();
      }
    }
  } else {
    // Restaurer le matériau original
    const originals = originalMaterials.get(cubie.uuid);
    if (originals) {
      cubie.material[faceIndex] = originals[faceIndex].clone();
    }
  }
}

// Démarrage
init();
animate();