# ProverbSeed — Agent Context

## Projet
PWA de méditation biblique (Proverbes de Salomon). Vite + React, déployée sur https://proverbseed.geekarea.fr/.
Version courante : voir `.version` (Source Unique de Vérité).

### 🔢 Système de Versioning & Règles d'Incrémentation

Le projet suit un versioning sémantique strict au format `majeur.mineur.micro` (ex: `1.7.0`).

- **Source Unique de Vérité (SSOT)** : Fichier `.version` à la racine.
- **Règle Docker & Cache** : Ne **JAMAIS** modifier manuellement `package.json` pour la version. Cela garantit que la couche Docker `npm ci` reste en cache.
- **Règles d'incrémentation** :
  - **`micro` (ou `patch`)** : correctifs de bugs, patchs, retouches mineures. Incrément **automatique à l'initiative de l'agent IA**.
  - **`mineur` (ou `minor`)** : ajouts de fonctionnalités, évolutions fonctionnelles rétrocompatibles. Incrément **automatique à l'initiative de l'agent IA**.
  - **`majeur` (ou `major`)** : changements d'architecture, refontes ou ruptures importantes. **Consigne ou accord explicite de l'utilisateur (JD) obligatoire**.
- **Commande de mise à jour** :
  ```bash
  npm run bump-version <micro|mineur|majeur|patch|minor|major>
  ```
- **Génération automatique** : Vite génère automatiquement `dist/version.json` et injecte `__APP_VERSION__` lors du build.

---

## 🧪 Tests Unitaires

Le projet utilise le runner natif Node.js (`node:test`) pour tester les fonctions utilitaires et la synchronisation i18n :
- **Lancer les tests** :
  ```bash
  npm test
  ```
- **Périmètre** : Normalisation de texte, filtre et tri préfixé des étiquettes (`textUtils.js`), synchronisation stricte des clés de traduction (`translations.js`) et intégrité de `.version`.

---

## 🔄 Workflow Multi-Agent & Release

1. **Worktree & Branche :**
   ```bash
   git worktree add .worktrees/<ticket> -b feature/<ticket>
   ln -s ../../node_modules .worktrees/<ticket>/node_modules
   ```
   Ne **JAMAIS** modifier `.version` sur la branche ou dans le worktree.
2. **Dev & Tests dans le worktree :** `npm test` (100% vert).
3. **Pipeline de Release sur `main` dans le dépôt principal :**
   ```bash
   cd /Users/gounini/Documents/ia-workspace/proverbseed
   git checkout main && git fetch origin && git rebase origin/main && git merge feature/<ticket>
   npm run bump-version <micro|mineur|majeur>
   npm run build
   git commit -am "chore: release vX.Y.Z"
   npm test
   git push origin main
   git worktree remove .worktrees/<ticket>
   git branch -d feature/<ticket>
   ```

---

## Architecture

```
proverbseed/
├── .version            # Source unique de vérité pour la version
├── src/
│   ├── views/          # HomeView, LibraryView, SettingsView
│   ├── components/     # Navigation, TutorialOverlay
│   ├── data/           # db.js (localForage), proverbs_fr.js, proverbs_en.js
│   ├── i18n/           # LanguageContext.jsx, translations.js
│   ├── App.jsx
│   └── sw.js           # Service Worker custom (workbox injectManifest)
├── push-worker/        # Cloudflare Worker — notifications push
│   ├── src/worker.js
│   └── wrangler.toml
├── package.json        # Dépendances et scripts de build
├── vite.config.js      # Lit .version → injecte __APP_VERSION__ et émet dist/version.json
└── scripts/
    └── bump-version.js # Script de bump (met à jour .version)
```

---

## Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | Vite + React 19 |
| PWA | vite-plugin-pwa (stratégie `injectManifest`) |
| Stockage local | localForage (IndexedDB) — base `ProverbSeed`, store `keyvaluepairs` |
| Notifications push | Cloudflare Workers + KV + Web Push (VAPID) |
| i18n | Context React, `translations.js` (fr/en) |

---

## Clés localForage (`dbOptions`)

```js
SETTINGS            // paramètres utilisateur
USER_THEMES         // thèmes personnalisés
CATEGORIZED_PROVERBS // mapping ID proverbe → thèmes
FAVORITES           // IDs favoris
MEDITATION_NOTES    // notes de méditation
USER_STATS          // stats pour le jardin
```

---

## Système de notifications push

**Worker Cloudflare** déployé sur `https://proverbseed-push.jean-daniel-b33.workers.dev`

