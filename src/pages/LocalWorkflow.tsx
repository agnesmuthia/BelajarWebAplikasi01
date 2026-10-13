import { Bot, CheckCircle2, Circle, Code2, FolderGit2, HardDrive, Laptop, Server, ShieldAlert, Stethoscope, Terminal as TerminalIcon, XCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CodeBlock } from '../components/CodeBlock'
import { Badge, PageHeader, ProgressBar, cx } from '../components/ui'
import { ENV_SPECS, parseEnvOutput, type EnvResult } from '../lib/envCheck'
import { useStore } from '../lib/store'

interface Step {
  id: string
  title: string
  icon: typeof Laptop
  summary: string
  body: ReactNode
}

/** Blok perintah dengan konteks wajib: di mana dijalankan, output yang diharapkan, jika error. */
function Cmd({ code, where, expect, errors }: { code: string; where: string; expect?: string; errors?: [string, string][] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs"><b>Jalankan di:</b> {where}</p>
      <CodeBlock lang="bash" code={code} />
      {expect && <p className="text-xs"><b>Hasil yang diharapkan:</b> <span className="muted">{expect}</span></p>}
      {errors && errors.length > 0 && (
        <details className="rounded-lg border border-slate-200 p-2 text-xs dark:border-white/10">
          <summary className="cursor-pointer font-medium">Jika muncul error</summary>
          <ul className="mt-2 space-y-1.5">
            {errors.map(([e, fix]) => (
              <li key={e}><code className="font-mono text-rose-600 dark:text-rose-300">{e}</code> → <span className="muted">{fix}</span></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function EnvChecker() {
  const { state, setEnvVersion } = useStore()
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, EnvResult>>({})

  const check = (tool: (typeof ENV_SPECS)[number]['tool'], text: string) => {
    setInputs((i) => ({ ...i, [tool]: text }))
    const r = parseEnvOutput(tool, text)
    setResults((x) => ({ ...x, [tool]: r }))
    setEnvVersion(tool, r.status === 'ok' ? r.version ?? null : null)
  }

  return (
    <div className="space-y-3">
      <p className="muted text-sm">Buka terminal di komputermu (Windows: Git Bash atau PowerShell; macOS: Terminal), jalankan setiap perintah, lalu tempel outputnya di sini. DevStudio <b>tidak</b> menjalankan apa pun di komputermu.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {ENV_SPECS.map((spec) => {
          const r = results[spec.tool]
          const saved = state.local.env[spec.tool]
          return (
            <div key={spec.tool} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="font-medium">{spec.label}</span>
                {r?.status === 'ok' || (!r && saved) ? <Badge tone="emerald"><CheckCircle2 className="size-3" /> {r?.version ?? saved}</Badge> : r?.status === 'old' ? <Badge tone="amber">Perlu update</Badge> : r?.status === 'missing' ? <Badge tone="rose">Belum terpasang</Badge> : null}
              </div>
              <p className="muted mb-2 text-xs">{spec.why}</p>
              <code className="mb-2 block rounded-md bg-slate-900 px-2 py-1 font-mono text-xs text-emerald-300">{spec.command}</code>
              <label htmlFor={`env-${spec.tool}`} className="sr-only">Output {spec.command}</label>
              <input id={`env-${spec.tool}`} className="input py-1.5 font-mono text-xs" placeholder="Tempel output di sini" value={inputs[spec.tool] ?? ''} onChange={(e) => check(spec.tool, e.target.value)} autoComplete="off" spellCheck={false} />
              {r && r.status !== 'unknown' && (
                <p className={cx('mt-1.5 flex items-start gap-1.5 text-xs', r.status === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300')}>
                  {r.status === 'ok' ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" /> : <XCircle className="mt-0.5 size-3.5 shrink-0" />}{r.message}
                </p>
              )}
              {r?.status === 'unknown' && <p className="muted mt-1.5 text-xs">{r.message}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CLAUDE_MD = `# Catatan untuk Claude Code — proyek belajar

Saya sedang BELAJAR web development. Tolong:
- Jelaskan rencana dulu sebelum mengubah file, dengan bahasa sederhana.
- Ubah sedikit demi sedikit; jelaskan setiap perubahan.
- Jangan menghapus file atau menjalankan perintah yang mengubah sistem tanpa bertanya.
- Jangan pernah menulis password, token, atau API key di kode.
- Setelah selesai, sarankan pesan commit yang jelas.

Proyek: website sekolah statis (HTML, CSS, JavaScript).
Jalankan lokal: buka index.html dengan Live Server.`

export default function LocalWorkflow() {
  const { state, toggleLocalStep } = useStore()

  const steps: Step[] = [
    { id: 'env', title: 'Cek kesiapan komputer', icon: Stethoscope, summary: 'Git, Node.js, npm, dan VS Code terpasang dengan versi yang cukup.', body: <EnvChecker /> },
    {
      id: 'vscode',
      title: 'Siapkan VS Code',
      icon: Code2,
      summary: 'Editor kode gratis dari Microsoft, dengan ekstensi yang membantu pemula.',
      body: (
        <div className="space-y-3 text-sm">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Unduh dari <b>code.visualstudio.com</b> dan pasang. Windows: centang “Add to PATH” dan “Open with Code”.</li>
            <li>Buka panel Extensions (Ctrl+Shift+X) dan pasang: <b>Live Server</b> (preview otomatis), <b>Prettier</b> (merapikan kode), dan bila mau <b>Indonesian Language Pack</b>.</li>
            <li>Settings (Ctrl+,) → cari “format on save” → aktifkan; “default formatter” → Prettier.</li>
            <li>Buka proyek dengan <b>File → Open Folder</b> — selalu buka FOLDER proyek, bukan file satuan, agar path relatif dan Git bekerja benar.</li>
          </ol>
          <p className="muted text-xs">Pintasan berguna: Ctrl+P (cari file), Ctrl+/ (komentar), Alt+↑/↓ (pindah baris), Ctrl+` (buka terminal).</p>
        </div>
      ),
    },
    {
      id: 'terminal',
      title: 'Terminal di VS Code',
      icon: TerminalIcon,
      summary: 'Menjalankan perintah langsung di folder proyek.',
      body: (
        <div className="space-y-3 text-sm">
          <p>Menu <b>Terminal → New Terminal</b> membuka terminal yang sudah berada di folder proyek.</p>
          <p><b>Windows:</b> klik panah di samping tombol + pada panel terminal → <b>Select Default Profile</b> → <b>Git Bash</b>, agar perintah sama dengan materi DevStudio (ls, pwd, rm).</p>
          <Cmd where="terminal VS Code, di folder proyek" code={'pwd\nls'} expect="pwd menampilkan lokasi folder proyek; ls menampilkan file seperti index.html." errors={[['ls: command not found', 'Kamu memakai Command Prompt. Ganti profil ke Git Bash atau PowerShell.']]} />
          <p className="muted text-xs">Ingin latihan tanpa risiko? Gunakan <Link to="/github/m/sandbox" className="underline">Terminal bebas</Link> di simulator.</p>
        </div>
      ),
    },
    {
      id: 'devserver-static',
      title: 'Development server untuk website statis',
      icon: Server,
      summary: 'Melihat hasil dengan alamat http://localhost, bukan file://.',
      body: (
        <div className="space-y-3 text-sm">
          <p><b>localhost</b> berarti “komputer ini sendiri”. Angka setelah titik dua adalah <b>port</b> — “pintu” tempat server mendengarkan. Server lokal hanya bisa dibuka dari komputermu.</p>
          <p><b>Cara 1 — Live Server:</b> klik kanan <code className="font-mono">index.html</code> → <b>Open with Live Server</b>. Browser membuka <code className="font-mono">http://127.0.0.1:5500/</code> dan memuat ulang otomatis saat file disimpan.</p>
          <p><b>Cara 2 — lewat terminal</b> (butuh Node.js):</p>
          <Cmd
            where="terminal, di folder proyek yang berisi index.html"
            code={'npx serve .'}
            expect="“Serving!” beserta alamat Local: http://localhost:3000. Hentikan dengan Ctrl+C."
            errors={[
              ["'npx' is not recognized", 'Node.js belum terpasang; lihat langkah Cek kesiapan.'],
              ['EADDRINUSE / address already in use', 'Port dipakai program lain. Tutup terminal lain yang menjalankan server, atau pakai port lain: npx serve . -l 4000'],
            ]}
          />
          <p className="muted text-xs">Kenapa tidak klik dua kali index.html saja? Bisa untuk HTML sederhana, tetapi beberapa fitur (modul JavaScript, fetch file JSON) diblokir browser pada alamat file://.</p>
        </div>
      ),
    },
    {
      id: 'devserver-vite',
      title: 'Proyek npm & Vite',
      icon: Server,
      summary: 'npm install, npm run dev, dan membaca error umum.',
      body: (
        <div className="space-y-3 text-sm">
          <p>Proyek modern (React, Vite — termasuk DevStudio sendiri) punya file <code className="font-mono">package.json</code> yang mencatat paket yang dibutuhkan.</p>
          <Cmd
            where="terminal, di folder yang berisi package.json"
            code={'npm install      # sekali, membuat folder node_modules\nnpm run dev      # menjalankan development server'}
            expect="VITE … ready · Local: http://localhost:5173/ — buka alamat itu di browser. Perubahan file tampil otomatis (hot reload). Ctrl+C untuk berhenti."
            errors={[
              ['npm ERR! enoent ... package.json', 'Kamu di folder yang salah. cd ke folder yang berisi package.json.'],
              ['Port 5173 is in use, trying another one', 'Bukan error: Vite memakai port lain — perhatikan alamat yang ditampilkan.'],
              ['Cannot find module / ERR_MODULE_NOT_FOUND', 'Jalankan npm install lagi.'],
              ['Vite requires Node.js version 20.19+', 'Perbarui Node.js ke versi LTS terbaru.'],
              ['EACCES / permission denied', 'Jangan memakai sudo untuk npm install di folder proyek; periksa pemilik folder.'],
            ]}
          />
          <p className="muted text-xs">Jangan commit folder node_modules — ia dibuat ulang dengan npm install dan sudah tercantum di .gitignore.</p>
        </div>
      ),
    },
    {
      id: 'folder-link',
      title: 'Hubungkan folder lokal ke DevStudio',
      icon: HardDrive,
      summary: 'Bekerja di VS Code dan DevStudio pada folder yang sama.',
      body: (
        <div className="space-y-3 text-sm">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Buka proyek di DevStudio → <b>Buka editor</b> → tab <b>Folder lokal</b> → <b>Pilih folder…</b></li>
            <li>Browser menampilkan dialog: pilih folder proyek, lalu izinkan “Lihat & edit file”.</li>
            <li><b>Bandingkan</b> menunjukkan file yang berbeda. <b>Ambil dari folder</b> membawa perubahan dari VS Code ke DevStudio; <b>Simpan ke folder</b> menulis perubahan DevStudio ke komputer.</li>
          </ol>
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" /> Tersedia di Chrome & Edge desktop. Izin hanya berlaku untuk folder yang kamu pilih dan diminta ulang setiap sesi. DevStudio tidak pernah menghapus file di komputermu.
          </p>
          <p className="muted text-xs">Browser lain: gunakan Impor folder/ZIP dan tombol ZIP di editor proyek.</p>
        </div>
      ),
    },
    {
      id: 'folder-github',
      title: 'Hubungkan folder lokal ke GitHub',
      icon: FolderGit2,
      summary: 'Dua arah: dari folder lokal ke repository baru, atau clone repository yang sudah ada.',
      body: (
        <div className="space-y-4 text-sm">
          <div>
            <p className="mb-1.5 font-medium">A. Folder sudah ada di komputer → repository baru</p>
            <Cmd
              where="terminal, di folder proyek (bukan Desktop atau Documents)"
              code={'git init\ngit add .\ngit commit -m "Initial commit"\ngit branch -M main\ngit remote add origin https://github.com/USERNAME/NAMA-REPO.git\ngit push -u origin main'}
              expect="Baris terakhir: branch 'main' set up to track 'origin/main'. Repository di github.com kini berisi file-mu."
              errors={[
                ['remote origin already exists', 'Remote sudah diatur. Cek dengan git remote -v; ganti dengan git remote set-url origin <url>.'],
                ['! [rejected] (fetch first)', 'Repository GitHub tidak kosong (mis. dibuat dengan README). Jalankan git pull origin main --allow-unrelated-histories, selesaikan konflik, lalu push.'],
                ['Authentication failed', 'Login lewat jendela browser yang muncul. Jangan memakai password akun; jangan menempel token di file.'],
              ]}
            />
          </div>
          <div>
            <p className="mb-1.5 font-medium">B. Repository sudah ada di GitHub → ke komputer</p>
            <Cmd where="terminal, di folder induk (mis. Documents)" code={'git clone https://github.com/USERNAME/NAMA-REPO.git\ncd NAMA-REPO\ncode .'} expect="Folder NAMA-REPO dibuat dan terbuka di VS Code." />
          </div>
          <p className="muted text-xs">Latih alurnya dulu tanpa risiko di misi <Link to="/github/m/remote-push-pull" className="underline">Remote, Push & Pull</Link>.</p>
        </div>
      ),
    },
    {
      id: 'claude-code',
      title: 'Bekerja dengan Claude Code',
      icon: Bot,
      summary: 'Asisten AI di terminal yang bisa membaca dan mengubah file proyek — dengan persetujuanmu.',
      body: (
        <div className="space-y-3 text-sm">
          <p><b>Claude Code</b> adalah alat dari Anthropic yang berjalan di terminal (juga tersedia di VS Code, aplikasi desktop, dan web). Ia bisa membaca kode, menjelaskan, mengusulkan perubahan, dan menjalankan perintah — setiap tindakan yang mengubah file atau menjalankan perintah meminta izinmu.</p>
          <p className="flex items-start gap-2 rounded-lg bg-cyan-50 p-2.5 text-xs text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-200">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" /> Membutuhkan akun Claude berbayar atau akun API Anthropic (penggunaan API ditagih per pemakaian). Cara pemasangan bisa berubah — ikuti dokumentasi resmi di <b>code.claude.com/docs</b>.
          </p>
          <Cmd
            where="terminal, di folder proyek (setelah memasang Claude Code sesuai dokumentasi resmi)"
            code={'cd ~/Documents/website-sekolah\nclaude'}
            expect="Claude Code terbuka di terminal dan meminta login pada pemakaian pertama."
          />
          <p className="font-medium">Kebiasaan aman</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><b>Commit dulu</b> sebelum meminta perubahan besar — mudah kembali jika hasilnya tidak sesuai (git restore / git switch).</li>
            <li>Baca setiap diff sebelum menyetujui. Tolak jika tidak paham — minta penjelasan dulu.</li>
            <li>Jangan menempel password, token, atau isi file .env ke percakapan.</li>
            <li>Tetap jalankan dan uji hasilnya sendiri; AI bisa keliru.</li>
          </ul>
          <p className="font-medium">Contoh permintaan yang membuatmu tetap belajar</p>
          <ul className="muted list-disc space-y-1 pl-5">
            <li>“Jelaskan struktur proyek ini. Jangan ubah apa pun dulu.”</li>
            <li>“Menu di ponsel tidak tertutup setelah link diklik. Beri petunjuk penyebabnya tanpa langsung memperbaikinya.”</li>
            <li>“Review index.html untuk aksesibilitas, lalu jelaskan prioritas perbaikannya.”</li>
            <li>“Buat pesan commit untuk perubahan yang sudah saya stage.”</li>
          </ul>
          <p className="font-medium">File CLAUDE.md</p>
          <p className="muted">Simpan file <code className="font-mono">CLAUDE.md</code> di folder proyek berisi aturan kerja — Claude Code membacanya di setiap sesi:</p>
          <CodeBlock lang="md" title="CLAUDE.md" code={CLAUDE_MD} />
        </div>
      ),
    },
  ]

  const done = steps.filter((s) => state.local.steps[s.id]).length

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Phase 5"
        title="Local Workflow"
        description="Pindah dari browser ke komputermu sendiri: VS Code, terminal, development server, folder lokal, GitHub, dan Claude Code."
      />

      <div className="card p-5">
        <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{done} dari {steps.length} langkah ditandai selesai</span><span className="muted">{Math.round((done / steps.length) * 100)}%</span></div>
        <ProgressBar value={(done / steps.length) * 100} label="Progres Local Workflow" />
        <p className="muted mt-3 text-xs">Tanda selesai diisi sendiri olehmu — DevStudio tidak bisa memeriksa komputermu, kecuali versi alat yang kamu tempel di langkah 1.</p>
      </div>

      <ol className="space-y-4">
        {steps.map((s, i) => {
          const checked = Boolean(state.local.steps[s.id])
          return (
            <li key={s.id}>
              <details className="card group p-5" open={i === 0 || undefined}>
                <summary className="flex cursor-pointer list-none items-start gap-3">
                  {checked ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 size-5 shrink-0 text-slate-400" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><s.icon className="size-4 text-indigo-500" /> {i + 1}. {s.title}</div>
                    <p className="muted text-sm">{s.summary}</p>
                  </div>
                </summary>
                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
                  {s.body}
                  <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10">
                    <input type="checkbox" className="accent-emerald-600" checked={checked} onChange={() => toggleLocalStep(s.id, s.title)} />
                    Sudah saya lakukan di komputerku
                  </label>
                </div>
              </details>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
