// Préférences locales (emploi choisi). Le stockage est obtenu dans le try, car même
// l'accès à localStorage peut lever une erreur : l'appli continue alors avec le choix en mémoire.
import { EMPLOIS } from './filtre-questions.js'

export const CLE_EMPLOI = 'memops.emploi'

// Renvoie l'emploi enregistré, ou null (rien, valeur invalide ou lecture impossible)
export function lireEmploi(fournir = () => globalThis.localStorage) {
  try {
    const valeur = fournir().getItem(CLE_EMPLOI)
    return EMPLOIS.some((e) => e.id === valeur) ? valeur : null
  } catch {
    return null
  }
}

// Enregistre l'emploi ; renvoie false si l'écriture échoue (sans conséquence)
export function ecrireEmploi(emploi, fournir = () => globalThis.localStorage) {
  try {
    fournir().setItem(CLE_EMPLOI, emploi)
    return true
  } catch {
    return false
  }
}
