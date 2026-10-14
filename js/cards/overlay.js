// Importation des modules nécessaires
import { clearHover } from './preview.js';
import { CATEGORIES, CUBE_CONTENT } from '../utils/constants.js';
import { app } from '../globals.js';

// Variables globales pour l'overlay et la carte d'information active
let overlay = null;
let activeInfoCard = null;
let focusBeforeCard = null; // élément qui avait le focus à l'ouverture, retrouvé à la fermeture
const FOCUSABLE = 'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

// Clavier dans la carte : Échap ferme, Tab reste dans la carte
function onCardKeydown(e) {
  if (e.key === 'Escape') {
    e.stopPropagation(); // ne pas sortir aussi du zoom
    activeInfoCard?.querySelector('.close-button').click();
    return;
  }
  if (e.key !== 'Tab') return;
  const focusables = [...e.currentTarget.querySelectorAll(FOCUSABLE)];
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === e.currentTarget)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// Titre « Poste - Entreprise » : l'entreprise (ou l'établissement) passe sur une ligne à part
function splitTitle(title = '') {
  const parts = title.trim().split(' - ');
  return parts.length > 1 ? [parts.slice(0, -1).join(' - '), parts[parts.length - 1]] : [title.trim(), ''];
}

const formatPeriod = (period) => period.replace(/\s-\s/g, ' – ');

// Texte comparable : sans accents ni majuscules
const plain = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

// En-tête : pastille de la couleur de la face (comme le sticker cliqué), catégorie et période, titre
function cardHead(data, category) {
  const [title, org] = splitTitle(data.title);
  const eyebrow = [
    // catégorie masquée si le titre la répète (« Mon CV », « A propos de Moi »)
    category && !plain(title).includes(plain(category)) ? `<span>${category}</span>` : '',
    data.period ? `<span class="card-period">${formatPeriod(data.period)}</span>` : '',
  ].join('');
  return `<div class="card-head">
      <span class="card-sticker" aria-hidden="true"><i class="${data.icon || 'fa-solid fa-cube'}"></i></span>
      <div>
        ${eyebrow ? `<p class="card-eyebrow">${eyebrow}</p>` : ''}
        <h2 class="card-title">${title}</h2>
        ${org ? `<p class="card-org">${org}</p>` : ''}
      </div>
    </div>`;
}

// « Prénom : <strong>Romain</strong> » → libellé et valeur
const KEY_VALUE = /^([^<:]{1,20}?)\s*:\s*(.+)$/;
// « <strong>Échecs :</strong> texte » → titre et texte
const FEATURE = /^<strong>([^<]+?)\s*:?\s*<\/strong>\s*:?\s*(.+)$/;

// Détails, mis en forme selon leur nature
function detailsBlock(items = [], label) {
  if (!items.length) return '';
  const list = (className, render) => `<ul class="${className}">${items.map(render).join('')}</ul>`;

  // liens (certifications)
  if (items.every((d) => d.trim().startsWith('<a '))) return list('card-links', (d) => `<li>${d}</li>`);

  // fiche d'identité : libellé et valeur
  if (items.filter((d) => KEY_VALUE.test(d)).length >= 3) {
    const facts = items.map((d) => {
      const match = d.match(KEY_VALUE);
      // valeur longue (adresse mail) : toute la largeur
      if (match && match[2].replace(/<[^>]+>/g, '').length > 22) {
        return `<div class="card-facts__wide"><dt>${match[1]}</dt><dd>${match[2]}</dd></div>`;
      }
      return match
        ? `<div><dt>${match[1]}</dt><dd>${match[2]}</dd></div>`
        : `<div class="card-facts__wide"><dd>${d}</dd></div>`;
    });
    return `<dl class="card-facts">${facts.join('')}</dl>`;
  }

  // passions : titre puis texte
  if (items.every((d) => FEATURE.test(d))) {
    return list('card-features', (d) => {
      const [, title, text] = d.match(FEATURE);
      return `<li><strong>${title}</strong><span>${text}</span></li>`;
    });
  }

  // éléments courts (bibliothèques, qualités) en étiquettes, sinon liste à puces
  const short = items.every((d) => !/[<:]/.test(d) && d.length <= 32);
  return `<section class="card-section">
      <h3 class="card-label">${label}</h3>
      ${list(short ? 'card-chips' : 'card-list', (d) => `<li>${d}</li>`)}
    </section>`;
}

function standardCard(data, category, labels) {
  return `${cardHead(data, category)}
    <div class="card-body">
      ${data.description ? `<p class="card-lead">${data.description}</p>` : ''}
      ${detailsBlock(data.details, data.infos || labels.details)}
    </div>`;
}

