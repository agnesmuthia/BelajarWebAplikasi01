import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import { Badge, PageHeader, cx } from '../components/ui'
import { CURRENT_PHASE } from '../data/modes'

const PHASES = [
  { n: 1, title: 'Foundation', items: ['Dashboard & navigasi', 'Learning Path dengan checkpoint', 'Project Library (3 proyek pertama)', 'Project Workspace dasar', 'Skill Tracker berbasis bukti', 'Penyimpanan progres lokal + backup'] },
  { n: 2, title: 'Coding Lab', items: ['Editor HTML/CSS/JS (CodeMirror)', 'Run, Reset, Format', 'Console & tampilan error', 'Tantangan debugging', 'Perbandingan hasil yang diharapkan vs aktual', 'Modul JavaScript & DOM'] },
  { n: 3, title: 'Project Workspace', items: ['Editor multi-file dengan pohon folder', 'Membuat, mengganti nama, memindahkan, dan menghapus file/folder', 'Impor file, folder, dan ZIP dari komputer (pilih atau drag & drop)', 'Preview multi-halaman dengan gambar & aset proyek', 'Checkpoint lokal (mirip commit) dengan diff dan pemulihan', 'Pemeriksaan otomatis aksesibilitas & file yang hilang'] },
  { n: 4, title: 'Git & GitHub', items: ['Simulator terminal Git dengan 8 misi terperiksa otomatis', 'GitHub Learning Center level 1–4', 'Integrations: data GitHub publik (profil, repo, branch, commit, Actions) tanpa token', 'Rencana & panduan GitHub App izin minimum (akses tulis aktif setelah backend tersedia)'] },
  { n: 5, title: 'Local Workflow', items: ['Pemeriksa kesiapan komputer (Git, Node.js, npm, VS Code)', 'Panduan VS Code, terminal, dan development server', 'Folder lokal ↔ proyek DevStudio lewat File System Access API (dengan izin)', 'Folder lokal ↔ GitHub', 'Panduan Claude Code yang aman'] },
  { n: 6, title: 'Deployment', items: ['Deployment Academy: 6 pelajaran (localhost → domain, monitoring, biaya)', 'Perbandingan GitHub Pages, Netlify, Vercel bertanggal & bersumber', 'Pemeriksaan “Siap deploy?” & file konfigurasi otomatis', 'Penganalisis build log & pembuat record DNS', 'CI dan workflow deploy manual untuk DevStudio sendiri'] },
  { n: 7, title: 'Full-Stack', items: ['Autentikasi & database (mis. Supabase)', 'Row Level Security', 'API & serverless functions', 'AI Coding Mentor melalui backend aman'] },
  { n: 8, title: 'Polish', items: ['Testing menyeluruh', 'Audit aksesibilitas & keamanan', 'Optimasi performa', 'Dokumentasi'] },
]

export default function Roadmap() {
  return (
    <>
      <PageHeader title="Roadmap" description="DevStudio dibangun bertahap. Fitur yang belum tersedia ditandai dengan nomor fasenya — tidak ada tombol yang hanya terlihat berfungsi." />
      <ol className="space-y-4">
        {PHASES.map((p) => {
          const state = p.n < CURRENT_PHASE ? 'done' : p.n === CURRENT_PHASE ? 'current' : 'next'
          const Icon = state === 'done' ? CheckCircle2 : state === 'current' ? CircleDot : Circle
          return (
            <li key={p.n} className={cx('card flex gap-4 p-5', state === 'current' && 'ring-2 ring-indigo-500/40')}>
              <Icon className={cx('mt-0.5 size-6 shrink-0', state === 'next' ? 'text-slate-400' : 'text-indigo-500 dark:text-cyan-300')} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-900 dark:text-white">Phase {p.n} — {p.title}</h2>
                  {state === 'current' && <Badge tone="indigo">Versi saat ini</Badge>}
                </div>
                <ul className="muted mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  {p.items.map((i) => <li key={i} className="flex gap-2"><span aria-hidden>•</span>{i}</li>)}
                </ul>
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}
