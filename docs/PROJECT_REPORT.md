# MedAppointment Frontend – Rapport Technique

## 1. Vue d'ensemble
MedAppointment Frontend est une application Angular 18 conçue pour gérer les rendez-vous médicaux pour plusieurs profils (administrateur, médecin, patient, infirmier). L'application s'appuie sur Angular Material pour l'expérience de bureau et sur certains composants Ionic pour l'expérience mobile. L'ensemble du front est construit avec des composants standalone et communique avec l'API REST MedAppointment exposée sous `http://localhost:4000/api`.

## 2. Pile technologique
- **Framework** : Angular 18 avec rendu côté client et Router standalone.
- **UI** : Angular Material (bureau) et Ionic (mobile) complétés par SCSS.
- **Langage** : TypeScript strict avec Zone.js et RxJS pour la programmation réactive.
- **Construction** : Angular CLI (`ng build`, `ng serve`).
- **Gestion d'état** : Services injectables avec `BehaviorSubject` (ex. notifications, utilisateur courant).
- **Tests** : Karma + Jasmine (commandes `ng test`).
- **Interfaçage API** : `HttpClient` avec intercepteur JWT (`Authorization: Bearer ...`).

## 3. Architecture applicative
### 3.1 Routage et navigation
Le fichier [`src/app/app.routes.ts`](../src/app/app.routes.ts) centralise l'ensemble des routes et charge dynamiquement les composants standalone. Le `AuthGuard` impose l'authentification et contrôle les rôles via les métadonnées `data.roles`. Les sections principales couvrent l'authentification, le tableau de bord, la gestion des rendez-vous, les profils, les hôpitaux, les consultations et les versions mobiles dédiées aux rôles patient et médecin.【F:src/app/app.routes.ts†L1-L115】

### 3.2 Structure des dossiers
- `core/` : services partagés (`auth`, `appointment`, `notification`, `doctor`, `logger`), modèles TypeScript (`User`, `Appointment`, etc.), guards et interceptors.【F:src/app/core/models/index.ts†L1-L120】【F:src/app/core/services/appointment.service.ts†L1-L84】
- `features/` : composants fonctionnels organisés par domaine (authentification, rendez-vous, hôpitaux, tableau de bord, vue mobile). Chaque composant est standalone et importe explicitement ses dépendances Angular Material/Ionic.【F:src/app/features/appointments/appointments.component.ts†L1-L80】
- `modules/` : fonctionnalités avancées regroupées (ex. dossier médical) embarquant plusieurs composants spécialisés et un service dédié.【F:src/app/modules/medical-record/medical-record.service.ts†L1-L60】
- `shared/` : composants transverses (confirm dialog, layouts) et constantes réutilisables.

### 3.3 Gestion de l'authentification et des rôles
`AuthService` gère le cycle de vie des tokens JWT, persiste l'utilisateur courant dans le `localStorage` et expose un flux `currentUser$`. Le guard [`AuthGuard`](../src/app/core/guards/auth.guard.ts) réutilise ces informations pour bloquer les routes non autorisées et collecter récursivement les rôles attendus sur la hiérarchie de routes.【F:src/app/core/services/auth.service.ts†L1-L82】【F:src/app/core/guards/auth.guard.ts†L1-L56】

### 3.4 Notifications et synchronisation
`NotificationService` assure la synchronisation périodique via polling (`timer`) conditionnée par la présence d'un jeton. Les notifications sont normalisées, stockées en local et accompagnées d'un compteur de non lus. Le service expose des méthodes utilitaires pour ajouter des notifications côté client (succès, erreur, etc.).【F:src/app/core/services/notification.service.ts†L1-L154】【F:src/app/core/services/notification.service.ts†L154-L236】

### 3.5 Services métiers clés
- **Appointments** : `AppointmentService` couvre la création, la consultation, la mise à jour, l'annulation et la suppression de rendez-vous ainsi que la gestion des prescriptions et des constantes vitales.【F:src/app/core/services/appointment.service.ts†L1-L116】
- **Dossier médical** : `MedicalRecordService` encapsule les opérations CRUD sur les dossiers et documents médicaux, en utilisant `FormData` pour l'upload de fichiers.【F:src/app/modules/medical-record/medical-record.service.ts†L1-L60】
- **Médecins** : `DoctorService` propose des appels résilients avec fallback d'endpoint et journalisation centralisée (`LoggerService`).【F:src/app/core/services/doctor.service.ts†L1-L86】

