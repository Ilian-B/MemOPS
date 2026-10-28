import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { filtrerQuestions } from './filtre-questions.js'
import { chargerQuestions } from './charger-questions.js'

const liste = [
  { id: 'a-0001', statut: 'validee' },
  { id: 'a-0002', statut: 'a_verifier' },
  { id: 'a-0003', statut: 'rejetee' },
]

describe('filtrerQuestions', () => {
  it('garde les validées et à vérifier, jamais les rejetées', () => {
    expect(filtrerQuestions(liste).map((q) => q.id)).toEqual(['a-0001', 'a-0002'])
  })
})

describe('banque réelle, construite comme en production', () => {
  const dossier = fileURLToPath(new URL('../../../questions/', import.meta.url))
  const prod = chargerQuestions(dossier)
  it('ne contient aucune question rejetée', () => {
    expect(prod.filter((q) => q.statut === 'rejetee')).toEqual([])
  })
  it('contient toutes les questions non rejetées des fichiers', () => {
    // Comptage direct dans les fichiers JSON, indépendant du chargeur
    const brut = readdirSync(dossier)
      .filter((n) => n.endsWith('.json'))
      .flatMap((n) => JSON.parse(readFileSync(join(dossier, n), 'utf8')))
    expect(prod.length).toBe(brut.filter((q) => q.statut !== 'rejetee').length)
  })
})
