// Calculs de l'écran « Ma progression » (fonctions pures, sans accès au stockage).
import { State } from 'ts-fsrs'
import { filtrerQuestions, pourEmploi } from './filtre-questions.js'

/**
 * Une question est « acquise » quand sa fiche FSRS est à l'état Review :
 * elle a passé la phase d'apprentissage et n'a pas été oubliée depuis
 * (une réponse fausse la renvoie en réapprentissage, donc hors « acquise »).
 */
export function estAcquise(fiche) {
  return fiche?.carte?.state === State.Review
}

/**
 * Progression par thème, triée par nom de thème.
 * Exclut les questions « rejetee » et ne garde que celles de l'emploi choisi (emplois cumulatifs)
 * et des conduites cochées.
 * `fiches` est une Map id -> { id, carte, reponses, bonnes }.
 * Pour chaque thème : { theme, total, vues, acquises, reponses, bonnes, taux }.
 * Le taux (en %, arrondi) vaut null tant qu'il n'y a aucune réponse.
 */
export function progressionParTheme(questions, fiches, emploi, conduites = []) {
  const themes = new Map()
  for (const q of pourEmploi(filtrerQuestions(questions), emploi, conduites)) {
    const t = themes.get(q.theme) ?? { theme: q.theme, total: 0, vues: 0, acquises: 0, reponses: 0, bonnes: 0, taux: null }
    t.total += 1
    const fiche = fiches.get(q.id)
    if (fiche) {
      t.vues += 1
      t.reponses += fiche.reponses
      t.bonnes += fiche.bonnes
      if (estAcquise(fiche)) t.acquises += 1
    }
    themes.set(q.theme, t)
  }
  const liste = [...themes.values()].sort((a, b) => a.theme.localeCompare(b.theme, 'fr'))
  for (const t of liste) t.taux = t.reponses > 0 ? Math.round((100 * t.bonnes) / t.reponses) : null
  return liste
}

/** Couleur de la barre : rouge < 50 %, orange de 50 à 79 %, vert à partir de 80 %. */
export function niveauTaux(taux) {
  if (taux < 50) return 'rouge'
  if (taux < 80) return 'orange'
  return 'vert'
}