## 4. Flux fonctionnels majeurs
### 4.1 Parcours d'authentification
1. **Inscription / connexion** via `AuthService` (`/auth/register` ou `/auth/login`).
2. Le jeton reçu est stocké (`localStorage`) et l'utilisateur courant est diffusé via `BehaviorSubject`.
3. L'intercepteur HTTP ajoute le header `Authorization` sur toutes les requêtes sortantes tant que le token est présent.【F:src/app/core/services/auth.service.ts†L25-L76】【F:src/app/core/interceptors/auth.interceptor.ts†L1-L16】
4. Les routes protégées redirigent vers `/auth/login` en cas d'absence de session valide.【F:src/app/core/guards/auth.guard.ts†L17-L45】

### 4.2 Gestion des rendez-vous
Les composants de la fonctionnalité rendez-vous s'appuient sur `MatTableDataSource` pour afficher la liste, `ReactiveFormsModule` pour les filtres, et déclenchent les opérations CRUD via `AppointmentService`. Les vues sont adaptées selon le rôle (médecin, patient).【F:src/app/features/appointments/appointments.component.ts†L1-L135】

### 4.3 Notifications utilisateur
Au démarrage, `NotificationService` recharge les notifications persistées et démarre la synchronisation si un token est présent. Les erreurs 401 arrêtent le polling pour éviter les boucles réseau. Les actions (marquer comme lu, suppression, vidage) mettent à jour le stockage local et appellent l'API correspondante.【F:src/app/core/services/notification.service.ts†L31-L132】【F:src/app/core/services/notification.service.ts†L180-L236】

### 4.4 Dossier médical et documents
Le module `medical-record` offre :
- Consultation et création du dossier patient.
- Ajout de documents (PDF, images) via upload `FormData`.
- Suppression et visualisation de documents médicaux.
Ces opérations transitent par le service `MedicalRecordService` qui communique avec l'API `/medical-records` en REST.【F:src/app/modules/medical-record/medical-record.service.ts†L1-L60】

## 5. Configuration et environnements
- Les endpoints API sont centralisés dans `src/environments/environment*.ts` avec `apiBaseUrl` configuré sur `http://localhost:4000/api` pour le développement.【F:src/environments/environment.ts†L1-L4】
- Aucun fichier `.env` n'est utilisé côté frontend.
- Les paramètres spécifiques aux rôles sont gérés via les `data` des routes.

## 6. Qualité, tests et intégration
- **Linting** : pas de script dédié dans `package.json` (à ajouter selon les besoins).【F:package.json†L1-L32】
- **Tests unitaires** : `npm test` (mode watch) ou `npm run test -- --watch=false --browsers=ChromeHeadless` pour CI.
- **Build** : `npm run build` génère l'artefact de production dans `dist/`.
- **Suivi manuel** : documentez les tests manuels (authentification, rôles, notifications, parcours patient/médecin) avant chaque release.

## 7. Limitations connues
- Les composants mobiles utilisent des imports Ionic standalone (`@ionic/angular/standalone`). Assurez-vous d'installer les dépendances Ionic et feuilles de styles requises dans le workspace avant d'exécuter `ng serve` en environnement de production.【F:package.json†L12-L27】
- Les notifications reposent sur du polling HTTP (pas de SSE/WebSocket). Une optimisation future pourrait introduire un canal temps réel sécurisé.

## 8. Documentation complémentaire
- **Guide de démarrage** : voir `README.md` à la racine.
- **Processus d'authentification** : section 4.1.
- **Fonctionnalités principales** : sections 4.2 à 4.4.
- **Rôles et modèles** : `src/app/core/models/index.ts`.

Ce rapport sert de référence pour les nouveaux contributeurs comme pour l'équipe produit. Mettez-le à jour lors de l'ajout de nouvelles fonctionnalités majeures ou de modifications d'architecture.
