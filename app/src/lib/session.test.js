import { describe, it, expect } from 'vitest'
import { estCorrecte, estJouable } from './session.js'

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
