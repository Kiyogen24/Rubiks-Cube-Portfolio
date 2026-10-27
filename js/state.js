// État partagé de la page et petits outils du document
import * as THREE from 'three';
import { TILT, faceForward } from './cube/geometry.js';

export const root = document.documentElement;
export const $ = (selector) => document.querySelector(selector);
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

export const S = {
  phase: 'boot', // boot, loading (le cube sert de chargeur), landing, ready
  mode: 'intro', // intro (le cube vide tourne), explore (au centre, avec les contenus), play
  base: TILT.clone().multiply(faceForward('back')), // orientation du cube
  w: new THREE.Vector3(), // sa vitesse angulaire
  target: null, // orientation visée, ou null pour tourner librement
  drag: null,
  front: null, // face tournée vers soi
  card: null,
  opening: null, // sticker dont la face se tourne avant que sa carte sorte
  width: 1,
  height: 1,
  narrow: false,
  scale: { x: 1, v: 0 },
  view: { shift: { x: 0.21, v: 0 }, lift: { x: 0.04, v: 0 }, dist: { x: 11, v: 0 } },
  scrollP: 0, // 0 à l'accueil, 1 sur le cube
  contactP: 0, // 0 sur le cube, 1 sur « Contactez-moi »
  contactTextTop: 0, // haut du texte de « Contactez-moi » dans sa page (le cube du téléphone tient au-dessus)
  hovered: null,
  markDirty: true,
  // jeu
  zoom: 1, // distance de la caméra : moins de 1 pour rapprocher le cube (molette, pincement)
  beforePlay: null, // orientation du cube avant de jouer, retrouvée avec « Terminé »
  layer: null,
  queue: [],
  queueDone: null,
  moves: [],
  userMoves: 0,
  solving: false,
  status: '',
  scrambled: false, // mélangé avec le bouton : le résoudre à la main mérite une vraie fête
  shuffledAt: 0,
  score: null, // { moves, time } de la dernière résolution à la main
  solver: stored('solver') === 'kociemba' ? 'kociemba' : 'neural', // méthode choisie pour « Résoudre »
  neuralUsable: null, // mon réseau de neurones peut-il tourner ici (WebGPU) ? null tant qu'on ne le sait pas
  solves: { neural: null, kociemba: null }, // { moves, quarters, ms } de la dernière résolution
  solverPanel: null, // le panneau des méthodes : 'choose' (ouvert par « Résoudre »), puis 'result', ou fermé
  celebrating: false,
  flourish: null, // tour de joie du cube entier
};

// localStorage peut être indisponible (navigation privée, stockage bloqué)
export function stored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // rien à retenir
  }
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Attend qu'une condition soit vraie (vérifiée à chaque image), au plus `timeout` ms
export function waitFor(test, timeout) {
  return new Promise((resolve) => {
    const start = performance.now();
    const check = () => (test() || performance.now() - start > timeout ? resolve() : requestAnimationFrame(check));
    check();
  });
}
