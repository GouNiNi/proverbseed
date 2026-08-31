import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

const appVersion = fs.existsSync('./.version')
  ? fs.readFileSync('./.version', 'utf-8').trim()
  : (JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version || '0.0.0');

function versionPlugin(version) {
  return {
    name: 'generate-version-json',
    configureServer(server) {
      server.middlewares.use('/version.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ version }));
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version }, null, 2)
      });
    }
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  server: {
    host: true,
    port: 5175,
    strictPort: true,
  },
  plugins: [
    react(),
    versionPlugin(appVersion),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        globIgnores: ['**/version.json'],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ProverbSeed',
        short_name: 'ProverbSeed',
        description: 'Méditation biblique et sagesse',
        version: appVersion,
        theme_color: '#A3B18A',
        background_color: '#FAF9F6',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
