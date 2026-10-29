# [PRO-005] Désactivation du remplissage automatique (Android)

- **Date de création** : 2026-10-29 16:05
- **Priorité** : Moyenne
- **Statut** : done
- **Code Legacy** : PRO-005

## Contexte & Réalisation
Attributs HTML optimisés (`autoComplete`, `readOnly` au focus) + Désactivation du service de saisie automatique Chrome/Android.

## Détails techniques
- **Objectif** : Empêcher le clavier Android d'afficher les outils de remplissage automatique (mots de passe, moyens de paiement, adresses) lors de la saisie d'une étiquette afin de ne pas masquer l'écran.
- **Détails** : Configurer les attributs HTML du champ `<input>` de saisie d'étiquettes (ex: `autoComplete="off"`, `data-form-type="other"`, attributs anti-gestionnaires) tout en préservant le dictionnaire et la prédiction de texte du clavier.

## Notes de Migration
Validé et archivé depuis l'ancien TODO.md de ProverbSeed (archivé dans `TODO/archive/TODO-legacy.md`).
