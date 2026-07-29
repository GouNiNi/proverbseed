# ProverbSeed — Liste des Tâches (TODO)

## 📌 En cours / À faire (Backlog)

| ID | Titre | Description | Statut |
| :--- | :--- | :--- | :--- |
| **PRO-001** | Export / Import (Portabilité des données) | Implémenter la logique d'exportation et d'importation des métadonnées (thèmes, favoris, notes) au format JSON. | ⏳ À faire |
| **PRO-002** | Gestion des Favoris | Permettre le marquage des proverbes en favoris et créer la section dédiée dans la bibliothèque. | ⏳ À faire |
| **PRO-003** | Notes de Méditation & Jardin de Sagesse | Implémenter la saisie de notes sur les proverbes et le système de progression du Jardin de Sagesse. | ⏳ À faire |
| **PRO-004** | Vue "Lecture continuous" par thème | Ajouter un mode d'affichage épuré et continu des proverbes d'un thème pour la contemplation. | ⏳ À faire |
| **PRO-006** | Suggestions d'étiquettes insensibles aux accents et à la casse | Proposer les catégories/étiquettes existantes lors de la saisie avec un matching large (insensible aux accents et majuscules). | ⏳ En attente de validation |

---

## 💡 Détails des Tâches

### PRO-001 — Export / Import (Portabilité des données)
- **Objectif** : Permettre à l'utilisateur de sauvegarder et restaurer ses données locales sans dépendre d'un serveur.
- **Détails** : Exporter les associations thématiques, favoris, notes et paramètres au format JSON. Importer avec validation du schéma.

### PRO-002 — Gestion des Favoris
- **Objectif** : Retrouver facilement ses proverbes marquants.
- **Détails** : Toggle favori sur la carte principale et vue dédiée dans la Bibliothèque.

### PRO-003 — Notes de Méditation & Jardin de Sagesse
- **Objectif** : Encourager la réflexion personnelle et matérialiser la régularité de lecture.
- **Détails** : Champ de texte pour notes personnelles par proverbe et module "Jardin de Sagesse (Saisons)".

### PRO-004 — Vue "Lecture continue" par thème
- **Objectif** : Offrir une expérience de lecture contemplative sans distraction.
- **Détails** : Dans la bibliothèque, mode "lire à la suite" sans boutons d'action — juste le texte et les références.

### PRO-005 — Désactivation du remplissage automatique (Android) sur les étiquettes
- **Objectif** : Empêcher le clavier Android d'afficher les outils de remplissage automatique (mots de passe, moyens de paiement, adresses) lors de la saisie d'une étiquette afin de ne pas masquer l'écran.
- **Détails** : Configurer les attributs HTML du champ `<input>` de saisie d'étiquettes (ex: `autoComplete="off"`, `data-form-type="other"`, attributs anti-gestionnaires) tout en préservant le dictionnaire et la prédiction de texte du clavier.

### PRO-006 — Suggestions d'étiquettes insensibles aux accents et à la casse
- **Objectif** : Améliorer la saisie d'étiquettes en proposant des suggestions dynamiques issues de la bibliothèque qui matchent indépendamment des accents et des majuscules (ex: taper "ecole" ou "Ecole" doit suggérer "École").
- **Détails** : Normaliser la chaîne saisie et les catégories de l'utilisateur (via `normalizeText` NFD) avec tri prioritaire par début de mot (`startsWith`) et résolution de fusion exacte par nom d'étiquette existant.

---

## ✅ Tâches Terminées

| ID | Titre | Description |
| :--- | :--- | :--- |
| **PRO-005** | Désactivation du remplissage automatique (Android) | Attributs HTML optimisés (`autoComplete`, `readOnly` au focus) + Désactivation du service de saisie automatique Chrome/Android. |
| **PRO-100** | Spécifications initiales | Rédaction du document `spec.md` et définition de la charte graphique. |
| **PRO-101** | Recherche extraction & indexation biblique | Étude des outils et formats pour le texte biblique (Louis Segond 1910). |
| **PRO-102** | Architecture PWA & Stockage local | Sélection et validation de la stack (Vite + React + localForage). |
| **PRO-103** | Plan d'implémentation technique | Validation de l'architecture logicielle et de la structure du projet. |
