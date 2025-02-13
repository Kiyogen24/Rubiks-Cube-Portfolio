# Portfolio Rubik's Cube 3D

Un portfolio interactif et immersif présenté sous la forme d'un Rubik's Cube en 3D. Chaque face représente une catégorie différente (compétences, projets, expériences, etc.) avec des éléments interactifs.

[Lien du projet](goldenrom.vercel.app)

## Fonctionnalités

### Interface 3D Interactive

- Rubik's Cube manipulable en 3D grâce à Three.js
- Animation fluide de rotation et zoom
- Effets de survol et textures dynamiques
- Navigation intuitive entre les faces

### Navigation par Catégories

- **Compétences** (Face avant) : Technologies et outils maîtrisés
- **Expériences** (Face arrière) : Parcours professionnel  
- **À propos** (Face supérieure) : Informations personnelles et passions
- **CV** (Face inférieure) : CV téléchargeable au format PDF
- **Projets** (Face droite) : Portfolio de projets réalisés
- **Formation** (Face gauche) : Parcours académique

### Fonctionnalités Avancées  

- Mode sombre/clair avec sauvegarde des préférences
- Menu de navigation responsive
- Aperçus des contenus au survol
- Cartes d'information détaillées
- Design responsive avec optimisations mobiles

## Technologies Utilisées

### Frontend

- HTML5
- CSS3 (Animations, Flexbox, Grid)
- JavaScript (ES6+)

### Bibliothèques

- Three.js pour les graphiques 3D
- Font Awesome pour les icônes

## Installation

1. Cloner le dépôt :

```bash
git clone https://github.com/Kiyogen24/Rubiks-Cube-Portfolio.git
```

2. Installer les dépendances :

```bash
npm install
```

3. Lancer le serveur de développement :

```bash
npm start
```

## Structure du Projet

```plaintext
├── assets/              # Images et ressources
│   ├── pp.png
│   ├── pp2.png
│   └── previews/
│       ├── about/
│       │   ├── github.png
│       │   ├── hobbies.png
│       │   └── … 
│       ├── cv_pr.png
│       ├── cv.pdf
│       ├── exp/
│       ├── formation/
│       ├── projects/
│       ├── rubik.png
│       └── skills/
├── css/                 
│   ├── components/      # Composants CSS spécifiques
│   │   ├── cube.css
│   │   ├── footer.css
│   │   ├── intro.css
│   │   ├── loading.css
│   │   ├── modal.css
│   │   ├── navigation.css
│   │   └── theme.css
│   └── main.css
├── index.html           # Page principale
├── mobile.html          # Version mobile
├── js/
│   ├── cards/
│   │   ├── overlay.js
│   │   └── preview.js
│   ├── cube/
│   │   ├── cube.js
│   │   └── navigation.js
│   ├── globals.js
│   ├── main.js
│   └── utils/
│       └── constants.js
└── package.json         # Configuration npm
```

## Architecture du Code

### Composants Principaux

#### Initialisation Three.js

- Configuration de la scène 3D
- Mise en place de la caméra et des contrôles
- Gestion de l'éclairage et des ombres

#### Gestion du Cube

- Création dynamique des faces et textures
- Animation et interaction avec le cube
- Système de zoom et navigation

#### Interface Utilisateur

- Menu de navigation responsive
- Cartes d'information dynamiques
- Prévisualisation du contenu

## Performances

### Optimisations

- Mise en cache des textures
- Gestion optimisée des ressources 3D
- Chargement asynchrone des assets
- Adaptation automatique selon le device

## Licence

Ce projet est sous licence MIT.

## Contact

Romain Goldenchtein - [r.goldenchtein@proton.me](mailto:r.goldenchtein@proton.me)