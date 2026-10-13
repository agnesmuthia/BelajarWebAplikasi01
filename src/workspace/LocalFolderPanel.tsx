import { ArrowDownToLine, ArrowUpFromLine, FolderOpen, HardDrive, Info, Loader2, RefreshCw, ShieldCheck, Unlink } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Badge, cx } from '../components/ui'
import { useToast } from '../lib/toast'
import { getBlob, getFolderHandle, removeFolderHandle, saveFolderHandle, type StoredFile, type StoredHandle } from './db'
import type { ImportSource } from './importer'
import {
  compareWithFolder,
  ensurePermission,
  isFolderAccessSupported,
  permissionState,
  pickFolder,
  scanFolder,
  writeToFolder,
  type SyncRow,
  type SyncStatus,
} from './localFolder'
import { formatBytes } from './paths'

const STATUS: Record<SyncStatus, { label: string; tone: 'slate' | 'amber' | 'emerald' | 'cyan' | 'rose' }> = {
  same: { label: 'sama', tone: 'slate' },
  different: { label: 'berbeda', tone: 'amber' },
  onlyProject: { label: 'hanya di proyek', tone: 'emerald' },
  onlyFolder: { label: 'hanya di folder', tone: 'cyan' },
  tooBig: { label: 'terlalu besar', tone: 'rose' },
}

interface Props {
  projectId: string
  files: StoredFile[]
  /** Isi editor terbaru (termasuk yang belum tersimpan). */
  textOf: (path: string) => string | undefined
  flush: () => Promise<void>
  /** Buka dialog impor (pratinjau & konfirmasi) dengan file dari folder. */
  onPull: (sources: ImportSource[], origin: string) => void
  onPushed: (count: number, folder: string) => void
}

