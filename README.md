# DevStudio Academy — My Web Development Laboratory

Laboratorium pribadi untuk **belajar, mempraktikkan, membangun, dan menerbitkan** website.
Metode: **Learn → Practice → Build → Test → Review → Commit → Deploy → Reflect.**

> Versi ini adalah **Phase 1 — Foundation**. Fitur fase berikutnya ditandai dengan label
> “Phase N” di aplikasi; tidak ada tombol yang hanya *terlihat* berfungsi.

---

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
     ├─ data/                 → kurikulum, template proyek, skill (konten statis, bisa di-review di Git)
     └─ iframe sandbox        → preview kode yang terisolasi (lihat Keamanan)
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
│   ├── data/                # curriculum.ts, projects.ts, skills.ts, modes.ts
│   ├── lib/                 # store, storage, progress, preview, highlight, download
│   └── test/                # Unit & component test (Vitest + Testing Library)
├── vite.config.ts
└── tsconfig.json
```

### Keamanan

- Preview kode berjalan di `<iframe sandbox="allow-scripts allow-forms">` **tanpa** `allow-same-origin`,
  sehingga kode di dalamnya tidak bisa membaca localStorage, cookie, atau DOM aplikasi.
- Setiap dokumen preview diberi Content-Security-Policy `default-src 'none'` — tidak bisa memuat
  apa pun dari internet atau mengirim data keluar.
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
npm test          # 17 test: konten kurikulum, validasi data, progres, preview, alur kuis
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
