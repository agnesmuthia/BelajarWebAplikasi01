import { AlertTriangle, BookOpenCheck, Bug, Copy, FileText, FlaskConical, GitCommitHorizontal, Info, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CodeBlock } from '../components/CodeBlock'
import { Modal } from '../components/Modal'
import { Badge, EmptyState, PageHeader, cx } from '../components/ui'
import { findTemplate } from '../data/projects'
import { explainSqlError } from '../fullstack/sql'
import { explainError } from '../lab/errorHints'
import { explainCode } from '../lab/glossary'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { buildReadme, buildTestSkeleton, COMMIT_TYPES, guessType, lintCommit, suggestCommit, type Change } from '../mentor/helpers'
import { reviewCode, type Category, type Finding } from '../mentor/review'
import { createSnapshot, listFiles, listSnapshots, seedProject, writeText, type StoredFile } from '../workspace/db'
import { diffLines, diffStats } from '../workspace/diff'

type Tab = 'review' | 'error' | 'explain' | 'commit' | 'readme' | 'test'

const TABS: { id: Tab; label: string; icon: typeof Bug }[] = [
  { id: 'review', label: 'Review kode', icon: ShieldCheck },
  { id: 'error', label: 'Jelaskan error', icon: Bug },
  { id: 'explain', label: 'Jelaskan kode', icon: BookOpenCheck },
  { id: 'commit', label: 'Pesan commit', icon: GitCommitHorizontal },
  { id: 'readme', label: 'README', icon: FileText },
  { id: 'test', label: 'Kerangka tes', icon: FlaskConical },
]

const CAT_TONE: Record<Category, 'rose' | 'violet' | 'cyan' | 'amber'> = { keamanan: 'rose', aksesibilitas: 'violet', kualitas: 'cyan', performa: 'amber' }

/** Pilih sumber kode: proyek DevStudio (file tersimpan) atau tempel manual. */
function useProjectSource() {
  const { state } = useStore()
  const [projectId, setProjectId] = useState('')
  const [files, setFiles] = useState<StoredFile[] | null>(null)
  useEffect(() => {
    if (!projectId) return setFiles(null)
    let alive = true
    const p = state.projects.find((x) => x.id === projectId)
    const tpl = p && findTemplate(p.templateId)
    void (async () => {
      if (tpl) await seedProject(projectId, tpl.files)
      const f = await listFiles(projectId)
      if (alive) setFiles(f)
    })()
    return () => {
      alive = false
    }
  }, [projectId, state.projects])
  return { projects: state.projects, projectId, setProjectId, files }
}

function ProjectPicker({ value, onChange, projects, allowPaste = true }: { value: string; onChange: (v: string) => void; projects: { id: string; name: string }[]; allowPaste?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">Sumber</span>
      <select className="input mt-1" value={value} onChange={(e) => onChange(e.target.value)}>
        {allowPaste && <option value="">Tempel kode sendiri</option>}
        {!allowPaste && <option value="">— pilih proyek —</option>}
        {projects.map((p) => <option key={p.id} value={p.id}>Proyek: {p.name}</option>)}
      </select>
    </label>
  )
}

