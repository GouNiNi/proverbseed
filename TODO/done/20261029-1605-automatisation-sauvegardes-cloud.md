# Automatisation des sauvegardes (Google Drive, Pastille & Notification In-App)

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Moyenne
- **Statut** : done

## Contexte & Objectif
Prévenir la perte des données locales utilisateur sans réimplémenter d'authentification Google OAuth lourde, en s'appuyant sur les capacités natives de l'OS (File System Access API et Web Share API) combinées à un suivi contextuel de sauvegarde, une pastille visuelle sur le menu et une notification in-app au bout de deux fois le délai réglé.

## Critères d'Acceptation
- [x] Intégration de la File System Access API (`window.showSaveFilePicker`) pour permettre à l'utilisateur de choisir l'emplacement de destination exact (Google Drive monté, dossiers locaux, etc.).
- [x] Intégration de la Web Share API (`navigator.share({ files: [backupFile] })`) en relais pour proposer à l'utilisateur de sauvegarder directement vers son Google Drive (« Enregistrer dans Drive »), iCloud, Dropbox ou gestionnaire de fichiers configuré dans son OS.
- [x] Préservation du geste utilisateur (*transient user activation*) par pré-chargement synchrone du payload de sauvegarde en mémoire dans l'écran Réglages, éliminant les expirations de sécurité des navigateurs.
- [x] Suppression des téléchargements silencieux indésirables dans `/Download` lors d'un clic sur « Sauvegarder vers le cloud » (le bouton « Télécharger » dédié restant disponible).
- [x] Choix de la fréquence de rappel dans les Réglages (`backupReminderDays` : 7 jours, 14 jours par défaut, 30 jours, ou désactivé).
- [x] Affichage d'une pastille orange discrète sur le bouton de menu (et sur l'icône des Réglages dans le menu déployé) dès que le délai réglé est dépassé (ou si aucune sauvegarde n'a été effectuée).
- [x] Affichage d'une notification in-app non bloquante au sommet de l'application au bout de **2 fois le délai réglé** (ex: 28 jours pour un réglage de 14 jours), avec bouton direct « Sauvegarder » menant aux Réglages et bouton de fermeture.
- [x] Couverture complète par des tests unitaires (`tests/utils/backupUtils.test.js`).

## Notes de Réalisation
- Fonctions `isSaveFilePickerSupported`, `isShareSupported`, `isCloudOrSystemSaveSupported`, `exportBackup`, `isBackupRecommended`, `isBackupUrgent` et `formatLastBackupDate` dans `src/utils/backupUtils.js`.
- Pastille `.nav-badge-dot` dans `src/components/Navigation.jsx` et `src/index.css`.
- Bannière `.backup-urgent-banner` dans `src/App.jsx` réagissant à l'événement `backupStateChange`.
- Sélecteur de fréquence de rappel dans `src/views/SettingsView.jsx`.
- 9 tests unitaires automatisés validant la logique de sauvegarde, d'urgence et de formatage.
