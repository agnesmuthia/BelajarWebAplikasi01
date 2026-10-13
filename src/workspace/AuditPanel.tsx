import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react'
import { cx } from '../components/ui'
import type { AuditItem } from './audit'

export function AuditPanel({ items, testTitles, consoleErrors }: { items: AuditItem[]; testTitles: Record<string, string>; consoleErrors: number }) {
  const fails = items.filter((i) => i.status === 'fail').length
  const warns = items.filter((i) => i.status === 'warn').length
  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-medium">
        {fails === 0 && warns === 0 ? 'Semua pemeriksaan otomatis lulus.' : `${fails} masalah, ${warns} saran.`}
      </p>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className={cx('rounded-xl border p-3 text-sm', it.status === 'pass' ? 'border-emerald-200 dark:border-emerald-500/30' : it.status === 'fail' ? 'border-rose-200 dark:border-rose-500/30' : 'border-amber-200 dark:border-amber-500/30')}>
            <div className="flex items-start gap-2 font-medium">
              {it.status === 'pass' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /> : it.status === 'fail' ? <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />}
              {it.label}
            </div>
            {it.details.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 pl-6 font-mono text-xs [overflow-wrap:anywhere]">
                {it.details.slice(0, 8).map((d) => <li key={d}>{d}</li>)}
                {it.details.length > 8 && <li className="muted font-sans">…dan {it.details.length - 8} lainnya</li>}
              </ul>
            )}
            {it.testId && testTitles[it.testId] && <p className="muted mt-1.5 pl-6 text-xs">Terkait checklist testing: “{testTitles[it.testId]}”</p>}
          </li>
        ))}
        <li className={cx('rounded-xl border p-3 text-sm', consoleErrors ? 'border-rose-200 dark:border-rose-500/30' : 'border-emerald-200 dark:border-emerald-500/30')}>
          <div className="flex items-start gap-2 font-medium">
            {consoleErrors ? <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />}
            Halaman yang sedang di-preview tanpa error JavaScript
          </div>
          {consoleErrors > 0 && <p className="mt-1 pl-6 text-xs">{consoleErrors} error — lihat tab Console.</p>}
        </li>
      </ul>
      <p className="muted flex items-start gap-1.5 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" /> Pemeriksaan ini membantu, tetapi tidak menggantikan uji manual: link eksternal, navigasi keyboard, kontras warna, dan tampilan di ponsel tetap perlu dicoba sendiri sebelum mencentang checklist.
      </p>
    </div>
  )
}
