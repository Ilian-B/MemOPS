import { describe, it, expect } from 'vitest'
import { estCorrecte, estJouable, melangerPropositions, toucherEtape } from './session.js'

describe('estJouable', () => {
  it('accepte qcm, vrai-faux, cas-concret et ordre', () => {
    for (const t of ['qcm', 'vrai-faux', 'cas-concret', 'ordre']) expect(estJouable({ type: t })).toBe(true)
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

describe('type ordre', () => {
  const ordre = { type: 'ordre', propositions: ['A', 'B', 'C', 'D'], bonnes_reponses: [2, 0, 3, 1] } // C, A, D, B
  it('la séquence exacte est juste, toute autre est fausse', () => {
    expect(estCorrecte(ordre, [2, 0, 3, 1])).toBe(true)
    expect(estCorrecte(ordre, [0, 2, 3, 1])).toBe(false)
    expect(estCorrecte(ordre, [2, 0, 3])).toBe(false) // incomplète
  })
  it('le mélange garde la bonne séquence (même textes, même ordre) sans la trier', () => {
    for (const hasard of [() => 0, () => 0.5, () => 0.99]) {
      const m = melangerPropositions(ordre, hasard)
      expect([...m.propositions].sort()).toEqual(['A', 'B', 'C', 'D'])
      expect(m.bonnes_reponses.map((i) => m.propositions[i])).toEqual(['C', 'A', 'D', 'B'])
      expect(estCorrecte(m, m.bonnes_reponses)).toBe(true)
    }
  })
  it('ordre à 2 étapes : l\'affichage n\'est jamais l\'ordre attendu', () => {
    for (const bonnes of [[0, 1], [1, 0]]) {
      for (const hasard of [() => 0, () => 0.99]) {
        const m = melangerPropositions({ type: 'ordre', propositions: ['A', 'B'], bonnes_reponses: bonnes }, hasard)
        expect(m.bonnes_reponses).not.toEqual([0, 1])
        expect(m.bonnes_reponses.map((i) => m.propositions[i])).toEqual(bonnes.map((i) => ['A', 'B'][i]))
      }
    }
  })
  it('séquence plus longue que la bonne : fausse', () => {
    expect(estCorrecte({ type: 'ordre', bonnes_reponses: [1, 0] }, [1, 0, 1])).toBe(false)
  })
  it('n\'affiche jamais les étapes déjà dans le bon ordre', () => {
    const deja = { type: 'ordre', propositions: ['A', 'B', 'C'], bonnes_reponses: [0, 1, 2] }
    const m = melangerPropositions(deja, () => 0.99) // ce hasard laisse l'ordre inchangé
    expect(m.bonnes_reponses).not.toEqual([0, 1, 2])
    expect(m.bonnes_reponses.map((i) => m.propositions[i])).toEqual(['A', 'B', 'C'])
  })
})

describe('toucherEtape', () => {
  it('ajoute une étape à la suite', () => {
    expect(toucherEtape([2], 0)).toEqual([2, 0])
  })
  it('toucher une étape déjà placée l\'annule avec les suivantes', () => {
    expect(toucherEtape([2, 0, 3], 0)).toEqual([2])
    expect(toucherEtape([2, 0, 3], 2)).toEqual([])
  })
})
