import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  GitCommitHorizontal,
  Lightbulb,
  ListChecks,
  Lock,
  Target,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CodeBlock } from '../components/CodeBlock'
import { RichText } from '../components/RichText'
import { SandboxedPreview } from '../components/SandboxedPreview'
import { Badge, cx } from '../components/ui'
import { findChallenge } from '../data/challenges'
import { findModule, type Lesson } from '../data/curriculum'
import { skillById } from '../data/skills'
import { isLessonPassed, isLessonUnlocked } from '../lib/progress'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import NotFound from './NotFound'

function Section({ icon: Icon, title, children, tone = 'indigo' }: { icon: typeof Target; title: string; children: ReactNode; tone?: 'indigo' | 'violet' | 'cyan' | 'amber' | 'emerald' }) {
  const tones = {
    indigo: 'text-indigo-500',
    violet: 'text-violet-500',
    cyan: 'text-cyan-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
  }
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
        <Icon className={cx('size-5', tones[tone])} aria-hidden /> {title}
      </h2>
      <div className="prose-lite text-[15px] text-slate-700 dark:text-slate-300">{children}</div>
    </section>
  )
}

function Hints({ lesson, attempts }: { lesson: Lesson; attempts: number }) {
  const { state } = useStore()
  const [shown, setShown] = useState(0)
  const locked = state.settings.mode === 'practice' && attempts === 0
  return (
    <Section icon={Lightbulb} title="Petunjuk bertahap" tone="amber">
      {locked ? (
        <p className="flex items-start gap-2 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0" /> Practice Mode aktif: coba kerjakan tantangan dan kuis checkpoint dulu. Petunjuk terbuka setelah percobaan pertama.
        </p>
      ) : (
        <>
          {shown === 0 && <p className="text-sm">Buka petunjuk satu per satu hanya jika kamu benar-benar macet.</p>}
          <ol className="mb-3 space-y-2">
            {lesson.hints.slice(0, shown).map((h, i) => (
              <li key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-500/20 dark:bg-amber-500/5">
                <span className="mr-2 font-semibold text-amber-700 dark:text-amber-300">#{i + 1}</span>
                <RichText text={h} />
              </li>
            ))}
          </ol>
          {shown < lesson.hints.length ? (
            <button className="btn-secondary" onClick={() => setShown((n) => n + 1)}>
              <Lightbulb className="size-4" /> Tampilkan petunjuk {shown + 1} dari {lesson.hints.length}
            </button>
          ) : (
            <p className="muted text-sm">Semua petunjuk sudah ditampilkan. Masih macet? Bandingkan kodemu dengan contoh di atas baris demi baris.</p>
          )}
        </>
      )}
    </Section>
  )
}

