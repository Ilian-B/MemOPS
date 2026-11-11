import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { filtrerQuestions, EMPLOIS, CONDUITES, pourEmploi, pourTheme } from './filtre-questions.js'
import { chargerQuestions } from './charger-questions.js'

const liste = [
  { id: 'a-0001', statut: 'validee' },
  { id: 'a-0002', statut: 'a_verifier' },
  { id: 'a-0003', statut: 'rejetee' },
]

describe('filtrerQuestions', () => {
  it('garde les validées et à vérifier, jamais les rejetées', () => {
    expect(filtrerQuestions(liste).map((q) => q.id)).toEqual(['a-0001', 'a-0002'])
  })
})

describe('EMPLOIS', () => {
  it('emplois puis conduites correspondent exactement, dans l\'ordre, à l\'enum du schéma', () => {
    const schema = JSON.parse(
      readFileSync(fileURLToPath(new URL('../../../schema/question.schema.json', import.meta.url)), 'utf8'),
    )
    expect([...EMPLOIS, ...CONDUITES].map((e) => e.id)).toEqual(schema.properties.emplois.items.enum)
  })
})

describe('pourEmploi', () => {
  const qs = [
    { id: 'a', emplois: ['equipier'] },
    { id: 'b', emplois: ['chef-agres-tout-engin'] },
    { id: 'c', emplois: ['chef-site', 'chef-equipe'] },
  ]
  const ids = (l) => l.map((q) => q.id)
  it('equipier : seulement les questions d\'équipier', () => {
    expect(ids(pourEmploi(qs, 'equipier'))).toEqual(['a'])
  })
  it('cumulatif : un chef d\'agrès reçoit aussi celles des emplois précédents', () => {
    expect(ids(pourEmploi(qs, 'chef-agres-tout-engin'))).toEqual(['a', 'b', 'c'])
  })
  it('emploi inconnu : comme équipier', () => {
    expect(ids(pourEmploi(qs, 'bidon'))).toEqual(['a'])
  })
})

describe('pourEmploi avec les conduites', () => {
  const qs = [
    { id: 'echelle', emplois: ['equipier'] },
    { id: 'mea', emplois: ['conducteur-mea'] },
    { id: 'pompes', emplois: ['conducteur-engins-pompes'] },
    { id: 'mixte', emplois: ['chef-site', 'conducteur-mea'] },
  ]
  const ids = (l) => l.map((q) => q.id)
  it('une question de conduite est masquée sans case cochée, même pour un emploi élevé', () => {
    expect(ids(pourEmploi(qs, 'chef-site'))).toEqual(['echelle', 'mixte'])
    expect(ids(pourEmploi(qs, 'equipier'))).toEqual(['echelle'])
  })
  it('visible avec la case cochée, quel que soit l\'emploi', () => {
    expect(ids(pourEmploi(qs, 'equipier', ['conducteur-mea']))).toEqual(['echelle', 'mea', 'mixte'])
    expect(ids(pourEmploi(qs, 'chef-site', ['conducteur-mea']))).toEqual(['echelle', 'mea', 'mixte'])
  })
  it('pas de cumul entre niveaux de conduite', () => {
    expect(ids(pourEmploi(qs, 'equipier', ['conducteur-engins-pompes']))).toEqual(['echelle', 'pompes'])
  })
  it('emploi inconnu ou questions d\'échelle : inchangé', () => {
    expect(ids(pourEmploi(qs, 'bidon', ['conducteur-mea']))).toEqual(['echelle', 'mea', 'mixte'])
  })
})

describe('pourTheme', () => {
  const qs = [{ id: 'a', theme: 'incendie' }, { id: 'b', theme: 'secours' }]
  it('filtre par thème', () => {
    expect(pourTheme(qs, 'secours').map((q) => q.id)).toEqual(['b'])
  })
  it('thème null ou absent : toutes', () => {
    expect(pourTheme(qs, null)).toHaveLength(2)
    expect(pourTheme(qs, undefined)).toHaveLength(2)
  })
})

describe('banque réelle, construite comme en production', () => {
  const dossier = fileURLToPath(new URL('../../../questions/', import.meta.url))
  const prod = chargerQuestions(dossier)
  it('ne contient aucune question rejetée', () => {
    expect(prod.filter((q) => q.statut === 'rejetee')).toEqual([])
  })
  it('contient toutes les questions non rejetées des fichiers', () => {
    // Comptage direct dans les fichiers JSON, indépendant du chargeur
    const brut = readdirSync(dossier)
      .filter((n) => n.endsWith('.json'))
      .flatMap((n) => JSON.parse(readFileSync(join(dossier, n), 'utf8')))
    expect(prod.length).toBe(brut.filter((q) => q.statut !== 'rejetee').length)
  })
})
