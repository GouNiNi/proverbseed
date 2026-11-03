# Affichage compact des thèmes dans la Bibliothèque

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Basse
- **Statut** : done

## Contexte & Objectif
Offrir une vue d'ensemble plus dense et agréable des étiquettes/thèmes dans la Bibliothèque pour limiter les besoins de défilement, tout en facilitant le repérage alphabétique.

## Critères d'Acceptation
- [x] Remplacement des grosses cartes individuelles par une liste verticale dense (lignes fines regroupées avec padding optimisé).
- [x] Ajout de séparateurs alphabétiques (A, B, C...) regroupant naturellement les étiquettes sous leur lettre de base (insensible aux accents).
- [x] Carte des Favoris conservée au sommet avec présentation compacte et badge de compteur.
- [x] Déplacement de l'action de suppression (corbeille) dans l'en-tête de la vue détaillée du thème pour épurer la liste principale.
- [x] Couverture par des tests unitaires (`getThemeFirstLetter`, `groupThemesByLetter`).

## Notes de Réalisation
- Fonctions `getThemeFirstLetter` et `groupThemesByLetter` implémentées dans `src/utils/textUtils.js`.
- Refonte visuelle de la liste dans `src/views/LibraryView.jsx` avec en-têtes alphabétiques et rangées denses.
- Déplacement du bouton de suppression avec confirmation dans la barre d'en-tête du thème sélectionné.
- Ajout des traductions `supprimer` (fr/en) et de 4 nouveaux tests unitaires dans `tests/utils/textUtils.test.js`.