// CV : aperçu du PDF, téléchargement et ouverture dans un onglet
function pdfCard(data, category, labels) {
  return `${cardHead(data, category)}
    <div class="pdf-view">
      <iframe src="${data.file}" title="${data.title}"></iframe>
      <div class="pdf-actions">
        <a class="card-button" href="${data.file}" download="${labels.fileName}">
          <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>${labels.download}
        </a>
        <a class="card-text-link" href="${data.file}" target="_blank" rel="noopener">
          ${labels.openTab}<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
        </a>
      </div>
    </div>`;
}

// Cartes de projets (HTML écrit à la main) : catégorie devant la période, tiret de période typographique
function polishCustomCard(content, category) {
  const badge = content.querySelector('.card-header .period-badge');
  if (!badge) return;
  badge.dataset.category = category;
  const period = badge.querySelector('span');
  if (period) period.textContent = formatPeriod(period.textContent);
}

// Fonction pour créer l'overlay modal
export function createOverlay() {
  // Création de l'élément overlay
  overlay = document.createElement('div');
  overlay.className = 'overlay';

  // Clic en dehors de la carte : fermeture, seulement si l'appui a aussi commencé sur le fond
  // (le clic qui ouvre la carte, ou une sélection de texte relâchée en dehors, ne la referme pas)
  let pressedOnOverlay = false;
  overlay.addEventListener('pointerdown', (e) => {
    pressedOnOverlay = e.target === overlay;
  });
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target === overlay && pressedOnOverlay && activeInfoCard) {
      activeInfoCard.querySelector('.close-button').click();
    }
    pressedOnOverlay = false;
  });

  // Ajout de l'overlay au document
  document.body.appendChild(overlay);
}

