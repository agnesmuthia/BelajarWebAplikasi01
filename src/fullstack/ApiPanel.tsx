import { Database, Eraser, ListTree, RotateCcw, Send, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Badge, cx } from '../components/ui'
import { ACCESS_INFO, CONFIG_PATH, STATUS_TEXT } from './mockApi'
import { SIM_INFO, type MockApiHandle, type SimMode } from './useMockApi'

type Tab = 'log' | 'data' | 'try'

export const statusTone = (s: number) => (s === 0 ? 'rose' : s < 300 ? 'emerald' : s < 500 ? 'amber' : 'rose') as 'emerald' | 'amber' | 'rose'

function pretty(s: string | null) {
  if (!s) return ''
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}

/** Panel inspektur Mock API: log request, isi database, dan pengirim request manual. */
export function ApiPanel({ api, playground = true }: { api: MockApiHandle; playground?: boolean }) {
  const [tab, setTab] = useState<Tab>('log')
  const [open, setOpen] = useState<number | null>(null)

  if (!api.enabled) {
    return (
      <div className="space-y-2 p-4 text-sm">
        <p className="font-medium">Mock API belum aktif untuk proyek ini.</p>
        <p className="muted">Buat file <code className="font-mono">{CONFIG_PATH}</code> berisi daftar resource, mis.:</p>
        <pre className="code-surface overflow-auto rounded-lg p-3 font-mono text-xs">{`{\n  "resources": {\n    "todos": {\n      "access": "owner",\n      "fields": { "title": "string!", "done": "boolean" }\n    }\n  }\n}`}</pre>
        <p className="muted text-xs">Setelah itu, <code className="font-mono">fetch('/api/todos')</code> di preview dilayani DevStudio. Lihat pelajaran API & Backend di Learning Path.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col text-sm">
      {api.errors.length > 0 && (
        <ul className="space-y-1 border-b border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          {api.errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 p-2 dark:border-white/10">
        {([
          ['log', `Request (${api.log.length})`, ListTree],
          ['data', 'Data', Database],
          ...(playground ? [['try', 'Kirim request', Send]] : []),
        ] as [Tab, string, typeof Send][]).map(([id, label, Icon]) => (
          <button key={id} className={cx('flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium', tab === id ? 'bg-indigo-500/10 text-indigo-700 dark:text-cyan-300' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white')} onClick={() => setTab(id)} aria-pressed={tab === id}>
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
        <span className="flex-1" />
        <label className="muted flex items-center gap-1 text-xs">
          <span className="sr-only">Simulasi jaringan</span>
          <select className="input w-auto py-1 text-xs" value={api.sim} onChange={(e) => api.setSim(e.target.value as SimMode)} title="Simulasi kondisi jaringan">
            {(Object.keys(SIM_INFO) as SimMode[]).map((m) => <option key={m} value={m}>{SIM_INFO[m]}</option>)}
          </select>
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'log' && (
          api.log.length === 0 ? (
            <p className="muted p-4">Belum ada request. Jalankan preview yang memanggil <code className="font-mono">fetch('/api/…')</code>{playground && ', atau pakai tab “Kirim request”'}.</p>
          ) : (
            <>
              <div className="flex justify-end p-1.5"><button className="btn-ghost px-2 py-1 text-xs" onClick={api.clearLog}><Eraser className="size-3.5" /> Bersihkan log</button></div>
              <ul>
                {api.log.map((e) => (
                  <li key={e.id} className="border-b border-slate-200 dark:border-white/5">
                    <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs hover:bg-slate-50 dark:hover:bg-white/5" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}>
                      <Badge tone={statusTone(e.status)}>{e.status || 'gagal'}</Badge>
                      <span className="w-14 shrink-0 font-semibold">{e.method}</span>
                      <span className="min-w-0 flex-1 truncate">{e.url}</span>
                      {e.auth && <ShieldCheck className="size-3.5 shrink-0 text-emerald-500" aria-label="Dengan token" />}
                      <span className="muted shrink-0">{e.ms} ms</span>
                    </button>
                    {open === e.id && (
                      <div className="space-y-2 bg-slate-50 px-3 py-2 text-xs dark:bg-black/20">
                        <p><b>Server:</b> {e.note}</p>
                        <p className="muted">Status {e.status} {STATUS_TEXT[e.status] ?? ''} · {e.auth ? 'dengan header Authorization' : 'tanpa token'}</p>
                        {e.reqBody && <><p className="font-semibold">Body request</p><pre className="code-surface max-h-40 overflow-auto rounded p-2 font-mono">{pretty(e.reqBody)}</pre></>}
                        {e.resBody && <><p className="font-semibold">Body respons</p><pre className="code-surface max-h-48 overflow-auto rounded p-2 font-mono">{pretty(e.resBody)}</pre></>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )
        )}

        {tab === 'data' && <DataView api={api} />}
        {tab === 'try' && <TryRequest api={api} />}
      </div>
      {api.storageFull && <p className="border-t border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">Data Mock API terlalu besar untuk disimpan permanen (batas ±400 KB). Perubahan hanya bertahan sampai halaman ditutup.</p>}
    </div>
  )
}

function DataView({ api }: { api: MockApiHandle }) {
  const { db, config } = api
  if (!db || !config) return <p className="muted p-4">Konfigurasi belum valid.</p>
  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="muted text-xs">Data tersimpan di browser ini saja (bukan database online). Reset mengembalikan data awal (seed) dan menghapus akun latihan.</p>
        <button className="btn-secondary shrink-0 px-2 py-1 text-xs" onClick={() => { if (confirm('Reset data Mock API ke kondisi awal? Semua akun latihan dan perubahan data akan dihapus.')) api.reset() }}><RotateCcw className="size-3.5" /> Reset data</button>
      </div>
      {Object.entries(config.resources).map(([name, r]) => {
        const rows = db.rows[name] ?? []
        const cols = ['id', ...Object.keys(r.fields), 'owner_id']
        return (
          <section key={name}>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-xs font-semibold">/api/{name}</h3>
              <Badge tone="violet">{ACCESS_INFO[r.access].label}</Badge>
              <span className="muted text-xs">{rows.length} baris</span>
            </div>
            <p className="muted mb-1.5 text-xs">{ACCESS_INFO[r.access].rule}</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
              <table className="w-full font-mono text-[11px]">
                <thead className="bg-slate-100 dark:bg-white/5"><tr>{cols.map((c) => <th key={c} className="px-2 py-1 text-left font-semibold">{c}{r.fields[c]?.required ? '*' : ''}</th>)}</tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={cols.length} className="muted px-2 py-2 font-sans">Kosong.</td></tr>}
                  {rows.slice(0, 50).map((row) => <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">{cols.map((c) => <td key={c} className="max-w-48 truncate px-2 py-1">{row[c] === undefined ? '' : JSON.stringify(row[c])}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
      <section>
        <h3 className="mb-1 font-mono text-xs font-semibold">users ({db.users.length}) · sesi aktif: {db.sessions.length}</h3>
        {db.users.length === 0 ? <p className="muted text-xs">Belum ada akun latihan. Daftar lewat POST /api/auth/register.</p> : (
          <ul className="space-y-1 font-mono text-[11px]">
            {db.users.map((u) => <li key={u.id} className="[overflow-wrap:anywhere]">{u.id} · {u.email} · {u.role} · hash: {u.hash.slice(0, 16)}… <span className="font-sans text-slate-500">(password asli tidak pernah disimpan)</span></li>)}
          </ul>
        )}
      </section>
    </div>
  )
}

const SAMPLE_BODY = '{\n  "email": "kamu@contoh.id",\n  "password": "rahasia123"\n}'

function TryRequest({ api }: { api: MockApiHandle }) {
  const first = api.config ? Object.keys(api.config.resources)[0] : 'todos'
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState(`/api/${first ?? ''}`)
  const [tok, setTok] = useState('')
  const [body, setBody] = useState(SAMPLE_BODY)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ status: number; body: string; offline: boolean } | null>(null)

  const go = async () => {
    setBusy(true)
    const r = await api.send({ method, url, headers: tok.trim() ? { authorization: `Bearer ${tok.trim()}` } : {}, body: method === 'GET' || method === 'DELETE' ? null : body })
    setResult(r)
    setBusy(false)
    try {
      const t = (JSON.parse(r.body) as { token?: unknown }).token
      if (typeof t === 'string') setTok(t)
    } catch {
      /* bukan JSON */
    }
  }

  return (
    <div className="space-y-2 p-3">
      <p className="muted text-xs">Seperti Postman/Thunder Client: kirim request langsung ke Mock API untuk memahami respons server sebelum menulis kode frontend.</p>
      <div className="flex gap-2">
        <select className="input w-auto py-1 font-mono text-xs" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Metode HTTP">
          {['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
        </select>
        <input className="input py-1 font-mono text-xs" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="URL" />
        <button className="btn-primary shrink-0 px-3 py-1 text-xs" onClick={() => void go()} disabled={busy}><Send className="size-3.5" /> Kirim</button>
      </div>
      <label className="block text-xs">
        <span className="muted">Token (Authorization: Bearer …) — terisi otomatis setelah login/register</span>
        <input className="input mt-1 py-1 font-mono text-xs" value={tok} onChange={(e) => setTok(e.target.value)} placeholder="kosong = tamu" />
      </label>
      {method !== 'GET' && method !== 'DELETE' && (
        <label className="block text-xs">
          <span className="muted">Body (JSON)</span>
          <textarea className="input mt-1 h-28 font-mono text-xs" value={body} onChange={(e) => setBody(e.target.value)} spellCheck={false} />
        </label>
      )}
      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="muted">Contoh:</span>
        <button className="underline" onClick={() => { setMethod('POST'); setUrl('/api/auth/register'); setBody(SAMPLE_BODY) }}>daftar</button>
        <button className="underline" onClick={() => { setMethod('POST'); setUrl('/api/auth/login'); setBody(SAMPLE_BODY) }}>login</button>
        <button className="underline" onClick={() => { setMethod('GET'); setUrl('/api/auth/me') }}>siapa saya</button>
        <button className="underline" onClick={() => { setMethod('GET'); setUrl(`/api/${first}`) }}>daftar data</button>
      </div>
      {result && (
        <div>
          <p className="mb-1 text-xs"><Badge tone={statusTone(result.status)}>{result.offline ? 'fetch gagal' : `${result.status} ${STATUS_TEXT[result.status] ?? ''}`}</Badge></p>
          {result.body && <pre className="code-surface max-h-64 overflow-auto rounded-lg p-2 font-mono text-xs">{pretty(result.body)}</pre>}
        </div>
      )}
    </div>
  )
}
