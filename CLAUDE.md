# ProverbSeed — Agent Context

## Projet
PWA de méditation biblique (Proverbes de Salomon). Vite + React, déployée sur https://proverbseed.geekarea.fr/.
Version courante : voir `package.json` → champ `version`.

---

## Architecture

```
proverbseed/
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
├── package.json        # Source de vérité pour la version
└── vite.config.js      # Lit package.json → injecte __APP_VERSION__
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