// Fonction pour afficher une carte d'information
export function showInfoCard(event, faceType, cubePosition) {
  // Création de l'overlay si il n'existe pas encore
  if (!overlay) createOverlay();

  // Empêcher la propagation de l'événement déclencheur
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }

  // Fin du survol en cours (cubie soulevé, étiquette)
  clearHover();

  // Désactiver les contrôles du cube et activer le mode modal
  app.isModalOpen = true;
  // (pas de contrôles ni de rendu 3D sur la page mobile)
  if (app.controls) app.controls.enabled = false;
  overlay.classList.add('active');

  // Fermer la carte précédente si elle existe
  if (activeInfoCard) {
    activeInfoCard.remove();
  } else {
    focusBeforeCard = document.activeElement;
  }

  // Création de la carte d'information
  const card = document.createElement('div');
  card.className = 'info-card';
  // boîte de dialogue : annoncée avec son titre, focus déplacé dedans
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.tabIndex = -1;
  card.addEventListener('keydown', onCardKeydown);

  // Création de la zone de contenu de la carte (doit être créée avant toute utilisation)
  const content = document.createElement('div');
  content.className = 'card-inner';
  // Récupération des données en fonction de la face et de la position du cube
  // Recherche plus robuste avec logs pour diagnostiquer les cas où rien n'est trouvé
  let contentData = null;
  try {
    if (CUBE_CONTENT && CUBE_CONTENT[faceType]) {
      const faceContent = CUBE_CONTENT[faceType];

      // Essayer les correspondances directes avec différents types de clés
      const tryKeys = [cubePosition, String(cubePosition), Number(cubePosition)];
      for (const k of tryKeys) {
        if (k !== undefined && faceContent[k] !== undefined) {
          contentData = faceContent[k];
          break;
        }
      }

      // Recherche "fuzzy" sur la face demandée : id, position ou champ identifiable
      if (!contentData) {
        const keys = Object.keys(faceContent);
        for (const k of keys) {
          const entry = faceContent[k];
          if (!entry) continue;
          if (
            String(k) === String(cubePosition) ||
            String(entry.id) === String(cubePosition) ||
            String(entry.position) === String(cubePosition) ||
            (entry.title && String(entry.title).toLowerCase() === String(cubePosition).toLowerCase())
          ) {
            contentData = entry;
            break;
          }
        }
      }
    } else {
      console.warn('no CUBE_CONTENT for faceType', faceType);
    }

    // Si toujours rien, tenter de chercher sur toutes les faces (parfois le mapping est erroné)
    if (!contentData && CUBE_CONTENT) {
      console.warn('content not found on requested face, searching other faces...');
      for (const f of Object.keys(CUBE_CONTENT)) {
        const fc = CUBE_CONTENT[f];
        if (!fc) continue;
        const keys = Object.keys(fc);
        for (const k of keys) {
          const entry = fc[k];
          if (!entry) continue;
          if (
            String(k) === String(cubePosition) ||
            String(entry.id) === String(cubePosition) ||
            String(entry.position) === String(cubePosition) ||
            (entry.title && String(entry.title).toLowerCase() === String(cubePosition).toLowerCase())
          ) {
            contentData = entry;
            console.warn('found content on different face', { foundOn: f, key: k, entry });
            faceType = f; // corriger la face utilisée pour affichage
            break;
          }
        }
        if (contentData) break;
      }
    }
  } catch (err) {
    console.error('[overlay] error resolving contentData', err);
  }

  // Dernier recours : prendre la première entrée définie sur la face demandée
  if (!contentData && CUBE_CONTENT && CUBE_CONTENT[faceType]) {
    const keys = Object.keys(CUBE_CONTENT[faceType]);
    if (keys.length > 0) contentData = CUBE_CONTENT[faceType][keys[0]];
  }

  // Choisir la langue courante et fusionner avec les champs i18n si présents
  const lang = app.langManager && app.langManager.currentLang ? app.langManager.currentLang : 'fr';
  const localized = contentData && contentData.i18n && contentData.i18n[lang] ? contentData.i18n[lang] : {};
  const data = contentData ? Object.assign({}, contentData, localized) : null;
  // Priorité aux contenus HTML localisés
  const dataHtml =
    localized && localized.htmlContent
      ? localized.htmlContent
      : contentData && contentData.htmlContent
        ? contentData.htmlContent
        : null;
  // Récupérer les libellés UI traduits si disponibles
  const ui =
    app.langManager &&
    app.langManager.translations &&
    app.langManager.translations[lang] &&
    app.langManager.translations[lang].ui
      ? app.langManager.translations[lang].ui
      : {};
  const fr = lang === 'fr';
  const labels = {
    details: ui.detailsLabel || (fr ? 'Points clés' : 'Highlights'),
    download: ui.downloadCV || (fr ? 'Télécharger le CV' : 'Download Resume'),
    openTab: ui.openInTab || (fr ? 'Ouvrir dans un nouvel onglet' : 'Open in a new tab'),
    fileName: fr ? 'CV-Romain-Goldenchtein.pdf' : 'Resume-Romain-Goldenchtein.pdf',
    close: ui.close || (fr ? 'Fermer' : 'Close'),
    comingSoon: ui.comingSoon || (fr ? 'Bientôt...' : 'Coming soon...'),
  };
  const category = app.langManager?.translations?.[lang]?.categories?.[faceType] || CATEGORIES[faceType] || '';

  // Attribuer un type de face à la carte : ses couleurs en dépendent
  card.setAttribute('data-face', faceType);

  // Création du bouton de fermeture de la carte
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-button';
  closeBtn.setAttribute('aria-label', labels.close);
  closeBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    // Réactiver les contrôles et fermer la fenêtre modale
    app.isModalOpen = false;
    // les contrôles restent désactivés tant que la vue est zoomée sur une face
    if (app.controls) app.controls.enabled = !app.isZoomed;
    card.classList.remove('active');
    overlay.classList.remove('active');
    if (app.renderer) app.renderer.domElement.style.cursor = 'default';
    setTimeout(() => card.remove(), 200);
    activeInfoCard = null;
    // le focus revient là où il était (bouton d'un sticker au clavier)
    if (focusBeforeCard?.isConnected) focusBeforeCard.focus({ preventScroll: true });
    focusBeforeCard = null;
  };

  // Empêcher la fermeture de la carte lors d'un clic à l'intérieur
  card.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Contenu HTML écrit à la main (projets), CV en PDF ou carte standard
  if (dataHtml) {
    content.innerHTML = dataHtml;
    polishCustomCard(content, category);
  } else if (data && data.hasContent) {
    content.innerHTML = data.file ? pdfCard(data, category, labels) : standardCard(data, category, labels);
    if (data.file) card.classList.add('info-card--wide');
  } else {
    // Cas par défaut si aucun contenu spécifique n'est défini
    content.innerHTML = `<div class="card-head"><div><h2 class="card-title">${category}</h2></div></div>
      <div class="card-body"><p class="card-lead">${labels.comingSoon}</p></div>`;
  }

  // Titre de la boîte de dialogue
  const title = content.querySelector('.card-title, .card-header h2');
  if (title) {
    title.id = 'info-card-title';
    card.setAttribute('aria-labelledby', title.id);
  }

  // Ajout des éléments à la carte
  card.appendChild(closeBtn);
  card.appendChild(content);
  // Ajout de la carte au document
  document.body.appendChild(card);

  // Animation d'ouverture de la carte
  card.focus({ preventScroll: true });
  requestAnimationFrame(() => {
    card.classList.add('active');
  });

  // Mise à jour de la carte active
  activeInfoCard = card;
}
