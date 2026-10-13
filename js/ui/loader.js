import { CUBE_CONTENT } from '../utils/constants.js';

// Précharge les images d'aperçu des stickers
function preloadImages() {
  const urls = new Set();
  Object.values(CUBE_CONTENT).forEach((face) => {
    Object.values(face).forEach((content) => {
      if (content.preview) urls.add(content.preview);
    });
  });

  const loads = [...urls].map(
    (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
      }),
  );

  return Promise.all(loads)
    .then(() => console.log('Toutes les images sont préchargées'))
    .catch((failed) => console.warn("Certaines images n'ont pas pu être chargées:", failed));
}

// Écran de chargement : masqué une fois les aperçus et les polices chargés
// (affiché au moins 1 s pour l'animation, au plus 5 s si le réseau est lent)
export function setupLoader() {
  const container = document.querySelector('.container');
  container.style.visibility = 'hidden';
  const imagesLoaded = preloadImages();

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
  Promise.race([Promise.all([imagesLoaded, document.fonts.ready, minDelay]), maxDelay]).then(hideLoadingScreen);
}
