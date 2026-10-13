import { Lightbulb, Lock } from 'lucide-react'
import { RichText } from '../components/RichText'

/** Petunjuk bertahap: dibuka satu per satu, terkunci di Practice Mode sampai ada percobaan. */
export function HintList({ hints, shown, onShow, locked, lockedText }: { hints: string[]; shown: number; onShow: () => void; locked: boolean; lockedText: string }) {
  if (locked) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-sm dark:bg-white/5">
        <Lock className="mt-0.5 size-4 shrink-0" /> {lockedText}
      </p>
    )
  }
  return (
    <div className="space-y-2">
      {hints.slice(0, shown).map((h, i) => (
        <p key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-500/20 dark:bg-amber-500/5">
          <span className="mr-1.5 font-semibold text-amber-700 dark:text-amber-300">#{i + 1}</span>
          <RichText text={h} />
        </p>
      ))}
      {shown < hints.length ? (
        <button className="btn-secondary w-full" onClick={onShow}>
          <Lightbulb className="size-4" /> Petunjuk {shown + 1} dari {hints.length}
        </button>
      ) : (
        <p className="muted text-xs">Semua petunjuk sudah dibuka.</p>
      )}
    </div>
  )
}
