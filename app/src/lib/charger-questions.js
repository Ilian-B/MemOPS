// Lecture des banques questions/*.json côté Node (utilisé par Vite et par les tests).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { filtrerQuestions } from './filtre-questions.js'

/** @param {string} dossier chemin du dossier questions/ */
export function chargerQuestions(dossier) {
  const toutes = readdirSync(dossier)
    .filter((nom) => nom.endsWith('.json'))
    .flatMap((nom) => JSON.parse(readFileSync(join(dossier, nom), 'utf8')))
  return filtrerQuestions(toutes)
}
