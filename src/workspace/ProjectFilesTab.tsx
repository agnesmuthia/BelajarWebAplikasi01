import { Code2, Database, FileCode2, FileImage, FileText, Loader2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui'
import { requestPersistence, storageInfo } from './db'
import { formatBytes, kindOf } from './paths'
import { useProjectFiles } from './useProjectFiles'

export function ProjectFilesTab({ projectId, templateId }: { projectId: string; templateId: string }) {
  const { files, error } = useProjectFiles(projectId, templateId)
  const [info, setInfo] = useState<Awaited<ReturnType<typeof storageInfo>> | null>(null)

  useEffect(() => {
    void storageInfo().then(setInfo)
  }, [files])

  if (error) return <p className="text-sm text-rose-600">Penyimpanan tidak tersedia: {error}</p>
  if (!files) return <p className="muted text-sm"><Loader2 className="mr-2 inline size-4 animate-spin" />Memuat…</p>

  const total = files.reduce((a, f) => a + f.size, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">{files.length} file · {formatBytes(total)}</p>
        <Link to={`/projects/${projectId}/code`} className="btn-primary"><Code2 className="size-4" /> Buka editor</Link>
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-white/5 dark:border-white/10">
        {files.map((f) => {
          const k = kindOf(f.path)
          const Icon = k === 'image' ? FileImage : k === 'html' || k === 'css' || k === 'js' ? FileCode2 : FileText
          return (
            <li key={f.path} className="flex items-center gap-2 px-3 py-2 text-sm">
              <Icon className="size-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{f.path}</span>
              <span className="muted text-xs">{formatBytes(f.size)}</span>
            </li>
          )
        })}
      </ul>

      <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/[0.03]">
        <h3 className="mb-2 flex items-center gap-2 font-semibold"><Database className="size-4 text-indigo-500" /> Di mana file ini disimpan?</h3>
        <ul className="muted list-disc space-y-1 pl-5">
          <li>Di <b>IndexedDB</b> browser ini — bukan di hard drive-mu dan bukan di server. File asli di komputermu tidak pernah diubah oleh DevStudio.</li>
          <li>File proyek <b>tidak</b> termasuk dalam Export backup JSON di Pengaturan. Untuk menyimpan cadangan, unduh ZIP; untuk memulihkan, impor ZIP itu di editor.</li>
          <li>Tempat paling aman untuk kode tetap repository GitHub (Phase 4).</li>
        </ul>
        {info?.usage !== undefined && info.quota !== undefined && (
          <p className="muted mt-3 text-xs">Penggunaan penyimpanan DevStudio: {formatBytes(info.usage)} dari kuota ±{formatBytes(info.quota)}.</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {info?.persisted ? (
            <Badge tone="emerald"><ShieldCheck className="size-3" /> Penyimpanan permanen aktif</Badge>
          ) : (
            <>
              <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => void requestPersistence().then(() => storageInfo().then(setInfo))}>
                <ShieldCheck className="size-4" /> Minta penyimpanan permanen
              </button>
              <span className="muted text-xs">Tanpa ini, browser boleh menghapus data saat ruang disk hampir penuh.</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
