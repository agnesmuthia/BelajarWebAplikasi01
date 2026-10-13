import { BookOpen, CheckCircle2, GitBranch, Lock, Monitor, Terminal as TerminalIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CodeBlock } from '../../components/CodeBlock'
import { Badge, PageHeader, ProgressBar } from '../../components/ui'
import { findModule } from '../../data/curriculum'
import { MISSIONS } from '../../data/gitMissions'
import { isLessonPassed, isLessonUnlocked } from '../../lib/progress'
import { useStore } from '../../lib/store'

const LEVELS = [
  { n: 1, title: 'Fundamental', desc: 'Git vs GitHub, terminal, config, init, status, add, commit.', lessons: ['git-1', 'git-2'] },
  { n: 2, title: 'Daily Workflow', desc: 'diff, .gitignore, README, branch, merge, konflik, remote, push, pull, clone.', lessons: [] },
  { n: 3, title: 'Professional Collaboration', desc: 'Pull request, code review, fork, issues, labels, milestones, Projects, branch protection, release, Actions.', lessons: ['git-3', 'git-4', 'git-5'] },
  { n: 4, title: 'Portfolio & Automation', desc: 'Profil & README portofolio, hosting & deploy otomatis, build log, secrets, Actions yang aman.', lessons: ['git-6', 'git-7', 'git-8'] },
] as const

const CHEATSHEET: [string, string][] = [
  ['git status', 'Apa yang berubah? (jalankan sesering mungkin)'],
  ['git add .', 'Masukkan semua perubahan ke staging'],
  ['git commit -m "Pesan"', 'Simpan titik riwayat'],
  ['git log --oneline', 'Lihat riwayat ringkas'],
  ['git diff', 'Lihat baris yang berubah'],
  ['git switch -c nama', 'Buat & pindah ke branch baru'],
  ['git merge nama', 'Gabungkan branch ke branch aktif'],
  ['git pull', 'Ambil & gabungkan perubahan dari GitHub'],
  ['git push', 'Kirim commit ke GitHub'],
  ['git restore file', 'Buang perubahan yang belum di-add'],
]

