import { describe, it, expect, vi } from 'vitest'
import { creerStockageMemoire, creerStockageIndexedDB, ouvrirStockage } from './stockage.js'

const fiche = (id, bonnes = 1) => ({ id, carte: { due: new Date(0) }, reponses: 2, bonnes })

describe('stockage mémoire', () => {
  it('enregistre, relit et remplace une fiche', async () => {
    const s = creerStockageMemoire()
    expect(await s.lire('a')).toBeUndefined()
    await s.enregistrer(fiche('a', 1))
    await s.enregistrer(fiche('a', 2))
    await s.enregistrer(fiche('b'))
    expect((await s.lire('a')).bonnes).toBe(2)
    expect([...(await s.toutLire()).keys()].sort()).toEqual(['a', 'b'])
  })
})

describe('ouvrirStockage', () => {
  it('bascule sur la mémoire si IndexedDB est absent', async () => {
    const s = await ouvrirStockage(undefined)
    await s.enregistrer(fiche('a'))
    expect((await s.toutLire()).size).toBe(1)
  })
  it('bascule sur la mémoire si l\'ouverture échoue (navigation privée)', async () => {
    const casse = { open: () => { throw new Error('refusé') } }
    await expect(creerStockageIndexedDB(casse)).rejects.toThrow()
    const s = await ouvrirStockage(casse)
    await s.enregistrer(fiche('a'))
    expect((await s.lire('a')).id).toBe('a')
  })
  it('bascule sur la mémoire si l\'ouverture signale une erreur', async () => {
    const casse = {
      open() {
        const req = {}
        setTimeout(() => { req.error = new Error('non'); req.onerror() })
        return req
      },
    }
    const s = await ouvrirStockage(casse)
    await s.enregistrer(fiche('a'))
    expect((await s.toutLire()).size).toBe(1)
  })
  it('garde les données si IndexedDB tombe en cours de route', async () => {
    // Fausse base : l'ouverture réussit, mais toute transaction échoue
    const base = { transaction: () => { throw new Error('quota') }, createObjectStore() {}, close() {} }
    const fausse = {
      open() {
        const req = { result: base }
        setTimeout(() => { req.onupgradeneeded(); req.onsuccess() })
        return req
      },
    }
    const s = await ouvrirStockage(fausse)
    await s.enregistrer(fiche('a'))
    await s.enregistrer(fiche('b'))
    expect((await s.toutLire()).size).toBe(2)
  })
  it('bascule sur la mémoire si IndexedDB ne répond jamais (2,5 s)', async () => {
    vi.useFakeTimers()
    try {
      const muette = { open: () => ({}) }
      const promesse = ouvrirStockage(muette)
      await vi.advanceTimersByTimeAsync(2500)
      const s = await promesse
      await s.enregistrer(fiche('a'))
      expect((await s.toutLire()).size).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
