# DevStudio Academy — My Web Development Laboratory

Laboratorium pribadi untuk **belajar, mempraktikkan, membangun, dan menerbitkan** website dan web application.
Metode: **Learn → Practice → Build → Test → Review → Commit → Deploy → Reflect.**

Semua delapan fase roadmap sudah selesai. DevStudio berjalan sepenuhnya di browser (tanpa server
sendiri), menyimpan data di perangkatmu, dan tidak memiliki tombol yang hanya *terlihat* berfungsi.
Fitur yang berupa simulasi diberi label jelas.

---

## Fitur

| Area | Isi |
|---|---|
| **Dashboard & Skill Tracker** | Target harian, progres, aktivitas 7 hari, tugas berikutnya. Skill dinilai dari **bukti** (checkpoint, tugas proyek, tantangan), bukan jumlah materi yang dibaca. |
| **Learning Path** | 12 modul, **44 pelajaran**: HTML, CSS, JavaScript, DOM, Git & GitHub, React & Vite, API, Backend, Database & Auth, Deployment, Testing/Aksesibilitas/Keamanan/Performa, Advanced. Setiap pelajaran: konsep, contoh, langkah praktik, tantangan, petunjuk bertahap, error umum, kuis checkpoint. |
| **Coding Lab** | Editor CodeMirror, preview terisolasi, console + penjelasan error, Format (Prettier), Explain, 12 tantangan terperiksa otomatis (termasuk debugging & API), playground. |
| **Project Workspace** | 5 template proyek (3 dasar + 2 full-stack yang terbuka setelah checkpoint), proyek bebas, editor multi-file, impor file/folder/ZIP, checkpoint dengan diff, pemeriksaan otomatis, ekspor ZIP, sinkron folder lokal (Chrome/Edge). |
| **Git & GitHub** | Simulator terminal Git dengan 8 misi, GitHub Learning Center level 1–4, data GitHub publik (tanpa token) dengan mode DEMO berlabel. |
| **Local Workflow** | Pemeriksa kesiapan komputer, panduan VS Code/terminal/dev server/Claude Code. |
| **Deployment Academy** | 6 pelajaran, perbandingan GitHub Pages/Netlify/Vercel **bertanggal & bersumber**, “Siap deploy?”, generator konfigurasi, analisis build log, pembuat record DNS. |
| **Full-Stack Lab** | Mock API di preview (REST, validasi, login dengan hash, aturan akses per baris), **SQL Lab** dengan SQLite asli, cadangan opsional ke Supabase milikmu (RLS), checklist deploy full-stack. |
| **Mentor lokal** | Review kode (keamanan, aksesibilitas, kualitas, performa), penjelasan error & istilah, pesan commit, README, kerangka unit test — **berbasis aturan, bukan AI**. |

Rincian per fase: [docs/PHASES.md](docs/PHASES.md) · Checklist uji manual: [docs/MANUAL-TESTING.md](docs/MANUAL-TESTING.md) · Model keamanan: [SECURITY.md](SECURITY.md)

---

## Phase 8 — Polish (ringkasan)

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

---

## Arsitektur

```
Browser
 └─ React SPA (Vite + TypeScript + Tailwind CSS), HashRouter (/#/…) → jalan di hosting statis
     ├─ StoreProvider → state + simpan otomatis ke localStorage (divalidasi sanitizeState)
     ├─ IndexedDB     → file proyek, gambar (SHA-256), checkpoint, izin folder lokal
     ├─ iframe sandbox (tanpa allow-same-origin) → preview kode pengguna
     │    └─ postMessage + token → console, error, hasil cek, request Mock API
     ├─ sql.js (WebAssembly)     → SQL Lab, dimuat saat dibuka
     └─ fetch → api.github.com (publik) · *.supabase.co (opsional, milik pengguna)
```

```
src/
├── App.tsx, main.tsx, index.css
├── components/   UI reusable (Layout, CodeBlock, Modal, kartu proyek)
├── pages/        satu file per halaman (dimuat lazy)
├── data/         kurikulum, tantangan, template proyek, skill, mode
├── lab/          editor, runtime preview, pelindung loop, glosarium, penjelasan error
├── workspace/    IndexedDB, impor, pohon file, checkpoint & diff, audit, folder lokal
├── git/ github/  simulator Git & klien GitHub publik
├── deploy/       data hosting, “Siap deploy?”, build log, konfigurasi
├── fullstack/    Mock API, SQL Lab, sinkronisasi Supabase
├── mentor/       review kode & pembantu commit/README/tes
├── lib/          store, storage, progres, unduhan
└── test/         Vitest + Testing Library + axe-core
docs/             riwayat fase & checklist uji manual
.github/workflows ci.yml (test + build) · deploy-pages.yml (manual)
```

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
| `npm test` | Menjalankan semua test (unit, komponen, dan audit aksesibilitas) |
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

## Menerbitkan DevStudio sendiri (GitHub Pages)

Workflow `.github/workflows/deploy-pages.yml` **hanya berjalan manual**. Sekali saja:
GitHub → **Settings → Pages → Source: GitHub Actions**, lalu **Actions → Deploy DevStudio to GitHub Pages → Run workflow**.
Aplikasi memakai `base: './'` dan HashRouter sehingga berjalan di `https://<user>.github.io/<repo>/`.

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
git commit -m "feat: tambah halaman kontak"
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
