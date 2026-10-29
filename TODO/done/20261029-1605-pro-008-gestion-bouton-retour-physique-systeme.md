# [PRO-008] Gestion du bouton Retour physique / système

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Moyenne
- **Statut** : done
- **Code Legacy** : PRO-008

## Contexte & Réalisation
Interception de l'événement `popstate` et synchroniser des fragments d'URL (`#home`, `#library`, `#library/<theme>`, `#settings`) pour la navigation physique/système Android & PWA.

## Détails techniques
- **Objectif** : Offrir une navigation naturelle sur smartphone en faisant remonter l'application d'un cran dans ses vues lors de l'appui sur le bouton "Retour" physique/système.
- **Détails** : Synchroniser l'état des écrans/vues (Bibliothèque, Favoris, Jardin, etc.) avec l'historique du navigateur (`window.history.pushState` et événement `popstate`) afin que le bouton "Retour" ramène à l'écran précédent au lieu de minimiser/iconifier l'application PWA.

## Notes de Migration
Validé et archivé depuis l'ancien TODO.md de ProverbSeed (archivé dans `TODO/archive/TODO-legacy.md`).
