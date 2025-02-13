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

    // Fermer la carte précédente si elle existe
    if (activeInfoCard) {
        activeInfoCard.remove();
    }

    // Détection du mode mobile pour ajuster la carte
    const isMobile = window.innerWidth < 768;
  
    // Création de la carte d'information
    const card = document.createElement('div');
    card.className = 'info-card';
    
    // Configuration spécifique pour mobile
    if (isMobile) {
        card.style.width = '95vw';
        card.style.margin = '10px';
        // Ajuster le contenu affiché pour mobile si disponible
        if (contentData && contentData.htmlContent) {
            const mobileContent = simplifyContentForMobile(contentData.htmlContent);
            content.innerHTML = mobileContent;
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

    // Création de la zone de contenu de la carte
    const content = document.createElement('div');
    // Récupération des données en fonction de la face et de la position du cube
    const contentData = CUBE_CONTENT[faceType]?.[cubePosition];

    // Si on est sur la face "right" et que du contenu HTML personnalisé est disponible
    if (faceType === 'right' && contentData && contentData.htmlContent) {
        content.innerHTML = contentData.htmlContent;
    }
    // Sinon, afficher le contenu standard ou un aperçu PDF
    else if (contentData.hasContent) {
        content.innerHTML = contentData.file 
        ? `<div class="pdf-view">
            <iframe 
               src="assets/previews/cv.pdf" 
               type="application/pdf" 
               width="100%" 
               height="90%">
             </iframe>
             <a href="assets/previews/cv.pdf" target="_blank" class="pdf-download-link">
              <i class="fa-regular fa-folder-open"></i> Ouvrir le CV
             </a>
           </div>`
        : `<div class="standard-card">
            <div class="card-header">
              <div class="header-main">
                <i class="${contentData.icon} card-icon"></i>
                <h2>${contentData.title}</h2>
              </div>
              ${contentData.period ? 
                `<div class="period-badge">
                  <i class="fas fa-calendar-alt"></i>
                  <span>${contentData.period}</span>
                </div>` : ''
              }
            </div>
            <div class="card-content">
              ${contentData.description ? 
                `<div class="description-section">
                  <h3><i class="fas fa-info-circle"></i> Description</h3>
                  <p class="description">${contentData.description}</p>
                </div>` : ''
              }
              ${contentData.details && contentData.details.length > 0 ? 
                `<div class="details-section">
                  <h3><i class="fas fa-list-ul"></i> ${contentData.infos ? contentData.infos : "Détails"}</h3>
                  <ul class="details-list">
                    ${contentData.details.map(detail => 
                      `<li>
                        <i class="fas fa-check"></i>
                        <span>${detail}</span>
                      </li>`
                    ).join('')}
                  </ul>
                </div>` : ''
              }
            </div>
          </div>`;
    } else {
        // Cas par défaut si aucun contenu spécifique n'est défini
        content.innerHTML = `
            <h2>${CATEGORIES[faceType]}</h2>
            <p>Bientôt...</p>
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
