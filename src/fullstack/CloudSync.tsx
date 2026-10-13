import { CloudDownload, CloudUpload, KeyRound, Loader2, LogIn, LogOut, Trash2, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CodeBlock } from '../components/CodeBlock'
import { Modal } from '../components/Modal'
import { Badge } from '../components/ui'
import { loadDrafts, replaceDrafts, sanitizeDrafts } from '../lab/drafts'
import { downloadBlob } from '../lib/download'
import { sanitizeState } from '../lib/storage'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { formatBytes } from '../workspace/paths'
import * as sb from './supabase'

const MAX_BYTES = 1_900_000

/** Cadangan progres ke Supabase milik pengguna (opsional, butuh akun & proyek Supabase sendiri). */
export function CloudSync() {
  const { state, replaceState } = useStore()
  const toast = useToast()
  const [cfg, setCfg] = useState<sb.SupabaseConfig | null>(() => sb.loadConfig())
  const [form, setForm] = useState<sb.SupabaseConfig>(() => cfg ?? { url: '', key: '' })
  const [remember, setRemember] = useState(true)
  const [session, setSession] = useState<sb.Session | null>(() => sb.loadSession())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [backups, setBackups] = useState<sb.BackupRow[] | null>(null)
  const [note, setNote] = useState('')
  const [restoreId, setRestoreId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const payload = { ...state, labDrafts: loadDrafts() }
  const size = new Blob([JSON.stringify(payload)]).size

  const guard = async <T,>(label: string, fn: () => Promise<T>) => {
    setBusy(label)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return undefined
    } finally {
      setBusy(null)
    }
  }

  const refresh = useCallback(async () => {
    if (!cfg || !session) return
    setBusy('list')
    setError(null)
    try {
      setBackups(await sb.listBackups(fetch, cfg, session))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }, [cfg, session])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const connect = (e: FormEvent) => {
    e.preventDefault()
    const err = sb.validateConfig(form)
    if (err) return setError(err)
    setError(null)
    setCfg(form)
    sb.saveConfig(remember ? form : null)
  }

  const disconnect = () => {
    if (cfg && session) void sb.signOut(fetch, cfg, session)
    sb.saveSession(null)
    sb.saveConfig(null)
    setSession(null)
    setCfg(null)
    setBackups(null)
  }

  const auth = async (mode: 'in' | 'up') => {
    if (!cfg) return
    if (!email.trim() || password.length < 8) return setError('Isi email dan password (minimal 8 karakter).')
    const r = await guard(mode, () => (mode === 'in' ? sb.signIn(fetch, cfg, email.trim(), password) : sb.signUp(fetch, cfg, email.trim(), password)))
    setPassword('')
    if (r === 'confirm-email') return toast('Akun dibuat. Buka email konfirmasi dari Supabase, lalu login.')
    if (r) {
      sb.saveSession(r)
      setSession(r)
      toast(`Login sebagai ${r.email}.`)
    }
  }

  const logout = async () => {
    if (cfg && session) await sb.signOut(fetch, cfg, session)
    sb.saveSession(null)
    setSession(null)
    setBackups(null)
  }

  const upload = async () => {
    if (!cfg || !session) return
    if (size > MAX_BYTES) return setError(`Data terlalu besar (${formatBytes(size)}). Batas tabel ±2 MB.`)
    const row = await guard('upload', () => sb.uploadBackup(fetch, cfg, session, payload, note))
    if (row) {
      setNote('')
      toast('Cadangan tersimpan di Supabase.')
      void refresh()
    }
  }

  const restore = async () => {
    if (!cfg || !session || restoreId === null) return
    const id = restoreId
    setRestoreId(null)
    const data = await guard('restore', () => sb.fetchBackup(fetch, cfg, session, id))
    if (!data) return
    const raw = data as { version?: unknown; labDrafts?: unknown }
    if (raw.version !== 1) return setError('Isi cadangan bukan format DevStudio yang valid.')
    // Simpan salinan lokal dulu agar pemulihan bisa dibatalkan.
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `devstudio-sebelum-pulih-${new Date().toISOString().slice(0, 10)}.json`)
    replaceState(sanitizeState(raw))
    replaceDrafts(sanitizeDrafts(raw.labDrafts))
    toast('Progres dipulihkan dari cloud. Salinan progres sebelumnya sudah diunduh.')
  }

  const remove = async () => {
    if (!cfg || !session || deleteId === null) return
    const id = deleteId
    setDeleteId(null)
    await guard('delete', () => sb.deleteBackup(fetch, cfg, session, id))
    void refresh()
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-2 p-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">Sinkronisasi cadangan ke Supabase</h3>
          <Badge tone="amber">Opsional · butuh akun Supabase</Badge>
        </div>
        <p className="muted">Secara bawaan semua progres hanya ada di browser ini. Jika ingin cadangan yang bisa dipulihkan di perangkat lain, hubungkan <b>proyek Supabase milikmu sendiri</b>. DevStudio tidak punya server dan tidak pernah melihat datamu.</p>
        <ul className="muted list-disc space-y-0.5 pl-5">
          <li>Yang dicadangkan: progres belajar, daftar proyek (tugas, catatan, URL), dan draft Coding Lab. <b>File proyek & gambar (IndexedDB) tidak ikut</b> — tetap unduh ZIP per proyek.</li>
          <li>Biaya: paket gratis Supabase cukup untuk ini, tetapi punya batas (mis. ukuran database, proyek ter-pause bila lama tidak aktif). Cek halaman harga resmi Supabase.</li>
          <li>Keamanan: hanya <b>publishable key</b> yang boleh ditempel di sini. Data dilindungi Row Level Security pada tabel.</li>
        </ul>
      </div>

      <details className="card p-4 text-sm" open={!cfg}>
        <summary className="cursor-pointer font-semibold">Langkah penyiapan (sekali saja)</summary>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>Buka <a className="underline" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">supabase.com/dashboard</a>, login, lalu buat proyek baru (pilih region terdekat, mis. Singapore). Simpan password database di pengelola password — DevStudio tidak memerlukannya.</li>
          <li>Buka <b>SQL Editor → New query</b>, tempel SQL di bawah, lalu <b>Run</b>. Baca komentarnya: tabel, RLS, policy, dan GRANT.</li>
          <li>Buka <b>Connect</b> atau <b>Project Settings → API Keys</b>. Salin <b>Project URL</b> dan <b>publishable key</b> (diawali <code className="font-mono">sb_publishable_</code>; proyek lama memakai “anon key”).</li>
          <li>Opsional: di <b>Authentication → Sign In / Providers</b>, atur apakah konfirmasi email wajib.</li>
        </ol>
        <div className="mt-3"><CodeBlock code={sb.SETUP_SQL} lang="text" title="SQL penyiapan" maxHeight={260} /></div>
      </details>

      {error && <p className="card border-rose-300 p-3 text-sm text-rose-700 dark:border-rose-500/40 dark:text-rose-300" role="alert">{error}</p>}

      {!cfg ? (
        <form className="card space-y-3 p-4 text-sm" onSubmit={connect}>
          <label className="block"><span className="font-medium">Project URL</span><input className="input mt-1 font-mono text-xs" placeholder="https://xxxxxxxx.supabase.co" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} autoComplete="off" /></label>
          <label className="block"><span className="font-medium">Publishable key</span><input className="input mt-1 font-mono text-xs" placeholder="sb_publishable_…" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} autoComplete="off" spellCheck={false} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo-600" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Ingat URL & publishable key di browser ini</label>
          <button className="btn-primary" type="submit"><KeyRound className="size-4" /> Hubungkan</button>
        </form>
      ) : !session ? (
        <div className="card space-y-3 p-4 text-sm">
          <p className="muted">Terhubung ke <span className="font-mono">{sb.baseUrl(cfg)}</span>. Login dengan akun pengguna di proyek Supabase-mu (bukan akun dashboard Supabase).</p>
          <label className="block"><span className="font-medium">Email</span><input className="input mt-1" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block"><span className="font-medium">Password</span><input className="input mt-1" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => void auth('in')} disabled={!!busy}>{busy === 'in' ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />} Login</button>
            <button className="btn-secondary" onClick={() => void auth('up')} disabled={!!busy}>{busy === 'up' ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Daftar akun baru</button>
            <button className="btn-ghost ml-auto" onClick={disconnect}>Putuskan</button>
          </div>
          <p className="muted text-xs">Password dikirim langsung ke Supabase lewat HTTPS dan tidak disimpan DevStudio. Token sesi disimpan di sessionStorage dan hilang saat tab ditutup.</p>
        </div>
      ) : (
        <div className="card space-y-3 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald">Login</Badge><span className="font-mono text-xs">{session.email}</span>
            <button className="btn-ghost ml-auto px-2 py-1 text-xs" onClick={() => void logout()}><LogOut className="size-3.5" /> Logout</button>
            <button className="btn-ghost px-2 py-1 text-xs" onClick={disconnect}>Putuskan</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <input className="input min-w-0 flex-1" placeholder="Catatan (opsional), mis. laptop sekolah" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
            <button className="btn-primary" onClick={() => void upload()} disabled={!!busy}>{busy === 'upload' ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />} Cadangkan sekarang ({formatBytes(size)})</button>
          </div>
          <div>
            <p className="mb-1 font-medium">Cadangan di cloud</p>
            {busy === 'list' ? <p className="muted"><Loader2 className="mr-1 inline size-4 animate-spin" />Memuat…</p> : !backups?.length ? <p className="muted">Belum ada cadangan.</p> : (
              <ul className="divide-y divide-slate-200 dark:divide-white/10">
                {backups.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="font-mono text-xs">{new Date(b.created_at).toLocaleString('id-ID')}</span>
                    {b.note && <span className="muted truncate text-xs">— {b.note}</span>}
                    <span className="ml-auto flex gap-1">
                      <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setRestoreId(b.id)} disabled={!!busy}><CloudDownload className="size-3.5" /> Pulihkan</button>
                      <button className="btn-ghost px-2 py-1 text-xs text-rose-600" onClick={() => setDeleteId(b.id)} disabled={!!busy} aria-label="Hapus cadangan"><Trash2 className="size-3.5" /></button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Modal open={restoreId !== null} onClose={() => setRestoreId(null)} title="Pulihkan dari cloud?">
        <div className="space-y-3 text-sm">
          <p>Progres di browser ini akan <b>diganti</b> dengan isi cadangan. Sebelum itu, DevStudio mengunduh salinan progres saat ini sebagai file JSON (bisa diimpor lagi di Pengaturan).</p>
          <div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => setRestoreId(null)}>Batal</button><button className="btn-primary" onClick={() => void restore()}>Pulihkan</button></div>
        </div>
      </Modal>
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Hapus cadangan ini?">
        <div className="space-y-3 text-sm">
          <p>Cadangan akan dihapus permanen dari database Supabase-mu.</p>
          <div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => setDeleteId(null)}>Batal</button><button className="btn-primary bg-rose-600 hover:bg-rose-500" onClick={() => void remove()}>Hapus</button></div>
        </div>
      </Modal>
    </div>
  )
}
