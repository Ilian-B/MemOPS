import { describe, it, expect } from 'vitest'
import { lireEmploi, ecrireEmploi, lireConduites, ecrireConduites, CLE_EMPLOI, CLE_CONDUITES } from './preferences.js'

// Faux localStorage minimal
const faux = (init = {}) => {
  const d = { ...init }
  return { getItem: (k) => d[k] ?? null, setItem: (k, v) => { d[k] = v } }
}
const casse = {
  getItem() { throw new Error('refusé') },
  setItem() { throw new Error('refusé') },
}

// Le stockage est fourni par une fonction, comme en production
const f = (s) => () => s

describe('préférences', () => {
  it('relit un emploi enregistré', () => {
    const s = faux()
    expect(ecrireEmploi('chef-groupe', f(s))).toBe(true)
    expect(lireEmploi(f(s))).toBe('chef-groupe')
  })
  it('rien d’enregistré : emploi inconnu', () => {
    expect(lireEmploi(f(faux()))).toBeNull()
  })
  it('valeur invalide : comme absente', () => {
    expect(lireEmploi(f(faux({ [CLE_EMPLOI]: 'pirate' })))).toBeNull()
  })
  it('stockage qui lève une erreur : pas de plantage', () => {
    expect(lireEmploi(f(casse))).toBeNull()
    expect(ecrireEmploi('equipier', f(casse))).toBe(false)
  })
  it('stockage absent : pas de plantage', () => {
    expect(lireEmploi(f(null))).toBeNull()
    expect(ecrireEmploi('equipier', f(null))).toBe(false)
  })
  it('accès au stockage lui-même qui lève (SecurityError)', () => {
    const interdit = () => { throw new Error('SecurityError') }
    expect(lireEmploi(interdit)).toBeNull()
    expect(ecrireEmploi('equipier', interdit)).toBe(false)
  })
})

describe('conduites cochées', () => {
  it('vide par défaut', () => {
    expect(lireConduites(f(faux()))).toEqual([])
  })
  it('relit ce qui a été enregistré', () => {
    const s = faux()
    expect(ecrireConduites(['conducteur-mea', 'conducteur-tout-terrain'], f(s))).toBe(true)
    expect(lireConduites(f(s))).toEqual(['conducteur-mea', 'conducteur-tout-terrain'])
  })
  it('ignore les valeurs inconnues et le JSON illisible', () => {
    expect(lireConduites(f(faux({ [CLE_CONDUITES]: '["pirate","conducteur-mea"]' })))).toEqual(['conducteur-mea'])
    expect(lireConduites(f(faux({ [CLE_CONDUITES]: 'pas du json' })))).toEqual([])
    expect(lireConduites(f(faux({ [CLE_CONDUITES]: '{"a":1}' })))).toEqual([])
  })
  it('stockage défaillant : pas de plantage', () => {
    expect(lireConduites(f(casse))).toEqual([])
    expect(ecrireConduites(['conducteur-mea'], f(casse))).toBe(false)
  })
})
