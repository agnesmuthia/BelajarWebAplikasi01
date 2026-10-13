import { ArrowLeft, CheckCircle2, Clock, Lock, PlayCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { findModule } from '../data/curriculum'
import { Badge, PageHeader, ProgressBar, cx } from '../components/ui'
import { isLessonPassed, isLessonUnlocked, moduleProgress } from '../lib/progress'
import { useStore } from '../lib/store'
import NotFound from './NotFound'

export default function ModulePage() {
  const { moduleId = '' } = useParams()
  const { state } = useStore()
  const module = findModule(moduleId)
  if (!module || module.lessons.length === 0) return <NotFound />
  const p = moduleProgress(state, module)

  return (
    <>
      <Link to="/learn" className="btn-ghost mb-4 -ml-2"><ArrowLeft className="size-4" /> Learning Path</Link>
      <PageHeader eyebrow="Modul" title={module.title} description={module.description} />
      <div className="card mb-6 p-5">
        <div className="mb-2 flex justify-between text-sm"><span className="font-medium">{p.passed} dari {p.total} checkpoint lulus</span><span className="muted">{p.percent}%</span></div>
        <ProgressBar value={p.percent} label={`Progres modul ${module.title}`} />
      </div>
      <ol className="space-y-3">
        {module.lessons.map((l, i) => {
          const passed = isLessonPassed(state, l.id)
          const unlocked = isLessonUnlocked(state, module, l.id)
          const Icon = passed ? CheckCircle2 : unlocked ? PlayCircle : Lock
          const inner = (
            <>
              <Icon className={cx('size-6 shrink-0', passed ? 'text-emerald-500' : unlocked ? 'text-indigo-500 dark:text-cyan-300' : 'text-slate-400')} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="muted text-xs">Pelajaran {i + 1}</div>
                <div className="font-medium text-slate-900 dark:text-white">{l.title}</div>
                <div className="muted text-sm">{l.goal}</div>
              </div>
              <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                <span className="muted flex items-center gap-1 text-xs"><Clock className="size-3.5" /> {l.minutes} mnt</span>
                {passed ? <Badge tone="emerald">Lulus</Badge> : !unlocked && <Badge>Terkunci</Badge>}
              </div>
            </>
          )
          return (
            <li key={l.id}>
              {unlocked ? (
                <Link to={`/learn/${module.id}/${l.id}`} className="card card-hover flex items-center gap-4 p-4">{inner}</Link>
              ) : (
                <div className="card flex items-center gap-4 p-4 opacity-60" aria-disabled="true" title="Lulus checkpoint pelajaran sebelumnya untuk membuka">
                  {inner}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}