function Quiz({ lesson, codeLang }: { lesson: Lesson; codeLang: 'css' | 'js' }) {
  const { state, recordQuizAttempt } = useStore()
  const toast = useToast()
  const passed = isLessonPassed(state, lesson.id)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const attempts = state.lessons[lesson.id]?.attempts ?? 0

  const allAnswered = lesson.quiz.every((q) => answers[q.id] !== undefined)
  const isCorrect = (qid: string) => {
    const q = lesson.quiz.find((x) => x.id === qid)
    return Boolean(q && answers[qid] !== undefined && q.options[answers[qid]].correct)
  }
  const score = lesson.quiz.filter((q) => isCorrect(q.id)).length

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!allAnswered) return
    const ok = score === lesson.quiz.length
    setSubmitted(true)
    recordQuizAttempt(lesson.id, ok)
    if (ok && !passed) toast('Checkpoint lulus! Pelajaran berikutnya terbuka.')
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="quiz-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="quiz-title" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <ListChecks className="size-5 text-emerald-500" aria-hidden /> Checkpoint
        </h2>
        <div className="flex items-center gap-2">
          {attempts > 0 && <span className="muted text-xs">{attempts} percobaan</span>}
          {passed && <Badge tone="emerald"><CheckCircle2 className="size-3" /> Lulus</Badge>}
        </div>
      </div>
      <p className="muted mb-5 text-sm">Jawab semua pertanyaan dengan benar untuk lulus. Penjelasan diberikan untuk setiap jawaban yang kamu pilih.</p>
      <form onSubmit={submit} className="space-y-6">
        {lesson.quiz.map((q, qi) => {
          const chosen = answers[q.id]
          const showFeedback = submitted && chosen !== undefined
          return (
            <fieldset key={q.id} className="space-y-2">
              <legend className="mb-2 font-medium text-slate-900 dark:text-white">
                {qi + 1}. {q.prompt}
              </legend>
              {q.code && <CodeBlock code={q.code} lang={codeLang} />}
              {q.options.map((o, oi) => {
                const selected = chosen === oi
                return (
                  <label
                    key={oi}
                    className={cx(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition',
                      selected
                        ? showFeedback
                          ? o.correct
                            ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10'
                            : 'border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/10'
                          : 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/50 dark:bg-indigo-500/10'
                        : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
                    )}
                  >
                    <input
                      type="radio"
                      name={`${lesson.id}-${q.id}`}
                      className="mt-0.5 accent-indigo-600"
                      checked={selected}
                      onChange={() => {
                        setAnswers((a) => ({ ...a, [q.id]: oi }))
                        setSubmitted(false)
                      }}
                    />
                    <span>{o.text}</span>
                  </label>
                )
              })}
              {showFeedback && (
                <p role="status" className={cx('flex items-start gap-2 rounded-lg p-2 text-sm', isCorrect(q.id) ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
                  {isCorrect(q.id) ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
                  <span><RichText text={q.options[chosen].why} /></span>
                </p>
              )}
            </fieldset>
          )
        })}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
          <button className="btn-primary" disabled={!allAnswered}>Periksa jawaban</button>
          {!allAnswered && <span className="muted text-sm">Jawab {lesson.quiz.length - Object.keys(answers).length} pertanyaan lagi.</span>}
          {submitted && (
            <span className={cx('text-sm font-medium', score === lesson.quiz.length ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>
              Skor {score}/{lesson.quiz.length} — {score === lesson.quiz.length ? 'Lulus!' : 'Baca penjelasan, perbaiki jawaban yang salah, lalu periksa lagi.'}
            </span>
          )}
        </div>
      </form>
    </section>
  )
}

export default function LessonPage() {
  const { moduleId = '', lessonId = '' } = useParams()
  const { state } = useStore()
  const module = findModule(moduleId)
  const idx = module?.lessons.findIndex((l) => l.id === lessonId) ?? -1
  if (!module || idx < 0) return <NotFound />
  const lesson = module.lessons[idx]
  const prev = module.lessons[idx - 1]
  const next = module.lessons[idx + 1]
  const unlocked = isLessonUnlocked(state, module, lesson.id)
  const passed = isLessonPassed(state, lesson.id)
  const labChallenge = lesson.lab ? findChallenge(lesson.lab) : undefined

  if (!unlocked) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Lock className="mx-auto mb-3 size-8 text-slate-400" />
        <h1 className="font-semibold">Pelajaran masih terkunci</h1>
        <p className="muted mt-1 text-sm">Lulus checkpoint “{prev?.title}” terlebih dahulu.</p>
        {prev && <Link to={`/learn/${module.id}/${prev.id}`} className="btn-primary mt-4">Buka pelajaran sebelumnya</Link>}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5" key={lesson.id}>
      <Link to={`/learn/${module.id}`} className="btn-ghost -ml-2"><ArrowLeft className="size-4" /> {module.title}</Link>

      <header>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="indigo">Pelajaran {idx + 1} dari {module.lessons.length}</Badge>
          <span className="muted flex items-center gap-1"><Clock className="size-3.5" /> {lesson.minutes} menit</span>
          {lesson.skills.map((s) => <Badge key={s}>{skillById[s].name}</Badge>)}
          {passed && <Badge tone="emerald"><CheckCircle2 className="size-3" /> Lulus</Badge>}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{lesson.title}</h1>
      </header>

      <Section icon={Target} title="Tujuan">
        <p className="!mb-0">{lesson.goal}</p>
      </Section>

      <Section icon={Lightbulb} title="Konsep" tone="violet">
        {lesson.concepts.map((c, i) => <p key={i}><RichText text={c} /></p>)}
      </Section>

      <section className="card space-y-3 p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">Contoh kode</h2>
        <p className="muted text-sm">{lesson.example.caption}</p>
        <div className={cx('grid gap-4', lesson.example.previewHtml && 'lg:grid-cols-2')}>
          <div className="space-y-2">
            <CodeBlock code={lesson.example.code} lang={lesson.example.language === 'yaml' || lesson.example.language === 'sql' || lesson.example.language === 'json' ? 'text' : lesson.example.language} maxHeight={420} />
            {(lesson.example.language === 'js' || lesson.example.language === 'html') && (
              <Link to={`/lab/play/lesson-${lesson.id}`} className="btn-secondary"><FlaskConical className="size-4" /> Coba di Lab</Link>
            )}
          </div>
          {lesson.example.previewHtml && <SandboxedPreview html={lesson.example.previewHtml} title={`Hasil contoh: ${lesson.title}`} height={300} />}
        </div>
        {lesson.example.language === 'bash' && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            Perintah ini dijalankan di terminal komputermu sendiri — DevStudio tidak menjalankannya. Baris yang diawali # adalah komentar/contoh output dan tidak perlu diketik.
          </p>
        )}
      </section>

      <Section icon={FlaskConical} title="Langkah praktik" tone="cyan">
        <ol className="list-decimal space-y-2 pl-5">
          {lesson.steps.map((s, i) => <li key={i}><RichText text={s} /></li>)}
        </ol>
      </Section>

      <section className="card border-l-4 border-l-violet-500 p-5 sm:p-6">
        <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">🎯 Tantangan mandiri</h2>
        <p className="text-[15px] text-slate-700 dark:text-slate-300"><RichText text={lesson.challenge} /></p>
        {labChallenge ? (
          <Link to={`/lab/c/${labChallenge.id}`} className="btn-primary mt-4">
            <FlaskConical className="size-4" /> Kerjakan “{labChallenge.title}” di Coding Lab
            {state.challenges[labChallenge.id]?.passedAt && <CheckCircle2 className="size-4" />}
          </Link>
        ) : lesson.practice ? (
          <Link to={lesson.practice.to} className="btn-primary mt-4"><FlaskConical className="size-4" /> {lesson.practice.label}</Link>
        ) : (
          <p className="muted mt-3 text-xs">Kerjakan di VS Code di komputermu, atau bereksperimen di Playground Coding Lab.</p>
        )}
      </section>

      <Hints lesson={lesson} attempts={state.lessons[lesson.id]?.attempts ?? 0} />

      <Section icon={TriangleAlert} title="Error yang umum terjadi" tone="amber">
        <div className="space-y-2">
          {lesson.commonErrors.map((e, i) => (
            <details key={i} className="group rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <summary className="cursor-pointer text-sm font-medium text-slate-900 marker:text-slate-400 dark:text-white"><RichText text={e.error} /></summary>
              <p className="!mb-0 mt-2 text-sm"><RichText text={e.fix} /></p>
            </details>
          ))}
        </div>
      </Section>

      <Quiz lesson={lesson} codeLang={module.id === 'js' || module.id === 'dom' ? 'js' : 'css'} />

      {lesson.gitCheckpoint && (
        <Section icon={GitCommitHorizontal} title="GitHub checkpoint" tone="emerald">
          <p className="!mb-0"><RichText text={lesson.gitCheckpoint} /></p>
        </Section>
      )}

      <nav className="flex flex-wrap justify-between gap-3 pt-2" aria-label="Navigasi pelajaran">
        {prev ? (
          <Link to={`/learn/${module.id}/${prev.id}`} className="btn-secondary"><ArrowLeft className="size-4" /> {prev.title}</Link>
        ) : <span />}
        {next &&
          (passed ? (
            <Link to={`/learn/${module.id}/${next.id}`} className="btn-primary">{next.title} <ArrowRight className="size-4" /></Link>
          ) : (
            <span className="btn-secondary cursor-not-allowed opacity-60" aria-disabled="true"><Lock className="size-4" /> Lulus checkpoint untuk lanjut</span>
          ))}
      </nav>
    </div>
  )
}
