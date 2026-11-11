// Filtre des questions embarquées dans l'appli (fonction pure).
// Toutes les questions sont publiées, sauf celles au statut « rejetee ».
export function filtrerQuestions(questions) {
  return questions.filter((q) => q.statut !== 'rejetee')
}

// Emplois du plus bas au plus élevé (même ordre que l'enum du schéma)
export const EMPLOIS = [
  { id: 'equipier', libelle: 'Équipier' },
  { id: 'chef-equipe', libelle: "Chef d'équipe" },
  { id: 'chef-agres-une-equipe', libelle: "Chef d'agrès une équipe" },
  { id: 'chef-agres-tout-engin', libelle: "Chef d'agrès tout engin" },
  { id: 'sous-officier-garde', libelle: 'Sous-officier de garde' },
  { id: 'chef-groupe', libelle: 'Chef de groupe' },
  { id: 'officier-garde', libelle: 'Officier de garde' },
  { id: 'chef-colonne', libelle: 'Chef de colonne' },
  { id: 'chef-site', libelle: 'Chef de site' },
]

// Niveaux de la spécialité « Conduite et manipulation des véhicules d'incendie et de secours »
// (arrêté du 15 juillet 2026, annexe II). Hors de l'échelle des emplois : pas de cumul,
// chaque niveau est indépendant des autres et de l'emploi. `court` sert au rappel sur l'accueil.
export const CONDUITES = [
  { id: 'conducteur-vehicules-sis', libelle: 'Conducteur des véhicules du SIS', court: 'Véhicules SIS' },
  { id: 'conducteur-engins-pompes', libelle: 'Conducteur et manipulateur des engins pompes', court: 'Engins pompes' },
  { id: 'operateur-plateforme-mea', libelle: 'Opérateur de plateforme des moyens élévateurs aériens', court: 'Plateforme MEA' },
  { id: 'conducteur-mea', libelle: 'Conducteur et manipulateur des moyens élévateurs aériens', court: 'MEA' },
  { id: 'conducteur-tout-terrain', libelle: 'Conducteur et manipulateur des véhicules tout terrain', court: 'Tout terrain' },
]

// Rang d'un emploi de l'échelle ; -1 si l'id n'en fait pas partie (ex. une conduite)
const rangEchelle = (id) => EMPLOIS.findIndex((e) => e.id === id)

/**
 * Questions retenues pour l'emploi choisi et les conduites cochées.
 * Une question est retenue si l'un de ses emplois est dans l'échelle avec un rang <= celui de
 * l'emploi choisi (cumulatif : un chef d'agrès reçoit aussi celles d'équipier), OU s'il s'agit
 * d'une conduite cochée. Un emploi choisi inconnu vaut « equipier ».
 */
export function pourEmploi(questions, emploi, conduites = []) {
  const max = Math.max(rangEchelle(emploi), 0)
  return questions.filter((q) =>
    q.emplois.some((e) => {
      const r = rangEchelle(e)
      return r === -1 ? conduites.includes(e) : r <= max
    }),
  )
}

// Questions d'un seul thème ; theme null ou undefined : toutes
export function pourTheme(questions, theme) {
  return theme == null ? questions : questions.filter((q) => q.theme === theme)
}
