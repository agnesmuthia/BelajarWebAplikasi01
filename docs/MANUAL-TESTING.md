# Checklist pengujian manual

Pengujian otomatis: `npm test`. Langkah di bawah menguji hal yang hanya bisa dinilai manusia (tampilan, alur, izin browser).

## Phase 1–5

Otomatis:

```bash
npm test          # semua unit, komponen, dan audit aksesibilitas
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