function Review() {
  const src = useProjectSource()
  const [paste, setPaste] = useState({ html: '', css: '', js: '' })
  const [filter, setFilter] = useState<Category | 'semua'>('semua')
  const findings = useMemo<Finding[] | null>(() => {
    if (src.projectId) return src.files ? reviewCode(src.files.filter((f) => f.text !== undefined).map((f) => ({ path: f.path, text: f.text!, size: f.size }))) : null
    const files = [{ path: 'index.html', text: paste.html }, { path: 'style.css', text: paste.css }, { path: 'script.js', text: paste.js }].filter((f) => f.text.trim())
    return files.length ? reviewCode(files) : null
  }, [src.projectId, src.files, paste])
  const shown = findings?.filter((f) => filter === 'semua' || f.category === filter) ?? []
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="card h-fit space-y-3 p-4">
        <ProjectPicker value={src.projectId} onChange={src.setProjectId} projects={src.projects} />
        {!src.projectId && (['html', 'css', 'js'] as const).map((k) => (
          <label key={k} className="block text-sm">
            <span className="font-medium">{k === 'html' ? 'HTML' : k === 'css' ? 'CSS' : 'JavaScript'}</span>
            <textarea className="input mt-1 h-28 font-mono text-xs" spellCheck={false} value={paste[k]} onChange={(e) => setPaste({ ...paste, [k]: e.target.value })} />
          </label>
        ))}
        {src.projectId && <p className="muted text-sm">{src.files ? `${src.files.filter((f) => f.text !== undefined).length} file teks diperiksa.` : 'Memuat file proyek…'}</p>}
      </div>
      <div className="space-y-3">
        {!findings ? (
          <EmptyState icon={Search} title="Belum ada kode">Pilih proyek atau tempel kode untuk direview.</EmptyState>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{findings.length ? `${findings.length} temuan` : 'Tidak ada temuan dari aturan yang tersedia.'}</span>
              {findings.length > 0 && (['semua', 'keamanan', 'aksesibilitas', 'kualitas', 'performa'] as const).map((c) => (
                <button key={c} className={cx('chip', filter === c ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/10')} onClick={() => setFilter(c)} aria-pressed={filter === c}>{c} ({c === 'semua' ? findings.length : findings.filter((f) => f.category === c).length})</button>
              ))}
            </div>
            <ul className="space-y-2">
              {shown.map((f, i) => (
                <li key={`${f.id}-${f.file}-${i}`} className="card p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={f.level === 'penting' ? 'rose' : 'slate'}>{f.level}</Badge>
                    <Badge tone={CAT_TONE[f.category]}>{f.category}</Badge>
                    <span className="font-medium">{f.message}</span>
                    {f.file && <span className="muted ml-auto font-mono text-xs">{f.file}{f.line ? `:${f.line}` : ''}</span>}
                  </div>
                  <p className="mt-1.5"><b>Mengapa:</b> {f.why}</p>
                  <p className="mt-1"><b>Saran:</b> {f.fix}</p>
                </li>
              ))}
            </ul>
            <p className="muted text-xs">Mentor lokal memakai aturan tetap, bukan AI: bisa ada temuan yang keliru atau masalah yang terlewat. Tetap uji di browser, keyboard, dan ponsel.</p>
          </>
        )}
      </div>
    </div>
  )
}

function ErrorExplain() {
  const [msg, setMsg] = useState('')
  const js = msg.trim() ? explainError(msg) : null
  const sql = msg.trim() ? explainSqlError(msg) : null
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <label className="block text-sm"><span className="font-medium">Tempel pesan error (dari Console, terminal, atau SQL)</span>
        <textarea className="input mt-1 h-28 font-mono text-xs" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')" spellCheck={false} />
      </label>
      {msg.trim() && (
        <div className="card space-y-2 p-4 text-sm">
          {js && <p><b>{js.title}.</b> {js.hint}</p>}
          {sql && <p><b>Error SQL.</b> {sql}</p>}
          {!js && !sql && <p>Pesan ini belum dikenali. Langkah umum: baca baris pertama error, buka file & nomor baris yang disebut, periksa ejaan nama, lalu cari pesan persisnya di MDN atau mesin pencari. Untuk error build/deploy, gunakan <Link className="underline" to="/deploy">penganalisis build log</Link>.</p>}
        </div>
      )}
    </div>
  )
}

