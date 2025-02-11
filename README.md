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
├── app.js                # Logique principale et rendu 3D
├── css/                  
│   └── style.css        # Styles CSS
├── assets/              # Images et ressources
├── index.html           # Page principale
├── mobile.html          # Version mobile
├── translations.js      # Traductions i18n
├── logic.js            # Logique supplémentaire
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