import { GitCommitHorizontal, History, Loader2, RotateCcw, Save } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import { Badge, cx } from '../components/ui'
import { relativeTime } from '../lib/date'
import { createSnapshot, listSnapshots, restoreSnapshot, subscribe, type Snapshot, type SnapshotFile } from './db'
import { diffLines, diffStats, hunks } from './diff'

export interface Change {
  path: string
  type: 'added' | 'modified' | 'deleted'
  before?: SnapshotFile
  after?: SnapshotFile
}

/** Bandingkan dua daftar file — seperti `git status`. */
export function compareFiles(before: SnapshotFile[], after: SnapshotFile[]): Change[] {
  const a = new Map(before.map((f) => [f.path, f]))
  const b = new Map(after.map((f) => [f.path, f]))
  const out: Change[] = []
  for (const [p, f] of b) {
    const old = a.get(p)
    if (!old) out.push({ path: p, type: 'added', after: f })
    else if (old.text !== f.text || old.blobHash !== f.blobHash) out.push({ path: p, type: 'modified', before: old, after: f })
  }
  for (const [p, f] of a) if (!b.has(p)) out.push({ path: p, type: 'deleted', before: f })
  return out.sort((x, y) => x.path.localeCompare(y.path))
}

const TYPE_LABEL = { added: 'baru', modified: 'diubah', deleted: 'dihapus' }
const TYPE_TONE = { added: 'emerald', modified: 'amber', deleted: 'rose' } as const

