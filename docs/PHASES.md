# Riwayat pengembangan per fase

Catatan rinci fitur setiap fase (terbaru di atas). Ringkasan ada di [README](../README.md).

## Phase 8 — Polish

| Area | Hasil |
|---|---|
| **Aksesibilitas** | Audit axe-core (WCAG 2.1 AA + best practice) di 35 halaman, mode gelap & terang: dari 6 jenis pelanggaran (kontras teks, region scroll tanpa akses keyboard, struktur ARIA tablist, heading) menjadi **0**. Item terkunci kini terbaca (tanpa opacity). 23 tes axe ditambahkan ke `npm test` agar tidak mundur. |
| **Keamanan** | Content-Security-Policy untuk build produksi (diuji: 0 pelanggaran di semua fitur), `SECURITY.md`, input file berlabel, `npm audit`: 0 kerentanan. Akses tulis GitHub & mentor AI diputuskan **tidak diaktifkan** (butuh server & rahasia). |
| **Performa** | Setiap halaman dimuat terpisah (code splitting). Unduhan JavaScript awal turun dari ±846 KB (269 KB gzip) menjadi ±613 KB (±197 KB gzip) — sudah termasuk 10 pelajaran baru; editor, Prettier, dan SQLite hanya dimuat saat dipakai. |
| **Konten** | 10 pelajaran baru: React & Vite (3), Testing/Aksesibilitas/Keamanan/Performa (4), Advanced (3). Semua 12 modul kini berisi materi. 4 skill baru. |
| **Mentor lokal** | Halaman `/#/mentor` (lihat tabel Fitur). |
| **Dokumentasi** | README disusun ulang; detail fase & checklist manual dipindah ke `docs/`. |

**Cara menguji Phase 8:**
1. `npm test` (semua tes termasuk audit aksesibilitas) dan `npm run build`.
2. Buka **Mentor** → pilih salah satu proyekmu → baca temuan review. Tab *Pesan commit* → pilih proyek yang sudah punya checkpoint, lalu ubah sebuah file dan lihat sarannya.
3. Tekan **Tab** berulang dari awal halaman: “Lewati ke konten utama” muncul, fokus selalu terlihat.
4. Ganti tema terang/gelap dan periksa teks redup (mis. pelajaran terkunci) tetap terbaca.
5. `npm run build && npm run preview`, buka DevTools → Network: halaman lain dimuat sebagai file terpisah saat dibuka.

## Phase 7 — Full-Stack

| Fitur | Keterangan |
|---|---|
| **3 modul baru (8 pelajaran + kuis)** | *API Integration* (HTTP/JSON/status code, fetch + async/await + loading/error), *Backend Fundamentals* (routing, serverless function & environment variable, validasi di server), *Database and Authentication* (SELECT, CRUD/JOIN/constraint, hash password & token, Supabase + Row Level Security + backup/migrasi). |
| **Full-Stack Lab** (`/#/fullstack`) | Ringkasan arsitektur & tabel “apa yang nyata, apa yang simulasi”, Mock API playground, SQL Lab, Supabase & Cloud, dan checklist + troubleshooting deploy full-stack. |
| **Mock API** (simulasi) | Kode di preview memanggil `fetch('/api/...')`; DevStudio melayaninya dari `api/config.json`: REST otomatis (GET/POST/PATCH/PUT/DELETE, `?q=`, `?sort=`, `?limit=`), validasi kolom, `/api/auth/register|login|me|logout` dengan hash PBKDF2 + salt, token sesi, dan aturan akses `public`, `read-public`, `owner`, `admin-write` (meniru RLS). Tab **API** menampilkan setiap request beserta penjelasan keputusan server, isi data, dan simulasi jaringan lambat/error 500/offline. |
| **SQL Lab** (nyata) | SQLite asli (sql.js/WebAssembly, dimuat hanya saat dibuka) dengan data sekolah **fiktif**, 10 tantangan terperiksa otomatis (SELECT → CREATE TABLE), mode bebas, struktur tabel, dan penjelasan error SQLite dalam bahasa Indonesia. Lulus tanpa melihat solusi = bukti skill *Database*. |
| **2 tantangan Coding Lab baru** | “Daftar dari API” dan “Form kirim ke API” — termasuk pemeriksaan saat server mengembalikan 500 dan pemeriksaan XSS. |
| **2 proyek full-stack** | *Aplikasi CRUD Inventaris* (terbuka setelah checkpoint `api-2`) dan *Aplikasi Login & Catatan Pribadi* (setelah `db-3`). README masing-masing menjelaskan endpoint dan cara pindah ke Supabase. |
| **Sinkronisasi cloud (opsional)** | Cadangkan/pulihkan progres ke **proyek Supabase milikmu sendiri** lewat REST API resmi. SQL penyiapan menyalakan RLS, policy “milik sendiri”, dan `GRANT` hanya ke `authenticated`. |
| **Siap deploy?** | Peringatan baru jika proyek masih bergantung pada Mock API (`/api/...` akan 404 setelah online). Level 4 Deploy hub kini terbuka. |
| **Skill baru** | Integrasi API, Dasar Backend, Database & SQL, Autentikasi & Otorisasi. |

**Keamanan & kejujuran.**
- Mock API **bukan** server online: berjalan di halaman DevStudio, datanya di localStorage browser ini (batas ±400 KB). Akun latihan jangan memakai password asli.
- Cloud sync hanya menerima **publishable key** (`sb_publishable_…`) atau anon key lama. **Secret key / service_role ditolak** karena melewati RLS. Token sesi disimpan di sessionStorage (hilang saat tab ditutup); password tidak disimpan. File proyek di IndexedDB **tidak** ikut dicadangkan — tetap gunakan ZIP.
- Sebelum memulihkan dari cloud, DevStudio mengunduh salinan progres saat ini.
- Tidak ada tombol AI: AI Coding Mentor butuh backend dengan API key berbayar; polanya diajarkan di pelajaran *Backend* (serverless function + environment variable).

**Data Supabase yang dipakai (dicek 13 Oktober 2026):** penamaan kunci publishable/secret dan perubahan Data API (tabel baru perlu `GRANT` eksplisit) dari dokumentasi & changelog resmi Supabase; batas paket gratis dari ringkasan pihak ketiga — **cek halaman harga resmi**.

**Cara menguji Phase 7:**
1. Buka **Full-Stack** di menu → tab *Mock API* → *Kirim request*: klik “daftar”, kirim, lalu `GET /api/todos` dengan dan tanpa token (200 vs 401).
2. Tab *SQL Lab*: kerjakan tantangan 1, lalu coba `SELECT * FROM murid` untuk melihat penjelasan error.
3. **Coding Lab** → “Daftar dari API”: kerjakan, buka tab *API*, ubah simulasi ke “Server error (500)” lalu Run.
4. Lulus checkpoint `api-2` → **Projects → Library → Aplikasi CRUD Inventaris** → buka editor; tambah barang di preview dan lihat tab *API*.
5. (Opsional, butuh akun Supabase) tab *Supabase & Cloud*: ikuti langkah penyiapan, lalu uji dua akun berbeda.
6. `npm test` (119 test) dan `npm run build`.

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
lalu cek file itu muncul di editor proyek. Jalankan `npm test` dan `npm run build`.

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

## Phase 1 — Foundation

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
