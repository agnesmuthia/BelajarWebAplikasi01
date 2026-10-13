import type { Line, SimState } from './sim'

/** Sesi simulator per misi, disimpan di localStorage agar bisa dilanjutkan. */
export const SIM_KEY = 'devstudio:gitsim:v1'

export interface SimSession {
  state: SimState
  reached: number
  transcript: Line[]
}

const MAX_TRANSCRIPT = 400

function valid(v: unknown): v is SimSession {
  if (typeof v !== 'object' || v === null) return false
  const s = (v as SimSession).state
  return (
    typeof s === 'object' && s !== null && typeof s.cwd === 'string' && typeof s.files === 'object' && Array.isArray(s.dirs) &&
    typeof s.repos === 'object' && typeof s.remotes === 'object' && Array.isArray(s.history) && typeof (v as SimSession).reached === 'number' &&
    Array.isArray((v as SimSession).transcript)
  )
}

function loadAll(): Record<string, SimSession> {
  try {
    const raw = JSON.parse(localStorage.getItem(SIM_KEY) ?? '{}')
    return typeof raw === 'object' && raw ? raw : {}
  } catch {
    return {}
  }
}

export function loadSession(id: string): SimSession | null {
  const v = loadAll()[id]
  return valid(v) ? v : null
}

export function saveSession(id: string, session: SimSession) {
  try {
    const all = loadAll()
    all[id] = { ...session, transcript: session.transcript.slice(-MAX_TRANSCRIPT) }
    localStorage.setItem(SIM_KEY, JSON.stringify(all))
  } catch {
    /* penyimpanan penuh — sesi tetap berjalan di memori */
  }
}

export function clearSession(id: string) {
  try {
    const all = loadAll()
    delete all[id]
    localStorage.setItem(SIM_KEY, JSON.stringify(all))
  } catch {
    /* abaikan */
  }
}

export function clearAllSessions() {
  try {
    localStorage.removeItem(SIM_KEY)
  } catch {
    /* abaikan */
  }
}
