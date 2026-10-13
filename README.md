# DevStudio Academy — My Web Development Laboratory

Laboratorium pribadi untuk **belajar, mempraktikkan, membangun, dan menerbitkan** website.
Metode: **Learn → Practice → Build → Test → Review → Commit → Deploy → Reflect.**

> Versi ini mencakup **Phase 1 — Foundation**, **Phase 2 — Coding Lab**, **Phase 3 — Project Workspace**, **Phase 4 — Git & GitHub**, **Phase 5 — Local Workflow**, dan **Phase 6 — Deployment**. Fitur fase
> berikutnya ditandai dengan label “Phase N” di aplikasi; tidak ada tombol yang hanya *terlihat* berfungsi.

---

## Phase 6 — Deployment

| Fitur | Keterangan |
|---|---|
| **Deployment Academy** (modul “Deploy”, 6 pelajaran + kuis) | Localhost & build → GitHub Pages → Netlify & Vercel → membaca build log → domain, DNS & HTTPS (termasuk `.sch.id` lewat PANDI dengan dokumen sekolah) → monitoring, backup, biaya & migrasi gratis → berbayar. |
| **Deploy hub** (`/#/deploy`) | 5 level (Level 4 full-stack dikunci sampai Phase 7), kartu platform dengan **tanggal pengecekan**, pemilih platform (jenis situs, komersial?, repo privat?, butuh preview?), analisis build log, pembuat record DNS, dan daftar situs yang sudah online. |
| **Siap deploy?** | Di tab Publikasi proyek: cek `index.html`, rahasia/API key/`.env`, huruf besar-kecil path, file hilang, path absolut `/`, sumber `http://`, nama file dengan spasi/huruf besar, gambar > 1 MB, dan teks placeholder. |
| **File konfigurasi** | Tombol menambahkan `.github/workflows/deploy-pages.yml` (GitHub Actions → Pages) atau `netlify.toml` ke proyek, dengan pratinjau dan checkpoint otomatis bila menimpa. DevStudio **tidak** melakukan push atau deploy — kamu yang commit & push. |
| **Analisis build log** | Tempel log; DevStudio menandai baris error pertama dan mengenali 13 pola umum (lockfile, versi Node, modul hilang, error TypeScript, folder publish salah, env var, kehabisan memori, izin Pages, ERESOLVE, 404 SPA, dll.). |

**Tentang data biaya & batas.** Angka platform dicek **13 Oktober 2026** dan ditampilkan dengan label
“bisa berubah” serta tautan ke halaman resmi. Batas GitHub Pages berasal dari dokumentasi resmi GitHub.
Angka Netlify (sistem kredit) dan Vercel (Hobby hanya non-komersial) berasal dari ringkasan pihak ketiga
karena halaman resminya tidak bisa diakses dari lingkungan pengembangan — **verifikasi di halaman harga
resmi sebelum memilih**. Tidak ada janji bahwa semua fitur selalu gratis; risiko vendor lock-in dijelaskan.

**CI & deploy DevStudio sendiri.**
- `.github/workflows/ci.yml` — menjalankan `npm ci`, test, dan build pada push/PR (hanya izin baca).
- `.github/workflows/deploy-pages.yml` — **manual saja** (`workflow_dispatch`). Untuk mengaktifkan:
  GitHub → **Settings → Pages → Source: GitHub Actions**, lalu **Actions → Deploy DevStudio to GitHub Pages → Run workflow**.
  Aplikasi memakai `base: './'` dan HashRouter, jadi berjalan di subpath `https://<user>.github.io/<repo>/`.

**Cara menguji Phase 6:** buka **Deploy** di menu → coba pemilih platform → tempel contoh log → isi domain
di pembuat DNS. Buka sebuah proyek → tab **Publikasi** → lihat “Siap deploy?”, tambahkan `netlify.toml`,
lalu cek file itu muncul di editor proyek. Jalankan `npm test` (79 test) dan `npm run build`.

## Phase 5 — Local Workflow

