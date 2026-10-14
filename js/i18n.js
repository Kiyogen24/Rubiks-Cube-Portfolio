import { app } from './globals.js';
import { LanguageManager } from './language-manager.js';
import { CUBE_CONTENT, SITE_I18N } from './utils/constants.js';
import { updateGameButton } from './cube/game.js';
import { setupHints, positionHints } from './ui/hints.js';
import { setStickerLabelsLanguage } from './cube/sticker-labels.js';

// Clé de la description de chaque entrée du menu
const MENU_DESC = {
  top: 'about',
  front: 'skills',
  right: 'projects',
  back: 'experience',
  left: 'education',
  bottom: 'resume',
};

// Applique les traductions de la langue choisie à la page
function applyTranslations(lang) {
  const t = app.langManager.translations[lang] || {};
  const ui = t.ui || {};
  const setText = (selector, text) => {
    const el = document.querySelector(selector);
    if (el && text) el.textContent = text;
  };

  document.documentElement.lang = lang;
  updateGameButton();

  // Noms accessibles des commandes sans texte
  const setLabel = (element, text) => element && text && element.setAttribute('aria-label', text);
  setLabel(app.resetButton, ui.resetBtn);
  setLabel(document.querySelector('.theme-btn'), ui.themeToggle);
  setLabel(app.langBtn, ui.langToggle);
  setLabel(app.renderer.domElement, ui.cubeLabel);
  setLabel(app.menu, ui.menuLabel);

  // Aides
  setText('#click-hint .hint-text', ui.clickHint);
  setText('#nav-hint .hint-text', ui.navHint);
  setText('.scroll-text', ui.scrollText);

  setStickerLabelsLanguage(lang);

  // Menu
  document.querySelectorAll('.menu-item').forEach((item) => {
    const face = item.dataset.face;
    if (t.categories?.[face]) item.querySelector('.menu-item__title').textContent = t.categories[face];
    const desc = ui.menuDesc?.[MENU_DESC[face]];
    if (desc) item.querySelector('.menu-item__desc').textContent = desc;
  });

  // Textes de la page : titre, chargement, note pour mobile, introduction
  const site = SITE_I18N[lang] || SITE_I18N.fr;
  document.title = site.pageTitle;
  setText('.loading-text', site.loadingText);
  setText('#device-note', site.deviceNote);
  document.querySelector('.typing-text').innerHTML = site.typingText;
  document.querySelector('.intro-text').innerHTML = site.intro.paragraphs.map((p) => `<p>${p}</p>`).join('<br>');

  // Pied de page
  const footTitles = document.querySelectorAll('.footer-title');
  [ui.contact, ui.socialNetworks, ui.navigation].forEach((text, i) => {
    if (footTitles[i] && text) footTitles[i].textContent = text;
  });

  // Lien de téléchargement du CV : fichier et libellé selon la langue
  const cvLink = document.querySelector('.social-link[download]');
  if (cvLink) {
    const cv = CUBE_CONTENT.bottom[4];
    cvLink.href = cv.i18n?.[lang]?.file || cv.file;
    if (ui.downloadResume) cvLink.querySelector('span').textContent = ui.downloadResume;
  }

  // Liens rapides
  document.querySelectorAll('.quick-link').forEach((a) => {
    const face = a.dataset.face;
    if (!face) a.textContent = ui.homeLabel || (lang === 'fr' ? 'Accueil' : 'Home');
    else if (t.categories?.[face]) a.textContent = t.categories[face];
  });

  app.langBtn.querySelector('.lang-code').textContent = lang.toUpperCase();
  positionHints();
}

// Gestionnaire de langue et bouton FR / EN
export function setupLanguage() {
  const langManager = new LanguageManager();
  app.langManager = langManager;

  // Bouton de langue, à côté du bouton de thème
  app.langBtn = document.createElement('button');
  app.langBtn.className = 'lang-btn';
  app.langBtn.setAttribute('aria-label', 'Langue');
  app.langBtn.innerHTML = `<span class="lang-code">${langManager.currentLang.toUpperCase()}</span>`;
  app.langBtn.addEventListener('click', () => {
    langManager.setLanguage(langManager.currentLang === 'fr' ? 'en' : 'fr');
  });
  document.querySelector('.theme-btn').after(app.langBtn);

  // Les aides utilisent les traductions : elles sont créées une fois celles-ci chargées
  langManager
    .init()
    .then(() => {
      applyTranslations(langManager.currentLang);
      langManager.onLanguageChange(applyTranslations);
      setupHints();
    })
    .catch((e) => console.warn('LanguageManager init failed', e));
}
