import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'AMO Units — Physics & RF Converter',
        short_name: 'AMO Units',
        description: 'High-precision, offline-capable unit converter & error propagation generator for AMO physics and RF laboratories.',
        theme_color: '#0B0F17',
        background_color: '#0B0F17',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf,eot}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // @ts-expect-error vitest config
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts']
  }
});