- Cron : `*/5 * * * *` (toutes les 5 min, granularité suffisante)
- KV namespace `SUBSCRIPTIONS` (id: `a148f26e416343d98cfc33a7965f4b23`)
- Routes : `POST /subscribe`, `POST /unsubscribe`, `POST /update-subscription`
- VAPID public key : `BHivnUd7F8CRAIPzkfUxtWeAjqiaj12YsuPb-DoSf2UYimFAbJaM0QpyIJ_Awnec2nq-ndRhdM_AWuCeQu-GRJE`
- **Important** : l'heure stockée dans le KV est en **UTC**. La conversion local→UTC se fait dans `SettingsView.jsx` (`localTimeToUTC()`) avant envoi au Worker.
- Le sélecteur d'heure a `step={300}` (pas de 5 min, cohérent avec le cron).
- Quota free tier : ~340 utilisateurs (100k KV reads/jour ÷ 288 crons/jour).

---

## Workflow de développement

### Bumper la version
```sh
npm version patch   # 1.3.0 → 1.3.1
npm version minor   # 1.3.0 → 1.4.0
npm version major   # 1.3.0 → 2.0.0
```
Crée automatiquement un commit + tag git.

### Déployer
```sh
npm run deploy
# = git push origin HEAD:main && sync repo principal local
```

### Déployer le Worker Cloudflare
```sh
cd push-worker && npx wrangler deploy
```

---

## Git — worktree

Le développement se fait dans le worktree `.claude/worktrees/stupefied-jang` (branche `claude/stupefied-jang`).
On pousse vers `main` via : `git push origin claude/stupefied-jang:main`
`npm run deploy` fait ça + sync le repo principal local automatiquement.

Le déploiement du site se fait via **webhook GitHub → serveur** à chaque push sur `main`.

---

## i18n

`src/i18n/translations.js` — deux langues : `fr` (défaut) et `en`.
Usage : `const t = useT(); t('section', 'clé')`

---

## Conventions

- Pas de TypeScript — JavaScript pur
- Styles inline (pas de CSS-in-JS externe)
- Variables CSS : `--color-primary`, `--color-supporting`, `--color-background`, etc.
- Dark mode via `data-theme="dark"` sur `<html>`
- Taille de police des versets : `getProverbFontSize(longueur)` dans `HomeView.jsx`

---

## 📋 Gestion des Tâches (`TODO/`)

Le suivi des tâches est géré sous forme de fichiers unitaires dans [`TODO/`](./TODO/README.md) :
- **`TODO/todo/`** : tâches prêtes à être prises en charge (point d'entrée).
- **`TODO/doing/`** : tâche en cours de traitement par un agent (verrou anti-doublon).
- **`TODO/tovalidate/`** : tâche terminée par l'agent, en attente de validation par l'utilisateur (JD).
- **`TODO/done/`** : validé par l'utilisateur (toutes les tâches terminées y sont archivées unitairement).
- **`TODO/wontfix/`** : abandonné.
- **`TODO/archive/`** : archives historiques (`TODO-legacy.md`).

### Workflow pour les Agents IA :
1. **Prendre un ticket** : `ls TODO/todo/`, lire uniquement le ticket choisi, le déplacer immédiatement : `git mv TODO/todo/<ticket>.md TODO/doing/`.
2. **Fin de tâche** : compléter les *Notes de réalisation* dans le ticket, puis le déplacer : `git mv TODO/doing/<ticket>.md TODO/tovalidate/`. Seul l'utilisateur déplace un ticket vers `done/` ou `wontfix/`. Une tâche réalisée ne doit **JAMAIS** être directement marquée comme terminée (`done/`) sans l'accord/validation explicite de l'utilisateur.
3. **Création d'un ticket** : créer directement dans `TODO/todo/` au format `YYYYMMDD-HHMM-[slug-court].md`.
4. **Économie de tokens** : ne consulter `done/`, `wontfix/` ou `archive/` qu'en cas de besoin avéré.

---

## ⚠️ Règles de développement strictes

1. **Validation des tâches** : Respecter impérativement le workflow Kanban ci-dessus (déplacement dans `tovalidate/` en fin de dev).
2. **Bump de version avant chaque push de code** : Toute modification de code applicatif destinée à être pushée sur le dépôt nécessite impérativement un bump de version (`npm version patch`, `minor` ou `major`). (Rappel : les commits de pure documentation ou TODO sont exemptés de rebuild par le webhook).
