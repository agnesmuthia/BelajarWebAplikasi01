import {
  HOME,
  computeStatus,
  createRemote,
  createState,
  currentRepo,
  run,
  teammatePush,
  type Repo,
  type SimState,
} from '../git/sim'

export interface MissionStep {
  /** Instruksi. `kode` ditampilkan sebagai kode. */
  text: string
  /** Petunjuk jika macet — perintah yang bisa diketik. */
  hint: string
  check: (s: SimState) => boolean
}

export interface MissionAction {
  label: string
  description: string
  /** Langkah (indeks) yang harus selesai sebelum tombol aktif. */
  afterStep: number
  run: (s: SimState) => SimState
}

export interface Mission {
  id: string
  level: 1 | 2
  title: string
  summary: string
  minutes: number
  intro: string[]
  setup: () => SimState
  steps: MissionStep[]
  actions?: MissionAction[]
  outro: string
  /** Cara menjalankan hal yang sama di komputer sungguhan. */
  realWorld: string
}

/* ----------------------------- helper ----------------------------- */

const ran = (s: SimState, re: RegExp) => s.history.some((h) => re.test(h))
/** Perintah `re` dijalankan SETELAH perintah `after` pertama kali dijalankan. */
const ranAfter = (s: SimState, after: RegExp, re: RegExp) => {
  const i = s.history.findIndex((h) => after.test(h))
  return i >= 0 && s.history.slice(i + 1).some((h) => re.test(h))
}
const repoAt = (s: SimState, root: string): Repo | undefined => s.repos[root]
const tipTree = (r: Repo | undefined, branch = r?.head) => {
  const id = r && branch ? r.branches[branch] : null
  return id && r ? r.commits[id].tree : {}
}
const commits = (r: Repo | undefined) => (r ? Object.keys(r.commits).length : 0)
const clean = (s: SimState, r: Repo | undefined) => {
  if (!r) return false
  const st = computeStatus(s, r)
  return !st.staged.length && !st.unstaged.length && !st.untracked.length
}

/** Jalankan serangkaian perintah untuk menyiapkan kondisi awal misi; riwayat dikosongkan. */
function prepare(cmds: string[], base = createState()): SimState {
  let s = base
  for (const c of cmds) s = run(s, c).state
  return { ...s, history: [] }
}

const ID = ['git config --global user.name "Siswa DevStudio"', 'git config --global user.email "siswa@example.com"']
const WEB = `${HOME}/website-sekolah`
const DEMO_URL = 'https://github.com/devstudio-demo/website-sekolah.git'
const MY_URL = 'https://github.com/kamu/website-sekolah.git'

/* ----------------------------- misi ----------------------------- */

