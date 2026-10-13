import { ArrowRight, BookOpen, CheckCircle2, Cloud, Database, Info, Layers, ListChecks, Lock, RotateCcw, Server } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TemplateCard } from '../components/ProjectCards'
import { Badge, PageHeader, ProgressBar, SectionTitle, cx } from '../components/ui'
import { findModule } from '../data/curriculum'
import { FULLSTACK_TEMPLATES } from '../data/projects'
import { SQL_CHALLENGES } from '../data/sqlChallenges'
import { ApiPanel } from '../fullstack/ApiPanel'
import { CloudSync } from '../fullstack/CloudSync'
import { CONFIG_PATH } from '../fullstack/mockApi'
import { useMockApi } from '../fullstack/useMockApi'
import { isLessonPassed, isLessonUnlocked, missingRequirements, moduleProgress } from '../lib/progress'
import { useStore } from '../lib/store'

const SqlLab = lazy(() => import('../fullstack/SqlLab').then((m) => ({ default: m.SqlLab })))

type Tab = 'overview' | 'api' | 'sql' | 'cloud' | 'checklist'

const TABS: { id: Tab; label: string; icon: typeof Server }[] = [
  { id: 'overview', label: 'Ringkasan', icon: Layers },
  { id: 'api', label: 'Mock API', icon: Server },
  { id: 'sql', label: 'SQL Lab', icon: Database },
  { id: 'cloud', label: 'Supabase & Cloud', icon: Cloud },
  { id: 'checklist', label: 'Checklist deploy', icon: ListChecks },
]

export const PLAYGROUND_CONFIG = `{
  "resources": {
    "todos": {
      "access": "owner",
      "fields": { "title": "string!", "done": "boolean" }
    },
    "produk": {
      "access": "admin-write",
      "fields": { "nama": "string!", "harga": "number!" },
      "seed": [{ "nama": "Contoh produk", "harga": 15000 }]
    },
    "komentar": {
      "access": "read-public",
      "fields": { "isi": "string!" }
    }
  },
  "admins": ["admin@contoh.id"]
}
`

const PG_KEY = 'devstudio-playground-api-config'

function readPg() {
  try {
    return localStorage.getItem(PG_KEY) ?? PLAYGROUND_CONFIG
  } catch {
    return PLAYGROUND_CONFIG
  }
}

