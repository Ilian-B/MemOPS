import { describe, it, expect } from 'vitest'
import { tirerSession, estCorrecte, estJouable } from './session.js'

const faire = (n, type = 'qcm') => Array.from({ length: n }, (_, i) => ({ id: `q-${i}`, type }))

describe('tirerSession', () => {
  it('donne 10 questions au plus, sans doublon', () => {
    const s = tirerSession(faire(25))
    expect(s).toHaveLength(10)
    expect(new Set(s.map((q) => q.id)).size).toBe(10)
  })
  it('donne moins de 10 questions s\'il y en a moins', () => {
    expect(tirerSession(faire(4))).toHaveLength(4)
  })
  it('mélange selon le hasard injecté et ne modifie pas la liste d\'origine', () => {
    const liste = faire(5)
    const s = tirerSession(liste, () => 0)
    expect(s.map((q) => q.id)).not.toEqual(liste.map((q) => q.id))
    expect(liste.map((q) => q.id)).toEqual(['q-0', 'q-1', 'q-2', 'q-3', 'q-4'])
  })
  it('renvoie une liste vide s\'il n\'y a aucune question', () => {
    expect(tirerSession([])).toEqual([])
  })
  it('exclut le type « ordre »', () => {
    expect(tirerSession([...faire(3), ...faire(2, 'ordre')])).toHaveLength(3)
  })
})

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
