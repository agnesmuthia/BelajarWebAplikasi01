import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Flame,
  FlaskConical,
  FolderKanban,
  FolderPlus,
  GitBranch,
  History,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CHALLENGES } from '../data/challenges'
import { MODULES } from '../data/curriculum'
import { findTemplate } from '../data/projects'
import { Badge, EmptyState, PhaseBadge, ProgressBar, ProgressRing, SectionTitle, StatCard } from '../components/ui'
import { greeting, relativeTime } from '../lib/date'
import {
  computeSkills,
  isProjectComplete,
  moduleProgress,
  nextChallenge,
  nextLesson,
  overallLessonProgress,
  streak,
  todayCount,
  weeklyActivity,
} from '../lib/progress'
import { useStore } from '../lib/store'

const ACTIVITY_ICON = { lesson: BookOpen, task: CheckCircle2, test: CheckCircle2, project: FolderPlus, challenge: FlaskConical }

function NameForm() {
  const { updateSettings } = useStore()
  const [name, setName] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim()) updateSettings({ name: name.trim().slice(0, 60) })
  }
  return (
    <form onSubmit={submit} className="mt-3 flex max-w-sm gap-2">
      <label htmlFor="nama-pengguna" className="sr-only">Nama panggilan</label>
      <input id="nama-pengguna" className="input" placeholder="Siapa nama panggilanmu?" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <button className="btn-primary shrink-0" disabled={!name.trim()}>Simpan</button>
    </form>
  )
}

