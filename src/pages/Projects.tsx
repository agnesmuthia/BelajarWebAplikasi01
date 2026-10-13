import { FilePlus2, FolderInput, FolderKanban, FolderPlus, Lock, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { TemplateCard, UserProjectCard } from '../components/ProjectCards'
import { Badge, EmptyState, PageHeader, cx } from '../components/ui'
import { FREE_TEMPLATE, PROJECT_CATALOG, PROJECT_TEMPLATES, findTemplate } from '../data/projects'
import { useStore } from '../lib/store'

type StatusFilter = 'all' | 'active' | 'review' | 'published' | 'favorite'

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'active', label: 'Aktif' },
  { id: 'review', label: 'Menunggu review' },
  { id: 'published', label: 'Dipublikasikan' },
  { id: 'favorite', label: 'Favorit' },
]

function Tabs({ tab, setTab, count }: { tab: string; setTab: (t: string) => void; count: number }) {
  const tabs = [
    { id: 'mine', label: `Proyek Saya (${count})` },
    { id: 'library', label: 'Project Library' },
  ]
  return (
    <div role="tablist" aria-label="Tampilan proyek" className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => setTab(t.id)}
          className={cx('rounded-lg px-4 py-1.5 text-sm font-medium transition', tab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function MyProjects({ onBrowse }: { onBrowse: () => void }) {
  const { state } = useStore()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [tech, setTech] = useState('all')
  const [level, setLevel] = useState('all')
  const [q, setQ] = useState('')

  const allTech = useMemo(() => [...new Set([...PROJECT_TEMPLATES, FREE_TEMPLATE].flatMap((t) => t.technologies))].sort(), [])
  const allLevels = useMemo(() => [...new Set(PROJECT_TEMPLATES.map((t) => t.difficulty))], [])

  const filtered = state.projects.filter((p) => {
    const tpl = findTemplate(p.templateId)
    if (status === 'favorite' ? !p.favorite : status !== 'all' && p.status !== status) return false
    if (tech !== 'all' && !tpl?.technologies.includes(tech)) return false
    if (level !== 'all' && tpl?.difficulty !== level) return false
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  if (state.projects.length === 0) {
    return (
      <EmptyState icon={FolderKanban} title="Belum ada proyek" action={<button className="btn-primary" onClick={onBrowse}><FolderPlus className="size-4" /> Pilih template proyek</button>}>
        Mulai dari salah satu dari tiga proyek pertama di Project Library. Setiap proyek punya starter code, daftar tugas, checklist testing, dan rubrik.
      </EmptyState>
    )
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              aria-pressed={status === f.id}
              onClick={() => setStatus(f.id)}
              className={cx('chip border px-3 py-1 transition', status === f.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300')}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <label htmlFor="cari-proyek" className="sr-only">Cari proyek</label>
            <input id="cari-proyek" className="input w-44 pl-9" placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <label className="sr-only" htmlFor="filter-tech">Teknologi</label>
          <select id="filter-tech" className="input w-auto" value={tech} onChange={(e) => setTech(e.target.value)}>
            <option value="all">Semua teknologi</option>
            {allTech.map((t) => <option key={t}>{t}</option>)}
          </select>
          <label className="sr-only" htmlFor="filter-level">Level</label>
          <select id="filter-level" className="input w-auto" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">Semua level</option>
            {allLevels.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="Tidak ada proyek yang cocok">Ubah atau hapus filter untuk melihat proyek lain.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => <UserProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </>
  )
}

function StartFree() {
  const { createProject } = useStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'blank' | 'import' | null>(null)
  const [name, setName] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const id = createProject(FREE_TEMPLATE.id, name)
    navigate(`/projects/${id}/code${mode === 'import' ? '?import=1' : ''}`)
  }
  return (
    <section>
      <h2 className="mb-1 font-semibold text-slate-900 dark:text-white">Proyek sendiri</h2>
      <p className="muted mb-4 text-sm">Punya ide atau proyek di komputer? Mulai dari halaman kosong, atau impor folder/ZIP — gambar, logo, dan font ikut terbawa.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="card card-hover flex items-start gap-3 p-4 text-left" onClick={() => { setName('Proyek Baru'); setMode('blank') }}>
          <FilePlus2 className="mt-0.5 size-5 shrink-0 text-indigo-500" />
          <span><span className="block font-medium text-slate-900 dark:text-white">Proyek kosong</span><span className="muted text-sm">index.html, CSS, dan JS dasar yang sudah terhubung.</span></span>
        </button>
        <button className="card card-hover flex items-start gap-3 p-4 text-left" onClick={() => { setName('Proyek dari komputer'); setMode('import') }}>
          <FolderInput className="mt-0.5 size-5 shrink-0 text-cyan-500" />
          <span><span className="block font-medium text-slate-900 dark:text-white">Impor dari komputer</span><span className="muted text-sm">Pilih folder atau ZIP. Kamu melihat pratinjau sebelum file disimpan.</span></span>
        </button>
      </div>
      <Modal open={mode !== null} onClose={() => setMode(null)} title={mode === 'import' ? 'Impor proyek dari komputer' : 'Proyek kosong'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="free-name" className="mb-1.5 block text-sm font-medium">Nama proyek</label>
            <input id="free-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
          {mode === 'import' && <p className="muted text-xs">Berikutnya kamu memilih folder/ZIP sendiri. DevStudio hanya membaca file yang kamu pilih, dan menyalinnya ke penyimpanan browser — file aslinya tidak diubah.</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setMode(null)}>Batal</button>
            <button className="btn-primary" disabled={!name.trim()}>Lanjut</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

function Library() {
  const locked = PROJECT_CATALOG.reduce((n, c) => n + c.items.length, 0)
  return (
    <div className="space-y-8">
      <StartFree />
      <section>
        <h2 className="mb-1 font-semibold text-slate-900 dark:text-white">Tiga proyek pertama</h2>
        <p className="muted mb-4 text-sm">Lengkap dengan brief, starter files, daftar tugas, checklist testing, dan rubrik penilaian.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PROJECT_TEMPLATES.map((t) => <TemplateCard key={t.id} template={t} />)}
        </div>
      </section>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">Proyek lanjutan</h2>
          <Badge tone="amber"><Lock className="size-3" /> {locked} terkunci</Badge>
        </div>
        <p className="muted mb-4 text-sm">Terbuka bertahap setelah checkpoint fase sebelumnya lulus. Daftar ini ditampilkan agar kamu bisa melihat arah perjalananmu.</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PROJECT_CATALOG.map((c) => (
            <div key={c.category} className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">{c.category}</h3>
              <ul className="space-y-1.5">
                {c.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function Projects() {
  const { state } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'library' ? 'library' : 'mine'
  const setTab = (t: string) => setParams(t === 'library' ? { tab: 'library' } : {}, { replace: true })

  return (
    <>
      <PageHeader
        title="My Projects"
        description="Kelola proyek yang sedang dikerjakan, atau mulai proyek baru dari template."
        actions={tab === 'mine' && <button className="btn-primary" onClick={() => setTab('library')}><FolderPlus className="size-4" /> Create New Project</button>}
      />
      <Tabs tab={tab} setTab={setTab} count={state.projects.length} />
      <div role="tabpanel">{tab === 'library' ? <Library /> : <MyProjects onBrowse={() => setTab('library')} />}</div>
    </>
  )
}
