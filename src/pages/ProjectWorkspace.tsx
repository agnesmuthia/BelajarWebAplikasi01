import {
  ArrowLeft,
  Code2,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCode2,
  GitBranch,
  History,
  ListChecks,
  NotebookPen,
  Pencil,
  Rocket,
  Star,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { STATUS_LABEL, STATUS_TONE } from '../components/ProjectCards'
import { CodeBlock } from '../components/CodeBlock'
import { Badge, ProgressBar, ProgressRing, SectionTitle, cx } from '../components/ui'
import { parseRepoUrl } from '../github/api'
import { RepoDetail } from '../github/RepoDetail'
import { ConfigFileButtons, DeployReadiness } from '../deploy/DeployReadiness'
import { findTemplate, type ProjectTemplate } from '../data/projects'
import { skillById } from '../data/skills'
import { relativeTime } from '../lib/date'
import { deleteProjectData } from '../workspace/db'
import { downloadProjectFromDb } from '../workspace/exportZip'
import { ProjectFilesTab } from '../workspace/ProjectFilesTab'
import { projectProgress } from '../lib/progress'
import { isGitHubRepoUrl, safeHttpUrl } from '../lib/storage'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { ProjectStatus, UserProject } from '../lib/types'
import NotFound from './NotFound'

const TABS = [
  { id: 'tasks', label: 'Tugas & Testing', icon: ListChecks },
  { id: 'files', label: 'File', icon: FileCode2 },
  { id: 'notes', label: 'Catatan', icon: NotebookPen },
  { id: 'publish', label: 'Repo & Deploy', icon: Rocket },
  { id: 'history', label: 'Riwayat', icon: History },
] as const
type TabId = (typeof TABS)[number]['id']

function CheckItem({ checked, onToggle, title, detail, tags }: { checked: boolean; onToggle: () => void; title: string; detail?: string; tags?: string[] }) {
  return (
    <li>
      <label className={cx('flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition', checked ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5' : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20')}>
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={onToggle} />
        <span aria-hidden className={cx('mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400', checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-white/25')}>
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          <span className={cx('block text-sm font-medium', checked ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-900 dark:text-white')}>{title}</span>
          {detail && <span className="muted mt-0.5 block text-sm">{detail}</span>}
          {tags && tags.length > 0 && <span className="mt-2 flex flex-wrap gap-1">{tags.map((t) => <Badge key={t}>{t}</Badge>)}</span>}
        </span>
      </label>
    </li>
  )
}

function TasksTab({ project, tpl }: { project: UserProject; tpl: ProjectTemplate }) {
  const { toggleProjectItem } = useStore()
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section>
        <SectionTitle>Daftar tugas</SectionTitle>
        <ul className="space-y-2">
          {tpl.tasks.map((t) => (
            <CheckItem key={t.id} checked={project.tasksDone.includes(t.id)} onToggle={() => toggleProjectItem(project.id, 'tasksDone', t.id)} title={t.title} detail={t.detail} tags={t.skills.map((s) => skillById[s].name)} />
          ))}
        </ul>
      </section>
      <section>
        <SectionTitle>Checklist testing</SectionTitle>
        <p className="muted mb-3 text-sm">Uji di browser komputermu, lalu centang hanya jika benar-benar lulus.</p>
        <ul className="space-y-2">
          {tpl.testing.map((t) => (
            <CheckItem key={t.id} checked={project.testsDone.includes(t.id)} onToggle={() => toggleProjectItem(project.id, 'testsDone', t.id)} title={t.title} />
          ))}
        </ul>
      </section>
    </div>
  )
}

function NotesTab({ project }: { project: UserProject }) {
  const { updateProject } = useStore()
  const [value, setValue] = useState(project.notes)
  const [saved, setSaved] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Simpan otomatis 600 ms setelah berhenti mengetik.
  useEffect(() => {
    if (value === project.notes) return
    setSaved(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      updateProject(project.id, { notes: value })
      setSaved(true)
    }, 600)
    return () => clearTimeout(timer.current)
  }, [value, project.id, project.notes, updateProject])

  // Jangan kehilangan ketikan terakhir saat pindah tab/halaman sebelum timer berjalan.
  const latest = useRef({ value, saved: project.notes })
  latest.current = { value, saved: project.notes }
  useEffect(
    () => () => {
      if (latest.current.value !== latest.current.saved) updateProject(project.id, { notes: latest.current.value })
    },
    [project.id, updateProject],
  )

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="catatan" className="font-semibold text-slate-900 dark:text-white">Catatan pembelajaran</label>
        <span className="muted text-xs" aria-live="polite">{saved ? 'Tersimpan otomatis' : 'Menyimpan…'}</span>
      </div>
      <textarea
        id="catatan"
        className="input min-h-80 font-mono text-[13px] leading-6"
        value={value}
        maxLength={20000}
        onChange={(e) => setValue(e.target.value)}
        placeholder={'Apa yang saya pelajari hari ini?\nError apa yang saya temui dan bagaimana memperbaikinya?\nOutput `git log --oneline` sebagai bukti commit…'}
      />
      <p className="muted mt-1 text-right text-xs">{value.length.toLocaleString('id-ID')} / 20.000</p>
    </section>
  )
}

function PublishTab({ project }: { project: UserProject }) {
  const { updateProject } = useStore()
  const toast = useToast()
  const [repo, setRepo] = useState(project.repoUrl)
  const [deploy, setDeploy] = useState(project.deployUrl)

  const repoValid = repo === '' || isGitHubRepoUrl(repo)
  const deployValid = deploy === '' || safeHttpUrl(deploy)?.startsWith('https://')

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!repoValid || !deployValid) return
    const nextRepo = repo.trim()
    const nextDeploy = deploy.trim() ? safeHttpUrl(deploy) ?? '' : ''
    const events = []
    if (nextRepo !== project.repoUrl) events.push(nextRepo ? 'Repository GitHub dihubungkan' : 'Link repository dihapus')
    if (nextDeploy !== project.deployUrl) events.push(nextDeploy ? 'URL deployment disimpan' : 'URL deployment dihapus')
    updateProject(project.id, { repoUrl: nextRepo, deployUrl: nextDeploy }, events.join(' · ') || undefined)
    toast('Link disimpan.')
  }

  const repoParts = project.repoUrl && isGitHubRepoUrl(project.repoUrl) ? parseRepoUrl(project.repoUrl) : null
  const deployHref = project.deployUrl ? safeHttpUrl(project.deployUrl) : null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-4" noValidate>
        <div>
          <label htmlFor="repo" className="mb-1.5 block text-sm font-medium">URL repository GitHub</label>
          <input id="repo" className="input" placeholder="https://github.com/username/nama-repo" value={repo} onChange={(e) => setRepo(e.target.value)} aria-invalid={!repoValid} aria-describedby="repo-help" />
          <p id="repo-help" className={cx('mt-1.5 text-xs', repoValid ? 'muted' : 'text-rose-600 dark:text-rose-400')}>
            {repoValid ? 'Buat repository di github.com, lalu tempel alamatnya di sini.' : 'Format harus https://github.com/username/nama-repo'}
          </p>
        </div>
        <div>
          <label htmlFor="deploy" className="mb-1.5 block text-sm font-medium">URL website yang sudah online</label>
          <input id="deploy" className="input" placeholder="https://username.github.io/nama-repo/" value={deploy} onChange={(e) => setDeploy(e.target.value)} aria-invalid={!deployValid} aria-describedby="deploy-help" />
          <p id="deploy-help" className={cx('mt-1.5 text-xs', deployValid ? 'muted' : 'text-rose-600 dark:text-rose-400')}>
            {deployValid ? 'Isi setelah website benar-benar bisa dibuka di internet. Wajib untuk status “Dipublikasikan”.' : 'Harus berupa alamat lengkap yang diawali https://'}
          </p>
        </div>
        <button className="btn-primary" disabled={!repoValid || !deployValid}>Simpan link</button>
      </form>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><GitBranch className="size-4" /> Repository GitHub</h3>
            {repoParts && <Badge tone="emerald">Data publik</Badge>}
          </div>
          {repoParts ? (
            <RepoDetail owner={repoParts.owner} name={repoParts.repo} compact />
          ) : (
            <p className="muted text-sm">Belum terhubung. Tempel URL repository di kiri, atau pilih dari daftar repository di halaman <Link to="/integrations" className="underline">Integrations</Link>. DevStudio hanya membaca data publik; repository privat tidak bisa ditampilkan tanpa login.</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Rocket className="size-4" /> Deployment</h3>
          {deployHref ? (
            <a href={deployHref} target="_blank" rel="noopener noreferrer" className="btn-secondary"><ExternalLink className="size-4" /> Buka website</a>
          ) : (
            <p className="muted text-sm">Belum ada URL. Ikuti <Link to="/learn/deploy/deploy-2" className="underline">pelajaran GitHub Pages</Link> atau <Link to="/deploy" className="underline">Deployment Academy</Link>.</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <h3 className="mb-3 text-sm font-semibold">Siap deploy?</h3>
          <DeployReadiness projectId={project.id} templateId={project.templateId} compact />
        </div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <h3 className="mb-2 text-sm font-semibold">File konfigurasi deployment</h3>
          <ConfigFileButtons projectId={project.id} />
        </div>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <h3 className="mb-2 text-sm font-semibold">Perintah untuk push proyek ini</h3>
          <p className="muted mb-2 text-xs">Jalankan di folder hasil ekstrak ZIP proyek ini, di komputermu{repoParts ? '' : ' (ganti USERNAME/NAMA-REPO)'}. Repository di GitHub harus sudah dibuat dan masih kosong.</p>
          <CodeBlock
            lang="bash"
            code={`git init\ngit add .\ngit commit -m "Initial commit: ${project.name.replace(/["`$\\]/g, '')}"\ngit branch -M main\ngit remote add origin ${repoParts ? `https://github.com/${repoParts.owner}/${repoParts.repo}.git` : 'https://github.com/USERNAME/NAMA-REPO.git'}\ngit push -u origin main`}
          />
          <p className="muted mt-2 text-xs">DevStudio tidak menjalankan perintah ini untukmu — periksa output di terminalmu sendiri. Push berikutnya cukup: git add . → git commit -m "…" → git push.</p>
        </div>
      </div>
    </div>
  )
}

function HistoryTab({ project }: { project: UserProject }) {
  const items = [...project.history].reverse()
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-6 dark:border-white/10">
      {items.map((h, i) => (
        <li key={h.at + i} className="relative">
          <span className="absolute top-1.5 -left-[29px] size-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-ink-900" aria-hidden />
          <div className="text-sm">{h.message}</div>
          <time className="muted text-xs" dateTime={h.at}>{new Date(h.at).toLocaleString('id-ID')} · {relativeTime(h.at)}</time>
        </li>
      ))}
    </ol>
  )
}

