# Gestion des Tâches — ProverbSeed

Ce dossier centralise le suivi des tâches et tickets du projet **ProverbSeed** sous forme de fichiers Markdown unitaires, facilitant le travail concurrent d'agents IA et de développeurs sans conflits Git.

---

## Structure des Dossiers (Cycle de Vie Kanban)

| Dossier | Description | Qui déplace ici ? |
| :--- | :--- | :--- |
| **`todo/`** | Tâches prêtes à être prises en charge (backlog qualifié) | Utilisateur ou Agent |
| **`doing/`** | Tâche en cours de réalisation (1 seule tâche active par agent) | Agent (prise en charge) |
| **`tovalidate/`** | Tâche terminée côté code/tests, en attente de validation fonctionnelle | Agent (fin de dev) |
| **`done/`** | Tâche formellement validée et acceptée | Utilisateur uniquement |
| **`wontfix/`** | Tâche abandonnée ou rejetée avec justification | Utilisateur uniquement |
| **`archive/`** | Anciens tickets volumineux ou imports historiques (`TODO-legacy.md`) | Utilisateur ou script |

---

## Format de Nommage des Fichiers

Pour éviter toute collision lors de créations concurrentes par plusieurs agents ou humains :

```text
YYYYMMDD-HHMM-[slug-court].md
```

*Exemple :* `20261029-1605-pro-001-export-import-portabilite-donnees.md`

---

## Modèle d'un Fichier Ticket

```markdown
# [Titre concis de la tâche]

- **Date de création** : YYYY-MM-DD HH:MM
- **Priorité** : Haute | Moyenne | Basse
- **Statut** : todo | doing | tovalidate | done | wontfix

## Contexte & Objectif
Description claire du besoin ou du bug à corriger.

## Critères d'Acceptation
- [ ] Critère 1
- [ ] Critère 2

## Notes de Réalisation (Agent)
*(À renseigner lors du passage en `tovalidate`)*
- Fichiers modifiés : ...
- Détail des changements et commandes de validation exécutées : ...
```

---

## Consignes pour les Agents IA

1. **Prise en charge** :
   - Parcourir `ls TODO/todo/` pour repérer les tâches disponibles.
   - Ne lire que le ticket retenu (économie de tokens).
   - Déplacer immédiatement le ticket dans `TODO/doing/` via `git mv` pour poser un verrou visuel anti-doublon.
2. **Fin de tâche** :
   - Compléter la section *Notes de Réalisation* du ticket.
   - Déplacer le ticket dans `TODO/tovalidate/` via `git mv`.
   - **Ne jamais déplacer soi-même un ticket vers `done/` ou `wontfix/`** (réservé à l'utilisateur).
3. **Économie de tokens** :
   - Ne **jamais** lire l'intégralité des dossiers `done/`, `wontfix/` ou `archive/` sans demande explicite ou besoin précis de recherche d'antécédent.
