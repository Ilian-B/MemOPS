# Banques de questions

- Un fichier JSON par thème, contenant un tableau de questions : `incendie.json`, `secours-a-personne.json`, etc.
- Chaque question respecte `schema/question.schema.json`.
- Le champ `emplois` accepte les emplois de l'échelle cumulative et les cinq niveaux de conduite (`conducteur-*`), hors échelle : une question de conduite n'est proposée qu'à qui a coché ce niveau.
- Toutes les questions sont chargées dans l'appli, sauf celles au statut `rejetee`.
- Licence des questions : Creative Commons BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/deed.fr).
