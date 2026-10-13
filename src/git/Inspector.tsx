import { ArrowRight, Cloud, FileText, GitBranch, GitCommitHorizontal, Lightbulb, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cx } from '../components/ui'
import { computeStatus, currentRepo, displayPath, filesUnder, type Repo, type SimState } from './sim'

export type InspectorTab = 'explain' | 'files' | 'repo' | 'github'

/** Diagram empat area: working directory → staging → repository lokal → remote. */
function AreasDiagram({ s }: { s: SimState }) {
  const repo = currentRepo(s)
  const st = repo ? computeStatus(s, repo) : null
  const commitCount = repo ? Object.keys(repo.commits).filter((id) => isReachable(repo, id)).length : 0
  const remoteUrl = repo?.remotes.origin
  const remote = remoteUrl ? s.remotes[remoteUrl] : undefined
  const remoteCount = remote ? Object.keys(remote.commits).length : 0
  const areas = [
    { title: 'Working directory', sub: 'file di folder', n: st ? st.unstaged.length + st.untracked.length : 0, unit: 'berubah/baru', tone: 'border-rose-400/50 bg-rose-500/5' },
    { title: 'Staging area', sub: 'setelah git add', n: st?.staged.length ?? 0, unit: 'siap commit', tone: 'border-emerald-400/50 bg-emerald-500/5' },
    { title: 'Repository lokal', sub: 'setelah git commit', n: commitCount, unit: 'commit', tone: 'border-indigo-400/50 bg-indigo-500/5' },
    { title: 'Remote (GitHub)', sub: 'setelah git push', n: remoteCount, unit: remote ? 'commit' : 'belum terhubung', tone: 'border-cyan-400/50 bg-cyan-500/5' },
  ]
  if (!repo) return <p className="muted text-xs">Belum di dalam repository. Diagram area Git muncul setelah git init atau cd ke folder repository.</p>
  return (
    <div className="grid grid-cols-2 gap-2" aria-label="Area Git">
      {areas.map((a, i) => (
        <div key={a.title} className={cx('relative rounded-xl border p-2.5', a.tone)}>
          <div className="text-[11px] font-semibold">{a.title}</div>
          <div className="muted text-[10px]">{a.sub}</div>
          <div className="mt-1 text-lg font-bold">{a.n}</div>
          <div className="muted text-[10px]">{a.unit}</div>
          {i % 2 === 0 && <ArrowRight className="absolute top-1/2 -right-2.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />}
        </div>
      ))}
    </div>
  )
}

function isReachable(repo: Repo, id: string) {
  const starts = Object.values(repo.branches).filter(Boolean) as string[]
  const seen = new Set<string>()
  const stack = [...starts]
  while (stack.length) {
    const c = stack.pop()!
    if (c === id) return true
    if (seen.has(c) || !repo.commits[c]) continue
    seen.add(c)
    stack.push(...repo.commits[c].parents)
  }
  return false
}

function CommitList({ repo, extraLabels = {} }: { repo: { commits: Repo['commits']; branches: Record<string, string | null> } ; extraLabels?: Record<string, string | null> }) {
  const reach = new Set<string>()
  const stack = Object.values(repo.branches).filter(Boolean) as string[]
  while (stack.length) {
    const c = stack.pop()!
    if (reach.has(c) || !repo.commits[c]) continue
    reach.add(c)
    stack.push(...repo.commits[c].parents)
  }
  const list = [...reach].map((id) => repo.commits[id]).sort((a, b) => b.time - a.time)
  if (!list.length) return <p className="muted text-xs">Belum ada commit.</p>
  const labels = (id: string) => [
    ...Object.entries(repo.branches).filter(([, v]) => v === id).map(([b]) => b),
    ...Object.entries(extraLabels).filter(([, v]) => v === id).map(([b]) => b),
  ]
  return (
    <ol className="relative space-y-2 border-l border-slate-300 pl-4 dark:border-white/15">
      {list.slice(0, 25).map((c) => (
        <li key={c.id} className="relative text-xs">
          <span className={cx('absolute top-1 -left-[21px] size-2.5 rounded-full ring-2 ring-white dark:ring-ink-900', c.parents.length > 1 ? 'bg-violet-500' : 'bg-indigo-500')} aria-hidden />
          <div className="flex flex-wrap items-center gap-1">
            <code className="font-mono text-indigo-600 dark:text-cyan-300">{c.id.slice(0, 7)}</code>
            {labels(c.id).map((l) => (
              <span key={l} className={cx('chip px-1.5 py-0 text-[10px]', l.includes('/') ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300')}>{l}</span>
            ))}
          </div>
          <div className="[overflow-wrap:anywhere]">{c.message}</div>
          <div className="muted">{c.author}{c.parents.length > 1 ? ' · merge commit' : ''}</div>
        </li>
      ))}
    </ol>
  )
}

function FilesPanel({ s, onEdit }: { s: SimState; onEdit: (path: string, content: string) => void }) {
  const repo = currentRepo(s)
  const root = repo?.root ?? s.cwd
  const files = filesUnder(s, root)
  const [open, setOpen] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (open && !(open in s.files)) setOpen(null)
  }, [s.files, open])

  const st = repo ? computeStatus(s, repo) : null
  const badge = (abs: string) => {
    if (!st || !repo) return null
    const rel = abs.slice(repo.root.length + 1)
    if (st.untracked.includes(rel)) return <span className="text-rose-500">U</span>
    if (st.unstaged.some((c) => c.path === rel)) return <span className="text-amber-500">M</span>
    if (st.staged.some((c) => c.path === rel)) return <span className="text-emerald-500">S</span>
    return null
  }

  return (
    <div className="space-y-2">
      <p className="muted text-xs">Folder: <span className="font-mono">{displayPath(root)}</span> · U = untracked, M = modified, S = staged</p>
      {files.length === 0 ? (
        <p className="muted text-xs">Belum ada file.</p>
      ) : (
        <ul className="space-y-0.5">
          {files.map((f) => (
            <li key={f}>
              <button onClick={() => { setOpen(f); setDraft(s.files[f]) }} className={cx('flex w-full items-center gap-2 rounded-md px-2 py-1 text-left font-mono text-xs', open === f ? 'bg-indigo-500/15 text-indigo-700 dark:text-cyan-300' : 'hover:bg-slate-100 dark:hover:bg-white/5')}>
                <FileText className="size-3.5 shrink-0 text-slate-400" />
                <span className="flex-1 truncate">{f.slice(root.length + 1)}</span>
                {badge(f)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <div className="space-y-2 rounded-lg border border-slate-200 p-2 dark:border-white/10">
          <label htmlFor="sim-edit" className="block font-mono text-xs font-medium">{open.slice(root.length + 1)}</label>
          <textarea id="sim-edit" className="input min-h-36 font-mono text-xs" value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} />
          <button className="btn-primary w-full py-1.5 text-xs" onClick={() => onEdit(open, draft)} disabled={draft === s.files[open]}><Save className="size-3.5" /> Simpan file</button>
        </div>
      )}
    </div>
  )
}

export function Inspector({ s, tab, setTab, explain, onEdit }: { s: SimState; tab: InspectorTab; setTab: (t: InspectorTab) => void; explain?: string; onEdit: (path: string, content: string) => void }) {
  const repo = currentRepo(s)
  const remotes = Object.values(s.remotes)
  const tabs: [InspectorTab, string, typeof Lightbulb][] = [
    ['explain', 'Penjelasan', Lightbulb],
    ['files', 'File', FileText],
    ['repo', 'Riwayat', GitCommitHorizontal],
    ['github', 'GitHub', Cloud],
  ]
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="tablist" aria-label="Inspeksi simulator" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-2 pt-2 dark:border-white/10">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cx('-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-1.5 text-xs font-medium', tab === id ? 'border-indigo-500 text-indigo-700 dark:text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white')}>
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {tab === 'explain' && (
          <>
            <AreasDiagram s={s} />
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-slate-800 dark:bg-amber-500/10 dark:text-slate-100" aria-live="polite">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300"><Lightbulb className="size-3.5" /> Penjelasan perintah terakhir</div>
              {explain ?? 'Jalankan sebuah perintah — penjelasannya muncul di sini.'}
            </div>
            {repo && (
              <p className="muted flex items-center gap-1.5 text-xs"><GitBranch className="size-3.5" /> Branch aktif: <b className="font-mono">{repo.head}</b> · {Object.keys(repo.branches).length} branch</p>
            )}
          </>
        )}
        {tab === 'files' && <FilesPanel s={s} onEdit={onEdit} />}
        {tab === 'repo' && (repo ? <CommitList repo={repo} extraLabels={repo.tracking} /> : <p className="muted text-xs">Belum di dalam repository.</p>)}
        {tab === 'github' && (
          <div className="space-y-4">
            <p className="muted text-xs">Simulasi GitHub — bukan github.com sungguhan. Isinya hanya berubah lewat git push atau tombol simulasi di misi.</p>
            {remotes.length === 0 ? (
              <p className="text-sm">Belum ada repository di “GitHub”.</p>
            ) : (
              remotes.map((r) => (
                <div key={r.url} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Cloud className="size-4 text-cyan-500" /> {r.owner}/{r.name}</div>
                  <code className="block text-[11px] [overflow-wrap:anywhere]">{r.url}</code>
                  <CommitList repo={r} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