export default function GitHubCenter() {
  const { state } = useStore()
  const mod = findModule('git')!
  const lessonById = Object.fromEntries(mod.lessons.map((l) => [l.id, l]))
  const totalItems = MISSIONS.length + mod.lessons.length
  const doneItems = MISSIONS.filter((m) => state.missions[m.id]).length + mod.lessons.filter((l) => isLessonPassed(state, l.id)).length

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Phase 4"
        title="GitHub Learning Center"
        description="Belajar Git lewat simulator terminal dengan pemeriksaan otomatis, lalu terapkan alur kerja profesional di github.com."
        actions={<Link to="/github/m/sandbox" className="btn-secondary"><TerminalIcon className="size-4" /> Terminal bebas</Link>}
      />

      <div className="card p-5">
        <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{doneItems} dari {totalItems} misi & pelajaran selesai</span><span className="muted">{Math.round((doneItems / totalItems) * 100)}%</span></div>
        <ProgressBar value={(doneItems / totalItems) * 100} label="Progres GitHub Learning Center" />
        <p className="muted mt-3 text-xs">Simulator meniru Git untuk latihan; ia tidak menjalankan perintah di komputermu dan tidak terhubung ke github.com. Setiap misi diakhiri catatan cara melakukannya di komputer sungguhan.</p>
      </div>

      <ol className="space-y-6">
        {LEVELS.map((lv) => {
          const missions = MISSIONS.filter((x) => x.level === lv.n)
          return (
            <li key={lv.n} className="card p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-cyan-400/15 font-mono font-bold text-indigo-600 dark:text-cyan-300">{lv.n}</div>
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">Level {lv.n} — {lv.title}</h2>
                  <p className="muted text-sm">{lv.desc}</p>
                </div>
              </div>
              <ul className="grid gap-2 md:grid-cols-2">
                {lv.lessons.map((id) => {
                  const l = lessonById[id]
                  const passed = isLessonPassed(state, id)
                  const unlocked = isLessonUnlocked(state, mod, id)
                  const inner = (
                    <>
                      {passed ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : unlocked ? <BookOpen className="size-5 shrink-0 text-violet-500" /> : <Lock className="size-5 shrink-0 text-slate-400" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{l.title}</div>
                        <div className="muted text-xs">Pelajaran + kuis{lv.n >= 3 ? ' · praktik di github.com' : ''} · {l.minutes} mnt</div>
                      </div>
                    </>
                  )
                  return (
                    <li key={id}>
                      {unlocked ? (
                        <Link to={`/learn/git/${id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-indigo-300 dark:border-white/10 dark:hover:border-indigo-400/40">{inner}</Link>
                      ) : (
                        <div className="flex items-center gap-3 locked rounded-xl border border-slate-300 p-3 dark:border-white/15" title="Lulus pelajaran sebelumnya untuk membuka">{inner}</div>
                      )}
                    </li>
                  )
                })}
                {missions.map((x) => (
                  <li key={x.id}>
                    <Link to={`/github/m/${x.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-indigo-300 dark:border-white/10 dark:hover:border-indigo-400/40">
                      {state.missions[x.id] ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : <TerminalIcon className="size-5 shrink-0 text-cyan-500" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{x.title}</div>
                        <div className="muted text-xs">Misi simulator · {x.steps.length} langkah · {x.minutes} mnt</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ol>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><GitBranch className="size-4 text-indigo-500" /> Cheat sheet harian</h2>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {CHEATSHEET.map(([c, d]) => (
                <tr key={c}><td className="py-1.5 pr-3 font-mono text-[13px] whitespace-nowrap text-indigo-700 dark:text-cyan-300">{c}</td><td className="muted py-1.5">{d}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Monitor className="size-4 text-cyan-500" /> Menjalankan Git di komputermu</h2>
          <details className="rounded-xl border border-slate-200 p-3 dark:border-white/10" open>
            <summary className="cursor-pointer text-sm font-medium">1. Pasang Git</summary>
            <ul className="muted mt-2 list-disc space-y-1 pl-5 text-sm">
              <li><b>Windows:</b> unduh dari git-scm.com → jalankan installer dengan pilihan default. Ini juga memasang <b>Git Bash</b> dan Git Credential Manager.</li>
              <li><b>macOS:</b> buka Terminal, ketik <code className="font-mono">git --version</code> — macOS menawarkan memasang Command Line Tools.</li>
              <li><b>Linux (Ubuntu):</b> <code className="font-mono">sudo apt install git</code></li>
            </ul>
          </details>
          <details className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
            <summary className="cursor-pointer text-sm font-medium">2. Di folder mana perintah dijalankan?</summary>
            <p className="muted mt-2 text-sm">Di folder proyek. Cara tercepat: di VS Code buka folder proyek, lalu menu <b>Terminal → New Terminal</b> — terminal otomatis berada di folder itu. Cek dengan <code className="font-mono">pwd</code>.</p>
          </details>
          <details className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
            <summary className="cursor-pointer text-sm font-medium">3. Menghubungkan ke GitHub (pertama kali)</summary>
            <div className="mt-2 space-y-2">
              <p className="muted text-sm">Buat repository KOSONG di github.com (tanpa README), lalu di folder proyek:</p>
              <CodeBlock lang="bash" code={`git remote add origin https://github.com/USERNAME/NAMA-REPO.git\ngit branch -M main\ngit push -u origin main\n# Output yang diharapkan diakhiri:\n# branch 'main' set up to track 'origin/main'.`} />
              <p className="muted text-sm">Saat diminta login, pilih login lewat browser. GitHub tidak menerima password akun untuk git push. Jangan menyimpan token di file proyek.</p>
            </div>
          </details>
          <details className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
            <summary className="cursor-pointer text-sm font-medium">4. Error yang sering muncul</summary>
            <ul className="muted mt-2 space-y-1.5 text-sm">
              <li><code className="font-mono">'git' is not recognized</code> → Git belum terpasang atau terminal perlu dibuka ulang.</li>
              <li><code className="font-mono">fatal: not a git repository</code> → salah folder; cek <code className="font-mono">pwd</code>, lalu <code className="font-mono">cd</code> ke folder proyek.</li>
              <li><code className="font-mono">Author identity unknown</code> → jalankan dua perintah <code className="font-mono">git config --global</code>.</li>
              <li><code className="font-mono">! [rejected] (fetch first)</code> → jalankan <code className="font-mono">git pull</code> dulu, lalu push lagi.</li>
              <li><code className="font-mono">Permission denied / 403</code> → kamu tidak punya izin push ke repository itu (fork dulu), atau login dengan akun yang salah.</li>
            </ul>
          </details>
          <p className="muted text-xs">DevStudio tidak pernah menjalankan perintah di komputermu dan tidak mengklaim perintah berhasil — selalu baca output di terminalmu sendiri.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge tone="cyan">Lanjut: hubungkan akun di halaman Integrations</Badge>
            <Link to="/integrations" className="text-sm font-medium text-indigo-600 hover:underline dark:text-cyan-300">Buka Integrations →</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

