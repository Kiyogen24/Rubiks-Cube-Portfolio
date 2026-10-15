// Les cartes : celle d'un sticker sort de son image une fois la face tournée vers soi ;
// « À propos » et « Mon CV » sortent de leur bouton, et y retournent
import { S, $, reduced, waitFor } from '../state.js';
import { getLang, t } from '../i18n.js';
import { SITE_I18N } from '../utils/constants.js';
import { detailsBlock, formatPeriod, item, longBody, nextKey, splitTitle, tagText, titleOf } from '../content.js';
import { TILT } from '../cube/geometry.js';
import { clearHover } from '../cube/hover.js';
import { angleBetween, clamp, easeOut, lerp, springStep } from '../cube/math.js';
import { frontalFor } from '../cube/orientation.js';
import { canvas, framingTarget, stickerRect, tileByKey } from '../cube/scene.js';
import { updateCubeUi } from '../ui/controls.js';

const card = $('#card');
const scroll = $('#card-scroll');
const body = $('#card-body');
const foot = $('#card-foot');
const tileSlot = $('#card-tile');
const closeButton = $('#card-close');
const LINKS = {
  linkedin: 'https://www.linkedin.com/in/romain-goldenchtein/',
  github: 'https://github.com/Kiyogen24',
  mail: 'mailto:r.goldenchtein@proton.me',
};
const ARROW =
  '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4L12.5 8l-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
let openToken = 0;

function linkButton(href, label, kind = 'quiet') {
  const a = document.createElement('a');
  a.className = `btn small ${kind}`;
  a.href = href;
  if (!href.startsWith('mailto:')) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  a.textContent = label;
  return a;
}

function pill(text, face) {
  const el = document.createElement('span');
  el.className = 'pill';
  if (face) {
    el.innerHTML = `<span class="dot" style="--c: var(--face-${face})"></span><span></span>`;
    el.lastChild.textContent = text;
  } else {
    el.textContent = text;
  }
  return el;
}

// Remplit la carte : un sticker (« face_case »), « about » ou « cv »
function fillCard(kind) {
  const ui = t();
  const lang = getLang();
  const footItems = [];
  const pills = [];
  let face;
  let img;
  let title;
  let org = '';
  if (kind === 'about') {
    face = 'top';
    img = 'assets/pp.png';
    title = ui.aboutTitle;
    org = 'Romain Goldenchtein';
    pills.push(ui.age);
    const p = SITE_I18N[lang].intro.paragraphs;
    body.innerHTML = `<p class="lead">${p[1]}</p><p>${p[2]}</p><h3>${ui.facts}</h3>${detailsBlock(item('top_6').details, ui.facts)}`;
    footItems.push(
      linkButton(LINKS.linkedin, 'LinkedIn'),
      linkButton(LINKS.github, 'GitHub'),
      linkButton(LINKS.mail, 'Email'),
    );
  } else if (kind === 'cv' || kind === 'bottom_4') {
    const d = item('bottom_4');
    face = 'bottom';
    img = d.preview;
    title = d.title;
    // le CV lui-même, en image (scripts/cv-images.py), et le PDF à ouvrir
    body.innerHTML = `<figure class="cv-sheet"><img src="assets/cv/cv-${lang}-1.webp" width="1300" height="1839" alt=""></figure>`;
    body.querySelector('img').alt = title;
    footItems.push(linkButton(d.file, ui.openPdf, 'primary'));
  } else {
    const d = item(kind);
    face = kind.split('_')[0];
    img = d.preview;
    [title, org] = splitTitle(titleOf(kind));
    if (d.period) pills.push(formatPeriod(d.period));
    if (d.htmlContent) {
      const long = longBody(d.htmlContent);
      body.innerHTML = long.html;
      long.links.forEach((l, i) => footItems.push(linkButton(l.href, l.label, i === 0 ? 'primary' : 'quiet')));
    } else {
      const lead = d.description ? `<p class="lead">${d.description}</p>` : '';
      body.innerHTML = lead + detailsBlock(d.details, d.infos || ui.highlights);
    }
    if (d.link) footItems.push(linkButton(d.link, d.title.trim(), 'primary'));
    const next = nextKey(kind);
    if (next) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'next';
      b.innerHTML = `<span></span>${ARROW}`;
      b.firstChild.textContent = ui.next(tagText(next));
      b.addEventListener('click', () => openSticker(next, S.card?.opener));
      footItems.push(Object.assign(document.createElement('span'), { className: 'spacer' }), b);
    }
  }
  card.style.setProperty('--c', face === 'top' ? 'var(--socket-top)' : `var(--face-${face})`);
  card.dataset.accent = face; // la carte prend la couleur de sa face (css/main.css)
  $('#card-img').src = img;
  $('#card-title').textContent = title;
  $('#card-org').textContent = org;
  $('#card-org').hidden = !org;
  $('#card-meta').replaceChildren(...pills.map((p) => pill(p)), pill(ui.labels[face], face));
  foot.replaceChildren(...footItems);
  foot.hidden = !footItems.length;
  scroll.scrollTop = 0;
}

