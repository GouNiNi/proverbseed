# Suite de tests unitaires et intégration au workflow

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Haute
- **Statut** : done

## Contexte & Objectif
Garantir la non-régression et la fiabilité du code à travers une suite de tests unitaires exécutables via `npm test` avec le test runner natif de Node.js (`node:test`).

## Critères d'Acceptation
- [x] Tests unitaires sur `textUtils.js` (`normalizeText`, `filterAndSortTagSuggestions`, `resolveTagWithExisting`).
- [x] Tests unitaires sur `translations.js` (parité et cohérence des dictionnaires `fr` et `en`, fallback).
- [x] Tests d'intégrité sur les datasets `proverbs_fr.json` et `proverbs_en.json` (structure, unicité des identifiants, concordance des versets).
- [x] Tests unitaires sur la logique SemVer de `bump-version.js`.
- [x] Test de configuration Sablier (`sablier-theme.test.js`).
- [x] Script `npm test` configuré dans `package.json` et documentation dans `CLAUDE.md`.

## Notes de Réalisation
- Suite complète de 41 tests automatisés avec `node:test` sans dépendance tierce lourde.
- Tous les tests validés avec succès.
