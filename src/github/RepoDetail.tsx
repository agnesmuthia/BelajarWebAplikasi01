import { CheckCircle2, CircleDashed, ExternalLink, GitBranch, GitCommitHorizontal, Globe, Loader2, RefreshCw, Shield, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, cx } from '../components/ui'
import { relativeTime } from '../lib/date'
import { getRepo, listBranches, listCommits, listRuns, type GhBranch, type GhCommit, type GhRepo, type GhRun } from './api'
import { DEMO_BRANCHES, DEMO_COMMITS, DEMO_REPOS, DEMO_RUNS } from './demo'

/** Hanya izinkan link ke github.com / github.io dari data API. */
export function ghHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && (u.hostname === 'github.com' || u.hostname.endsWith('.github.io')) ? u.toString() : undefined
  } catch {
    return undefined
  }
}

export function RunBadge({ run }: { run: GhRun | undefined }) {
  if (!run) return <Badge>Belum ada workflow</Badge>
  if (run.status !== 'completed') return <Badge tone="amber"><CircleDashed className="size-3 animate-spin" /> Berjalan</Badge>
  if (run.conclusion === 'success') return <Badge tone="emerald"><CheckCircle2 className="size-3" /> CI lulus</Badge>
  return <Badge tone="rose"><XCircle className="size-3" /> CI {run.conclusion ?? 'gagal'}</Badge>
}

interface Data {
  repo: GhRepo
  branches: GhBranch[]
  runs: GhRun[]
}

export function RepoDetail({ owner, name, demo = false, compact = false }: { owner: string; name: string; demo?: boolean; compact?: boolean }) {
  const [data, setData] = useState<Data | null>(null)
  const [branch, setBranch] = useState<string | null>(null)
  const [commits, setCommits] = useState<GhCommit[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    setError(null)
    setData(null)
    ;(async () => {
      try {
        if (demo) {
          const repo = DEMO_REPOS.find((r) => r.name === name) ?? DEMO_REPOS[0]
          if (alive) setData({ repo, branches: DEMO_BRANCHES, runs: DEMO_RUNS })
          return
        }
        const repo = await getRepo(owner, name, nonce > 0)
        const [branches, runs] = await Promise.all([listBranches(owner, name), listRuns(owner, name).catch(() => ({ total_count: 0, workflow_runs: [] }))])
        if (alive) setData({ repo, branches, runs: runs.workflow_runs })
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      alive = false
    }
  }, [owner, name, demo, nonce])

  useEffect(() => {
    if (!data) return
    const b = branch ?? data.repo.default_branch
    let alive = true
    setCommits(null)
    ;(demo ? Promise.resolve(DEMO_COMMITS) : listCommits(owner, name, b))
      .then((c) => alive && setCommits(c))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [data, branch, owner, name, demo])

  if (error) return <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>
  if (!data) return <p className="muted text-sm"><Loader2 className="mr-2 inline size-4 animate-spin" />Memuat data GitHub…</p>

  const { repo } = data
  const latestRun = data.runs[0]
  const pages = repo.homepage && /^https:\/\//.test(repo.homepage) ? repo.homepage : repo.has_pages ? `https://${repo.owner.login.toLowerCase()}.github.io/${repo.name}/` : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold [overflow-wrap:anywhere]">{repo.full_name}</h3>
            {demo && <Badge tone="amber">DEMO</Badge>}
            <RunBadge run={latestRun} />
          </div>
          {repo.description && <p className="muted text-sm">{repo.description}</p>}
        </div>
        <div className="flex gap-1.5">
          {!demo && <button className="btn-ghost p-2" onClick={() => setNonce((n) => n + 1)} aria-label="Muat ulang data" title="Muat ulang (abaikan cache)"><RefreshCw className="size-4" /></button>}
          {ghHref(repo.html_url) && <a className="btn-secondary px-3 py-1.5" href={ghHref(repo.html_url)} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> GitHub</a>}
        </div>
      </div>

      {pages && (
        <p className="flex items-center gap-2 text-sm"><Globe className="size-4 text-cyan-500" />Website: {ghHref(pages) || pages.startsWith('https://') ? <a className="text-indigo-600 underline dark:text-cyan-300" href={pages} target="_blank" rel="noopener noreferrer">{pages}</a> : pages}</p>
      )}

      <div className={cx('grid gap-4', !compact && 'md:grid-cols-2')}>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <GitBranch className="size-4 text-slate-400" />
            <label htmlFor={`br-${repo.id}`} className="text-sm font-medium">Branch</label>
            <select id={`br-${repo.id}`} className="input w-auto py-1 text-xs" value={branch ?? repo.default_branch} onChange={(e) => setBranch(e.target.value)}>
              {data.branches.map((b) => <option key={b.name} value={b.name}>{b.name}{b.name === repo.default_branch ? ' (default)' : ''}</option>)}
            </select>
            {data.branches.find((b) => b.name === (branch ?? repo.default_branch))?.protected && <Badge tone="indigo"><Shield className="size-3" /> protected</Badge>}
          </div>
          {!commits ? (
            <Loader2 className="size-4 animate-spin text-slate-400" />
          ) : commits.length === 0 ? (
            <p className="muted text-sm">Belum ada commit.</p>
          ) : (
            <ul className="space-y-2">
              {commits.slice(0, compact ? 3 : 8).map((c) => (
                <li key={c.sha} className="flex items-start gap-2 text-sm">
                  <GitCommitHorizontal className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                  <div className="min-w-0">
                    <div className="truncate">{c.commit.message.split('\n')[0]}</div>
                    <div className="muted text-xs">
                      {ghHref(c.html_url) ? <a href={ghHref(c.html_url)} target="_blank" rel="noopener noreferrer" className="font-mono underline">{c.sha.slice(0, 7)}</a> : <span className="font-mono">{c.sha.slice(0, 7)}</span>}
                      {' · '}{c.author?.login ?? c.commit.author?.name}{c.commit.author?.date && ` · ${relativeTime(c.commit.author.date)}`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!compact && (
          <div>
            <h4 className="mb-2 text-sm font-medium">GitHub Actions (CI/CD)</h4>
            {data.runs.length === 0 ? (
              <p className="muted text-sm">Belum ada workflow yang berjalan. Pelajari cara menambahkannya di Level 3 (“GitHub Actions (CI)”).</p>
            ) : (
              <ul className="space-y-2">
                {data.runs.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm">
                    <RunBadge run={r} />
                    <span className="min-w-0 flex-1 truncate">{r.name} · {r.head_branch} · {r.event}</span>
                    <span className="muted shrink-0 text-xs">{relativeTime(r.created_at)}</span>
                    {ghHref(r.html_url) && <a href={ghHref(r.html_url)} target="_blank" rel="noopener noreferrer" aria-label="Buka log di GitHub" className="text-slate-400 hover:text-indigo-500"><ExternalLink className="size-3.5" /></a>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