function WeeklyChart() {
  const { state } = useStore()
  const data = weeklyActivity(state)
  const max = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((a, d) => a + d.count, 0)
  return (
    <div className="card p-5">
      <SectionTitle action={<span className="muted text-xs">{total} aktivitas</span>}>Aktivitas 7 hari terakhir</SectionTitle>
      {total === 0 ? (
        <p className="muted py-8 text-center text-sm">Belum ada aktivitas minggu ini. Selesaikan checkpoint atau tugas proyek untuk mengisi grafik ini.</p>
      ) : (
        <div className="flex h-40 items-end gap-2" role="list" aria-label="Jumlah aktivitas per hari">
          {data.map((d, i) => (
            <div key={d.key} role="listitem" className="flex flex-1 flex-col items-center gap-1.5" aria-label={`${d.label}: ${d.count} aktivitas`}>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{d.count || ''}</span>
              <div
                className={`w-full max-w-10 rounded-t-md ${d.count === 0 ? 'bg-slate-200 dark:bg-white/10' : i === data.length - 1 ? 'bg-gradient-to-t from-indigo-500 to-cyan-400' : 'bg-indigo-500/70 dark:bg-indigo-400/60'}`}
                style={{ height: d.count ? Math.max(Math.round((d.count / max) * 100), 8) : 3 }}
              />
              <span className="muted text-[11px]">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { state } = useStore()
  const { name, dailyGoal } = state.settings
  const overall = overallLessonProgress(state)
  const next = nextLesson(state)
  const today = todayCount(state)
  const days = streak(state)
  const skills = computeSkills(state)
  const mastered = skills.filter((s) => s.level === 'mastered').length
  const practiced = skills.filter((s) => s.level === 'practiced' || s.level === 'mastered').length
  const active = state.projects.filter((p) => p.status !== 'published' && !isProjectComplete(p))
  const done = state.projects.length - active.length

  const nextTasks = state.projects
    .filter((p) => p.status !== 'published')
    .flatMap((p) => {
      const tpl = findTemplate(p.templateId)
      const t = tpl?.tasks.find((x) => !p.tasksDone.includes(x.id))
      return t ? [{ project: p, task: t }] : []
    })
    .slice(0, 3)

  const recent = [...state.activity].reverse().slice(0, 6)
  const nextLab = nextChallenge(state)
  const labDone = CHALLENGES.filter((c) => state.challenges[c.id]?.passedAt).length

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-gradient-to-br from-indigo-500/25 via-violet-500/20 to-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-indigo-600 dark:text-cyan-300">{greeting()}{name ? ',' : ''}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {name ? `${name} 👋` : 'Selamat datang di DevStudio'}
            </h1>
            {name ? (
              <p className="muted mt-2 max-w-xl">
                {next
                  ? <>Langkah berikutnya: <span className="font-medium text-slate-800 dark:text-slate-200">{next.lesson.title}</span> di modul {next.module.title}.</>
                  : 'Semua checkpoint yang tersedia sudah lulus. Lanjutkan proyekmu sambil menunggu modul berikutnya!'}
              </p>
            ) : (
              <>
                <p className="muted mt-2 max-w-xl">Laboratorium pribadimu untuk belajar, membangun, dan menerbitkan website. Mulai dengan memperkenalkan diri.</p>
                <NameForm />
              </>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {next ? (
                <Link to={`/learn/${next.module.id}/${next.lesson.id}`} className="btn-primary">
                  Continue Learning <ArrowRight className="size-4" />
                </Link>
              ) : (
                <Link to="/projects" className="btn-primary">Buka Projects <ArrowRight className="size-4" /></Link>
              )}
              <Link to="/projects?tab=library" className="btn-secondary">
                <FolderPlus className="size-4" /> Create New Project
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.03]">
            <ProgressRing value={Math.round((Math.min(today, dailyGoal) / dailyGoal) * 100)} label="Target hari ini">
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{today}/{dailyGoal}</div>
                <div className="muted text-[10px]">aktivitas</div>
              </div>
            </ProgressRing>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Target className="size-4 text-indigo-500" /> Target hari ini</div>
              <p className="muted max-w-[14rem] text-xs">
                {today >= dailyGoal ? 'Target tercapai! Kerja bagus.' : `Selesaikan ${dailyGoal - today} checkpoint atau tugas proyek lagi.`}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-300">
                <Flame className="size-4" /> {days} hari beruntun
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Ringkasan progres">
        <StatCard icon={BookOpen} label="Progres belajar" value={`${overall.percent}%`} hint={`${overall.passed} dari ${overall.total} checkpoint lulus`} />
        <StatCard icon={FolderKanban} label="Proyek aktif" value={active.length} hint={`${state.projects.length} proyek total`} tone="violet" />
        <StatCard icon={Trophy} label="Proyek selesai" value={done} hint="Semua tugas & tes selesai, atau dipublikasikan" tone="cyan" />
        <StatCard icon={Sparkles} label="Skill dikuasai" value={mastered} hint={`${practiced} skill sudah dipraktikkan`} tone="emerald" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WeeklyChart />

          {/* Learning path mini */}
          <section className="card p-5">
            <SectionTitle action={<Link to="/learn" className="text-xs font-medium text-indigo-600 hover:underline dark:text-cyan-300">Lihat semua</Link>}>My Learning Path</SectionTitle>
            <ul className="space-y-3">
              {MODULES.filter((m) => m.lessons.length > 0).map((m) => {
                const p = moduleProgress(state, m)
                return (
                  <li key={m.id}>
                    <Link to={`/learn/${m.id}`} className="group block rounded-xl p-2 -m-2 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-cyan-300">{m.title}</span>
                        <span className="muted text-xs">{p.passed}/{p.total}</span>
                      </div>
                      <ProgressBar value={p.percent} label={`Progres ${m.title}`} />
                    </Link>
                  </li>
                )
              })}
            </ul>
            <p className="muted mt-4 text-xs">{MODULES.filter((m) => m.lessons.length === 0).length} modul lain (JavaScript, React, API, Backend, dll.) terbuka di fase berikutnya.</p>
          </section>
        </div>

        <div className="space-y-6">
          {/* Next tasks */}
          <section className="card p-5">
            <SectionTitle>Tugas berikutnya</SectionTitle>
            {!next && !nextLab && nextTasks.length === 0 ? (
              <p className="muted text-sm">Tidak ada tugas tertunda. Mulai proyek baru dari Project Library.</p>
            ) : (
              <ul className="space-y-2">
                {next && (
                  <li>
                    <Link to={`/learn/${next.module.id}/${next.lesson.id}`} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-indigo-300 dark:border-white/[0.06] dark:hover:border-indigo-400/40">
                      <BookOpen className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{next.lesson.title}</div>
                        <div className="muted text-xs">Pelajaran · {next.lesson.minutes} menit</div>
                      </div>
                    </Link>
                  </li>
                )}
                {nextLab && (
                  <li>
                    <Link to={`/lab/c/${nextLab.id}`} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-indigo-300 dark:border-white/[0.06] dark:hover:border-indigo-400/40">
                      <FlaskConical className="mt-0.5 size-4 shrink-0 text-cyan-500" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{nextLab.title}</div>
                        <div className="muted text-xs">Coding Lab · {nextLab.kind === 'debug' ? 'Debugging' : 'Latihan'} · {nextLab.minutes} menit</div>
                      </div>
                    </Link>
                  </li>
                )}
                {nextTasks.map(({ project, task }) => (
                  <li key={project.id + task.id}>
                    <Link to={`/projects/${project.id}`} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-indigo-300 dark:border-white/[0.06] dark:hover:border-indigo-400/40">
                      <Circle className="mt-0.5 size-4 shrink-0 text-violet-500" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{task.title}</div>
                        <div className="muted truncate text-xs">{project.name}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Coding Lab */}
          <section className="card p-5">
            <SectionTitle action={<Link to="/lab" className="text-xs font-medium text-indigo-600 hover:underline dark:text-cyan-300">Buka Lab</Link>}>Coding Lab</SectionTitle>
            <div className="mb-1.5 flex justify-between text-sm"><span>{labDone} dari {CHALLENGES.length} tantangan</span><span className="muted">{Math.round((labDone / CHALLENGES.length) * 100)}%</span></div>
            <ProgressBar value={(labDone / CHALLENGES.length) * 100} label="Progres Coding Lab" />
          </section>

          {/* GitHub */}
          <section className="card p-5">
            <SectionTitle action={<PhaseBadge phase={4} />}>Aktivitas GitHub</SectionTitle>
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-white/5"><GitBranch className="size-5 text-slate-500" /></div>
              <p className="muted text-sm">
                Integrasi GitHub belum aktif, jadi tidak ada data yang ditampilkan. Sementara itu, kamu bisa menyimpan link repository di setiap proyek.{' '}
                <Link to="/roadmap" className="font-medium text-indigo-600 hover:underline dark:text-cyan-300">Lihat roadmap</Link>
              </p>
            </div>
          </section>

          {/* Recent */}
          <section className="card p-5">
            <SectionTitle>Riwayat terbaru</SectionTitle>
            {recent.length === 0 ? (
              <EmptyState icon={History} title="Belum ada riwayat">Aktivitas belajar akan tercatat di sini.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {recent.map((a, i) => {
                  const Icon = ACTIVITY_ICON[a.kind]
                  return (
                    <li key={a.at + i} className="flex items-start gap-3 text-sm">
                      <Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2">{a.label}</div>
                        <div className="muted text-xs">{relativeTime(a.at)}</div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <div className="flex justify-center">
            <Badge tone="slate">Semua data tersimpan lokal di browser ini</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
