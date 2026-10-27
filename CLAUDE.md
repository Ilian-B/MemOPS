# CLAUDE.md – Appli quiz secourisme (POC PWA)

## Objectif du projet

Nous développons une application de quiz mobile (PWA) permettant aux sapeurs-pompiers et secouristes d'entretenir leurs connaissances opérationnelles dans le temps. Le projet a vocation à être partagé en open source.

## Règle d'or : fidélité aux sources

- Périmètre initial : textes nationaux uniquement (GDO, référentiels nationaux). Un champ `portee` (national ou département) permettra d'ajouter plus tard des variantes départementales.
- Toutes les questions et réponses sont tirées exclusivement des textes de référence officiels déposés dans le dossier `sources/`.
- Aucune connaissance extérieure, aucune extrapolation : si une information n'est pas dans les sources, nous ne l'utilisons pas.
- Chaque question cite sa source précise : document, version, chapitre ou page, et citation exacte.
- En cas d'ambiguïté ou de contradiction entre deux textes, nous le signalons au lieu de trancher.
- Lorsqu'un référentiel est mis à jour, les questions issues de l'ancienne version sont identifiées et revues.

**Vérification obligatoire de toutes les propositions** : chaque proposition de réponse, bonne ou mauvaise, est contrôlée une par une contre le texte source. Une bonne réponse doit être justifiée par une citation exacte ; un distracteur doit être démontré faux par le texte. Une question dont une seule proposition n'est pas vérifiée est rejetée.

## Format des questions

- Types : QCM (une ou plusieurs bonnes réponses), vrai/faux, mise en ordre d'une séquence d'actions, cas concret.
- Chaque question comporte : énoncé, propositions, bonne(s) réponse(s), explication courte, référence source, thème, emploi(s) concerné(s), portée, niveau de difficulté.
- Les questions sont stockées dans des fichiers JSON versionnés (`questions/`), séparés du code, et validés par `schema/question.schema.json`.
- Les distracteurs (mauvaises réponses) doivent être plausibles mais clairement faux au regard du texte.
- Seules les questions au statut `validee` sont chargées dans l'appli.

## Fonctionnalités de l'appli

- **Thématiques** : les questions sont classées par section (incendie, secours à personne, etc.) et l'utilisateur peut réviser un thème précis.
- **Mode aléatoire** : un mélange de questions de tous les thèmes.
- **Niveau ou emploi** : l'utilisateur choisit son emploi (par exemple équipier incendie, chef d'agrès) et le mode aléatoire ne propose que les questions correspondantes. Chaque question est rattachée à un ou plusieurs emplois. Les emplois sont cumulatifs : un chef d'agrès reçoit aussi les questions d'équipier. La liste des emplois est calée sur les référentiels officiels.
- **Suivi de la progression** : taux de réussite par thème, pour identifier où ça pèche et ce qui est acquis.
- **Répétition espacée** : les questions bien maîtrisées reviennent de moins en moins souvent, les questions ratées reviennent plus vite.

## Aspect et ergonomie

L'appli doit ressembler à une appli de quiz ludique et sympa, pas à un outil administratif.

- Interface colorée, gros boutons pensés pour le pouce, une question par écran.
- Retour immédiat après chaque réponse : animation, couleur, explication courte et source.
- Éléments de motivation : série de jours consécutifs, niveaux, badges par thème, score personnel.
- Classement entre utilisateurs : petite API hébergée sur le serveur personnel d'Ilian, exposée en HTTPS via le reverse proxy NetBird, avec pseudonymes et aucune donnée personnelle. L'appli reste entièrement utilisable si ce serveur est injoignable. Un minimum d'anti-triche est prévu.
- Sessions courtes (5 à 10 questions) pour réviser en quelques minutes.
- Le côté ludique ne doit jamais nuire à la rigueur : la source reste toujours affichée.
- **Avertissement obligatoire**, affiché au premier lancement et accessible en permanence : « Outil d'entraînement personnel. Ne remplace ni la formation, ni les textes officiels en vigueur. »

## Stack technique

- **Framework** : Svelte avec Vite (léger, peu de code, lisible).
- **PWA et hors ligne** : vite-plugin-pwa (service worker et manifeste).
- **Stockage de la progression** : IndexedDB, en local sur l'appareil, sans compte.
- **Répétition espacée** : algorithme FSRS via la librairie ts-fsrs.
- **Questions** : fichiers JSON validés par un schéma JSON.
- **Tests** : Vitest ; toute question sans source, emploi ou thème fait échouer les tests.
- **Hébergement** : GitHub Pages.
- **Licences** : MIT pour le code, CC BY-SA 4.0 pour les questions. Les PDF officiels ne sont pas redistribués dans le dépôt (`sources/` est exclu par `.gitignore`), et aucun logo officiel n'est utilisé sans autorisation.

## Harnais multi-agents

L'orchestrateur (session principale, Opus) pilote des sous-agents spécialisés définis dans `.claude/agents/` ; aucun code ni aucune question n'est intégré sans passage par un vérificateur.

- **Orchestrateur (Opus)** : découpe le travail en petites tâches, délègue, arbitre et valide l'intégration finale.
- **developpeur** : écrit le code de la PWA, au plus simple et au plus économe.
- **redacteur-questions** : produit les questions à partir des seules sources du dossier `sources/`.
- **verificateur-sources** : pour chaque question, retrouve le passage exact dans les textes, confirme la bonne réponse et l'invalidité des distracteurs, et rejette toute question sans citation vérifiable.
- **relecteur-code** : contrôle la qualité, la sécurité et les tests avant toute intégration.

### Principes d'économie

- Nous utilisons un modèle plus léger pour les tâches simples et réservons Opus à l'orchestration, aux arbitrages et à la vérification des sources.
- Chaque agent reçoit uniquement le contexte nécessaire à sa tâche.
- Nous privilégions des tests automatisés courts et ciblés plutôt que de longues relectures.

## Pratiques de travail

- Le porteur du projet n'est pas développeur : nous expliquons les choix simplement et sans jargon inutile.
- Nous proposons les modifications avant de les appliquer, avec une justification courte, et attendons la validation avant chaque étape.
- Nous avançons par petites étapes testables.
- Toute question générée est relue et validée par un humain (idéalement un formateur ou conseiller technique) avant intégration.
- Rédaction en français, en utilisant « nous » et jamais « on ».

## Arborescence

- `sources/` : textes de référence officiels (PDF), non publiés
- `questions/` : banques de questions JSON par thème
- `schema/` : schéma de validation des questions
- `app/` : code de la PWA
- `docs/` : documentation du projet
- `.claude/agents/` : définition des sous-agents
