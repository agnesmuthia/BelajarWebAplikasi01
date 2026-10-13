# Keamanan DevStudio Academy

DevStudio adalah aplikasi web statis (React SPA) **tanpa server sendiri**. Dokumen ini menjelaskan
data apa yang disimpan, di mana, dan perlindungan yang dipasang — termasuk batasannya.

## Data & privasi

| Data | Lokasi | Keluar dari browser? |
|---|---|---|
| Progres, pengaturan, catatan proyek | `localStorage` (`devstudio:v1`) | Tidak, kecuali kamu mengekspor backup atau memakai cadangan Supabase |
| File & gambar proyek, checkpoint | IndexedDB (`devstudio-workspace`) | Tidak, kecuali kamu mengunduh ZIP / menyimpan ke folder lokal |
| Draft Coding Lab, draft SQL | `localStorage` | Tidak |
| Data Mock API (akun latihan berupa hash) | `localStorage` (`devstudio-mockdb:*`) | Tidak |
| URL & publishable key Supabase (opsional) | `localStorage` jika dicentang “Ingat” | Dikirim hanya ke proyek Supabase-mu |
| Token sesi Supabase | `sessionStorage` (hilang saat tab ditutup) | Dikirim hanya ke proyek Supabase-mu |

Permintaan jaringan yang dilakukan aplikasi: `api.github.com` (data publik, tanpa token) dan
`*.supabase.co` (hanya jika kamu menghubungkan proyek Supabase). Tidak ada analitik atau pelacak.

## Perlindungan

**Isolasi kode pengguna.** Preview Coding Lab, editor proyek, dan contoh pelajaran berjalan di
`<iframe sandbox="allow-scripts allow-forms">` **tanpa** `allow-same-origin`: kode di dalamnya
berada di origin terpisah dan tidak bisa membaca localStorage, IndexedDB, cookie, atau DOM DevStudio.
Setiap dokumen preview juga diberi CSP sendiri (`default-src 'none'`, tanpa `connect-src`).

**Saluran pesan.** Aplikasi hanya menerima `postMessage` dari iframe preview yang aktif
(`event.source`) **dan** dengan token acak milik run saat itu. Balasan Mock API dikirim hanya ke
iframe tersebut. Output console dibatasi jumlahnya.

**Content-Security-Policy (build produksi).** Disisipkan oleh `vite.config.ts`:

| Direktif | Nilai | Alasan |
|---|---|---|
| `default-src` | `'self'` | Hanya file DevStudio sendiri |
| `script-src` | `'self' 'unsafe-inline' 'wasm-unsafe-eval'` | `'unsafe-inline'` dibutuhkan karena iframe `srcdoc` preview **mewarisi** CSP halaman induk dan menjalankan skrip inline; `wasm-unsafe-eval` untuk SQLite (SQL Lab) |
| `connect-src` | `'self' https://api.github.com https://*.supabase.co` | Membatasi ke mana data bisa dikirim |
| `img-src`, `media-src` | `'self' data: blob: https:` | Gambar proyek (data/blob) dan gambar https di latihan |
| `object-src` / `base-uri` / `form-action` | `'none'` | Menutup plugin, manipulasi `<base>`, dan pengiriman form |

Batasan: karena `'unsafe-inline'`, CSP ini tidak menjadi lapisan utama melawan XSS — lapisan
utamanya adalah React (teks di-escape), tidak adanya `innerHTML` untuk data dinamis, dan sandbox
preview. CSP lewat `<meta>` tidak mendukung `frame-ancestors`; gunakan header HTTP di hosting jika
perlu. Domain kustom Supabase (bukan `*.supabase.co`) perlu ditambahkan ke `connect-src`.

**Validasi data.** Semua data dari localStorage dan file backup melewati `sanitizeState`
(tipe, panjang, jumlah maksimum). URL hanya diterima jika `http(s)`; link repository harus
`https://github.com/…`. Path file impor dinormalisasi (tanpa `..`), ukuran dibatasi.

**Kunci & rahasia.** Tidak ada API key, token, atau password di source code. Cadangan Supabase
menolak secret key (`sb_secret_…`) dan JWT `service_role`; hanya publishable/anon key yang
diterima, dan tabelnya dilindungi Row Level Security (lihat SQL penyiapan di aplikasi).
Pemeriksa “Siap deploy?” dan Mentor lokal memindai pola token umum sebelum proyek dipublikasikan.

**Akses file lokal.** Hanya folder yang dipilih pengguna lewat dialog browser (File System Access
API), izin diminta ulang tiap sesi, dan DevStudio tidak pernah menghapus file di komputer.

**Rantai pasok.** `npm audit` dijalankan setiap fase (hasil terakhir: 0 kerentanan). CI hanya
punya izin baca; workflow deploy hanya berjalan manual.

## Fitur yang sengaja TIDAK diaktifkan

- **Akses tulis GitHub (push/buat repo dari DevStudio):** butuh GitHub App + serverless function
  untuk menukar token. Gunakan VS Code, GitHub Desktop, atau terminal.
- **Mentor AI:** butuh backend dengan API key berbayar. Yang tersedia adalah Mentor lokal berbasis aturan.

## Melaporkan masalah keamanan

Jangan membuka issue publik berisi detail celah. Hubungi pemilik repository secara pribadi
melalui GitHub, sertakan langkah reproduksi dan dampaknya.
