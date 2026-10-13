import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { tokenize, type Lang } from '../lib/highlight'

export function CodeBlock({ code, lang, title, maxHeight }: { code: string; lang: Lang; title?: string; maxHeight?: number }) {
  const [copied, setCopied] = useState(false)
  const tokens = useMemo(() => tokenize(code, lang), [code, lang])
  const lineCount = code.split('\n').length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-white/10 dark:bg-ink-850">
        <span className="truncate font-mono text-xs text-slate-600 dark:text-slate-400">{title ?? lang.toUpperCase()}</span>
        <button onClick={copy} className="btn-ghost px-2 py-1 text-xs" aria-label="Salin kode">
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      <div className="code-surface flex overflow-auto font-mono text-[13px] leading-6 focus-visible:outline-2 focus-visible:outline-cyan-400" style={{ maxHeight }} tabIndex={0} role="region" aria-label={`Kode ${title ?? lang}`}>
        <div aria-hidden className="sticky left-0 shrink-0 border-r border-slate-200 bg-inherit px-3 py-3 text-right text-slate-500 select-none dark:border-white/5 dark:text-slate-400">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="flex-1 px-4 py-3">
          <code>
            {tokens.map((t, i) => (t.cls ? <span key={i} className={t.cls}>{t.text}</span> : t.text))}
          </code>
        </pre>
      </div>
    </div>
  )
}
