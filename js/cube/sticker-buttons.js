import { app } from '../globals.js';
import { CUBE_CONTENT } from '../utils/constants.js';
import { calculateCubiePosition } from './cube.js';
import { focusSticker, blurSticker } from '../cards/preview.js';
import { showInfoCard } from '../cards/overlay.js';

// Au clavier, les stickers de la face zoomée sont des boutons invisibles : le focus met le sticker
// en avant sur le cube (comme au survol, avec l'aperçu et son titre) et Entrée ouvre son contenu.
let list = null;

export function showStickerButtons(faceType, cubies) {
  hideStickerButtons();
  const lang = app.langManager?.currentLang || 'fr';
  const ui = app.langManager?.translations?.[lang]?.ui || {};

  list = document.createElement('ul');
  list.className = 'sticker-buttons';
  list.setAttribute('aria-label', ui.stickersLabel || 'Contenus de la face');

  cubies
    .map((cubie) => ({ cubie, position: calculateCubiePosition(cubie.userData.gridPos, faceType) }))
    .sort((a, b) => a.position - b.position)
    .forEach(({ cubie, position }) => {
      const content = CUBE_CONTENT[faceType]?.[position];
      if (!content?.hasContent && !content?.link) return;
      const title = (content.i18n?.[lang]?.title || content.title).trim();

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = content.hasContent ? title : `${title} (${ui.externalLink || 'lien externe'})`;
      button.addEventListener('focus', () => focusSticker(cubie, faceType));
      button.addEventListener('blur', () => blurSticker(cubie));
      button.addEventListener('click', (e) => {
        if (content.hasContent) showInfoCard(e, faceType, position);
        else window.open(content.link, '_blank', 'noopener');
      });

      const item = document.createElement('li');
      item.appendChild(button);
      list.appendChild(item);
    });

  document.getElementById('cube-section').appendChild(list);
}

export function hideStickerButtons() {
  list?.remove();
  list = null;
}
