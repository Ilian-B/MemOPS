# Back office « accès formateurs »

Page claude.ai privée qui présente toutes les questions de la banque, avec leur état de validation et l'historique des relectures.

- Adresse : https://claude.ai/artifact/NAQtEcx96EQ1HzVQyecm1i (accessible uniquement aux personnes invitées).
- Inviter un formateur : bouton **Partager** de la page, accès **Contributeur** (un « Lecteur » peut consulter mais pas donner d'avis). Le formateur a besoin d'un compte claude.ai.

## Ce que montre la page

- Compteurs par état : à relire (`a_verifier`), validées (`validee`), rejetées (`rejetee`).
- Filtres : état, thème, emploi, avis (pas encore relue par moi, sans avis, avec un avis conforme / à corriger / à rejeter), recherche libre.
- Pour chaque question : énoncé, propositions avec la ou les bonnes réponses, explication, source et citation, historique (vérificateur des sources, relectures enregistrées, avis donnés dans la page avec leur auteur et leur date).
- Chaque formateur donne un avis par question : **Conforme**, **À corriger** ou **À rejeter**, avec un commentaire facultatif. L'avis est enregistré automatiquement, avec son auteur et sa date.

## Circuit d'une question

1. Le rédacteur propose la question à partir des seules sources (`sources/`).
2. Le vérificateur des sources la contrôle ; seule une question `VALIDÉE` entre dans `questions/`, au statut `a_verifier`. Elle est alors publiée dans l'appli.
3. L'orchestrateur charge la banque dans le back office (collection `questions` de la page).
4. Les formateurs donnent leur avis dans le back office.
5. L'orchestrateur relit les avis et les reporte dans `questions/` :
   - **Conforme** : statut `validee`, avec une entrée dans `relectures` (`par` = pseudonyme ou initiales du relecteur, `le` = date, `avis`).
   - **À corriger** : la question retourne au rédacteur puis au vérificateur ; elle reste publiée en attendant, sauf erreur grave.
   - **À rejeter** : statut `rejetee` ; elle disparaît de l'appli.
   - En cas d'avis contradictoires entre formateurs, nous le signalons au porteur du projet au lieu de trancher.
6. La banque à jour est rechargée dans le back office et enregistrée dans git.

Dans le dépôt public, les relecteurs n'apparaissent que sous un pseudonyme ou leurs initiales. Le correspondant entre un compte claude.ai et un pseudonyme est choisi avec le porteur du projet lors du premier avis d'un nouveau relecteur.