| Fitur | Keterangan |
|---|---|
| **Halaman Local Workflow** (`/#/local`) | 8 langkah: cek kesiapan komputer, VS Code, terminal VS Code, development server statis (Live Server / `npx serve`), proyek npm & Vite, folder lokal ↔ DevStudio, folder lokal ↔ GitHub, dan Claude Code. Setiap perintah menjelaskan **di mana dijalankan**, **hasil yang diharapkan**, dan **error umum beserta solusinya**. |
| **Pemeriksa kesiapan** | Tempel output `git --version`, `node -v`, `npm -v`, `code --version` dari terminalmu; DevStudio menilai versinya (mis. Node ≥ 20.19 untuk Vite) dan mengenali pesan “not recognized / command not found”. DevStudio tidak menjalankan perintah apa pun di komputermu. |
| **Folder lokal ↔ proyek** | Di editor proyek, tab **Folder lokal** (Chrome/Edge desktop, File System Access API): pilih folder lewat dialog browser → **Bandingkan** (teks dibandingkan langsung, gambar lewat SHA-256) → **Ambil dari folder** (lewat pratinjau impor + checkpoint otomatis) atau **Simpan ke folder** (daftar file baru/ditimpa + konfirmasi). Tautan folder diingat per proyek; izin diminta ulang tiap sesi. |
| **Claude Code** | Apa itu, cara memulai di folder proyek, biaya (butuh akun berbayar/API), kebiasaan aman (commit dulu, baca diff, jangan tempel rahasia), contoh permintaan yang menjaga proses belajar, dan contoh `CLAUDE.md`. |

**Keamanan folder lokal:** hanya folder yang dipilih pengguna; `node_modules` dan folder tersembunyi (`.git`)
dilewati (kecuali file konfigurasi umum seperti `.gitignore`, `.github/`, `.nojekyll`); path divalidasi (tanpa `..`); DevStudio **tidak pernah menghapus** file di komputer. Browser lain
(Firefox, Safari, ponsel) tetap bisa memakai Impor folder/ZIP dan unduhan ZIP.

## Phase 4 — Git & GitHub

| Fitur | Keterangan |
|---|---|
| **Simulator Git** | Terminal di browser yang meniru Git: `init, status, add, restore, commit, log, diff, branch, switch/checkout, merge` (termasuk **konflik**), `remote, push, pull, fetch, clone`, plus `pwd, ls, cd, mkdir, touch, echo >, cat, rm`. Pesan error mirip Git asli + **penjelasan berbahasa Indonesia** untuk setiap perintah. Riwayat ↑/↓, Tab untuk melengkapi. |
| **Panel inspeksi** | Diagram 4 area (working directory → staging → repository lokal → remote) yang berubah langsung, editor file, riwayat commit dengan label branch, dan isi “GitHub” simulasi. |
| **8 misi Level 1–2** | Terminal, identitas & `git init`, commit pertama, siklus harian & `.gitignore`, branch & merge, menyelesaikan konflik, remote/push/pull (dengan simulasi rekan tim & push yang ditolak), clone & kontribusi. Setiap langkah diperiksa otomatis dan diakhiri catatan “di komputer sungguhan”. |
| **Level 3–4** | 6 pelajaran + kuis: Pull Request/review/fork, Issues/labels/milestones/Projects, branch protection/release/GitHub Actions CI, profil & README portofolio, hosting & deploy otomatis, secrets & Actions yang aman. |
| **Integrations** | Data **publik** GitHub sungguhan tanpa login & tanpa token: profil, repository, branch, commit terbaru, status GitHub Actions; hubungkan repository ke proyek. Mode **DEMO** berlabel jelas. Aktivitas publik tampil di Dashboard. |
| **Akses tulis** | *Belum aktif — dengan jujur.* Butuh GitHub App + server untuk menukar token secara aman; halaman Integrations berisi rencana izin minimum dan panduan aktivasi. Sementara itu, tab Repo & Deploy menampilkan perintah push yang sudah terisi alamat repository. |
| **GitHub Mode** | *Continue Learning* membuka misi Git berikutnya dan petunjuk perintah langsung terlihat. |

**Catatan:** simulator adalah model belajar, bukan Git sungguhan (tidak ada rebase, stash, atau
reset). GitHub API tanpa login dibatasi ±60 permintaan/jam per IP; respons di-cache 5 menit.

## Phase 3 — Project Workspace

Buka proyek → **Buka editor** (`/#/projects/<id>/code`).

