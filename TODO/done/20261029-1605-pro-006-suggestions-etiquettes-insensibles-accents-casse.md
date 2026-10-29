# [PRO-006] Suggestions d'étiquettes insensibles aux accents et à la casse

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Moyenne
- **Statut** : done
- **Code Legacy** : PRO-006

## Contexte & Réalisation
Suggestions dynamiques avec matching NFD (insensible aux accents et majuscules).

## Détails techniques
- **Objectif** : Améliorer la saisie d'étiquettes en proposant des suggestions dynamiques issues de la bibliothèque qui matchent indépendamment des accents et des majuscules (ex: taper "ecole" ou "Ecole" doit suggérer "École").
- **Détails** : Normaliser la chaîne saisie et les catégories de l'utilisateur (via `normalizeText` NFD) avec tri prioritaire par début de mot (`startsWith`) et résolution de fusion exacte par nom d'étiquette existant.

## Notes de Migration
Validé et archivé depuis l'ancien TODO.md de ProverbSeed (archivé dans `TODO/archive/TODO-legacy.md`).