function ApiPlayground() {
  const [text, setText] = useState(readPg)
  const api = useMockApi({ scope: 'playground', configText: text })
  const save = (v: string) => {
    setText(v)
    try {
      localStorage.setItem(PG_KEY, v)
    } catch {
      /* abaikan */
    }
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-3">
        <div className="card p-4 text-sm">
          <h2 className="font-semibold">Server latihan di browsermu</h2>
          <p className="muted mt-1">Mock API membuat REST API dari file konfigurasi: setiap resource otomatis punya GET/POST/PATCH/PUT/DELETE, validasi kolom, dan aturan akses. Ada juga endpoint <code className="font-mono">/api/auth/*</code> untuk daftar & login (password disimpan sebagai hash).</p>
          <p className="muted mt-2"><b>Ini simulasi</b> — berjalan di halaman DevStudio dan datanya hanya di browser ini. Konsepnya sama dengan backend sungguhan, tetapi tidak bisa diakses dari internet.</p>
        </div>
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs dark:border-white/10">
            <span className="font-mono">{CONFIG_PATH}</span>
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => save(PLAYGROUND_CONFIG)}><RotateCcw className="size-3.5" /> Contoh awal</button>
          </div>
          <textarea className="code-surface block h-80 w-full resize-y p-3 font-mono text-xs outline-none" value={text} onChange={(e) => save(e.target.value)} spellCheck={false} aria-label="Konfigurasi Mock API" />
          <p className="muted border-t border-slate-200 p-2 text-[11px] dark:border-white/10">Tipe kolom: "string", "number", "boolean" (+ ! = wajib). Akses: public, read-public, owner, admin-write. Email di "admins" mendapat peran admin saat mendaftar.</p>
        </div>
      </div>
      <div className="card h-[620px] overflow-hidden"><ApiPanel api={api} /></div>
    </div>
  )
}

function Overview() {
  const { state } = useStore()
  const modules = ['api', 'backend', 'database'].map((id) => findModule(id)!)
  const sqlPassed = SQL_CHALLENGES.filter((c) => state.challenges[c.id]?.passedAt).length
  return (
    <div className="space-y-6">
      <section className="card p-5">
        <SectionTitle><span className="flex items-center gap-2"><Layers className="size-4 text-indigo-500" /> Peta aplikasi full-stack</span></SectionTitle>
        <ol className="grid gap-3 text-sm md:grid-cols-4">
          {[
            ['Frontend', 'HTML, CSS, JS di browser. Menampilkan data & form.', 'Preview proyek'],
            ['API', 'Pintu masuk backend: GET/POST/PATCH/DELETE + JSON.', 'Mock API (simulasi)'],
            ['Aturan & Auth', 'Validasi, login, siapa boleh apa (401/403, RLS).', 'Mock API · Supabase Auth'],
            ['Database', 'Tabel, relasi, query SQL, backup.', 'SQL Lab (SQLite asli) · Supabase'],
          ].map(([t, d, where], i) => (
            <li key={t} className="relative rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <p className="font-semibold">{i + 1}. {t}</p>
              <p className="muted mt-1">{d}</p>
              <p className="mt-2 text-xs text-indigo-600 dark:text-cyan-300">Di DevStudio: {where}</p>
              {i < 3 && <ArrowRight className="absolute top-1/2 -right-3 hidden size-4 -translate-y-1/2 text-slate-400 md:block" aria-hidden />}
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5 text-sm">
        <SectionTitle><span className="flex items-center gap-2"><Info className="size-4 text-cyan-500" /> Apa yang nyata, apa yang simulasi</span></SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500"><tr><th className="py-1 pr-3">Fitur</th><th className="py-1 pr-3">Status</th><th className="py-1">Keterangan</th></tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              <tr><td className="py-2 pr-3 font-medium">SQL Lab</td><td className="pr-3"><Badge tone="emerald">Nyata</Badge></td><td className="muted">SQLite asli (WebAssembly) di browser. Data contoh fiktif, hilang saat halaman ditutup.</td></tr>
              <tr><td className="py-2 pr-3 font-medium">Mock API</td><td className="pr-3"><Badge tone="amber">Simulasi</Badge></td><td className="muted">Server tiruan yang berjalan di halaman DevStudio. Hash password & aturan akses sungguhan, tetapi tidak online.</td></tr>
              <tr><td className="py-2 pr-3 font-medium">Supabase & Cloud</td><td className="pr-3"><Badge tone="emerald">Nyata · opsional</Badge></td><td className="muted">Terhubung ke proyek Supabase milikmu (butuh akun). DevStudio tidak punya server sendiri.</td></tr>
              <tr><td className="py-2 pr-3 font-medium">AI Coding Mentor</td><td className="pr-3"><Badge>Belum ada</Badge></td><td className="muted">Butuh backend dengan API key berbayar. Pola amannya diajarkan di pelajaran Backend (serverless function); tidak ada tombol AI palsu.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle>Jalur belajar</SectionTitle>
        <div className="grid gap-4 md:grid-cols-3">
          {modules.map((m) => {
            const p = moduleProgress(state, m)
            return (
              <div key={m.id} className="card p-4 text-sm">
                <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{m.title}</h3><span className="muted text-xs">{p.passed}/{p.total}</span></div>
                <ProgressBar value={p.percent} label={`Progres ${m.title}`} className="my-2" />
                <ul className="space-y-1">
                  {m.lessons.map((l) => {
                    const open = isLessonUnlocked(state, m, l.id)
                    return (
                      <li key={l.id}>
                        {open ? (
                          <Link to={`/learn/${m.id}/${l.id}`} className="flex items-center gap-2 hover:underline">{isLessonPassed(state, l.id) ? <CheckCircle2 className="size-4 text-emerald-500" /> : <BookOpen className="size-4 text-violet-500" />} {l.title}</Link>
                        ) : (
                          <span className="locked flex items-center gap-2"><Lock className="size-4" /> {l.title}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
        <p className="muted mt-2 text-xs">SQL Lab: {sqlPassed}/{SQL_CHALLENGES.length} tantangan lulus.</p>
      </section>

      <section>
        <SectionTitle>Proyek full-stack</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {FULLSTACK_TEMPLATES.map((t) => <TemplateCard key={t.id} template={t} lockedBy={missingRequirements(state, t)} />)}
        </div>
      </section>
    </div>
  )
}

const CHECKLIST: { title: string; items: string[] }[] = [
  { title: 'Sebelum deploy', items: ['Semua fitur diuji dengan simulasi error, lambat, dan offline.', 'Alamat API ada di satu konstanta/env, bukan tersebar di banyak file.', 'Tidak ada console.log berisi data pribadi atau token.', 'README menjelaskan cara menjalankan, endpoint, dan variabel lingkungan yang dibutuhkan (tanpa nilainya).'] },
  { title: 'Secrets & kunci', items: ['Frontend hanya memakai kunci publik (mis. Supabase publishable key).', 'Secret key / service_role hanya di environment variable server/serverless.', 'File .env ada di .gitignore; yang di-commit hanya .env.example tanpa nilai.', 'Jika rahasia pernah ter-commit: rotasi (buat ulang) kuncinya — menghapus commit saja tidak cukup.'] },
  { title: 'Database & akses', items: ['Row Level Security aktif di SEMUA tabel yang bisa diakses Data API.', 'Setiap tabel punya policy yang diuji dengan dua akun berbeda.', 'GRANT hanya ke peran yang butuh (authenticated, anon bila memang publik).', 'Kolom penting punya NOT NULL / CHECK / UNIQUE; owner diisi server (auth.uid()).'] },
  { title: 'Backup & migrasi', items: ['Perubahan struktur disimpan sebagai file migration SQL di repository.', 'Data penting diekspor berkala (CSV/SQL) — jangan bergantung pada paket gratis untuk backup.', 'Uji pemulihan: impor backup ke proyek percobaan.', 'Catat batas paket gratis (ukuran DB, pause saat tidak aktif) dan biaya paket berikutnya sebelum aplikasi dipakai banyak orang.'] },
  { title: 'Setelah online', items: ['Daftar akun baru di versi online dan uji alur utama dari ponsel.', 'Periksa Network tab: tidak ada request ke localhost atau /api Mock.', 'Pantau log error di dashboard hosting/Supabase minggu pertama.', 'Simpan URL produksi di proyek DevStudio sebagai bukti deployment.'] },
]

const TROUBLE: [string, string][] = [
  ['fetch("/api/...") 404 setelah deploy', 'Mock API hanya ada di DevStudio. Ganti ke URL backend sungguhan (mis. Supabase) sebelum deploy.'],
  ['Data kosong [] padahal ada di Table Editor', 'RLS aktif tanpa policy SELECT yang cocok, atau belum login. Table Editor memakai akses admin.'],
  ['permission denied / PGRST205 table not found', 'Tabel belum diberi GRANT untuk peran authenticated/anon, atau nama tabel salah.'],
  ['CORS error di console', 'Server tidak mengizinkan domain situsmu. Atur allowed origins di backend; jangan matikan CORS untuk semua domain.'],
  ['401 setelah beberapa waktu', 'Token kedaluwarsa. Login ulang atau gunakan refresh token dari layanan auth.'],
  ['Proyek Supabase tidak merespons', 'Proyek gratis bisa ter-pause bila lama tidak aktif. Aktifkan lagi dari dashboard.'],
]

function Checklist() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {CHECKLIST.map((g) => (
          <section key={g.title} className="card p-4 text-sm">
            <h2 className="mb-2 font-semibold">{g.title}</h2>
            <ul className="space-y-1.5">{g.items.map((i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-slate-400" /> {i}</li>)}</ul>
          </section>
        ))}
      </div>
      <section className="card p-4 text-sm">
        <h2 className="mb-2 font-semibold">Troubleshooting full-stack</h2>
        <dl className="divide-y divide-slate-200 dark:divide-white/10">
          {TROUBLE.map(([e, f]) => <div key={e} className="grid gap-1 py-2 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"><dt className="font-mono text-xs">{e}</dt><dd className="muted">{f}</dd></div>)}
        </dl>
      </section>
    </div>
  )
}

export default function FullStackHub() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab') as Tab | null
  const tab: Tab = raw && TABS.some((t) => t.id === raw) ? raw : 'overview'
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Phase 7" title="Full-Stack Lab" description="API, backend, database, dan autentikasi — dipraktikkan dengan Mock API, SQLite sungguhan di browser, dan (opsional) Supabase milikmu." />
      <div role="tablist" aria-label="Bagian Full-Stack Lab" className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setParams(id === 'overview' ? {} : { tab: id }, { replace: true })} className={cx('-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium', tab === id ? 'border-indigo-500 text-indigo-700 dark:text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white')}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'overview' && <Overview />}
        {tab === 'api' && <ApiPlayground />}
        {tab === 'sql' && <Suspense fallback={<p className="muted text-sm">Memuat SQL Lab…</p>}><SqlLab /></Suspense>}
        {tab === 'cloud' && <div className="mx-auto max-w-3xl"><CloudSync /></div>}
        {tab === 'checklist' && <Checklist />}
      </div>
    </div>
  )
}
