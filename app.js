import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from './node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Variables globales de base
let scene, camera, renderer, controls;
let rubiksCube;
const cubies = [];
let resetButton;
let originalMaterials = new Map(); // Pour stocker les matériaux originaux
let activeInfoCard = null; // Ajouter au début du fichier avec les autres variables globales
let overlay = null; // Ajouter aux variables globales
let isModalOpen = false; // Ajouter aux variables globales en haut du fichier
let currentSection = 'intro';
let isScrolling = false;
let menuBtn, menu; // Ajouter aux variables globales

// Paramètres du cube
const cubeSize = 1;
const gap = 0.001;
const positions = [-1, 0, 1];

// Couleurs pour les stickers
const stickerColors = {
  front: '#B90000',  // Rouge 
  back: '#ff8000',   // Orange 
  top: '#FFFFFF',    // Blanc 
  bottom: '#ffff00', // Jaune  
  right: '#000FFF',  // Bleu 
  left: '#00994C'    // Vert
};

// Ajoutez ces constantes au début du fichier
const CATEGORIES = {
  front: 'Compétences',
  back: 'Expériences',
  top: 'À propos', 
  bottom: 'Mon CV', 
  right: 'Formation',
  left: 'Projets'
};

const CUBE_CONTENT = {
  front: { // **Compétences**
    0: {
      title: "Python",
      description: "Maîtrise du langage et des bibliothèques liées à la data science et à l'IA",
      details: ["NumPy", "Pandas", "TensorFlow", "Keras"],
      icon: "fa-brands fa-python",
      preview: 'assets/previews/skills/python.jpg',
      hasContent: true
    },
    1: {
      title: "JavaScript", 
      icon: "fa-brands fa-js",
      preview: 'assets/previews/skills/javascript.png',
      hasContent: false
    },
    2: {
      title: "React", 
      icon: "fa-brands fa-react",
      preview: 'assets/previews/skills/react.svg',
      hasContent: false
    },
    3: {
      title: "Node.js", 
      icon: "fa-brands fa-node-js",
      preview: 'assets/previews/skills/node.png',
      hasContent: false
    },
    4: {
      title: "Java",
      icon: "fa-brands fa-java",
      preview: 'assets/previews/skills/java.png',
      hasContent: false
    },
    5: {
      title: "C",
      icon: "fa-regular fa-file-code",
      preview: 'assets/previews/skills/c.png',
      hasContent: false
    },
    6: {
      title: "HTML/CSS",
      icon: "fa-brands fa-html5",
      preview: 'assets/previews/skills/html.png',
      hasContent: false
    },
    7: {
      title: "Bases De Données",
      description: "Maîtrise de la gestion des bases de données",
      details: ["SQL", "MongoDB"],
      icon: "fa-solid fa-database",
      preview: 'assets/previews/skills/data_b.png',
      hasContent: true
    },
    8: {
      title: "Pack Office",
      icon: "fa-regular fa-file-word",
      description: "Maîtrise du Pack Office",
      details: ["Word", "Excel", "PowerPoint"],
      preview: 'assets/previews/skills/office.png',
      hasContent: true
    },
  },
  back: { // **Expériences**
    0: {
      title: "Tutorat étudiant",
      period: "02/2024 - 06/2024",
      description: "Indépendant",
      details: ["Accompagnement individuel d'une élève pour améliorer sa compréhension et ses résultats en mathématiques et en physico-chimie.","Développement de compétences pédagogiques et de communication pour rendre les notions scientifiques accessibles."],
      icon: "fa-solid fa-chalkboard-user",
      preview: 'assets/previews/exp/prof.png',
      hasContent: true
    },
    1: {
      title: "Stage ouvrier chez Siemens Mobility France",
      period: "07/2023",
      description: "Assistant logistique",
      details: ["Gestion du magasin.", "Réception physique des marchandises et inspection des colis.", "Préparation des commandes", "Bases en VBA et gestion de projets."],
      icon: "fa-solid fa-industry",
      preview: 'assets/previews/exp/siemens.jpg',
      hasContent: true
    }
    },
    top : {
    6: {
      title: "Moi",
      description: "A propos de moi", 
      details: ["20 ans", "Ecole d'ingénieur"],
      icon: "fa-regular fa-user",
      preview: 'assets/previews/about/person.jpg',
      hasContent: true
    },
    7: {
      title: "Mes passions",
      description: "Les qualités qui me décrivent le mieux", 
      details: ["Echecs", "Danse", "Concours de mémoire", "Musculation"],
      icon: "fa-regular fa-heart",
      preview: 'assets/previews/about/hobbies.png',
      hasContent: true
    },
    8: {
      title: "Soft Skills",
      description: "Les qualités qui me décrivent le mieux", 
      details: ["Curiosité", "Persévérance", "Résolution des problèmes", "Organisé", "Gestion de Projet"],
      icon: "fa-regular fa-lightbulb",
      preview: 'assets/previews/about/soft.avif',
      hasContent: true
    },
    3: {
      title: "GitHub",
      description: "Mon profil GitHub",
      icon: "fa-brands fa-github",
      preview: 'assets/previews/about/github.png',
      hasContent: false,
      link: "https://github.com/Kiyogen24"
    },
    5: {
      title: "LinkedIn",
      description: "Mon profil LinkedIn",
      icon: "fa-brands fa-linkedin",
      preview: 'assets/previews/about/linkedin.png',
      hasContent: false,
      link: "https://www.linkedin.com/in/romain-goldenchtein/"
    }
    },
    bottom: {
    4: {
      title: "Mon CV",
      details: [],
      icon: "fa-regular fa-file-pdf",
      file: true,
      preview: 'assets/previews/cv_pr.png',
      hasContent: true
    }
    },
    left: { // **Projets**
    0: {
      title: "Portfolio",
      icon: "fa-solid fa-cube",
      preview: 'assets/previews/projects/portfolio.png',
      hasContent: true,
      htmlContent: `
    <div class="card-header">
      <i class="fa-solid fa-cube"></i>
      <h2>Portfolio</h2>
      </div>
      <section class="project-summary">
      <p>Ce <strong>Rubik's Cube</strong> est une application web interactive qui présente mon portfolio sous la forme d'un Rubik's Cube en 3D.</p>
      </section>
      <hr>
      <div class="card-content">
      <article class="project-content">
      <p>Chaque face du cube du Rubik's Cube est dédiée à une catégorie spécifique : expériences, projets, passions et compétences. Les carrés individuels sur chaque face représentent des éléments détaillés de ces catégories.</p>
        <h3>Fonctionnalités principales :</h3>
        <ul>
        <li><strong>Interface 3D interactive :</strong> Utilisation de Three.js pour créer et manipuler le Rubik's Cube en trois dimensions, offrant une expérience utilisateur immersive.</li>
        <li><strong>Navigation intuitive :</strong> Les utilisateurs peuvent interagir avec le cube pour explorer différentes sections du portfolio, chaque face fournissant des informations spécifiques.</li>
        <li><strong>Design responsive :</strong> Adaptation de l'affichage pour une expérience optimale sur divers appareils et tailles d'écran.</li>
        </ul>
        <img src="assets/previews/projects/portfolio_2.png" alt="Aperçu du Rubik's Cube en 3D" class="project-image" style="width: 90%; height: auto;">
        <p style="font-style: italic; font-size: 0.8em; text-align: center;">Aperçu de la page du Rubik's Cube en 3D</p>
        <h3>Technologie utilisée :</h3>
        <ul>
        <li><strong>Frontend :</strong> HTML, CSS, JavaScript</li>
        <li><strong>Bibliothèque 3D :</strong> Three.js</li>
        </ul>
        <p><strong>Durée :</strong> 6 mois</p>
        <img src="assets/previews/projects/portfolio_1.png" alt="Aperçu d'une des faces" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
        <p style="font-style: italic; font-size: 0.8em; text-align: center;">Aperçu d'une des faces avec effet de survolement</p>
        <p>Le site est conçu avec une approche 3D, offrant une expérience utilisateur immersive et une navigation intuitive à travers mes différents projets et compétences.</p>
        <a href="https://github.com/Kiyogen24/Rubiks-Cube-Portfolio" target="_blank" class="project-link">Voir le Projet</a>
      </article>
      </div>
    `
    },
    1: {
      title: "Prédiction de défauts de paiement",
      icon: "fa-solid fa-chart-simple",
      preview: 'assets/previews/projects/ia01_1.png',
      hasContent: true,
      htmlContent: `
      <div class="card-header">
        <i class="fa-solid fa-chart-line"></i>
        <h2>Prédiction de défauts de paiement</h2>
      </div>
      <section class="project-summary">
        <p>Ce projet vise à analyser un dataset de crédit et à développer des modèles de machine learning capables de prédire la solvabilité des emprunteurs.</p>
      </section>
      <hr>
      <div class="card-content">
        <article class="project-content">
          <p>À partir de données clients, l’objectif est d’identifier les facteurs influençant le risque de crédit et d’entraîner différents modèles pour améliorer la précision des prédictions.</p>

          <img src="assets/previews/projects/ia01_1.png" alt="Données du dataset" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Données du dataset</p>
          <h3>Fonctionnalités principales :</h3>
          <ul>
            <li><strong>Exploration et prétraitement des données :</strong> Nettoyage des données, gestion des valeurs manquantes et analyse des distributions.</li>
            <li><strong>Visualisation des tendances :</strong> Utilisation de Seaborn et Matplotlib pour explorer les relations entre les variables.</li>
            <li><strong>Modélisation et optimisation :</strong> Comparaison de plusieurs algorithmes (kNN, Random Forest, Arbres de Décision, Régression Logistique, MLP) avec ajustement des hyperparamètres.</li>
          </ul>


          <h3>Technologies utilisées :</h3>
          <ul>
            <li><strong>Langage :</strong> Python</li>
            <li><strong>Bibliothèques :</strong> Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn</li>
          </ul>

          <p><strong>Durée :</strong> 1 mois</p>

          <img src="assets/previews/projects/ia01_2.png" alt="Comparaison des modèles" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Comparaison des modèles</p>

          <p>Ce projet met en œuvre une approche complète du machine learning appliqué à la finance, de l’analyse exploratoire des données à l’optimisation des modèles.</p>
          
          <a href="https://github.com/Kiyogen24/Project_IA01" target="_blank" class="project-link">Voir le Projet</a>
        </article>
      </div>
    `
    },
    2: {
      title: "Pocket Imperium",
      icon: "fa-brands fa-space-awesome",
      preview: 'assets/previews/projects/lo02_1.png',
      hasContent: true,
      htmlContent: `
    <div class="card-header">
      <i class="fa-brands fa-space-awesome"></i>
      <h2>Pocket Imperium</h2>
      </div>
      <section class="project-summary">
      <p>Développement d'une version logicielle du jeu <strong>Pocket Imperium</strong>.</p>
      </section>
      <hr>
      <div class="card-content">
      <article class="project-content">
        <p>Un jeu de stratégie spatiale où trois factions s’affrontent pour dominer la galaxie. Inspiré des jeux 3X (eXploration, eXpansion, eXtermination), il propose un gameplay tactique sur une grille hexagonale, des combats dynamiques et trois styles de stratégies distinctes : offensif, défensif et aléatoire.</p>
        <ul>
        <li><strong>Technologies utilisées :</strong> Java 21, JavaFX 21, Maven 3.13+</li>
        <li><strong>Durée :</strong> 5 mois</li>
        </ul>
        <img src="assets/previews/projects/lo02_1.png" alt="Aperçu du projet PocketImperium" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
        <p style="font-style: italic; font-size: 0.8em; text-align: center;">Aperçu du menu du jeu</p>
        <p>Le jeu intègre une interface graphique complète, un journal des actions pour suivre chaque événement, ainsi qu’un système de sauvegarde et chargement des parties. Les effets sonores et musiques ajoutent une immersion supplémentaire.</p>
        <img src="assets/previews/projects/lo02_2.png" alt="Aperçu du projet PocketImperium" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
        <p style="font-style: italic; font-size: 0.8em; text-align: center;">Plateau de PocketImperium, historiques des coups et choix des actions</p>
        <a href="https://github.com/Kiyogen24/PocketImperium" target="_blank" class="project-link">Voir le Projet</a>
      </article>
      </div>
    `
    },
    3: {
      title: "Messagerie Web sécurisée : Neutrino",
      icon: "fa-solid fa-comments",
      preview: 'assets/previews/projects/pe2_0.png',
      hasContent: true,
      htmlContent: `
    <div class="card-header">
      <i class="fa-brands fa-space-awesome"></i>
      <h2>Neutrino Chat</h2>
      </div>
      <section class="project-summary">
      <p><strong>Neutrino Chat</strong> est une application de messagerie web sécurisée développée en binôme dans le cadre de mes études à l'Université de Technologie de Troyes (UTT). Elle vise à offrir une communication fluide et privée entre utilisateurs.</p>
      </section>
      <hr>
      <div class="card-content">
      <article class="project-content">
      <h3>Fonctionnalités principales :</h3>
        <ul>
        <li><strong>Création de compte sécurisée :</strong> inscription avec un nom d'utilisateur unique et un mot de passe. L'adresse email est facultative, prévue pour de futures implémentations.</li>
        <li><strong>Messagerie en temps réel :</strong> utilisation de WebSockets pour des communications instantanées.</li>
        <li><strong>Chiffrement de bout en bout :</strong> les messages sont sécurisés grâce à la méthode RSA-OAEP.</li>
        <li><strong>Discussions de groupe :</strong> participation à des discussions de groupe avec des noms et photos de profil affichés en couleurs différentes.</li>
        <li><strong>Personnalisation du profil :</strong> possibilité de changer sa photo de profil, visible après rechargement de la page.</li>
        </ul>
        <img src="assets/previews/projects/pe2_1.png" alt="Aperçu de la page de connexion" class="project-image" style="width: 90%; height: auto;">
        <p style="font-style: italic; font-size: 0.8em; text-align: center;">Aperçu de la page de connexion</p>
        <h3>Technologie utilisée :</h3>
        <ul>
        <li><strong>Frontend :</strong> HTML, CSS, JavaScript</li>
        <li><strong>Backend :</strong> Node.js, Express.js</li>
        <li><strong>Base de données :</strong> MongoDB</li>
        <li><strong>Sécurité :</strong> chiffrement RSA-OAEP, gestion sécurisée des sessions</li>
        </ul>
        <p><strong>Durée :</strong> 6 mois</p>
        <img src="assets/previews/projects/pe2_2.png" alt="Aperçu d'une discussion de groupe" class="project-image" style="width: 90%; height: auto;">
        <p style="font-style: italic; font-size: 0.8em; text-align: center;">Aperçu d'une discussion de groupe</p>
        <a href="https://github.com/Kiyogen24/Neutrino" target="_blank" class="project-link">Voir le Projet</a>
      </article>
      </div>
      `
    },
    4: {
      title: "Tracé d’un Réseau Ferroviaire",
      icon: "fa-solid fa-train",
      preview: 'assets/previews/projects/nf06_0.png',
      hasContent: true,
      htmlContent: `
      <div class="card-header">
        <i class="fa-solid fa-train"></i>
        <h2>Tracé d’un Réseau Ferroviaire</h2>
      </div>
      <section class="project-summary">
        <p>Ce projet consiste en la conception et l'implémentation d'un réseau ferroviaire optimal en utilisant des algorithmes de graphes pour déterminer les trajets les plus efficaces.</p>
      </section>
      <hr>
      <div class="card-content">
        <article class="project-content">
          <p>Le projet vise à modéliser un réseau ferroviaire en représentant les gares et les voies comme des graphes, puis à appliquer des algorithmes pour optimiser les trajets et les coûts associés.</p>
    
          <h3>Fonctionnalités principales :</h3>
          <ul>
            <li><strong>Implémentation de l'algorithme de Prim :</strong> Utilisé pour trouver l'arbre couvrant minimal du réseau, assurant une connexion optimale entre toutes les gares.</li>
            <li><strong>Implémentation de l'algorithme de Dijkstra :</strong> Permet de calculer les chemins les plus courts entre deux gares, facilitant la planification des trajets.</li>
            <li><strong>Visualisation du réseau :</strong> Génération d'une carte interactive affichant le réseau ferroviaire et les trajets optimisés.</li>
          </ul>
    
          <img src="assets/previews/projects/nf06_1.png" alt="Visualisation du réseau ferroviaire" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Visualisation du réseau ferroviaire</p>
    
          <h3>Technologies utilisées :</h3>
          <ul>
            <li><strong>Langages :</strong> C pour les algorithmes de graphes, Python pour l'interface et la visualisation</li>
            <li><strong>Bibliothèques :</strong> Utilisation de ctypes pour l'interfaçage entre C et Python, Tkinter pour l'interface graphique et Folium pour la carte interactive</li>
          </ul>
    
          <p><strong>Durée :</strong> 3 mois</p>
    
          <img src="assets/previews/projects/nf06_2.png" alt="Illustration de la distance entre 2 chemins" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Illustration de la distance entre 2 chemins</p>
    
          <p>Ce projet met en œuvre des concepts avancés de théorie des graphes et démontre l'intégration efficace entre des modules C performants et une interface Python conviviale pour la modélisation de réseaux complexes.</p>
          
          <a href="https://github.com/Kiyogen24/NF06_project" target="_blank" class="project-link">Voir le Projet</a>
        </article>
      </div>
      `
    },
    5: {
      title: "Recherhce d'algorithmes pour jouer aux échecs",
      icon: "fa-solid fa-chesss",
      preview: 'assets/previews/projects/pe1_0.png',
      hasContent: true,
      htmlContent: `
      <div class="card-header">
        <i class="fa-solid fa-chess"></i>
        <h2>IA appliquée aux échecs : recherche de l'algorithmes le plus performant</h2>
      </div>
      <section class="project-summary">
        <p>Ce projet en binôme explore et compare deux algorithmes d’intelligence artificielle jouant aux échecs : <strong>Minimax</strong> et <strong>Monte Carlo Tree Search (MCTS)</strong>.</p>
      </section>
      <hr>
      <div class="card-content">
        <article class="project-content">
          <p>L’objectif est d’analyser leurs performances en termes de précision, de rapidité et de prise de décision face à un moteur d’échecs de référence.</p>

          <h3>Fonctionnalités principales :</h3>
          <ul>
            <li><strong>Implémentation de Minimax :</strong> Algorithme de recherche de meilleur coup avec élagage alpha-bêta et table de transposition.</li>
            <li><strong>Implémentation de MCTS :</strong> Approche basée sur des simulations de parties pour estimer la qualité des coups.</li>
            <li><strong>Comparaison avec Stockfish :</strong> Évaluation des décisions prises par les algorithmes face à un moteur d’échecs avancé.</li>
            <li><strong>Visualisation des parties :</strong> Représentation graphique de l’arbre de recherche pour mieux comprendre la prise de décision.</li>
            <li><strong>Interface graphique :</strong> Visualiusation des deux algorithmes s'affrontant aux échecs.</li>
          </ul>

          <img src="assets/previews/projects/pe1_2.png" alt="Illustration de l'algorithme Minimax" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Illustration de l'algorithme Minimax</p>
          
          <h3>Technologies utilisées :</h3>
          <ul>
            <li><strong>Langage :</strong> Python</li>
            <li><strong>Bibliothèques :</strong> Chess, NumPy, Matplotlib, Flask</li>
            <li><strong>Moteur d’échecs :</strong> Stockfish</li>
          </ul>

          <p><strong>Durée :</strong> 5 mois</p>

          <img src="assets/previews/projects/pe1_1.png" alt="Illustration de l'algorithme MCTS" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Simulations de l'algorithme MCTS</p>

          <p>Ce projet a permis d’étudier l’approche décisionnelle des IA d’échecs et d’optimiser leur stratégie contre un adversaire de référence. L'objectif était initialement d'ajouter un réseau de neurones au MCTS pour s'inspirer du modèle d'AlphaZero Chess. Mais par manque de temps et de connaissances au moment de la réalisation de ce projet, cela n'a pas été fait.</p>
          
        </article>
      </div>

      `
    },
    },
    
  };