export const MISSIONS: Mission[] = [
  {
    id: 'terminal-basics',
    level: 1,
    title: 'Kenalan dengan Terminal',
    summary: 'pwd, ls, mkdir, dan cd — navigasi folder tanpa mouse.',
    minutes: 8,
    intro: [
      'Terminal (di Windows: *Git Bash*) adalah cara mengetik perintah ke komputer. Git paling sering dipakai lewat terminal.',
      'Setiap perintah dijalankan di sebuah folder. Jika salah folder, perintah Git bisa salah sasaran — karena itu kita mulai dari navigasi.',
    ],
    setup: () => prepare(['mkdir Documents', 'mkdir Downloads']),
    steps: [
      { text: 'Tampilkan folder tempatmu berada sekarang.', hint: 'pwd', check: (s) => ran(s, /^pwd$/) },
      { text: 'Lihat isi folder ini.', hint: 'ls', check: (s) => ran(s, /^ls\b/) },
      { text: 'Buat folder baru bernama `latihan-git`.', hint: 'mkdir latihan-git', check: (s) => s.dirs.includes(`${HOME}/latihan-git`) },
      { text: 'Masuk ke folder `latihan-git`.', hint: 'cd latihan-git', check: (s) => s.cwd === `${HOME}/latihan-git` },
      { text: 'Kembali naik satu folder, lalu pastikan dengan `pwd`.', hint: 'cd ..  lalu  pwd', check: (s) => ranAfter(s, /^cd\s+\.\.$/, /^pwd$/) && s.cwd === HOME },
    ],
    outro: 'Kamu sudah bisa bernavigasi. Ingat: cek lokasi dengan pwd sebelum menjalankan perintah Git.',
    realWorld: 'Windows: buka “Git Bash” dari menu Start. macOS: buka “Terminal”. Perintah pwd, ls, mkdir, dan cd bekerja sama persis.',
  },
  {
    id: 'first-repo',
    level: 1,
    title: 'Identitas & Repository Pertama',
    summary: 'git --version, git config, git init, git status.',
    minutes: 10,
    intro: [
      'Sebelum memakai Git, kenalkan dirimu. Nama & email dicatat di setiap commit — di GitHub, email inilah yang menghubungkan commit ke akunmu.',
      'Lalu ubah sebuah folder biasa menjadi *repository* dengan git init.',
    ],
    setup: () => prepare(['mkdir latihan-git']),
    steps: [
      { text: 'Periksa apakah Git terpasang.', hint: 'git --version', check: (s) => ran(s, /^git --version$/) },
      { text: 'Atur nama: `git config --global user.name "Nama Kamu"`.', hint: 'git config --global user.name "Nama Kamu"', check: (s) => Boolean(s.config.name) },
      { text: 'Atur email (gunakan email akun GitHub-mu).', hint: 'git config --global user.email "kamu@example.com"', check: (s) => Boolean(s.config.email) },
      { text: 'Masuk ke folder `latihan-git` lalu jadikan repository.', hint: 'cd latihan-git  lalu  git init', check: (s) => Boolean(repoAt(s, `${HOME}/latihan-git`)) },
      { text: 'Lihat status repository barumu.', hint: 'git status', check: (s) => ranAfter(s, /git init/, /^git status$/) },
    ],
    outro: 'Folder latihan-git sekarang punya folder tersembunyi .git (coba ls -a). Di situlah seluruh riwayat disimpan.',
    realWorld: 'Di komputermu, git config --global cukup dijalankan sekali. git init dijalankan sekali per proyek, di dalam folder proyek.',
  },
  {
    id: 'first-commit',
    level: 1,
    title: 'Commit Pertama',
    summary: 'Untracked → staged → committed.',
    minutes: 12,
    intro: [
      'File melewati tiga tahap: *untracked/modified* (belum dicatat) → *staged* (siap dicatat, setelah git add) → *committed* (tersimpan permanen di riwayat).',
      'Perhatikan perubahan warna di git status setiap kali kamu pindah tahap.',
    ],
    setup: () => prepare([...ID, 'mkdir website-sekolah', 'cd website-sekolah', 'git init']),
    steps: [
      { text: 'Buat file `index.html` berisi sebuah judul.', hint: 'echo "<h1>Website Sekolah</h1>" > index.html', check: (s) => Boolean(s.files[`${WEB}/index.html`]?.trim()) },
      { text: 'Jalankan `git status` — index.html berstatus *untracked* (merah).', hint: 'git status', check: (s) => ranAfter(s, /index\.html/, /^git status$/) },
      { text: 'Masukkan index.html ke staging area.', hint: 'git add index.html', check: (s) => 'index.html' in (repoAt(s, WEB)?.index ?? {}) },
      { text: 'Jalankan `git status` lagi — sekarang hijau di “Changes to be committed”.', hint: 'git status', check: (s) => ranAfter(s, /^git add/, /^git status$/) },
      { text: 'Buat commit dengan pesan yang jelas.', hint: 'git commit -m "Add homepage"', check: (s) => commits(repoAt(s, WEB)) >= 1 },
      { text: 'Lihat riwayat dalam format ringkas.', hint: 'git log --oneline', check: (s) => ranAfter(s, /^git commit/, /^git log/) },
    ],
    outro: 'Commit pertamamu tercatat! Angka 7 karakter di git log adalah ID commit — bisa dipakai untuk kembali ke versi ini kapan saja.',
    realWorld: 'Di VS Code, panel Source Control (ikon cabang) menampilkan status yang sama: “U” untracked, “M” modified, dan tombol + sama dengan git add.',
  },
  {
    id: 'daily-workflow',
    level: 2,
    title: 'Siklus Harian & .gitignore',
    summary: 'Ubah → diff → add → commit, plus README dan .gitignore.',
    minutes: 15,
    intro: [
      'Pekerjaan sehari-hari dengan Git adalah siklus kecil yang berulang: ubah file, periksa perubahan (git diff), lalu add dan commit.',
      'File `.gitignore` berisi daftar file yang TIDAK boleh masuk Git, seperti `node_modules/` atau file `.env` berisi rahasia.',
    ],
    setup: () => prepare([...ID, 'mkdir website-sekolah', 'cd website-sekolah', 'git init', 'echo "<h1>Website Sekolah</h1>" > index.html', 'git add .', 'git commit -m "Add homepage"']),
    steps: [
      { text: 'Tambahkan satu baris ke index.html (gunakan `>>` agar tidak menimpa).', hint: 'echo "<p>Selamat datang!</p>" >> index.html', check: (s) => (s.files[`${WEB}/index.html`] ?? '').split('\n').filter(Boolean).length >= 2 },
      { text: 'Lihat baris yang berubah dengan `git diff`.', hint: 'git diff', check: (s) => ran(s, /^git diff$/) },
      { text: 'Add dan commit perubahan itu.', hint: 'git add index.html  lalu  git commit -m "Add welcome text"', check: (s) => commits(repoAt(s, WEB)) >= 2 && (tipTree(repoAt(s, WEB))['index.html'] ?? '').trim().split('\n').length >= 2 },
      { text: 'Buat `README.md` yang menjelaskan proyek.', hint: 'echo "# Website Sekolah" > README.md', check: (s) => Boolean(s.files[`${WEB}/README.md`]?.trim()) },
      { text: 'Buat `.gitignore` yang mengabaikan `node_modules/` dan `.env`.', hint: 'echo "node_modules/" > .gitignore  lalu  echo ".env" >> .gitignore', check: (s) => /node_modules\//.test(s.files[`${WEB}/.gitignore`] ?? '') && /^\.env$/m.test(s.files[`${WEB}/.gitignore`] ?? '') },
      { text: 'Buat file rahasia `.env`, lalu cek `git status` — .env tidak muncul!', hint: 'echo "API_KEY=rahasia" > .env  lalu  git status', check: (s) => Boolean(s.files[`${WEB}/.env`]) && ranAfter(s, /\.env/, /^git status$/) },
      { text: 'Commit README.md dan .gitignore sampai working tree bersih.', hint: 'git add .  lalu  git commit -m "Add README and gitignore"', check: (s) => '.gitignore' in tipTree(repoAt(s, WEB)) && 'README.md' in tipTree(repoAt(s, WEB)) && clean(s, repoAt(s, WEB)) },
    ],
    outro: 'Rahasia seperti API key tidak pernah boleh masuk repository — .gitignore adalah pertahanan pertamamu.',
    realWorld: 'GitHub menyediakan template .gitignore saat membuat repository baru (pilih “Node” untuk proyek JavaScript).',
  },
  {
    id: 'branching',
    level: 2,
    title: 'Branch & Merge',
    summary: 'Kerjakan fitur di branch terpisah, lalu gabungkan ke main.',
    minutes: 15,
    intro: [
      'Branch adalah jalur kerja paralel. Kamu bisa membuat halaman kontak di branch `fitur-kontak` tanpa mengganggu versi utama di `main`.',
      'Perhatikan: saat berpindah branch, file di folder ikut berubah.',
    ],
    setup: () => prepare([...ID, 'mkdir website-sekolah', 'cd website-sekolah', 'git init', 'echo "<h1>Beranda</h1>" > index.html', 'git add .', 'git commit -m "Add homepage"']),
    steps: [
      { text: 'Lihat daftar branch.', hint: 'git branch', check: (s) => ran(s, /^git branch$/) },
      { text: 'Buat & pindah ke branch `fitur-kontak`.', hint: 'git switch -c fitur-kontak', check: (s) => repoAt(s, WEB)?.head === 'fitur-kontak' || 'fitur-kontak' in (repoAt(s, WEB)?.branches ?? {}) },
      { text: 'Buat `kontak.html` dan commit di branch ini.', hint: 'echo "<h1>Kontak</h1>" > kontak.html  lalu  git add .  lalu  git commit -m "Add contact page"', check: (s) => 'kontak.html' in tipTree(repoAt(s, WEB), 'fitur-kontak') },
      { text: 'Pindah ke `main`, lalu `ls` — kontak.html “hilang”.', hint: 'git switch main  lalu  ls', check: (s) => repoAt(s, WEB)?.head === 'main' && ranAfter(s, /switch main|checkout main/, /^ls/) },
      { text: 'Gabungkan `fitur-kontak` ke main.', hint: 'git merge fitur-kontak', check: (s) => 'kontak.html' in tipTree(repoAt(s, WEB), 'main') },
      { text: 'Hapus branch yang sudah digabung.', hint: 'git branch -d fitur-kontak', check: (s) => Boolean(repoAt(s, WEB)) && !('fitur-kontak' in repoAt(s, WEB)!.branches) },
    ],
    outro: 'Karena main tidak punya commit baru sejak branch dibuat, merge-nya “fast-forward”. Di tim, merge biasanya dilakukan lewat Pull Request di GitHub (Level 3).',
    realWorld: 'Nama branch yang baik menjelaskan tujuannya: fitur-kontak, perbaikan-menu, update-berita.',
  },
  {
    id: 'merge-conflict',
    level: 2,
    title: 'Menyelesaikan Konflik',
    summary: 'Dua branch mengubah baris yang sama — kamu yang memutuskan.',
    minutes: 15,
    intro: [
      'Konflik terjadi jika dua branch mengubah *baris yang sama* secara berbeda. Git tidak menebak — ia menandai bagian itu dan memintamu memilih.',
      'Di repository ini, `main` mengubah warna judul menjadi merah, sedangkan branch `tema-biru` mengubahnya menjadi biru.',
    ],
    setup: () =>
      prepare([
        ...ID, 'mkdir website-sekolah', 'cd website-sekolah', 'git init',
        'echo "h1 { color: black; }" > style.css', 'git add .', 'git commit -m "Add base style"',
        'git switch -c tema-biru', 'echo "h1 { color: blue; }" > style.css', 'git commit -am "Use blue heading"',
        'git switch main', 'echo "h1 { color: red; }" > style.css', 'git commit -am "Use red heading"',
      ]),
    steps: [
      { text: 'Gabungkan branch `tema-biru` ke main.', hint: 'git merge tema-biru', check: (s) => Boolean(repoAt(s, WEB)?.merging) || (repoAt(s, WEB)?.commits[repoAt(s, WEB)!.branches.main!]?.parents.length ?? 0) > 1 },
      { text: 'Lihat isi style.css — perhatikan penanda `<<<<<<<`, `=======`, `>>>>>>>`.', hint: 'cat style.css  (atau buka tab File di panel kanan)', check: (s) => ran(s, /^cat style\.css$/) || ran(s, /^\[edit\] style\.css$/) },
      { text: 'Tulis versi akhir tanpa penanda (mis. pilih biru) — lewat tab File atau `echo`.', hint: 'echo "h1 { color: blue; }" > style.css', check: (s) => { const f = s.files[`${WEB}/style.css`] ?? ''; return Boolean(f.trim()) && !/^(<<<<<<<|=======|>>>>>>>)/m.test(f) } },
      { text: 'Tandai konflik selesai dengan `git add`.', hint: 'git add style.css', check: (s) => { const r = repoAt(s, WEB); return Boolean(r && !/^<<<<<<</m.test(r.index['style.css'] ?? '') && ranAfter(s, /merge tema-biru/, /^git add/)) } },
      { text: 'Selesaikan merge dengan commit.', hint: 'git commit -m "Merge tema-biru"', check: (s) => { const r = repoAt(s, WEB); return Boolean(r && !r.merging && r.commits[r.branches.main!]?.parents.length === 2) } },
    ],
    outro: 'Konflik itu normal, bukan kesalahan. Kuncinya: baca kedua versi, putuskan isi yang benar, hapus penandanya, lalu add & commit.',
    realWorld: 'VS Code menampilkan tombol “Accept Current / Accept Incoming / Accept Both” di atas setiap konflik.',
  },
  {
    id: 'remote-push-pull',
    level: 2,
    title: 'Remote, Push & Pull',
    summary: 'Hubungkan ke GitHub (simulasi), push, lalu pull perubahan rekan tim.',
    minutes: 18,
    intro: [
      'Repository di komputermu (lokal) bisa dihubungkan ke repository di GitHub (remote). `git push` mengirim commit ke sana, `git pull` mengambil commit dari sana.',
      'Di misi ini, “GitHub” disimulasikan. Alamat repository-mu: `' + MY_URL + '`.',
    ],
    setup: () => prepare([...ID, 'mkdir website-sekolah', 'cd website-sekolah', 'git init', 'echo "<h1>Website Sekolah</h1>" > index.html', 'git add .', 'git commit -m "Add homepage"']),
    actions: [
      { label: 'Buat repository di GitHub (simulasi)', description: 'Sama seperti menekan “New repository” di github.com — tanpa README agar repository benar-benar kosong.', afterStep: -1, run: (s) => createRemote(s, 'kamu', 'website-sekolah') },
      { label: 'Simulasikan: rekan tim push README', description: 'Rekan tim menambahkan README.md langsung di GitHub. Sekarang remote punya commit yang belum kamu miliki.', afterStep: 2, run: (s) => teammatePush(s, MY_URL, 'README.md', '# Website Sekolah\n\nDikerjakan bersama.\n', 'Add README') },
    ],
    steps: [
      { text: 'Klik tombol **Buat repository di GitHub (simulasi)** di panel misi.', hint: 'Tombol ada di bawah daftar langkah.', check: (s) => Boolean(s.remotes[MY_URL]) },
      { text: 'Hubungkan repository lokal ke remote bernama `origin`.', hint: `git remote add origin ${MY_URL}`, check: (s) => repoAt(s, WEB)?.remotes.origin === MY_URL },
      { text: 'Push branch main dan atur upstream.', hint: 'git push -u origin main', check: (s) => Boolean(s.remotes[MY_URL]?.branches.main) && repoAt(s, WEB)?.upstream.main === 'origin/main' },
      { text: 'Klik **Simulasikan: rekan tim push README**, lalu ubah index.html, commit, dan coba `git push` — perhatikan penolakannya.', hint: 'echo "<p>Info terbaru</p>" >> index.html  lalu  git commit -am "Add news"  lalu  git push', check: (s) => Boolean(s.remotes[MY_URL] && Object.values(s.remotes[MY_URL].commits).some((c) => c.author === 'Rekan Tim')) && ranAfter(s, /commit/, /^git push$/) && commits(repoAt(s, WEB)) >= 2 },
      { text: 'Ambil & gabungkan perubahan rekan tim.', hint: 'git pull', check: (s) => 'README.md' in tipTree(repoAt(s, WEB)) },
      { text: 'Push lagi — kali ini berhasil.', hint: 'git push', check: (s) => { const r = repoAt(s, WEB); return Boolean(r && s.remotes[MY_URL]?.branches.main === r.branches.main) } },
    ],
    outro: 'Kebiasaan baik: git pull sebelum mulai bekerja, git push setelah selesai. Penolakan push bukan error berbahaya — itu cara Git melindungi pekerjaan orang lain.',
    realWorld: 'Di komputer sungguhan, push pertama meminta login GitHub lewat browser (Git Credential Manager). GitHub tidak menerima password akun untuk git push — jangan pernah menempelkan token di dalam kode.',
  },
  {
    id: 'clone-contribute',
    level: 2,
    title: 'Clone & Kontribusi Pertama',
    summary: 'Unduh repository orang lain, buat branch, dan commit perbaikan.',
    minutes: 12,
    intro: ['git clone mengunduh repository lengkap dengan seluruh riwayatnya. Di misi ini ada repository contoh milik “devstudio-demo”.'],
    setup: () => {
      let s = prepare(ID)
      s = createRemote(s, 'devstudio-demo', 'website-sekolah')
      s = teammatePush(s, DEMO_URL, 'index.html', '<h1>Website Sekolah</h1>\n<p>Selamat datang di sekolah kami.</p>\n', 'Add homepage')
      s = teammatePush(s, DEMO_URL, 'kontak.html', '<h1>Kontak</h1>\n<p>Email: info@sekolah.example</p>\n', 'Add contact page')
      s = teammatePush(s, DEMO_URL, 'berita.html', '<h1>Berita</h1>\n<p>Pendaftran siswa baru dibuka.</p>\n', 'Add news page')
      return { ...s, history: [] }
    },
    steps: [
      { text: `Clone repository \`${DEMO_URL}\`.`, hint: `git clone ${DEMO_URL}`, check: (s) => Boolean(repoAt(s, WEB)) },
      { text: 'Masuk ke foldernya dan lihat riwayat commit.', hint: 'cd website-sekolah  lalu  git log --oneline', check: (s) => s.cwd === WEB && ran(s, /^git log/) },
      { text: 'Ada salah ketik “Pendaftran” di berita.html. Buat branch `perbaikan-typo`.', hint: 'git switch -c perbaikan-typo', check: (s) => 'perbaikan-typo' in (repoAt(s, WEB)?.branches ?? {}) },
      { text: 'Perbaiki menjadi “Pendaftaran” (tab File atau echo), lalu commit.', hint: 'Edit berita.html di tab File  lalu  git commit -am "Fix typo in news page"', check: (s) => /Pendaftaran/.test(tipTree(repoAt(s, WEB), 'perbaikan-typo')['berita.html'] ?? '') },
    ],
    outro: 'Selanjutnya di dunia nyata: push branch ini lalu buka Pull Request agar pemilik repository mereview perbaikanmu (Level 3). Untuk repository orang lain, biasanya kamu fork dulu.',
    realWorld: 'Di GitHub, tombol hijau “Code” menampilkan alamat untuk git clone.',
  },
]

export function findMission(id: string) {
  return MISSIONS.find((m) => m.id === id)
}

/**
 * Majukan progres dari langkah `from`: langkah diperiksa berurutan dan progres tidak
 * pernah mundur (mis. branch yang dibuat di langkah 2 boleh dihapus di langkah 6).
 */
export function advance(m: Mission, s: SimState, from: number): number {
  let i = from
  while (i < m.steps.length && m.steps[i].check(s)) i++
  return i
}

export { currentRepo }
