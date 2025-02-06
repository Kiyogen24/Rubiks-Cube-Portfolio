export class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('lang') || 'fr';
    this.translations = {};
    this.callbacks = [];
  }

  async init() {
    // Importer les traductions
    const { translations } = await import('./translations.js');
    this.translations = translations;
    
    // Initialiser la langue
    this.setLanguage(this.currentLang);
  }

  setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    this.notifySubscribers();
  }

  translate(key, section) {
    return this.translations[this.currentLang]?.[section]?.[key] || key;
  }

  onLanguageChange(callback) {
    this.callbacks.push(callback);
  }

  notifySubscribers() {
    this.callbacks.forEach(callback => callback(this.currentLang));
  }
}