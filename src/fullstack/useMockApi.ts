import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { handleRequest, initDb, parseConfig, reconcileDb, STATUS_TEXT, type ApiRequest, type MockDb } from './mockApi'

export interface ApiLogEntry {
  id: number
  at: string
  method: string
  url: string
  status: number
  ms: number
  note: string
  reqBody: string | null
  resBody: string
  auth: boolean
}

export type SimMode = 'normal' | 'slow' | 'error' | 'offline'

export const SIM_INFO: Record<SimMode, string> = {
  normal: 'Normal (± 150 ms)',
  slow: 'Jaringan lambat (2 detik)',
  error: 'Server error (500)',
  offline: 'Offline (fetch gagal)',
}

const KEY = (scope: string) => `devstudio-mockdb:${scope}`
const MAX_BYTES = 400_000

function loadDb(scope: string): MockDb | null {
  try {
    const raw = localStorage.getItem(KEY(scope))
    if (!raw) return null
    const d = JSON.parse(raw) as MockDb
    return d && typeof d === 'object' && d.rows && Array.isArray(d.users) ? d : null
  } catch {
    return null
  }
}

function saveDb(scope: string, db: MockDb): boolean {
  try {
    const s = JSON.stringify(db)
    if (s.length > MAX_BYTES) return false
    localStorage.setItem(KEY(scope), s)
    return true
  } catch {
    return false
  }
}

export function clearMockDb(scope: string) {
  try {
    localStorage.removeItem(KEY(scope))
  } catch {
    /* abaikan */
  }
}

/**
 * Menghubungkan iframe preview ke Mock API. Request dari iframe diterima hanya jika berasal
 * dari iframe ini DAN membawa token run saat ini; respons dikirim balik ke iframe yang sama.
 */
export function useMockApi(opts: { scope: string; configText: string | null; iframe?: RefObject<HTMLIFrameElement | null>; token?: RefObject<string>; persist?: boolean }) {
  const { scope, configText, iframe, token, persist = true } = opts
  const parsed = useMemo(() => (configText === null ? { config: null, errors: [] as string[] } : parseConfig(configText)), [configText])
  const config = parsed.config
  const [db, setDb] = useState<MockDb | null>(null)
  const [log, setLog] = useState<ApiLogEntry[]>([])
  const [sim, setSim] = useState<SimMode>('normal')
  const [storageFull, setStorageFull] = useState(false)
  const dbRef = useRef<MockDb | null>(null)
  const simRef = useRef(sim)
  simRef.current = sim
  const queue = useRef(Promise.resolve())
  const logId = useRef(0)

  useEffect(() => {
    if (!config) {
      dbRef.current = null
      setDb(null)
      return
    }
    const stored = persist ? loadDb(scope) : null
    const next = stored ? reconcileDb(stored, config) : initDb(config)
    dbRef.current = next
    setDb(next)
  }, [config, scope, persist])

  const commit = useCallback(
    (next: MockDb) => {
      dbRef.current = next
      setDb(next)
      if (persist) setStorageFull(!saveDb(scope, next))
    },
    [persist, scope],
  )

  /** Proses satu request (dari iframe atau dari playground), berurutan agar data konsisten. */
  const send = useCallback(
    (req: ApiRequest): Promise<{ status: number; body: string; offline: boolean }> => {
      const job = queue.current.then(async () => {
        const started = performance.now()
        const mode = simRef.current
        await new Promise((r) => setTimeout(r, mode === 'slow' ? 2000 : 120 + Math.random() * 60))
        let status = 0
        let body = ''
        let note = ''
        const offline = mode === 'offline'
        if (!config || !dbRef.current) {
          status = 503
          body = JSON.stringify({ error: 'Mock API belum aktif: buat api/config.json yang valid.' })
          note = 'Tidak ada konfigurasi Mock API.'
        } else if (offline) {
          note = 'Simulasi offline: request tidak sampai ke server, fetch() menolak dengan TypeError.'
        } else if (mode === 'error') {
          status = 500
          body = JSON.stringify({ error: 'Simulasi: server sedang bermasalah.' })
          note = 'Simulasi server error. Data tidak berubah. Pastikan aplikasimu menampilkan pesan ramah dan tombol coba lagi.'
        } else {
          const r = await handleRequest(config, dbRef.current, req)
          commit(r.db)
          status = r.res.status
          body = JSON.stringify(r.res.body)
          note = r.note
        }
        const entry: ApiLogEntry = { id: ++logId.current, at: new Date().toISOString(), method: req.method.toUpperCase(), url: req.url, status, ms: Math.round(performance.now() - started), note, reqBody: req.body, resBody: body, auth: /^Bearer\s/i.test(req.headers['authorization'] ?? '') }
        setLog((l) => [entry, ...l].slice(0, 200))
        return { status, body, offline }
      })
      queue.current = job.then(() => undefined, () => undefined)
      return job
    },
    [config, commit],
  )

  useEffect(() => {
    if (!iframe || !token) return
    const onMessage = (e: MessageEvent) => {
      const d = e.data as Record<string, unknown> | null
      if (!d || d.source !== 'devstudio-lab' || d.type !== 'api' || d.token !== token.current) return
      const win = iframe.current?.contentWindow
      if (!win || e.source !== win) return
      const headers: Record<string, string> = {}
      if (d.headers && typeof d.headers === 'object') for (const [k, v] of Object.entries(d.headers as Record<string, unknown>)) headers[k.toLowerCase()] = String(v)
      const req: ApiRequest = { method: String(d.method ?? 'GET'), url: String(d.url ?? ''), headers, body: typeof d.body === 'string' ? d.body.slice(0, 200_000) : null }
      const runToken = token.current
      void send(req).then((r) => {
        if (token.current !== runToken) return
        win.postMessage({ source: 'devstudio-host', token: runToken, type: 'api-response', id: d.id, status: r.status, statusText: STATUS_TEXT[r.status] ?? '', body: r.body, offline: r.offline }, '*')
      })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [iframe, token, send])

  const reset = useCallback(() => {
    if (!config) return
    clearMockDb(scope)
    commit(initDb(config))
    setLog([])
  }, [config, scope, commit])

  return { config, errors: parsed.errors, db, log, clearLog: () => setLog([]), sim, setSim, reset, send, storageFull, enabled: configText !== null }
}

export type MockApiHandle = ReturnType<typeof useMockApi>