function CodeExplain() {
  const [code, setCode] = useState('')
  const [lang, setLang] = useState<'html' | 'css' | 'js'>('js')
  const res = code.trim() ? explainCode(code, lang) : null
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-2 p-4">
        <div className="flex gap-2">{(['html', 'css', 'js'] as const).map((l) => <button key={l} className={cx('chip', lang === l ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/10')} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}</div>
        <label className="block text-sm"><span className="sr-only">Kode</span><textarea className="input h-64 font-mono text-xs" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Tempel potongan kode…" spellCheck={false} /></label>
      </div>
      <div className="space-y-2">
        {!res ? <p className="muted text-sm">Penjelasan istilah akan muncul di sini (glosarium lokal ±150 istilah).</p> : (
          <>
            <ul className="space-y-2">{res.found.map((g) => <li key={g.term + g.kind} className="card p-3 text-sm"><span className="font-mono font-semibold">{g.term}</span> <Badge>{g.kind}</Badge><p className="mt-1">{g.text}</p></li>)}</ul>
            {res.unknown.length > 0 && <p className="muted text-xs">Belum ada di glosarium: {res.unknown.slice(0, 12).join(', ')} — cari di MDN Web Docs.</p>}
          </>
        )}
      </div>
    </div>
  )
}

function CommitHelper() {
  const src = useProjectSource()
  const [changes, setChanges] = useState<Change[] | null>(null)
  const [base, setBase] = useState('')
  const [summary, setSummary] = useState('')
  const [type, setType] = useState('')
  const [own, setOwn] = useState('')
  useEffect(() => {
    if (!src.projectId || !src.files) return setChanges(null)
    let alive = true
    void listSnapshots(src.projectId).then((snaps) => {
      if (!alive) return
      const last = [...snaps].sort((a, b) => b.id - a.id)[0]
      setBase(last ? `checkpoint “${last.message}”` : 'kondisi awal (belum ada checkpoint)')
      const before = new Map((last?.files ?? []).map((f) => [f.path, f]))
      const now = new Map(src.files!.map((f) => [f.path, f]))
      const out: Change[] = []
      for (const [p, f] of now) {
        const old = before.get(p)
        if (!old) out.push({ path: p, status: 'add', added: f.text?.split('\n').length })
        else if (old.text !== f.text || old.blobHash !== f.blobHash) {
          const d = f.text !== undefined && old.text !== undefined ? diffLines(old.text, f.text) : null
          out.push({ path: p, status: 'mod', ...(d ? diffStats(d) : {}) })
        }
      }
      for (const p of before.keys()) if (!now.has(p)) out.push({ path: p, status: 'del' })
      setChanges(out)
    })
    return () => {
      alive = false
    }
  }, [src.projectId, src.files])
  const msg = changes ? suggestCommit(changes, summary, type || guessType(changes)) : ''
  const issues = own.trim() ? lintCommit(own) : []
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-3 p-4 text-sm">
        <h2 className="font-semibold">Saran dari perubahan proyek</h2>
        <ProjectPicker value={src.projectId} onChange={src.setProjectId} projects={src.projects} allowPaste={false} />
        {changes && (
          <>
            <p className="muted">Dibandingkan dengan {base}: {changes.length} file berubah.</p>
            {changes.length === 0 && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Belum ada perubahan sejak checkpoint terakhir — tidak ada yang perlu di-commit. Ubah file di editor proyek dulu.</p>}
            <label className="block"><span className="font-medium">Apa yang kamu ubah? (bentuk perintah)</span><input className="input mt-1" value={summary} maxLength={70} onChange={(e) => setSummary(e.target.value)} placeholder="tambah form kontak dengan validasi" /></label>
            <label className="block"><span className="font-medium">Jenis</span>
              <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Otomatis ({guessType(changes)})</option>
                {Object.entries(COMMIT_TYPES).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
              </select>
            </label>
            <CodeBlock code={msg} lang="text" title="Pesan commit" />
            <p className="muted text-xs">Salin ke <code className="font-mono">git commit -m "…"</code> (judul saja) atau editor commit di VS Code. Format: Conventional Commits.</p>
          </>
        )}
      </div>
      <div className="card space-y-3 p-4 text-sm">
        <h2 className="font-semibold">Periksa pesan commit-mu</h2>
        <textarea className="input h-32 font-mono text-xs" value={own} onChange={(e) => setOwn(e.target.value)} placeholder="feat(kontak): tambah validasi email" aria-label="Pesan commit untuk diperiksa" />
        {own.trim() && (issues.length ? <ul className="space-y-1">{issues.map((x) => <li key={x} className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />{x}</li>)}</ul> : <p className="text-emerald-700 dark:text-emerald-300">Pesan sudah rapi.</p>)}
      </div>
    </div>
  )
}

function ReadmeHelper() {
  const { state, updateProject } = useStore()
  const toast = useToast()
  const src = useProjectSource()
  const [confirm, setConfirm] = useState(false)
  const p = state.projects.find((x) => x.id === src.projectId)
  const tpl = p && findTemplate(p.templateId)
  const md = p && tpl && src.files ? buildReadme({ name: p.name, description: tpl.description, technologies: tpl.technologies, features: tpl.requirements, files: src.files.map((f) => f.path), repoUrl: p.repoUrl, deployUrl: p.deployUrl, hasApi: src.files.some((f) => f.path === 'api/config.json'), notes: p.notes }) : ''
  const exists = src.files?.some((f) => f.path === 'README.md')
  const save = async () => {
    if (!p) return
    if (exists) await createSnapshot(p.id, 'Otomatis: sebelum README dari Mentor', true)
    await writeText(p.id, 'README.md', md)
    updateProject(p.id, {}, 'README.md dibuat dari templat Mentor lokal')
    toast('README.md disimpan ke proyek.')
    setConfirm(false)
  }
  return (
    <div className="space-y-3">
      <div className="card max-w-xl p-4"><ProjectPicker value={src.projectId} onChange={src.setProjectId} projects={src.projects} allowPaste={false} /></div>
      {md && (
        <>
          <CodeBlock code={md} lang="md" title="README.md (draf)" maxHeight={420} />
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => setConfirm(true)}><FileText className="size-4" /> Simpan ke proyek</button>
            <button className="btn-secondary" onClick={() => { void navigator.clipboard?.writeText(md); toast('Disalin.') }}><Copy className="size-4" /> Salin</button>
          </div>
        </>
      )}
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Simpan README.md?">
        <div className="space-y-3 text-sm">
          <p>{exists ? 'README.md yang ada akan ditimpa. Checkpoint otomatis dibuat lebih dulu sehingga versi lama bisa dipulihkan.' : 'File README.md baru akan ditambahkan ke proyek.'}</p>
          <div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => setConfirm(false)}>Batal</button><button className="btn-primary" onClick={() => void save()}>Simpan</button></div>
        </div>
      </Modal>
    </div>
  )
}

function TestHelper() {
  const [code, setCode] = useState('export function diskon(harga, persen) {\n  return harga - (harga * persen) / 100\n}\n')
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-2 p-4 text-sm">
        <p className="muted">Tempel fungsi JavaScript. Mentor membuat kerangka tes Vitest dengan tiga jenis kasus: normal, nilai batas, dan input tidak valid. <b>Nilai harapannya kamu isi sendiri</b> — di situlah proses belajarnya.</p>
        <label className="block"><span className="sr-only">Kode JavaScript</span><textarea className="input h-64 font-mono text-xs" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} /></label>
      </div>
      <CodeBlock code={buildTestSkeleton(code, 'harga.js')} lang="js" title="harga.test.js (kerangka)" maxHeight={420} />
    </div>
  )
}

