import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { chargerQuestions } from './src/lib/charger-questions.js'

// Dossier questions/ (à la racine du projet), calculé depuis ce fichier de config
const DOSSIER_QUESTIONS = fileURLToPath(new URL('../questions/', import.meta.url))

// Plugin : expose le module virtuel « virtual:questions ».
// Toutes les questions sauf « rejetee » (en production comme en développement).
function pluginQuestions() {
  return {
    name: 'memops-questions',
    resolveId(id) {
      if (id === 'virtual:questions') return '\0virtual:questions'
    },
    load(id) {
      if (id !== '\0virtual:questions') return
      return `export default ${JSON.stringify(chargerQuestions(DOSSIER_QUESTIONS))}`
    },
  }
}

export default defineConfig({
  // Chemins relatifs : le nom du dépôt GitHub Pages n'est pas encore connu
  base: './',
  // Les tests ne sont cherchés que dans src/
  test: { include: ['src/**/*.test.js'] },
  plugins: [
    svelte(),
    pluginQuestions(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MemOPS',
        short_name: 'MemOPS',
        lang: 'fr',
        display: 'standalone',
        start_url: './',
        scope: './',
        background_color: '#fff4e0',
        theme_color: '#d62828',
        icons: [
          { src: 'icons/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icone.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
