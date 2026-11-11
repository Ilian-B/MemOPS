// Tirage d'une session et correction des réponses (fonctions pures).

export const TAILLE_SESSION = 10

// Types que l'interface sait présenter
const TYPES_JOUABLES = ['qcm', 'vrai-faux', 'cas-concret', 'ordre']

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
  let ordre = melanger(question.propositions.map((_, i) => i), hasard) // ordre[nouveau] = ancien
  if (question.type === 'ordre') {
    // Ici bonnes_reponses est une séquence : nous la réindexons SANS la trier.
    let bonnes = question.bonnes_reponses.map((b) => ordre.indexOf(b))
    // Si l'affichage donnait déjà la bonne séquence (0, 1, 2…), nous l'inversons
    if (bonnes.every((b, i) => b === i)) {
      ordre = [...ordre].reverse()
      bonnes = question.bonnes_reponses.map((b) => ordre.indexOf(b))
    }
    return { ...question, propositions: ordre.map((ancien) => question.propositions[ancien]), bonnes_reponses: bonnes }
  }
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

/**
 * Mise en ordre : ajoute l'étape `i` à la séquence choisie ; si elle y est déjà,
 * nous retirons cette étape et toutes les suivantes. Renvoie une nouvelle liste.
 */
export function toucherEtape(choisis, i) {
  const place = choisis.indexOf(i)
  return place === -1 ? [...choisis, i] : choisis.slice(0, place)
}

/** Juste si l'ensemble choisi est exactement l'ensemble des bonnes réponses (ou, pour « ordre », la bonne séquence). */
export function estCorrecte(question, indexChoisis) {
  // Type « ordre » : la séquence complète doit être exacte
  if (question.type === 'ordre') {
    return indexChoisis.length === question.bonnes_reponses.length
      && indexChoisis.every((b, i) => b === question.bonnes_reponses[i])
  }
  const choisis = new Set(indexChoisis)
  const bonnes = new Set(question.bonnes_reponses)
  return choisis.size === bonnes.size && [...bonnes].every((i) => choisis.has(i))
}
