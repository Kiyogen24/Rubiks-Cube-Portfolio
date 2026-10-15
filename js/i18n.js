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
      : 'Faites glisser un sticker pour tourner sa rangée.',
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
    contactTitle: 'Écrivez-moi',
    contactLead:
      'Je cherche un stage de 6 mois en apprentissage par renforcement ou en machine learning appliqué, dès mars 2027. Une offre, une question sur un projet ou simplement l’envie d’échanger : je vous répondrai avec plaisir.',
    contactTitleSolved: 'Cube résolu.\nEt maintenant ?',
    contactLeadSolved: (n) =>
      `En ${n} ${n > 1 ? 'mouvements' : 'mouvement'}, vous venez de remettre en ordre un casse-tête à plus de 43 trillions de combinaisons. C’est exactement le genre de problème qui me motive : écrivez-moi, et attaquons-nous ensemble au prochain.`,
    writeMe: 'Écrire un mail',
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
    playHint: TOUCH ? 'One finger turns a row, two fingers turn the cube.' : 'Drag a sticker to turn its row.',
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
    contactTitle: 'Write to me',
    contactLead:
      'I’m looking for a 6-month internship in reinforcement learning or applied machine learning, starting March 2027. An offer, a question about a project or just a chat: I’ll be glad to hear from you.',
    contactTitleSolved: 'Cube solved.\nWhat’s next?',
    contactLeadSolved: (n) =>
      `In ${n} ${n > 1 ? 'moves' : 'move'}, you just put back in order a puzzle with over 43 quintillion combinations. That’s exactly the kind of problem that drives me: write to me, and let’s take on the next one together.`,
    writeMe: 'Send an email',
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
