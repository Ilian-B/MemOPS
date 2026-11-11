import { describe, it, expect } from 'vitest'
import { State } from 'ts-fsrs'
import { progressionParTheme, niveauTaux, estAcquise } from './progression.js'

const q = (id, theme, emplois = ['equipier'], statut = 'a_verifier') => ({ id, theme, emplois, statut })
const fiche = (id, reponses, bonnes, state = State.Learning) => ({ id, carte: { state }, reponses, bonnes })
const fiches = (...liste) => new Map(liste.map((f) => [f.id, f]))

describe('progressionParTheme', () => {
  it('thème sans réponse : taux null, rien de vu', () => {
    const r = progressionParTheme([q('a', 'incendie')], fiches(), 'equipier')
    expect(r).toEqual([{ theme: 'incendie', total: 1, vues: 0, acquises: 0, reponses: 0, bonnes: 0, taux: null }])
  })

  it('mélange de thèmes : taux = bonnes / réponses, acquises comptées', () => {
    const questions = [q('a', 'incendie'), q('b', 'incendie'), q('c', 'secours')]
    const f = fiches(fiche('a', 3, 3, State.Review), fiche('b', 1, 0), fiche('c', 2, 1))
    const [inc, sec] = progressionParTheme(questions, f, 'equipier')
    expect(inc).toMatchObject({ theme: 'incendie', total: 2, vues: 2, acquises: 1, taux: 75 })
    expect(sec).toMatchObject({ theme: 'secours', total: 1, vues: 1, acquises: 0, taux: 50 })
  })

  it('exclut les questions rejetées', () => {
    const questions = [q('a', 'incendie'), q('b', 'incendie', ['equipier'], 'rejetee'), q('c', 'rejet', ['equipier'], 'rejetee')]
    const r = progressionParTheme(questions, fiches(), 'equipier')
    expect(r).toHaveLength(1)
    expect(r[0].total).toBe(1)
  })

  it('filtre par emploi (cumulatif)', () => {
    const questions = [q('a', 'incendie'), q('b', 'incendie', ['chef-agres-tout-engin']), q('c', 'chef', ['chef-groupe'])]
    const bas = progressionParTheme(questions, fiches(), 'equipier')
    expect(bas.map((t) => [t.theme, t.total])).toEqual([['incendie', 1]])
    const haut = progressionParTheme(questions, fiches(), 'chef-agres-tout-engin')
    expect(haut.map((t) => [t.theme, t.total])).toEqual([['incendie', 2]])
  })

  it('ignore une fiche orpheline (id absent des questions)', () => {
    const r = progressionParTheme([q('a', 'incendie')], fiches(fiche('zzz', 5, 5, State.Review)), 'equipier')
    expect(r[0]).toMatchObject({ vues: 0, acquises: 0, reponses: 0, taux: null })
  })

  it('trie les thèmes par nom', () => {
    const r = progressionParTheme([q('a', 'secours'), q('b', 'incendie'), q('c', 'ar')], fiches(), 'equipier')
    expect(r.map((t) => t.theme)).toEqual(['ar', 'incendie', 'secours'])
  })
})

describe('progressionParTheme et conduites', () => {
  it('compte une question de conduite seulement si sa case est cochée', () => {
    const questions = [q('a', 'incendie'), q('b', 'conduite', ['conducteur-mea'])]
    expect(progressionParTheme(questions, fiches(), 'equipier').map((t) => t.theme)).toEqual(['incendie'])
    expect(progressionParTheme(questions, fiches(), 'equipier', ['conducteur-mea']).map((t) => t.theme)).toEqual(['conduite', 'incendie'])
  })
})

describe('estAcquise et niveauTaux', () => {
  it('seul l\'état Review est acquis', () => {
    expect(estAcquise(fiche('a', 1, 1, State.Review))).toBe(true)
    expect(estAcquise(fiche('a', 1, 0, State.Relearning))).toBe(false)
    expect(estAcquise(undefined)).toBe(false)
  })
  it('seuils de couleur', () => {
    expect([49, 50, 79, 80].map(niveauTaux)).toEqual(['rouge', 'orange', 'orange', 'vert'])
  })
})
