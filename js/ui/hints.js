import { app } from '../globals.js';
import { isCubeSectionInView } from '../utils/view.js';

let clickHint = null;
let navHint = null;
let rotateHint = null;

// Aide affichée après le mélange (créée une seule fois)
function createRotateHint() {
  const rotate = document.createElement('div');
  rotate.id = 'rotate-hint';
  rotate.className = 'cube-hint rotate-hint';
  rotate.innerHTML = `
    <div class="hint-icon" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12a9 9 0 10-2.65 6.06" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 3v6h-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="hint-text">${app.langManager.translate('rotateHint', 'ui')}</div>
  `;
  document.getElementById('cube-section').appendChild(rotate);
  return rotate;
}

// Place les aides : clic au centre du cube, navigation à côté des boutons, rotation au-dessus du bouton Mélanger
export function positionHints() {
  if (!rotateHint) return;
  const rect = document.getElementById('cube-section').getBoundingClientRect();

  clickHint.style.position = 'fixed';
  clickHint.style.left = rect.left + rect.width / 2 + 'px';
  clickHint.style.top = rect.top + rect.height / 2 + 'px';
  clickHint.style.transform = 'translate(-50%, -50%)';

  const navButtons = document.querySelectorAll('.nav-button');
  navHint.style.position = 'fixed';
  navHint.style.transform = 'translateY(-50%)';
  if (navButtons.length > 0) {
    // centré verticalement sur la pile de boutons
    const first = navButtons[0].getBoundingClientRect();
    const last = navButtons[navButtons.length - 1].getBoundingClientRect();
    navHint.style.left = first.right + 18 + 'px';
    navHint.style.top = (first.top + last.bottom) / 2 + 'px';
  } else {
    navHint.style.left = '80px';
    navHint.style.top = rect.top + rect.height * 0.4 + 'px';
  }

  const sRect = app.shuffleSolveButton.getBoundingClientRect();
  const rRect = rotateHint.getBoundingClientRect();
  rotateHint.style.position = 'fixed';
  rotateHint.style.left = sRect.left + sRect.width / 2 + 'px';
  rotateHint.style.top = sRect.top - (rRect.height || 84) - 12 + 'px';
  rotateHint.style.transform = 'translateX(-50%)';
  rotateHint.style.zIndex = '250';
}

function hideAllHints() {
  clickHint.classList.remove('visible');
  navHint.classList.remove('visible');
  rotateHint.classList.remove('visible', 'pulse-rotate');
}

// Aide de rotation, une seule fois après le premier mélange
export function showRotateHintOnce() {
  if (!rotateHint || localStorage.getItem('hasSeenRotateHint') || !isCubeSectionInView()) return;

  positionHints();
  rotateHint.querySelector('.hint-text').textContent = app.langManager.translate('rotateHint', 'ui');
  rotateHint.classList.add('visible', 'pulse-rotate');

  // masquée au premier contact avec le cube ou après 8 s
  const dismiss = () => {
    rotateHint.classList.remove('visible', 'pulse-rotate');
    localStorage.setItem('hasSeenRotateHint', 'true');
    window.removeEventListener('mousedown', dismiss);
    window.removeEventListener('touchstart', dismiss);
  };
  window.addEventListener('mousedown', dismiss, { once: true });
  window.addEventListener('touchstart', dismiss, { once: true });
  setTimeout(dismiss, 8000);
}

export function setupHints() {
  clickHint = document.getElementById('click-hint');
  navHint = document.getElementById('nav-hint');
  const container = document.querySelector('.container');
  const cubeSection = document.getElementById('cube-section');
  if (!clickHint || !navHint || !cubeSection) return;
  rotateHint = createRotateHint();

  if (!localStorage.getItem('hasSeenCubeHints')) {
    // première visite : les étiquettes des faces attendent la fin des aides
    app.hintsShowing = true;
    let dismissed = false;
    const dismissHints = () => {
      dismissed = true;
      hideAllHints();
      localStorage.setItem('hasSeenCubeHints', 'true');
      app.hintsShowing = false;
    };

    // aides affichées à l'arrivée sur le cube, pendant 6 s
    const onContainerScroll = () => {
      if (!isCubeSectionInView()) return;
      container.removeEventListener('scroll', onContainerScroll);
      setTimeout(() => {
        if (dismissed) return;
        positionHints();
        clickHint.classList.add('visible');
        navHint.classList.add('visible');
        setTimeout(dismissHints, 6000);
      }, 800);
    };
    container.addEventListener('scroll', onContainerScroll, { passive: true });
    onContainerScroll(); // page rechargée directement sur le cube

    // masquées au premier clic sur le cube ou les boutons de navigation
    cubeSection.addEventListener('click', dismissHints, { once: true });
    document
      .querySelectorAll('.nav-button')
      .forEach((btn) => btn.addEventListener('click', dismissHints, { once: true }));
  } else {
    hideAllHints();
  }

  window.addEventListener('resize', positionHints);
  window.addEventListener('orientationchange', positionHints);

  // repositionnement régulier tant qu'une aide est visible
  let repositionInterval = null;
  const observer = new MutationObserver(() => {
    const anyVisible = [clickHint, navHint, rotateHint].some((hint) => hint.classList.contains('visible'));
    if (anyVisible && !repositionInterval) {
      repositionInterval = setInterval(positionHints, 250);
    } else if (!anyVisible && repositionInterval) {
      clearInterval(repositionInterval);
      repositionInterval = null;
    }
  });
  [clickHint, navHint, rotateHint].forEach((hint) =>
    observer.observe(hint, { attributes: true, attributeFilter: ['class'] }),
  );
}
