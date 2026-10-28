// Tirage d'une session et correction des réponses (fonctions pures).

export const TAILLE_SESSION = 10

// Le type « ordre » n'existe pas encore dans les questions : il est exclu du tirage
// tant que l'interface ne sait pas le jouer.
const TYPES_JOUABLES = ['qcm', 'vrai-faux', 'cas-concret']

/** Une question est jouable si l'interface sait la présenter. */
export function estJouable(q) {
  return TYPES_JOUABLES.includes(q.type)
}

/**
 * Tire au plus `taille` questions jouables, dans un ordre aléatoire, sans doublon.
 * `hasard` (par défaut Math.random) est injectable pour les tests.
 */
export function tirerSession(questions, hasard = Math.random, taille = TAILLE_SESSION) {
  const copie = questions.filter(estJouable)
  // Mélange de Fisher-Yates
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie.slice(0, taille)
}

/** Juste si l'ensemble choisi est exactement l'ensemble des bonnes réponses. */
export function estCorrecte(question, indexChoisis) {
  const choisis = new Set(indexChoisis)
  const bonnes = new Set(question.bonnes_reponses)
  return choisis.size === bonnes.size && [...bonnes].every((i) => choisis.has(i))
}
