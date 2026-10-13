import type { Lesson } from './curriculum'

/** Level 3 (kolaborasi profesional) & Level 4 (portofolio & otomasi) — dikerjakan di github.com. */
export const githubLessons: Lesson[] = [
  {
    id: 'git-3',
    title: 'Pull Request, Code Review, dan Fork',
    minutes: 25,
    goal: 'Mengusulkan perubahan lewat Pull Request, memberi/menerima review, dan berkontribusi ke repository orang lain lewat fork.',
    concepts: [
      '*Pull Request* (PR) adalah permintaan untuk menggabungkan branch-mu ke branch lain (biasanya `main`). PR menampilkan diff, tempat diskusi, dan hasil pemeriksaan otomatis sebelum merge.',
      'Alur standar tim: buat branch → commit → `git push -u origin nama-branch` → buka PR di GitHub → reviewer memberi komentar → perbaiki dengan commit baru di branch yang sama → merge → hapus branch.',
      'Code review yang baik: spesifik, sopan, menjelaskan alasan, dan membedakan yang wajib diperbaiki dari saran. Sebagai penulis, jangan tersinggung — review adalah cara tim belajar bersama.',
      '*Fork* adalah salinan repository orang lain di akunmu. Kamu push ke fork-mu sendiri, lalu membuka PR ke repository asli (*upstream*). Untuk mengambil pembaruan dari upstream: `git remote add upstream <url-asli>` lalu `git pull upstream main`.',
    ],
    example: {
      language: 'bash',
      caption: 'Alur kerja PR dari komputer. Perintah dijalankan di folder repository.',
      code: `git switch -c perbaikan-menu
# ...edit file...
git add .
git commit -m "Fix mobile menu toggle"
git push -u origin perbaikan-menu
# GitHub menampilkan tombol "Compare & pull request" → buka PR

# Setelah review meminta perubahan:
git add .
git commit -m "Close menu after link click"
git push            # PR otomatis ter-update`,
    },
    steps: [
      'Di repository latihanmu di github.com, buat branch baru dan ubah README langsung di web (ikon pensil → “Create a new branch”).',
      'Buka Pull Request. Tulis judul yang jelas dan deskripsi: apa yang berubah, mengapa, dan cara menguji.',
      'Buka tab “Files changed”, klik nomor baris, dan tinggalkan komentar review untuk dirimu sendiri.',
      'Merge PR, lalu klik “Delete branch”.',
      'Di komputer: `git switch main` lalu `git pull` agar main lokal ikut terbaru.',
    ],
    challenge: 'Fork repository publik mana pun yang kamu sukai (misalnya repository latihan teman), perbaiki satu salah ketik, dan buka PR ke repository aslinya dengan deskripsi yang sopan.',
    hints: ['Tombol “Fork” ada di kanan atas halaman repository.', 'Clone fork-mu, bukan repository asli — karena kamu hanya punya izin push ke fork.', 'Setelah push, GitHub menampilkan tombol “Contribute → Open pull request”.'],
    commonErrors: [
      { error: 'remote: Permission to user/repo.git denied', fix: 'Kamu push ke repository orang lain. Fork dulu, lalu push ke fork-mu.' },
      { error: 'PR menampilkan banyak perubahan yang bukan milikmu.', fix: 'Branch-mu dibuat dari main yang sudah ketinggalan. Jalankan git pull (atau git pull upstream main) sebelum membuat branch.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Reviewer meminta perubahan pada PR-mu. Apa yang kamu lakukan?',
        options: [
          { text: 'Tutup PR lalu buat PR baru.', why: 'Tidak perlu — riwayat diskusi akan hilang.' },
          { text: 'Commit perbaikan di branch yang sama lalu push; PR ter-update otomatis.', correct: true, why: 'Benar.' },
          { text: 'Langsung merge karena hanya saran.', why: 'Diskusikan dulu dengan reviewer; jangan abaikan permintaan perubahan.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Kapan kamu perlu fork?',
        options: [
          { text: 'Saat ingin berkontribusi ke repository yang tidak memberimu izin push.', correct: true, why: 'Benar.' },
          { text: 'Setiap kali membuat branch.', why: 'Branch dibuat di repository yang sama; fork membuat salinan repository di akunmu.' },
          { text: 'Untuk menghapus repository.', why: 'Fork tidak ada hubungannya dengan menghapus.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Komentar review mana yang paling membantu?',
        options: [
          { text: '"Kode ini jelek."', why: 'Tidak spesifik dan tidak membantu memperbaiki.' },
          { text: '"Tombol menu belum bisa ditutup dengan Esc; tambahkan listener keydown agar ramah keyboard."', correct: true, why: 'Benar: spesifik, menjelaskan alasan, dan memberi arah.' },
          { text: '"LGTM" tanpa membaca kode.', why: 'Persetujuan tanpa membaca membuat bug lolos.' },
        ],
      },
    ],
    skills: ['github'],
  },
  {
    id: 'git-4',
    title: 'Issues, Labels, Milestones, dan GitHub Projects',
    minutes: 20,
    goal: 'Mengelola pekerjaan dengan Issues dan papan GitHub Projects.',
    concepts: [
      '*Issue* adalah catatan tugas atau bug: judul, deskripsi, langkah reproduksi, dan diskusi. Setiap issue punya nomor, mis. #12.',
      '*Label* mengelompokkan issue (bug, enhancement, documentation, good first issue). *Milestone* mengelompokkan issue untuk satu target, mis. “Versi 1.0 — Peluncuran website”.',
      'Hubungkan PR dengan issue menulis `Closes #12` di deskripsi PR — issue tertutup otomatis saat PR di-merge.',
      '*GitHub Projects* adalah papan kanban (Todo → In Progress → Done) yang mengambil kartu dari issue & PR. Cocok untuk merencanakan proyek sekolah bersama tim.',
    ],
    example: {
      language: 'bash',
      caption: 'Pesan commit/PR yang terhubung ke issue.',
      code: `git commit -m "Add contact form validation"
git push

# Deskripsi Pull Request:
#   Menambahkan validasi email dan nama pada form kontak.
#   Closes #12`,
    },
    steps: [
      'Di repository latihan, buka tab Issues → New issue. Tulis bug dengan format: Langkah, Hasil sekarang, Hasil yang diharapkan.',
      'Tambahkan label “bug” dan buat milestone “Versi 1.0”.',
      'Buat GitHub Project (tab Projects → New project → Board) dan tambahkan issue tersebut.',
      'Buat branch, perbaiki, dan buka PR dengan “Closes #<nomor>”. Merge, lalu lihat issue tertutup otomatis.',
    ],
    challenge: 'Pecah salah satu proyek DevStudio-mu (mis. Website Wisata Takalar) menjadi minimal 5 issue dengan label dan satu milestone, lalu susun di papan Projects.',
    hints: ['Satu issue = satu pekerjaan yang bisa selesai dalam satu PR.', 'Daftar tugas proyek di DevStudio bisa menjadi titik awal.', 'Gunakan label “good first issue” untuk tugas yang mudah bagi anggota tim baru.'],
    commonErrors: [
      { error: 'Issue tidak tertutup setelah PR di-merge.', fix: 'Kata kunci harus di deskripsi PR (bukan judul) dan PR harus di-merge ke branch default (main).' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Apa fungsi tulisan "Closes #7" di deskripsi PR?',
        options: [
          { text: 'Menutup PR nomor 7.', why: 'Kata kunci ini menutup ISSUE yang dirujuk.' },
          { text: 'Menutup issue #7 otomatis saat PR di-merge.', correct: true, why: 'Benar.' },
          { text: 'Tidak ada fungsinya.', why: 'GitHub mengenali kata kunci closes/fixes/resolves.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Milestone paling tepat dipakai untuk…',
        options: [
          { text: 'Mengelompokkan issue menuju satu target/versi.', correct: true, why: 'Benar.' },
          { text: 'Mewarnai issue.', why: 'Itu fungsi label.' },
          { text: 'Menyimpan password.', why: 'Jangan pernah menyimpan rahasia di issue.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Laporan bug yang baik berisi…',
        options: [
          { text: '"Website rusak."', why: 'Tidak bisa direproduksi.' },
          { text: 'Langkah reproduksi, hasil sekarang, hasil yang diharapkan, dan perangkat/browser.', correct: true, why: 'Benar.' },
        ],
      },
    ],
    skills: ['github'],
  },
  {
    id: 'git-5',
    title: 'Branch Protection, Release & Tag, dan GitHub Actions (CI)',
    minutes: 30,
    goal: 'Melindungi branch main, menandai versi rilis, dan menjalankan pemeriksaan otomatis setiap push.',
    concepts: [
      '*Branch protection / rulesets* (Settings → Rules) mencegah push langsung ke main, mewajibkan PR, review, dan pemeriksaan otomatis yang lulus sebelum merge.',
      '*Tag* menandai satu commit sebagai versi, mis. `v1.0.0`. *Release* di GitHub dibuat dari tag dan berisi catatan perubahan serta file unduhan.',
      '*GitHub Actions* menjalankan *workflow* (file YAML di `.github/workflows/`) saat terjadi event seperti push atau pull_request. Pemeriksaan otomatis ini disebut CI (Continuous Integration).',
      'Workflow terdiri dari *jobs* yang berjalan di mesin virtual (*runner*); setiap job berisi *steps*: mengambil kode, memasang Node.js, `npm ci`, lalu `npm test` dan `npm run build`. Hasilnya muncul sebagai centang hijau/silang merah di commit dan PR.',
      'Repository publik mendapat menit Actions gratis; repository privat punya kuota bulanan. Cek halaman *Billing* akunmu untuk batas terbaru.',
    ],
    example: {
      language: 'yaml',
      caption: 'Isi file .github/workflows/ci.yml untuk proyek Vite (contoh). Ditampilkan sebagai teks.',
      code: `name: CI
on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read        # izin minimum

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build`,
    },
    steps: [
      'Buat file `.github/workflows/ci.yml` di repository latihan (gunakan contoh di atas untuk proyek npm).',
      'Commit & push, lalu buka tab Actions dan amati log setiap step.',
      'Sengaja buat test gagal, push, dan perhatikan silang merah di commit. Perbaiki lagi.',
      'Settings → Rules → New branch ruleset untuk main: wajibkan pull request dan status check “test”.',
      'Buat tag: `git tag v1.0.0` lalu `git push origin v1.0.0`, kemudian buat Release dari tag itu di GitHub.',
    ],
    challenge: 'Tambahkan CI ke salinan DevStudio Academy-mu sendiri sehingga setiap PR menjalankan npm test dan npm run build.',
    hints: ['Gunakan `npm ci` (bukan npm install) di CI — lebih cepat dan memakai package-lock.json persis.', 'Jika gagal, buka log job dan cari baris merah pertama.', 'Nama status check yang diwajibkan sama dengan nama job (di contoh: test).'],
    commonErrors: [
      { error: 'npm ci: The `npm ci` command can only install with an existing package-lock.json', fix: 'Commit file package-lock.json ke repository.' },
      { error: 'Workflow tidak berjalan sama sekali.', fix: 'File harus berada tepat di .github/workflows/ dan berekstensi .yml/.yaml; periksa indentasi YAML (spasi, bukan tab).' },
      { error: 'Tag tidak muncul di GitHub.', fix: 'git push biasa tidak mengirim tag. Jalankan git push origin v1.0.0.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Di folder mana file workflow GitHub Actions disimpan?',
        options: [
          { text: '.github/workflows/', correct: true, why: 'Benar.' },
          { text: 'src/actions/', why: 'GitHub hanya membaca workflow dari .github/workflows/.' },
          { text: 'node_modules/', why: 'Folder ini bahkan tidak di-commit.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Apa manfaat mewajibkan status check sebelum merge?',
        options: [
          { text: 'PR yang membuat test/build gagal tidak bisa digabung ke main.', correct: true, why: 'Benar.' },
          { text: 'Mempercepat upload.', why: 'Tidak berhubungan dengan kecepatan upload.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Perintah untuk mengirim tag v1.0.0 ke GitHub adalah…',
        options: [
          { text: 'git push', why: 'Push biasa tidak menyertakan tag.' },
          { text: 'git push origin v1.0.0', correct: true, why: 'Benar.' },
          { text: 'git tag push', why: 'Perintah ini tidak ada.' },
        ],
      },
    ],
    skills: ['github', 'git'],
  },
  {
    id: 'git-6',
    title: 'Profil GitHub & README Portofolio',
    minutes: 20,
    goal: 'Membuat profil GitHub yang profesional dan README proyek yang meyakinkan calon klien.',
    concepts: [
      '*Profile README*: buat repository publik dengan nama PERSIS sama dengan username-mu dan isi README.md-nya — tampil di halaman profil.',
      'README proyek yang baik menjawab: Apa ini? Untuk siapa? Lihat demonya di mana? Bagaimana menjalankannya? Teknologi apa? Apa yang saya pelajari? Sertakan screenshot.',
      '*Pin* maksimal 6 repository terbaik di profil. Arsipkan (Settings → Archive) repository latihan lama agar profil rapi tanpa menghapus riwayat.',
      'Tambahkan *description*, *website* (URL demo), dan *topics* di bagian About setiap repository agar mudah ditemukan.',
    ],
    example: {
      language: 'md',
      caption: 'Kerangka README.md proyek portofolio (Markdown).',
      code: `# Website Wisata Takalar

Panduan destinasi wisata Kabupaten Takalar — responsif dan aksesibel.

**Demo:** https://username.github.io/wisata-takalar/

![Tampilan beranda](docs/screenshot.png)

## Fitur
- Galeri destinasi dengan filter kategori
- Tampilan ponsel & desktop

## Teknologi
HTML, CSS Grid, JavaScript

## Menjalankan
Buka index.html di browser, atau gunakan Live Server di VS Code.

## Yang saya pelajari
Path relatif, CSS Grid auto-fill, dan event listener.

## Sumber
Foto: koleksi pribadi / [lisensi]`,
    },
    steps: [
      'Buat repository bernama sama dengan username-mu, centang “Add a README”, lalu tulis perkenalan singkat.',
      'Isi About (description, website, topics) pada repository proyek terbaikmu.',
      'Tambahkan screenshot ke folder docs/ dan tampilkan di README.',
      'Pin 3–6 repository terbaik di profil.',
    ],
    challenge: 'Tulis README lengkap untuk proyek DevStudio yang sudah kamu publikasikan, dengan link demo dan bagian “Yang saya pelajari”.',
    hints: ['Gunakan kerangka di atas.', 'Screenshot: simpan sebagai PNG/WebP kecil (< 300 KB).', 'Tulis dalam bahasa calon pembaca — Indonesia untuk klien lokal, Inggris untuk portofolio global.'],
    commonErrors: [
      { error: 'Profile README tidak tampil.', fix: 'Nama repository harus sama persis dengan username dan repository harus publik.' },
      { error: 'Gambar di README rusak.', fix: 'Gunakan path relatif terhadap README (docs/screenshot.png) dan pastikan file ikut di-commit.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Agar README tampil di halaman profil, repository harus bernama…',
        options: [
          { text: 'profile', why: 'Bukan nama khusus.' },
          { text: 'Sama persis dengan username GitHub-mu', correct: true, why: 'Benar.' },
          { text: 'README', why: 'Bukan nama khusus.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Hal terpenting di README portofolio untuk calon klien adalah…',
        options: [
          { text: 'Link demo dan screenshot hasil kerja.', correct: true, why: 'Benar — klien ingin melihat hasil nyata.' },
          { text: 'Daftar semua perintah Git yang pernah dipakai.', why: 'Tidak relevan bagi pembaca README.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Repository latihan lama sebaiknya…',
        options: [
          { text: 'Dihapus semua.', why: 'Riwayat belajar hilang; lebih baik diarsipkan.' },
          { text: 'Diarsipkan dan tidak di-pin.', correct: true, why: 'Benar.' },
        ],
      },
    ],
    skills: ['github'],
  },
  {
    id: 'git-7',
    title: 'Menghubungkan Repository ke Hosting & Deploy Otomatis',
    minutes: 25,
    goal: 'Memahami alur push → build → deploy otomatis dan cara membaca build log saat gagal.',
    concepts: [
      'Layanan hosting (GitHub Pages, Netlify, Vercel) bisa dihubungkan ke repository: setiap push ke main memicu *build* dan *deploy* otomatis. Ini disebut *Continuous Deployment*.',
      'Situs statis biasa (HTML/CSS/JS) tidak perlu build. Proyek Vite perlu *build command* `npm run build` dan *output directory* `dist`.',
      'Banyak platform membuat *preview deployment* untuk setiap PR — URL sementara untuk dicek sebelum merge — dan *production deployment* untuk main.',
      'Jika deploy gagal, buka *build log* dan baca dari error PERTAMA. Penyebab umum: package-lock tidak di-commit, perintah build salah, path huruf besar/kecil berbeda (Linux membedakan `Logo.png` dan `logo.png`).',
      'Paket gratis setiap layanan punya batas (bandwidth, menit build, penggunaan komersial). Selalu baca halaman harga resminya sebelum memilih — detail lengkap di Deployment Academy (Phase 6).',
    ],
    example: {
      language: 'text',
      caption: 'Pengaturan build umum untuk proyek Vite di layanan hosting.',
      code: `# Build command
npm run build

# Output / publish directory
dist

# Versi Node (lewat pengaturan platform atau file .nvmrc)
22`,
    },
    steps: [
      'Repository statis → Settings → Pages → Source: “Deploy from a branch” → main / root. Tunggu URL muncul.',
      'Ubah satu teks, push, dan amati deploy ulang otomatis (tab Actions menampilkan “pages build and deployment”).',
      'Simpan URL itu di tab Repo & Deploy proyek DevStudio-mu.',
    ],
    challenge: 'Publikasikan Portfolio Developer-mu ke GitHub Pages dan tandai proyeknya sebagai “Dipublikasikan” di DevStudio.',
    hints: ['URL GitHub Pages: https://username.github.io/nama-repo/', 'Jika halaman 404, pastikan index.html berada di root branch yang dipilih.', 'Perubahan bisa butuh 1–2 menit untuk tampil; muat ulang dengan Ctrl+F5.'],
    commonErrors: [
      { error: 'Gambar tampil di komputer tapi tidak di website online.', fix: 'Periksa huruf besar/kecil nama file & path. Server Linux membedakannya, Windows tidak.' },
      { error: 'Halaman putih setelah deploy proyek Vite.', fix: 'Output directory harus dist dan base path harus sesuai (proyek ini memakai base: "./").' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Output directory untuk proyek Vite biasanya…',
        options: [
          { text: 'src', why: 'src berisi kode sumber, bukan hasil build.' },
          { text: 'dist', correct: true, why: 'Benar.' },
          { text: 'node_modules', why: 'Berisi dependensi, bukan website.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Build gagal dengan banyak baris merah. Kamu mulai membaca dari…',
        options: [
          { text: 'Error pertama yang muncul.', correct: true, why: 'Benar — error berikutnya sering akibat error pertama.' },
          { text: 'Baris paling akhir saja.', why: 'Baris terakhir biasanya ringkasan, bukan penyebab.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Apa itu preview deployment?',
        options: [
          { text: 'URL sementara untuk menguji perubahan sebuah PR sebelum di-merge.', correct: true, why: 'Benar.' },
          { text: 'Website versi final.', why: 'Itu production deployment.' },
        ],
      },
    ],
    skills: ['github', 'deployment'],
  },
  {
    id: 'git-8',
    title: 'Secrets, Environment Variables, dan Actions yang Aman',
    minutes: 25,
    goal: 'Menyimpan kredensial dengan aman dan memahami risiko keamanan di repository & GitHub Actions.',
    concepts: [
      'JANGAN pernah menulis password, API key, atau token di kode, README, issue, atau commit. Repository publik dipindai bot dalam hitungan menit. Menghapus di commit berikutnya TIDAK cukup — riwayat Git menyimpannya. Jika bocor: *cabut (revoke) kunci itu segera*, lalu buat yang baru.',
      'Di komputer, simpan rahasia di file `.env` yang tercantum di `.gitignore`. Sediakan `.env.example` berisi nama variabel tanpa nilai.',
      'Di GitHub Actions, simpan rahasia di Settings → Secrets and variables → Actions, lalu pakai sebagai `${{ secrets.NAMA }}`. Nilainya disamarkan di log.',
      'Kode frontend (yang berjalan di browser) TIDAK bisa menyimpan rahasia — siapa pun bisa membacanya lewat DevTools. Variabel seperti `VITE_...` ikut masuk ke hasil build. Rahasia harus dipakai di backend/serverless function.',
      'Amankan Actions: batasi `permissions` seminimal mungkin, gunakan action dari sumber tepercaya (pin ke versi/commit SHA), aktifkan secret scanning & push protection, dan Dependabot untuk pembaruan dependensi.',
    ],
    example: {
      language: 'text',
      caption: 'Pola file .env yang aman (isi beberapa file).',
      code: `# .gitignore
.env
.env.*
!.env.example

# .env.example  (di-commit, TANPA nilai)
SUPABASE_URL=
SUPABASE_ANON_KEY=

# .env  (TIDAK di-commit)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...`,
    },
    steps: [
      'Periksa .gitignore proyek DevStudio ini: .env sudah diabaikan, .env.example tidak.',
      'Di repository latihan: Settings → Code security → aktifkan Secret scanning dan Push protection (jika tersedia untuk akunmu).',
      'Tambahkan satu repository secret uji coba dan baca bagaimana nilainya disamarkan (***) di log Actions.',
      'Tambahkan `permissions: contents: read` di setiap workflow yang tidak perlu menulis.',
    ],
    challenge: 'Audit satu repository-mu: cari kata “password”, “token”, “key”, dan “secret” di seluruh riwayat (fitur pencarian GitHub atau git log -p). Jika menemukan rahasia asli, cabut dan ganti kuncinya.',
    hints: ['git log -p | grep -i "api_key" mencari di seluruh riwayat (di komputermu).', 'Kunci yang sudah bocor harus dianggap tidak aman selamanya — ganti, jangan hanya disembunyikan.', 'Anon key Supabase memang boleh publik JIKA Row Level Security aktif (Phase 7); service role key TIDAK PERNAH boleh.'],
    commonErrors: [
      { error: 'Tidak sengaja commit file .env.', fix: 'Cabut semua kunci di dalamnya SEGERA, tambahkan .env ke .gitignore, git rm --cached .env, commit. Menulis ulang riwayat saja tidak cukup jika sudah di-push.' },
      { error: 'GitHub menolak push: “Push cannot contain secrets”.', fix: 'Push protection bekerja. Hapus rahasia dari commit (amend) sebelum push, dan pindahkan ke .env atau Secrets.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Kamu tidak sengaja push API key ke repository publik. Langkah PERTAMA?',
        options: [
          { text: 'Hapus baris itu dan commit lagi.', why: 'Kunci masih ada di riwayat dan mungkin sudah disalin bot.' },
          { text: 'Cabut (revoke) kunci itu di layanannya, lalu buat kunci baru.', correct: true, why: 'Benar.' },
          { text: 'Jadikan repository privat dan selesai.', why: 'Kunci mungkin sudah tersalin sebelum itu; tetap harus dicabut.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Di mana API key rahasia untuk layanan AI sebaiknya digunakan?',
        options: [
          { text: 'Di JavaScript frontend dengan variabel VITE_API_KEY.', why: 'Variabel VITE_ ikut ke browser — semua orang bisa membacanya.' },
          { text: 'Di backend/serverless function; frontend memanggil function itu.', correct: true, why: 'Benar.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Mengapa workflow sebaiknya memakai permissions minimum?',
        options: [
          { text: 'Agar jika workflow disalahgunakan, kerusakannya terbatas.', correct: true, why: 'Benar — prinsip least privilege.' },
          { text: 'Agar workflow lebih cepat.', why: 'Izin tidak memengaruhi kecepatan.' },
        ],
      },
    ],
    skills: ['github'],
  },
]
