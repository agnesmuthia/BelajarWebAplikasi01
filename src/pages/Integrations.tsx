import { ExternalLink, Eye, KeyRound, Link2, Loader2, LogOut, Search, ShieldCheck, Star, Unplug, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CodeBlock } from '../components/CodeBlock'
import { Badge, PageHeader, SectionTitle, cx } from '../components/ui'
import { getRate, getUser, listRepos, onRate, type GhRepo, type GhUser, type RateInfo } from '../github/api'
import { DEMO_REPOS, DEMO_USER } from '../github/demo'
import { RepoDetail, ghHref } from '../github/RepoDetail'
import { relativeTime } from '../lib/date'
import { isGitHubUsername } from '../lib/storage'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'

function RateNote() {
  const [r, setR] = useState<RateInfo>(getRate())
  useEffect(() => onRate(setR), [])
  if (r.remaining === null) return null
  return (
    <span className={cx('text-xs', r.remaining < 10 ? 'text-amber-600 dark:text-amber-300' : 'muted')}>
      Sisa kuota GitHub tanpa login: {r.remaining}/{r.limit ?? 60}
      {r.reset ? ` · reset ${new Date(r.reset * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
    </span>
  )
}

function LinkToProject({ repo, demo }: { repo: GhRepo; demo: boolean }) {
  const { state, updateProject } = useStore()
  const toast = useToast()
  const url = `https://github.com/${repo.full_name}`
  const linked = state.projects.filter((p) => p.repoUrl.replace(/\.git$/, '').toLowerCase() === url.toLowerCase())
  if (demo) return <span className="muted text-xs">Mode DEMO tidak bisa dihubungkan ke proyek.</span>
  if (!state.projects.length) return <span className="muted text-xs">Belum ada proyek untuk dihubungkan.</span>
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={`link-${repo.id}`} className="sr-only">Hubungkan ke proyek</label>
      <select
        id={`link-${repo.id}`}
        className="input w-auto py-1 text-xs"
        value=""
        onChange={(e) => {
          const p = state.projects.find((x) => x.id === e.target.value)
          if (!p) return
          updateProject(p.id, { repoUrl: url }, `Repository GitHub dihubungkan: ${repo.full_name}`)
          toast(`“${p.name}” dihubungkan ke ${repo.full_name}.`)
        }}
      >
        <option value="">Hubungkan ke proyek…</option>
        {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {linked.map((p) => <Badge key={p.id} tone="emerald"><Link2 className="size-3" /> {p.name}</Badge>)}
    </div>
  )
}

function PublicAccount({ username, demo, onDisconnect }: { username: string; demo: boolean; onDisconnect: () => void }) {
  const [user, setUser] = useState<GhUser | null>(demo ? DEMO_USER : null)
  const [repos, setRepos] = useState<GhRepo[] | null>(demo ? DEMO_REPOS : null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    if (demo) return
    let alive = true
    setError(null)
    Promise.all([getUser(username), listRepos(username)])
      .then(([u, r]) => {
        if (!alive) return
        setUser(u)
        setRepos(r)
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [username, demo])

  const filtered = useMemo(() => (repos ?? []).filter((r) => r.name.toLowerCase().includes(q.toLowerCase())), [repos, q])

  if (error)
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>
        <button className="btn-secondary" onClick={onDisconnect}><Unplug className="size-4" /> Ganti username</button>
      </div>
    )
  if (!user || !repos) return <p className="muted text-sm"><Loader2 className="mr-2 inline size-4 animate-spin" />Memuat profil GitHub…</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        {user.avatar_url && /^https:\/\/avatars\.githubusercontent\.com\//.test(user.avatar_url) ? (
          <img src={user.avatar_url} alt="" className="size-14 rounded-full" />
        ) : (
          <div className="grid size-14 place-items-center rounded-full bg-slate-200 dark:bg-white/10"><UserRound className="size-7 text-slate-400" /></div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{user.name ?? user.login}</h3>
            <span className="muted font-mono text-sm">@{user.login}</span>
            {demo ? <Badge tone="amber">DEMO — data contoh</Badge> : <Badge tone="emerald">Data publik asli</Badge>}
          </div>
          {user.bio && <p className="muted text-sm">{user.bio}</p>}
          <p className="muted text-xs">{user.public_repos} repository publik · {user.followers} pengikut</p>
        </div>
        <div className="flex gap-2">
          {ghHref(user.html_url) && <a className="btn-secondary" href={ghHref(user.html_url)} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Profil</a>}
          <button className="btn-ghost" onClick={onDisconnect}><LogOut className="size-4" /> {demo ? 'Keluar DEMO' : 'Lepas'}</button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Repository publik ({repos.length})</h3>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <label htmlFor="repo-q" className="sr-only">Cari repository</label>
            <input id="repo-q" className="input w-48 py-1.5 pl-9" placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {repos.length === 0 ? (
          <p className="muted text-sm">Belum ada repository publik. Buat satu di github.com/new.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-white/5 dark:border-white/10">
            {filtered.map((r) => (
              <li key={r.id} className="p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === r.name ? null : r.name)} aria-expanded={open === r.name}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-indigo-700 dark:text-cyan-300">{r.name}</span>
                      {r.fork && <Badge>fork</Badge>}
                      {r.archived && <Badge>arsip</Badge>}
                      {r.language && <Badge tone="violet">{r.language}</Badge>}
                      {r.stargazers_count > 0 && <span className="muted flex items-center gap-0.5 text-xs"><Star className="size-3" />{r.stargazers_count}</span>}
                    </div>
                    {r.description && <p className="muted truncate text-sm">{r.description}</p>}
                    <p className="muted text-xs">Diperbarui {relativeTime(r.pushed_at)}</p>
                  </button>
                  <LinkToProject repo={r} demo={demo} />
                </div>
                {open === r.name && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-white/[0.03]">
                    <RepoDetail owner={r.owner.login} name={r.name} demo={demo} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function Integrations() {
  const { state, updateSettings } = useStore()
  const [input, setInput] = useState('')
  const [demo, setDemo] = useState(false)
  const username = state.settings.githubUsername
  const valid = isGitHubUsername(input.trim())

  const connect = (e: FormEvent) => {
    e.preventDefault()
    if (valid) {
      setDemo(false)
      updateSettings({ githubUsername: input.trim() })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Hubungkan DevStudio dengan GitHub. Saat ini tersedia akses baca untuk data publik — tanpa login, tanpa token, tanpa password."
        actions={<RateNote />}
      />

      <section className="card p-5 sm:p-6">
        <SectionTitle action={<Badge tone="emerald">Aktif</Badge>}>
          <span className="flex items-center gap-2"><Eye className="size-4 text-indigo-500" /> GitHub — akses baca publik</span>
        </SectionTitle>
        {username || demo ? (
          <PublicAccount
            key={(demo ? 'demo:' : '') + username}
            username={username}
            demo={demo}
            onDisconnect={() => {
              setDemo(false)
              updateSettings({ githubUsername: '' })
            }}
          />
        ) : (
          <div className="space-y-4">
            <ul className="muted list-disc space-y-1 pl-5 text-sm">
              <li>Melihat profil, repository publik, branch, commit terbaru, dan status GitHub Actions.</li>
              <li>Menghubungkan repository ke proyek DevStudio (link-nya tampil di tab Repo & Deploy).</li>
              <li>Tidak butuh login: DevStudio hanya membaca data yang memang publik di github.com. Repository privat tidak terlihat.</li>
              <li>GitHub membatasi ±60 permintaan per jam per alamat IP untuk akses tanpa login; data disimpan sementara 5 menit agar hemat.</li>
            </ul>
            <form onSubmit={connect} className="flex max-w-md flex-wrap gap-2">
              <label htmlFor="gh-user" className="sr-only">Username GitHub</label>
              <input id="gh-user" className="input flex-1" placeholder="username GitHub-mu" value={input} onChange={(e) => setInput(e.target.value)} maxLength={39} autoComplete="off" aria-invalid={input !== '' && !valid} />
              <button className="btn-primary" disabled={!valid}>Tampilkan</button>
              <button type="button" className="btn-secondary" onClick={() => setDemo(true)}>Coba data DEMO</button>
            </form>
            {input && !valid && <p className="text-xs text-rose-600 dark:text-rose-400">Username GitHub hanya berisi huruf, angka, dan tanda hubung (maks. 39 karakter).</p>}
            <p className="muted text-xs">Belum punya akun? Daftar gratis di github.com/signup dan aktifkan autentikasi dua faktor (2FA).</p>
          </div>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <SectionTitle action={<Badge tone="amber">Belum dikonfigurasi</Badge>}>
          <span className="flex items-center gap-2"><KeyRound className="size-4 text-violet-500" /> GitHub — akses tulis (commit, push, buat repository)</span>
        </SectionTitle>
        <div className="space-y-4 text-sm">
          <p>
            Agar DevStudio bisa membuat repository atau push atas namamu, dibutuhkan login resmi lewat <b>GitHub App</b> (OAuth). Login ini memerlukan
            <b> server/serverless function</b> untuk menukar kode login dengan token secara aman — token tidak boleh dibuat atau disimpan di kode frontend. DevStudio saat ini
            berjalan sepenuhnya di browser tanpa server, jadi fitur ini <b>belum aktif</b>. Server pertama dibangun bersama Deployment (Phase 6) dan Full-Stack (Phase 7).
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <h3 className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-emerald-500" /> Izin minimum yang direncanakan</h3>
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  <tr><td className="py-1.5 pr-2 font-mono">Metadata</td><td className="py-1.5">Read — wajib untuk semua GitHub App</td></tr>
                  <tr><td className="py-1.5 pr-2 font-mono">Contents</td><td className="py-1.5">Read & write — hanya repository yang kamu pilih</td></tr>
                  <tr><td className="py-1.5 pr-2 font-mono">Actions</td><td className="py-1.5">Read — menampilkan status CI</td></tr>
                  <tr><td className="py-1.5 pr-2 font-mono">Lainnya</td><td className="py-1.5">Tidak diminta (tidak ada akses ke email, org, atau semua repository)</td></tr>
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <h3 className="mb-2 font-semibold">Yang TIDAK akan pernah dilakukan</h3>
              <ul className="muted list-disc space-y-1 pl-5 text-xs">
                <li>Meminta password GitHub.</li>
                <li>Meminta kamu menempelkan Personal Access Token.</li>
                <li>Menyimpan token di source code, localStorage, atau repository.</li>
                <li>Push atau membuat repository tanpa kamu menekan tombol persetujuan.</li>
              </ul>
            </div>
          </div>
          <details className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <summary className="cursor-pointer font-medium">Panduan aktivasi (untuk nanti, setelah backend tersedia)</summary>
            <ol className="muted mt-3 list-decimal space-y-1.5 pl-5">
              <li>github.com → Settings → Developer settings → GitHub Apps → <b>New GitHub App</b>.</li>
              <li>Isi nama aplikasi, Homepage URL (alamat DevStudio-mu), dan Callback URL dari serverless function.</li>
              <li>Atur izin seperti tabel di atas; matikan Webhook jika tidak dipakai.</li>
              <li>Simpan <b>Client ID</b> sebagai environment variable publik dan <b>Client secret</b> HANYA di environment variable server (bukan di repository).</li>
              <li>Install aplikasi ke akunmu dan pilih “Only select repositories”.</li>
            </ol>
          </details>
          <div>
            <h3 className="mb-2 font-semibold">Sementara itu: push dari komputermu</h3>
            <p className="muted mb-2">Unduh ZIP proyek dari DevStudio, ekstrak, buka foldernya di VS Code, lalu jalankan di terminal (ganti USERNAME dan NAMA-REPO):</p>
            <CodeBlock lang="bash" code={`git init\ngit add .\ngit commit -m "Initial commit from DevStudio"\ngit branch -M main\ngit remote add origin https://github.com/USERNAME/NAMA-REPO.git\ngit push -u origin main`} />
            <p className="muted mt-2 text-xs">Tab Repo & Deploy di setiap proyek menampilkan perintah yang sudah terisi alamat repository-mu.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
