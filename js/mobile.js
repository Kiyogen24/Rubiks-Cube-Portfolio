import { CATEGORIES, CUBE_CONTENT } from './utils/constants.js';
import { showInfoCard } from './cards/overlay.js';

// État global pour la navigation
const state = {
    currentFace: 'front',
    faces: ['front', 'right', 'back', 'left', 'top', 'bottom'],
    isAnimating: false
};

// Initialisation de la version mobile
export function initMobile() {
    console.log("Initialisation mobile...");  // Debug
    createInitialFace();
    setupNavigation();
}

function createInitialFace() {
    const cubeSection = document.getElementById('cube-section');
    
    // Création de la face
    const face = document.createElement('div');
    face.className = 'cube-face-mobile';
    face.setAttribute('data-face', state.currentFace);
    
    // Création des cubies
    for (let i = 0; i < 9; i++) {
        const cubie = document.createElement('div');
        cubie.className = 'cubie-mobile';
        cubie.setAttribute('data-position', i);
        face.appendChild(cubie);
    }
    
    // Mise à jour du contenu
    cubeSection.querySelector('.cube-face-mobile')?.remove();
    cubeSection.appendChild(face);
    updateFaceContent(state.currentFace);
    updateNavigationUI(state.currentFace);
}

function setupNavigation() {
    const prevButton = document.querySelector('.prev-face');
    const nextButton = document.querySelector('.next-face');

    prevButton.addEventListener('click', () => navigateFace('prev'));
    nextButton.addEventListener('click', () => navigateFace('next'));

    // Gestion du swipe
    let touchStartX = 0;
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        
        if (Math.abs(diff) > 50) {
            navigateFace(diff > 0 ? 'prev' : 'next');
        }
    });

    // Configuration des cubies
    setupCubies();

    const navScroll = document.querySelector('.cube-nav-scroll');
    let isScrolling = false;
    let startX;
    let scrollLeft;

    navScroll.addEventListener('touchstart', (e) => {
        isScrolling = true;
        startX = e.touches[0].pageX - navScroll.offsetLeft;
        scrollLeft = navScroll.scrollLeft;
    });

    navScroll.addEventListener('touchmove', (e) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.touches[0].pageX - navScroll.offsetLeft;
        const walk = (x - startX) * 2;
        navScroll.scrollLeft = scrollLeft - walk;
    });

    navScroll.addEventListener('touchend', () => {
        isScrolling = false;
    });

    // Gestion des clics sur les items de navigation
    document.querySelectorAll('.cube-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetFace = item.dataset.face;
            if (targetFace !== state.currentFace) {
                const direction = state.faces.indexOf(targetFace) > state.faces.indexOf(state.currentFace) ? 'next' : 'prev';
                navigateFace(direction);
            }
        });
    });
}

// Navigation entre les faces
function navigateFace(direction) {
    if (state.isAnimating) return;

    const currentIndex = state.faces.indexOf(state.currentFace);
    let nextIndex;

    if (direction === 'next') {
        nextIndex = (currentIndex + 1) % state.faces.length;
    } else {
        nextIndex = (currentIndex - 1 + state.faces.length) % state.faces.length;
    }

    const nextFace = state.faces[nextIndex];
    
    // Centrer l'item de navigation actif
    const navItem = document.querySelector(`.cube-nav-item[data-face="${nextFace}"]`);
    const navScroll = document.querySelector('.cube-nav-scroll');
    
    navItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
    });

    updateNavigationUI(nextFace);
    animateFaceTransition(state.currentFace, nextFace, direction);
    state.currentFace = nextFace;
}

// Animation de transition entre les faces
function animateFaceTransition(currentFace, nextFace, direction) {
    if (state.isAnimating) return;
    state.isAnimating = true;

    const currentElement = document.querySelector('.cube-face-mobile');
    const nextElement = currentElement.cloneNode(true);
    nextElement.setAttribute('data-face', nextFace);

    // Positionnement initial
    nextElement.style.transform = `translateX(${direction === 'next' ? '100%' : '-100%'})`;
    currentElement.parentNode.appendChild(nextElement);

    // Mise à jour du contenu
    setupCubies(nextElement);
    updateFaceContent(nextFace, nextElement);

    // Animation
    requestAnimationFrame(() => {
        currentElement.style.transform = `translateX(${direction === 'next' ? '-100%' : '100%'})`;
        nextElement.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            currentElement.remove();
            state.isAnimating = false;
        }, 300);
    });
}

// Mise à jour du contenu d'une face
function updateFaceContent(face, element = document.querySelector('.cube-face-mobile')) {
    const cubies = element.querySelectorAll('.cubie-mobile');
    
    cubies.forEach((cubie, index) => {
        const content = CUBE_CONTENT[face]?.[index];
        
        if (content?.hasContent) {
            cubie.setAttribute('data-has-content', 'true');
            cubie.setAttribute('data-content-id', index);
        } else {
            cubie.removeAttribute('data-has-content');
            cubie.removeAttribute('data-content-id');
        }
    });
}

// Configuration des interactions avec les cubies
function setupCubies(element = document.querySelector('.cube-face-mobile')) {
    const cubies = element.querySelectorAll('.cubie-mobile');
    
    cubies.forEach(cubie => {
        cubie.addEventListener('click', () => {
            const position = cubie.getAttribute('data-position');
            const face = element.getAttribute('data-face');
            
            if (cubie.hasAttribute('data-has-content')) {
                showInfoCard(null, face, position);
            }
        });
    });
}

function updateNavigationUI(currentFace) {
    document.querySelectorAll('.cube-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.face === currentFace);
    });
}


// Initialisation de la page mobile
document.addEventListener('DOMContentLoaded', initMobile);

window.addEventListener('error', function(e) {
    console.error('Erreur globale:', e.error);
});