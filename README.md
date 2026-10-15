# Portfolio Rubik's Cube 3D

Un portfolio interactif et immersif présenté sous la forme d'un Rubik's Cube en 3D. Chaque face représente une catégorie différente (compétences, projets, expériences, etc.) avec des éléments interactifs.

[Lien du projet](https://goldenrom.vercel.app)

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

- Accueil sur une page : le nom, une phrase, « Mon CV » et « À propos » ; en défilant (ou d'un clic), le cube vient au centre et ses contenus apparaissent sur la face tournée vers soi
- Patron du cube sous le cube pour passer d'une face à l'autre
- Nom du contenu au survol d'un sticker
- Cartes détaillées qui sortent de leur sticker, la face d'abord tournée vers soi
- Le CV affiché dans sa carte, avec le PDF à ouvrir
- Mode sombre/clair avec sauvegarde des préférences
- Changement de langue dynamique (FR/EN) via le bouton de langue
- Même site sur téléphone (cartes en bas de l'écran)
- Mode jeu : rotations de rangées au doigt, mélange, résolution automatique, zoom à la molette ou en pinçant
- Une fête quand le cube est résolu à la main (confettis en forme de stickers, score), puis la page descend vers « Contactez-moi »
- Section « Contactez-moi » en fin de page : on y écrit son message, le bouton ouvre la messagerie avec le mail rédigé ; l'adresse se copie aussi
- Navigation au clavier (flèches, Entrée, Échap)

## Technologies Utilisées

### Frontend

- HTML5
- CSS3 (Animations, Flexbox, Grid)
- JavaScript (ES6+)

### Bibliothèques

- Three.js pour les graphiques 3D
- cubejs (algorithme de Kociemba) pour la résolution automatique du cube, exécuté dans un Web Worker
- Polices Bricolage Grotesque et Instrument Sans (Google Fonts)

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

4. Vérifier le code (comme la CI) :

```bash
npm run lint
npm run format:check
npm test
```

### Mettre à jour le CV

Remplacer `assets/previews/cv.pdf` et `cv_en.pdf`, puis régénérer les images affichées dans la carte « Mon CV » :

```bash
pip install pymupdf pillow
python scripts/cv-images.py
```

## Structure du Projet

```plaintext
├── assets/              # Images et ressources
│   ├── cv/              # Le CV en images (scripts/cv-images.py)
│   ├── og-image.jpg     # Aperçu de partage
│   ├── pp.png
│   └── previews/        # Images des contenus, CV en PDF (cv.pdf, cv_en.pdf)
├── css/
│   └── main.css
├── index.html           # La page
├── mobile.html          # Ancienne page mobile, renvoie à l'accueil
├── js/
│   ├── main.js          # Chargement, boucle d'animation, langue, thème, boutons
│   ├── state.js         # État partagé
│   ├── i18n.js          # Textes de l'interface (FR/EN)
│   ├── content.js       # Contenu des stickers et sa mise en forme
│   ├── cards/
│   │   └── card.js      # Cartes des stickers, « À propos » et « Mon CV »
│   ├── cube/
│   │   ├── scene.js     # Rendu, caméra, cubies et images des stickers
│   │   ├── geometry.js  # Faces, couleurs, cases, orientations
│   │   ├── orientation.js
│   │   ├── input.js     # Souris, doigt, clavier
│   │   ├── hover.js
│   │   ├── modes.js     # Accueil, exploration, jeu
│   │   ├── play.js      # Rangées, mélange, résolution
│   │   ├── solver-worker.js
│   │   ├── textures.js
│   │   └── math.js      # Ressorts et rotations
│   ├── ui/
│   │   └── controls.js  # Patron, face devant, commandes du jeu
│   └── utils/
│       └── constants.js # Tout le contenu du portfolio (FR/EN)
├── scripts/             # Serveur de développement, images du CV
├── tests/               # Tests Playwright
└── package.json         # Configuration npm
```

## Architecture du Code

### Composants Principaux

#### Le cube

- Scène Three.js : le cube tourne sur lui-même (ressorts façon Apple, élan au lâcher), la caméra cadre selon le défilement
- Images des contenus posées sur les stickers de la face tournée vers soi
- Jeu : chaque rangée tourne autour d'un pivot ; la résolution passe par l'algorithme de Kociemba (cubejs, dans un worker), ou rejoue les mouvements à l'envers si cubejs n'est pas disponible

#### Interface Utilisateur

- Cartes dont le contenu vient de `js/utils/constants.js`
- Patron du cube et commandes du jeu qui suivent le cube

## Performances

### Optimisations

- Mise en cache des textures
- Le cube ne sert d'écran de chargement que si les images tardent
- Images en WebP, chargées une seule fois
- Adaptation automatique à la taille de l'écran

## Licence

Ce projet est sous licence MIT.

## Contact

Romain Goldenchtein - [r.goldenchtein@proton.me](mailto:r.goldenchtein@proton.me)