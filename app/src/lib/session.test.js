import { describe, it, expect } from 'vitest'
import { estCorrecte, estJouable, melangerPropositions } from './session.js'

describe('estJouable', () => {
  it('accepte qcm, vrai-faux, cas-concret et refuse ordre', () => {
    for (const t of ['qcm', 'vrai-faux', 'cas-concret']) expect(estJouable({ type: t })).toBe(true)
    expect(estJouable({ type: 'ordre' })).toBe(false)
  })
})

describe('estCorrecte', () => {
  const simple = { bonnes_reponses: [2] }
  const multiple = { bonnes_reponses: [0, 1, 2] }
  it('QCM simple et vrai-faux', () => {
    expect(estCorrecte(simple, [2])).toBe(true)
    expect(estCorrecte(simple, [1])).toBe(false)
    expect(estCorrecte(simple, [2, 2])).toBe(true)
  })
  it('QCM multiple : ensemble exact, sans tenir compte de l\'ordre', () => {
    expect(estCorrecte(multiple, [2, 0, 1])).toBe(true)
    expect(estCorrecte(multiple, [0, 1])).toBe(false)
    expect(estCorrecte(multiple, [0, 1, 2, 3])).toBe(false)
    expect(estCorrecte(multiple, [])).toBe(false)
  })
})

describe('melangerPropositions', () => {
  const qcm = {
    type: 'qcm', propositions: ['A', 'B', 'C', 'D'], bonnes_reponses: [1, 3],
  }
  it('garde les mêmes bonnes réponses (même texte) et la correction juste', () => {
    const m = melangerPropositions(qcm, () => 0)
    expect(m.propositions).not.toEqual(qcm.propositions)
    expect([...m.propositions].sort()).toEqual(['A', 'B', 'C', 'D'])
    expect(m.bonnes_reponses.map((i) => m.propositions[i]).sort()).toEqual(['B', 'D'])
    expect(estCorrecte(m, m.bonnes_reponses)).toBe(true)
  })
  it('ne modifie pas la question d\'origine', () => {
    melangerPropositions(qcm, () => 0)
    expect(qcm.propositions).toEqual(['A', 'B', 'C', 'D'])
    expect(qcm.bonnes_reponses).toEqual([1, 3])
  })
  it('laisse le vrai/faux dans son ordre', () => {
    const vf = { type: 'vrai-faux', propositions: ['Vrai', 'Faux'], bonnes_reponses: [1] }
    expect(melangerPropositions(vf, () => 0)).toBe(vf)
  })
})