| Fitur | Keterangan |
|---|---|
| **Editor multi-file** | Pohon folder, banyak tab, CodeMirror untuk HTML/CSS/JS/JSON/Markdown, simpan otomatis, Format. |
| **Operasi file** | File baru, folder baru (dengan `.gitkeep`), ubah nama/pindahkan file atau folder, hapus — semua dengan validasi path. |
| **Impor dari komputer** | *Pilih file*, *Pilih folder*, *ZIP*, atau **drag & drop** (termasuk folder). Pratinjau sebelum disimpan: lokasi tujuan, file yang akan **ditimpa** (bisa dibatalkan per file), file yang dilewati beserta alasannya, dan opsi merapikan nama file. |
| **Penampil aset** | Pratinjau gambar/audio/video, ukuran & dimensi, peringatan gambar terlalu besar, dan **cara menulis path relatif dari setiap file HTML/CSS** di proyek. |
| **Preview multi-halaman** | Gambar, font, dan `url()` di CSS dari proyek ikut tampil; link ke halaman lain (`kontak.html`) berpindah halaman di preview; rujukan ke file yang tidak ada dilaporkan di Console. |
| **Pemeriksaan otomatis** | Atribut `alt`, `lang`, `<title>`, meta viewport, satu `<h1>`, urutan heading, label input, link kosong, placeholder `[GANTI]`, dan file lokal yang hilang. |
| **Checkpoint** | “Foto” seluruh proyek, mirip commit: status perubahan (seperti `git status`), **diff baris per baris**, dan pulihkan. Checkpoint otomatis dibuat saat proyek pertama dibuka, sebelum menghapus, sebelum impor yang menimpa, dan sebelum memulihkan. |
| **Proyek sendiri** | *Project Library → Proyek kosong* atau *Impor dari komputer* (folder/ZIP). |
| **ZIP** | Unduh seluruh proyek (teks + gambar) dan impor kembali kapan saja. |

**Penyimpanan:** file proyek disimpan di **IndexedDB** browser (maks. 5 MB per file, 50 MB per proyek).
Isi file biner disimpan sekali per hash SHA-256 — konsep yang sama dengan objek Git. File asli di
komputer tidak pernah diubah. File proyek **tidak** ikut dalam backup JSON; gunakan tombol ZIP.

**Batasan yang jujur:** checkpoint adalah latihan konsep commit, *bukan* Git sungguhan (Git & GitHub di
Phase 4). Preview tetap hanya HTML/CSS/JS biasa; aset yang dimuat lewat JavaScript (mis. `new Image()`
dengan path relatif) dan `@import` CSS belum diterjemahkan.

## Phase 2 — Coding Lab

| Fitur | Keterangan |
|---|---|
| **Editor** | CodeMirror 6 untuk `index.html`, `style.css`, `script.js`: syntax highlighting, nomor baris, indentasi, autocomplete, pencarian (Ctrl+F), undo per file. |
| **Run / Reset / Format** | Run (Ctrl/⌘+Enter) atau *Auto-run*; Reset ke kode awal (dengan konfirmasi); Format memakai Prettier yang baru dimuat saat dibutuhkan. |
| **Live preview** | iframe terisolasi, berdampingan dengan editor di desktop; tab Instruksi/Kode/Hasil di ponsel. |
| **Console & error** | `console.log/info/warn/error`, error JavaScript dengan **file:baris yang bisa diklik** dan **penjelasan untuk pemula** berdasarkan pesan error sebenarnya. `alert/confirm/prompt` ditampilkan di Console. |
| **Pelindung infinite loop** | Loop yang berjalan > 1 detik dihentikan dengan pesan yang menunjuk ke baris loop-nya. |
| **10 tantangan** | 6 latihan + 4 debugging, masing-masing dengan brief, langkah, petunjuk bertahap, **pemeriksa otomatis**, dan solusi + penjelasan perubahan. |
| **Diharapkan vs aktual** | Tab *Cek* menampilkan nilai yang diharapkan dan nilai aktual untuk setiap pemeriksaan; tab *Target* menampilkan hasil akhir yang diharapkan. |
| **Explain This Code** | Menjelaskan baris/seleksi dari **glosarium lokal** (±120 istilah HTML, CSS, JS, DOM) — bukan AI, dan dinyatakan jelas di UI. |
| **Draft otomatis** | Kode tersimpan otomatis per tantangan/template dan ikut dalam Export backup. |
| **Unduh** | ZIP berisi `index.html`, `style.css`, `script.js` yang siap dibuka di VS Code. |
| **Playground** | 3 template bebas, plus tombol **Coba di Lab** pada contoh kode pelajaran JS/DOM. |
| **Materi baru** | Modul *JavaScript Fundamentals* (3 pelajaran) dan *DOM Manipulation* (2 pelajaran). |
| **Mode** | *Build Mode* menampilkan Playground lebih dulu; *Debug Mode* langsung memfilter tantangan debugging. |

**Integritas progres:** tantangan yang lulus *setelah* membuka solusi ditandai “dibantu solusi”
dan tidak dihitung di Skill Tracker. Skill baru “Dikuasai” jika ada bukti dari proyek nyata.

