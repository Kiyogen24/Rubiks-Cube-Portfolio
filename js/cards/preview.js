import * as THREE from 'three';
import { CUBE_CONTENT, stickerColors } from '../utils/constants.js';
import { calculateCubiePosition, updateFaceTextures } from '../cube/cube.js';
import { app } from '../globals.js';

let previewElement = null;

// Affiche une popup de prévisualisation à la position donnée avec une image en fond
export function displayPreview(imageSrc, event) {
    // Crée l'élément de prévisualisation s'il n'existe pas déjà
    if (!previewElement) {
      previewElement = document.createElement('div');
      previewElement.className = 'preview-popup';
      document.body.appendChild(previewElement);
    }
  
    // Récupère la position du cube sur l'écran (utile si le cube est décalé)
    const rect = document.querySelector('#cube-section').getBoundingClientRect();
    previewElement.style.display = 'block';
    previewElement.style.backgroundImage = `url(${imageSrc})`; 
     
    // Calculer la position centrée en fonction de l'événement de survol
    const cubieCenterX = event.clientX;
    const cubieCenterY = event.clientY;
    
    // Utilise requestAnimationFrame pour une transition fluide en ajoutant la classe "visible"
    requestAnimationFrame(() => {
      previewElement.classList.add('visible');
      previewElement.style.left = `${cubieCenterX}px`;
      previewElement.style.top = `${cubieCenterY}px`;
    });
  }

// Masque la popup de prévisualisation
export function hidePreview() {
    if (previewElement) {
        previewElement.classList.remove('visible');
    }
}
  
// Met à jour l'état de survol d'un cubie et applique les effets si nécessaire
export function updateCubieHoverState(cubie, isHovered) {
    // N'applique pas d'effets si l'application n'est pas en mode zoom
    if (!app.isZoomed) return;
  
    // Vérifie si le rayon de la souris intersecte le cubie
    const intersects = app.raycaster.intersectObject(cubie);
    
    if (intersects.length > 0 && isHovered) {
      // Normal de la face intersectée, transformé vers le repère du monde
      const normal = intersects[0].face.normal.clone();
      normal.transformDirection(cubie.matrixWorld);
      
      let faceType;
      const epsilon = 0.1;
      // Détermine la face concernée en fonction de la direction du vecteur normal
      if (Math.abs(normal.z) > 1 - epsilon) faceType = normal.z > 0 ? 'front' : 'back';
      else if (Math.abs(normal.x) > 1 - epsilon) faceType = normal.x > 0 ? 'right' : 'left';
      else if (Math.abs(normal.y) > 1 - epsilon) faceType = normal.y > 0 ? 'top' : 'bottom';
      
      // Calcule la position du cubie pour la face identifiée
      const position = calculateCubiePosition(cubie.userData.gridPos, faceType);
      const content = CUBE_CONTENT[faceType]?.[position];
  
      // Applique les effets de survol si une prévisualisation est disponible
      if (content?.preview) {
        cubie.userData.hoveredFace = faceType;
        applyHoverEffects(cubie, faceType, content);
        // Change le curseur si le contenu est interactif
        if (content?.hasContent  || content?.link) {
          app.renderer.domElement.style.cursor = 'pointer';
        }
      }
    } else {
      // Réinitialise l'état de la face survolée et remet le curseur par défaut
      if (cubie.userData.hoveredFace) {
        updateFaceTextures(cubie, cubie.userData.hoveredFace, true);
        cubie.userData.hoveredFace = null;
        app.renderer.domElement.style.cursor = 'default';
      }
      hidePreview();
    }
}
  
// Applique les effets de survol sur un cubie pour la face donnée en créant une texture dynamique
function applyHoverEffects(cubie, faceType, content) {
    // Détermine l'index de la face en fonction d'un tableau de noms
    const faceIndex = ['right', 'left', 'top', 'bottom', 'front', 'back'].indexOf(faceType);
    
    // Crée un canvas pour dessiner la texture
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const margin = 32;
    const stickerSize = 448;
    const radius = 35;
    const baseColor = stickerColors[faceType];
  
    // Dessine le fond arrondi du sticker
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
    ctx.fill();
  
    // Ajoute un effet lumineux avec un dégradé
    const gradient = ctx.createLinearGradient(
      margin, margin,
      stickerSize + margin, stickerSize + margin
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
        
    ctx.save();
    ctx.clip();
    ctx.fillStyle = gradient;
    ctx.fillRect(margin, margin, stickerSize, stickerSize);
    ctx.restore();
  
    // Si une prévisualisation existe, applique la texture et affiche la popup
    if (content.preview) {
      // Crée une texture depuis le canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = app.renderer.capabilities.getMaxAnisotropy();
      cubie.material[faceIndex].map = texture;
      cubie.material[faceIndex].needsUpdate = true;
  
      // Calcule la position du cubie à l'écran pour positionner la prévisualisation
      const vector = new THREE.Vector3();
      cubie.getWorldPosition(vector);
      vector.project(app.camera);
      
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
      
      // Affiche la prévisualisation avec un ajustement de position
      displayPreview(content.preview, {
        clientX: x - 80,
        clientY: y - 80
      });
    }
  
    // Ajoute un symbole "+" si le contenu est interactif
    if (content.hasContent) {
      const plusSize = 100;
      const padding = 60;
      const centerX = stickerSize - padding;
      const centerY = stickerSize - padding;
    
      // Dessine le cercle de fond pour le symbole
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, plusSize / 2, 0, Math.PI * 2);
      ctx.fill();
  
      // Dessine le symbole "+" au centre du cercle
      ctx.fillStyle = baseColor;
      ctx.font = 'bold 72px Arial'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', centerX, centerY + 5);
    }
}
  
// Fonction utilitaire pour obtenir l'index de la face dans le tableau
function getFaceIndex(faceType) {
    const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    return faceNames.indexOf(faceType);
}