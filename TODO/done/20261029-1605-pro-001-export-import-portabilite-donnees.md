# [PRO-001] Export / Import (Portabilité des données)

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Haute
- **Statut** : done
- **Code Legacy** : PRO-001

## Contexte & Objectif
Permettre à l'utilisateur de sauvegarder et restaurer ses données locales sans dépendre d'un serveur au format JSON avec validation de schéma stricte.

## Critères d'Acceptation
- [x] Exportation complète des métadonnées (thèmes, catégorisations, favoris, notes de méditation, stats, réglages) au format JSON.
- [x] Téléchargement automatisé du fichier nommé `proverbseed_backup_YYYY-MM-DD.json`.
- [x] Importation avec validation de schéma robuste (`backupUtils.js`) protégeant contre les corruptions de données.
- [x] Demande de confirmation préalable avant restauration et écrasement des données locales.
- [x] Suite de tests unitaires couvrant la validation et l'assainissement (`tests/utils/backupUtils.test.js`).

## Notes de Réalisation
- Extraction et isolation de la logique dans `src/utils/backupUtils.js` (`createBackupPayload`, `validateBackup`).
- Branchement propre dans `src/views/SettingsView.jsx`.
- 4 nouveaux tests unitaires automatisés validant la conformité et les cas limites de schéma.
