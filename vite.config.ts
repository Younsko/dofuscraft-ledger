import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'DofusCraft Ledger',
        short_name: 'DofusCraft',
        description: 'Indexeur HDV, Stock Réel, PRU & Planificateur Multi-Crafts Dofus 3',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'https://api.dofusdu.de/dofus3/v1/img/item/9047-64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'https://api.dofusdu.de/dofus3/v1/img/item/9047-64.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://api.dofusdu.de/dofus3/v1/img/item/9047-64.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  }
})
