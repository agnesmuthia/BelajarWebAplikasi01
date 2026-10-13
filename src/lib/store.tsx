import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { findLesson } from '../data/curriculum'
import { findTemplate } from '../data/projects'
import { createInitialState, loadState, sanitizeState, saveState, STORAGE_KEY } from './storage'
import type { Activity, AppState, Settings, UserProject } from './types'

interface Store {
  state: AppState
  /** false jika localStorage tidak bisa ditulis (mis. mode privat / penyimpanan penuh). */
  persistOk: boolean
  updateSettings: (patch: Partial<Settings>) => void
  recordQuizAttempt: (lessonId: string, passed: boolean) => void
  createProject: (templateId: string, name: string) => string
  updateProject: (id: string, patch: Partial<Pick<UserProject, 'name' | 'notes' | 'repoUrl' | 'deployUrl' | 'status' | 'favorite'>>, event?: string) => void
  toggleProjectItem: (id: string, list: 'tasksDone' | 'testsDone', itemId: string) => void
  deleteProject: (id: string) => void
  replaceState: (raw: unknown) => void
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)

const nowIso = () => new Date().toISOString()

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const withActivity = (s: AppState, a: Omit<Activity, 'at'>): AppState => ({
  ...s,
  activity: [...s.activity, { ...a, at: nowIso() }].slice(-500),
})

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: AppState }) {
  const [state, setState] = useState<AppState>(() => initial ?? loadState())
  const [persistOk, setPersistOk] = useState(true)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setPersistOk(saveState(state))
  }, [state])

  // Sinkronkan jika aplikasi dibuka di tab lain.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(loadState())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark')
  }, [state.settings.theme])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const recordQuizAttempt = useCallback((lessonId: string, passed: boolean) => {
    setState((s) => {
      const prev = s.lessons[lessonId] ?? { attempts: 0 }
      const alreadyPassed = Boolean(prev.passedAt)
      const next: AppState = {
        ...s,
        lessons: {
          ...s.lessons,
          [lessonId]: { attempts: prev.attempts + 1, ...(prev.passedAt || passed ? { passedAt: prev.passedAt ?? nowIso() } : {}) },
        },
      }
      if (passed && !alreadyPassed) {
        return withActivity(next, { kind: 'lesson', label: `Lulus checkpoint: ${findLesson(lessonId)?.title ?? lessonId}` })
      }
      return next
    })
  }, [])

  const createProject = useCallback((templateId: string, name: string) => {
    const id = newId()
    const t = nowIso()
    setState((s) =>
      withActivity(
        {
          ...s,
          projects: [
            {
              id,
              templateId,
              name: name.trim().slice(0, 80) || findTemplate(templateId)?.title || 'Proyek baru',
              createdAt: t,
              updatedAt: t,
              status: 'active',
              favorite: false,
              tasksDone: [],
              testsDone: [],
              notes: '',
              repoUrl: '',
              deployUrl: '',
              history: [{ at: t, message: 'Proyek dibuat dari template' }],
            },
            ...s.projects,
          ],
        },
        { kind: 'project', label: `Memulai proyek: ${name.trim() || findTemplate(templateId)?.title}` },
      ),
    )
    return id
  }, [])

  const updateProject: Store['updateProject'] = useCallback((id, patch, event) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              ...patch,
              updatedAt: nowIso(),
              history: event ? [...p.history, { at: nowIso(), message: event }].slice(-100) : p.history,
            }
          : p,
      ),
    }))
  }, [])

  const toggleProjectItem: Store['toggleProjectItem'] = useCallback((id, list, itemId) => {
    setState((s) => {
      const p = s.projects.find((x) => x.id === id)
      const tpl = p && findTemplate(p.templateId)
      if (!p || !tpl) return s
      const done = p[list].includes(itemId)
      const title = (list === 'tasksDone' ? tpl.tasks : tpl.testing).find((x) => x.id === itemId)?.title ?? itemId
      const updated: UserProject = {
        ...p,
        [list]: done ? p[list].filter((x) => x !== itemId) : [...p[list], itemId],
        updatedAt: nowIso(),
        history: [...p.history, { at: nowIso(), message: `${done ? 'Dibatalkan' : 'Selesai'}: ${title}` }].slice(-100),
      }
      const next = { ...s, projects: s.projects.map((x) => (x.id === id ? updated : x)) }
      return done ? next : withActivity(next, { kind: list === 'tasksDone' ? 'task' : 'test', label: `${p.name}: ${title}` })
    })
  }, [])

  const deleteProject = useCallback((id: string) => {
    setState((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) }))
  }, [])

  const replaceState = useCallback((raw: unknown) => setState(sanitizeState(raw)), [])
  const resetAll = useCallback(() => setState(createInitialState()), [])

  const value = useMemo(
    () => ({ state, persistOk, updateSettings, recordQuizAttempt, createProject, updateProject, toggleProjectItem, deleteProject, replaceState, resetAll }),
    [state, persistOk, updateSettings, recordQuizAttempt, createProject, updateProject, toggleProjectItem, deleteProject, replaceState, resetAll],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore harus dipakai di dalam <StoreProvider>')
  return ctx
}
