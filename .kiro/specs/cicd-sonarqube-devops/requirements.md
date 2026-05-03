# Document des Exigences

## Introduction

Ce document décrit les exigences pour la mise en place de la partie DevOps du projet Full Stack JS **ZeroOne Studio** (HRBrain). Le projet comprend un backend NestJS (`BackOffice`) et un frontend React/Vite (`FrontOffice`). L'objectif est de mettre en place :

1. **4 pipelines CI/CD** (2 CI + 2 CD, un par composant) avec intégration des tests unitaires.
2. **L'analyse de qualité du code via SonarQube**, avec mesure de la couverture de tests et comparaison avant/après refactoring.

Les pipelines sont destinés à être exécutés sur une plateforme CI/CD (GitLab CI ou GitHub Actions). SonarQube peut être auto-hébergé ou utilisé via SonarCloud.

---

## Glossaire

- **CI_Pipeline** : Pipeline d'intégration continue — exécute les étapes de build, lint et tests unitaires à chaque push ou pull request.
- **CD_Pipeline** : Pipeline de déploiement continu — construit l'image Docker et la déploie après le succès du CI correspondant.
- **Backend** : Application NestJS située dans `ZeroOne-Studio-main/BackOffice`, utilisant Jest comme framework de test.
- **Frontend** : Application React/Vite située dans `ZeroOne-Studio-main/FrontOffice`, utilisant Vitest comme framework de test.
- **SonarQube** : Outil d'analyse statique de la qualité du code mesurant les bugs, vulnérabilités, code smells et la couverture de tests.
- **Coverage_Report** : Rapport de couverture de tests au format LCOV généré par Jest (Backend) ou Vitest (Frontend).
- **Quality_Gate** : Seuil de qualité défini dans SonarQube que le projet doit atteindre pour que le pipeline soit considéré comme réussi.
- **Docker_Image** : Image conteneurisée du Backend ou du Frontend prête à être déployée.
- **Registry** : Registre Docker (ex. Docker Hub, GitLab Container Registry) où sont stockées les images Docker.
- **Branch_Main** : Branche principale du dépôt Git (`main` ou `master`).
- **Develop_Branch** : Branche de développement du dépôt Git (`develop`).
- **Jenkinsfile** : Fichier texte définissant un pipeline Jenkins en syntaxe déclarative (Pipeline as Code), versionné dans le dépôt Git.
- **Jenkins_Agent** : Nœud d'exécution Jenkins sur lequel s'exécutent les stages d'un pipeline (ex. agent Docker `node:20`, agent `docker`).
- **Jenkins_Credential** : Secret stocké dans Jenkins (token SonarQube, identifiants Registry) référencé par un identifiant dans les Jenkinsfiles sans exposition dans les logs.
- **Upstream_Trigger** : Mécanisme Jenkins déclenchant automatiquement le `CD_Pipeline` à la suite du succès du `CI_Pipeline` correspondant via `build job` ou `upstream` trigger.

---

## Exigences

### Exigence 1 : Pipeline CI Backend

**User Story :** En tant que développeur backend, je veux qu'un pipeline CI s'exécute automatiquement sur le code NestJS, afin de détecter les régressions et valider la qualité du code avant toute intégration.

#### Critères d'acceptation

1. WHEN un push est effectué sur `Develop_Branch` ou une pull request est ouverte vers `Branch_Main`, THE `CI_Pipeline` Backend SHALL s'exécuter automatiquement.
2. THE `CI_Pipeline` Backend SHALL installer les dépendances Node.js du `Backend` via `npm ci`.
3. THE `CI_Pipeline` Backend SHALL exécuter le linter ESLint sur les sources du `Backend` et échouer si des erreurs sont détectées.
4. THE `CI_Pipeline` Backend SHALL exécuter les tests unitaires Jest du `Backend` via `npm run test:cov`.
5. WHEN les tests unitaires s'exécutent, THE `CI_Pipeline` Backend SHALL générer un `Coverage_Report` au format LCOV dans le répertoire `coverage/`.
6. IF une étape du `CI_Pipeline` Backend échoue, THEN THE `CI_Pipeline` Backend SHALL marquer le pipeline comme échoué et notifier l'équipe.
7. THE `CI_Pipeline` Backend SHALL publier le `Coverage_Report` comme artefact accessible pendant au moins 7 jours.

---

### Exigence 2 : Pipeline CI Frontend

**User Story :** En tant que développeur frontend, je veux qu'un pipeline CI s'exécute automatiquement sur le code React/Vite, afin de valider les tests et la qualité du code avant toute intégration.

