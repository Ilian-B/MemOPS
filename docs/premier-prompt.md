# Démarrer dans Claude Code

## Avant de lancer

- [ ] Lancer Claude Code dans ce dossier avec le modèle Opus (commande `/model`), qui joue le rôle d'orchestrateur.
- [ ] Déposer les GDO et référentiels nationaux dans `sources/`.
- [ ] Rassembler les référentiels d'emplois pour fixer la liste des emplois.
- [ ] Créer le dépôt GitHub (le dossier `sources/` est déjà exclu).
- [ ] Identifier un formateur ou conseiller technique pour relire les questions.

## Premier prompt

```text
Étape 0 : crée le dossier .claude/agents/ et déplaces-y les fichiers de agents-a-installer/, puis supprime agents-a-installer/.
Lis CLAUDE.md et les agents de .claude/agents/.
Étape 1 : initialise le projet Svelte + Vite + vite-plugin-pwa dans app/, avec Vitest.
Étape 2 : ajoute un test qui valide tous les fichiers de questions/ avec schema/question.schema.json.
Étape 3 : ne génère encore aucune question.
Présente-moi le plan et attends ma validation avant chaque étape.
```

## Deuxième prompt (une fois les GDO déposés)

```text
Liste les documents de sources/ et propose-moi un premier thème à traiter.
Après ma validation : fais rédiger 10 questions par redacteur-questions,
puis fais-les toutes contrôler par verificateur-sources.
Montre-moi le compte rendu (validées / rejetées et pourquoi) avant d'enregistrer quoi que ce soit.
```
