import type { GhBranch, GhCommit, GhRepo, GhRun, GhUser } from './api'

/**
 * DATA DEMO — contoh buatan untuk memperlihatkan tampilan integrasi.
 * Bukan akun atau repository sungguhan; selalu ditampilkan dengan label DEMO.
 */
const now = Date.now()
const ago = (h: number) => new Date(now - h * 3600_000).toISOString()

export const DEMO_USER: GhUser = {
  login: 'contoh-demo',
  name: 'Akun Contoh (DEMO)',
  avatar_url: '',
  html_url: '#',
  bio: 'Data contoh untuk mode belajar — bukan akun sungguhan.',
  public_repos: 3,
  followers: 0,
  following: 0,
  created_at: ago(24 * 200),
}

const repo = (name: string, description: string, language: string, hours: number, pages: boolean): GhRepo => ({
  id: name.length,
  name,
  full_name: `contoh-demo/${name}`,
  html_url: '#',
  description,
  fork: false,
  archived: false,
  language,
  stargazers_count: 0,
  forks_count: 0,
  open_issues_count: 1,
  pushed_at: ago(hours),
  default_branch: 'main',
  homepage: pages ? `https://contoh-demo.github.io/${name}/` : null,
  has_pages: pages,
  owner: { login: 'contoh-demo' },
})

export const DEMO_REPOS: GhRepo[] = [
  repo('website-sekolah', 'Website profil sekolah (contoh DEMO)', 'HTML', 3, true),
  repo('wisata-takalar', 'Panduan wisata (contoh DEMO)', 'CSS', 30, false),
  repo('portfolio', 'Portofolio developer (contoh DEMO)', 'JavaScript', 120, true),
]

export const DEMO_BRANCHES: GhBranch[] = [
  { name: 'main', protected: true, commit: { sha: 'demo000000000000000000000000000000000001' } },
  { name: 'fitur-berita', protected: false, commit: { sha: 'demo000000000000000000000000000000000002' } },
]

const commit = (sha: string, message: string, hours: number): GhCommit => ({ sha, html_url: '#', commit: { message, author: { name: 'Akun Contoh', date: ago(hours) } }, author: null })

export const DEMO_COMMITS: GhCommit[] = [
  commit('demo000000000000000000000000000000000001', 'Add news section', 3),
  commit('demo000000000000000000000000000000000003', 'Fix mobile menu toggle', 26),
  commit('demo000000000000000000000000000000000004', 'Add homepage', 72),
]

export const DEMO_RUNS: GhRun[] = [
  { id: 2, name: 'CI', status: 'completed', conclusion: 'success', html_url: '#', head_branch: 'main', event: 'push', created_at: ago(3) },
  { id: 1, name: 'CI', status: 'completed', conclusion: 'failure', html_url: '#', head_branch: 'fitur-berita', event: 'pull_request', created_at: ago(26) },
]