#### Critères d'acceptation

1. WHEN un push est effectué sur `Develop_Branch` ou une pull request est ouverte vers `Branch_Main`, THE `CI_Pipeline` Frontend SHALL s'exécuter automatiquement.
2. THE `CI_Pipeline` Frontend SHALL installer les dépendances Node.js du `Frontend` via `npm ci`.
3. THE `CI_Pipeline` Frontend SHALL exécuter les tests unitaires Vitest du `Frontend` via `npm run test:coverage`.
4. WHEN les tests unitaires s'exécutent, THE `CI_Pipeline` Frontend SHALL générer un `Coverage_Report` au format LCOV dans le répertoire `coverage/`.
5. THE `CI_Pipeline` Frontend SHALL exécuter le build de production du `Frontend` via `npm run build` et échouer si le build échoue.
6. IF une étape du `CI_Pipeline` Frontend échoue, THEN THE `CI_Pipeline` Frontend SHALL marquer le pipeline comme échoué et notifier l'équipe.
7. THE `CI_Pipeline` Frontend SHALL publier le `Coverage_Report` comme artefact accessible pendant au moins 7 jours.

---

### Exigence 3 : Pipeline CD Backend

**User Story :** En tant que DevOps, je veux qu'un pipeline CD déploie automatiquement le backend après le succès du CI, afin de livrer les nouvelles versions sans intervention manuelle.

#### Critères d'acceptation

1. WHEN le `CI_Pipeline` Backend se termine avec succès sur `Branch_Main`, THE `CD_Pipeline` Backend SHALL se déclencher automatiquement.
2. THE `CD_Pipeline` Backend SHALL construire une `Docker_Image` du `Backend` à partir d'un `Dockerfile` dédié.
3. THE `CD_Pipeline` Backend SHALL taguer la `Docker_Image` avec le SHA du commit Git et le tag `latest`.
4. THE `CD_Pipeline` Backend SHALL pousser la `Docker_Image` vers le `Registry` configuré.
5. IF la construction ou le push de la `Docker_Image` échoue, THEN THE `CD_Pipeline` Backend SHALL marquer le pipeline comme échoué sans déployer.
6. THE `CD_Pipeline` Backend SHALL utiliser des secrets d'environnement (variables CI/CD) pour les credentials du `Registry` et ne SHALL jamais exposer ces credentials dans les logs.

---

### Exigence 4 : Pipeline CD Frontend

**User Story :** En tant que DevOps, je veux qu'un pipeline CD déploie automatiquement le frontend après le succès du CI, afin de livrer les nouvelles versions sans intervention manuelle.

#### Critères d'acceptation

1. WHEN le `CI_Pipeline` Frontend se termine avec succès sur `Branch_Main`, THE `CD_Pipeline` Frontend SHALL se déclencher automatiquement.
2. THE `CD_Pipeline` Frontend SHALL construire une `Docker_Image` du `Frontend` à partir d'un `Dockerfile` dédié incluant un serveur Nginx pour servir les fichiers statiques.
3. THE `CD_Pipeline` Frontend SHALL taguer la `Docker_Image` avec le SHA du commit Git et le tag `latest`.
4. THE `CD_Pipeline` Frontend SHALL pousser la `Docker_Image` vers le `Registry` configuré.
5. IF la construction ou le push de la `Docker_Image` échoue, THEN THE `CD_Pipeline` Frontend SHALL marquer le pipeline comme échoué sans déployer.
6. THE `CD_Pipeline` Frontend SHALL utiliser des secrets d'environnement (variables CI/CD) pour les credentials du `Registry` et ne SHALL jamais exposer ces credentials dans les logs.

---

### Exigence 5 : Intégration des tests unitaires dans les pipelines CI

**User Story :** En tant qu'étudiant, je veux que mes tests unitaires soient exécutés automatiquement dans le pipeline CI de mon module, afin que la couverture de mon code soit mesurée et visible.

#### Critères d'acceptation

1. THE `CI_Pipeline` Backend SHALL exécuter tous les fichiers de test correspondant au pattern `**/*.spec.ts` dans le répertoire `src/` du `Backend`.
2. THE `CI_Pipeline` Frontend SHALL exécuter tous les fichiers de test correspondant au pattern `**/*.test.tsx` ou `**/*.spec.tsx` dans le répertoire `src/` du `Frontend`.
3. WHEN un test unitaire échoue, THE `CI_Pipeline` correspondant SHALL échouer immédiatement et afficher le nom du test en erreur dans les logs.
4. THE `CI_Pipeline` Backend SHALL produire un rapport de résultats de tests au format JUnit XML pour permettre l'affichage dans l'interface CI.
5. THE `CI_Pipeline` Frontend SHALL produire un rapport de résultats de tests au format JUnit XML pour permettre l'affichage dans l'interface CI.

