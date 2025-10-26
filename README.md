# 🏥 MedAppointment Frontend

Frontend Angular pour l'application de gestion de rendez-vous médicaux.

## 🚀 Démarrage rapide

### Prérequis
- Node.js v18 ou supérieur
- npm ou yarn
- Backend MedAppointment lancé sur http://localhost:4000

### Installation

```bash
# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm start
```

L'application sera disponible sur `http://localhost:4200`

## 📦 Fonctionnalités

- ✅ Authentification (Login / Register)
- ✅ Dashboard selon les rôles (Admin, Doctor, Patient)
- ✅ Gestion des rendez-vous
- ✅ Interface moderne avec Angular Material
- ✅ Guards pour sécuriser les routes
- ✅ Intercepteurs HTTP automatiques

## 🏗️ Structure du projet

```
src/
├── app/
│   ├── core/                 # Services, guards, interceptors, models
│   │   ├── guards/          # AuthGuard
│   │   ├── interceptors/    # HTTP Interceptor (auto-ajout token)
│   │   ├── services/        # Services API
│   │   └── models/          # Interfaces TypeScript
│   ├── features/            # Modules fonctionnels
│   │   ├── auth/           # Login, Register
│   │   ├── dashboard/      # Tableau de bord
│   │   └── appointments/   # Gestion rendez-vous
│   ├── app.component.ts
│   ├── app.routes.ts       # Configuration des routes
│   └── app.config.ts       # Configuration de l'app
└── assets/                  # Images, fonts...
```

## 🔐 Comptes de test

### Admin
- Email: `admin@medappointment.com`
- Password: `Admin123!`

### Médecin
- Email: `dr.dupont@hospital.com`
- Password: `doctor123`

### Patient
- Email: `marie.martin@email.com`
- Password: `patient123`

## 🎨 Technologies utilisées

- **Angular 18** - Framework
- **Angular Material** - UI Components
- **RxJS** - Reactive programming
- **TypeScript** - Langage
- **SCSS** - Styles

## 📝 Scripts disponibles

```bash
npm start          # Lancer en mode développement
npm run build      # Compiler pour production
npm run watch      # Mode watch
npm test           # Lancer les tests
```

## 🧪 Tests en local

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **(Optionnel) Vérifier que le backend est lancé** pour les scénarios end-to-end manuels : `npm start` dans le backend.

3. **Lancer la suite de tests unitaires** en mode headless pour éviter l'ouverture du navigateur :
   ```bash
   npm run test -- --watch=false --browsers=ChromeHeadless
   ```
   > Assurez-vous d'avoir Google Chrome ou Chromium installé localement. Sur Linux, vous pouvez exporter la variable `CHROME_BIN` vers le binaire de Chrome/Chromium si nécessaire.

4. **Valider le build de production** avant un commit important :
   ```bash
   npm run build
   ```

5. **Analyser les résultats**
   - Les rapports Karma s'affichent dans le terminal.
   - Pour réexécuter automatiquement les tests pendant le développement, utilisez `npm test` (mode watch par défaut).

## 🌐 Configuration de l'API

L'URL de l'API backend est configurée dans les services :
- `src/app/core/services/auth.service.ts`
- `src/app/core/services/appointment.service.ts`
- `src/app/core/services/doctor.service.ts`

Par défaut: `http://localhost:4000/api`

## 🚧 Développement

Pour ajouter de nouvelles fonctionnalités :

1. Créer un nouveau composant dans `features/`
2. Ajouter la route dans `app.routes.ts`
3. Ajouter le guard si nécessaire
4. Créer le service correspondant si besoin

## 📄 Licence

MIT
