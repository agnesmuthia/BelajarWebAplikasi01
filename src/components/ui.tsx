import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold tracking-wider text-indigo-600 uppercase dark:text-cyan-400">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{title}</h1>
        {description && <p className="muted mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10', className)} role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-[width] duration-500" style={{ width: `${v}%` }} />
    </div>
  )
}

export function ProgressRing({ value, size = 96, stroke = 9, label, children }: { value: number; size?: number; stroke?: number; label: string; children?: ReactNode }) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${v}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-white/10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="url(#ring)" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children ?? <span className="text-lg font-bold">{v}%</span>}</div>
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'indigo' }: { icon: LucideIcon; label: string; value: ReactNode; hint?: ReactNode; tone?: 'indigo' | 'violet' | 'cyan' | 'emerald' }) {
  const tones = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  }
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={cx('grid size-10 place-items-center rounded-xl', tones[tone])}>
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="muted text-xs font-medium">{label}</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{value}</div>
        </div>
      </div>
      {hint && <div className="muted mt-2 text-xs">{hint}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-cyan-400/15 text-indigo-500 dark:text-cyan-300">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      {children && <div className="muted mt-1 max-w-md text-sm">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  }
  return <span className={cx('chip', tones[tone])}>{children}</span>
}

/** Label untuk fitur yang belum tersedia — agar tidak ada tombol "pura-pura berfungsi". */
export function PhaseBadge({ phase }: { phase: number }) {
  return <Badge tone="amber">Phase {phase}</Badge>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{children}</h2>
      {action}
    </div>
  )
}
