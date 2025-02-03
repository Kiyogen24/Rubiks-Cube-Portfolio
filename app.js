import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from './node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Variables globales de base
let scene, camera, renderer, controls;
let rubiksCube;
const cubies = [];

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

  // Modifier le bouton reset
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Retour';
  resetButton.id = 'reset';
  resetButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: auto;
  `;
  resetButton.addEventListener('click', dezoom);
  document.body.appendChild(resetButton);
}

// Fonctions de base
function createCubie(size) {
  const geometry = new RoundedBoxGeometry(size, size, size, 5, 0.1);
  const materials = [];
  const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
  for (let i = 0; i < 6; i++) {
    // Création d'un canvas pour la texture du sticker
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fond noir
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 256, 256);
    
    // Sticker arrondi
    ctx.fillStyle = stickerColors[faceNames[i]];
    const radius = 20; // Rayon des coins arrondis
    const margin = 24;
    const size = 208;
    ctx.beginPath();
    ctx.moveTo(margin + radius, margin);
    ctx.lineTo(margin + size - radius, margin);
    ctx.arcTo(margin + size, margin, margin + size, margin + radius, radius);
    ctx.lineTo(margin + size, margin + size - radius);
    ctx.arcTo(margin + size, margin + size, margin + size - radius, margin + size, radius);
    ctx.lineTo(margin + radius, margin + size);
    ctx.arcTo(margin, margin + size, margin, margin + size - radius, radius);
    ctx.lineTo(margin, margin + radius);
    ctx.arcTo(margin, margin, margin + radius, margin, radius);
    ctx.closePath();
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.5,  // Réduit l'aspect métallique
      roughness: 0.6,  // Augmente la matité
      envMapIntensity: 0.5
    });
    material.needsUpdate = true;
    materials.push(material);
  }
  const mesh = new THREE.Mesh(geometry, materials);
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
}

// Nouvelle fonction de dézoom
function dezoom() {
  if (!isZoomed || !lastCameraPosition) return;

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

// Modifier handleClick
function handleClick(event) {
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

// Démarrage
init();
animate();