---

### Exigence 6 : Analyse de qualité SonarQube

**User Story :** En tant que responsable qualité, je veux que SonarQube analyse le code du Backend et du Frontend, afin de mesurer et suivre la qualité du code et la couverture des tests.

#### Critères d'acceptation

1. THE `CI_Pipeline` Backend SHALL exécuter l'analyse SonarQube après la génération du `Coverage_Report`, en transmettant le rapport LCOV à SonarQube.
2. THE `CI_Pipeline` Frontend SHALL exécuter l'analyse SonarQube après la génération du `Coverage_Report`, en transmettant le rapport LCOV à SonarQube.
3. WHEN l'analyse SonarQube s'exécute, THE `SonarQube` SHALL afficher la couverture de tests en pourcentage sur le tableau de bord du projet.
4. WHEN l'analyse SonarQube s'exécute, THE `SonarQube` SHALL détecter et afficher les bugs, vulnérabilités et code smells identifiés dans le code source.
5. THE `CI_Pipeline` Backend SHALL échouer si le `Quality_Gate` SonarQube n'est pas atteint.
6. THE `CI_Pipeline` Frontend SHALL échouer si le `Quality_Gate` SonarQube n'est pas atteint.
7. WHERE SonarQube est configuré avec un `Quality_Gate` personnalisé, THE `SonarQube` SHALL appliquer un seuil minimum de couverture de tests de 50%.

---

### Exigence 7 : Comparaison avant/après refactoring

**User Story :** En tant qu'étudiant, je veux documenter l'état de la qualité du code avant et après refactoring, afin de démontrer l'amélioration apportée par mon travail.

#### Critères d'acceptation

1. THE `SonarQube` SHALL conserver l'historique des analyses pour permettre la comparaison entre deux états du projet.
2. WHEN une analyse SonarQube est exécutée avant refactoring, THE `SonarQube` SHALL afficher les métriques initiales (nombre de bugs, code smells, couverture, dette technique).
3. WHEN une analyse SonarQube est exécutée après refactoring, THE `SonarQube` SHALL afficher les métriques mises à jour et la différence par rapport à l'analyse précédente.
4. THE `SonarQube` SHALL permettre l'export ou la capture d'écran du tableau de bord pour chaque état (avant/après).

---

### Exigence 8 : Configuration et sécurité des pipelines

**User Story :** En tant que DevOps, je veux que les pipelines soient correctement configurés et sécurisés, afin de protéger les secrets et garantir la reproductibilité des builds.

#### Critères d'acceptation

1. THE `CI_Pipeline` Backend et THE `CI_Pipeline` Frontend SHALL utiliser une image Node.js LTS (version 20 ou supérieure) comme environnement d'exécution.
2. THE `CD_Pipeline` Backend et THE `CD_Pipeline` Frontend SHALL utiliser Docker-in-Docker ou un socket Docker monté pour construire les images.
3. THE `CI_Pipeline` Backend et THE `CI_Pipeline` Frontend SHALL mettre en cache le répertoire `node_modules/` entre les exécutions pour réduire le temps de build.
4. IF les variables d'environnement requises (token SonarQube, credentials Registry) ne sont pas définies, THEN THE `CI_Pipeline` correspondant SHALL échouer avec un message d'erreur explicite.
5. THE `CD_Pipeline` Backend et THE `CD_Pipeline` Frontend SHALL être déclenchés uniquement depuis `Branch_Main` et non depuis d'autres branches.

---

### Exigence 9 : Jenkinsfiles CI/CD pour le Backend et le Frontend (Pipeline as Code)

**User Story :** En tant que DevOps, je veux que les pipelines CI et CD du Backend et du Frontend soient définis sous forme de Jenkinsfiles versionnés dans le dépôt Git, afin de garantir la traçabilité, la reproductibilité et la maintenabilité des pipelines via une approche Pipeline as Code.

#### Critères d'acceptation