// Créez un élément pour afficher le titre
const titleElement = document.createElement('div');
titleElement.id = 'titleElement';
titleElement.style.cssText = `
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2em;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  font-family: Arial, sans-serif;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;
document.body.appendChild(titleElement);

// Ajouter les variables d'état
let isZoomed = false;
let isDragging = false;
let mouseStartX = 0;
let mouseStartY = 0;
let lastCameraPosition = null;
let lastCameraRotation = null;


// Créer le bouton avant init()
resetButton = document.createElement('button');
resetButton.id = 'reset';
resetButton.setAttribute('aria-label', 'Retour');
resetButton.addEventListener('click', dezoom);
document.body.appendChild(resetButton);

const themeBtn = document.querySelector('.theme-btn');
const themeIcon = document.querySelector('.theme-icon');
const currentTheme = localStorage.getItem('theme');
const cubeSection = document.getElementById('cube-section');


themeBtn.addEventListener('click', function() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  
  // Changer l'icône
  const themeIcon = document.querySelector('.theme-icon');
  themeIcon.classList.remove(isDark ? 'fa-moon' : 'fa-sun');
  themeIcon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
});

// Fonction d'initialisation
function init() {

  // Appliquer le thème enregistré par l'utilisateur ou le thème par défaut (light)
  const storedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', storedTheme);

  // Mettre à jour l'icône du thème en fonction du thème actuel
  const themeIcon = document.querySelector('.theme-icon');
  if (storedTheme === 'dark') {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
  } else {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
  }

    // Cacher le contenu pendant le chargement
    document.querySelector('.container').style.visibility = 'hidden';
  
    // Fonction pour masquer l'écran de chargement
    function hideLoadingScreen() {
      const loadingScreen = document.querySelector('.loading-screen');
      loadingScreen.classList.add('fade-out');
      document.querySelector('.container').style.visibility = 'visible';
      
      // Supprimer l'écran de chargement après l'animation
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }
  
    // Simulation d'un délai de chargement (à ajuster selon vos besoins)
    setTimeout(hideLoadingScreen, 3000);
  
  // Création de la scène
  scene = new THREE.Scene();

  // Configuration de la caméra
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(5, 5, 7);
  camera.lookAt(0, 0, 0);

  // Configuration du rendu avec meilleure qualité
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    precision: 'highp',
    powerPreference: "high-performance"
  });
  
  // Augmenter la résolution du rendu
  const pixelRatio = window.devicePixelRatio;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Déplacer le renderer dans la section cube
  cubeSection.appendChild(renderer.domElement);
  renderer.domElement.style.position = 'absolute';

  cubeSection.addEventListener('mousedown', () => {
      if (!isZoomed) {
          cubeSection.classList.add('grabbing');
      }
  });

  cubeSection.addEventListener('mouseup', () => {
      cubeSection.classList.remove('grabbing');
  });

  cubeSection.addEventListener('mouseleave', () => {
      cubeSection.classList.remove('grabbing');
  });

  // Contrôles
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.rotateSpeed = 0.5; // Ralentir la rotation
  controls.minDistance = 5;   // Distance minimale
  controls.maxDistance = 15;  // Distance maximale

  
  // Éclairage
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-10, -10, -10);
  scene.add(fillLight);

  // Ajouter des logs de débogage
  console.log("Scene créée:", scene);
  console.log("Camera position:", camera.position);
  
  createRubiksCube();
  console.log("Nombre de cubies:", cubies.length);
  console.log("Position du Rubik's Cube:", rubiksCube.position);

  // Supprimer les event listeners
  window.addEventListener('resize', onWindowResize);

  window.addEventListener('mousedown', (e) => {
    const cubeSection = document.getElementById('cube-section');
    const rect = cubeSection.getBoundingClientRect();
    const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;

    if (!isCubeVisible) return;

    isDragging = false;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
  });

    window.addEventListener('mousemove', (e) => {
        const cubeSection = document.getElementById('cube-section');
        const rect = cubeSection.getBoundingClientRect();
        const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;

        if (!isCubeVisible) return;

        if (Math.abs(e.clientX - mouseStartX) > 5 || Math.abs(e.clientY - mouseStartY) > 5) {
            isDragging = true;
        }
    });

    window.addEventListener('mouseup', (e) => {
        const cubeSection = document.getElementById('cube-section');
        const rect = cubeSection.getBoundingClientRect();
        const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;

        if (!isCubeVisible) return;

        if (!isDragging) {
            handleClick(e);
        }
        isDragging = false;
    });

  createOverlay(); // Ajouter à init()
  setupNavigation();
}

// Fonctions de base
function createCubie(size, gridPosition) {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const materials = [];
  const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
  
  for (let i = 0; i < 6; i++) {
    const faceName = faceNames[i];
    const material = createStickerMaterial(faceName, gridPosition);
       
    materials.push(material);
  }

  const mesh = new THREE.Mesh(geometry, materials);
  originalMaterials.set(mesh.uuid, materials.map(m => m.clone()));
  
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.rubikPosition = mesh.position.clone();
  mesh.userData.hoverable = true;
  mesh.userData.clickable = true;

  return mesh;
}

function createStickerMaterial(faceName, gridPosition) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Fond noir avec dégradé
  const gradient1 = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient1.addColorStop(0, '#222');
  gradient1.addColorStop(1, '#000');
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, 512, 512);

  const margin = 32;
  const stickerSize = 448;
  const radius = 35;

  // Sticker avec dégradé subtil
  const gradient = ctx.createLinearGradient(margin, margin, stickerSize + margin, stickerSize + margin);
  gradient.addColorStop(0, stickerColors[faceName]); 
  gradient.addColorStop(1, shadeColor(stickerColors[faceName], -10));
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
  ctx.fill();

  // Si c'est la face supérieure du cubie central, ajouter la photo de profil
  if (faceName === 'top' && 
      gridPosition && 
      gridPosition.x === 0 && 
      gridPosition.y === 1 && 
      gridPosition.z === 0) {
    
    const material = new THREE.MeshStandardMaterial({
      metalness: 0.1,
      roughness: 0.8
    });

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
      ctx.clip();
      ctx.drawImage(img, margin, margin, stickerSize, stickerSize);
      ctx.restore();
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      material.map = texture;
      material.needsUpdate = true;
    };
    img.src = 'assets/pp.png';
    
    return material;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0.1,
    roughness: 0.8
  });
}


// Fonction utilitaire pour assombrir une couleur
function shadeColor(color, percent) {
  const num = parseInt(color.replace('#',''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

function createRubiksCube() {
  rubiksCube = new THREE.Group();
  
  for (let x of positions) {
    for (let y of positions) {
      for (let z of positions) {
        const gridPosition = new THREE.Vector3(x, y, z);
        const cubie = createCubie(cubeSize, gridPosition);
        cubie.position.set(
          x * (cubeSize + gap),
          y * (cubeSize + gap),
          z * (cubeSize + gap)
        );
        cubie.userData.gridPos = gridPosition;
        rubiksCube.add(cubie);
        cubies.push(cubie);
        
        // Log pour chaque cubie
        console.log(`Cubie créé à la position: x=${x}, y=${y}, z=${z}`);
      }
    }
  }
  
  scene.add(rubiksCube);
  console.log("Rubik's Cube ajouté à la scène");
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Ajouter cette fonction pour obtenir tous les cubies d'une face
function getFaceCubies(faceType) {
  let cubiesOnFace = [];
  switch(faceType) {
    case 'front':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.z - 1) < 0.1);
      break;
    case 'back':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.z + 1) < 0.1);
      break;
    case 'right':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.x - 1) < 0.1);
      break;
    case 'left':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.x + 1) < 0.1);
      break;
    case 'top':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.y - 1) < 0.1);
      break;
    case 'bottom':
      cubiesOnFace = cubies.filter(cubie => Math.abs(cubie.userData.gridPos.y + 1) < 0.1);
      break;
  }
  return cubiesOnFace;
}

// Modifier la fonction zoomToFace
function zoomToFace(face, normal, faceType) {
  if(!isZoomed){
    lastCameraPosition = camera.position.clone();
    lastCameraRotation = camera.quaternion.clone();
  }
  
  const targetPosition = face.position.clone();
  const distance = 6;
  
  // Calculer l'orientation finale avec des vecteurs normalisés
  let cameraOffset;
  let upVector = new THREE.Vector3(0, 1, 0);
  
  switch(faceType) {
    case 'front':  
      cameraOffset = new THREE.Vector3(0, 0, distance);
      break;
    case 'back':   
      cameraOffset = new THREE.Vector3(0, 0, -distance);
      break;
    case 'right':  
      cameraOffset = new THREE.Vector3(distance, 0, 0);
      break;
    case 'left':   
      cameraOffset = new THREE.Vector3(-distance, 0, 0);
      break;
    case 'top':    
      cameraOffset = new THREE.Vector3(0, distance, 0);
      upVector = new THREE.Vector3(0, 0, -1);
      break;
    case 'bottom': 
      cameraOffset = new THREE.Vector3(0, -distance, 0);
      upVector = new THREE.Vector3(0, 0, 1);
      break;
  }

        // Désactiver les boutons de navigation
        document.querySelectorAll('.nav-button').forEach(btn => {
          btn.classList.add('disabled');
        });

  const targetCameraPos = targetPosition.clone().add(cameraOffset);

  const startPos = camera.position.clone();
  const lookDirection = targetPosition.clone().sub(targetCameraPos).normalize();
  const rightVector = new THREE.Vector3().crossVectors(upVector, lookDirection).normalize();
  const adjustedUpVector = new THREE.Vector3().crossVectors(lookDirection, rightVector).normalize();

  const targetMatrix = new THREE.Matrix4().makeBasis(
    rightVector,
    adjustedUpVector,
    lookDirection.negate()
  );
  const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(targetMatrix);
  const startQuaternion = camera.quaternion.clone();
  

  // Animation fluide
  controls.enabled = false;
  const duration = 1000;
  const startTime = Date.now();
  
  function updateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    camera.position.lerpVectors(startPos, targetCameraPos, easeProgress);
    camera.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, easeProgress);

    if (progress < 1) {
      requestAnimationFrame(updateCamera);
    } else {
      // Animation terminée, mettre à jour les textures
      isZoomed = true;
      cubeSection.classList.add('zoomed');
      const faceCubies = getFaceCubies(faceType);
      faceCubies.forEach(cubie => {
        updateFaceTextures(cubie, faceType, true);
      });
      resetButton.style.display = 'block';

    }
  }

  updateCamera();

  // Afficher le bouton retour
  resetButton.style.display = 'block';
}


function dezoom() {
  if (!isZoomed || !lastCameraPosition) return;

  isZoomed = false;
  isDragging = false;
  cubeSection.classList.remove('zoomed');

  // Réactiver les boutons de navigation
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.remove('disabled');
  });

  // Nettoyer l'interface
  const body = document.querySelector('.container');
  body.style.overflow = 'auto';
  menuBtn.classList.remove('open');
  menu.classList.remove('active');
  menuOpen = false;
  resetButton.style.display = 'none';
  titleElement.style.opacity = '0';

  const container = document.getElementById('face-content');
  if (container) container.remove();

  requestAnimationFrame(() => {
    cubies.forEach(cubie => {
      cubie.scale.set(1, 1, 1);
      // Ne pas réinitialiser le cubie central top
      if (cubie.userData.gridPos &&
        cubie.userData.gridPos.x === 0 && 
        cubie.userData.gridPos.y === 1 && 
        cubie.userData.gridPos.z === 0) {
      return;
    }
      ['right', 'left', 'top', 'bottom', 'front', 'back'].forEach(faceType => {
        const texture = createFaceTexture(faceType, false);
        const faceIndex = ['right', 'left', 'top', 'bottom', 'front', 'back'].indexOf(faceType);
        cubie.material[faceIndex].map = texture;
        cubie.material[faceIndex].needsUpdate = true;
      });
    });

    const startPos = camera.position.clone();
    const endPos = lastCameraPosition.clone();
    if (endPos.length() < 7) endPos.normalize().multiplyScalar(7);

    const duration = 1000;
    const startTime = Date.now();

    function update() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPos, endPos, easeProgress);
      camera.lookAt(0, 0, 0);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        camera.position.copy(endPos);
        camera.lookAt(0, 0, 0);
        controls.enabled = true;
      }
    }

    requestAnimationFrame(update);
  });

  // Nettoyer les effets hover
  if (hoveredCubie) {
    updateCubieHoverState(hoveredCubie, false);
    hoveredCubie = null;
  }
  hidePreview();

}

// Ajouter les autres éléments DOM
function createOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && activeInfoCard) {
      activeInfoCard.querySelector('.close-button').click();
    }
  });
  document.body.appendChild(overlay);
}

// Ajoutez la gestion du raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getCentralCubie(faceType) {
  // Position du cubie central selon la face
  let position;
  switch(faceType) {
    case 'front':  position = new THREE.Vector3(0, 0, 1); break;
    case 'back':   position = new THREE.Vector3(0, 0, -1); break;
    case 'right':  position = new THREE.Vector3(1, 0, 0); break;
    case 'left':   position = new THREE.Vector3(-1, 0, 0); break;
    case 'top':    position = new THREE.Vector3(0, 1, 0); break;
    case 'bottom': position = new THREE.Vector3(0, -1, 0); break;
  }

  // Trouver le cubie correspondant
  return cubies.find(cubie => 
    cubie.userData.gridPos.equals(position)
  );
}

// Fonction pour créer et afficher la carte d'information
function showInfoCard(event, faceType, cubePosition) {
    if (!overlay) createOverlay();

    // Nettoyer les effets hover avant d'ouvrir la carte
    if (hoveredCubie) {
      hoveredCubie.scale.set(1, 1, 1);
      updateFaceTextures(hoveredCubie, hoveredCubie.userData.hoveredFace, true);
      hoveredCubie.userData.hoveredFace = null;
      hoveredCubie = null;
    }
    hidePreview();
  
    
    isModalOpen = true;
    controls.enabled = false; // Désactiver les contrôles du cube
    overlay.classList.add('active');

    // Activer l'overlay
    overlay.classList.add('active');

    // Fermer la carte précédente si elle existe
    if (activeInfoCard) {
        activeInfoCard.remove();
    }

    const card = document.createElement('div');
    card.className = 'info-card';
    card.setAttribute('data-face', faceType);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onclick = () => {
        isModalOpen = false;
        controls.enabled = true;
        card.classList.remove('active');
        overlay.classList.remove('active');
        renderer.domElement.style.cursor = 'default';
        setTimeout(() => card.remove(), 300);
        activeInfoCard = null;
    };

    const content = document.createElement('div');
    const contentData = CUBE_CONTENT[faceType]?.[cubePosition];

    if (faceType === 'left' && contentData && contentData.htmlContent) {
      // Affichage d'un contenu HTML personnalisé pour la catégorie projets
      content.innerHTML = contentData.htmlContent;
    }
    else if (contentData.hasContent) {
      content.innerHTML = contentData.file 
        ? `<div class="pdf-view">
        <iframe 
           src="assets/previews/cv.pdf" 
           type="application/pdf" 
           width="100%" 
           height="90%">
         </iframe>
         <a href="assets/previews/cv.pdf" target="_blank" class="pdf-download-link">
          <i class="fa-regular fa-folder-open"></i> Ouvrir le CV
         </a>
       </div>`
        : `<div class="card-header">
        <i class="${contentData.icon} card-icon"></i>
        <h2>${contentData.title}</h2>
          </div>
          <div class="card-content">
        ${contentData.description ? `<p class="card-content">${contentData.description}</p>` : ''}
        ${contentData.details && contentData.details.length > 0 
          ? `<ul class="details-list">
          ${contentData.details.map(detail => `<li>${detail}</li>`).join('')}
        </ul>`
          : ''
        }
          </div>`;
    } else {
      content.innerHTML = `
          <h2>${CATEGORIES[faceType]}</h2>
          <p>Bientôt...</p>
      `;
  }

    card.appendChild(closeBtn);
    card.appendChild(content);
    document.body.appendChild(card);
    
    // Animation d'ouverture
    requestAnimationFrame(() => {
        card.classList.add('active');
    });

    activeInfoCard = card;
}


let hoveredCubie = null;

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubies);

    // Vérifier si on survole le cube
    const isOverCube = intersects.length > 0;
  
    // Mettre à jour le style du curseur
    cubeSection.style.cursor = isOverCube ? 'pointer' : '';
    
  if (!isZoomed || isModalOpen) return;

  const newHoveredCubie = intersects.length > 0 ? intersects[0].object : null;

  if (hoveredCubie !== newHoveredCubie) {
    if (hoveredCubie) {
      updateCubieHoverState(hoveredCubie, false);
    }
    hoveredCubie = newHoveredCubie;
    if (hoveredCubie) {
      updateCubieHoverState(hoveredCubie, true);
    }
  }
}




let previewElement = null;

function displayPreview(imageSrc, event) {
  if (!previewElement) {
    previewElement = document.createElement('div');
    previewElement.className = 'preview-popup';
    document.body.appendChild(previewElement);
  }

  const rect = document.querySelector('#cube-section').getBoundingClientRect();
  previewElement.style.display = 'block';
  
  // Calculer la position centrée
  const cubieCenterX = event.clientX;
  const cubieCenterY = event.clientY;
  
  setTimeout(() => {
    previewElement.classList.add('visible');
    previewElement.style.left = `${cubieCenterX}px`;
    previewElement.style.top = `${cubieCenterY}px`;
    previewElement.style.backgroundImage = `url(${imageSrc})`;
  }, 0);
}

function hidePreview() {
  if (previewElement) {
      previewElement.classList.remove('visible');

  }
}

// Add event listener
window.addEventListener('mousemove', onMouseMove);



function handleClick(event) {
    // Vérifier si nous sommes dans la section cube
    const cubeSection = document.getElementById('cube-section');
    const rect = cubeSection.getBoundingClientRect();
    const isCubeVisible = rect.top === 0 && rect.bottom === window.innerHeight;
    
    if (!isCubeVisible || isModalOpen) return; 
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cubies);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        const normal = intersection.face.normal.clone();
        normal.transformDirection(intersection.object.matrixWorld);
        
        let faceType;
        const epsilon = 0.1;
        if (Math.abs(normal.z) > 1 - epsilon) faceType = normal.z > 0 ? 'front' : 'back';
        else if (Math.abs(normal.x) > 1 - epsilon) faceType = normal.x > 0 ? 'right' : 'left';
        else if (Math.abs(normal.y) > 1 - epsilon) faceType = normal.y > 0 ? 'top' : 'bottom';

        const centralCubie = getCentralCubie(faceType);
        
        if (centralCubie) {
          if (isZoomed) {
            const clickedCubie = intersection.object;
            const pos = clickedCubie.userData.gridPos;
            
            // Calcul différent selon la face
            let position;
            switch(faceType) {
                case 'right':
                    // Inverser la colonne pour back
                    const rowR = 2 - Math.floor(pos.y + 1); // 0,1,2 de haut en bas
                    const colR = 2 - Math.floor(pos.z + 1); // Inverser l'ordre des colonnes
                    position = rowR * 3 + colR;
                    console.log('Position calculée (back):', {
                        x: pos.y,
                        z: pos.x,
                        position: position
              });
                    break;
                case 'left':
                    // Pour right/left: y determine la ligne (haut en bas), z determine la colonne (gauche à droite)
                    const row = 2 - Math.floor(pos.y + 1);  // 0,1,2 de haut en bas
                    const col = Math.floor(pos.z + 1);      // 0,1,2 de gauche à droite
                    position = row * 3 + col;
                    console.log('Position calculée (right/left):', {
                      x: pos.y,
                      z: pos.x,
                      position: position
                  });
                    break;
                
                case 'back':
                      // Inverser la colonne pour back
                      const rowB = 2 - Math.floor(pos.y + 1); // 0,1,2 de haut en bas
                      const colB = 2 - Math.floor(pos.x + 1); // Inverser l'ordre des colonnes
                      position = rowB * 3 + colB;
                      console.log('Position calculée (back):', {
                          x: pos.y,
                          z: pos.x,
                          position: position
                });
                      break;
                case 'front':
                    // Pour front/back: y determine la ligne (haut en bas), x determine la colonne (gauche à droite)
                    const rowFB = 2 - Math.floor(pos.y + 1); // 0,1,2 de haut en bas
                    const colFB = Math.floor(pos.x + 1);     // 0,1,2 de gauche à droite
                    position = rowFB * 3 + colFB;
                    console.log('Position calculée (front/back):', {
                      x: pos.y,
                      z: pos.x,
                      position: position
                  });
                    break;
                    
                case 'top':
                case 'bottom':
                    // Pour top/bottom: z determine la ligne (haut en bas), x determine la colonne (gauche à droite)
                    const rowTB = 2 - Math.floor(pos.z + 1); // 0,1,2 de haut en bas
                    const colTB = Math.floor(pos.x + 1);     // 0,1,2 de gauche à droite
                    position = rowTB * 3 + colTB;
                    console.log('Position calculée (top/bottom):', {
                      x: pos.z,
                      z: pos.x,
                      position: position
                  });
                    break;
            }
            
            if (CUBE_CONTENT[faceType][position].hasContent){
              showInfoCard(event, faceType, position);
            } else if (CUBE_CONTENT[faceType][position].link) {
              window.open(CUBE_CONTENT[faceType][position].link, "_blank");
            }
          } else {
              // Sinon, on zoome sur la face
              const container = document.querySelector('.container');
              container.style.overflow = 'hidden';
              
              zoomToFace(centralCubie, normal, faceType);
              isZoomed = true;

              if (!menuOpen) {
                  menuBtn.classList.add('open');
                  menu.classList.add('active');
                  menuOpen = true;
              }

              document.querySelectorAll('.menu-item').forEach(item => {
                  item.classList.remove('active');
                  if (item.querySelector('h3').textContent === CATEGORIES[faceType]) {
                      item.classList.add('active');
                      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
              });
          }
      }
  }
}

// Boucle d'animation simplifiée
function animate() {
  requestAnimationFrame(animate);
  
  if (controls) {
    controls.update();
  }
  
  if (scene && camera && renderer) {
    renderer.render(scene, camera);
  } else {
    console.error("Éléments manquants pour le rendu:", {
      scene: !!scene,
      camera: !!camera,
      renderer: !!renderer
    });
  }
}

const textureCache = new Map();

function createFaceTexture(faceType, hasContent = false) {
  const cacheKey = `${faceType}-${hasContent}`;
  
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Fond noir avec dégradé
  const gradient1 = ctx.createRadialGradient(
    256, 256, 0,
    256, 256, 256
  );
  gradient1.addColorStop(0, '#222');
  gradient1.addColorStop(1, '#000');
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, 512, 512);

  // Sticker avec dégradé subtil
  const margin = 32;
  const stickerSize = 448;
  const radius = 35;
  
  const gradient = ctx.createLinearGradient(margin, margin, stickerSize + margin, stickerSize + margin);
  gradient.addColorStop(0, stickerColors[faceType]); 
  gradient.addColorStop(1, shadeColor(stickerColors[faceType], -10));
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
  ctx.fill();

  if (hasContent) {
    // Ajouter l'effet lumineux
    const gradient = ctx.createLinearGradient(
      margin, margin,
      stickerSize + margin, stickerSize + margin
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.save();
    ctx.clip();
    ctx.fillStyle = gradient;
    ctx.fillRect(margin, margin, stickerSize, stickerSize);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  textureCache.set(cacheKey, texture);
  
  return texture;
}  

function updateFaceTextures(cubie, faceType, isActive) {
  // Vérifier si c'est le cubie central de la face top
  if (cubie.userData.gridPos &&
    cubie.userData.gridPos.x === 0 && 
    cubie.userData.gridPos.y === 1 && 
    cubie.userData.gridPos.z === 0 &&
    faceType === 'top') {
  return; // Ne pas mettre à jour la texture
}

const faceIndex = ['right', 'left', 'top', 'bottom', 'front', 'back'].indexOf(faceType);
  if (faceIndex === -1) return;

  const position = calculateCubiePosition(cubie.userData.gridPos, faceType);
  const content = CUBE_CONTENT[faceType]?.[position];
  
  const hasContent = isZoomed && content?.preview;
  const texture = createFaceTexture(faceType, hasContent);
  
  cubie.material[faceIndex].map = texture;
  cubie.material[faceIndex].needsUpdate = true;
}

function updateCubieHoverState(cubie, isHovered) {
  if (!isZoomed) return;

  const intersects = raycaster.intersectObject(cubie);
  
  if (intersects.length > 0 && isHovered) {
    const normal = intersects[0].face.normal.clone();
    normal.transformDirection(cubie.matrixWorld);
    
    let faceType;
    const epsilon = 0.1;
    if (Math.abs(normal.z) > 1 - epsilon) faceType = normal.z > 0 ? 'front' : 'back';
    else if (Math.abs(normal.x) > 1 - epsilon) faceType = normal.x > 0 ? 'right' : 'left';
    else if (Math.abs(normal.y) > 1 - epsilon) faceType = normal.y > 0 ? 'top' : 'bottom';
    
    const position = calculateCubiePosition(cubie.userData.gridPos, faceType);
    const content = CUBE_CONTENT[faceType]?.[position];

    if (content?.preview) {
      cubie.userData.hoveredFace = faceType;
      applyHoverEffects(cubie, faceType, content);
      if (content?.hasContent  || content?.link) {
      renderer.domElement.style.cursor = 'pointer';
      }
    }
  } else {
    if (cubie.userData.hoveredFace) {
      updateFaceTextures(cubie, cubie.userData.hoveredFace, true);
      cubie.userData.hoveredFace = null;
      renderer.domElement.style.cursor = 'default';
    }
    hidePreview();
  }
}




function applyHoverEffects(cubie, faceType, content) {
  const faceIndex = ['right', 'left', 'top', 'bottom', 'front', 'back'].indexOf(faceType);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  const margin = 32;
  const stickerSize = 448;
  const radius = 35;
  const baseColor = stickerColors[faceType];

  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.roundRect(margin, margin, stickerSize, stickerSize, radius);
  ctx.fill();


      // Ajouter l'effet lumineux
      const gradient = ctx.createLinearGradient(
        margin, margin,
        stickerSize + margin, stickerSize + margin
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
      
      ctx.save();
      ctx.clip();
      ctx.fillStyle = gradient;
      ctx.fillRect(margin, margin, stickerSize, stickerSize);
      ctx.restore();

 
  // Affichage de la preview
  if (content.preview) {
    
    // Application de la texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    cubie.material[faceIndex].map = texture;
    cubie.material[faceIndex].needsUpdate = true;

    const vector = new THREE.Vector3();
    cubie.getWorldPosition(vector);
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    displayPreview(content.preview, {
      clientX: x - 80,
      clientY: y - 80
    });
  }

  if (content.hasContent) {
  // Ajout du "+"
  const plusSize = 100;
  const padding = 60;
  const centerX = stickerSize - padding;
  const centerY = stickerSize - padding;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, plusSize/2, 0, Math.PI * 2);
  ctx.fill();

  // Ajout du +
  ctx.fillStyle = baseColor;
  ctx.font = 'bold 72px Arial'; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', centerX, centerY+5); // Utiliser les mêmes coordonnées que le cercle
}

}


// Nouvelle fonction pour calculer la position selon la face
function calculateCubiePosition(pos, faceType) {
  switch(faceType) {
    case 'right':
      return (2 - Math.floor(pos.y + 1)) * 3 + (2 - Math.floor(pos.z + 1));
    case 'left':
      return (2 - Math.floor(pos.y + 1)) * 3 + Math.floor(pos.z + 1);
    case 'back':
      return (2 - Math.floor(pos.y + 1)) * 3 + (2 - Math.floor(pos.x + 1));
    case 'front':
      return (2 - Math.floor(pos.y + 1)) * 3 + Math.floor(pos.x + 1);
    case 'top':
    case 'bottom':
      return (2 - Math.floor(pos.z + 1)) * 3 + Math.floor(pos.x + 1);
    default:
      return -1;
  }
}

// Modifier la fonction setupNavigation
function setupNavigation() {
  const container = document.querySelector('.container');
  const sections = Array.from(document.querySelectorAll('section'));
  const buttons = document.querySelectorAll('.nav-button');
  menuBtn = document.querySelector('.menu-btn');
  menu = document.querySelector('.menu');
  
  function updateUI() {
      const currentScroll = container.scrollTop;
      const windowHeight = window.innerHeight;
      const currentIndex = Math.round(currentScroll / windowHeight);
      
      // Gérer la visibilité de l'indicateur de scroll
      const scrollIndicator = document.querySelector('.scroll-indicator');
      if (scrollIndicator) {
          scrollIndicator.classList.toggle('hidden', currentIndex !== 0);
      }

      buttons.forEach((button, index) => {
          button.classList.toggle('active', index === currentIndex);
      });
      
      // Gérer la visibilité du menu et du bouton thème
      const isCubeSection = currentIndex === 1;
      menuBtn.style.display = isCubeSection ? 'flex' : 'none';
      themeBtn.classList.toggle('hidden', isCubeSection);
      
      if (!isCubeSection && menu.classList.contains('active')) {
          menu.classList.remove('active');
          menuBtn.classList.remove('open');
      }
  }

    // Gérer le clic sur les boutons
    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            sections[index].scrollIntoView({ behavior: 'smooth' });
        });
    });


    document.querySelectorAll('.quick-link[data-face]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const faceType = link.getAttribute('data-face');
        
        // Scroll vers la section cube
        document.getElementById('cube-section').scrollIntoView({ behavior: 'smooth' });
        
        // Attendre la fin du scroll avant de zoomer
        setTimeout(() => {
          const centralCubie = getCentralCubie(faceType);
          if (centralCubie) {
            let normal = new THREE.Vector3();
            switch(faceType) {
              case 'front': normal.set(0, 0, 1); break;
              case 'back': normal.set(0, 0, -1); break;
              case 'right': normal.set(1, 0, 0); break;
              case 'left': normal.set(-1, 0, 0); break;
              case 'top': normal.set(0, 1, 0); break;
              case 'bottom': normal.set(0, -1, 0); break;
            }

            // Ouvrir le menu et activer l'élément correspondant
            if (!menuOpen) {
              menuBtn.classList.add('open');
              menu.classList.add('active');
              menuOpen = true;
            }

            // Activer l'élément du menu correspondant
            document.querySelectorAll('.menu-item').forEach(item => {
              item.classList.remove('active');
              if (item.querySelector('h3').textContent === CATEGORIES[faceType]) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            });
            
            zoomToFace(centralCubie, normal, faceType);
            isZoomed = true;
          }
        }, 1000); // Délai pour laisser le scroll se terminer
      });
    });

    // Écouter le scroll
    container.addEventListener('scroll', () => {
        updateUI();
    }, { passive: true });

    // État initial
    updateUI();
}

// Démarrage
init();
animate();

// Menu hamburger
menuBtn = document.querySelector('.menu-btn');
menu = document.querySelector('.menu');
let menuOpen = false;


// Après l'initialisation du menu
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
      const category = item.querySelector('h3').textContent;
      // Trouver le type de face correspondant à la catégorie
      const faceType = Object.keys(CATEGORIES).find(key => CATEGORIES[key] === category);
      
      if (faceType) {
          const centralCubie = getCentralCubie(faceType);
          if (centralCubie) {
              // Créer un vecteur normal pour la face
              let normal = new THREE.Vector3();
              switch(faceType) {
                  case 'front': normal.set(0, 0, 1); break;
                  case 'back': normal.set(0, 0, -1); break;
                  case 'right': normal.set(1, 0, 0); break;
                  case 'left': normal.set(-1, 0, 0); break;
                  case 'top': normal.set(0, 1, 0); break;
                  case 'bottom': normal.set(0, -1, 0); break;
              }
              
              zoomToFace(centralCubie, normal, faceType);
              isZoomed = true;

              // Activer l'élément du menu
              document.querySelectorAll('.menu-item').forEach(menuItem => {
                  menuItem.classList.remove('active');
              });
              item.classList.add('active');
          }
      }
  });
});

// Modification de l'événement du menu hamburger
menuBtn.addEventListener('click', () => {
  menuBtn.classList.toggle('open');
  menu.classList.toggle('active');
  menuOpen = !menuOpen;
});

// Sélecteur de langue
const langBtn = document.querySelector('.selected-lang');
const langDropdown = document.querySelector('.lang-dropdown');
const langOptions = document.querySelectorAll('.lang-dropdown button');

langBtn.addEventListener('click', () => {
  langBtn.parentElement.classList.toggle('active');
});
/*
// Fermer le dropdown quand on clique ailleurs
document.addEventListener('click', (e) => {
  if (!e.target.closest('.language-btn')) {
    document.querySelector('.language-btn').classList.remove('active');
  }
});*/
