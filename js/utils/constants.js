// Constantes
export const CATEGORIES = {
    front: 'Compétences',
    back: 'Expériences',
    top: 'À propos', 
    bottom: 'Mon CV', 
    right: 'Projets',
    left: 'Formation'
};


// Constantes pour les couleurs des faces
export const stickerColors = {
  front: '#B90000',  
  back: '#ff8000',  
  top: '#FFFFFF',  
  bottom: '#ffff00',  
  right: '#000FFF',  
  left: '#00994C'
};


// Export des constantes nécessaires
export const CUBE_CONTENT = {
    front: { // **Compétences**
      0: {
        title: "Python",
        infos : "Bibliothèques",
        description: "Maîtrise du langage et des bibliothèques liées à la data science et à l'IA",
        details: ["NumPy", "Pandas", "Scikit-Learn", "TensorFlow", "Keras"],
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
        infos : "Liste",
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
        description: "Tutorat indépendant d'une élève de l'UTT",
        details: ["Accompagnement individuel d'une élève pour améliorer sa compréhension et ses résultats en mathématiques et en physico-chimie.","Développement de compétences pédagogiques et de communication pour rendre les notions scientifiques accessibles."],
        icon: "fa-solid fa-chalkboard-user",
        preview: 'assets/previews/exp/tutorat.jpg',
        hasContent: true
      },
      1: {
        title: "Stage ouvrier",
        period: "07/2023",
        description: "Assistant logistique chez <a href='https://www.mobility.siemens.com/fr/fr.html' style='color: inherit; text-decoration: underline;'> <strong>Siemens Mobility France</strong></a>",
        details: ["Gestion du magasin.", "Réception physique des marchandises et inspection des colis.", "Préparation des commandes", "Bases en VBA et gestion de projets."],
        icon: "fa-solid fa-industry",
        preview: 'assets/previews/exp/siemens.jpg',
        hasContent: true
      }
      },
      top : {
      6: {
        title: " A propos de Moi",
        details: ["Prénom : <strong>Romain</strong>", "Nom : <strong>Goldenchtein</strong>", "Nationalité : <strong>Français</strong>", "Âge : <strong>20 ans</strong>", "Adresse : <strong>Yerres</strong>", "Ville d'études : <strong>Troyes</strong>","Mail : <strong>r.goldenchtein@proton.me</strong>"],
        icon: "fa-regular fa-user",
        preview: 'assets/previews/about/person.jpg',
        hasContent: true
      },
      7: {
        title: "Mes passions",
        description: "Ce que j'aime faire de mon temps libre", 
        details: ["<strong>Echecs :</strong> J'ai appris de manière autodidacte et ait participé à quelques compétitions. Au meilleure de ma forme, j'ai pu attendre les 1600 elo sur chess.com !", "<strong>Danse :</strong> J'ai pratiqué pendant 12 ans le Hip-Hop et c'est une activité que j'adore !", "<strong>Concours de mémoire :</strong> J'aime bien retenir les décimales de Pi (ne me demandez pas pourquoi) et mettre ma mémoire à l'épreuve. Actuellement, j'en connnais 400 :)", "<strong>Sport :</strong> J'essaye d'aller à la salle 3 fois par semaine et de courir et nager au moins une fois par semaine. La santé, c'est important !"],
        icon: "fa-regular fa-heart",
        preview: 'assets/previews/about/hobbies.png',
        hasContent: true
      },
      8: {
        title: "Soft Skills",
        details: ["Curiosité", "Persévérance", "Résolution des problèmes", "Organisé", "Gestion de Projet"],
        icon: "fa-regular fa-lightbulb",
        preview: 'assets/previews/about/soft.jpg',
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
      right: { // **Projets**
      0: {
        title: "Portfolio",
        icon: "fa-solid fa-cube",
        period: "02/2025",
        preview: 'assets/previews/projects/portfolio.png',
        hasContent: true,
        htmlContent: `
      <div class="card-header">
        <i class="fa-solid fa-cube"></i>
        <h2>Portfolio</h2>
          <div class="period-badge">
            <i class="fas fa-calendar-alt"></i>
            <span>02/2025</span>
            </div>
        </div>
        <section class="project-summary">
        <p>Ce <em>Rubik's Cube</em> est une application web interactive qui présente mon portfolio sous la forme d'un Rubik's Cube en 3D.</p>
        </section>
        <hr>
        <div class="card-content">
        <article class="project-content">
        <p>Chaque face du cube du Rubik's Cube est dédiée à une catégorie spécifique : expériences, projets, passions et compétences. Les carrés individuels sur chaque face représentent des éléments détaillés de ces catégories.</p>
          <h3>Fonctionnalités principales :</h3>
          <ul>
          <li><strong>Interface 3D interactive :</strong> Utilisation de Three.js pour créer et manipuler le Rubik's Cube en trois dimensions, offrant une expérience utilisateur immersive.</li>
          <li><strong>Navigation intuitive :</strong> Les utilisateurs peuvent interagir avec le cube pour explorer différentes sections du portfolio, chaque face fournissant des informations spécifiques.</li>
          <li><strong>Design responsive <em>(en développement)</em> :</strong> Adaptation de l'affichage pour une expérience optimale sur divers appareils et tailles d'écran.</li>
          </ul>
          <img src="assets/previews/projects/portfolio_2.png" alt="Aperçu du Rubik's Cube en 3D" class="project-image" style="width: 90%; height: auto;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Aperçu de la page du Rubik's Cube en 3D</p>
          <h3>Technologie utilisée :</h3>
          <ul>
          <li><strong>Frontend :</strong> HTML, CSS, JavaScript</li>
          <li><strong>Bibliothèque 3D :</strong> Three.js</li>
          </ul>
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
        period: "11/2024 - 01/2025",
        preview: 'assets/previews/projects/ia01_1.png',
        hasContent: true,
        htmlContent: `
        <div class="card-header">
          <i class="fa-solid fa-chart-line"></i>
          <h2>Prédiction de défauts de paiement</h2>
          <div class="period-badge">
            <i class="fas fa-calendar-alt"></i>
            <span>11/2024 - 01/2025</span>
            </div>
        </div>
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
        period: "09/2024 - 01/2025",
        preview: 'assets/previews/projects/lo02_1.png',
        hasContent: true,
        htmlContent: `
      <div class="card-header">
        <i class="fa-brands fa-space-awesome"></i>
        <h2>Pocket Imperium</h2>
        <div class="period-badge">
            <i class="fas fa-calendar-alt"></i>
            <span>09/2024 - 01/2025</span>
            </div>
        </div>
        </div>
        <section class="project-summary">
        <p>Développement d'une version logicielle du jeu <em>Pocket Imperium</em>.</p>
        </section>
        <hr>
        <div class="card-content">
        <article class="project-content">
          <p>Un jeu de stratégie spatiale où trois factions s’affrontent pour dominer la galaxie. Inspiré des jeux 3X (eXploration, eXpansion, eXtermination), il propose un gameplay tactique sur une grille hexagonale, des combats dynamiques et trois styles de stratégies distinctes : offensif, défensif et aléatoire.</p>
          <ul>
          <li><strong>Technologies utilisées :</strong> Java 21, JavaFX 21, Maven 3.13+</li>
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
        period: "02/2024 - 07/2024",
        preview: 'assets/previews/projects/pe2_0.png',
        hasContent: true,
        htmlContent: `
      <div class="card-header">
        <i class="fa-solid fa-comments"></i>
        <h2>Neutrino Chat</h2>
        <div class="period-badge">
            <i class="fas fa-calendar-alt"></i>
            <span>02/2024 - 07/2024</span>
            </div>
        </div>
        <section class="project-summary">
        <p><em>Neutrino Chat</em> est une application de messagerie web sécurisée développée
        </section>
        <hr>
        <div class="card-content">
        <article class="project-content">
        <h3>Fonctionnalités principales :</h3>
          <ul>
          <li><strong>Création de compte sécurisée :</strong> inscription avec un nom d'utilisateur unique et un mot de passe. L'adresse email est facultative.</li>
          <li><strong>Messagerie en temps réel :</strong> utilisation de WebSockets pour des communications instantanées.</li>
          <li><strong>Chiffrement de bout en bout :</strong> les messages sont sécurisés grâce à la méthode RSA-OAEP.</li>
          <li><strong>Discussions de groupe :</strong> participation à des discussions de groupe avec des noms et photos de profil affichés en couleurs différentes.</li>
          <li><strong>Personnalisation du profil :</strong> possibilité de changer sa photo de profil.</li>
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
        period: "11/2023 - 01/2024",
        preview: 'assets/previews/projects/nf06_0.png',
        hasContent: true,
        htmlContent: `
        <div class="card-header">
          <i class="fa-solid fa-train"></i>
          <h2>Tracé d’un Réseau Ferroviaire</h2>
                  <div class="period-badge">
                    <i class="fas fa-calendar-alt"></i>
                    <span>11/2023 - 01/2024</span>
                  </div>
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
        period: "02/2023 - 06/2023",
        preview: 'assets/previews/projects/pe1_0.png',
        hasContent: true,
        htmlContent: `
        <div class="card-header">
          <i class="fa-solid fa-chess"></i>
          <h2>IA appliquée aux échecs</h2>
          <div class="period-badge">
                    <i class="fas fa-calendar-alt"></i>
                    <span>02/2023 - 06/2023</span>
                  </div>
          </div>
        <section class="project-summary">
        <p><strong>Recherche de l'algorithmes le plus performant</strong></p>
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
  
            <img src="assets/previews/projects/pe1_1.png" alt="Illustration de l'algorithme MCTS" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
            <p style="font-style: italic; font-size: 0.8em; text-align: center;">Simulations de l'algorithme MCTS</p>
  
            <p>Ce projet a permis d’étudier l’approche décisionnelle des IA d’échecs et d’optimiser leur stratégie contre un adversaire de référence. L'objectif était initialement d'ajouter un réseau de neurones au MCTS pour s'inspirer du modèle d'AlphaZero Chess. Mais par manque de temps et de connaissances au moment de la réalisation de ce projet, cela n'a pas été fait.</p>
            
          </article>
        </div>
  
        `
      },
      },
      left : {
        0: {
          title: "Certifications",
          infos : "Liste de mes certifications",
          details: [
            `<a class="info-list-link" href="https://www.deeplearning.ai/courses/deep-learning-specialization/" target="_blank">Deep Learning Specialization</a>`, 
            `<a class="info-list-link" href="https://course.elementsofai.com/" target="_blank">Introduction to AI</a>`, 
            `<a class="info-list-link" href="https://pix.fr/" target="_blank">PIX</a>`
          ],
          icon: "fa-solid fa-certificate",
          preview: 'assets/previews/formation/certif.avif',
          hasContent: true
          },
        1: {
        title: "Université technologique de Troyes - UTT",
        description: "Ecole d'ingénieur généraliste",
        details: ["Cursus en 5 ans", "Cycle généraliste pendant 2 ans", " Spécialisation actuelle dans les systèmes numériques (IA, Data et IOT)"],
        icon: "fa-solid fa-graduation-cap",
        preview: 'assets/previews/formation/utt.jpg',
        hasContent: true
        },
        2: {
        title: "Institut Saint-Pierre",
        description: "Baccalauréat Scientifique | Mention <strong>Très Bien</strong>",
        infos : "Spécialités",
        details: ["Mathématiques", " Numérique et sciences de l'informatique"],
        icon: "fa-solid fa-school",
        preview: 'assets/previews/formation/lycee.png',
        hasContent: true
        },
      }
      
    };
  
