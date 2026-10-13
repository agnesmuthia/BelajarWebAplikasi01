/**
 * Klien GitHub REST API — HANYA BACA data publik, tanpa login dan tanpa token.
 * GitHub mengizinkan permintaan tanpa autentikasi dari browser (CORS) dengan batas
 * ±60 permintaan per jam per alamat IP. Respons disimpan sementara (cache) agar hemat.
 */
const API = 'https://api.github.com'
const TTL = 5 * 60 * 1000
const CACHE_KEY = 'devstudio:gh-cache:v1'

export class GitHubError extends Error {
  constructor(message: string, public status: number, public resetAt?: number) {
    super(message)
  }
}

export interface RateInfo {
  remaining: number | null
  limit: number | null
  reset: number | null
}

let rate: RateInfo = { remaining: null, limit: null, reset: null }
const listeners = new Set<(r: RateInfo) => void>()
export const getRate = () => rate
export function onRate(fn: (r: RateInfo) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

type Fetcher = typeof fetch
let fetcher: Fetcher = (...a) => fetch(...a)
/** Untuk test. */
export function _setFetcher(f: Fetcher) {
  fetcher = f
  memory.clear()
}

const memory = new Map<string, { at: number; data: unknown }>()

function readCache(path: string) {
  const m = memory.get(path)
  if (m && Date.now() - m.at < TTL) return m.data
  try {
    const all = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, { at: number; data: unknown }>
    const e = all[path]
    if (e && Date.now() - e.at < TTL) {
      memory.set(path, e)
      return e.data
    }
  } catch {
    /* abaikan */
  }
  return undefined
}

function writeCache(path: string, data: unknown) {
  const entry = { at: Date.now(), data }
  memory.set(path, entry)
  try {
    const all = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, unknown>
    all[path] = entry
    const keys = Object.keys(all)
    if (keys.length > 60) delete all[keys[0]]
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(all))
  } catch {
    /* penyimpanan sesi penuh — cache memori tetap jalan */
  }
}

async function get<T>(path: string, fresh = false): Promise<T> {
  if (!fresh) {
    const c = readCache(path)
    if (c !== undefined) return c as T
  }
  let res: Response
  try {
    // Hanya header Accept (CORS-safelisted) agar tidak perlu preflight.
    res = await fetcher(API + path, { headers: { Accept: 'application/vnd.github+json' } })
  } catch {
    throw new GitHubError('Tidak dapat terhubung ke GitHub. Periksa koneksi internet.', 0)
  }
  const num = (h: string) => {
    const v = res.headers.get(h)
    return v === null ? null : Number(v)
  }
  rate = { remaining: num('x-ratelimit-remaining'), limit: num('x-ratelimit-limit'), reset: num('x-ratelimit-reset') }
  listeners.forEach((fn) => fn(rate))
  if (res.status === 404) throw new GitHubError('Tidak ditemukan. Periksa ejaan, atau repository mungkin privat (hanya data publik yang bisa dibaca tanpa login).', 404)
  if ((res.status === 403 || res.status === 429) && rate.remaining === 0) {
    const at = rate.reset ? rate.reset * 1000 : undefined
    throw new GitHubError(`Batas permintaan GitHub tanpa login tercapai (±60 per jam). Coba lagi${at ? ` setelah ${new Date(at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ' nanti'}.`, res.status, at)
  }
  if (!res.ok) throw new GitHubError(`GitHub mengembalikan status ${res.status}.`, res.status)
  const data = (await res.json()) as T
  writeCache(path, data)
  return data
}

const seg = (s: string) => {
  if (!/^[\w.-]{1,100}$/.test(s)) throw new GitHubError('Nama tidak valid.', 400)
  return encodeURIComponent(s)
}

export interface GhUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
}

export interface GhRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  fork: boolean
  archived: boolean
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  pushed_at: string
  default_branch: string
  homepage: string | null
  has_pages: boolean
  owner: { login: string }
}

export interface GhBranch {
  name: string
  protected: boolean
  commit: { sha: string }
}

export interface GhCommit {
  sha: string
  html_url: string
  commit: { message: string; author: { name: string; date: string } | null }
  author: { login: string; avatar_url: string } | null
}

export interface GhRun {
  id: number
  name: string | null
  status: string | null
  conclusion: string | null
  html_url: string
  head_branch: string | null
  event: string
  created_at: string
}

export interface GhEvent {
  id: string
  type: string
  repo: { name: string }
  created_at: string
  payload: { commits?: { message: string }[]; ref?: string | null; ref_type?: string; action?: string; size?: number }
}

export const getUser = async (u: string, fresh = false) => get<GhUser>(`/users/${seg(u)}`, fresh)
export const listRepos = async (u: string, fresh = false) => get<GhRepo[]>(`/users/${seg(u)}/repos?sort=pushed&per_page=50`, fresh)
export const getRepo = async (o: string, r: string, fresh = false) => get<GhRepo>(`/repos/${seg(o)}/${seg(r)}`, fresh)
export const listBranches = async (o: string, r: string) => get<GhBranch[]>(`/repos/${seg(o)}/${seg(r)}/branches?per_page=30`)
export const listCommits = async (o: string, r: string, branch: string) => get<GhCommit[]>(`/repos/${seg(o)}/${seg(r)}/commits?per_page=10&sha=${encodeURIComponent(branch)}`)
export const listRuns = async (o: string, r: string) => get<{ total_count: number; workflow_runs: GhRun[] }>(`/repos/${seg(o)}/${seg(r)}/actions/runs?per_page=5`)
export const listEvents = async (u: string) => get<GhEvent[]>(`/users/${seg(u)}/events/public?per_page=10`)

/** "https://github.com/owner/repo(.git)" → { owner, repo }. */
export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url.trim())
  return m ? { owner: m[1], repo: m[2] } : null
}

/** Ringkasan aktivitas publik dalam bahasa Indonesia. */
export function describeEvent(e: GhEvent): string {
  switch (e.type) {
    case 'PushEvent':
      return `Push ${e.payload.size ?? e.payload.commits?.length ?? ''} commit ke ${e.repo.name}`.replace('  ', ' ')
    case 'CreateEvent':
      return `Membuat ${e.payload.ref_type === 'repository' ? 'repository' : `${e.payload.ref_type} ${e.payload.ref ?? ''}`} di ${e.repo.name}`
    case 'PullRequestEvent':
      return `Pull request ${e.payload.action ?? ''} di ${e.repo.name}`
    case 'IssuesEvent':
      return `Issue ${e.payload.action ?? ''} di ${e.repo.name}`
    case 'WatchEvent':
      return `Memberi bintang ${e.repo.name}`
    case 'ForkEvent':
      return `Fork ${e.repo.name}`
    default:
      return `${e.type.replace(/Event$/, '')} di ${e.repo.name}`
  }
}