export default function ProjectWorkspace() {
  const { projectId = '' } = useParams()
  const { state, updateProject, deleteProject } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>(state.settings.mode === 'deploy' ? 'publish' : 'tasks')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const project = state.projects.find((p) => p.id === projectId)
  const tpl = project && findTemplate(project.templateId)
  if (!project || !tpl) return <NotFound />
  const p = projectProgress(project, tpl)

  const setStatus = (status: ProjectStatus) => {
    if (status === project.status) return
    if (status === 'published' && !safeHttpUrl(project.deployUrl)) {
      toast('Simpan URL website yang sudah online (tab Repo & Deploy) sebelum menandai sebagai Dipublikasikan.', 'error')
      setTab('publish')
      return
    }
    updateProject(project.id, { status }, `Status diubah menjadi “${STATUS_LABEL[status]}”`)
  }

  const saveName = (e: FormEvent) => {
    e.preventDefault()
    const n = nameDraft.trim().slice(0, 80)
    if (n && n !== project.name) updateProject(project.id, { name: n }, `Nama diubah menjadi “${n}”`)
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      <Link to="/projects" className="btn-ghost -ml-2"><ArrowLeft className="size-4" /> My Projects</Link>

      <header className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <ProgressRing value={p.percent} label="Progres proyek" size={88} />
          <div className="min-w-0 flex-1">
            {editing ? (
              <form onSubmit={saveName} className="flex max-w-lg gap-2">
                <label htmlFor="ubah-nama" className="sr-only">Nama proyek</label>
                <input id="ubah-nama" className="input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={80} autoFocus />
                <button className="btn-primary">Simpan</button>
                <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Batal</button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{project.name}</h1>
                <button className="btn-ghost p-1.5" onClick={() => { setNameDraft(project.name); setEditing(true) }} aria-label="Ubah nama proyek"><Pencil className="size-4" /></button>
              </div>
            )}
            <p className="muted mt-1 text-sm">{tpl.title} · {tpl.difficulty} · {tpl.technologies.join(', ')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Badge>
              <span className="muted text-xs">{p.tasks}/{p.totalTasks} tugas · {p.tests}/{p.totalTests} tes</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <label htmlFor="status" className="sr-only">Status proyek</label>
            <select id="status" className="input w-auto" value={project.status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <button
              className="btn-secondary p-2.5"
              aria-pressed={project.favorite}
              aria-label={project.favorite ? 'Hapus dari favorit' : 'Tandai favorit'}
              onClick={() => updateProject(project.id, { favorite: !project.favorite })}
            >
              <Star className={cx('size-4', project.favorite && 'fill-amber-400 text-amber-400')} />
            </button>
            <button className="btn-secondary" onClick={() => void downloadProjectFromDb(project.id, project.name)}><Download className="size-4" /> ZIP</button>
            <Link to={`/projects/${project.id}/code`} className="btn-primary"><Code2 className="size-4" /> Buka editor</Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card min-w-0 p-5 sm:p-6">
          <div role="tablist" aria-label="Bagian proyek" className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px dark:border-white/10">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cx('-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition', tab === id ? 'border-indigo-500 text-indigo-700 dark:text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white')}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <div role="tabpanel">
            {tab === 'tasks' && <TasksTab project={project} tpl={tpl} />}
            {tab === 'files' && <ProjectFilesTab projectId={project.id} templateId={project.templateId} />}
            {tab === 'notes' && <NotesTab project={project} />}
            {tab === 'publish' && <PublishTab project={project} />}
            {tab === 'history' && <HistoryTab project={project} />}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <SectionTitle>Checkpoint</SectionTitle>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Semua tugas selesai', done: p.tasks === p.totalTasks },
                { label: 'Semua tes lulus', done: p.tests === p.totalTests },
                { label: 'Repository GitHub dihubungkan', done: isGitHubRepoUrl(project.repoUrl) },
                { label: 'Website online', done: Boolean(safeHttpUrl(project.deployUrl)) },
              ].map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <CheckCircle2 className={cx('size-4', c.done ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600')} /> <span className={c.done ? '' : 'muted'}>{c.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4"><ProgressBar value={p.percent} label="Progres proyek" /></div>
          </section>
          <section className="card p-5">
            <SectionTitle>Tujuan pembelajaran</SectionTitle>
            <ul className="muted list-disc space-y-1.5 pl-4 text-sm">{tpl.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
            <Link to={`/projects/library/${tpl.id}`} className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-cyan-300">Lihat brief & rubrik</Link>
          </section>
          <button className="btn-ghost w-full text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" /> Hapus proyek
          </button>
        </aside>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Hapus proyek ini?">
        <p className="muted text-sm">Progres, catatan, riwayat, file proyek, dan semua checkpoint “{project.name}” akan dihapus dari browser ini dan tidak bisa dikembalikan. Unduh ZIP dulu jika ingin menyimpannya. File di komputermu dan repository GitHub tidak terpengaruh.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Batal</button>
          <button
            className="btn bg-rose-600 text-white hover:bg-rose-500"
            onClick={() => {
              void deleteProjectData(project.id).catch(() => {})
              deleteProject(project.id)
              toast('Proyek dihapus.', 'info')
              navigate('/projects')
            }}
          >
            Hapus permanen
          </button>
        </div>
      </Modal>
    </div>
  )
}
