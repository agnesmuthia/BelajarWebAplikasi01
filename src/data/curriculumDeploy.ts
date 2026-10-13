import type { Lesson } from './curriculum'

/** Deployment Academy (Phase 6). Angka harga/batas lengkap ada di halaman Deploy (dengan tanggal pengecekan). */
export const deployLessons: Lesson[] = [
  {
    id: 'deploy-1',
    title: 'Localhost, Build, dan Jenis Website',
    minutes: 20,
    goal: 'Membedakan development server, hasil build, dan website statis vs aplikasi yang butuh server.',
    concepts: [
      '*Development server* (`npm run dev`, Live Server) hanya untuk bekerja: cepat, memuat ulang otomatis, dan hanya bisa dibuka dari komputermu (`localhost`).',
      '*Build* (`npm run build`) mengubah kode sumber menjadi file siap online di folder `dist`: digabung, diperkecil (minify), dan dioptimalkan. `npm run preview` menjalankan hasil build itu di komputermu sebelum dipublikasikan.',
      '*Website statis* hanya berisi file HTML/CSS/JS/gambar yang dikirim apa adanya — bisa di-hosting di GitHub Pages, Netlify, atau Vercel. Website HTML biasa (tanpa package.json) bahkan tidak perlu build.',
      '*Aplikasi dengan server* (login, database, API dengan kunci rahasia) membutuhkan backend atau serverless function. GitHub Pages tidak bisa menjalankannya; ini dibahas di Phase 7.',
      'Port (`:5173`, `:3000`) adalah “pintu” di komputermu. Setelah online, website memakai port standar HTTPS (443) sehingga port tidak terlihat di alamat.',
    ],
    example: {
      language: 'bash',
      caption: 'Siklus proyek Vite sebelum deploy. Jalankan di folder yang berisi package.json.',
      code: `npm run dev       # bekerja: http://localhost:5173 (Ctrl+C untuk berhenti)
npm run build     # membuat folder dist/
npm run preview   # mencoba hasil build: http://localhost:4173`,
    },
    steps: [
      'Di proyek Vite (mis. DevStudio ini), jalankan npm run build dan lihat isi folder dist.',
      'Jalankan npm run preview dan buka alamatnya — inilah yang akan dilihat pengunjung.',
      'Untuk proyek HTML biasa dari DevStudio: buka tab Repo & Deploy dan jalankan pemeriksaan “Siap deploy?”.',
    ],
    challenge: 'Tentukan jenis setiap proyekmu: statis tanpa build, statis dengan build (Vite), atau butuh server. Tulis alasannya di catatan proyek.',
    hints: ['Ada package.json dengan script build → statis dengan build.', 'Hanya .html/.css/.js → statis tanpa build.', 'Butuh menyimpan data pengguna atau kunci rahasia → butuh server.'],
    commonErrors: [
      { error: 'Halaman putih setelah membuka dist/index.html dengan klik dua kali.', fix: 'Hasil build sebaiknya dicoba dengan npm run preview (server), bukan file://.' },
      { error: 'Mengupload folder src atau seluruh proyek ke hosting.', fix: 'Untuk proyek Vite yang dipublikasikan adalah folder dist (hasil build).' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Perintah untuk membuat versi siap online dari proyek Vite adalah…', options: [{ text: 'npm run dev', why: 'Itu untuk bekerja di komputer.' }, { text: 'npm run build', correct: true, why: 'Benar — hasilnya di folder dist.' }, { text: 'npm install', why: 'Itu memasang dependensi.' }] },
      { id: 'q2', prompt: 'Website sekolah berisi HTML, CSS, dan gambar saja termasuk…', options: [{ text: 'Website statis — bisa di GitHub Pages.', correct: true, why: 'Benar.' }, { text: 'Aplikasi yang wajib punya server.', why: 'Tidak ada logika server.' }] },
      { id: 'q3', prompt: 'Mengapa localhost:5173 tidak bisa dibuka oleh temanmu di rumahnya?', options: [{ text: 'Karena localhost berarti komputer itu sendiri; server hanya berjalan di komputermu.', correct: true, why: 'Benar — perlu deployment agar bisa diakses publik.' }, { text: 'Karena port 5173 berbayar.', why: 'Port tidak berbayar.' }] },
    ],
    skills: ['deployment'],
  },
  {
    id: 'deploy-2',
    title: 'GitHub Pages',
    minutes: 25,
    goal: 'Menerbitkan website statis gratis dari repository GitHub, dengan atau tanpa proses build.',
    concepts: [
      'GitHub Pages menerbitkan file dari repository menjadi website di `https://username.github.io/nama-repo/`. Gratis untuk repository publik; repository privat butuh paket berbayar.',
      '*Deploy from a branch*: paling sederhana untuk HTML biasa — pilih branch main dan folder root. Setiap push memperbarui website dalam 1–2 menit.',
      '*GitHub Actions*: untuk proyek yang perlu build (Vite). Workflow menjalankan npm ci & npm run build lalu menerbitkan folder dist. DevStudio bisa membuatkan file workflow-nya.',
      'Karena situs berada di subfolder `/nama-repo/`, path absolut seperti `/css/style.css` akan rusak. Gunakan path relatif, dan untuk Vite atur `base` (DevStudio memakai `base: "./"`).',
      'Batas penting: situs ≤ 1 GB, bandwidth ±100 GB/bulan (lunak), dan Pages tidak ditujukan untuk toko online/bisnis komersial. Lihat tabel lengkap & tanggal pengecekan di halaman Deploy.',
    ],
    example: {
      language: 'text',
      caption: 'Pengaturan di github.com → repository → Settings → Pages.',
      code: `HTML statis:
  Build and deployment → Source: Deploy from a branch
  Branch: main   Folder: / (root)   → Save

Proyek Vite:
  Source: GitHub Actions
  Commit file .github/workflows/deploy-pages.yml (dibuat DevStudio)

Alamat situs:
  https://USERNAME.github.io/NAMA-REPO/`,
    },
    steps: [
      'Pastikan proyek lolos pemeriksaan “Siap deploy?” di tab Repo & Deploy.',
      'Push proyek ke repository publik (lihat Local Workflow langkah 7).',
      'Settings → Pages → pilih sumber sesuai jenis proyek → tunggu tulisan “Your site is live at…”.',
      'Buka situs di ponsel, lalu simpan URL-nya di tab Repo & Deploy dan tandai proyek sebagai Dipublikasikan.',
    ],
    challenge: 'Terbitkan Portfolio Developer-mu di GitHub Pages, lalu tambahkan link-nya di README repository.',
    hints: ['Repository harus publik untuk paket gratis.', 'index.html harus berada di root branch.', 'Perubahan butuh 1–2 menit; muat ulang dengan Ctrl+F5.'],
    commonErrors: [
      { error: '404 “There isn’t a GitHub Pages site here.”', fix: 'Pages belum aktif, index.html tidak di root, atau alamat salah ketik (nama repo peka huruf besar/kecil di path).' },
      { error: 'Gambar/CSS hilang tetapi HTML tampil.', fix: 'Path absolut (/css/…) atau beda huruf besar/kecil nama file. Jalankan pemeriksaan “Siap deploy?”.' },
      { error: 'Workflow gagal: “Get Pages site failed”.', fix: 'Settings → Pages → Source harus “GitHub Actions” sebelum workflow dijalankan.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Alamat GitHub Pages untuk repository “portfolio” milik “agnes” adalah…', options: [{ text: 'https://agnes.github.io/portfolio/', correct: true, why: 'Benar.' }, { text: 'https://github.com/agnes/portfolio', why: 'Itu halaman repository, bukan website.' }, { text: 'https://portfolio.github.com', why: 'Format ini tidak dipakai.' }] },
      { id: 'q2', prompt: 'Di situs https://agnes.github.io/portfolio/, mengapa src="/img/a.png" rusak?', options: [{ text: '“/” menunjuk ke agnes.github.io/img/a.png — di luar folder /portfolio/.', correct: true, why: 'Benar. Gunakan path relatif img/a.png.' }, { text: 'Karena GitHub Pages tidak mendukung PNG.', why: 'PNG didukung.' }] },
      { id: 'q3', prompt: 'Proyek Vite sebaiknya diterbitkan ke Pages dengan…', options: [{ text: 'Deploy from a branch tanpa build.', why: 'Kode Vite harus di-build dulu.' }, { text: 'Workflow GitHub Actions yang menjalankan build lalu menerbitkan dist.', correct: true, why: 'Benar.' }] },
    ],
    skills: ['deployment', 'github'],
  },
  {
    id: 'deploy-3',
    title: 'Netlify & Vercel: Deploy Otomatis dan Preview',
    minutes: 25,
    goal: 'Menghubungkan repository ke Netlify atau Vercel, mengatur build, environment variable, dan memahami preview deployment.',
    concepts: [
      'Kedua platform: login dengan GitHub → “Add new site/project” → pilih repository → atur *build command* dan *output/publish directory* → Deploy. Setiap push ke main menjadi *production deploy*.',
      '*Preview deployment*: setiap Pull Request mendapat URL sementara untuk dicek sebelum merge — sangat berguna saat bekerja dengan klien atau tim.',
      '*Environment variables* diatur di Settings platform (bukan di-commit). Variabel berawalan `VITE_` dimasukkan ke JavaScript browser saat build, jadi JANGAN diisi rahasia.',
      'Perhatikan aturan paket gratis: *Vercel Hobby hanya untuk non-komersial*; Netlify Free memakai sistem kredit dengan batas keras (situs dijeda bila kredit habis). Website klien = rencanakan paket berbayar.',
      '*Vendor lock-in*: fitur khusus platform (form Netlify, Edge Config, dll.) membuat proyek sulit dipindah. Untuk website statis, pindah platform cukup dengan menghubungkan repository yang sama ke layanan lain.',
    ],
    example: {
      language: 'text',
      caption: 'Pengaturan build umum.',
      code: `HTML statis (proyek DevStudio):
  Build command:   (kosong)
  Publish/Output:  .   (folder utama)

Proyek Vite:
  Build command:   npm run build
  Publish/Output:  dist
  Node version:    22   (atau file .nvmrc)`,
    },
    steps: [
      'Tambahkan netlify.toml dari tab Repo & Deploy (opsional, agar pengaturan ikut tersimpan di repository).',
      'Hubungkan repository di Netlify atau Vercel dan deploy.',
      'Buat branch, ubah satu teks, buka Pull Request, dan buka URL preview-nya.',
      'Merge PR dan perhatikan production deploy berjalan otomatis.',
    ],
    challenge: 'Deploy proyek yang sama ke GitHub Pages dan Netlify (atau Vercel). Bandingkan: kecepatan deploy, URL, preview, dan pengaturannya. Tulis perbandingannya di catatan proyek.',
    hints: ['Satu repository boleh dihubungkan ke beberapa platform sekaligus.', 'Gunakan nama situs yang mudah dibaca, mis. wisata-takalar.netlify.app.', 'Untuk proyek pribadi non-komersial Vercel Hobby boleh dipakai.'],
    commonErrors: [
      { error: 'Deploy berhasil tapi halaman putih.', fix: 'Publish directory salah (harus dist untuk Vite) atau base path tidak relatif.' },
      { error: 'Variabel dari .env tidak terbaca di website online.', fix: 'File .env tidak ikut deploy — tambahkan variabel di pengaturan platform, lalu deploy ulang.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Website untuk klien yang membayarmu sebaiknya TIDAK memakai…', options: [{ text: 'Vercel Hobby (non-komersial).', correct: true, why: 'Benar — butuh paket Pro atau platform lain.' }, { text: 'Repository GitHub.', why: 'Repository tetap dipakai.' }] },
      { id: 'q2', prompt: 'Preview deployment berguna untuk…', options: [{ text: 'Mengecek perubahan di PR sebelum digabung ke production.', correct: true, why: 'Benar.' }, { text: 'Menyimpan password.', why: 'Tidak.' }] },
      { id: 'q3', prompt: 'Nilai VITE_API_KEY di environment variable…', options: [{ text: 'Aman karena tidak di-commit.', why: 'Tetap ikut ke JavaScript yang dibaca browser.' }, { text: 'Bisa dibaca siapa pun lewat DevTools setelah build.', correct: true, why: 'Benar — rahasia harus di serverless function.' }] },
    ],
    skills: ['deployment'],
  },
  {
    id: 'deploy-4',
    title: 'Membaca Build Log & Troubleshooting',
    minutes: 20,
    goal: 'Menemukan penyebab deploy gagal dari log dan memperbaikinya secara sistematis.',
    concepts: [
      'Build log adalah catatan langkah demi langkah di server: clone repository → install → build → upload. Deploy gagal = salah satu langkah keluar dengan error.',
      'Baca dari *error pertama*, bukan baris terakhir. Error berikutnya sering akibat error pertama.',
      'Server hosting memakai Linux: huruf besar/kecil nama file dibedakan, versi Node bisa berbeda, dan hanya file yang di-commit yang tersedia.',
      'Selalu reproduksi di komputer: jalankan perintah yang sama (`npm ci`, `npm run build`). Jika gagal juga di komputer, perbaiki di sana dulu.',
      'Gunakan *Penganalisis Build Log* di halaman Deploy: tempel log, DevStudio menunjukkan baris error pertama dan penyebab umum yang cocok.',
    ],
    example: {
      language: 'text',
      caption: 'Potongan log gagal — perhatikan baris error pertama.',
      code: `> vite build
✓ 31 modules transformed.
error during build:
Could not resolve "./components/Header" from "src/App.jsx"
# File sebenarnya bernama src/components/header.jsx (h kecil).
# Windows mengabaikan perbedaan ini; server Linux tidak.`,
    },
    steps: [
      'Buka halaman Deploy → Penganalisis Build Log dan tempel contoh log di atas.',
      'Sengaja buat build gagal di repository latihan (mis. ganti nama file dengan huruf besar), push, lalu baca log aslinya.',
      'Perbaiki, push ulang, dan pastikan deploy hijau.',
    ],
    challenge: 'Kumpulkan tiga error deploy yang pernah kamu alami beserta penyebab dan perbaikannya di catatan proyek — ini menjadi “buku resep” pribadimu.',
    hints: ['Cari kata error, failed, ERR!, atau fatal.', 'Bandingkan versi Node di log dengan node -v di komputermu.', 'git status memastikan semua file sudah di-commit.'],
    commonErrors: [
      { error: 'Membaca hanya baris terakhir “Build failed”.', fix: 'Gulir ke atas sampai baris error pertama.' },
      { error: 'Deploy ulang berkali-kali tanpa mengubah apa pun.', fix: 'Deploy ulang hanya membantu untuk gangguan server sesaat. Error kode tetap muncul sampai diperbaiki.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Build sukses di Windows tetapi gagal di server dengan “Could not resolve ./Logo.png”. Penyebab paling mungkin?', options: [{ text: 'Nama file sebenarnya logo.png — server membedakan huruf besar/kecil.', correct: true, why: 'Benar.' }, { text: 'Server tidak mendukung PNG.', why: 'Tidak benar.' }] },
      { id: 'q2', prompt: 'Langkah pertama saat membaca log gagal adalah…', options: [{ text: 'Mencari baris error pertama.', correct: true, why: 'Benar.' }, { text: 'Menghapus repository.', why: 'Tidak perlu.' }] },
      { id: 'q3', prompt: 'Log menyebut “npm ci can only install packages when your package.json and package-lock.json are in sync”. Perbaikannya…', options: [{ text: 'Jalankan npm install di komputer lalu commit package-lock.json.', correct: true, why: 'Benar.' }, { text: 'Hapus package.json.', why: 'Proyek akan rusak.' }] },
    ],
    skills: ['deployment'],
  },
  {
    id: 'deploy-5',
    title: 'Domain, DNS, dan HTTPS',
    minutes: 25,
    goal: 'Memahami cara kerja domain & DNS, memasang domain sendiri, dan memastikan HTTPS aktif.',
    concepts: [
      '*Domain* (mis. `sekolahku.sch.id`) adalah nama yang disewa per tahun dari *registrar*. *DNS* adalah “buku telepon” yang menerjemahkan nama itu ke alamat server.',
      'Domain .id dikelola PANDI. Domain `.sch.id` khusus satuan pendidikan dan pendaftarannya memerlukan dokumen resmi sekolah — urus bersama pihak sekolah, jangan atas nama pribadi.',
      'Record DNS utama: *A* (nama → alamat IPv4), *AAAA* (IPv6), *CNAME* (nama → nama lain, mis. www → username.github.io), *TXT* (verifikasi kepemilikan). Perubahan DNS butuh waktu menyebar (menit sampai ±48 jam) tergantung TTL.',
      'Platform hosting memberi sertifikat HTTPS gratis (Let’s Encrypt) setelah DNS benar. Aktifkan “Enforce HTTPS” agar pengunjung selalu memakai koneksi aman.',
      'Biaya domain dibayar tahunan dan harga perpanjangan bisa lebih mahal dari tahun pertama. Catat tanggal kedaluwarsa dan aktifkan perpanjangan otomatis; domain yang kedaluwarsa bisa dibeli orang lain.',
    ],
    example: {
      language: 'text',
      caption: 'Contoh record DNS untuk GitHub Pages (nilai resmi selalu cek di dokumentasi/dashboard platform).',
      code: `Tipe   Host   Nilai
A      @      185.199.108.153
A      @      185.199.109.153
A      @      185.199.110.153
A      @      185.199.111.153
CNAME  www    username.github.io`,
    },
    steps: [
      'Gunakan Pembuat Record DNS di halaman Deploy untuk platform pilihanmu.',
      'Di panel registrar domain, tambahkan record tersebut.',
      'Di platform hosting, isi Custom domain dan tunggu verifikasi; lalu aktifkan Enforce HTTPS.',
      'Cek dari ponsel dengan data seluler (bukan Wi-Fi yang sama) untuk memastikan perubahan sudah menyebar.',
    ],
    challenge: 'Buat rencana domain untuk website sekolah: nama domain yang diusulkan, siapa pemilik akunnya (atas nama sekolah), perkiraan biaya tahunan dari registrar resmi, dan siapa yang bertanggung jawab memperpanjang.',
    hints: ['Daftar registrar resmi .id tersedia di situs PANDI.', 'Akun registrar sebaiknya memakai email sekolah, bukan email pribadi.', 'Simpan akses akun di tempat aman yang bisa diakses lebih dari satu orang.'],
    commonErrors: [
      { error: 'Domain belum terbuka setelah 5 menit.', fix: 'Propagasi DNS butuh waktu. Cek ejaan record; tunggu sesuai TTL.' },
      { error: '“Not secure” atau sertifikat tidak valid.', fix: 'Tunggu sertifikat diterbitkan setelah DNS benar, lalu aktifkan Enforce HTTPS. Pastikan tidak ada gambar http://.' },
      { error: 'Record A dan CNAME untuk host yang sama.', fix: 'Satu host tidak boleh punya CNAME bersama record lain. Gunakan A untuk @ dan CNAME untuk www.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Record yang menghubungkan www.contoh.id ke username.github.io adalah…', options: [{ text: 'CNAME', correct: true, why: 'Benar — CNAME menunjuk ke nama lain.' }, { text: 'TXT', why: 'TXT untuk teks/verifikasi.' }, { text: 'MX', why: 'MX untuk email.' }] },
      { id: 'q2', prompt: 'Siapa yang sebaiknya menjadi pemilik domain website sekolah?', options: [{ text: 'Sekolah (akun resmi sekolah).', correct: true, why: 'Benar — agar tidak hilang saat pengelola berganti.' }, { text: 'Akun pribadi siswa/guru yang membuat website.', why: 'Berisiko jika orang tersebut pindah.' }] },
      { id: 'q3', prompt: 'Mengapa domain baru belum bisa dibuka beberapa menit setelah record diatur?', options: [{ text: 'Propagasi DNS membutuhkan waktu (tergantung TTL).', correct: true, why: 'Benar.' }, { text: 'Domain .id dilarang.', why: 'Tidak benar.' }] },
    ],
    skills: ['deployment'],
  },
  {
    id: 'deploy-6',
    title: 'Monitoring, Backup, Biaya, dan Pindah Layanan',
    minutes: 20,
    goal: 'Merawat website setelah online: memantau, mencadangkan, menghitung biaya, dan berpindah dari layanan gratis ke berbayar.',
    concepts: [
      '*Monitoring*: gunakan layanan uptime check (banyak yang punya paket gratis) untuk memberi tahu lewat email jika website tidak bisa dibuka. Periksa juga analitik kunjungan dari platform hosting.',
      '*Logging*: platform menyimpan log deploy dan (untuk functions) log runtime. Baca log saat ada laporan error dari pengguna.',
      '*Backup*: untuk website statis, repository GitHub adalah backup utama — ditambah salinan lokal (git clone) dan ZIP. Data database (Phase 7) perlu backup terpisah dan terjadwal.',
      '*Biaya*: komponen biaya = domain (tahunan) + hosting (bulanan, jika melewati kuota gratis) + bandwidth/pemakaian + layanan tambahan. Catat dalam tabel dan cek ulang setiap tahun karena harga bisa berubah.',
      '*Pindah layanan*: website statis mudah dipindah — hubungkan repository ke platform baru, uji di subdomain platform, lalu ubah record DNS. Turunkan TTL sehari sebelum pindah agar perubahan cepat menyebar.',
    ],
    example: {
      language: 'text',
      caption: 'Contoh tabel biaya tahunan website sekolah (isi dengan harga resmi terbaru).',
      code: `Komponen              Layanan             Biaya/tahun
Domain .sch.id        Registrar resmi     Rp ...
Hosting statis        GitHub Pages        Rp 0 (repository publik)
Uptime monitoring     Paket gratis        Rp 0
Cadangan              GitHub + ZIP        Rp 0
Total                                     Rp ...`,
    },
    steps: [
      'Tambahkan website yang sudah online ke layanan uptime monitoring pilihanmu.',
      'Buat tabel biaya seperti contoh dengan harga resmi terbaru.',
      'Uji backup: clone repository ke folder baru dan jalankan — apakah lengkap?',
    ],
    challenge: 'Tulis “Dokumen Serah Terima Website” untuk sekolah: daftar akun (GitHub, hosting, domain), siapa pemiliknya, tanggal perpanjangan, biaya, cara deploy ulang, dan kontak darurat. Jangan menuliskan password di dokumen itu.',
    hints: ['Gunakan pengelola kata sandi untuk menyimpan akses akun.', 'Sertakan langkah deploy ulang dari README.', 'Catat tanggal perpanjangan domain di kalender sekolah.'],
    commonErrors: [
      { error: 'Website mati karena domain lupa diperpanjang.', fix: 'Aktifkan perpanjangan otomatis dan pengingat; gunakan email sekolah yang aktif.' },
      { error: 'Situs dijeda karena kuota paket gratis habis.', fix: 'Kompres gambar, periksa trafik, dan pertimbangkan pindah paket/platform. Inilah alasan memantau pemakaian.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Backup utama untuk website statis adalah…', options: [{ text: 'Repository Git (ditambah salinan lokal).', correct: true, why: 'Benar.' }, { text: 'Screenshot halaman.', why: 'Screenshot tidak bisa dipakai memulihkan website.' }] },
      { id: 'q2', prompt: 'Sebelum memindahkan domain ke platform baru, sebaiknya…', options: [{ text: 'Menurunkan TTL record DNS beberapa waktu sebelumnya.', correct: true, why: 'Benar — perubahan lebih cepat menyebar.' }, { text: 'Menghapus repository lama.', why: 'Jangan — itu backup-mu.' }] },
      { id: 'q3', prompt: 'Informasi mana yang TIDAK boleh ditulis di dokumen serah terima?', options: [{ text: 'Password akun.', correct: true, why: 'Benar — simpan di pengelola kata sandi.' }, { text: 'Tanggal perpanjangan domain.', why: 'Justru penting dicatat.' }] },
    ],
    skills: ['deployment'],
  },
]
