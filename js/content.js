// Contenu des stickers (utils/constants.js) et sa mise en forme dans les cartes
import { CUBE_CONTENT } from './utils/constants.js';
import { getLang } from './i18n.js';
import { FACES } from './cube/geometry.js';

// Contenu d'un sticker (« face_case »), dans la langue de la page
export function item(key) {
  const [face, cell] = key.split('_');
  const it = CUBE_CONTENT[face]?.[cell];
  if (!it) return null;
  return getLang() === 'en' && it.i18n?.en ? { ...it, ...it.i18n.en } : it;
}

// Stickers de chaque face, dans l'ordre des cases
export const KEYS = Object.fromEntries(
  FACES.map((face) => [
    face,
    Object.keys(CUBE_CONTENT[face] || {})
      .sort((a, b) => a - b)
      .map((cell) => `${face}_${cell}`),
  ]),
);

// « Titre - Organisme » → [titre, organisme]
export function splitTitle(title = '') {
  const parts = title.trim().split(' - ');
  return parts.length > 1 ? [parts.slice(0, -1).join(' - '), parts[parts.length - 1]] : [title.trim(), ''];
}
export const formatPeriod = (period) => period.replace(/\s-\s/g, ' – ');

// Titre d'un sticker : celui de sa fiche HTML s'il en a une (il est traduit), sinon son titre
export function titleOf(key) {
  const d = item(key);
  const h2 = d.htmlContent && d.htmlContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  return (h2 ? h2[1].replace(/<[^>]+>/g, '') : d.title || '').trim();
}

// Nom donné au survol : l'entreprise pour une expérience, le titre sinon
export function tagText(key) {
  const [title, org] = splitTitle(titleOf(key));
  return org && key.startsWith('back') ? org : title;
}

// Sticker suivant de la même face qui a une carte
export function nextKey(key) {
  const keys = KEYS[key.split('_')[0]].filter((k) => item(k).hasContent);
  if (keys.length < 2) return null;
  return keys[(keys.indexOf(key) + 1) % keys.length];
}

// Détails d'une carte : des liens en pastilles, des « clé : valeur » en grille, des fonctionnalités en blocs,
// sinon une liste (en pastilles si elle n'a que des mots courts)
const KEY_VALUE = /^([^<:]{1,20}?)\s*:\s*(.+)$/;
const FEATURE = /^<strong>([^<]+?)\s*:?\s*<\/strong>\s*:?\s*(.+)$/;
export function detailsBlock(items, label) {
  if (!items?.length) return '';
  if (items.every((d) => d.trim().startsWith('<a '))) {
    return `<ul class="chips">${items.map((d) => `<li>${d}</li>`).join('')}</ul>`;
  }
  if (items.filter((d) => KEY_VALUE.test(d)).length >= 3) {
    const rows = items.map((d) => {
      const m = d.match(KEY_VALUE);
      if (!m) return `<div class="wide"><dd>${d}</dd></div>`;
      const wide = m[2].replace(/<[^>]+>/g, '').length > 22 ? ' class="wide"' : '';
      return `<div${wide}><dt>${m[1]}</dt><dd>${m[2].replace(/<\/?strong>/g, '')}</dd></div>`;
    });
    return `<dl class="facts">${rows.join('')}</dl>`;
  }
  if (items.every((d) => FEATURE.test(d))) {
    const rows = items.map((d) => {
      const [, name, text] = d.match(FEATURE);
      return `<li><strong>${name}</strong><span>${text}</span></li>`;
    });
    return `<ul class="features">${rows.join('')}</ul>`;
  }
  const short = items.every((d) => !/[<:]/.test(d) && d.length <= 32);
  return `<h3>${label}</h3><ul class="${short ? 'chips' : 'points'}">${items.map((d) => `<li>${d}</li>`).join('')}</ul>`;
}

// Fiches projets écrites en HTML : on garde le texte, les figures et les liens, sans l'en-tête ni les icônes ;
// les liens du projet passent en boutons au pied de la carte
export function longBody(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const content = tpl.content;
  content.querySelectorAll('.card-header, hr, i').forEach((el) => el.remove());
  const links = [...content.querySelectorAll('a.project-link')].map((a) => {
    a.remove();
    return { href: a.getAttribute('href'), label: a.textContent.trim() };
  });
  content.querySelectorAll('a').forEach((a) => {
    a.target = '_blank';
    a.rel = 'noopener';
  });
  content.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
    img.decoding = 'async';
  });
  content.querySelectorAll('.project-summary p').forEach((p) => p.classList.add('lead'));
  const box = document.createElement('div');
  box.append(content);
  return { html: box.innerHTML, links };
}
