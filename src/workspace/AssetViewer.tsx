import { Download, Info, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { CodeBlock } from '../components/CodeBlock'
import type { StoredFile } from './db'
import { basename, formatBytes, kindOf, relativePath } from './paths'
import { useObjectUrl } from './useProjectFiles'

/**
 * Pratinjau aset (gambar, font, audio/video) + penjelasan cara merujuknya
 * dari setiap file HTML/CSS di proyek — konsep path relatif yang sering membingungkan pemula.
 */
export function AssetViewer({ file, allPaths }: { file: StoredFile; allPaths: string[] }) {
  const url = useObjectUrl(file.blobHash, file.mime)
  const kind = kindOf(file.path)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const users = allPaths.filter((p) => /\.(html?|css)$/i.test(p))

  const snippetFor = (from: string) => {
    const rel = relativePath(from, file.path)
    if (from.endsWith('.css')) {
      if (kind === 'font') return `@font-face {\n  font-family: "FontKu";\n  src: url("${rel}");\n}`
      return `.hero {\n  background-image: url("${rel}");\n}`
    }
    if (kind === 'image') return `<img src="${rel}" alt="Jelaskan isi gambar">`
    if (kind === 'media') return /\.(mp4|webm)$/i.test(file.path) ? `<video src="${rel}" controls></video>` : `<audio src="${rel}" controls></audio>`
    return `<a href="${rel}">${basename(file.path)}</a>`
  }

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <div className="grid place-items-center rounded-xl border border-slate-200 bg-[repeating-conic-gradient(#e2e8f0_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-4 dark:border-white/10">
        {!url ? (
          <p className="muted text-sm">Memuat…</p>
        ) : kind === 'image' ? (
          <img src={url} alt={`Pratinjau ${basename(file.path)}`} className="max-h-72 max-w-full" onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
        ) : kind === 'media' ? (
          /\.(mp4|webm)$/i.test(file.path) ? <video src={url} controls className="max-h-72 max-w-full" /> : <audio src={url} controls />
        ) : (
          <a href={url} download={basename(file.path)} className="btn-secondary"><Download className="size-4" /> Unduh {basename(file.path)}</a>
        )}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="muted">Lokasi di proyek</dt>
        <dd className="font-mono [overflow-wrap:anywhere]">{file.path}</dd>
        <dt className="muted">Ukuran</dt>
        <dd>{formatBytes(file.size)}{dims && ` · ${dims.w}×${dims.h} px`}</dd>
        <dt className="muted">Tipe</dt>
        <dd className="font-mono">{file.mime}</dd>
      </dl>

      {kind === 'image' && file.size > 500 * 1024 && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> Gambar ini cukup besar ({formatBytes(file.size)}). Kompres (mis. di squoosh.app) atau perkecil ukurannya agar website cepat dimuat di ponsel.
        </p>
      )}
      {dims && dims.w > 2400 && <p className="muted text-xs">Lebar {dims.w}px jauh melebihi layar pada umumnya; 1600–2000px biasanya cukup untuk gambar layar penuh.</p>}

      <div>
        <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Info className="size-4 text-cyan-500" /> Cara memakai file ini</h3>
        <p className="muted mb-3 text-xs">Path ditulis <b>relatif dari file yang memakainya</b>. Karena itu tulisannya berbeda tergantung lokasi file HTML/CSS:</p>
        {users.length === 0 ? (
          <p className="muted text-sm">Belum ada file HTML/CSS di proyek.</p>
        ) : (
          <div className="space-y-3">
            {users.slice(0, 6).map((u) => (
              <CodeBlock key={u} title={`dari ${u}`} lang={u.endsWith('.css') ? 'css' : 'html'} code={snippetFor(u)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
