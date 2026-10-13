import { describe, expect, it } from 'vitest'
import { analyzeLog, firstErrorLine } from '../deploy/buildLog'
import { netlifyToml, pagesWorkflow } from '../deploy/configs'
import { checkDeploy } from '../deploy/deployCheck'
import { dnsRecords, recommend } from '../deploy/hosting'
import { isIgnoredPath, kindOf } from '../workspace/paths'

describe('deploy readiness', () => {
  const base = [
    { path: 'index.html', text: '<html><head><link rel="stylesheet" href="css/style.css"></head><body><img src="assets/Logo.png" alt="x"><img src="/assets/foto.jpg" alt="y"><script src="http://cdn.example.com/a.js"></script></body></html>', size: 200 },
    { path: 'css/style.css', text: '.hero{background:url("../assets/bg.png")}', size: 40 },
    { path: 'assets/logo.png', size: 2_000_000 },
    { path: 'assets/foto.jpg', size: 100 },
    { path: 'js/config.js', text: 'const key = "ghp_' + 'a'.repeat(36) + '"', size: 50 },
    { path: '.env', text: 'KEY=1', size: 5 },
  ]
  const res = Object.fromEntries(checkDeploy(base).map((i) => [i.id, i]))

  it('catches case mismatches that only break on Linux servers', () => {
    expect(res.case.status).toBe('fail')
    expect(res.case.details[0]).toContain('assets/logo.png')
  })
  it('flags absolute paths, mixed content, missing files, secrets and big images', () => {
    expect(res.absolute.details).toEqual(['index.html → /assets/foto.jpg'])
    expect(res.mixed.status).toBe('warn')
    expect(res.missing.details).toEqual(['css/style.css → ../assets/bg.png'])
    expect(res.secrets.details.join(' ')).toMatch(/token GitHub/)
    expect(res.secrets.details.join(' ')).toMatch(/\.env/)
    expect(res.big.details[0]).toContain('logo.png')
    expect(res.index.status).toBe('pass')
  })
  it('passes a clean project', () => {
    const clean = checkDeploy([{ path: 'index.html', text: '<link rel="stylesheet" href="style.css"><img src="a.png" alt="a">', size: 10 }, { path: 'style.css', text: '', size: 0 }, { path: 'a.png', size: 10 }])
    expect(clean.every((i) => i.status === 'pass')).toBe(true)
  })
})

describe('build log analyzer', () => {
  it('recognizes common failures and finds the first error line', () => {
    const log = 'Run npm ci\nnpm ERR! The `npm ci` command can only install packages when your package.json and package-lock.json are in sync.\nError: Process completed with exit code 1.'
    expect(analyzeLog(log).map((f) => f.id)).toContain('lockfile')
    expect(firstErrorLine(log)).toMatch(/npm ERR!/)
    expect(analyzeLog('error during build:\nCould not resolve "./components/Header" from "src/App.jsx"')[0].id).toBe('module-not-found')
    expect(analyzeLog('sh: 1: vite: not found').map((f) => f.id)).toContain('cmd-not-found')
    expect(analyzeLog('all good')).toEqual([])
  })
})

describe('configs, platform choice & DNS', () => {
  it('generates valid-looking workflow and netlify config', () => {
    expect(pagesWorkflow({ build: false })).toContain('path: .')
    expect(pagesWorkflow({ build: false })).not.toContain('npm ci')
    expect(pagesWorkflow({ build: true })).toContain('path: dist')
    expect(pagesWorkflow({ build: true })).toContain('pages: write')
    expect(netlifyToml({ build: true })).toContain('publish = "dist"')
  })
  it('never recommends Vercel Hobby or Pages for commercial sites', () => {
    expect(recommend({ kind: 'static', commercial: true, privateRepo: false, needPreviews: false }).platform).toBe('netlify')
    expect(recommend({ kind: 'static', commercial: false, privateRepo: false, needPreviews: false }).platform).toBe('github-pages')
    expect(recommend({ kind: 'vite', commercial: false, privateRepo: true, needPreviews: true }).platform).toBe('vercel')
    expect(recommend({ kind: 'server', commercial: false, privateRepo: false, needPreviews: false }).warnings.length).toBeGreaterThan(0)
  })
  it('builds DNS records', () => {
    const r = dnsRecords('github-pages', 'https://Sekolahku.sch.id/', 'agnes.github.io')
    expect(r.filter((x) => x.type === 'A')).toHaveLength(4)
    expect(r.find((x) => x.type === 'CNAME')?.value).toBe('agnes.github.io')
    expect(r[0].note).toContain('sekolahku.sch.id')
  })
  it('keeps useful dotfiles but ignores .git, .env and node_modules', () => {
    expect(isIgnoredPath('.github/workflows/ci.yml')).toBe(false)
    expect(isIgnoredPath('.gitignore')).toBe(false)
    expect(isIgnoredPath('.git/config')).toBe(true)
    expect(isIgnoredPath('.env')).toBe(true)
    expect(isIgnoredPath('a/node_modules/x.js')).toBe(true)
    expect(kindOf('.gitignore')).toBe('text')
    expect(kindOf('.github/workflows/ci.yml')).toBe('text')
  })
})
