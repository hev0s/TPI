# DuckyVolt 🦆⚡

DuckyVolt est une application web de simulation de la consommation d'énergie pour les véhicules électriques. Elle permet de planifier des trajets sur une carte interactive en estimant de manière très précise le besoin en recharge, tout en tenant compte de la physique du véhicule et de l'environnement.

🔗 **Lien vers l'application :** [https://tpi26nde.mycpnv.ch/](https://tpi26nde.mycpnv.ch/)

Ce projet a été réalisé dans le cadre du Travail Pratique Individuel (TPI) de la formation d'Informaticien CFC (Développement d'applications) au CPNV de Sainte-Croix.

## 🌟 Fonctionnalités

* **Cartographie et Routage** : Interface interactive basée sur Leaflet et OpenStreetMap permettant la sélection intuitive de points de départ, d'arrivée et d'étapes.
* **Simulateur Physique Itératif** : Le moteur de calcul estime la consommation énergétique en prenant en compte :
  * La distance et la consommation moyenne du véhicule.
  * Les limitations de vitesse réelles (via Overpass API).
  * Les dénivelés topographiques (via OpenRouteService) avec lissage des anomalies.
  * Les infrastructures spécifiques comme les tunnels et les ponts (annulation locale de la résistance de l'air et de la pente).
  * La force centrifuge dans les virages et le mode de conduite de l'utilisateur (Éco, Normal, Sport).

* **Gestion des Utilisateurs** : Authentification sécurisée, gestion des profils, sauvegarde d'adresses favorites et configuration d'un "garage" de véhicules personnels (incluant l'usure de la batterie et le type de pneus).
* **Back-office Administrateur** : Interface sécurisée (CRUD) permettant aux administrateurs de gérer le catalogue global des véhicules électriques.
* **Design "Mobile-First"** : Interface responsive adaptée aux ordinateurs, tablettes et smartphones, utilisant le style Glassmorphism.

## 🛠️ Technologies Utilisées

### Frontend
* **Langages** : HTML5, CSS3, JavaScript (Vanilla ES6+).
* **Cartographie** : Leaflet.js (v1.9.4), Leaflet Routing Machine, Tuiles OpenStreetMap.

### Backend & API
* **Serveur** : Node.js (v20+) avec Express.js.
* **Sécurité** : JSON Web Tokens (JWT) pour des sessions stateless, Bcrypt pour le hachage des mots de passe, et express-rate-limit pour la protection anti-bruteforce.
* **APIs Tierces** : OpenRouteService (ORS) pour l'élévation, Overpass API pour les données OSM, Nominatim et Photon pour le géocodage et l'autocomplétion.

### Base de données
* **SGBD** : MySQL exploité via le paquet `mysql2`.

### Tests
* **Tests Unitaires & Intégration (Backend)** : Jest et Supertest.
* **Tests End-to-End (Frontend)** : Cypress.

## ⚙️ Prérequis et Installation
Pour déployer l'application localement, vous aurez besoin de Node.js, d'un serveur MySQL et d'une clé API OpenRouteService.

### 1. Base de données
1. Créez une base de données MySQL vide.
2. Exécutez le script `Creation_BD_TPI.sql` (non inclus dans ces extraits, à fournir) pour générer les tables (`user`, `vehicule`, `user_has_vehicule`, `saved_locations`).
3. Exécutez le script `Insertion_Vehicules_TPI.sql` pour populer le catalogue de véhicules.

### 2. Configuration de l'environnement
Copiez le fichier d'exemple pour créer votre fichier d'environnement `.env` à la racine du projet :

```env
DB_HOST=site_de_la_db
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=nom_de_la_base
DB_PORT=3306
ORS_API_KEY=votre_clé_api_openrouteservice
JWT_SECRET=votre_cle_secrete_jwt_super_longue
```

### 3. Installation et Lancement
Installez les dépendances via NPM :

```bash
npm install
```

Pour lancer le serveur de développement (avec rechargement automatique via Nodemon) :

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000.

## 🧪 Tests
Le projet dispose d'une forte couverture de tests visant à s'assurer de l'intégrité de la logique métier, de la base de données et de l'interface.

### Tests Backend (Jest)
Valide la sécurité (droits d'accès), le rejet de valeurs aberrantes, le Rate-Limiting, ainsi que l'algorithme physique du moteur de consommation (modes de conduites, tunnels, dénivelés).

```bash
npm run test
```

### Tests Frontend (Cypress)
Simule les interactions utilisateur réelles de bout en bout (connexion, routage, paramétrage, accès sécurisés administrateur).

```bash
# Lancer les tests sans interface graphique
npx cypress run

# Ouvrir l'interface graphique de Cypress
npx cypress open
```

## 📂 Architecture du Projet

* `app.js` : Point d'entrée du serveur et configuration globale.
* `routes/` : Contrôleurs de l'API REST (`auth.js`, `navigation.js`, `calculs.js`, `admin.js`).
* `Database/` : Connexion (`ConnectToDatabase.js`) et requêtes SQL préparées (`LinkWithDatabase.js`).
* `views/` : Fichiers HTML du Frontend (`index.html`, `home.html`, `settings.html`, `admin.html`).
* `public/` : Ressources statiques, fichiers CSS (`main.css`), et logique métier côté client (`auth.js`, `translation.js`).
* `__tests__/` : Suites de tests unitaires et d'intégration Jest.
* `cypress/e2e/` : Scénarios de tests E2E.

## 👨‍💻 Auteur et Contexte

**Niels Delafontaine** - Développement et réalisation

Ce projet a été réalisé dans le cadre du Travail Pratique Individuel (TPI) 2026 pour l'obtention du CFC d'Informaticien (Développement d'applications) au CPNV de Sainte-Croix.

**Supervision et Évaluation :**

* **Chef de projet :** Yann Saison
* **Experts :** Roger Malherbe & Gaël Sonney 