**Batasan yang jujur:** Lab hanya menjalankan HTML/CSS/JavaScript biasa. npm, React, `import`
modul, file lokal (mis. `assets/foto.jpg`), dan `fetch` ke internet tidak didukung di preview —
untuk itu gunakan lingkungan lokal (VS Code + `npm run dev`). Loop tanpa kurung kurawal
(`while (x) i++;`) tidak dilindungi.

## Apa yang sudah berfungsi (Phase 1)

| Fitur | Keterangan |
|---|---|
| **Dashboard** | Sapaan, target harian, progres, proyek aktif/selesai, skill, grafik aktivitas 7 hari, tugas berikutnya, riwayat. Semua dihitung dari data nyata di browser. |
| **Learning Path** | 12 modul. Materi lengkap: HTML (4 pelajaran), CSS (3), Git (2). Setiap pelajaran: tujuan, konsep, contoh kode + preview terisolasi, langkah praktik, tantangan, petunjuk bertahap, error umum, kuis checkpoint, dan GitHub checkpoint. Pelajaran berikutnya terbuka setelah checkpoint lulus. |
| **Mode belajar** | *Guided* (petunjuk bisa dibuka kapan saja) dan *Practice* (petunjuk terkunci sampai kamu mencoba kuis). Mode lain terkunci sampai fasenya. |
| **Project Library** | 3 proyek pertama — Website Profil Sekolah, Website Wisata Takalar, Portfolio Developer — dengan brief, tujuan, kebutuhan, tugas, checklist testing, rubrik, dan starter files. 43 proyek lanjutan ditampilkan terkunci. |
| **Project Workspace** | Daftar tugas & testing, file viewer + live preview, catatan (simpan otomatis), link repository GitHub & URL deployment (divalidasi), status, favorit, riwayat, unduh ZIP. |
| **Skill Tracker** | Level dari **bukti**: checkpoint lulus + tugas proyek selesai — bukan jumlah materi yang dibaca. |
| **Pengaturan** | Nama, tema gelap/terang, target harian, mode belajar, export/import backup JSON, reset data. |

**Belum ada (sengaja):** editor kode di aplikasi (Phase 2), integrasi GitHub OAuth (Phase 4),
deployment otomatis (Phase 6), AI mentor & database (Phase 7). Lihat halaman **Roadmap**.

---

## Arsitektur MVP

```
Browser
 └─ React SPA (Vite + TypeScript + Tailwind CSS)
     ├─ HashRouter            → alamat /#/... agar jalan di hosting statis tanpa konfigurasi
     ├─ StoreProvider         → state aplikasi + simpan otomatis ke localStorage
     │    └─ sanitizeState()  → validasi semua data dari localStorage / file backup
     ├─ data/                 → kurikulum, tantangan, template proyek, skill (konten statis)
     ├─ lab/                  → Coding Lab: editor, runtime preview, pemeriksa, glosarium
     ├─ workspace/            → file proyek di IndexedDB (files · blobs · snapshots)
     │    └─ runtime.ts       → gabungkan 3 file → 1 dokumen + peta baris + skrip runtime
     └─ iframe sandbox        → preview kode yang terisolasi (lihat Keamanan)
          └─ postMessage      → console, error, dan hasil pemeriksaan dikirim ke aplikasi
```

Tidak ada backend dan tidak ada secrets. Semua data tetap di browser pengguna.

### Struktur folder

```
├── index.html               # Halaman HTML utama (memuat src/main.tsx)
├── public/favicon.svg
├── src/
│   ├── main.tsx             # Titik masuk React
│   ├── App.tsx              # Daftar route
│   ├── index.css            # Tailwind + token warna (charcoal, indigo, violet, cyan)
│   ├── components/          # Komponen UI reusable (Layout, CodeBlock, Modal, dll.)
│   ├── pages/               # Satu file per halaman
│   ├── data/                # curriculum*.ts, challenges.ts, projects.ts, skills.ts, modes.ts
│   ├── lab/                 # CodeEditor, LabWorkspace, runtime, loopProtect, glossary, errorHints
│   ├── workspace/           # IndexedDB, impor, pohon file, checkpoint & diff, audit
│   ├── git/                 # Simulator Git, terminal, panel inspeksi
│   ├── github/              # Klien GitHub REST (baca publik), data DEMO, detail repo
│   ├── lib/                 # store, storage, progress, preview, highlight, download
│   └── test/                # Unit & component test (Vitest + Testing Library)
├── vite.config.ts
└── tsconfig.json
```

