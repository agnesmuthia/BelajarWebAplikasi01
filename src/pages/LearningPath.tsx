import { CheckCircle2, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MODULES } from '../data/curriculum'
import { skillById } from '../data/skills'
import { Badge, PageHeader, PhaseBadge, ProgressBar } from '../components/ui'
import { moduleProgress } from '../lib/progress'
import { useStore } from '../lib/store'

export default function LearningPath() {
  const { state } = useStore()
  return (
    <>
      <PageHeader
        eyebrow="Learn → Practice → Build → Test → Review → Commit → Deploy → Reflect"
        title="My Learning Path"
        description="Dua belas modul dari HTML sampai full-stack. Setiap pelajaran diakhiri checkpoint; pelajaran berikutnya terbuka setelah checkpoint lulus."
      />
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m, i) => {
          const available = m.lessons.length > 0
          const p = moduleProgress(state, m)
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-300">
                  {String(i + 1).padStart(2, '0')}
                </div>
                {available ? (
                  p.percent === 100 ? <Badge tone="emerald"><CheckCircle2 className="size-3" /> Selesai</Badge> : <Badge tone="indigo">{m.lessons.length} pelajaran</Badge>
                ) : (
                  <PhaseBadge phase={m.phase} />
                )}
              </div>
              <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">{m.title}</h2>
              <p className="muted mt-1 text-sm">{m.description}</p>
              {m.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.skills.map((s) => <Badge key={s}>{skillById[s].name}</Badge>)}
                </div>
              )}
              <div className="mt-4">
                {available ? (
                  <>
                    <div className="mb-1.5 flex justify-between text-xs"><span className="muted">Progres</span><span className="font-medium">{p.passed}/{p.total}</span></div>
                    <ProgressBar value={p.percent} label={`Progres ${m.title}`} />
                  </>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-slate-500"><Lock className="size-3.5" /> Materi disusun pada Phase {m.phase}</p>
                )}
              </div>
            </>
          )
          return (
            <li key={m.id}>
              {available ? (
                <Link to={`/learn/${m.id}`} className="card card-hover group relative block h-full p-5">
                  {content}
                </Link>
              ) : (
                <div className="card h-full p-5 opacity-70" aria-disabled="true">{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}
