// Textes de l'interface en français et en anglais ; le contenu des stickers est dans utils/constants.js
import { AGE } from './utils/constants.js';
import { stored, store } from './state.js';

const TOUCH = window.matchMedia('(pointer: coarse)').matches; // téléphone, tablette

// 45 s, 2 min 13 s
function duration(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
}

const UI = {
  fr: {
    tagline:
      'Élève ingénieur en intelligence artificielle, actuellement à l’Université de Tokyo, je cherche un stage de 6 mois en apprentissage par renforcement ou en machine learning appliqué, dès mars 2027.',
    cv: 'Mon CV',
    about: 'À propos',
    play: 'Jouer',
    cubeTitle: 'Le cube',
    shuffle: 'Mélanger',
    solve: 'Résoudre',
    done: 'Terminé',
    playHint: TOUCH
      ? 'Un doigt tourne une rangée, deux doigts tournent le cube.'
      : 'Glissez un sticker pour tourner sa rangée, ou tapez U, D, L, R, F, B (Maj : sens inverse).',
    shuffling: 'Mélange…',
    shuffled: 'À vous de jouer',
    solving: 'Résolution…',
    bravo: 'Résolu, bravo !',
    score: (n, ms) => `${n} ${n > 1 ? 'mouvements' : 'mouvement'} · ${duration(ms)}`,
    items: (n) => `${n} ${n > 1 ? 'contenus' : 'contenu'}`,
    next: (name) => `Suivant : ${name}`,
    close: 'Fermer',
    theme: 'Changer de thème',
    language: 'Langue',
    openPdf: 'Ouvrir le PDF',
    highlights: 'Points clés',
    aboutTitle: 'À propos de moi',
    age: `${AGE} ans`,
    facts: 'En bref',
    loading: 'Chargement du cube',
    contactTitle: 'Contactez-moi',
    contactLead:
      'Si vous avez apprécié interagir avec mon portfolio et découvrir mes projets, n’hésitez pas à m’envoyer un mail ! Que ce soit pour une offre, une question sur un projet ou simplement l’envie d’échanger, je vous répondrai avec plaisir !',
    contactTitleSolved: 'Vous avez résolu le Cube ?!',
    contactLeadSolved: (n) =>
      `En ${n} ${n > 1 ? 'mouvements' : 'mouvement'}, vous venez de remettre en ordre un casse-tête à plus de 43 trillions de combinaisons… fascinant ! Si vous avez aimé jouer avec mon portfolio, n’hésitez pas à m’envoyer un mail. Que ce soit pour une offre, une question sur un projet ou simplement l’envie d’échanger, je vous répondrai avec plaisir !`,
    messageLabel: 'Votre message',
    messagePlaceholder: 'Bonjour Romain, …',
    writeMe: 'Écrire un mail',
    sendMail: 'Envoyer le mail',
    copyMail: 'Copier l’adresse',
    copied: 'Adresse copiée',
    mailSubject: 'Contact depuis votre portfolio',
    mailSubjectSolved: 'J’ai résolu le cube de votre portfolio',
    faces: 'Faces du cube',
    cube: 'Rubik’s cube : chaque face est une partie du portfolio. Faites-le glisser ou tournez-le avec les flèches, Entrée ouvre la face devant.',
    labels: {
      top: 'À propos',
      front: 'Compétences',
      right: 'Projets',
      back: 'Expériences',
      left: 'Formation',
      bottom: 'CV',
    },
  },
  en: {
    tagline:
      'AI engineering student, currently at the University of Tokyo, looking for a 6-month internship in reinforcement learning or applied machine learning from March 2027.',
    cv: 'My CV',
    about: 'About me',
    play: 'Play',
    cubeTitle: 'The cube',
    shuffle: 'Shuffle',
    solve: 'Solve',
    done: 'Done',
    playHint: TOUCH
      ? 'One finger turns a row, two fingers turn the cube.'
      : 'Drag a sticker to turn its row, or type U, D, L, R, F, B (Shift: reverse).',
    shuffling: 'Shuffling…',
    shuffled: 'Your turn',
    solving: 'Solving…',
    bravo: 'Solved, well done!',
    score: (n, ms) => `${n} ${n > 1 ? 'moves' : 'move'} · ${duration(ms)}`,
    items: (n) => `${n} ${n > 1 ? 'items' : 'item'}`,
    next: (name) => `Next: ${name}`,
    close: 'Close',
    theme: 'Switch theme',
    language: 'Language',
    openPdf: 'Open the PDF',
    highlights: 'Highlights',
    aboutTitle: 'About me',
    age: `${AGE} years old`,
    facts: 'In short',
    loading: 'Loading the cube',
    contactTitle: 'Get in touch',
    contactLead:
      'If you enjoyed exploring my portfolio and discovering my projects, feel free to send me an email! Whether it’s for an offer, a question about a project or simply to chat, I’ll be happy to reply!',
    contactTitleSolved: 'You solved the Cube?!',
    contactLeadSolved: (n) =>
      `In ${n} ${n > 1 ? 'moves' : 'move'}, you just put back in order a puzzle with over 43 quintillion combinations… fascinating! If you enjoyed playing with my portfolio, feel free to send me an email. Whether it’s for an offer, a question about a project or simply to chat, I’ll be happy to reply!`,
    messageLabel: 'Your message',
    messagePlaceholder: 'Hi Romain, …',
    writeMe: 'Write an email',
    sendMail: 'Send the email',
    copyMail: 'Copy address',
    copied: 'Address copied',
    mailSubject: 'Contact from your portfolio',
    mailSubjectSolved: 'I solved the cube on your portfolio',
    faces: 'Faces of the cube',
    cube: 'Rubik’s cube: each face is a part of the portfolio. Drag it or turn it with the arrow keys; Enter opens the face in front.',
    labels: {
      top: 'About',
      front: 'Skills',
      right: 'Projects',
      back: 'Experience',
      left: 'Education',
      bottom: 'CV',
    },
  },
};

let lang = stored('lang') || ((navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en');

export const getLang = () => lang;
export const t = () => UI[lang];
export function setLang(next) {
  lang = next;
  store('lang', next);
}
