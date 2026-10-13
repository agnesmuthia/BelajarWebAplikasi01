import type { AppState, LearningMode, ProjectStatus, Settings, UserProject } from './types'

/**
 * Semua progres disimpan di localStorage browser dengan satu kunci.
 * Data hanya ada di browser ini — gunakan Export di Pengaturan untuk backup.
 */
export const STORAGE_KEY = 'devstudio:v1'

const MAX_ACTIVITY = 500
const MAX_NOTES = 20_000

export const defaultSettings: Settings = {
  name: '',
  theme: 'dark',
  mode: 'guided',
  dailyGoal: 3,
  sidebarCollapsed: false,
  labAutoRun: true,
  githubUsername: '',
}

export function createInitialState(): AppState {
  return { version: 1, settings: { ...defaultSettings }, lessons: {}, challenges: {}, missions: {}, projects: [], activity: [] }
}

const MODES: LearningMode[] = ['guided', 'practice', 'build', 'debug', 'github', 'deploy']
const STATUSES: ProjectStatus[] = ['active', 'review', 'published']

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback = '', max = 500) => (typeof v === 'string' ? v.slice(0, max) : fallback)
const isIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 500) : [])

/**
 * Validasi & bersihkan data dari sumber tidak tepercaya (localStorage atau file backup).
 * Field yang rusak diganti nilai default, bukan membuat aplikasi crash.
 */
export function sanitizeState(raw: unknown): AppState {
  const base = createInitialState()
  if (!isObj(raw) || raw.version !== 1) return base

  const s = isObj(raw.settings) ? raw.settings : {}
  const settings: Settings = {
    name: str(s.name, '', 60).trim(),
    theme: s.theme === 'light' ? 'light' : 'dark',
    mode: MODES.includes(s.mode as LearningMode) ? (s.mode as LearningMode) : 'guided',
    dailyGoal:
      typeof s.dailyGoal === 'number' && Number.isFinite(s.dailyGoal)
        ? Math.min(20, Math.max(1, Math.round(s.dailyGoal)))
        : defaultSettings.dailyGoal,
    sidebarCollapsed: s.sidebarCollapsed === true,
    labAutoRun: s.labAutoRun !== false,
    githubUsername: isGitHubUsername(str(s.githubUsername, '', 39)) ? str(s.githubUsername, '', 39) : '',
  }

  const lessons: AppState['lessons'] = {}
  if (isObj(raw.lessons)) {
    for (const [id, v] of Object.entries(raw.lessons)) {
      if (!isObj(v)) continue
      lessons[id.slice(0, 100)] = {
        attempts: typeof v.attempts === 'number' && v.attempts >= 0 ? Math.floor(v.attempts) : 0,
        ...(isIso(v.passedAt) ? { passedAt: v.passedAt } : {}),
      }
    }
  }

  const challenges: AppState['challenges'] = {}
  if (isObj(raw.challenges)) {
    for (const [id, v] of Object.entries(raw.challenges).slice(0, 500)) {
      if (!isObj(v)) continue
      const n = (x: unknown) => (typeof x === 'number' && x >= 0 ? Math.floor(x) : 0)
      challenges[id.slice(0, 100)] = {
        runs: n(v.runs),
        hintsUsed: n(v.hintsUsed),
        solutionViewed: v.solutionViewed === true,
        ...(isIso(v.passedAt) ? { passedAt: v.passedAt } : {}),
      }
    }
  }

  const missions: AppState['missions'] = {}
  if (isObj(raw.missions)) {
    for (const [id, v] of Object.entries(raw.missions).slice(0, 100)) if (isObj(v) && isIso(v.completedAt)) missions[id.slice(0, 64)] = { completedAt: v.completedAt }
  }

  const projects: UserProject[] = Array.isArray(raw.projects)
    ? raw.projects.filter(isObj).slice(0, 200).flatMap((p): UserProject[] => {
        const id = str(p.id, '', 64)
        const templateId = str(p.templateId, '', 64)
        if (!id || !templateId) return []
        const now = new Date().toISOString()
        return [
          {
            id,
            templateId,
            name: str(p.name, 'Proyek tanpa nama', 80) || 'Proyek tanpa nama',
            createdAt: isIso(p.createdAt) ? p.createdAt : now,
            updatedAt: isIso(p.updatedAt) ? p.updatedAt : now,
            status: STATUSES.includes(p.status as ProjectStatus) ? (p.status as ProjectStatus) : 'active',
            favorite: p.favorite === true,
            tasksDone: strArr(p.tasksDone),
            testsDone: strArr(p.testsDone),
            notes: str(p.notes, '', MAX_NOTES),
            repoUrl: str(p.repoUrl, '', 300),
            deployUrl: str(p.deployUrl, '', 300),
            history: Array.isArray(p.history)
              ? p.history
                  .filter(isObj)
                  .filter((e) => isIso(e.at))
                  .slice(-100)
                  .map((e) => ({ at: e.at as string, message: str(e.message, '', 200) }))
              : [],
          },
        ]
      })
    : []

  const activity: AppState['activity'] = Array.isArray(raw.activity)
    ? raw.activity
        .filter(isObj)
        .filter((a) => isIso(a.at) && ['lesson', 'task', 'test', 'project', 'challenge', 'mission'].includes(a.kind as string))
        .slice(-MAX_ACTIVITY)
        .map((a) => ({ at: a.at as string, kind: a.kind as AppState['activity'][number]['kind'], label: str(a.label, '', 160) }))
    : []

  return { version: 1, settings, lessons, challenges, missions, projects, activity }
}

export function loadState(storage: Storage | undefined = globalThis.localStorage): AppState {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    return raw ? sanitizeState(JSON.parse(raw)) : createInitialState()
  } catch {
    // JSON rusak atau localStorage diblokir (mode privat) → mulai dari awal.
    return createInitialState()
  }
}

export function saveState(state: AppState, storage: Storage | undefined = globalThis.localStorage): boolean {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ ...state, activity: state.activity.slice(-MAX_ACTIVITY) }))
    return true
  } catch {
    return false
  }
}

/** Hanya izinkan URL http(s) — mencegah `javascript:` atau skema berbahaya lain masuk ke href. */
export function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export function isGitHubRepoUrl(value: string): boolean {
  const url = safeHttpUrl(value)
  if (!url) return false
  const u = new URL(url)
  return u.protocol === 'https:' && u.hostname === 'github.com' && /^\/[\w.-]+\/[\w.-]+\/?$/.test(u.pathname)
}

/** Username GitHub: huruf/angka/tanda hubung, maks. 39 karakter, tidak diawali/diakhiri '-'. */
export function isGitHubUsername(v: string): boolean {
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(v)
}
