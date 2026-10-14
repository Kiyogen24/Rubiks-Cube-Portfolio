// Point d'entrée de la page principale
import { setupTheme } from './ui/theme.js';
import { setupLoader } from './ui/loader.js';
import { createScene, startRenderLoop } from './cube/scene.js';
import { createRubiksCube } from './cube/cube.js';
import { setupGame } from './cube/game.js';
import { setupMenu } from './ui/menu.js';
import { createOverlay } from './cards/overlay.js';
import { setupNavigation } from './cube/navigation.js';
import { setupInput } from './cube/input.js';
import { setupIdle } from './cube/idle.js';
import { setupStickerImages } from './cube/sticker-images.js';
import { setupLanguage } from './i18n.js';

setupTheme();
setupLoader();
createScene();
createRubiksCube();
setupGame(); // bouton Mélanger / Résoudre
setupMenu(); // menu, bouton Retour, liens rapides
createOverlay(); // fond des cartes d'information
setupNavigation(); // défilement entre les sections
setupInput(); // souris : clics, glissements, survol
setupIdle(); // mouvement au repos
setupStickerImages(); // images des contenus sur les stickers de la face tournée vers l'écran
setupLanguage();
startRenderLoop();
