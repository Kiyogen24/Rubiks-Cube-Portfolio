# README.md

# Portfolio 3D Cube

Ce projet est un portfolio interactif en 3D qui présente un Rubik's Cube flottant. Chaque face du cube représente une catégorie : expériences, projets, passions et compétences. Les carrés de chaque face représentent des éléments spécifiques de ces catégories.

## Structure du projet

- **index.html** : Contient la structure de base de la page web, incluant les références aux scripts et styles nécessaires, ainsi qu'un bouton pour activer ou désactiver l'interaction avec le cube.
- **app.js** : Cœur de l'application, initialise la scène 3D avec Three.js, crée le Rubik's Cube, configure les lumières et les ombres, et gère les interactions de l'utilisateur. Inclut la logique pour recalibrer les faces du cube lors d'un clic.
- **css/style.css** : Contient les styles CSS pour le projet, y compris le style du bouton et la mise en page générale de la page.
- **package.json** : Configuration pour npm, liste les dépendances nécessaires pour le projet, comme Three.js, et inclut des scripts pour démarrer le projet.

## Installation

1. Clonez le dépôt :
   ```
   git clone <URL_DU_DEPOT>
   ```
2. Accédez au répertoire du projet :
   ```
   cd portfolio-3d-cube
   ```
3. Installez les dépendances :
   ```
   npm install
   ```

## Exécution

Pour exécuter le projet, ouvrez `index.html` dans un navigateur web. Vous pouvez également utiliser un serveur local pour une meilleure expérience.

## Fonctionnalités

- Rubik's Cube flottant avec des faces interactives.
- Chaque face représente une catégorie de votre portfolio.
- Possibilité de recalibrer les faces du cube en cliquant dessus.
- Bouton pour activer ou désactiver l'interaction avec le cube.

## Auteurs

- Votre nom ici

## License

Ce projet est sous licence MIT.