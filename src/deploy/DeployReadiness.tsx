import { CheckCircle2, FilePlus2, Loader2, RefreshCw, TriangleAlert, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Modal } from '../components/Modal'
import { cx } from '../components/ui'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { createSnapshot, listFiles, seedProject, writeText } from '../workspace/db'
import { findTemplate } from '../data/projects'
import { CONFIG_FILES } from './configs'
import { checkDeploy, type DeployCheckItem } from './deployCheck'

/** Pemeriksaan “Siap deploy?” untuk file proyek yang tersimpan di IndexedDB. */
export function DeployReadiness({ projectId, templateId, compact = false }: { projectId: string; templateId: string; compact?: boolean }) {
  const [items, setItems] = useState<DeployCheckItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const tpl = findTemplate(templateId)
      if (tpl) await seedProject(projectId, tpl.files)
      const files = await listFiles(projectId)
      setItems(checkDeploy(files.map((f) => ({ path: f.path, text: f.text, size: f.size }))))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [projectId, templateId])

  useEffect(() => {
    void run()
  }, [run])

  if (error) return <p className="text-sm text-rose-600">{error}</p>
  if (!items) return <p className="muted text-sm"><Loader2 className="mr-2 inline size-4 animate-spin" />Memeriksa file proyek…</p>

  const fails = items.filter((i) => i.status === 'fail').length
  const warns = items.filter((i) => i.status === 'warn').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className={cx('text-sm font-medium', fails ? 'text-rose-600 dark:text-rose-400' : warns ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-400')}>
          {fails ? `${fails} masalah harus diperbaiki sebelum deploy` : warns ? `Siap deploy, dengan ${warns} saran` : 'Siap deploy!'}
        </p>
        <button className="btn-ghost p-2" onClick={() => void run()} disabled={busy} aria-label="Periksa ulang" title="Periksa ulang"><RefreshCw className={cx('size-4', busy && 'animate-spin')} /></button>
      </div>
      <ul className="space-y-2">
        {items.filter((i) => !compact || i.status !== 'pass').map((it) => (
          <li key={it.id} className={cx('rounded-xl border p-3 text-sm', it.status === 'pass' ? 'border-emerald-200 dark:border-emerald-500/30' : it.status === 'fail' ? 'border-rose-200 dark:border-rose-500/30' : 'border-amber-200 dark:border-amber-500/30')}>
            <div className="flex items-start gap-2 font-medium">
              {it.status === 'pass' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /> : it.status === 'fail' ? <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />}
              {it.label}
            </div>
            {it.status !== 'pass' && (
              <>
                <p className="muted mt-1 pl-6 text-xs">{it.why}</p>
                <ul className="mt-1.5 space-y-0.5 pl-6 font-mono text-xs [overflow-wrap:anywhere]">
                  {it.details.slice(0, 6).map((d) => <li key={d}>{d}</li>)}
                  {it.details.length > 6 && <li className="muted font-sans">…dan {it.details.length - 6} lainnya</li>}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>
      {compact && fails + warns === 0 && <p className="muted text-xs">Semua {items.length} pemeriksaan lulus.</p>}
      <p className="muted text-xs">Perbaiki file di editor proyek. Pemeriksaan ini tidak menggantikan uji di ponsel & browser setelah online.</p>
    </div>
  )
}

/** Menambahkan file konfigurasi deployment ke proyek (dengan konfirmasi jika menimpa). */
export function ConfigFileButtons({ projectId }: { projectId: string }) {
  const { updateProject } = useStore()
  const toast = useToast()
  const [pending, setPending] = useState<{ path: string; label: string; content: string; exists: boolean } | null>(null)

  const prepare = async (c: (typeof CONFIG_FILES)[number]) => {
    const files = await listFiles(projectId)
    const build = files.some((f) => f.path === 'package.json')
    setPending({ path: c.path, label: c.label, content: c.make({ build }), exists: files.some((f) => f.path === c.path) })
  }

  const confirm = async () => {
    if (!pending) return
    if (pending.exists) await createSnapshot(projectId, `Otomatis: sebelum menimpa ${pending.path}`, true)
    await writeText(projectId, pending.path, pending.content)
    updateProject(projectId, {}, `File deployment ditambahkan: ${pending.path}`)
    toast(`${pending.path} ditambahkan ke proyek.`)
    setPending(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {CONFIG_FILES.map((c) => (
          <button key={c.id} className="btn-secondary px-3 py-1.5 text-xs" onClick={() => void prepare(c)}><FilePlus2 className="size-4" /> {c.label}</button>
        ))}
      </div>
      <p className="muted text-xs">Opsional. GitHub Pages “Deploy from a branch” dan pengaturan lewat dashboard Netlify/Vercel tidak butuh file ini — file konfigurasi membuat pengaturan ikut tersimpan di repository.</p>
      <Modal open={pending !== null} onClose={() => setPending(null)} title={`Tambahkan ${pending?.path}?`}>
        {pending && (
          <div className="space-y-3 text-sm">
            {pending.exists && <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">File ini sudah ada dan akan ditimpa (checkpoint otomatis dibuat lebih dulu).</p>}
            <pre className="code-surface max-h-72 overflow-auto rounded-lg p-3 font-mono text-xs">{pending.content}</pre>
            <p className="muted text-xs">File ditambahkan ke proyek DevStudio. Agar berlaku, commit & push ke GitHub (lewat ZIP atau Folder lokal).</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setPending(null)}>Batal</button>
              <button className="btn-primary" onClick={() => void confirm()}>Tambahkan</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
