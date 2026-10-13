import { Bug, CheckCircle2, Circle, Clock, Dumbbell, FileCode2, FlaskConical, PencilLine } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, PageHeader, ProgressBar, cx } from '../../components/ui'
import { CHALLENGES, PLAYGROUND_TEMPLATES } from '../../data/challenges'
import { findLesson } from '../../data/curriculum'
import { loadDrafts } from '../../lab/drafts'
import { isLessonPassed } from '../../lib/progress'
import { useStore } from '../../lib/store'

type Filter = 'all' | 'practice' | 'debug'

export default function LabHome() {
  const { state } = useStore()
  const [filter, setFilter] = useState<Filter>(state.settings.mode === 'debug' ? 'debug' : 'all')
  const drafts = loadDrafts()
  const passed = CHALLENGES.filter((c) => state.challenges[c.id]?.passedAt).length
  const list = CHALLENGES.filter((c) => filter === 'all' || c.kind === filter)
  const buildMode = state.settings.mode === 'build'

  const playground = (
    <section>
      <h2 className="mb-1 font-semibold text-slate-900 dark:text-white">Playground bebas</h2>
      <p className="muted mb-3 text-sm">Bereksperimen tanpa pemeriksa. Draft tersimpan otomatis per template.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {PLAYGROUND_TEMPLATES.map((t) => (
          <Link key={t.id} to={`/lab/play/${t.id}`} className="card card-hover flex items-start gap-3 p-4">
            <FileCode2 className="mt-0.5 size-5 shrink-0 text-cyan-500" />
            <div>
              <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">{t.title} {drafts[`playground:${t.id}`] && <Badge tone="violet"><PencilLine className="size-3" /> draft</Badge>}</div>
              <p className="muted text-sm">{t.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coding Lab"
        description="Tulis HTML, CSS, dan JavaScript, lihat hasilnya langsung, baca error dengan penjelasan, dan buktikan kodemu dengan pemeriksa otomatis."
      />

      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-cyan-400/15 text-indigo-600 dark:text-cyan-300"><FlaskConical className="size-6" /></div>
        <div className="flex-1">
          <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{passed} dari {CHALLENGES.length} tantangan selesai</span><span className="muted">{Math.round((passed / CHALLENGES.length) * 100)}%</span></div>
          <ProgressBar value={(passed / CHALLENGES.length) * 100} label="Progres Coding Lab" />
        </div>
      </div>

      {buildMode && playground}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">Tantangan</h2>
          <div className="flex gap-1.5" role="group" aria-label="Filter tantangan">
            {([['all', 'Semua'], ['practice', 'Latihan'], ['debug', 'Debugging']] as [Filter, string][]).map(([id, label]) => (
              <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)} className={cx('chip border px-3 py-1', filter === id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300')}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((c) => {
            const p = state.challenges[c.id]
            const lesson = c.lesson ? findLesson(c.lesson) : undefined
            const Icon = c.kind === 'debug' ? Bug : Dumbbell
            return (
              <li key={c.id}>
                <Link to={`/lab/c/${c.id}`} className="card card-hover flex h-full gap-4 p-4">
                  <div className={cx('grid size-10 shrink-0 place-items-center rounded-xl', c.kind === 'debug' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300')}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-900 dark:text-white">{c.title}</h3>
                      {p?.passedAt ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" aria-label="Selesai" /> : <Circle className="size-5 shrink-0 text-slate-300 dark:text-slate-600" aria-label="Belum selesai" />}
                    </div>
                    <p className="muted mt-0.5 text-sm">{c.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge>{c.difficulty}</Badge>
                      <Badge><Clock className="size-3" /> {c.minutes} mnt</Badge>
                      {p?.passedAt && p.solutionViewed && <Badge tone="amber">dibantu solusi</Badge>}
                      {!p?.passedAt && drafts[`challenge:${c.id}`] && <Badge tone="violet"><PencilLine className="size-3" /> sedang dikerjakan</Badge>}
                      {lesson && !isLessonPassed(state, lesson.id) && <Badge tone="slate">Disarankan: {lesson.title}</Badge>}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {!buildMode && playground}
    </div>
  )
}
