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

// Rang d'un emploi ; un emploi inconnu est traité comme « equipier » (rang 0)
function rang(emploi) {
  const i = EMPLOIS.findIndex((e) => e.id === emploi)
  return i === -1 ? 0 : i
}

// Emplois cumulatifs : un chef d'agrès reçoit aussi les questions d'équipier
export function pourEmploi(questions, emploi) {
  const max = rang(emploi)
  return questions.filter((q) => q.emplois.some((e) => rang(e) <= max))
}

// Questions d'un seul thème ; theme null ou undefined : toutes
export function pourTheme(questions, theme) {
  return theme == null ? questions : questions.filter((q) => q.theme === theme)
}
