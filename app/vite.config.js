import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Chemins relatifs : le nom du dépôt GitHub Pages n'est pas encore connu
  base: './',
  // Les tests ne sont cherchés que dans src/
  test: { include: ['src/**/*.test.js'] },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Révision pompiers',
        short_name: 'Révision',
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
