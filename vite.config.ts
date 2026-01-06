import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'

function getGitVersion(): string {
  try {
    // First try to get an exact tag match
    const tag = execSync('git describe --tags --exact-match 2>/dev/null')
      .toString()
      .trim()
    if (tag) return tag
  } catch {
    // No tag on this commit, fall through to commit hash
  }

  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

const gitVersion = getGitVersion()
const buildTime = new Date().toISOString()

// Plugin to generate version.json in the output directory
function versionJsonPlugin() {
  return {
    name: 'version-json',
    writeBundle(options: { dir?: string }) {
      const outDir = options.dir || 'dist'
      mkdirSync(outDir, { recursive: true })
      writeFileSync(
        `${outDir}/version.json`,
        JSON.stringify({
          version: gitVersion,
          buildTime: buildTime,
        })
      )
    },
  }
}

// Get base path for deployment
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  plugins: [
    react(),
    versionJsonPlugin(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Digits! Puzzle Game',
        short_name: 'Digits!',
        description: 'Match pairs of digits that are equal or sum to 10',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  base,
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __GIT_COMMIT__: JSON.stringify(gitVersion),
  },
})
