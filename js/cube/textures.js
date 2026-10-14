// Textures dessinées dans un canvas : les stickers de couleur, la photo du sticker central du haut,
// et les images des contenus, posées sur les stickers en mode exploration
import * as THREE from 'three';
import { BODY, COLORS } from './geometry.js';

// Charge une image une seule fois ; donne null si elle manque
const images = {};
export function loadImage(src) {
  images[src] ||= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  return images[src];
}

function canvasTexture(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  draw(g);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace; // sinon les couleurs sont éclaircies une seconde fois (voile blanc)
  texture.anisotropy = 4;
  return { texture, g };
}

// Sticker de couleur, arrondi, sur le plastique noir
function drawSticker(g, color) {
  g.fillStyle = BODY;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(16, 16, 224, 224, 18);
  g.fill();
}

const stickers = {};
export function stickerTexture(face) {
  stickers[face] ||= canvasTexture((g) => drawSticker(g, COLORS[face])).texture;
  return stickers[face];
}

// Le sticker central du haut porte la photo
let avatar = null;
export function avatarTexture(src) {
  if (avatar) return avatar;
  const { texture, g } = canvasTexture((g) => drawSticker(g, COLORS.top));
  loadImage(src).then((img) => {
    if (!img) return;
    g.save();
    g.beginPath();
    g.roundRect(16, 16, 224, 224, 18);
    g.clip();
    g.drawImage(img, 16, 16, 224, 224);
    g.restore();
    texture.needsUpdate = true;
  });
  return (avatar = texture);
}

// Image d'un contenu : un carré blanc arrondi, l'image recadrée au centre
function drawTile(g, img) {
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.roundRect(22, 22, 212, 212, 26);
  g.fill();
  if (!img) return;
  const inner = 188;
  const iw = img.naturalWidth || img.width || inner;
  const ih = img.naturalHeight || img.height || inner;
  const side = Math.min(iw, ih);
  g.save();
  g.beginPath();
  g.roundRect(34, 34, inner, inner, 18);
  g.clip();
  g.drawImage(img, (iw - side) / 2, (ih - side) / 2, side, side, 34, 34, inner, inner);
  g.restore();
}

const tiles = {};
export function tileTexture(src) {
  if (tiles[src]) return tiles[src];
  const { texture, g } = canvasTexture((g) => drawTile(g, null));
  loadImage(src).then((img) => {
    drawTile(g, img);
    texture.needsUpdate = true;
  });
  return (tiles[src] = texture);
}
