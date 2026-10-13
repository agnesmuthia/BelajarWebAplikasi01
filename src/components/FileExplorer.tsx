import { Eye, FileCode2, FileText, Folder } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ProjectFile } from '../data/projects'
import { langFromPath } from '../lib/highlight'
import { buildPreviewDocument } from '../lib/preview'
import { CodeBlock } from './CodeBlock'
import { SandboxedPreview } from './SandboxedPreview'
import { cx } from './ui'

const PREVIEW = '__preview__'

/** Daftar file (hanya-baca) + preview terisolasi. Pengeditan file ada di editor proyek. */
export function FileExplorer({ files, title }: { files: ProjectFile[]; title: string }) {
  const [active, setActive] = useState<string>(PREVIEW)
  const doc = useMemo(() => buildPreviewDocument(files), [files])
  const sorted = [...files].sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path))
  const current = files.find((f) => f.path === active)

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <nav aria-label="File proyek" className="rounded-xl border border-slate-200 p-2 dark:border-white/10">
        <div className="mb-1 flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
          <Folder className="size-3.5" /> {title}
        </div>
        <ul className="flex gap-1 overflow-x-auto lg:block lg:space-y-0.5">
          <li>
            <button onClick={() => setActive(PREVIEW)} aria-current={active === PREVIEW} className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm whitespace-nowrap', active === PREVIEW ? 'bg-indigo-500/10 font-medium text-indigo-700 dark:text-cyan-300' : 'hover:bg-slate-100 dark:hover:bg-white/5')}>
              <Eye className="size-4 shrink-0" /> Live preview
            </button>
          </li>
          {sorted.map((f) => {
            const Icon = /\.(html|css|js)$/.test(f.path) ? FileCode2 : FileText
            return (
              <li key={f.path}>
                <button onClick={() => setActive(f.path)} aria-current={active === f.path} className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-[13px] whitespace-nowrap', active === f.path ? 'bg-indigo-500/10 font-medium text-indigo-700 dark:text-cyan-300' : 'hover:bg-slate-100 dark:hover:bg-white/5')}>
                  <Icon className="size-4 shrink-0" /> {f.path}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="min-w-0">
        {current ? (
          <CodeBlock code={current.content} lang={langFromPath(current.path)} title={current.path} maxHeight={520} />
        ) : (
          <>
            <SandboxedPreview html={doc} prepared title={`Preview ${title}`} height={520} />
            <p className="muted mt-2 text-xs">Gambar di folder assets/ belum ada, jadi browser menampilkan teks alt. Preview tidak dapat mengakses internet maupun data DevStudio.</p>
          </>
        )}
      </div>
    </div>
  )
}
