import { Award, BookOpen, FlaskConical, FolderKanban, Info } from 'lucide-react'
import { Badge, PageHeader, cx } from '../components/ui'
import { SKILL_LEVEL_LABEL, computeSkills, type SkillLevel } from '../lib/progress'
import { useStore } from '../lib/store'

const LEVEL_STEPS: SkillLevel[] = ['learning', 'practiced', 'mastered']
const LEVEL_TONE = { none: 'slate', learning: 'cyan', practiced: 'violet', mastered: 'emerald' } as const

export default function Skills() {
  const { state } = useStore()
  const skills = computeSkills(state)
  const order: SkillLevel[] = ['mastered', 'practiced', 'learning', 'none']
  const sorted = [...skills].sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))

  return (
    <>
      <PageHeader
        title="Skill Tracker"
        description="Keterampilan dinilai dari bukti pengerjaan — checkpoint yang lulus dan tugas proyek yang selesai — bukan dari jumlah materi yang dibaca."
      />

      <div className="card mb-6 flex items-start gap-3 p-4 text-sm">
        <Info className="mt-0.5 size-5 shrink-0 text-cyan-500" />
        <div className="grid flex-1 gap-2 sm:grid-cols-3">
          <div><Badge tone="cyan">Mempelajari</Badge><p className="muted mt-1">Lulus checkpoint pelajaran terkait.</p></div>
          <div><Badge tone="violet">Dipraktikkan</Badge><p className="muted mt-1">≥ 1 tugas proyek atau tantangan Coding Lab terkait (tanpa membuka solusi).</p></div>
          <div><Badge tone="emerald">Dikuasai</Badge><p className="muted mt-1">Lulus checkpoint, ≥ 1 tugas proyek, <b>dan</b> total ≥ 3 bukti praktik.</p></div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map(({ skill, level, lessons, tasks, challenges }) => {
          const step = LEVEL_STEPS.indexOf(level as never) + 1
          return (
            <article key={skill.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white">{skill.name}</h2>
                <Badge tone={LEVEL_TONE[level]}>{level === 'mastered' && <Award className="size-3" />}{SKILL_LEVEL_LABEL[level]}</Badge>
              </div>
              <p className="muted mt-1 text-sm">{skill.description}</p>
              <div className="mt-4 flex gap-1.5" role="img" aria-label={`Tingkat ${step} dari 3`}>
                {LEVEL_STEPS.map((_, i) => (
                  <div key={i} className={cx('h-1.5 flex-1 rounded-full', i < step ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' : 'bg-slate-200 dark:bg-white/10')} />
                ))}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <BookOpen className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <span className={lessons.length ? '' : 'muted'}>{lessons.length ? lessons.join(', ') : 'Belum ada checkpoint lulus'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <FlaskConical className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <span className={challenges.length ? '' : 'muted'}>{challenges.length ? `Praktik: ${challenges.join(', ')}` : 'Belum ada tantangan Coding Lab atau misi Git'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <FolderKanban className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <span className={tasks.length ? '' : 'muted'}>
                    {tasks.length ? `${tasks.length} tugas proyek: ${tasks.slice(0, 3).map((t) => t.task).join(', ')}${tasks.length > 3 ? '…' : ''}` : 'Belum ada bukti dari proyek'}
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