// L'image qui vole entre le sticker et la carte
function makeFlyer(src, rect) {
  const f = document.createElement('div');
  f.className = 'flyer';
  f.innerHTML = '<img alt="">';
  f.firstChild.src = src;
  Object.assign(f.style, {
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    left: `${rect.left}px`,
    top: `${rect.top}px`,
  });
  document.body.append(f);
  return f;
}

// Retraits d'un rectangle dans la carte : la carte s'ouvre à partir de lui
function insetFrom(rect, box) {
  return {
    top: clamp(rect.top - box.top, 0, box.height),
    right: clamp(box.right - rect.right, 0, box.width),
    bottom: clamp(box.bottom - rect.bottom, 0, box.height),
    left: clamp(rect.left - box.left, 0, box.width),
  };
}

// Carte d'un sticker : la face se tourne d'abord vers soi, ensuite l'image sort du sticker
export async function openSticker(key, opener) {
  const tile = tileByKey[key];
  const d = item(key);
  if (!tile || !d?.hasContent || S.mode !== 'explore' || S.phase !== 'ready') return;
  if (S.card?.key === key && S.card.target === 1) return;
  const token = ++openToken;
  if (S.card) {
    closeCard(true);
    await waitFor(() => !S.card, 900);
    if (token !== openToken) return;
  }
  clearHover();
  S.opening = key;
  S.target = frontalFor(tile.face);
  S.w.multiplyScalar(0.3);
  await waitFor(
    () => angleBetween(S.base, S.target) < 0.05 && Math.abs(S.view.dist.x - framingTarget().dist) < 0.25,
    900,
  );
  if (token !== openToken || S.mode !== 'explore') {
    S.opening = null;
    return;
  }
  fillCard(key);
  card.hidden = false;
  scroll.scrollTop = 0; // une carte s'ouvre toujours en haut
  const slot = tileSlot.getBoundingClientRect();
  const box = card.getBoundingClientRect();
  const flyer = makeFlyer(d.preview, slot);
  tileSlot.style.visibility = 'hidden';
  tile.hidden = true;
  tile.mesh.visible = false;
  S.card = {
    key,
    origin: 'sticker',
    tile,
    flyer,
    from: stickerRect(tile),
    slot,
    inset: insetFrom(slot, box),
    radius: 15,
    p: { x: 0, v: 0 },
    target: 1,
    opener: opener || canvas,
    frontal: S.target.clone(),
    scrollAt: S.scrollP,
  };
  S.opening = null;
  updateCubeUi();
  drawCard();
  $('#card-title').focus({ preventScroll: true });
}

