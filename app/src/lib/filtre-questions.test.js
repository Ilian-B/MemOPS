import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { filtrerQuestions } from './filtre-questions.js'
import { chargerQuestions } from './charger-questions.js'

const liste = [
  { id: 'a-0001', statut: 'validee' },
  { id: 'a-0002', statut: 'a_verifier' },
  { id: 'a-0003', statut: 'rejetee' },
]

describe('filtrerQuestions', () => {
  it('production : uniquement les questions validées', () => {
    expect(filtrerQuestions(liste, false).map((q) => q.id)).toEqual(['a-0001'])
  })
  it('développement : validées et à vérifier, jamais rejetées', () => {
    expect(filtrerQuestions(liste, true).map((q) => q.id)).toEqual(['a-0001', 'a-0002'])
  })
})

describe('banque réelle, construite comme en production', () => {
  it("ne contient aucune question non validée", () => {
    const dossier = fileURLToPath(new URL('../../../questions/', import.meta.url))
    const prod = chargerQuestions(dossier, false)
    expect(prod.filter((q) => q.statut !== 'validee')).toEqual([])
  })
})
