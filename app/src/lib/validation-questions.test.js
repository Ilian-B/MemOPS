import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { validerQuestions } from './validation-questions.js'

// Question d'exemple (fictive) valide, copiée puis modifiée dans chaque test.
const exemple = () => ({
  id: 'exemple-0001',
  type: 'qcm',
  enonce: 'Question d\'exemple numéro un ?',
  propositions: ['Réponse A', 'Réponse B', 'Réponse C'],
  bonnes_reponses: [1],
  explication: 'Explication fictive de l\'exemple.',
  source: { document: 'Document fictif', version: '1', emplacement: 'page 1', citation: 'Citation fictive de test.' },
  theme: 'exemple',
  emplois: ['equipier'],
  portee: 'national',
  difficulte: 1,
  statut: 'a_verifier',
})

const ok = { par: 'AB', le: '2026-01-02', avis: 'conforme' }

// Valide une seule question modifiée et renvoie les erreurs.
const erreursDe = (modif) => validerQuestions([{ nom: 'test.json', contenu: [{ ...exemple(), ...modif }] }])

describe('banques de questions réelles', () => {
  it('tous les fichiers questions/*.json sont valides', () => {
    const dossier = new URL('../../../questions/', import.meta.url)
    const noms = readdirSync(dossier).filter((n) => n.endsWith('.json'))
    const fichiers = noms.map((nom) => {
      try {
        return { nom, contenu: JSON.parse(readFileSync(fileURLToPath(new URL(nom, dossier)), 'utf8')) }
      } catch (e) {
        throw new Error(`${nom} : JSON mal formé (${e.message})`)
      }
    })
    expect(validerQuestions(fichiers)).toEqual([])
  })
})

describe('validerQuestions', () => {
  it('accepte une question valide', () => {
    expect(erreursDe({})).toEqual([])
  })
  it('a. refuse un contenu qui n\'est pas un tableau', () => {
    expect(validerQuestions([{ nom: 'x.json', contenu: {} }])[0]).toContain('tableau')
  })
  it('b. refuse une question hors schéma', () => {
    expect(erreursDe({ difficulte: 5 })[0]).toContain('difficulte')
  })
  it('b. refuse un emploi hors de la liste officielle', () => {
    expect(erreursDe({ emplois: ['pompier'] }).join()).toContain('emplois')
    expect(erreursDe({ emplois: ['equipier', 'equipier'] }).join()).toContain('élément en double')
  })
  it('c. refuse un index inexistant ou en double', () => {
    expect(erreursDe({ bonnes_reponses: [7] }).join()).toContain('n\'existe pas')
    expect(erreursDe({ bonnes_reponses: [1, 1] }).join()).toContain('deux fois')
  })
  it('d. refuse un ordre incomplet', () => {
    expect(erreursDe({ type: 'ordre', bonnes_reponses: [0, 1] }).join()).toContain('ordre')
  })
  it('e. refuse un vrai-faux mal formé', () => {
    expect(erreursDe({ type: 'vrai-faux' }).join()).toContain('vrai-faux')
  })
  it('f. exige la vérification pour une question validée', () => {
    const e = erreursDe({ statut: 'validee' }).join()
    expect(e).toContain('verifie_le')
    expect(e).toContain('verification')
    expect(erreursDe({ statut: 'validee', verifie_le: '2026-01-01', verification: 'Vérifiée (fictif).', relectures: [ok] })).toEqual([])
  })
  it('h. exige une relecture « conforme » pour une question validée', () => {
    const base = { statut: 'validee', verifie_le: '2026-01-01', verification: 'Vérifiée (fictif).' }
    expect(erreursDe(base).join()).toContain('conforme')
    expect(erreursDe({ ...base, relectures: [{ ...ok, avis: 'corriger' }] }).join()).toContain('conforme')
  })
  it('i. exige une justification pour une question rejetée', () => {
    expect(erreursDe({ statut: 'rejetee' }).join()).toContain('rejeter')
    expect(erreursDe({ statut: 'rejetee', relectures: [{ ...ok, avis: 'rejeter' }] })).toEqual([])
    expect(erreursDe({ statut: 'rejetee', verification: 'Rejetée : citation introuvable.' })).toEqual([])
    expect(erreursDe({ statut: 'rejetee', verification: '  ' }).join()).toContain('rejeter')
  })
  it('refuse une relecture mal formée', () => {
    expect(erreursDe({ relectures: [{ ...ok, avis: 'peut-être' }] }).join()).toContain('relectures')
    expect(erreursDe({ relectures: [{ ...ok, le: '2026-13-45' }] }).join()).toContain('format « date »')
    expect(erreursDe({ relectures: [{ par: 'A', le: '2026-01-01', avis: 'conforme' }] }).join()).toContain('trop court')
    expect(erreursDe({ relectures: [{ ...ok, extra: 1 }] }).join()).toContain('champ inconnu')
  })
  it('g. refuse un id en double, même entre deux fichiers', () => {
    const erreurs = validerQuestions([
      { nom: 'a.json', contenu: [exemple()] },
      { nom: 'b.json', contenu: [exemple()] },
    ])
    expect(erreurs.join()).toContain('déjà utilisé')
  })
  it('signale les champs manquants sans planter', () => {
    const q = exemple()
    delete q.bonnes_reponses
    delete q.propositions
    const e = validerQuestions([{ nom: 't.json', contenu: [q] }]).join()
    expect(e).toContain('manquant')
  })
  it('refuse un élément null du tableau', () => {
    expect(validerQuestions([{ nom: 't.json', contenu: [null] }]).length).toBeGreaterThan(0)
  })
  it('accepte un vrai-faux valide et un ordre valide', () => {
    expect(erreursDe({ type: 'vrai-faux', propositions: ['Vrai', 'Faux'], bonnes_reponses: [0] })).toEqual([])
    expect(erreursDe({ type: 'ordre', bonnes_reponses: [2, 0, 1] })).toEqual([])
  })
  it('refuse un vrai-faux avec 2 bonnes réponses', () => {
    expect(erreursDe({ type: 'vrai-faux', propositions: ['Vrai', 'Faux'], bonnes_reponses: [0, 1] }).join()).toContain('vrai-faux')
  })
  it('refuse une vérification faite uniquement d\'espaces', () => {
    expect(erreursDe({ statut: 'validee', verifie_le: '2026-01-01', verification: '   ' }).join()).toContain('verification')
  })
  it('refuse un id en double dans le même fichier', () => {
    const e = validerQuestions([{ nom: 'a.json', contenu: [exemple(), exemple()] }]).join()
    expect(e).toContain('dans ce fichier')
  })
  it('refuse une question sans source, sans emploi ou sans thème', () => {
    for (const champ of ['source', 'emplois', 'theme']) {
      const q = exemple()
      delete q[champ]
      const e = validerQuestions([{ nom: 't.json', contenu: [q] }])
      expect(e.join(), champ).toContain(champ)
    }
  })
})
