// Importation des modules nécessaires
import * as THREE from 'three';
import { hidePreview } from './preview.js';
import { CATEGORIES, CUBE_CONTENT, stickerColors } from '../utils/constants.js';
import { updateFaceTextures } from '../cube/cube.js';
import { app } from '../globals.js';

// Variables globales pour l'overlay et la carte d'information active
let overlay = null; 
let activeInfoCard = null;

// Fonction pour créer l'overlay modal
export function createOverlay() {
    // Création de l'élément overlay
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    // Ajout d'un écouteur d'événement sur le clic pour fermer la carte si clic en dehors
    overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        // Si le clic est sur l'overlay et une carte est active, simule le clic sur le bouton de fermeture
        if (e.target === overlay && activeInfoCard) {
            activeInfoCard.querySelector('.close-button').click();
        }
    });
    
    // Ajout de l'overlay au document
    document.body.appendChild(overlay);
}

// Fonction pour afficher une carte d'information
export function showInfoCard(event, faceType, cubePosition) {
    // Debug d'entrée pour confirmer l'appel et tracer l'origine
    // Utiliser des logs de niveau supérieur pour s'assurer qu'ils apparaissent même si console.debug est filtré
    console.info('enter showInfoCard', { faceType, cubePosition, eventType: event && event.type });
    console.trace('call stack');
    // Montrer un aperçu du contenu disponible pour vérifier le mapping des faces
    try {
    console.info('available CUBE_CONTENT faces', Object.keys(CUBE_CONTENT || {}));
    } catch (err) {
    console.warn('cannot read CUBE_CONTENT keys', err);
    }

    // Création de l'overlay si il n'existe pas encore
    if (!overlay) createOverlay();

    // Empêcher la propagation de l'événement déclencheur
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }

    // Réinitialiser l'effet de survol (hover) s'il est actif
    if (app.hoveredCubie) {
        app.hoveredCubie.scale.set(1, 1, 1);
        updateFaceTextures(app.hoveredCubie, app.hoveredCubie.userData.hoveredFace, true);
        app.hoveredCubie.userData.hoveredFace = null;
        app.hoveredCubie = null;
    }
    hidePreview();
  
    // Désactiver les contrôles du cube et activer le mode modal
    app.isModalOpen = true;
    app.controls.enabled = false;
    overlay.classList.add('active');
    console.debug('overlay activated', { overlayExists: !!overlay });

    // Fermer la carte précédente si elle existe
    if (activeInfoCard) {
        activeInfoCard.remove();
    }

    // Détection du mode mobile pour ajuster la carte
    const isMobile = window.innerWidth < 768;

    // Création de la carte d'information
    const card = document.createElement('div');
    card.className = 'info-card';
    
    // Création de la zone de contenu de la carte (doit être créée avant toute utilisation)
    const content = document.createElement('div');
    // Récupération des données en fonction de la face et de la position du cube
    // Recherche plus robuste avec logs pour diagnostiquer les cas où rien n'est trouvé
    let contentData = null;
    try {
    console.info('resolving content', { faceType, cubePosition, typeOfCubePos: typeof cubePosition, hasCUBE_CONTENT: !!CUBE_CONTENT });
        if (CUBE_CONTENT && CUBE_CONTENT[faceType]) {
            const faceContent = CUBE_CONTENT[faceType];
            console.info('face keys', Object.keys(faceContent));

            // Essayer les correspondances directes avec différents types de clés
            const tryKeys = [cubePosition, String(cubePosition), Number(cubePosition)];
            for (const k of tryKeys) {
                if (k !== undefined && faceContent[k] !== undefined) {
                    contentData = faceContent[k];
                    console.info('matched with key on requested face', { key: k, faceType });
                    break;
                }
            }

            // Recherche "fuzzy" sur la face demandée : id, position ou champ identifiable
            if (!contentData) {
                const keys = Object.keys(faceContent);
                for (const k of keys) {
                    const entry = faceContent[k];
                    if (!entry) continue;
                    if (String(k) === String(cubePosition)
                        || String(entry.id) === String(cubePosition)
                        || String(entry.position) === String(cubePosition)
                        || (entry.title && String(entry.title).toLowerCase() === String(cubePosition).toLowerCase())) {
                        contentData = entry;
                        console.info('fuzzy matched entry on requested face', { key: k, entry });
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
                    if (String(k) === String(cubePosition)
                        || String(entry.id) === String(cubePosition)
                        || String(entry.position) === String(cubePosition)
                        || (entry.title && String(entry.title).toLowerCase() === String(cubePosition).toLowerCase())) {
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

    // Log final d'aide au diagnostic (niveau info pour visibilité)
    console.info('showInfoCard', { faceType, cubePosition, resolved: contentData ? 'found' : 'not found', contentData, langState: app && app.langManager ? app.langManager.currentLang : null });

    // Choisir la langue courante et fusionner avec les champs i18n si présents
    const lang = (app.langManager && app.langManager.currentLang) ? app.langManager.currentLang : 'fr';
    const localized = contentData && contentData.i18n && contentData.i18n[lang] ? contentData.i18n[lang] : {};
    const data = contentData ? Object.assign({}, contentData, localized) : null;
    // Priorité aux contenus HTML localisés
    const dataHtml = (localized && localized.htmlContent) ? localized.htmlContent : (contentData && contentData.htmlContent ? contentData.htmlContent : null);
    // Récupérer les libellés UI traduits si disponibles
    const ui = (app.langManager && app.langManager.translations && app.langManager.translations[lang] && app.langManager.translations[lang].ui) ? app.langManager.translations[lang].ui : {};
    const labels = {
        description: ui.descriptionLabel || (lang === 'fr' ? 'Description' : 'Description'),
        details: ui.detailsLabel || (lang === 'fr' ? 'Détails' : 'Details'),
        openCV: ui.downloadCV || (lang === 'fr' ? 'Ouvrir le CV' : 'Open CV'),
        comingSoon: ui.comingSoon || (lang === 'fr' ? 'Bientôt...' : 'Coming soon...')
    };

    // Configuration spécifique pour mobile
    if (isMobile) {
        card.style.width = '95vw';
        card.style.margin = '10px';
        // Ajuster le contenu affiché pour mobile si disponible
        if (dataHtml) {
            // simplifyContentForMobile peut ne pas exister dans tous les contextes, vérifier avant d'appeler
            if (typeof simplifyContentForMobile === 'function') {
                const mobileContent = simplifyContentForMobile(dataHtml);
                content.innerHTML = mobileContent;
            } else {
                content.innerHTML = dataHtml;
            }
        }
    }
    
    // Attribuer un type de face à la carte pour la stylisation potentielle
    card.setAttribute('data-face', faceType);
    
    // Création du bouton de fermeture de la carte
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        // Réactiver les contrôles et fermer la fenêtre modale
        app.isModalOpen = false;
        app.controls.enabled = true;
        card.classList.remove('active');
        overlay.classList.remove('active');
        app.renderer.domElement.style.cursor = 'default';
        setTimeout(() => card.remove(), 300);
        activeInfoCard = null;
    };

    // Empêcher la fermeture de la carte lors d'un clic à l'intérieur
    card.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Si on est sur la face "right" et que du contenu HTML personnalisé est disponible
    if (dataHtml) {
        content.innerHTML = dataHtml;
    }
    // Sinon, afficher le contenu standard ou un aperçu PDF
    else if (data && data.hasContent) {
        content.innerHTML = data.file
        ? `<div class="pdf-view">
            <iframe src="assets/previews/cv.pdf" type="application/pdf" width="100%" height="90%"></iframe>
            <a href="assets/previews/cv.pdf" target="_blank" class="pdf-download-link">
              <i class="fa-regular fa-folder-open"></i> ${labels.openCV}
            </a>
          </div>`
        : `<div class="standard-card">
            <div class="card-header">
              <div class="header-main">
                <i class="${data.icon || ''} card-icon"></i>
                <h2>${data.title || ''}</h2>
              </div>
              ${data.period ? `<div class="period-badge"><i class="fas fa-calendar-alt"></i><span>${data.period}</span></div>` : ''}
            </div>
            <div class="card-content">
              ${data.description ? `<div class="description-section"><h3><i class="fas fa-info-circle"></i> ${labels.description}</h3><p class="description">${data.description}</p></div>` : ''}
              ${data.details && data.details.length > 0 ? `<div class="details-section"><h3><i class="fas fa-list-ul"></i> ${data.infos ? data.infos : labels.details}</h3><ul class="details-list">${data.details.map(detail => `<li><i class="fas fa-check"></i><span>${detail}</span></li>`).join('')}</ul></div>` : ''}
            </div>
          </div>`;
    } else {
        // Cas par défaut si aucun contenu spécifique n'est défini
        content.innerHTML = `
            <h2>${CATEGORIES[faceType] || ''}</h2>
            <p>${labels.comingSoon}</p>
        `;
    }

    // Ajout des éléments à la carte
    card.appendChild(closeBtn);
    card.appendChild(content);
    // Ajout de la carte au document
    document.body.appendChild(card);
    
    // Animation d'ouverture de la carte
    requestAnimationFrame(() => {
        card.classList.add('active');
    });

    // Mise à jour de la carte active
    activeInfoCard = card;
}
