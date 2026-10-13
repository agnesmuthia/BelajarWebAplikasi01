import { ArrowLeft, BookOpen, CheckCircle2, Circle, Clock, Download, FolderPlus, ListChecks, ShieldAlert, Target } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FileExplorer } from '../components/FileExplorer'
import { Modal } from '../components/Modal'
import { ACCENT } from '../components/ProjectCards'
import { Badge, SectionTitle, cx } from '../components/ui'
import { findLesson, ALL_LESSONS } from '../data/curriculum'
import { findTemplate } from '../data/projects'
import { skillById } from '../data/skills'
import { downloadProjectZip } from '../lib/download'
import { isLessonPassed } from '../lib/progress'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import NotFound from './NotFound'

export default function TemplateDetail() {
  const { templateId = '' } = useParams()
  const tpl = findTemplate(templateId)
  const { state, createProject } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  if (!tpl) return <NotFound />
  const existing = state.projects.filter((p) => p.templateId === tpl.id)
  const recommended = tpl.recommendedLessons.map((id) => findLesson(id)).filter((l): l is (typeof ALL_LESSONS)[number] => Boolean(l))
  const ready = recommended.every((l) => isLessonPassed(state, l.id))

  const start = (e: FormEvent) => {
    e.preventDefault()
    const id = createProject(tpl.id, name || tpl.title)
    toast('Proyek dibuat. Selamat membangun!')
    navigate(`/projects/${id}`)
  }

  return (
    <div className="space-y-6">
      <Link to="/projects?tab=library" className="btn-ghost -ml-2"><ArrowLeft className="size-4" /> Project Library</Link>

      <header className={cx('relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white sm:p-8', ACCENT[tpl.accent])}>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,#fff3,transparent_55%)]" />
        <div className="relative">
          <div className="text-xs font-semibold tracking-wider uppercase opacity-90">{tpl.category}</div>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{tpl.title}</h1>
          <p className="mt-2 max-w-2xl text-white/90">{tpl.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="chip bg-white/20">{tpl.difficulty}</span>
            <span className="chip bg-white/20"><Clock className="size-3" /> ±{tpl.estimatedHours} jam</span>
            {tpl.technologies.map((t) => <span key={t} className="chip bg-white/20">{t}</span>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn bg-white text-slate-900 hover:bg-white/90" onClick={() => { setName(tpl.title); setOpen(true) }}>
              <FolderPlus className="size-4" /> Mulai proyek ini
            </button>
            <button className="btn bg-white/15 text-white hover:bg-white/25" onClick={() => downloadProjectZip(tpl.title, tpl.files)}>
              <Download className="size-4" /> Unduh starter (ZIP)
            </button>
          </div>
          {existing.length > 0 && (
            <p className="mt-3 text-sm text-white/90">
              Kamu sudah punya {existing.length} proyek dari template ini —{' '}
              <Link to={`/projects/${existing[0].id}`} className="font-semibold underline">lanjutkan</Link>.
            </p>
          )}
        </div>
      </header>

      {tpl.notice && (
        <div role="note" className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" /> {tpl.notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <SectionTitle><span className="flex items-center gap-2"><Target className="size-4 text-indigo-500" /> Tujuan pembelajaran</span></SectionTitle>
          <ul className="space-y-2 text-sm">
            {tpl.objectives.map((o) => <li key={o} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-indigo-500" /> {o}</li>)}
          </ul>
          <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-900 dark:text-white">Kebutuhan fitur</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {tpl.requirements.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </section>

        <section className="card p-5">
          <SectionTitle><span className="flex items-center gap-2"><BookOpen className="size-4 text-violet-500" /> Persiapan</span></SectionTitle>
          <p className="muted mb-3 text-sm">{ready ? 'Semua pelajaran yang disarankan sudah lulus. Kamu siap!' : 'Disarankan menyelesaikan pelajaran ini dulu (tidak wajib):'}</p>
          <ul className="space-y-2">
            {recommended.map((l) => {
              const done = isLessonPassed(state, l.id)
              return (
                <li key={l.id}>
                  <Link to={`/learn/${l.moduleId}/${l.id}`} className="flex items-center gap-2 text-sm hover:underline">
                    {done ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4 text-slate-400" />}
                    {l.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="card p-5">
        <SectionTitle><span className="flex items-center gap-2"><ListChecks className="size-4 text-cyan-500" /> Daftar tugas ({tpl.tasks.length})</span></SectionTitle>
        <ol className="grid gap-3 md:grid-cols-2">
          {tpl.tasks.map((t, i) => (
            <li key={t.id} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <div className="text-sm font-medium text-slate-900 dark:text-white">{i + 1}. {t.title}</div>
              <p className="muted mt-1 text-sm">{t.detail}</p>
              {t.skills.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{t.skills.map((s) => <Badge key={s}>{skillById[s].name}</Badge>)}</div>}
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <SectionTitle>Starter files</SectionTitle>
        <FileExplorer files={tpl.files} title={tpl.id} />
      </section>

      <section className="card p-5">
        <SectionTitle>Rubrik penilaian</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 uppercase dark:text-slate-400">
              <tr><th className="py-2 pr-4">Kriteria</th><th className="py-2 pr-4">Bobot</th><th className="py-2">Indikator</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {tpl.rubric.map((r) => (
                <tr key={r.criterion}><td className="py-2 pr-4 font-medium">{r.criterion}</td><td className="py-2 pr-4">{r.points}</td><td className="muted py-2">{r.description}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Mulai proyek baru">
        <form onSubmit={start} className="space-y-4">
          <div>
            <label htmlFor="nama-proyek" className="mb-1.5 block text-sm font-medium">Nama proyek</label>
            <input id="nama-proyek" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoFocus />
            <p className="muted mt-1.5 text-xs">Contoh: “Website SMAN 3 Takalar — versi 1”. Bisa diubah nanti.</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Batal</button>
            <button className="btn-primary" disabled={!name.trim()}>Buat proyek</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