### Keamanan

- Preview kode berjalan di `<iframe sandbox="allow-scripts allow-forms">` **tanpa** `allow-same-origin`,
  sehingga kode di dalamnya tidak bisa membaca localStorage, cookie, atau DOM aplikasi.
- Setiap dokumen preview diberi Content-Security-Policy `default-src 'none'`: `fetch`/XHR/WebSocket
  diblokir dan form tidak bisa dikirim ke mana pun. Coding Lab hanya mengizinkan gambar/media dari
  `https:` dan font dari Google Fonts.
- Aplikasi hanya menerima pesan dari iframe jika `event.source` adalah iframe preview yang aktif
  **dan** token acak run saat itu cocok. Output console dibatasi agar tidak membanjiri aplikasi.
- Data dari localStorage dan file backup divalidasi (`sanitizeState`) sebelum dipakai; file
  backup dibatasi 2 MB.
- URL yang disimpan pengguna hanya diterima jika `http(s)`; link repository harus `https://github.com/user/repo`.
- Tidak ada API key, token, atau password di source code.

---

## Menjalankan di komputer

**Prasyarat:** [Node.js](https://nodejs.org) versi 20 atau lebih baru, dan [Git](https://git-scm.com).

Buka terminal (Windows: *Git Bash*; macOS: *Terminal*), lalu:

```bash
# 1. Ambil kode (lewati jika foldernya sudah ada)
git clone https://github.com/agnesmuthia/BelajarWebAplikasi01.git
cd BelajarWebAplikasi01

# 2. Pasang dependensi — membuat folder node_modules/ (±1 menit, sekali saja)
npm install

# 3. Jalankan development server
npm run dev
```

Output yang diharapkan:

```
  VITE v8.x  ready in 300 ms
  ➜  Local:   http://localhost:5173/
```

Buka `http://localhost:5173/` di browser. Setiap kali kamu menyimpan file di `src/`, halaman
diperbarui otomatis. Hentikan server dengan **Ctrl + C**.

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan dengan hot reload |
| `npm test` | Menjalankan semua test |
| `npm run typecheck` | Memeriksa tipe TypeScript |
| `npm run build` | Membuat versi produksi di folder `dist/` |
| `npm run preview` | Membuka hasil build di `http://localhost:4173/` |

### Error yang umum

| Pesan | Solusi |
|---|---|
| `npm: command not found` | Node.js belum terpasang. Instal dari nodejs.org, lalu buka ulang terminal. |
| `Port 5173 is in use` | Server lain masih jalan. Tutup terminal lain atau Vite akan memakai port berikutnya (lihat output). |
| `Cannot find module ...` | Jalankan `npm install` lagi dari folder proyek. |
| Halaman putih kosong | Buka DevTools (F12) → tab Console untuk melihat error. |

---

## Cara menguji Phase 1

Otomatis:

```bash
npm test          # 71 test: …, simulator Git & misi, GitHub API, folder lokal, pemeriksa versi
npm run build     # memastikan TypeScript & build produksi lolos
```

Manual (checklist):

1. Dashboard menampilkan form nama → isi nama, sapaan berubah.
2. **Continue Learning** → kerjakan kuis *Struktur Dasar Dokumen HTML*. Jawab salah dulu: muncul
   penjelasan dan skor. Jawab benar semua: badge **Lulus**, pelajaran 2 terbuka.
3. Buka pelajaran 3 lewat alamat langsung (`/#/learn/html/html-3`) → harus terkunci.
4. **Projects → Project Library → Website Profil Sekolah → Mulai proyek ini.** Centang dua tugas;
   progres dan **Skill Tracker** ikut berubah.
5. Tab **File** → Live preview tampil; tombol **ZIP** mengunduh starter files.
6. Tab **Repo & Deploy** → isi `javascript:alert(1)` → ditolak. Status *Dipublikasikan* ditolak
   sebelum URL website diisi.
7. Muat ulang halaman → semua progres tetap ada.
8. Tombol matahari/bulan → tema terang/gelap. Perkecil jendela ke ukuran ponsel → menu menjadi
   tombol ☰, tidak ada scroll horizontal.
9. **Pengaturan → Export backup**, lalu **Reset**, lalu **Import backup** → data kembali.

Manual Coding Lab:

1. **Coding Lab → Tombol yang Tidak Bereaksi.** Tab Console menampilkan `TypeError` dengan penjelasan;
   klik `script.js:4` → kursor melompat ke baris itu.
2. Perbaiki satu bug, Run lagi, lihat tab **Cek** berubah (diharapkan vs aktual).
3. Di Playground, tulis `while (true) {}` di script.js → loop dihentikan setelah ±1 detik dan halaman tetap responsif.
4. Klik **Format** pada kode yang berantakan; klik **Explain** pada sebuah baris.
5. Muat ulang halaman → kode masih ada (draft). **Reset** → kembali ke kode awal.
6. Buka semua petunjuk → **Lihat solusi** → *Terapkan ke editor* → semua cek hijau, badge “dibantu solusi”.

Manual Project Workspace:

1. *Projects → Project Library → Impor dari komputer* → **Pilih folder** berisi website lama (atau seret folder/ZIP ke halaman).
   Periksa pratinjau impor: file yang akan ditimpa, nama yang dirapikan, file yang dilewati.
2. Klik sebuah gambar di pohon file → lihat ukuran dan cara menulis path dari `index.html` dan `css/style.css`.
3. Di Preview, klik link ke halaman lain → preview pindah halaman. Rujukan ke gambar yang tidak ada muncul di Console.
4. Tab **Pemeriksaan** → perbaiki temuan (mis. tambahkan `alt`).
5. Tab **Checkpoint** → simpan “Impor proyek awal”, ubah sesuatu, **Lihat perubahan**, lalu **Pulihkan**.
6. Muat ulang browser → file dan perubahan tetap ada. Unduh **ZIP** dan buka di VS Code.

Manual Git & GitHub:

1. **GitHub Center → Commit Pertama**: ikuti langkah; perhatikan diagram 4 area berubah setelah `git add` dan `git commit`.
2. **Menyelesaikan Konflik**: `git merge tema-biru` → buka tab File → hapus penanda → `git add` → `git commit`.
3. **Remote, Push & Pull**: tekan tombol simulasi rekan tim, lalu lihat `git push` ditolak dan selesaikan dengan `git pull`.
4. **Integrations**: masukkan username GitHub-mu → buka sebuah repository → hubungkan ke proyek → buka proyek → tab Repo & Deploy.
5. Coba **DEMO** tanpa username; pastikan label DEMO terlihat.

Manual Local Workflow (Chrome/Edge desktop):

1. **Local Workflow → Cek kesiapan**: tempel output keempat perintah dari terminalmu.
2. Buat folder kosong di komputer (mis. `Documents/website-sekolah`). Di editor proyek → tab **Folder lokal** → **Pilih folder…** → izinkan.
3. **Simpan ke folder** → buka folder itu di VS Code dan jalankan dengan Live Server.
4. Ubah satu file di VS Code dan simpan → kembali ke DevStudio → **Bandingkan lagi** → **Ambil dari folder**.
5. Di folder itu, jalankan `git init`, `git add .`, `git commit -m "Initial commit"` dan hubungkan ke GitHub.

---

## Menyimpan versi pertama ke GitHub

> Langkah ini dijalankan **di komputermu**. Jangan lewati `git status` — perintah itu
> memberi tahu apa yang akan disimpan.

```bash
# Sekali per komputer: identitas commit
git config --global user.name "Nama Kamu"
git config --global user.email "email-github-kamu@example.com"

# Di dalam folder proyek
git status                      # file apa saja yang berubah?
git add .                       # masukkan semua perubahan ke staging
git commit -m "Add Phase 1 foundation"
git log --oneline               # pastikan commit tercatat
```

Untuk mengirim ke repository GitHub yang **sudah ada**:

```bash
git remote -v                   # cek alamat repository (origin)
git push -u origin nama-branch  # kirim branch ke GitHub
```

Untuk repository **baru**: buat repo kosong di github.com (tanpa README), lalu:

```bash
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git branch -M main
git push -u origin main
```

GitHub tidak lagi menerima password akun saat `git push`. Saat diminta login, gunakan
**Git Credential Manager** (ikut terpasang dengan Git untuk Windows — akan membuka browser),
atau GitHub CLI (`gh auth login`). Jangan menulis token di dalam kode atau file proyek.

`.gitignore` sudah mencegah `node_modules/`, `dist/`, dan file `.env` ikut ter-commit.

---

## Lisensi konten

Starter proyek sekolah dan wisata sengaja berisi placeholder `[GANTI]`. Gunakan hanya data dan
aset resmi atau milikmu sendiri, cantumkan sumber, dan minta izin sebelum mempublikasikan logo
atau foto sekolah.
