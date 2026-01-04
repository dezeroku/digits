import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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

export default defineConfig({
  plugins: [react(), versionJsonPlugin()],
  // Base path for GitHub Pages - uses repo name from environment or defaults to '/'
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __GIT_COMMIT__: JSON.stringify(gitVersion),
  },
})
