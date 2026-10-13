import { CUBE_CONTENT } from '../utils/constants.js';

// Aperçus des stickers d'une face, préchargés pendant le vol de la caméra vers elle
// (au lieu de tous les charger au démarrage)
const preloaded = new Set();

export function preloadPreviews(faceType) {
  Object.values(CUBE_CONTENT[faceType] || {}).forEach((content) => {
    if (!content.preview || preloaded.has(content.preview)) return;
    preloaded.add(content.preview);
    new Image().src = content.preview;
  });
}

// Écran de chargement : masqué une fois les polices chargées
// (affiché au moins 1 s pour l'animation, au plus 5 s si le réseau est lent)
export function setupLoader() {
  const container = document.querySelector('.container');
  container.style.visibility = 'hidden';

  function hideLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    loadingScreen.classList.add('fade-out');
    container.style.visibility = 'visible';
    // Démarre l'animation d'écriture de l'introduction (voir intro.css)
    document.body.classList.add('loaded');
    setTimeout(() => loadingScreen.remove(), 500);
  }

  const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));
  const maxDelay = new Promise((resolve) => setTimeout(resolve, 5000));
  Promise.race([Promise.all([document.fonts.ready, minDelay]), maxDelay]).then(hideLoadingScreen);
}