// Carte « À propos » ou « Mon CV » ; un second clic sur le bouton la referme
export async function openFromButton(kind, button) {
  if (S.phase !== 'ready') return;
  if (S.card?.key === kind && S.card.target === 1) {
    closeCard();
    return;
  }
  const token = ++openToken;
  if (S.card) {
    closeCard(true);
    await waitFor(() => !S.card, 900);
    if (token !== openToken) return;
  }
  clearHover();
  fillCard(kind);
  card.hidden = false;
  scroll.scrollTop = 0;
  const box = card.getBoundingClientRect();
  const from = button.getBoundingClientRect();
  S.card = {
    key: kind,
    origin: 'button',
    button,
    inset: insetFrom(from, box),
    radius: from.height / 2,
    p: { x: 0, v: 0 },
    target: 1,
    opener: button,
    scrollAt: S.scrollP,
  };
  updateCubeUi();
  drawCard();
  $('#card-title').focus({ preventScroll: true });
}

// `fast` : fermeture demandée par autre chose (défilement, autre carte, jeu) ; le focus ne revient pas au bouton
export function closeCard(fast = false) {
  const c = S.card;
  if (!c || c.target === 0) return;
  c.target = 0;
  c.fast = fast;
  if (c.origin === 'sticker') {
    c.from = stickerRect(c.tile); // le sticker a pu bouger depuis l'ouverture
    if (!c.flyer) {
      c.slot = tileSlot.getBoundingClientRect();
      c.flyer = makeFlyer(item(c.key).preview, c.slot);
    }
    tileSlot.style.visibility = 'hidden';
  } else {
    c.inset = insetFrom(c.button.getBoundingClientRect(), card.getBoundingClientRect());
  }
}

function drawCard() {
  const c = S.card;
  const p = clamp(c.p.x, 0, 1.02);
  if (c.origin === 'sticker' && c.flyer) {
    const s = lerp(c.from.w / c.slot.width, 1, p);
    const x = lerp(c.from.x - c.slot.left, 0, p);
    const y = lerp(c.from.y - c.slot.top, 0, p);
    c.flyer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
  }
  // la carte s'ouvre à partir de l'image du sticker, ou du bouton
  const q = easeOut(clamp(c.origin === 'sticker' ? (p - 0.1) / 0.75 : p));
  const i = c.inset;
  const r = lerp(c.radius, 28, q);
  card.style.clipPath = `inset(${i.top * (1 - q)}px ${i.right * (1 - q)}px ${i.bottom * (1 - q)}px ${i.left * (1 - q)}px round ${r}px)`;
  const show = clamp((p - (c.origin === 'sticker' ? 0.45 : 0.3)) / 0.4);
  scroll.style.opacity = String(c.origin === 'sticker' ? 1 : show);
  body.style.opacity = String(show);
  foot.style.opacity = String(show);
  closeButton.style.opacity = String(clamp((p - 0.55) / 0.35));
  // en se fermant, la carte s'efface avant d'arriver au sticker : il ne reste que l'image qui y retourne
  card.style.opacity = c.target === 0 ? String(clamp((p - 0.3) / 0.45)) : '1';
}

export function updateCard(dt) {
  const c = S.card;
  if (!c) return;
  springStep(c.p, c.target, dt, 1, reduced.matches ? 0.16 : c.fast ? 0.26 : 0.42);
  drawCard();
  if (c.target === 1 && c.flyer && c.p.x > 0.995) {
    c.flyer.remove();
    c.flyer = null;
    tileSlot.style.visibility = '';
  }
  if (c.target === 0 && c.p.x < 0.006) {
    c.flyer?.remove();
    if (c.tile) c.tile.hidden = false;
    card.hidden = true;
    card.style.clipPath = '';
    card.style.opacity = '';
    tileSlot.style.visibility = '';
    S.card = null;
    // la face lue reprend sa vue de trois quarts
    if (c.origin === 'sticker' && S.mode === 'explore') S.target = TILT.clone().multiply(c.frontal);
    updateCubeUi();
    if (c.opener && document.body.contains(c.opener) && !c.fast) c.opener.focus({ preventScroll: true });
  }
}

// La langue a changé : la carte ouverte est réécrite
export function refreshCard() {
  if (S.card && S.card.target === 1) fillCard(S.card.key);
}
