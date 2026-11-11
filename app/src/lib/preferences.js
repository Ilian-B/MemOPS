// Préférences locales (emploi choisi). Le stockage est obtenu dans le try, car même
// l'accès à localStorage peut lever une erreur : l'appli continue alors avec le choix en mémoire.
import { EMPLOIS, CONDUITES } from './filtre-questions.js'

export const CLE_EMPLOI = 'memops.emploi'
export const CLE_CONDUITES = 'memops.conduites'

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

// Renvoie les conduites cochées (liste d'ids, vide par défaut). Les valeurs inconnues,
// un JSON illisible ou une lecture impossible donnent une liste vide ou filtrée.
export function lireConduites(fournir = () => globalThis.localStorage) {
  try {
    const liste = JSON.parse(fournir().getItem(CLE_CONDUITES))
    if (!Array.isArray(liste)) return []
    return CONDUITES.map((c) => c.id).filter((id) => liste.includes(id))
  } catch {
    return []
  }
}

// Enregistre les conduites cochées ; renvoie false si l'écriture échoue (sans conséquence)
export function ecrireConduites(conduites, fournir = () => globalThis.localStorage) {
  try {
    fournir().setItem(CLE_CONDUITES, JSON.stringify(conduites))
    return true
  } catch {
    return false
  }
}
