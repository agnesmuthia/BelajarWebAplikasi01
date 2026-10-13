import { RotateCw } from 'lucide-react'
import { useState } from 'react'
import { injectHead } from '../lib/preview'

/**
 * Menampilkan HTML di iframe yang diisolasi:
 * sandbox="allow-scripts" tanpa allow-same-origin → script berjalan di origin terpisah
 * dan tidak bisa mengakses data DevStudio. CSP di dalam dokumen memblokir request jaringan.
 */
export function SandboxedPreview({ html, title, height = 260, prepared = false }: { html: string; title: string; height?: number; prepared?: boolean }) {
  const [key, setKey] = useState(0)
  const doc = prepared ? html : injectHead(html)
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-white/10 dark:bg-ink-850">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="truncate text-xs text-slate-500 dark:text-slate-400">Preview terisolasi</span>
        <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setKey((k) => k + 1)} aria-label="Muat ulang preview">
          <RotateCw className="size-3.5" />
        </button>
      </div>
      <iframe key={key} title={title} sandbox="allow-scripts allow-forms" srcDoc={doc} className="block w-full bg-white" style={{ height }} />
    </div>
  )
}
