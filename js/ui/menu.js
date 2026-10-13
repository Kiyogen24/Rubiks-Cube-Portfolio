import { app } from '../globals.js';
import { zoomToFace, dezoom, getCentralCubie } from '../cube/navigation.js';

export function openMenu() {
  app.menuBtn.classList.add('open');
  app.menu.classList.add('active');
  app.menuOpen = true;
}

export function closeMenu() {
  app.menuBtn.classList.remove('open');
  app.menu.classList.remove('active');
  app.menuOpen = false;
}

// Met en avant l'entrée du menu d'une face (data-face, indépendant de la langue)
export function highlightMenuItem(faceType, { scroll = false } = {}) {
  document.querySelectorAll('.menu-item').forEach((item) => {
    const active = item.dataset.face === faceType;
    item.classList.toggle('active', active);
    if (active && scroll) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// Zoom sur une face depuis le menu ou un lien rapide
function zoomFromMenu(faceType) {
  const centralCubie = getCentralCubie(faceType);
  if (!centralCubie) return false;
  zoomToFace(centralCubie, faceType);
  app.isZoomed = true;
  return true;
}

// Menu latéral, bouton « Retour » et liens rapides du pied de page
export function setupMenu() {
  app.menuBtn = document.querySelector('.menu-btn');
  app.menu = document.querySelector('.menu');

  // Bouton « Retour » : sortie du zoom
  app.resetButton = document.createElement('button');
  app.resetButton.id = 'reset';
  app.resetButton.setAttribute('aria-label', 'Retour');
  app.resetButton.addEventListener('click', dezoom);
  document.body.appendChild(app.resetButton);

  // Ouverture / fermeture du menu, impossible en mode jeu
  app.menuBtn.addEventListener('click', () => {
    if (app.isPlayable || app.menuOpen) closeMenu();
    else openMenu();
  });

  // Choix d'une catégorie
  document.querySelectorAll('.menu-item').forEach((item) => {
    item.addEventListener('click', () => {
      if (app.isPlayable) return;
      if (window.innerWidth < 768) closeMenu(); // petit écran : le menu cacherait la face
      if (zoomFromMenu(item.dataset.face)) highlightMenuItem(item.dataset.face);
    });
  });

  // Liens rapides du pied de page : défilement vers le cube puis zoom sur la face
  document.querySelectorAll('.quick-link[data-face]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const faceType = link.dataset.face;
      document.getElementById('cube-section').scrollIntoView({ behavior: 'smooth' });
      // laisse le temps au défilement de se terminer
      setTimeout(() => {
        openMenu();
        highlightMenuItem(faceType, { scroll: true });
        zoomFromMenu(faceType);
      }, 1000);
    });
  });
}