1. THE dépôt Git SHALL contenir quatre `Jenkinsfile` distincts à la racine du projet : `Jenkinsfile.ci.backend`, `Jenkinsfile.cd.backend`, `Jenkinsfile.ci.frontend` et `Jenkinsfile.cd.frontend`.
2. THE `Jenkinsfile.ci.backend` SHALL utiliser la syntaxe déclarative Jenkins (`pipeline { ... }`) et un `Jenkins_Agent` Docker basé sur l'image `node:20`.
3. THE `Jenkinsfile.ci.backend` SHALL définir les stages suivants dans l'ordre : `Install`, `Lint`, `Test & Coverage`, `SonarQube Analysis`.
4. WHEN le stage `Test & Coverage` du `Jenkinsfile.ci.backend` s'exécute, THE `CI_Pipeline` Backend SHALL générer le `Coverage_Report` LCOV et le publier comme artefact Jenkins.
5. WHEN le stage `SonarQube Analysis` du `Jenkinsfile.ci.backend` s'exécute, THE `CI_Pipeline` Backend SHALL utiliser le `Jenkins_Credential` identifié `SONAR_TOKEN` pour s'authentifier auprès de SonarQube sans exposer le token dans les logs.
6. THE `Jenkinsfile.ci.frontend` SHALL utiliser la syntaxe déclarative Jenkins et un `Jenkins_Agent` Docker basé sur l'image `node:20`.
7. THE `Jenkinsfile.ci.frontend` SHALL définir les stages suivants dans l'ordre : `Install`, `Test & Coverage`, `Build`, `SonarQube Analysis`.
8. WHEN le stage `Test & Coverage` du `Jenkinsfile.ci.frontend` s'exécute, THE `CI_Pipeline` Frontend SHALL générer le `Coverage_Report` LCOV et le publier comme artefact Jenkins.
9. WHEN le stage `SonarQube Analysis` du `Jenkinsfile.ci.frontend` s'exécute, THE `CI_Pipeline` Frontend SHALL utiliser le `Jenkins_Credential` identifié `SONAR_TOKEN` pour s'authentifier auprès de SonarQube sans exposer le token dans les logs.
10. THE `Jenkinsfile.cd.backend` SHALL utiliser la syntaxe déclarative Jenkins et un `Jenkins_Agent` Docker avec accès au socket Docker (`/var/run/docker.sock`) pour construire les images.
11. THE `Jenkinsfile.cd.backend` SHALL définir les stages suivants dans l'ordre : `Build Docker Image`, `Push to Registry`.
12. WHEN le stage `Push to Registry` du `Jenkinsfile.cd.backend` s'exécute, THE `CD_Pipeline` Backend SHALL utiliser le `Jenkins_Credential` identifié `DOCKER_REGISTRY_CREDENTIALS` pour s'authentifier auprès du `Registry` sans exposer les identifiants dans les logs.
13. THE `Jenkinsfile.cd.frontend` SHALL utiliser la syntaxe déclarative Jenkins et un `Jenkins_Agent` Docker avec accès au socket Docker pour construire les images.
14. THE `Jenkinsfile.cd.frontend` SHALL définir les stages suivants dans l'ordre : `Build Docker Image`, `Push to Registry`.
15. WHEN le stage `Push to Registry` du `Jenkinsfile.cd.frontend` s'exécute, THE `CD_Pipeline` Frontend SHALL utiliser le `Jenkins_Credential` identifié `DOCKER_REGISTRY_CREDENTIALS` pour s'authentifier auprès du `Registry` sans exposer les identifiants dans les logs.
16. WHEN le `CI_Pipeline` Backend se termine avec succès sur `Branch_Main`, THE `Jenkinsfile.ci.backend` SHALL déclencher le `CD_Pipeline` Backend via un `Upstream_Trigger` (`build job: 'cd-backend'`).
17. WHEN le `CI_Pipeline` Frontend se termine avec succès sur `Branch_Main`, THE `Jenkinsfile.ci.frontend` SHALL déclencher le `CD_Pipeline` Frontend via un `Upstream_Trigger` (`build job: 'cd-frontend'`).
18. IF un `Jenkins_Credential` requis (`SONAR_TOKEN` ou `DOCKER_REGISTRY_CREDENTIALS`) est absent de la configuration Jenkins, THEN THE `CI_Pipeline` ou `CD_Pipeline` correspondant SHALL échouer au démarrage avec un message d'erreur explicite identifiant le credential manquant.
19. THE `Jenkinsfile.ci.backend` et THE `Jenkinsfile.ci.frontend` SHALL définir une directive `options { timeout(time: 30, unit: 'MINUTES') }` pour interrompre automatiquement tout pipeline dépassant 30 minutes d'exécution.
20. WHERE Jenkins est configuré avec un agent Docker disponible, THE quatre `Jenkinsfile` SHALL s'exécuter sans nécessiter d'installation manuelle de Node.js ou Docker sur le nœud Jenkins hôte.