function DiffView({ changes }: { changes: Change[] }) {
  if (!changes.length) return <p className="muted text-sm">Tidak ada perbedaan.</p>
  return (
    <div className="space-y-4">
      {changes.map((c) => {
        const isText = (c.before?.text ?? c.after?.text) !== undefined
        const lines = isText ? diffLines(c.before?.text ?? '', c.after?.text ?? '') : null
        const stats = lines ? diffStats(lines) : null
        return (
          <section key={c.path} className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
            <header className="flex flex-wrap items-center gap-2 bg-slate-50 px-3 py-1.5 text-xs dark:bg-ink-850">
              <span className="font-mono font-medium">{c.path}</span>
              <Badge tone={TYPE_TONE[c.type]}>{TYPE_LABEL[c.type]}</Badge>
              {stats && <span className="muted"><span className="text-emerald-600">+{stats.added}</span> <span className="text-rose-600">−{stats.removed}</span></span>}
            </header>
            {!isText ? (
              <p className="muted px-3 py-2 text-xs">File biner (gambar/font) — isinya {c.type === 'modified' ? 'berganti' : c.type === 'added' ? 'ditambahkan' : 'dihapus'}.</p>
            ) : !lines ? (
              <p className="muted px-3 py-2 text-xs">File terlalu panjang untuk dibandingkan baris per baris.</p>
            ) : (
              <pre className="code-surface max-h-64 overflow-auto text-[12px] leading-5">
                {hunks(lines).map((l, i) =>
                  l.type === 'gap' ? (
                    <div key={i} className="bg-slate-100 px-3 text-slate-400 dark:bg-white/5">⋯ {l.count} baris sama</div>
                  ) : (
                    <div key={i} className={cx('px-3 whitespace-pre-wrap', l.type === 'add' && 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300', l.type === 'del' && 'bg-rose-500/10 text-rose-800 dark:text-rose-300')}>
                      <span className="mr-2 inline-block w-3 select-none">{l.type === 'add' ? '+' : l.type === 'del' ? '−' : ' '}</span>
                      {l.text}
                    </div>
                  ),
                )}
              </pre>
            )}
          </section>
        )
      })}
    </div>
  )
}

interface Props {
  projectId: string
  current: SnapshotFile[]
  /** Simpan perubahan editor yang belum tersimpan sebelum membuat checkpoint. */
  flush: () => Promise<void>
  onCheckpoint: (message: string) => void
  onRestored: (message: string) => void
}

/**
 * Checkpoint lokal: menyimpan “foto” seluruh file proyek, mirip commit di Git.
 * Ini BUKAN Git sungguhan — untuk riwayat yang aman di luar browser, tetap commit & push ke GitHub.
 */
export function CheckpointPanel({ projectId, current, flush, onCheckpoint, onRestored }: Props) {
  const [snaps, setSnaps] = useState<Snapshot[] | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [diff, setDiff] = useState<{ title: string; changes: Change[] } | null>(null)
  const [confirm, setConfirm] = useState<Snapshot | null>(null)

  useEffect(() => {
    const load = () => void listSnapshots(projectId).then(setSnaps)
    load()
    return subscribe(projectId, load)
  }, [projectId])

  const latest = snaps?.[0]
  const pending = useMemo(() => (latest ? compareFiles(latest.files, current) : []), [latest, current])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setBusy(true)
    try {
      await flush()
      await createSnapshot(projectId, message)
      onCheckpoint(message.trim())
      setMessage('')
    } finally {
      setBusy(false)
    }
  }

  const restore = async (s: Snapshot) => {
    setBusy(true)
    try {
      await flush()
      await restoreSnapshot(projectId, s.id)
      onRestored(s.message)
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
        <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><History className="size-4 text-indigo-500" /> Perubahan sejak checkpoint terakhir</h3>
        {!snaps ? (
          <Loader2 className="size-4 animate-spin text-slate-400" />
        ) : pending.length === 0 ? (
          <p className="muted text-sm">Bersih — tidak ada perubahan (seperti <code className="font-mono">nothing to commit</code> di Git).</p>
        ) : (
          <>
            <ul className="mb-2 space-y-0.5 text-xs">
              {pending.slice(0, 8).map((c) => (
                <li key={c.path} className="flex items-center gap-2 font-mono">
                  <span className={cx('w-14 font-sans', c.type === 'added' ? 'text-emerald-600' : c.type === 'deleted' ? 'text-rose-600' : 'text-amber-600')}>{TYPE_LABEL[c.type]}</span>
                  <span className="truncate">{c.path}</span>
                </li>
              ))}
              {pending.length > 8 && <li className="muted">…dan {pending.length - 8} file lain</li>}
            </ul>
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setDiff({ title: 'Perubahan sejak checkpoint terakhir', changes: pending })}>Lihat perubahan (diff)</button>
          </>
        )}
      </div>

      <form onSubmit={save} className="space-y-2">
        <label htmlFor="cp-msg" className="block text-sm font-semibold">Simpan checkpoint</label>
        <input id="cp-msg" className="input" placeholder='Contoh: "Tambah bagian berita"' value={message} maxLength={120} onChange={(e) => setMessage(e.target.value)} />
        <p className="muted text-xs">Tulis seperti commit message yang baik: kalimat perintah singkat tentang APA yang berubah.</p>
        <button className="btn-primary w-full" disabled={busy || !message.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Simpan checkpoint
        </button>
      </form>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Riwayat ({snaps?.length ?? 0})</h3>
        <ol className="space-y-2">
          {snaps?.map((s, i) => (
            <li key={s.id} className="rounded-lg border border-slate-200 p-2.5 text-sm dark:border-white/10">
              <div className="flex items-start gap-2">
                <GitCommitHorizontal className={cx('mt-0.5 size-4 shrink-0', s.auto ? 'text-slate-400' : 'text-indigo-500')} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium [overflow-wrap:anywhere]">{s.message}</div>
                  <div className="muted text-xs">
                    {relativeTime(s.createdAt)} · {s.files.length} file {s.auto && <Badge>otomatis</Badge>}
                  </div>
                </div>
              </div>
              <div className="mt-1.5 flex gap-1 pl-6">
                <button className="btn-ghost px-2 py-0.5 text-xs" onClick={() => setDiff({ title: `“${s.message}” → sekarang`, changes: compareFiles(s.files, current) })}>Bandingkan</button>
                {i > 0 || pending.length > 0 ? (
                  <button className="btn-ghost px-2 py-0.5 text-xs" onClick={() => setConfirm(s)}><RotateCcw className="size-3" /> Pulihkan</button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <p className="muted mt-3 text-xs">Checkpoint tersimpan di browser ini (maks. 30). Ini latihan konsep commit — riwayat yang aman dan bisa dibagikan tetap dibuat dengan Git & GitHub.</p>
      </div>

      <Modal open={diff !== null} onClose={() => setDiff(null)} title={diff?.title ?? ''}>
        <div className="max-h-[65vh] overflow-y-auto pr-1">{diff && <DiffView changes={diff.changes} />}</div>
      </Modal>

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title="Pulihkan checkpoint?">
        <p className="muted text-sm">Semua file proyek akan dikembalikan ke kondisi “{confirm?.message}”. Kondisi sekarang disimpan dulu sebagai checkpoint otomatis, jadi tidak ada yang hilang.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirm(null)}>Batal</button>
          <button className="btn-primary" disabled={busy} onClick={() => confirm && void restore(confirm)}>Pulihkan</button>
        </div>
      </Modal>
    </div>
  )
}
