import { BookOpen, CheckCircle2, Compass, ExternalLink, FileSearch, Globe, Info, Lock, Rocket, Search, Server, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, PageHeader, SectionTitle, cx } from '../components/ui'
import { findModule } from '../data/curriculum'
import { analyzeLog, firstErrorLine } from '../deploy/buildLog'
import { DeployReadiness } from '../deploy/DeployReadiness'
import { CHECKED_AT, PLATFORMS, dnsRecords, findPlatform, recommend, type ChooserInput, type PlatformId } from '../deploy/hosting'
import { isLessonPassed, isLessonUnlocked } from '../lib/progress'
import { safeHttpUrl } from '../lib/storage'
import { useStore } from '../lib/store'

const LEVELS: { n: number; title: string; lessons: string[]; note?: string }[] = [
  { n: 1, title: 'Localhost', lessons: ['deploy-1'] },
  { n: 2, title: 'Free Static Hosting', lessons: ['deploy-2', 'deploy-3'] },
  { n: 3, title: 'Automatic Deployment', lessons: ['deploy-4'] },
  { n: 4, title: 'Full-Stack', lessons: [], note: 'Frontend + backend, API, database, autentikasi, Row Level Security, dan secrets di server — dibahas di Phase 7.' },
  { n: 5, title: 'Professional Hosting', lessons: ['deploy-5', 'deploy-6'] },
]

const SAMPLE_LOG = `Run npm ci
npm ERR! code EUSAGE
npm ERR! The \`npm ci\` command can only install packages when your package.json and package-lock.json are in sync.
Error: Process completed with exit code 1.`

function Chooser() {
  const [input, setInput] = useState<ChooserInput>({ kind: 'static', commercial: false, privateRepo: false, needPreviews: false })
  const rec = useMemo(() => recommend(input), [input])
  const set = <K extends keyof ChooserInput>(k: K, v: ChooserInput[K]) => setInput((i) => ({ ...i, [k]: v }))
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3 text-sm">
        <fieldset>
          <legend className="mb-1.5 font-medium">Jenis proyek</legend>
          {([['static', 'HTML/CSS/JS biasa (tanpa build)'], ['vite', 'Proyek npm/Vite (perlu build)'], ['server', 'Butuh server/database/API rahasia']] as const).map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 py-0.5"><input type="radio" name="kind" className="accent-indigo-600" checked={input.kind === v} onChange={() => set('kind', v)} /> {l}</label>
          ))}
        </fieldset>
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo-600" checked={input.commercial} onChange={(e) => set('commercial', e.target.checked)} /> Untuk klien / usaha / menghasilkan uang</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo-600" checked={input.privateRepo} onChange={(e) => set('privateRepo', e.target.checked)} /> Repository privat</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo-600" checked={input.needPreviews} onChange={(e) => set('needPreviews', e.target.checked)} /> Butuh preview untuk setiap Pull Request</label>
      </div>
      <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/[0.03]" aria-live="polite">
        <p className="muted text-xs">Saran:</p>
        <p className="mb-2 text-lg font-semibold">{rec.platform ? findPlatform(rec.platform).name : '—'}</p>
        <ul className="list-disc space-y-1 pl-5">{rec.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        {rec.warnings.map((w) => <p key={w} className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{w}</p>)}
        <p className="muted mt-3 text-xs">Saran umum berdasarkan aturan paket per {CHECKED_AT}. Keputusan akhir tetap milikmu — baca halaman harga resmi.</p>
      </div>
    </div>
  )
}

