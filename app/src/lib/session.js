// Tirage d'une session et correction des réponses (fonctions pures).

export const TAILLE_SESSION = 10

// Le type « ordre » n'existe pas encore dans les questions : il est exclu du tirage
// tant que l'interface ne sait pas le jouer.
const TYPES_JOUABLES = ['qcm', 'vrai-faux', 'cas-concret']

// Mélange de Fisher-Yates (copie), `hasard` injectable
export function melanger(liste, hasard = Math.random) {
  const copie = [...liste]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

/**
 * Version de la question avec les propositions dans un ordre aléatoire
 * et `bonnes_reponses` réindexées. L'objet d'origine n'est pas modifié.
 * Les vrai/faux gardent leur ordre.
 */
export function melangerPropositions(question, hasard = Math.random) {
  if (question.type === 'vrai-faux') return question
  const ordre = melanger(question.propositions.map((_, i) => i), hasard) // ordre[nouveau] = ancien
  return {
    ...question,
    propositions: ordre.map((ancien) => question.propositions[ancien]),
    bonnes_reponses: question.bonnes_reponses.map((b) => ordre.indexOf(b)).sort((a, b) => a - b),
  }
}

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
