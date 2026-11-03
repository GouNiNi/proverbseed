# Classement alphabétique insensible aux accents (Bibliothèque)

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Moyenne
- **Statut** : done

## Contexte & Objectif
Dans la bibliothèque de thèmes, les mots commençant par une lettre accentuée (ex. « Éducation », « École », « Âme ») étaient triés selon l'ordre brut UTF-16 et apparaissaient tout à la fin de la liste, après la lettre Z.
Le classement alphabétique doit rattacher chaque mot accentué à sa lettre de base correspondante (ex. « École » rattaché et intercalé avec les mots en « E »).

## Critères d'Acceptation
- [x] Utilisation de `localeCompare` basé sur la langue active (`fr` ou `en`) dans `LibraryView.jsx` pour trier les thèmes.
- [x] Les mots accentués sont intercalés naturellement avec leur lettre de base sans être relégués en fin de liste.
- [x] Tests unitaires dédiés validant le tri alphabétique avec et sans accents (`tests/views/librarySort.test.js`).

## Notes de Réalisation
- Modification dans `src/views/LibraryView.jsx` : passage de `th.sort()` à `th.sort((a, b) => a.localeCompare(b, language === 'fr' ? 'fr' : 'en'))`.
- Ajout du test de validation `tests/views/librarySort.test.js`.
