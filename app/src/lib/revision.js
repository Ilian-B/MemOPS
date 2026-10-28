// Répétition espacée (algorithme FSRS via ts-fsrs) : fonctions pures.
// Une « fiche » par question : { id, carte, reponses, bonnes }.
// `maintenant` (un objet Date) est toujours passé en paramètre pour pouvoir tester.
import { createEmptyCard, fsrs, Rating } from 'ts-fsrs'
import { estJouable, TAILLE_SESSION } from './session.js'

// Sans étapes courtes : une carte neuve revient dans 1 jour (Again) ou 3 jours (Good)
const planificateur = fsrs({ enable_short_term: false })

/** Nouvelle fiche, pour une question jamais vue. */
export function creerFiche(id, maintenant) {
  return { id, carte: createEmptyCard(maintenant), reponses: 0, bonnes: 0 }
}

/**
 * Enregistre une réponse : bonne -> « Good », mauvaise -> « Again ».
 * Renvoie une nouvelle fiche (l'ancienne, éventuellement absente, n'est pas modifiée).
 */
export function enregistrerReponse(fiche, id, correcte, maintenant) {
  const base = fiche ?? creerFiche(id, maintenant)
  const note = correcte ? Rating.Good : Rating.Again
  const { card } = planificateur.next(base.carte, maintenant, note)
  return {
    id,
    carte: card,
    reponses: base.reponses + 1,
    bonnes: base.bonnes + (correcte ? 1 : 0),
  }
}

const echeance = (fiche) => new Date(fiche.carte.due).getTime()

// Mélange de Fisher-Yates (copie), `hasard` injectable
function melanger(liste, hasard) {
  const copie = [...liste]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

/**
 * Tire au plus `taille` questions jouables, sans doublon, dans cet ordre :
 *   1. les questions dues (échéance <= maintenant), les plus en retard d'abord ;
 *   2. les questions jamais vues, au hasard ;
 *   3. les autres, par échéance la plus proche.
 * `fiches` est une Map id -> fiche.
 */
export function tirerSessionRevision(questions, fiches, maintenant, hasard = Math.random, taille = TAILLE_SESSION) {
  const t = maintenant.getTime()
  const jouables = questions.filter(estJouable)
  const parEcheance = (a, b) => echeance(fiches.get(a.id)) - echeance(fiches.get(b.id))

  const vues = jouables.filter((q) => fiches.has(q.id))
  const dues = vues.filter((q) => echeance(fiches.get(q.id)) <= t).sort(parEcheance)
  const autres = vues.filter((q) => echeance(fiches.get(q.id)) > t).sort(parEcheance)
  const neuves = melanger(
    jouables.filter((q) => !fiches.has(q.id)),
    hasard,
  )
  return [...dues, ...neuves, ...autres].slice(0, taille)
}

/** Nombre de questions déjà vues dont l'échéance est <= `limite` (Date). */
export function compterDues(questions, fiches, limite) {
  return questions.filter((q) => fiches.has(q.id) && echeance(fiches.get(q.id)) <= limite.getTime()).length
}

/** Fin de la journée locale (23 h 59 min 59 s 999) de `maintenant`. */
export function finDeJournee(maintenant) {
  const fin = new Date(maintenant)
  fin.setHours(23, 59, 59, 999)
  return fin
}

/**
 * Statistiques : par thème (nombre de questions, vues, réponses, bonnes, taux en %),
 * et nombre de questions à revoir aujourd'hui (échéance avant la fin de la journée).
 * Le taux vaut null tant qu'aucune réponse n'a été donnée.
 */
export function statistiques(questions, fiches, maintenant) {
  const themes = new Map()
  for (const q of questions) {
    const s = themes.get(q.theme) ?? { theme: q.theme, questions: 0, vues: 0, reponses: 0, bonnes: 0, taux: null }
    s.questions += 1
    const fiche = fiches.get(q.id)
    if (fiche) {
      s.vues += 1
      s.reponses += fiche.reponses
      s.bonnes += fiche.bonnes
    }
    themes.set(q.theme, s)
  }
  const parTheme = [...themes.values()].sort((a, b) => a.theme.localeCompare(b.theme, 'fr'))
  for (const s of parTheme) s.taux = s.reponses > 0 ? Math.round((100 * s.bonnes) / s.reponses) : null
  return { parTheme, aRevoir: compterDues(questions, fiches, finDeJournee(maintenant)) }
}

// Libellés lisibles connus (les accents ne se devinent pas) ; sinon, mise en forme simple
const LIBELLES = { 'secours-a-personne': 'Secours à personne', incendie: 'Incendie' }

/** « secours-a-personne » -> « Secours à personne ». */
export function libelleTheme(theme) {
  if (LIBELLES[theme]) return LIBELLES[theme]
  const texte = theme.replaceAll('-', ' ')
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}
