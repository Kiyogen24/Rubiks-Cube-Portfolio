import * as THREE from 'three';
import { CUBE_CONTENT, stickerColors } from '../utils/constants.js';
import { app } from '../globals.js';

const textureCache = new Map();

// Crée un cubie (petit cube) avec ses stickers
export function createCubie(size, gridPosition) {
  // Géométrie du cubie
  const geometry = new THREE.BoxGeometry(size, size, size);
  const materials = [];
  // Noms des faces dans l'ordre: droite, gauche, haut, bas, avant, arrière
  const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
  
  // Création du matériau pour chaque face du cube
  for (let i = 0; i < 6; i++) {
    const faceName = faceNames[i];
    const material = createStickerMaterial(faceName, gridPosition);
    materials.push(material);
  }
  
  const mesh = new THREE.Mesh(geometry, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  // Sauvegarde de la position initiale du cubie
  mesh.rubikPosition = mesh.position.clone();
  mesh.userData.hoverable = true;
  mesh.userData.clickable = true;
  
  return mesh;
}

// Crée le matériau du sticker pour une face donnée
export function createStickerMaterial(faceName, gridPosition) {
  // Création d'un canevas pour dessiner le sticker
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Fond noir avec un dégradé radial pour l'arrière-plan
  const gradient1 = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient1.addColorStop(0, '#222');
  gradient1.addColorStop(1, '#000');
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, 512, 512);

  // Paramètres pour le sticker
  const margin = 32;
  const stickerSize = 448;
  const radius = 35;

  // Création d'un dégradé linéaire pour le sticker
  const gradient = ctx.createLinearGradient(margin, margin, stickerSize + margin, stickerSize + margin);
  gradient.addColorStop(0, stickerColors[faceName]);
  gradient.addColorStop(1, shadeColor(stickerColors[faceName], -10));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  // Dessine un rectangle arrondi
  ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
  ctx.fill();

  // Cas particulier : pour la face "top" du cubie central (position spécifique)
  if (faceName === 'top' && gridPosition && gridPosition.x === 0 && gridPosition.y === 1 && gridPosition.z === 0) {
    const material = new THREE.MeshStandardMaterial({
      metalness: 0.1,
      roughness: 0.8
    });
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
      ctx.clip();
      // Dessine l'image sur le sticker
      ctx.drawImage(img, margin, margin, stickerSize, stickerSize);
      ctx.restore();
      // Met à jour la texture une fois l'image chargée
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = app.renderer.capabilities.getMaxAnisotropy();
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      material.map = texture;
      material.needsUpdate = true;
    };
    img.src = 'assets/pp.png';
    return material;
  }

  // Création de la texture pour les autres cas
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = app.renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0.1,
    roughness: 0.8
  });
}

// Assombrit une couleur donnée en pourcentage
export function shadeColor(color, percent) {
  const num = parseInt(color.replace('#',''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// Crée l'ensemble du Rubik's Cube
export function createRubiksCube() {
  app.rubiksCube = new THREE.Group();
  // Parcourt les positions en x, y, z définies dans l'application
  for (let x of app.positions) {
    for (let y of app.positions) {
      for (let z of app.positions) {
        const gridPosition = new THREE.Vector3(x, y, z);
        const cubie = createCubie(app.cubeSize, gridPosition);
        // Positionne le cubie dans l'espace 3D
        cubie.position.set(
          x * (app.cubeSize + app.gap),
          y * (app.cubeSize + app.gap),
          z * (app.cubeSize + app.gap)
        );
        cubie.userData.gridPos = gridPosition;
        app.rubiksCube.add(cubie);
        app.cubies.push(cubie);
        // Log de création pour le cubie
        console.log(`Cubie créé à la position: x=${x}, y=${y}, z=${z}`);
      }
    }
  }
  
  app.scene.add(app.rubiksCube);
  console.log("Rubik's Cube ajouté à la scène");
}

// Crée la texture pour une face avec éventuelle animation lumineuse
export function createFaceTexture(faceType, hasContent = false) {
  const cacheKey = `${faceType}-${hasContent}`;
  
  // Utilisation d'un cache si la texture a été déjà créée
  if (textureCache.has(cacheKey)) {
  return textureCache.get(cacheKey);
  }

  // Création du canevas pour la texture
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Fond noir avec dégradé radial
  const gradient1 = ctx.createRadialGradient(
  256, 256, 0,
  256, 256, 256
  );
  gradient1.addColorStop(0, '#222');
  gradient1.addColorStop(1, '#000');
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, 512, 512);

  // Dessin du sticker avec un dégradé subtil
  const margin = 32;
  const stickerSize = 448;
  const radius = 35;
  
  const gradient = ctx.createLinearGradient(margin, margin, stickerSize + margin, stickerSize + margin);
  gradient.addColorStop(0, stickerColors[faceType]);
  gradient.addColorStop(1, shadeColor(stickerColors[faceType], -10));
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
  ctx.fill();

  // Ajoute un effet lumineux si la face contient du contenu
  if (hasContent) {
  const gradient = ctx.createLinearGradient(
    margin, margin,
    stickerSize + margin, stickerSize + margin
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.save();
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.fillRect(margin, margin, stickerSize, stickerSize);
  ctx.restore();
  }

  // Création de la texture à partir du canevas
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = app.renderer.capabilities.getMaxAnisotropy();
  textureCache.set(cacheKey, texture);
  
  return texture;
}  

// Met à jour les textures d'une face d'un cubie selon son statut actif
export function updateFaceTextures(cubie, faceType, isActive) {
  // Ne pas mettre à jour si c'est le cubie central de la face "top"
  if (cubie.userData.gridPos &&
    cubie.userData.gridPos.x === 0 && 
    cubie.userData.gridPos.y === 1 && 
    cubie.userData.gridPos.z === 0 &&
    faceType === 'top') {
  return;
  }

  // Détermine l'indice de la face à mettre à jour
  const faceIndex = ['right', 'left', 'top', 'bottom', 'front', 'back'].indexOf(faceType);
  if (faceIndex === -1) return;

  // Calcule la position du cubie sur la face
  const position = calculateCubiePosition(cubie.userData.gridPos, faceType);
  const content = CUBE_CONTENT[faceType]?.[position];
  
  const hasContent = app.isZoomed && content?.preview;
  // Crée une nouvelle texture pour la face
  const texture = createFaceTexture(faceType, hasContent);
  
  cubie.material[faceIndex].map = texture;
  cubie.material[faceIndex].needsUpdate = true;
}

// Calcule la position d'un cubie sur une face donnée
export function calculateCubiePosition(pos, faceType) {
  switch(faceType) {
    case 'right':
      return (2 - Math.floor(pos.y + 1)) * 3 + (2 - Math.floor(pos.z + 1));
    case 'left':
      return (2 - Math.floor(pos.y + 1)) * 3 + Math.floor(pos.z + 1);
    case 'back':
      return (2 - Math.floor(pos.y + 1)) * 3 + (2 - Math.floor(pos.x + 1));
    case 'front':
      return (2 - Math.floor(pos.y + 1)) * 3 + Math.floor(pos.x + 1);
    // Les cas "top" et "bottom" utilisent la même formule
    case 'top':
    case 'bottom':
      return (2 - Math.floor(pos.z + 1)) * 3 + Math.floor(pos.x + 1);
    default:
      return -1;
  }
}