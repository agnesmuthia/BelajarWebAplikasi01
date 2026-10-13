/**
 * Generator file konfigurasi deployment. Versi action bisa diperbarui —
 * periksa github.com/marketplace bila muncul peringatan “deprecated” di log.
 */
export interface ConfigOptions {
  /** true untuk proyek npm/Vite (punya package.json), false untuk HTML statis. */
  build: boolean
  nodeVersion?: number
}

export function pagesWorkflow({ build, nodeVersion = 22 }: ConfigOptions): string {
  const buildSteps = build
    ? `      - uses: actions/setup-node@v4
        with:
          node-version: ${nodeVersion}
          cache: npm
      - run: npm ci
      - run: npm run build
`
    : ''
  return `# Deploy ke GitHub Pages dengan GitHub Actions.
# Aktifkan dulu: Settings → Pages → Build and deployment → Source: GitHub Actions.
name: Deploy ke GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:      # tombol "Run workflow" di tab Actions

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
${buildSteps}      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ${build ? 'dist' : '.'}
      - id: deployment
        uses: actions/deploy-pages@v4
`
}

export function netlifyToml({ build, nodeVersion = 22 }: ConfigOptions): string {
  return build
    ? `# Konfigurasi Netlify untuk proyek Vite
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "${nodeVersion}"
`
    : `# Konfigurasi Netlify untuk website statis (tanpa build)
[build]
  publish = "."
`
}

export const CONFIG_FILES = [
  { id: 'pages', path: '.github/workflows/deploy-pages.yml', label: 'GitHub Pages (Actions)', make: pagesWorkflow },
  { id: 'netlify', path: 'netlify.toml', label: 'Netlify', make: netlifyToml },
] as const