export function LocalFolderPanel({ projectId, files, textOf, flush, onPull, onPushed }: Props) {
  const toast = useToast()
  const supported = isFolderAccessSupported()
  const [linked, setLinked] = useState<StoredHandle | null | undefined>(undefined)
  const [perm, setPerm] = useState<PermissionState | null>(null)
  const [rows, setRows] = useState<SyncRow[] | null>(null)
  const [scan, setScan] = useState<{ sources: ImportSource[]; skipped: string[]; truncated: boolean } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmPush, setConfirmPush] = useState(false)
  const [showSame, setShowSame] = useState(false)

  useEffect(() => {
    getFolderHandle(projectId)
      .then(async (h) => {
        setLinked(h ?? null)
        if (h) setPerm(await permissionState(h.handle))
      })
      .catch(() => setLinked(null))
  }, [projectId])

  const run = useCallback(
    async <T,>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
      setBusy(label)
      try {
        return await fn()
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), 'error')
        return undefined
      } finally {
        setBusy(null)
      }
    },
    [toast],
  )

  const compare = async (h = linked) => {
    if (!h) return
    await run('Membandingkan…', async () => {
      if (!(await ensurePermission(h.handle))) {
        setPerm('denied')
        throw new Error('Izin akses folder ditolak. Klik lagi dan pilih “Izinkan” pada dialog browser.')
      }
      setPerm('granted')
      await flush()
      const s = await scanFolder(h.handle)
      setScan(s)
      setRows(await compareWithFolder(files.map((f) => ({ path: f.path, text: f.text !== undefined ? (textOf(f.path) ?? f.text) : undefined, blobHash: f.blobHash, size: f.size })), s.sources))
    })
  }

  const link = async () => {
    const handle = await run('Menunggu pilihan folder…', pickFolder)
    if (!handle) return
    await saveFolderHandle(projectId, handle)
    const h = await getFolderHandle(projectId)
    setLinked(h ?? null)
    toast(`Folder “${handle.name}” dihubungkan.`)
    await compare(h)
  }

  const unlink = async () => {
    await removeFolderHandle(projectId)
    setLinked(null)
    setRows(null)
    setScan(null)
    setPerm(null)
    toast('Folder dilepas. File di komputermu tidak diubah.', 'info')
  }

  const toWrite = useMemo(() => (rows ?? []).filter((r) => r.status === 'onlyProject' || r.status === 'different'), [rows])

  const push = async () => {
    if (!linked) return
    setConfirmPush(false)
    const n = await run('Menyimpan ke folder…', async () => {
      if (!(await ensurePermission(linked.handle))) throw new Error('Izin menulis ke folder ditolak.')
      await flush()
      const byPath = new Map(files.map((f) => [f.path, f]))
      const items = await Promise.all(
        toWrite.map(async (r) => {
          const f = byPath.get(r.path)!
          return { path: r.path, data: f.text !== undefined ? (textOf(f.path) ?? f.text) : ((await getBlob(f.blobHash!)) ?? new Blob()) }
        }),
      )
      return writeToFolder(linked.handle, items)
    })
    if (n !== undefined) {
      onPushed(n, linked.name)
      toast(`${n} file disimpan ke folder “${linked.name}”.`)
      await compare()
    }
  }

  const pull = () => {
    if (!scan || !linked || !rows) return
    // Hanya file yang baru atau berbeda — file yang sama tidak perlu diimpor ulang.
    const wanted = new Set(rows.filter((r) => r.status === 'onlyFolder' || r.status === 'different').map((r) => r.path))
    onPull(scan.sources.filter((s) => wanted.has(s.relPath)), `Dari folder lokal “${linked.name}”`)
  }

  if (!supported)
    return (
      <div className="space-y-3 p-4 text-sm">
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <Info className="mt-0.5 size-4 shrink-0" />
          Browser ini belum mendukung akses folder langsung (File System Access API). Fitur ini tersedia di Chrome dan Edge versi desktop.
        </p>
        <p className="font-medium">Alternatif yang tetap bisa dipakai:</p>
        <ul className="muted list-disc space-y-1 pl-5">
          <li><b>Ambil dari komputer:</b> tombol Impor folder/ZIP di panel File.</li>
          <li><b>Simpan ke komputer:</b> tombol ZIP di atas, lalu ekstrak di folder proyekmu.</li>
        </ul>
        <Link to="/local" className="text-indigo-600 underline dark:text-cyan-300">Panduan Local Workflow</Link>
      </div>
    )

  if (linked === undefined) return <p className="muted p-4 text-sm"><Loader2 className="mr-2 inline size-4 animate-spin" />Memuat…</p>

  if (!linked)
    return (
      <div className="space-y-4 p-4 text-sm">
        <div className="flex items-start gap-3">
          <HardDrive className="mt-0.5 size-6 shrink-0 text-indigo-500" />
          <div>
            <p className="font-medium">Hubungkan proyek ke folder di komputermu</p>
            <p className="muted">Kerjakan proyek di VS Code dan DevStudio sekaligus: bandingkan isi, ambil perubahan dari folder, atau simpan proyek ke folder.</p>
          </div>
        </div>
        <ul className="muted space-y-1.5 text-xs">
          <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-emerald-500" /> Browser menampilkan dialog — kamu sendiri yang memilih foldernya. DevStudio tidak bisa melihat folder lain.</li>
          <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-emerald-500" /> Izin diminta lagi setiap kali browser dibuka ulang, dan kamu bisa menolaknya kapan saja.</li>
          <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-emerald-500" /> DevStudio tidak pernah menghapus file di folder. Setiap penulisan menampilkan daftar file dan menunggu konfirmasimu.</li>
        </ul>
        <p className="muted text-xs">Tips: pilih folder proyek yang khusus (mis. Documents/website-sekolah), jangan Desktop atau seluruh Documents.</p>
        <button className="btn-primary w-full" onClick={() => void link()} disabled={busy !== null}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <FolderOpen className="size-4" />} {busy ?? 'Pilih folder…'}
        </button>
      </div>
    )

  const counts = (rows ?? []).reduce<Record<SyncStatus, number>>((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), { same: 0, different: 0, onlyProject: 0, onlyFolder: 0, tooBig: 0 })
  const visible = (rows ?? []).filter((r) => showSame || r.status !== 'same')

  return (
    <div className="space-y-4 p-4 text-sm">
      <div className="flex items-center gap-2">
        <FolderOpen className="size-5 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{linked.name}</div>
          <div className="muted text-xs">Folder lokal · {perm === 'granted' ? 'izin aktif' : 'izin perlu diminta ulang'}</div>
        </div>
        <button className="btn-ghost p-2" onClick={() => void unlink()} title="Lepas folder" aria-label="Lepas folder"><Unlink className="size-4" /></button>
      </div>

      <button className="btn-secondary w-full" onClick={() => void compare()} disabled={busy !== null}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} {busy ?? (perm === 'granted' ? 'Bandingkan lagi' : 'Izinkan & bandingkan')}
      </button>

      {rows && (
        <>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(Object.keys(STATUS) as SyncStatus[]).filter((k) => counts[k]).map((k) => <Badge key={k} tone={STATUS[k].tone}>{counts[k]} {STATUS[k].label}</Badge>)}
          </div>
          {scan && scan.skipped.length > 0 && <p className="muted text-xs">Dilewati: {scan.skipped.slice(0, 4).join(', ')}{scan.skipped.length > 4 ? ` +${scan.skipped.length - 4}` : ''} (folder sistem, tersembunyi, atau node_modules).</p>}
          {scan?.truncated && <p className="text-xs text-amber-600">Folder sangat besar; hanya 2.000 file pertama yang dibaca.</p>}

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary px-2 text-xs" onClick={pull} disabled={busy !== null || !(counts.onlyFolder + counts.different)}>
              <ArrowDownToLine className="size-4" /> Ambil dari folder
            </button>
            <button className="btn-primary px-2 text-xs" onClick={() => setConfirmPush(true)} disabled={busy !== null || !toWrite.length}>
              <ArrowUpFromLine className="size-4" /> Simpan ke folder
            </button>
          </div>

          <div>
            <label className="muted mb-1.5 flex items-center gap-2 text-xs"><input type="checkbox" className="accent-indigo-600" checked={showSame} onChange={(e) => setShowSame(e.target.checked)} /> Tampilkan file yang sama</label>
            {visible.length === 0 ? (
              <p className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">Proyek dan folder sudah sama.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-xs dark:divide-white/5 dark:border-white/10">
                {visible.map((r) => (
                  <li key={r.path} className="flex items-center gap-2 px-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate font-mono" title={r.path}>{r.path}</span>
                    <span className={cx('chip shrink-0 px-1.5 py-0 text-[10px]', r.status === 'different' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300', r.status === 'onlyProject' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', r.status === 'onlyFolder' && 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300', r.status === 'same' && 'bg-slate-100 text-slate-500 dark:bg-white/5', r.status === 'tooBig' && 'bg-rose-500/15 text-rose-700')}>
                      {STATUS[r.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="muted text-xs">
            <b>Ambil</b> membuka pratinjau impor (dengan checkpoint otomatis sebelum menimpa). <b>Simpan</b> menulis file “hanya di proyek” dan “berbeda” ke folder. File “hanya di folder” tidak pernah dihapus.
          </p>
        </>
      )}

      <Modal open={confirmPush} onClose={() => setConfirmPush(false)} title={`Simpan ${toWrite.length} file ke “${linked.name}”?`}>
        <div className="space-y-3 text-sm">
          <p className="muted">
            {toWrite.filter((r) => r.status === 'onlyProject').length} file baru akan dibuat dan <b>{toWrite.filter((r) => r.status === 'different').length} file akan DITIMPA</b> di folder komputermu.
            Versi lama file yang ditimpa tidak bisa dikembalikan dari DevStudio — jika folder itu repository Git, commit dulu agar aman.
          </p>
          <ul className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2 font-mono text-xs dark:border-white/10">
            {toWrite.map((r) => (
              <li key={r.path} className="flex justify-between gap-2">
                <span className="truncate">{r.path}</span>
                <span className={r.status === 'different' ? 'text-amber-600' : 'text-emerald-600'}>{r.status === 'different' ? 'timpa' : 'baru'} · {formatBytes(r.projectSize ?? 0)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setConfirmPush(false)}>Batal</button>
            <button className="btn-primary" onClick={() => void push()}>Simpan ke folder</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
