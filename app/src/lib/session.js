// Tirage d'une session et correction des réponses (fonctions pures).

export const TAILLE_SESSION = 10

// Le type « ordre » n'existe pas encore dans les questions : il est exclu du tirage
// tant que l'interface ne sait pas le jouer.
const TYPES_JOUABLES = ['qcm', 'vrai-faux', 'cas-concret']

/** Une question est jouable si l'interface sait la présenter. */
export function estJouable(q) {
  return TYPES_JOUABLES.includes(q.type)
}

/** Juste si l'ensemble choisi est exactement l'ensemble des bonnes réponses. */
export function estCorrecte(question, indexChoisis) {
  const choisis = new Set(indexChoisis)
  const bonnes = new Set(question.bonnes_reponses)
  return choisis.size === bonnes.size && [...bonnes].every((i) => choisis.has(i))
}
