import { describe, it, expect } from 'vitest'
import {
  creerFiche, enregistrerReponse, tirerSessionRevision, compterDues, statistiques, libelleTheme,
} from './revision.js'

const T0 = new Date('2026-01-10T10:00:00')
const MIN = 60 * 1000
const JOUR = 24 * 60 * MIN
const q = (id, theme = 'incendie', type = 'qcm') => ({ id, theme, type })
// Fiche factice dont l'échéance est décalée de `decalage` ms par rapport à T0
const fiche = (id, decalage, reponses = 1, bonnes = 1) => ({
  id, carte: { due: new Date(T0.getTime() + decalage) }, reponses, bonnes,
})
const fiches = (...liste) => new Map(liste.map((f) => [f.id, f]))

describe('enregistrerReponse', () => {
  it('crée la fiche et compte une bonne réponse', () => {
    const f = enregistrerReponse(undefined, 'a', true, T0)
    expect(f).toMatchObject({ id: 'a', reponses: 1, bonnes: 1 })
    expect(new Date(f.carte.due).getTime()).toBeGreaterThan(T0.getTime())
  })
  it('compte une mauvaise réponse sans bonne', () => {
    const f = enregistrerReponse(creerFiche('a', T0), 'a', false, T0)
    expect(f).toMatchObject({ reponses: 1, bonnes: 0 })
  })
  it('une bonne réponse espace plus que la même question ratée', () => {
    const bien = enregistrerReponse(undefined, 'a', true, T0)
    const mal = enregistrerReponse(undefined, 'a', false, T0)
    expect(new Date(bien.carte.due) > new Date(mal.carte.due)).toBe(true)
  })
  it('l\'intervalle grandit quand les bonnes réponses s\'enchaînent', () => {
    let f = enregistrerReponse(undefined, 'a', true, T0)
    const premier = new Date(f.carte.due).getTime() - T0.getTime()
    let now = new Date(f.carte.due)
    for (let i = 0; i < 3; i++) {
      f = enregistrerReponse(f, 'a', true, now)
      now = new Date(f.carte.due)
    }
    expect(now.getTime() - T0.getTime()).toBeGreaterThan(premier * 10)
    expect(f.reponses).toBe(4)
  })
  it('ne modifie pas la fiche d\'origine', () => {
    const avant = creerFiche('a', T0)
    enregistrerReponse(avant, 'a', true, T0)
    expect(avant.reponses).toBe(0)
  })
})

describe('échéances FSRS d\'une carte neuve', () => {
  const JOURS = (f) => (new Date(f.carte.due).getTime() - T0.getTime()) / JOUR
  it('Again -> 1 jour, Good -> 3 jours', () => {
    expect(JOURS(enregistrerReponse(undefined, 'a', false, T0))).toBe(1)
    expect(JOURS(enregistrerReponse(undefined, 'a', true, T0))).toBe(3)
  })
  it('une carte passée par structuredClone (IndexedDB) donne la même échéance', () => {
    const copie = structuredClone(creerFiche('a', T0))
    expect(JOURS(enregistrerReponse(copie, 'a', true, T0))).toBe(3)
  })
})

describe('tirerSessionRevision', () => {
  it('ordonne : dues (plus en retard d\'abord), neuves, puis les autres par échéance', () => {
    const qs = [q('futur2'), q('futur1'), q('neuve'), q('due1'), q('due2')]
    const f = fiches(fiche('futur2', 2 * JOUR), fiche('futur1', JOUR), fiche('due1', -MIN), fiche('due2', -JOUR))
    const ids = tirerSessionRevision(qs, f, T0, () => 0).map((x) => x.id)
    expect(ids).toEqual(['due2', 'due1', 'neuve', 'futur1', 'futur2'])
  })
  it('une échéance égale à maintenant compte comme due', () => {
    const ids = tirerSessionRevision([q('a'), q('b')], fiches(fiche('a', 0)), T0, () => 0).map((x) => x.id)
    expect(ids).toEqual(['a', 'b'])
  })
  it('mélange les neuves selon le hasard injecté', () => {
    const qs = [q('a'), q('b'), q('c')]
    const x = tirerSessionRevision(qs, new Map(), T0, () => 0).map((i) => i.id)
    expect(x).not.toEqual(['a', 'b', 'c'])
    expect([...x].sort()).toEqual(['a', 'b', 'c'])
  })
  it('donne 10 au plus, sans doublon, sans le type ordre', () => {
    const qs = [...Array.from({ length: 25 }, (_, i) => q(`q${i}`)), q('o', 'incendie', 'ordre')]
    const f = fiches(fiche('q0', -MIN), fiche('q1', JOUR))
    const s = tirerSessionRevision(qs, f, T0)
    expect(s).toHaveLength(10)
    expect(new Set(s.map((x) => x.id)).size).toBe(10)
    expect(s.map((x) => x.id)).not.toContain('o')
    expect(s[0].id).toBe('q0')
  })
  it('complète avec les autres si peu de questions neuves', () => {
    const qs = [q('a'), q('b'), q('c')]
    const s = tirerSessionRevision(qs, fiches(fiche('b', JOUR), fiche('c', 2 * JOUR)), T0)
    expect(s.map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('statistiques et dues', () => {
  const qs = [q('a', 'incendie'), q('b', 'incendie'), q('c', 'secours-a-personne'), q('d', 'secours-a-personne')]
  const f = fiches(fiche('a', -MIN, 4, 3), fiche('b', 3 * JOUR, 1, 0), fiche('c', 2 * MIN, 5, 5))
  const s = statistiques(qs, f, T0)

  it('calcule par thème questions, vues, réponses et taux', () => {
    expect(s.parTheme).toEqual([
      { theme: 'incendie', questions: 2, vues: 2, reponses: 5, bonnes: 3, taux: 60 },
      { theme: 'secours-a-personne', questions: 2, vues: 1, reponses: 5, bonnes: 5, taux: 100 },
    ])
  })
  it('taux null sans réponse', () => {
    expect(statistiques([q('z', 'x')], new Map(), T0).parTheme[0].taux).toBeNull()
  })
  it('compte les questions à revoir aujourd\'hui (jusqu\'à la fin de la journée)', () => {
    expect(s.aRevoir).toBe(2) // a (en retard) et c (dans 2 minutes) ; b est dans 3 jours
  })
  it('compte les dues avant une limite', () => {
    expect(compterDues(qs, f, new Date(T0.getTime() + 4 * JOUR))).toBe(3)
  })
})

describe('libelleTheme', () => {
  it('met en forme les thèmes', () => {
    expect(libelleTheme('secours-a-personne')).toBe('Secours à personne')
    expect(libelleTheme('risque-chimique')).toBe('Risque chimique')
  })
})
