import { app } from '../globals.js';

// Ouverture / fermeture du menu latéral. Fermé, il est inerte : ses entrées hors écran ne prennent pas le focus.
export function openMenu() {
  if (app.isPlayable) return;
  app.menuBtn.classList.add('open');
  app.menuBtn.setAttribute('aria-expanded', 'true');
  app.menu.classList.add('active');
  app.menu.inert = false;
  app.menuOpen = true;
}

export function closeMenu() {
  app.menuBtn.classList.remove('open');
  app.menuBtn.setAttribute('aria-expanded', 'false');
  app.menu.classList.remove('active');
  app.menu.inert = true;
  app.menuOpen = false;
}

// Met en avant l'entrée du menu d'une face (data-face, indépendant de la langue)
export function highlightMenuItem(faceType, { scroll = false } = {}) {
  document.querySelectorAll('.menu-item').forEach((item) => {
    const active = item.dataset.face === faceType;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'true');
    else item.removeAttribute('aria-current');
    if (active && scroll) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
