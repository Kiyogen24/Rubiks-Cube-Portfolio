import { app } from '../globals.js';
import { zoomToFace, dezoom, getCentralCubie } from '../cube/navigation.js';
import { openMenu, closeMenu, highlightMenuItem } from './menu-state.js';

// Zoom sur une face depuis le menu ou un lien rapide
function zoomFromMenu(faceType) {
  const centralCubie = getCentralCubie(faceType);
  if (!centralCubie || app.isPlayable) return false;
  zoomToFace(centralCubie, faceType);
  app.isZoomed = true;
  return true;
}

// Menu latéral, bouton « Retour » et liens rapides du pied de page
export function setupMenu() {
  app.menuBtn = document.querySelector('.menu-btn');
  app.menu = document.querySelector('.menu');
  closeMenu(); // état initial : fermé et inerte

  // Bouton « Retour » : sortie du zoom
  app.resetButton = document.createElement('button');
  app.resetButton.id = 'reset';
  app.resetButton.setAttribute('aria-label', 'Retour');
  app.resetButton.addEventListener('click', dezoom);
  document.getElementById('cube-section').appendChild(app.resetButton);

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