export default function Mentor() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab') as Tab | null
  const tab: Tab = raw && TABS.some((t) => t.id === raw) ? raw : 'review'
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Phase 8" title="Mentor Lokal" description="Review kode, penjelasan error & istilah, pesan commit, README, dan kerangka tes — semuanya berjalan di browsermu dengan aturan tetap." />
      <p className="card flex gap-2 p-3 text-sm"><Info className="mt-0.5 size-4 shrink-0 text-cyan-500" /> <span><b>Ini bukan AI.</b> Mentor lokal memakai glosarium, aturan, dan templat buatan tangan — tidak ada kode yang dikirim ke server, dan tidak ada biaya. Mentor AI sungguhan membutuhkan backend dengan API key berbayar (lihat pelajaran <Link className="underline" to="/learn/backend/backend-1">Serverless Function</Link>).</span></p>
      <div role="tablist" aria-label="Alat mentor" className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setParams(id === 'review' ? {} : { tab: id }, { replace: true })} className={cx('-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium', tab === id ? 'border-indigo-500 text-indigo-700 dark:text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white')}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'review' && <Review />}
        {tab === 'error' && <ErrorExplain />}
        {tab === 'explain' && <CodeExplain />}
        {tab === 'commit' && <CommitHelper />}
        {tab === 'readme' && <ReadmeHelper />}
        {tab === 'test' && <TestHelper />}
      </div>
    </div>
  )
}
