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
        hasContent: true,
        i18n: {
          en: {
            title: "Python",
            infos: "Libraries",
            description: "Mastery of the language and libraries related to data science and AI",
            details: ["NumPy", "Pandas", "Scikit-Learn", "TensorFlow", "Keras"]
          }
        }
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
        hasContent: true,
        i18n: {
          en: {
            title: "Databases",
            description: "Database management mastery",
            infos: "List",
            details: ["SQL", "MongoDB"]
          }
        }
      },
      8: {
        title: "Pack Office",
        icon: "fa-regular fa-file-word",
        description: "Maîtrise du Pack Office",
        details: ["Word", "Excel", "PowerPoint"],
        preview: 'assets/previews/skills/office.png',
        hasContent: true,
        i18n: {
          en: {
            title: "Office Suite",
            description: "Office Suite mastery",
            details: ["Word", "Excel", "PowerPoint"]
          }
        }
      },
    },
   back: { // **Expériences**
      0: {
        title: "Optimisation de modèles LLM - Outlier.ai",
        period: "02/2025 - Aujourd'hui",
        description: "Mission freelance : amélioration des réponses de modèles LLM type GPT.",
        details: [
          "Analyse des réponses d’un modèle LLM type GPT.",
          "Amélioration de la cohérence et réduction des biais.",
          "Rédaction de rapports détaillés en anglais."
        ],
        icon: "fa-solid fa-robot",
        preview: 'assets/previews/exp/outlier.png',
        hasContent: true,
        i18n: {
          en: {
            title: "LLM Model Optimization - Outlier.ai",
            period: "02/2025 - Present",
            description: "Freelance mission: improving GPT-like model responses.",
            details: [
              "Analysis of GPT-like model outputs.",
              "Improved coherence and bias reduction.",
              "Drafting detailed reports in English."
            ]
          }
        }
      },
      1: {
        title: "Responsable de projet - Junior Conseil UTT",
        period: "09/2024 - Aujourd'hui",
        description: "Suivi et gestion de projets clients au sein de la Junior-Entreprise de l’UTT.",
        details: [
          "Suivi de projets clients (cadrage, planning, livrables, communication).",
          "Interface entre les étudiants intervenants et les clients.",
          "Garantie de la qualité et du respect des délais."
        ],
        icon: "fa-solid fa-briefcase",
        preview: 'assets/previews/exp/junior.jpg',
        hasContent: true,
        i18n: {
          en: {
            title: "Project Manager - Junior Conseil UTT",
            period: "09/2024 - Present",
            description: "Project monitoring and management within UTT’s Junior-Enterprise.",
            details: [
              "Project monitoring (scope, planning, deliverables, communication).",
              "Acting as an interface between student consultants and clients.",
              "Ensuring quality and compliance with deadlines."
            ]
          }
        }
      },
      2: {
        title: "Tutorat étudiant",
        period: "02/2024 - 06/2024",
        description: "Tutorat indépendant d'une élève de l'UTT.",
        details: [
          "Accompagnement individuel en mathématiques et physico-chimie.",
          "Développement de compétences pédagogiques et de communication."
        ],
        icon: "fa-solid fa-chalkboard-user",
        preview: 'assets/previews/exp/tutorat.jpg',
        hasContent: true,
        i18n: {
          en: {
            title: "Student Tutoring",
            period: "02/2024 - 06/2024",
            description: "Independent tutoring for a UTT student.",
            details: [
              "Individual support in mathematics and physics-chemistry.",
              "Development of teaching and communication skills."
            ]
          }
        }
      },
      3: {
        title: "Stage ouvrier - Siemens Mobility France",
        period: "07/2023",
        description: "Assistant logistique à Châtillon.",
        details: [
          "Gestion du magasin.",
          "Réception physique des marchandises et inspection des colis.",
          "Préparation des commandes.",
          "Bases en VBA et gestion de projets."
        ],
        icon: "fa-solid fa-industry",
        preview: 'assets/previews/exp/siemens.jpg',
        hasContent: true,
        i18n: {
          en: {
            title: "Internship - Siemens Mobility France",
            period: "07/2023",
            description: "Logistics Assistant in Châtillon.",
            details: [
              "Warehouse management.",
              "Physical receipt of goods and package inspection.",
              "Order preparation.",
              "Basics in VBA and project management."
            ]
          }
        }
      }
    },

      top : {
      6: {
        title: " A propos de Moi",
        details: ["Prénom : <strong>Romain</strong>", "Nom : <strong>Goldenchtein</strong>", "Nationalité : <strong>Français</strong>", "Âge : <strong>20 ans</strong>", "Adresse : <strong>Yerres</strong>", "Ville d'études : <strong>Troyes</strong>","Mail : <strong>r.goldenchtein@proton.me</strong>", "<strong>Permis B</strong>"],
        icon: "fa-regular fa-user",
        preview: 'assets/previews/about/person.jpg',
        hasContent: true,
        i18n: {
          en: {
            title: "About Me",
            details: ["First name: <strong>Romain</strong>", "Last name: <strong>Goldenchtein</strong>", "Nationality: <strong>French</strong>", "Age: <strong>20 years old</strong>", "Address: <strong>Yerres</strong>", "Study city: <strong>Troyes</strong>", "Email: <strong>r.goldenchtein@proton.me</strong>", "<strong>Driver's License</strong>"]
          }
        }
      },
      7: {
        title: "Mes passions",
        description: "Ce que j'aime faire de mon temps libre", 
        details: ["<strong>Echecs :</strong> J'ai appris de manière autodidacte et ait participé à quelques compétitions. Au meilleure de ma forme, j'ai pu attendre les 1600 elo sur chess.com !", "<strong>Danse :</strong> J'ai pratiqué pendant 12 ans le Hip-Hop et c'est une activité que j'adore !", "<strong>Concours de mémoire :</strong> J'aime bien retenir les décimales de Pi (ne me demandez pas pourquoi) et mettre ma mémoire à l'épreuve. Actuellement, j'en connnais 400 :)", "<strong>Sport :</strong> J'essaye d'aller à la salle 3 fois par semaine et de courir et nager au moins une fois par semaine. La santé, c'est important !"],
        icon: "fa-regular fa-heart",
        preview: 'assets/previews/about/hobbies.png',
        hasContent: true,
        i18n: {
          en: {
            title: "My Passions",
            description: "What I love to do in my free time",
            details: ["<strong>Chess:</strong> Self-taught, I participated in a few competitions. At my best, I reached 1600 Elo on chess.com!", "<strong>Dancing:</strong> I practiced Hip-Hop for 12 years and it's an activity that I truly love!", "<strong>Memory competitions:</strong> I enjoy memorizing digits of Pi (don't ask my why) and testing my memory. I currently know 400 digits :)", "<strong>Sport:</strong> I try to go to the gym 3 times a week and to run and swim at least once a week. Health is important!"]
          }
        }
      },
      8: {
        title: "Soft Skills",
        details: ["Curiosité", "Persévérance", "Résolution des problèmes", "Organisé", "Gestion de Projet"],
        icon: "fa-regular fa-lightbulb",
        preview: 'assets/previews/about/soft.jpg',
        hasContent: true,
        i18n: {
          en: {
            title: "Soft Skills",
            details: ["Curiosity", "Perseverance", "Problem solving", "Organized", "Project Management"]
          }
        }
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
        hasContent: true,
        i18n: {
          en: {
            title: "My Resume"
          }
        }
      }
      },
      right: { // **Projets**
      0: {
        title: "Résolution du Rubik’s Cube par Apprentissage par Renforcement",
        icon: "fa-solid fa-cube",
        period: "02/2025 - 07/2025",
        preview: 'assets/previews/projects/pe3_1.png',
        hasContent: true,
        htmlContent: `
          <div class="card-header">
            <i class="fa-solid fa-cube"></i>
            <h2>Rubik’s Cube par Apprentissage par Renforcement</h2>
            <div class="period-badge">
              <i class="fas fa-calendar-alt"></i>
              <span>02/2025 - 07/2025</span>
            </div>
          </div>
          <section class="project-summary">
            <p>Ce projet académique, documenté dans ce <a href="https://hal.science/hal-05185396v1" target="_blank">rapport et article de recherche</a>, vise à développer un agent capable de résoudre le Rubik’s Cube par <strong>apprentissage par renforcement profond</strong>, sans connaissances humaines préprogrammées.</p>
          </section>
          <hr>
          <div class="card-content">
            <article class="project-content">
              <h3>Contexte et objectifs</h3>
              <p>Le Rubik’s Cube est un problème combinatoire avec plus de <strong>43 trillions d’états possibles</strong>. L’objectif était de concevoir un agent autonome, comparer différentes stratégies d’IA, étudier la convergence des réseaux neuronaux et finalement construire un prototype robotique capable de manipuler le cube.</p>

              <h3>Méthodologie</h3>
              <p>Notre approche combine deux éléments principaux : <em>Autodidactic Iteration</em> pour générer des données d’entraînement par auto-jeu, et <em>Monte Carlo Tree Search (MCTS)</em> pour guider l’exploration des états.</p>
              <img src="assets/previews/projects/pe3_2.png" alt="Schéma de l'ADI et du MCTS appliqués au Rubik’s Cube d'après DeepCube" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
              <p style="font-style: italic; font-size: 0.8em; text-align: center;">Schéma de l'ADI et du MCTS appliqués au Rubik’s Cube d'après DeepCube</p>

              <p>Le réseau neuronal (implémenté sous TensorFlow) sert d’estimateur de valeur pour les états, ce qui oriente les décisions dans MCTS. L’apprentissage a mis en évidence les difficultés liées à la convergence et à l’exploration dans un espace d’états aussi vaste.</p>
              <img src="assets/previews/projects/pe3_3.png" alt="Visualisation du fonctionnement précis de l'ADI d'après DeepCube" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
              <p style="font-style: italic; font-size: 0.8em; text-align: center;">Visualisation du fonctionnement précis de l'ADI d'après DeepCube</p>

              <h3>Implémentation robotique</h3>
              <p>En complément de la partie logicielle, nous avons conçu un prototype robotique basé sur une Raspberry Pi et des servomoteurs, capable d’exécuter les solutions proposées par l’agent.</p>
              <img src="assets/previews/projects/pe3_0.png" alt="Robot physique pour résoudre un Rubik’s Cube" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
              <p style="font-style: italic; font-size: 0.8em; text-align: center;">Robot physique pour résoudre un Rubik’s Cube basé sur RCR3D</p>

              <h3>Technologies utilisées</h3>
              <ul>
                <li><strong>Langage :</strong> Python</li>
                <li><strong>Framework :</strong> TensorFlow</li>
                <li><strong>Algorithmes :</strong> ADI, MCTS</li>
                <li><strong>Robotique :</strong> Raspberry Pi, servomoteurs</li>
              </ul>

              <p>Ce projet illustre la capacité de l’IA moderne à résoudre des problèmes complexes sans heuristiques humaines. Il constitue un pont entre recherche académique, ingénierie logicielle et prototypage robotique. Le rapport complet est disponible sur <a href="https://hal.science/hal-05185396v1" target="_blank">HAL</a>.</p>

              <a href="https://github.com/Kiyogen24/Reinforcement-Learning-for-Rubiks-Cube" target="_blank" class="project-link">Voir le Projet sur GitHub</a>
            </article>
          </div>
        `,
        i18n: {
          en: {
            htmlContent: `
              <div class="card-header">
                <i class="fa-solid fa-cube"></i>
                <h2>Rubik’s Cube with Reinforcement Learning</h2>
                <div class="period-badge">
                  <i class="fas fa-calendar-alt"></i>
                  <span>02/2025 - 07/2025</span>
                </div>
              </div>
              <section class="project-summary">
                <p>This academic project, documented in this <a href="https://hal.science/hal-05185396v1" target="_blank">report and research paper</a>, aimed to develop an agent capable of solving the Rubik’s Cube using <strong>deep reinforcement learning</strong>, without any human-engineered heuristics.</p>
              </section>
              <hr>
              <div class="card-content">
                <article class="project-content">
                  <h3>Context and Objectives</h3>
                  <p>The Rubik’s Cube is a combinatorial problem with more than <strong>43 trillion possible states</strong>. The goal was to design an autonomous agent, compare different AI strategies, study neural network convergence, and finally build a robotic prototype able to manipulate the cube.</p>

                  <h3>Methodology</h3>
                  <p>Our approach combined two main elements: <em>Autodidactic Iteration</em> to generate training data through self-play, and <em>Monte Carlo Tree Search (MCTS)</em> to guide state exploration.</p>
                  <img src="assets/previews/projects/pe3_2.png" alt="ADI and MCTS scheme applied to the Rubik’s Cube from DeepCube" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
                  <p style="font-style: italic; font-size: 0.8em; text-align: center;">ADI + MCTS pipeline applied to the Rubik’s Cube (based on DeepCube)</p>

                  <p>The neural network (implemented in TensorFlow) served as a value estimator for states, guiding MCTS decisions. Training highlighted the difficulties of convergence and exploration in such a vast state space.</p>
                  <img src="assets/previews/projects/pe3_3.png" alt="Detailed ADI process visualization from DeepCube" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
                  <p style="font-style: italic; font-size: 0.8em; text-align: center;">Detailed ADI visualization (based on DeepCube)</p>

                  <h3>Robotic Implementation</h3>
                  <p>In addition to the software, we designed a robotic prototype using a Raspberry Pi and servomotors, capable of executing the solutions generated by the agent.</p>
                  <img src="assets/previews/projects/pe3_0.png" alt="Physical robot solving a Rubik’s Cube" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
                  <p style="font-style: italic; font-size: 0.8em; text-align: center;">Physical Rubik’s Cube solving robot inspired by RCR3D</p>

                  <h3>Technologies</h3>
                  <ul>
                    <li><strong>Language:</strong> Python</li>
                    <li><strong>Framework:</strong> TensorFlow</li>
                    <li><strong>Algorithms:</strong> ADI, MCTS</li>
                    <li><strong>Robotics:</strong> Raspberry Pi, servomotors</li>
                  </ul>

                  <p>This project illustrates how modern AI can solve complex problems without human heuristics. It bridges academic research, software engineering, and robotic prototyping. The full report is available on <a href="https://hal.science/hal-05185396v1" target="_blank">HAL</a>.</p>

                  <a href="https://github.com/Kiyogen24/Reinforcement-Learning-for-Rubiks-Cube" target="_blank" class="project-link">View Project on GitHub</a>
                </article>
              </div>
            `
          }
        }
      },


      1: {
        title: "Classification d’images et détection de chutes",
        icon: "fa-solid fa-brain",
        period: "05/2025 - 06/2025",
        preview: 'assets/previews/projects/ia02_0.png',
        hasContent: true,
        htmlContent: `
          <div class="card-header">
            <i class="fa-solid fa-brain"></i>
            <h2>Classification d’images et détection de chutes (IA02)</h2>
            <div class="period-badge">
              <i class="fas fa-calendar-alt"></i>
              <span>05/2025 - 06/2025</span>
            </div>
          </div>
          <section class="project-summary">
            <p>Ce projet académique a été réalisé dans le cadre du module IA02 à l’UTT. Il comporte deux volets : 
            la <strong>classification d’images avec CIFAR-10</strong> et la <strong>détection de chutes</strong> à partir de signaux multidimensionnels. 
            L’objectif global était d’explorer différentes approches d’IA pour des cas concrets de vision et de reconnaissance de motifs.</p>
          </section>
          <hr>
          <div class="card-content">
            <article class="project-content">
              <h3>Partie 1 – Classification sur CIFAR-10</h3>
              <p>Le dataset CIFAR-10 contient 60 000 images 32x32 réparties en 10 classes. Après un prétraitement 
              (normalisation, encodage, séparation train/val), nous avons comparé différentes approches :</p>
              <ul>
                <li><strong>Algorithmes classiques (Decision Tree, Random Forest) :</strong> performances faibles (~10% accuracy).</li>
                <li><strong>CNN classique :</strong> architecture simple avec deux blocs convolution + pooling.</li>
                <li><strong>CNN complexe :</strong> ajout de Batch Normalization et Dropout pour limiter l’overfitting.</li>
                <li><strong>Architecture inspirée de MCDNN :</strong> réseau multi-colonnes, plus coûteux mais performant (~83% accuracy).</li>
                <li><strong>Modèle hybride MobileNetV2 :</strong> transfert learning avec fine-tuning partiel, rapidité d’entraînement et bons résultats.</li>
              </ul>
              <img src="assets/previews/projects/ia02_1.png" alt="Exemple de classification sur CIFAR-10" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
              <p style="font-style: italic; font-size: 0.8em; text-align: center;">Exemple de classification sur CIFAR-10</p>

              <h3>Partie 2 – Détection de chutes</h3>
              <p>À partir du dataset ENetFall (757 signaux multidimensionnels), nous avons conçu plusieurs modèles :</p>
              <ul>
                <li><strong>CNN simple :</strong> bonne précision et robustesse initiale.</li>
                <li><strong>MobileNetV2 pré-entraîné :</strong> excellent rappel, pertinent pour détecter la majorité des chutes.</li>
                <li><strong>CNN-LSTM :</strong> combinaison spatiale + temporelle, mais résultats inférieurs (~80% accuracy).</li>
              </ul>
              <p>Nous avons aussi intégré des techniques d’augmentation de données (bruit, décalage temporel, masquage) 
              pour améliorer la robustesse en conditions réelles.</p>
              <img src="assets/previews/projects/ia02_2.png" alt="Exemple de signaux pour la détection de chutes" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
              <p style="font-style: italic; font-size: 0.8em; text-align: center;">Représentation de signaux pour la détection de chutes</p>

              <h3>Technologies utilisées</h3>
              <ul>
                <li><strong>Langage :</strong> Python</li>
                <li><strong>Frameworks :</strong> TensorFlow, Keras</li>
                <li><strong>Optimisation :</strong> Optuna pour l’ajustement des hyperparamètres</li>
                <li><strong>Approches :</strong> CNN, Transfer Learning, CNN-LSTM</li>
              </ul>

              <p>Ce projet a permis de comparer concrètement différentes architectures et de mettre en évidence 
              les enjeux de généralisation et d’optimisation en deep learning.</p>

              <a href="https://github.com/Kiyogen24/IA02-Projet" target="_blank" class="project-link">Voir le Projet sur GitHub</a>
            </article>
          </div>
        `,
        i18n: {
          en: {
            htmlContent: `
              <div class="card-header">
                <i class="fa-solid fa-brain"></i>
                <h2>Image Classification and Fall Detection</h2>
                <div class="period-badge">
                  <i class="fas fa-calendar-alt"></i>
                  <span>05/2025 - 06/2025</span>
                </div>
              </div>
              <section class="project-summary">
                <p>This academic project, carried out at UTT in the IA02 module, consisted of two parts: 
                <strong>image classification with CIFAR-10</strong> and <strong>fall detection</strong> from multidimensional signals. 
                The global objective was to explore and compare different AI methods for vision and pattern recognition problems.</p>
              </section>
              <hr>
              <div class="card-content">
                <article class="project-content">
                  <h3>Part 1 – CIFAR-10 Classification</h3>
                  <p>The CIFAR-10 dataset contains 60,000 images (32x32, 10 classes). After preprocessing (normalization, encoding, train/val split), we compared:</p>
                  <ul>
                    <li><strong>Classical ML (Decision Tree, Random Forest):</strong> very poor results (~10% accuracy).</li>
                    <li><strong>Simple CNN:</strong> two convolution + pooling blocks.</li>
                    <li><strong>Complex CNN:</strong> added Batch Normalization and Dropout to reduce overfitting.</li>
                    <li><strong>MCDNN-inspired architecture:</strong> multi-column network, more costly but achieved ~83% accuracy.</li>
                    <li><strong>Hybrid MobileNetV2 model:</strong> transfer learning with partial fine-tuning, fast training and strong performance.</li>
                  </ul>
                  <img src="assets/previews/projects/ia02_1.png" alt="CIFAR-10 classification example" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
                  <p style="font-style: italic; font-size: 0.8em; text-align: center;">Example of CIFAR-10 classification</p>

                  <h3>Part 2 – Fall Detection</h3>
                  <p>Using the ENetFall dataset (757 multidimensional signals), we tested several models:</p>
                  <ul>
                    <li><strong>Simple CNN:</strong> strong initial accuracy.</li>
                    <li><strong>Pre-trained MobileNetV2:</strong> excellent recall, especially important for avoiding missed falls.</li>
                    <li><strong>CNN-LSTM:</strong> spatio-temporal modeling, but weaker results (~80% accuracy).</li>
                  </ul>
                  <p>We also implemented data augmentation techniques (Gaussian noise, temporal shifts, dropout masking) to increase robustness in real conditions.</p>
                  <img src="assets/previews/projects/ia02_2.png" alt="Signals used for fall detection" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
                  <p style="font-style: italic; font-size: 0.8em; text-align: center;">Signal representation for fall detection</p>

                  <h3>Technologies</h3>
                  <ul>
                    <li><strong>Language:</strong> Python</li>
                    <li><strong>Frameworks:</strong> TensorFlow, Keras</li>
                    <li><strong>Optimization:</strong> Optuna for hyperparameter tuning</li>
                    <li><strong>Approaches:</strong> CNN, Transfer Learning, CNN-LSTM</li>
                  </ul>

                  <p>This project allowed us to benchmark multiple architectures and highlighted the challenges of generalization and optimization in deep learning.</p>

                  <a href="https://github.com/Kiyogen24/IA02-Projet" target="_blank" class="project-link">View Project on GitHub</a>
                </article>
              </div>
            `
          }
        }
      },

      2: {
      title: "Portfolio",
      icon: "fa-solid fa-cube",
      period: "02/2025 - 09/2025",
      preview: 'assets/previews/projects/portfolio_0.png',
      hasContent: true,
      htmlContent: `
        <div class="card-header">
          <i class="fa-solid fa-cube"></i>
          <h2>Portfolio</h2>
          <div class="period-badge">
            <i class="fas fa-calendar-alt"></i>
            <span>02/2025 - 09/2025</span>
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
              <li><strong>Mélange et mode jeu :</strong> Possibilité de mélanger le cube et de jouer avec, ajoutant une dimension ludique à la navigation.</li>
              <li><strong>Bouton EN/FR :</strong> Changement de langue dynamique pour une expérience bilingue.</li>
              <li><strong>Design responsive <em>(en développement)</em> :</strong> Adaptation de l'affichage pour une expérience optimale sur divers appareils et tailles d'écran.</li>
            </ul>

            <img src="assets/previews/projects/portfolio_2.png" alt="Aperçu du Rubik's Cube en 3D" class="project-image" style="width: 90%; height: auto;">
            <p style="font-style: italic; font-size: 0.8em; text-align: center;">Aperçu de la page du Rubik's Cube en 3D</p>

            <img src="assets/previews/projects/portfolio_3.png" alt="Cube mélangé et mode jeu" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
            <p style="font-style: italic; font-size: 0.8em; text-align: center;">Aperçu du cube mélangé en mode jeu</p>
            
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
      `,
      i18n: {
        en: {
          htmlContent: `
            <div class="card-header">
              <i class="fa-solid fa-cube"></i>
              <h2>Portfolio</h2>
              <div class="period-badge">
                <i class="fas fa-calendar-alt"></i>
                <span>02/2025 - 09/2025</span>
              </div>
            </div>
            <section class="project-summary">
              <p>This <em>Rubik's Cube</em> is an interactive web application that presents my portfolio as a 3D Rubik's Cube.</p>
            </section>
            <hr>
            <div class="card-content">
              <article class="project-content">
                <p>Each face of the Rubik's Cube is dedicated to a specific category: experiences, projects, passions and skills. Individual squares on each face represent detailed items of these categories.</p>
                <h3>Main features:</h3>
                <ul>
                  <li><strong>Interactive 3D interface:</strong> Uses Three.js to create and manipulate the Rubik's Cube in three dimensions for an immersive user experience.</li>
                  <li><strong>Intuitive navigation:</strong> Users can interact with the cube to explore different sections of the portfolio, each face providing specific information.</li>
                  <li><strong>Shuffle and play mode:</strong> Ability to shuffle the cube and play with it, adding a playful dimension to navigation.</li>
                  <li><strong>EN/FR toggle button:</strong> Dynamic language switch for a bilingual experience.</li>
                  <li><strong>Responsive design <em>(in progress)</em>:</strong> Adapts the display for an optimal experience across devices and screen sizes.</li>
                </ul>
                <img src="assets/previews/projects/portfolio_mix.png" alt="Shuffled cube in play mode" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
                <p style="font-style: italic; font-size: 0.8em; text-align: center;">Preview of the shuffled cube in play mode</p>

                <img src="assets/previews/projects/portfolio_2.png" alt="Rubik's Cube 3D preview" class="project-image" style="width: 90%; height: auto;">
                <p style="font-style: italic; font-size: 0.8em; text-align: center;">Preview of the 3D Rubik's Cube page</p>

                <h3>Technology used:</h3>
                <ul>
                  <li><strong>Frontend:</strong> HTML, CSS, JavaScript</li>
                  <li><strong>3D library:</strong> Three.js</li>
                </ul>

                <img src="assets/previews/projects/portfolio_1.png" alt="Preview of a face" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
                <p style="font-style: italic; font-size: 0.8em; text-align: center;">Preview of one face with hover effect</p>
                <p>The site is built with a 3D-first approach, offering an immersive user experience and intuitive navigation through my various projects and skills.</p>
                <a href="https://github.com/Kiyogen24/Rubiks-Cube-Portfolio" target="_blank" class="project-link">See Project</a>
              </article>
            </div>
          `
        }
      }
    },

      3: {
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
      `,
      i18n: {
        en: {
          htmlContent: `
        <div class="card-header">
          <i class="fa-solid fa-chart-line"></i>
          <h2>Payment Default Prediction</h2>
          <div class="period-badge">
            <i class="fas fa-calendar-alt"></i>
            <span>11/2024 - 01/2025</span>
            </div>
        </div>
        </div>
        <section class="project-summary">
          <p>This project analyzes a credit dataset and develops machine learning models to predict borrower solvency.</p>
        </section>
        <hr>
        <div class="card-content">
        <article class="project-content">
          <p>Using client data, the goal is to identify factors influencing credit risk and train different models to improve prediction accuracy.</p>
  
            <img src="assets/previews/projects/ia01_1.png" alt="Dataset preview" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
            <p style="font-style: italic; font-size: 0.8em; text-align: center;">Dataset preview</p>
            <h3>Main features:</h3>
            <ul>
              <li><strong>Exploration and preprocessing:</strong> Data cleaning, handling missing values and distribution analysis.</li>
              <li><strong>Trend visualization:</strong> Use of Seaborn and Matplotlib to explore variable relationships.</li>
              <li><strong>Modeling and optimization:</strong> Comparison of several algorithms (kNN, Random Forest, Decision Trees, Logistic Regression, MLP) with hyperparameter tuning.</li>
            </ul>
  
            <h3>Technologies used:</h3>
            <ul>
              <li><strong>Language:</strong> Python</li>
              <li><strong>Libraries:</strong> Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn</li>
            </ul>
  
            <img src="assets/previews/projects/ia01_2.png" alt="Model comparison" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
            <p style="font-style: italic; font-size: 0.8em; text-align: center;">Model comparison</p>
  
            <p>This project implements a complete ML workflow applied to finance, from exploratory data analysis to model optimization.</p>
            
            <a href="https://github.com/Kiyogen24/Project_IA01" target="_blank" class="project-link">See Project</a>
          </article>
        </div>
      `
        }
      }
      },
      4: {
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
          <p>Un jeu de stratégie spatiale où trois factions s’affrontent pour dominer la galaxie. Inspiré des jeux 3X (eXploration, eXpansion, eXtermination), il propose un gameplay tactique sur une grille hexagonale, des combats dynamiques et trois styles de stratégies distincts : offensif, défensif et aléatoire.</p>
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
      `,
      i18n: {
        en: {
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
        <p>Development of a software version of the game <em>Pocket Imperium</em>.</p>
        </section>
        <hr>
        <div class="card-content">
        <article class="project-content">
          <p>A space strategy game where three factions compete to dominate the galaxy. Inspired by 3X games (eXploration, eXpansion, eXtermination), it offers tactical gameplay on a hex grid, dynamic combat and three distinct strategic styles: aggressive, defensive and random.</p>
          <ul>
          <li><strong>Technologies used:</strong> Java 21, JavaFX 21, Maven 3.13+</li>
          </ul>
          <img src="assets/previews/projects/lo02_1.png" alt="PocketImperium preview" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Preview of the game menu</p>
          <p>The game includes a full GUI, an action log to track events, and a save/load system. Sound effects and music add immersion.</p>
          <img src="assets/previews/projects/lo02_2.png" alt="PocketImperium preview" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Board of PocketImperium, move history and action choices</p>
          <a href="https://github.com/Kiyogen24/PocketImperium" target="_blank" class="project-link">See Project</a>
        </article>
        </div>
      `
        }
      }
      },
      5: {
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
        `,
        i18n: {
          en: {
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
        <p><em>Neutrino Chat</em> is a secure web messaging application developed
        </section>
        <hr>
        <div class="card-content">
        <article class="project-content">
        <h3>Main features:</h3>
          <ul>
          <li><strong>Secure account creation:</strong> sign-up with a unique username and password. Email is optional.</li>
          <li><strong>Real-time messaging:</strong> uses WebSockets for instant communication.</li>
          <li><strong>End-to-end encryption:</strong> messages are secured using RSA-OAEP.</li>
          <li><strong>Group chats:</strong> participate in groups with colored names and avatars.</li>
          <li><strong>Profile customization:</strong> ability to change your avatar.</li>
          </ul>
          <img src="assets/previews/projects/pe2_1.png" alt="Login page preview" class="project-image" style="width: 90%; height: auto;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Login page preview</p>
          <h3>Technology used:</h3>
          <ul>
          <li><strong>Frontend:</strong> HTML, CSS, JavaScript</li>
          <li><strong>Backend:</strong> Node.js, Express.js</li>
          <li><strong>Database:</strong> MongoDB</li>
          <li><strong>Security:</strong> RSA-OAEP encryption, secure session management</li>
          </ul>
          <img src="assets/previews/projects/pe2_2.png" alt="Group chat preview" class="project-image" style="width: 90%; height: auto;">
          <p style="font-style: italic; font-size: 0.8em; text-align: center;">Group chat preview</p>
          <a href="https://github.com/Kiyogen24/Neutrino" target="_blank" class="project-link">See Project</a>
        </article>
        </div>
        `
          }
        }
      },
      6: {
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
        `,
      i18n: {
      en: {
      htmlContent: `
        <div class="card-header">
          <i class="fa-solid fa-train"></i>
          <h2>Railway Network Layout</h2>
          <div class="period-badge">
            <i class="fas fa-calendar-alt"></i>
            <span>11/2023 - 01/2024</span>
          </div>
        </div>
        <section class="project-summary">
          <p>This project designs and implements an optimal railway network using graph algorithms to determine the most efficient routes.</p>
        </section>
        <hr>
        <div class="card-content">
          <article class="project-content">
            <p>The goal is to model a railway network by representing stations and tracks as graphs, then apply algorithms to optimize routes and associated costs.</p>

            <h3>Main features:</h3>
            <ul>
              <li><strong>Prim's algorithm implementation:</strong> Used to find the network's minimum spanning tree (MST), ensuring optimal connectivity between all stations.</li>
              <li><strong>Dijkstra's algorithm implementation:</strong> Computes the shortest paths between two stations to facilitate trip planning.</li>
              <li><strong>Network visualization:</strong> Generates an interactive map showing the railway network and optimized routes.</li>
            </ul>

            <img src="assets/previews/projects/nf06_1.png" alt="Rail network visualization" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
            <p style="font-style: italic; font-size: 0.8em; text-align: center;">Rail network visualization</p>

            <h3>Technologies used:</h3>
            <ul>
              <li><strong>Languages:</strong> C for graph algorithms, Python for the interface and visualization</li>
              <li><strong>Libraries:</strong> ctypes for C–Python interfacing, Tkinter for the GUI, and Folium for the interactive map</li>
            </ul>

            <img src="assets/previews/projects/nf06_2.png" alt="Illustration of the distance between two paths" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
            <p style="font-style: italic; font-size: 0.8em; text-align: center;">Illustration of the distance between two paths</p>

            <p>This project applies advanced graph theory concepts and demonstrates efficient integration between high-performance C modules and a user-friendly Python interface for modeling complex networks.</p>

            <a href="https://github.com/Kiyogen24/NF06_project" target="_blank" class="project-link">See Project</a>
          </article>
        </div>
        `
          }
        }
      },
      7: {
        title: "Recherche d'algorithmes pour jouer aux échecs",
        icon: "fa-solid fa-chess",
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
          <p><strong>Recherche de l'algorithme le plus performant</strong></p>
            <p>Ce projet en binôme explore et compare deux algorithmes d’intelligence artificielle jouant aux échecs : <strong>Minimax</strong> et <strong>Monte Carlo Tree Search (MCTS)</strong>.</p>
          </section>
          <hr>
          <div class="card-content">
            <article class="project-content">
              <p>L’objectif est d’analyser leurs performances en termes de précision, de rapidité et de prise de décision face à un moteur d’échecs de référence.</p>

              <h3>Fonctionnalités principales :</h3>
              <ul>
                <li><strong>Implémentation de Minimax :</strong> Algorithme de recherche du meilleur coup avec élagage alpha-bêta et table de transposition.</li>
                <li><strong>Implémentation de MCTS :</strong> Approche basée sur des simulations de parties pour estimer la qualité des coups.</li>
                <li><strong>Comparaison avec Stockfish :</strong> Évaluation des décisions prises par les algorithmes face à un moteur d’échecs avancé.</li>
                <li><strong>Visualisation des parties :</strong> Représentation graphique de l’arbre de recherche pour mieux comprendre la prise de décision.</li>
                <li><strong>Interface graphique :</strong> Visualisation des deux algorithmes s'affrontant aux échecs.</li>
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
        `,
        i18n: {
          en: {
            htmlContent: `
              <div class="card-header">
                <i class="fa-solid fa-chess"></i>
                <h2>AI applied to Chess</h2>
                <div class="period-badge">
                  <i class="fas fa-calendar-alt"></i>
                  <span>02/2023 - 06/2023</span>
                </div>
              </div>
              <section class="project-summary">
                <p><strong>Research on the most effective algorithm</strong></p>
                <p>This two-person project explores and compares two artificial intelligence algorithms for playing chess: <strong>Minimax</strong> and <strong>Monte Carlo Tree Search (MCTS)</strong>.</p>
              </section>
              <hr>
              <div class="card-content">
                <article class="project-content">
                  <p>The objective is to analyze their performance in terms of accuracy, speed, and decision-making against a reference chess engine.</p>

                  <h3>Main features:</h3>
                  <ul>
                    <li><strong>Minimax implementation:</strong> Search algorithm with alpha-beta pruning and transposition tables.</li>
                    <li><strong>MCTS implementation:</strong> Simulation-based approach to estimate move quality.</li>
                    <li><strong>Comparison with Stockfish:</strong> Evaluation of algorithm decisions against a strong chess engine.</li>
                    <li><strong>Game visualization:</strong> Graphical representation of the search tree to better understand decision-making.</li>
                    <li><strong>Graphical interface:</strong> Visualization of both algorithms competing against each other in chess.</li>
                  </ul>

                  <img src="assets/previews/projects/pe1_2.png" alt="Minimax algorithm illustration" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
                  <p style="font-style: italic; font-size: 0.8em; text-align: center;">Minimax algorithm illustration</p>

                  <h3>Technologies used:</h3>
                  <ul>
                    <li><strong>Language:</strong> Python</li>
                    <li><strong>Libraries:</strong> Chess, NumPy, Matplotlib, Flask</li>
                    <li><strong>Chess engine:</strong> Stockfish</li>
                  </ul>

                  <img src="assets/previews/projects/pe1_1.png" alt="MCTS algorithm simulation" class="project-image" style="width: 90%; height: auto; margin: 1rem;">
                  <p style="font-style: italic; font-size: 0.8em; text-align: center;">MCTS algorithm simulations</p>

                  <p>This project made it possible to study the decision-making approach of chess AIs and to optimize their strategy against a reference opponent. The initial goal was to add a neural network to MCTS to follow the AlphaZero Chess model, but due to lack of time and knowledge at the time, this was not implemented.</p>
                </article>
              </div>
            `
          }
        }
      },
    },

    left : {
      0: {
        title: "Université Technologique de Troyes - UTT",
        description: "École d'ingénieur généraliste",
        details: [
          "Cursus en 5 ans",
          "Cycle généraliste pendant 2 ans",
          "Cycle Informatique pendant 3 ans",
          "Spécialisation actuelle dans la data et l'IA"
        ],
        icon: "fa-solid fa-graduation-cap",
        preview: 'assets/previews/formation/utt.jpg',
        hasContent: true,
        i18n: {
          en: {
            title: "University of Technology of Troyes - UTT",
            description: "General engineering school",
            details: [
              "5-year curriculum",
              "2 years of general enginerring studies",
              "3 years of computer science studies",
              "Current specialization in Data and AI"
            ]
          }
        }
      },
      1: {
        title: "Institut Saint-Pierre",
        description: "Baccalauréat Scientifique | Mention <strong>Très Bien</strong>",
        details: [
          "Mathématiques",
          "Numérique et sciences de l'informatique"
        ],
        icon: "fa-solid fa-school",
        preview: 'assets/previews/formation/lycee.png',
        hasContent: true,
        i18n: {
          en: {
            title: "Institut Saint-Pierre",
            description: "Scientific Baccalaureate | With honors <strong>Highest Distinction</strong>",
            details: [
              "Mathematics",
              "Computer Science and Digital Sciences"
            ]
          }
        }
      },
      2: {
        title: "Certifications",
        description: "Liste de mes certifications",
        details: [
            `<a class="info-list-link" href="https://www.deeplearning.ai/courses/deep-learning-specialization/" target="_blank">Deep Learning Specialization</a>`, 
            `<a class="info-list-link" href="https://course.elementsofai.com/" target="_blank">Introduction to AI</a>`, 
            `<a class="info-list-link" href="https://pix.fr/" target="_blank">PIX</a>`
          ],
        icon: "fa-solid fa-certificate",
        preview: 'assets/previews/formation/certif.avif',
        hasContent: true,
        i18n: {
          en: {
            title: "Certifications",
            description: "List of my certifications",
            details: [
            `<a class="info-list-link" href="https://www.deeplearning.ai/courses/deep-learning-specialization/" target="_blank">Deep Learning Specialization</a>`, 
            `<a class="info-list-link" href="https://course.elementsofai.com/" target="_blank">Introduction to AI</a>`, 
            `<a class="info-list-link" href="https://pix.fr/" target="_blank">PIX</a>`
            ],
          }
        }
      },
    }
      
    };

// Site-level internationalized strings (intro, UI texts, menu, footer, hints)
export const SITE_I18N = {
  fr: {
    pageTitle: 'Portfolio Romain Goldenchtein',
    loadingText: 'Chargement...',
    deviceNote: "Ce site est optimisé pour PC, il est fortement recommandé de le consulter sur ordinateur pour une meilleure expérience.",
    typingText: 'Bienvenue sur ce Rubik-folio !',
    intro: {
      paragraphs: [
        "Salut ! Je m'appelle <strong>Romain Goldenchtein</strong> et ceci est mon portfolio.",
        "Ce qui me motive avant tout, c’est <strong>l'innovation</strong> et la recherche de nouvelles approches pour résoudre des problèmes complexes. Passionné par l’<strong>intelligence artificielle</strong>, je m’intéresse particulièrement au <strong>deep learning</strong> et à ses applications. Mais au-delà des algorithmes, c’est <em>l’impact des technologies</em> qui me fascine : comment elles transforment notre manière de comprendre, d’optimiser et de créer.",
        "Curieux et toujours en quête de nouveaux défis, j’explore divers domaines liés à la <strong>data</strong>, à l’<strong>IA</strong> et au <strong>développement logiciel</strong>. Que ce soit en construisant des modèles de <strong>machine learning</strong>, en concevant des architectures logicielles ou en expérimentant de nouvelles technologies, j’aime apprendre en faisant et repousser les limites du possible.",
        "Ce portfolio est un aperçu de mon parcours et de mes projets, pensés pour être à la fois <strong>techniques</strong> et <strong>innovants</strong>.",
        "<em>Le Rubik’s Cube que vous verrez n’est pas là pour décorer. <strong>N'hésitez pas à l’explorer !</strong></em>",
        "<strong>Bonne navigation !</strong>"
      ]
    },
    menu: {
      items: [
        { title: 'À propos', desc: 'Qui suis-je ?', face: 'top' },
        { title: 'Compétences', desc: 'Les hard skills', face: 'front' },
        { title: 'Projets', desc: 'Mes réalisations', face: 'right' },
        { title: 'Expériences', desc: 'Mon parcours professionnel', face: 'back' },
        { title: 'Formation', desc: 'Mon parcours académique', face: 'left' },
        { title: 'Mon CV', desc: 'Pour voir le CV', face: 'bottom' }
      ]
    },
    footer: {
      contact: 'Contact',
      socialNetworks: 'Réseaux Sociaux',
      navigation: 'Navigation',
      downloadCV: 'Télécharger CV',
      quickLinks: { home: 'Accueil', front: 'Compétences', back: 'Expériences', right: 'Projets', left: 'Formation', top: 'À propos' },
      contactInfo: { email: 'r.goldenchtein@proton.me', phone: '+33 7 83 23 23 70', location: 'Troyes, France' },
      socialLabels: { github: 'GitHub', linkedin: 'LinkedIn', download: 'Télécharger CV' }
    },
    hints: {
      clickHint: 'Cliquez sur le cube pour explorer ou faites glisser pour le pivoter',
      navHint: 'Utilisez ces boutons pour naviguer entre les sections',
      rotateHint: 'Faites glisser une face pour la pivoter',
      scrollText: 'Scroll'
    }
  },
  en: {
    pageTitle: 'Portfolio Romain Goldenchtein',
    loadingText: 'Loading...',
    deviceNote: 'This site is optimized for desktop. For the best experience, please visit on a computer.',
    typingText: 'Welcome to this Rubik-folio!',
    intro: {
      paragraphs: [
        "Hi! I'm <strong>Romain Goldenchtein</strong> and this is my portfolio.",
        "My main motivation is <strong>innovation</strong> and finding new approaches to solve complex problems. Passionate about <strong>artificial intelligence</strong>, I am particularly interested in <strong>deep learning</strong> and its applications. Beyond algorithms, it is the <em>impact of technologies</em> that fascinates me: how they transform how we understand, optimize and create.",
        "Curious and always seeking new challenges, I explore various fields related to <strong>data</strong>, <strong>AI</strong> and <strong>software development</strong>. Whether building machine learning models, designing software architectures or experimenting with new technologies, I enjoy learning by doing and pushing the limits of what is possible.",
        "This portfolio gives an overview of my background and projects, designed to be both <strong>technical</strong> and <strong>innovative</strong>.",
        "<em>The Rubik's Cube you will see is not just decoration. <strong>Feel free to explore it!</strong></em>",
        "<strong>Enjoy your visit!</strong>"
      ]
    },
    menu: {
      items: [
        { title: 'About', desc: 'Who I am', face: 'top' },
        { title: 'Skills', desc: 'My hard skills', face: 'front' },
        { title: 'Projects', desc: 'My achievements', face: 'right' },
        { title: 'Experience', desc: 'My professional background', face: 'back' },
        { title: 'Education', desc: 'My academic path', face: 'left' },
        { title: 'Resume', desc: 'View my resume', face: 'bottom' }
      ]
    },
    footer: {
      contact: 'Contact',
      socialNetworks: 'Social Networks',
      navigation: 'Navigation',
      downloadCV: 'Download Resume',
      quickLinks: { home: 'Home', front: 'Skills', back: 'Experience', right: 'Projects', left: 'Education', top: 'About' },
      contactInfo: { email: 'r.goldenchtein@proton.me', phone: '+33 7 83 23 23 70', location: 'Troyes, France' },
      socialLabels: { github: 'GitHub', linkedin: 'LinkedIn', download: 'Download Resume' }
    },
    hints: {
      clickHint: 'Click the cube to explore or drag to rotate it',
      navHint: 'Use these buttons to navigate between sections',
      rotateHint: 'Drag a face to rotate it',
      scrollText: 'Scroll'
    }
  }
};

