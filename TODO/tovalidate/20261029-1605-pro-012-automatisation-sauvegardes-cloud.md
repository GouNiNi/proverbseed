# [PRO-012] Automatisation des sauvegardes (Google Drive & cloud via Partage Natif)

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Moyenne
- **Statut** : tovalidate

## Contexte & Objectif
Prévenir la perte des données locales utilisateur sans réimplémenter d'authentification Google OAuth lourde, en s'appuyant sur les capacités natives de l'OS (Option A : Web Share API) combinées à un suivi contextuel de sauvegarde (Option C : Rappel contextuel).

## Critères d'Acceptation
- [x] Intégration de la Web Share API (`navigator.share({ files: [backupFile] })`) pour proposer à l'utilisateur de sauvegarder directement vers son Google Drive, iCloud, Dropbox ou gestionnaire de fichiers configuré dans son OS.
- [x] Fallback automatique sur le téléchargement de fichier JSON direct si l'API de partage n'est pas supportée par l'appareil (Desktop).
- [x] Suivi de l'horodatage de la dernière sauvegarde (`lastBackupDate`) avec affichage lisible dans l'écran Réglages (« Aujourd'hui », « Hier », « Il y a X jours », « Jamais »).
- [x] Indicateur/rappel visuel discret (« Sauvegarde recommandée ») si l'utilisateur possède des données et n'a pas sauvegardé depuis plus de 14 jours.
- [x] Couverture complète par des tests unitaires (`tests/utils/backupUtils.test.js`).

## Notes de Réalisation
- Fonctions `isShareSupported`, `exportBackup`, `isBackupRecommended` et `formatLastBackupDate` dans `src/utils/backupUtils.js`.
- Refonte de la section Sauvegarde dans `src/views/SettingsView.jsx` avec affichage de l'état, pastille de recommandation et boutons de partage/téléchargement/import.
- Traductions FR et EN complétées dans `src/i18n/translations.js`.
- 3 nouveaux tests unitaires automatisés validant la logique de recommandation et de formatage.
