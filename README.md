# 🏥 MedAppointment Frontend

Application Angular 18 pour la gestion des rendez-vous médicaux et du suivi patient multi-rôles (administrateur, médecin, patient, infirmier). L'interface combine Angular Material pour la version bureau et des composants Ionic pour l'expérience mobile.

## 📚 Table des matières
- [Aperçu](#-aperçu)
- [Architecture en bref](#-architecture-en-bref)
- [Démarrage rapide](#-démarrage-rapide)
- [Configuration de l'environnement](#-configuration-de-lenvironnement)
- [Scripts npm](#-scripts-npm)
- [Tests et qualité](#-tests-et-qualité)
- [Structure du projet](#-structure-du-projet)
- [Documentation](#-documentation)
- [Problèmes connus](#-problèmes-connus)
- [Licence](#-licence)

## ✨ Aperçu
- Authentification complète (inscription, connexion, réinitialisation du mot de passe) avec contrôle des rôles.
- Tableaux de bord dédiés par profil utilisateur et parcours mobile optimisé.
- Gestion avancée des rendez-vous : filtres, annulation, consultation, prescriptions, constantes vitales.
- Module de dossier médical pour stocker et consulter les documents patients.
- Notifications synchronisées via polling sécurisé et persistance locale.

## 🏗️ Architecture en bref
- Composants **standalone** chargés à la demande par `app.routes.ts`.
- Services partagés (`AuthService`, `NotificationService`, `AppointmentService`, etc.) injectables en `providedIn: 'root'`.
- Flux réactifs via `BehaviorSubject` pour l'utilisateur courant et les notifications.
- Modules fonctionnels regroupés par domaine (`features/`, `modules/`, `shared/`). Un rapport technique détaillé est disponible dans la section [Documentation](#-documentation).

## 🚀 Démarrage rapide
### Prérequis
- Node.js **18+**
- npm (ou yarn)
- Backend MedAppointment disponible sur `http://localhost:4000`

### Installation & lancement
```bash
npm install
npm start
```
L'application est accessible sur [http://localhost:4200](http://localhost:4200).

## 🌐 Configuration de l'environnement
Les URL de l'API sont définies dans `src/environments/environment*.ts`. Par défaut :
```ts
apiBaseUrl: 'http://localhost:4000/api'
```
Ajustez ce paramètre selon votre environnement (staging, production, etc.).

## 🛠️ Scripts npm
```bash
npm start          # Lancer l'application en développement
npm run build      # Compiler pour la production
npm run watch      # Build continu en mode développement
npm test           # Lancer la suite de tests unitaires (Karma/Jasmine)
```

## ✅ Tests et qualité
1. Installer les dépendances (`npm install`).
2. Lancer les tests unitaires en mode headless :
   ```bash
   npm run test -- --watch=false --browsers=ChromeHeadless
   ```
3. Vérifier le build de production avant publication :
   ```bash
   npm run build
   ```
4. Compléter par des tests manuels : authentification, gestion des rendez-vous, notifications, dossier médical et parcours mobile.

## 📦 Structure du projet
```
src/
├── app/
│   ├── app.routes.ts         # Définition du routage principal
│   ├── core/                 # Services, guards, intercepteurs, modèles partagés
│   ├── features/             # Composants standalone par domaine métier
│   ├── modules/              # Modules riches (ex. dossier médical)
│   └── shared/               # Composants et constantes réutilisables
└── environments/             # Configuration API par environnement
```

## 📖 Documentation
- [Rapport technique complet](docs/PROJECT_REPORT.md)
- Modèles et énumérations : `src/app/core/models/index.ts`
- Routage principal : `src/app/app.routes.ts`

## ⚠️ Problèmes connus
- Les vues mobiles utilisent les composants Ionic standalone. Veillez à installer et configurer les packages Ionic requis (styles inclus) avant d'exécuter `ng serve` en production.
- Le canal de notifications fonctionne par polling HTTP. Prévoir une évolution vers SSE ou WebSocket pour du temps réel complet.

## 📄 Licence
MIT
