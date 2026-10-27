import { expect, test } from 'vitest'
import { AVERTISSEMENT } from './avertissement.js'

test("l'avertissement obligatoire est exact, au mot près", () => {
  expect(AVERTISSEMENT).toBe(
    "Outil d'entraînement personnel. Ne remplace ni la formation, ni les textes officiels en vigueur.",
  )
})
