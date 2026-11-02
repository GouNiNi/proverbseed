# [PRO-012] Automatisation des sauvegardes (Google Drive & cloud via Partage Natif / File System API)

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Moyenne
- **Statut** : tovalidate

## Contexte & Objectif
Prévenir la perte des données locales utilisateur sans réimplémenter d'authentification Google OAuth lourde, en s'appuyant sur les capacités natives de l'OS (File System Access API et Web Share API) combinées à un suivi contextuel de sauvegarde (Rappel contextuel).

## Critères d'Acceptation
- [x] Intégration de la File System Access API (`window.showSaveFilePicker`) pour permettre à l'utilisateur de choisir l'emplacement de destination exact (Google Drive monté, dossiers locaux, etc.).
- [x] Intégration de la Web Share API (`navigator.share({ files: [backupFile] })`) en relais pour proposer à l'utilisateur de sauvegarder directement vers son Google Drive (« Enregistrer dans Drive »), iCloud, Dropbox ou gestionnaire de fichiers configuré dans son OS.
- [x] Préservation du geste utilisateur (*transient user activation*) par pré-chargement synchrone du payload de sauvegarde en mémoire dans l'écran Réglages, éliminant les expirations de sécurité des navigateurs.
- [x] Suppression des téléchargements silencieux indésirables dans `/Download` lors d'un clic sur « Sauvegarder vers le cloud » (le bouton « Télécharger » dédié restant disponible).
- [x] Suivi de l'horodatage de la dernière sauvegarde (`lastBackupDate`) avec affichage lisible dans l'écran Réglages (« Aujourd'hui », « Hier », « Il y a X jours », « Jamais »).
- [x] Indicateur/rappel visuel discret (« Sauvegarde recommandée ») si l'utilisateur possède des données et n'a pas sauvegardé depuis plus de 14 jours.
- [x] Couverture complète par des tests unitaires (`tests/utils/backupUtils.test.js`).

## Notes de Réalisation
- Fonctions `isSaveFilePickerSupported`, `isShareSupported`, `isCloudOrSystemSaveSupported`, `exportBackup`, `isBackupRecommended` et `formatLastBackupDate` dans `src/utils/backupUtils.js`.
- Pré-chargement des métadonnées de sauvegarde (`backupPayloadRef`) et gestion synchrone du clic dans `src/views/SettingsView.jsx`.
- 8 tests unitaires automatisés validant la logique de recommandation, le formatage, le picker, le partage et la gestion d'annulation.