function LogAnalyzer() {
  const [log, setLog] = useState('')
  const findings = useMemo(() => (log.trim() ? analyzeLog(log) : []), [log])
  const first = useMemo(() => (log.trim() ? firstErrorLine(log) : null), [log])
  return (
    <div className="space-y-3">
      <label htmlFor="build-log" className="sr-only">Tempel build log</label>
      <textarea id="build-log" className="input min-h-36 font-mono text-xs" placeholder="Tempel build/deploy log dari GitHub Actions, Netlify, atau Vercel…" value={log} onChange={(e) => setLog(e.target.value)} spellCheck={false} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setLog(SAMPLE_LOG)}>Coba contoh log</button>
        <span className="muted text-xs">Log dianalisis di browser ini; tidak dikirim ke mana pun. Hapus token/password dari log sebelum dibagikan.</span>
      </div>
      {log.trim() && (
        <div className="space-y-2">
          {first && (
            <p className="rounded-lg bg-rose-50 p-2.5 text-xs dark:bg-rose-500/10"><b>Baris error pertama:</b> <code className="font-mono [overflow-wrap:anywhere]">{first}</code></p>
          )}
          {findings.length === 0 ? (
            <p className="muted text-sm">Belum ada pola yang dikenali. Mulailah dari baris error pertama, lalu cari pesannya di dokumentasi platform.</p>
          ) : (
            findings.map((f) => (
              <div key={f.id} className="rounded-xl border border-amber-200 p-3 text-sm dark:border-amber-500/30">
                <p className="font-semibold">{f.title}</p>
                {f.line && <code className="muted mt-1 block font-mono text-xs [overflow-wrap:anywhere]">{f.line}</code>}
                <p className="mt-1.5"><b>Penyebab:</b> {f.cause}</p>
                <p className="mt-1"><b>Perbaikan:</b> {f.fix}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function DnsBuilder() {
  const [platform, setPlatform] = useState<PlatformId>('github-pages')
  const [domain, setDomain] = useState('')
  const [target, setTarget] = useState('')
  const records = dnsRecords(platform, domain, target)
  const placeholder = platform === 'github-pages' ? 'username.github.io' : platform === 'netlify' ? 'nama-situs.netlify.app' : 'cname.vercel-dns.com'
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="dns-domain" className="mb-1 block text-xs font-medium">Domain</label>
          <input id="dns-domain" className="input" placeholder="sekolahku.sch.id" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </div>
        <div>
          <label htmlFor="dns-platform" className="mb-1 block text-xs font-medium">Platform</label>
          <select id="dns-platform" className="input" value={platform} onChange={(e) => setPlatform(e.target.value as PlatformId)}>
            {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="dns-target" className="mb-1 block text-xs font-medium">Alamat situs di platform</label>
          <input id="dns-target" className="input" placeholder={placeholder} value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500 uppercase"><tr><th className="py-1.5 pr-3">Tipe</th><th className="py-1.5 pr-3">Host</th><th className="py-1.5 pr-3">Nilai</th><th className="py-1.5">Keterangan</th></tr></thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs dark:divide-white/5">
            {records.map((r, i) => (
              <tr key={i}><td className="py-1.5 pr-3 font-semibold">{r.type}</td><td className="py-1.5 pr-3">{r.host}</td><td className="py-1.5 pr-3 [overflow-wrap:anywhere]">{r.value}</td><td className="muted py-1.5 font-sans">{r.note}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted flex items-start gap-1.5 text-xs"><Info className="mt-0.5 size-3.5 shrink-0" /> Nilai umum yang dipublikasikan platform. Jika dashboard platform menampilkan nilai berbeda, gunakan nilai dari dashboard. Hapus record lama yang bertabrakan untuk host yang sama.</p>
    </div>
  )
}

export default function DeployHub() {
  const { state } = useStore()
  const mod = findModule('deploy')!
  const byId = Object.fromEntries(mod.lessons.map((l) => [l.id, l]))
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? '')
  const project = state.projects.find((p) => p.id === projectId)
  const published = state.projects.filter((p) => p.deployUrl)

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Phase 6" title="Deployment Academy" description="Dari localhost sampai website profesional dengan domain sendiri — termasuk memilih platform, membaca build log, dan menghitung biaya." />

      <section className="card p-5">
        <SectionTitle><span className="flex items-center gap-2"><BookOpen className="size-4 text-indigo-500" /> Jalur belajar</span></SectionTitle>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {LEVELS.map((lv) => (
            <li key={lv.n} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <p className="mb-2 text-sm font-semibold">Level {lv.n} — {lv.title}</p>
              {lv.note && <p className="muted flex items-start gap-1.5 text-xs"><Lock className="mt-0.5 size-3.5 shrink-0" /> {lv.note}</p>}
              <ul className="space-y-1.5">
                {lv.lessons.map((id) => {
                  const l = byId[id]
                  const passed = isLessonPassed(state, id)
                  const unlocked = isLessonUnlocked(state, mod, id)
                  return (
                    <li key={id}>
                      {unlocked ? (
                        <Link to={`/learn/deploy/${id}`} className="flex items-center gap-2 text-sm hover:underline">
                          {passed ? <CheckCircle2 className="size-4 text-emerald-500" /> : <BookOpen className="size-4 text-violet-500" />} {l.title}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2 text-sm opacity-60"><Lock className="size-4" /> {l.title}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold"><Server className="size-4 text-cyan-500" /> Perbandingan platform hosting</h2>
          <Badge tone="amber">Dicek {CHECKED_AT} — bisa berubah</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {PLATFORMS.map((p) => (
            <article key={p.id} className="card flex flex-col p-5 text-sm">
              <h3 className="text-base font-semibold">{p.name}</h3>
              <p className="muted mt-1">{p.bestFor}</p>
              <h4 className="mt-3 text-xs font-semibold uppercase text-slate-500">Paket gratis</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5">{p.free.map((f) => <li key={f}>{f}</li>)}</ul>
              <h4 className="mt-3 text-xs font-semibold uppercase text-slate-500">Berbayar</h4>
              <p>{p.paid}</p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="muted">Komersial (gratis)</dt>
                <dd><Badge tone={p.commercialOnFree === 'ya' ? 'emerald' : p.commercialOnFree === 'tidak' ? 'rose' : 'amber'}>{p.commercialOnFree}</Badge></dd>
                <dt className="muted">Repo privat</dt><dd>{p.privateRepo}</dd>
                <dt className="muted">Server</dt><dd>{p.serverSide}</dd>
                <dt className="muted">Preview PR</dt><dd>{p.previews}</dd>
              </dl>
              <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs dark:bg-white/[0.03]">{p.commercialNote}</p>
              <div className="mt-auto pt-3">
                <p className="muted mb-2 text-[11px]">Sumber: {p.sourceNote}</p>
                <div className="flex flex-wrap gap-2">
                  <a className="btn-secondary px-3 py-1.5 text-xs" href={p.officialPricing} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /> Harga resmi</a>
                  <a className="btn-ghost px-3 py-1.5 text-xs" href={p.officialDocs} target="_blank" rel="noopener noreferrer">Dokumentasi</a>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="muted mt-3 text-xs">Waspadai vendor lock-in: fitur khusus satu platform membuat proyek sulit dipindah. Website statis tetap mudah dipindah karena kodenya ada di repository-mu.</p>
      </section>

      <section className="card p-5">
        <SectionTitle><span className="flex items-center gap-2"><Compass className="size-4 text-violet-500" /> Pilih platform untuk proyekmu</span></SectionTitle>
        <Chooser />
      </section>

      <section className="card p-5">
        <SectionTitle><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-500" /> Siap deploy? — periksa proyek</span></SectionTitle>
        {state.projects.length === 0 ? (
          <p className="muted text-sm">Belum ada proyek. <Link to="/projects?tab=library" className="underline">Mulai dari Project Library</Link>.</p>
        ) : (
          <div className="space-y-3">
            <label htmlFor="deploy-project" className="sr-only">Pilih proyek</label>
            <select id="deploy-project" className="input w-auto" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {project && <DeployReadiness key={project.id} projectId={project.id} templateId={project.templateId} />}
            {project && <Link to={`/projects/${project.id}`} className="text-sm text-indigo-600 underline dark:text-cyan-300">Buka tab Repo & Deploy proyek ini</Link>}
          </div>
        )}
      </section>

      <section className="card p-5">
        <SectionTitle><span className="flex items-center gap-2"><FileSearch className="size-4 text-amber-500" /> Penganalisis build log</span></SectionTitle>
        <LogAnalyzer />
      </section>

      <section className="card p-5">
        <SectionTitle><span className="flex items-center gap-2"><Globe className="size-4 text-cyan-500" /> Pembuat record DNS</span></SectionTitle>
        <DnsBuilder />
      </section>

      <section className="card p-5">
        <SectionTitle><span className="flex items-center gap-2"><Rocket className="size-4 text-indigo-500" /> Website yang sudah online ({published.length})</span></SectionTitle>
        {published.length === 0 ? (
          <p className="muted text-sm">Belum ada. Setelah deploy, simpan URL di tab Repo & Deploy proyek dan tandai sebagai Dipublikasikan.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {published.map((p) => (
              <li key={p.id} className={cx('flex flex-wrap items-center gap-2')}>
                <Link to={`/projects/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                <a href={safeHttpUrl(p.deployUrl) ?? undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 underline dark:text-cyan-300"><Search className="size-3.5" />{p.deployUrl}</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
