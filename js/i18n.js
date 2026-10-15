// Textes de l'interface en français et en anglais ; le contenu des stickers est dans utils/constants.js
import { AGE } from './utils/constants.js';
import { stored, store } from './state.js';

const TOUCH = window.matchMedia('(pointer: coarse)').matches; // téléphone, tablette

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
