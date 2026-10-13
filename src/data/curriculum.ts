import { deployLessons } from './curriculumDeploy'
import { apiLessons, backendLessons, databaseLessons } from './curriculumFullstack'
import { advancedLessons, qualityLessons, reactLessons } from './curriculumPolish'
import { githubLessons } from './curriculumGithub'
import { domLessons, jsLessons } from './curriculumJs'
import type { SkillId } from './skills'

export interface QuizOption {
  text: string
  correct?: boolean
  /** Penjelasan yang ditampilkan setelah opsi ini dipilih — benar atau salah. */
  why: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  code?: string
  options: QuizOption[]
}

export interface CodeExample {
  language: 'html' | 'css' | 'bash' | 'js' | 'yaml' | 'md' | 'sql' | 'json' | 'text'
  code: string
  caption: string
  /** Jika ada, contoh dirender di iframe terisolasi agar hasilnya terlihat. */
  previewHtml?: string
}

export interface Lesson {
  id: string
  title: string
  minutes: number
  goal: string
  /** Paragraf konsep. Teks di antara `backtick` ditampilkan sebagai kode. */
  concepts: string[]
  example: CodeExample
  steps: string[]
  challenge: string
  hints: string[]
  commonErrors: { error: string; fix: string }[]
  quiz: QuizQuestion[]
  skills: SkillId[]
  gitCheckpoint?: string
  /** Tantangan Coding Lab yang terkait. */
  lab?: string
  /** Tautan latihan lain (mis. SQL Lab) jika bukan tantangan Coding Lab. */
  practice?: { to: string; label: string }
}

export interface Module {
  id: string
  title: string
  description: string
  /** Fase roadmap ketika materi modul ini mulai tersedia. */
  phase: number
  skills: SkillId[]
  lessons: Lesson[]
}

const htmlLessons: Lesson[] = [
  {
    id: 'html-1',
    title: 'Struktur Dasar Dokumen HTML',
    minutes: 15,
    goal: 'Memahami kerangka wajib setiap halaman HTML dan fungsi setiap bagiannya.',
    concepts: [
      'HTML (HyperText Markup Language) adalah bahasa untuk memberi *struktur* pada konten web. HTML bukan bahasa pemrograman — ia tidak menghitung atau mengambil keputusan, tetapi memberi tahu browser: "ini judul", "ini paragraf", "ini gambar".',
      'Setiap elemen ditulis dengan tag pembuka dan penutup, misalnya `<p>` dan `</p>`. Isi di antaranya adalah konten elemen. Beberapa elemen tidak punya penutup, seperti `<img>` dan `<meta>`.',
      'Bayangkan dokumen HTML seperti surat resmi: `<head>` adalah amplop (informasi tentang surat, tidak dibaca sebagai isi), sedangkan `<body>` adalah isi surat yang dilihat pembaca.',
      '`<!doctype html>` di baris pertama memberi tahu browser untuk memakai standar HTML modern. `<html lang="id">` membantu pembaca layar mengucapkan teks dengan bahasa yang benar.',
    ],
    example: {
      language: 'html',
      caption: 'Kerangka minimal halaman HTML yang valid.',
      code: `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Halaman Pertamaku</title>
  </head>
  <body>
    <h1>Halo, Dunia!</h1>
    <p>Ini halaman web pertama yang saya buat.</p>
  </body>
</html>`,
      previewHtml: `<!doctype html><html lang="id"><head><meta charset="UTF-8"><title>Halaman Pertamaku</title></head><body style="font-family:system-ui;padding:16px"><h1>Halo, Dunia!</h1><p>Ini halaman web pertama yang saya buat.</p></body></html>`,
    },
    steps: [
      'Buat folder baru bernama `latihan-html` di komputer.',
      'Buka folder itu di VS Code, lalu buat file `index.html`.',
      'Ketik (jangan salin-tempel) contoh kode di atas agar jari dan mata terbiasa dengan polanya.',
      'Simpan file, lalu klik dua kali `index.html` agar terbuka di browser.',
      'Ubah teks di dalam `<h1>`, simpan, lalu tekan F5 di browser untuk melihat perubahan.',
    ],
    challenge:
      'Ubah halaman sehingga judul tab browser menjadi nama lengkapmu, lalu tambahkan dua paragraf: satu tentang dirimu dan satu tentang website yang ingin kamu buat.',
    hints: [
      'Judul tab browser diatur oleh elemen di dalam `<head>`, bukan `<h1>`.',
      'Cari elemen `<title>` — ubah teks di dalamnya.',
      'Setiap paragraf baru dibungkus `<p>...</p>` dan diletakkan di dalam `<body>`.',
    ],
    commonErrors: [
      { error: 'Perubahan tidak muncul di browser.', fix: 'Pastikan file sudah disimpan (Ctrl+S) lalu muat ulang halaman (F5).' },
      { error: 'Huruf seperti é atau emoji tampil aneh.', fix: 'Pastikan ada `<meta charset="UTF-8">` di dalam `<head>`.' },
      { error: 'Teks muncul tapi struktur berantakan.', fix: 'Periksa apakah setiap tag pembuka punya tag penutup yang cocok.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Di bagian mana kamu menulis konten yang terlihat oleh pengunjung?',
        options: [
          { text: '<head>', why: '`<head>` berisi informasi tentang halaman (judul tab, charset), bukan konten yang terlihat.' },
          { text: '<body>', correct: true, why: 'Benar. Semua yang tampil di halaman ditulis di dalam `<body>`.' },
          { text: '<title>', why: '`<title>` hanya mengatur teks di tab browser.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Apa fungsi atribut lang="id" pada tag <html>?',
        options: [
          { text: 'Menerjemahkan halaman ke bahasa Indonesia secara otomatis.', why: 'Atribut `lang` tidak menerjemahkan apa pun.' },
          { text: 'Memberi tahu browser dan pembaca layar bahasa konten halaman.', correct: true, why: 'Benar. Ini penting untuk aksesibilitas dan mesin pencari.' },
          { text: 'Wajib agar halaman bisa dibuka.', why: 'Halaman tetap terbuka tanpa `lang`, tetapi kurang aksesibel.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Manakah tag yang benar untuk menutup sebuah paragraf?',
        options: [
          { text: '<p/>', why: 'Ini bukan cara menutup elemen paragraf di HTML.' },
          { text: '<\\p>', why: 'Garis miringnya terbalik. Penutup memakai garis miring biasa: `/`.' },
          { text: '</p>', correct: true, why: 'Benar. Tag penutup diawali `</` lalu nama tag.' },
        ],
      },
    ],
    skills: ['html'],
    gitCheckpoint: 'Setelah modul Git, simpan folder `latihan-html` sebagai commit pertamamu dengan pesan: "Add first HTML page".',
  },
  {
    id: 'html-2',
    title: 'Teks, Link, dan Gambar',
    minutes: 20,
    goal: 'Menggunakan heading, paragraf, link, dan gambar dengan atribut yang benar.',
    concepts: [
      'Heading `<h1>` sampai `<h6>` menunjukkan tingkat kepentingan judul, seperti daftar isi buku. Gunakan satu `<h1>` per halaman, lalu `<h2>` untuk bagian, `<h3>` untuk sub-bagian. Jangan memilih heading hanya karena ukuran hurufnya — ukuran diatur dengan CSS.',
      'Link dibuat dengan `<a href="...">`. Nilai `href` bisa berupa alamat lengkap (`https://...`), file lain di proyekmu (`kontak.html`), atau bagian di halaman yang sama (`#galeri`).',
      'Gambar memakai `<img src="..." alt="...">`. Atribut `alt` adalah deskripsi gambar untuk pembaca layar dan muncul jika gambar gagal dimuat. Gambar dekoratif boleh memakai `alt=""` (kosong), tetapi atributnya tetap ditulis.',
      'Path relatif dihitung dari lokasi file HTML. Jika `index.html` berada di folder utama dan gambar ada di `assets/logo.png`, tulis `src="assets/logo.png"`.',
    ],
    example: {
      language: 'html',
      caption: 'Heading bertingkat, link, dan gambar dengan teks alternatif.',
      code: `<h1>Profil Saya</h1>
<h2>Tentang</h2>
<p>Saya sedang belajar membuat website di
  <a href="https://developer.mozilla.org/id/">MDN Web Docs</a>.
</p>

<h2>Foto</h2>
<img src="assets/foto-saya.jpg"
     alt="Foto saya sedang memegang laptop di perpustakaan"
     width="320">`,
      previewHtml: `<!doctype html><html lang="id"><head><meta charset="UTF-8"></head><body style="font-family:system-ui;padding:16px"><h1>Profil Saya</h1><h2>Tentang</h2><p>Saya sedang belajar membuat website di <a href="https://developer.mozilla.org/id/" target="_blank" rel="noopener">MDN Web Docs</a>.</p><h2>Foto</h2><img src="assets/foto-saya.jpg" alt="Foto saya sedang memegang laptop di perpustakaan" width="320"><p style="color:#64748b;font-size:13px">↑ File gambar belum ada, jadi browser menampilkan teks alt. Inilah gunanya alt!</p></body></html>`,
    },
    steps: [
      'Di folder `latihan-html`, buat subfolder `assets` dan simpan satu foto milikmu di sana.',
      'Tambahkan `<h2>` dan `<img>` ke `index.html` dengan path yang menunjuk ke foto itu.',
      'Tulis `alt` yang menjelaskan isi foto, bukan sekadar "foto".',
      'Tambahkan satu link ke website favoritmu.',
      'Ganti sementara nama file di `src` menjadi salah, lalu lihat apa yang ditampilkan browser.',
    ],
    challenge:
      'Buat halaman "Hobi Saya" dengan satu `<h1>`, minimal dua `<h2>`, satu gambar dengan `alt` yang deskriptif, dan satu link yang menuju bagian lain di halaman yang sama (memakai `id` dan `#`).',
    hints: [
      'Link ke bagian halaman yang sama memakai `href="#nama-id"`.',
      'Elemen tujuan harus punya atribut `id` yang sama, misalnya `<h2 id="musik">`.',
      'Nilai `id` tidak boleh mengandung spasi; gunakan tanda hubung.',
    ],
    commonErrors: [
      { error: 'Gambar tidak tampil (ikon rusak).', fix: 'Periksa ejaan nama file, huruf besar/kecil, dan ekstensi (.jpg vs .jpeg). Di hosting, `Foto.JPG` dan `foto.jpg` dianggap berbeda.' },
      { error: 'Link membuka halaman kosong / 404.', fix: 'Untuk website lain, pastikan diawali `https://`. Untuk file lokal, pastikan path relatifnya benar.' },
      { error: 'Semua heading memakai <h1> agar besar.', fix: 'Pilih heading berdasarkan struktur. Ukuran huruf diatur dengan CSS.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Teks alt yang paling baik untuk foto kepala sekolah yang sedang memberi sambutan adalah…',
        options: [
          { text: 'alt="foto"', why: 'Terlalu umum; pembaca layar tidak tahu isi foto.' },
          { text: 'alt="Kepala sekolah memberi sambutan di upacara bendera"', correct: true, why: 'Benar. Singkat, spesifik, dan menjelaskan isi gambar.' },
          { text: 'Tidak perlu alt karena gambarnya jelas.', why: 'Pengguna pembaca layar tidak bisa melihat gambar. `alt` selalu wajib.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'File index.html ada di folder utama, gambar ada di folder assets/img/logo.png. Nilai src yang benar adalah…',
        options: [
          { text: 'src="logo.png"', why: 'Browser akan mencari logo.png di folder yang sama dengan index.html.' },
          { text: 'src="assets/img/logo.png"', correct: true, why: 'Benar. Path relatif dihitung dari lokasi file HTML.' },
          { text: 'src="C:/Users/saya/Desktop/assets/img/logo.png"', why: 'Path absolut komputermu tidak akan ada di server hosting.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Berapa banyak elemen <h1> yang disarankan dalam satu halaman?',
        options: [
          { text: 'Satu, sebagai judul utama halaman.', correct: true, why: 'Benar. Ini membantu struktur, aksesibilitas, dan SEO.' },
          { text: 'Sebanyak mungkin agar teks terlihat besar.', why: 'Ukuran teks diatur dengan CSS, bukan dengan memilih heading.' },
          { text: 'Tidak boleh ada <h1>.', why: 'Setiap halaman sebaiknya punya satu judul utama.' },
        ],
      },
    ],
    skills: ['html', 'accessibility'],
    lab: 'html-profile-card',
  },
  {
    id: 'html-3',
    title: 'HTML Semantik',
    minutes: 20,
    goal: 'Menyusun halaman dengan tag semantik: header, nav, main, section, article, dan footer.',
    concepts: [
      'Tag semantik menjelaskan *makna* konten, bukan hanya tampilannya. `<div>` tidak berarti apa-apa, sedangkan `<nav>` berarti "kumpulan link navigasi".',
      'Struktur umum halaman: `<header>` (logo dan judul), `<nav>` (menu), `<main>` (isi utama — hanya satu per halaman), `<section>` (bagian bertema dengan heading), `<article>` (konten mandiri seperti berita), dan `<footer>` (kontak, hak cipta).',
      'Pembaca layar memakai tag ini sebagai "landmark" sehingga pengguna bisa melompat langsung ke menu atau isi utama. Mesin pencari juga lebih mudah memahami halamanmu.',
    ],
    example: {
      language: 'html',
      caption: 'Kerangka halaman dengan landmark semantik.',
      code: `<body>
  <header>
    <h1>Nama Website</h1>
    <nav aria-label="Menu utama">
      <a href="#profil">Profil</a>
      <a href="#berita">Berita</a>
      <a href="#kontak">Kontak</a>
    </nav>
  </header>

  <main>
    <section id="profil">
      <h2>Profil</h2>
      <p>...</p>
    </section>
    <section id="berita">
      <h2>Berita</h2>
      <article>
        <h3>Judul Berita</h3>
        <p>...</p>
      </article>
    </section>
  </main>

  <footer id="kontak">
    <p>&copy; 2026 Nama Website</p>
  </footer>
</body>`,
    },
    steps: [
      'Gambar di kertas kotak-kotak halaman yang ingin kamu buat: header, menu, isi, footer.',
      'Tulis kerangka HTML-nya dengan tag semantik sebelum menulis isi.',
      'Pastikan setiap `<section>` punya heading.',
      'Pastikan hanya ada satu `<main>`.',
    ],
    challenge:
      'Ubah halaman "Hobi Saya" dari pelajaran sebelumnya sehingga memakai `<header>`, `<nav>`, `<main>`, minimal dua `<section>`, dan `<footer>`.',
    hints: [
      'Menu link sebaiknya dibungkus `<nav>`.',
      'Setiap topik hobi bisa menjadi `<section>` dengan `<h2>` sendiri.',
      'Informasi hak cipta dan kontak cocok diletakkan di `<footer>`.',
    ],
    commonErrors: [
      { error: 'Semua dibungkus <div> sehingga struktur tidak terbaca.', fix: 'Ganti `<div>` yang punya makna jelas dengan tag semantik yang sesuai.' },
      { error: 'Memakai lebih dari satu <main>.', fix: 'Hanya satu `<main>` yang terlihat per halaman.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Tag apa yang paling tepat untuk membungkus menu navigasi utama?',
        options: [
          { text: '<div class="menu">', why: 'Bisa bekerja secara visual, tetapi tidak memberi makna ke pembaca layar.' },
          { text: '<nav>', correct: true, why: 'Benar. `<nav>` menandai kumpulan link navigasi sebagai landmark.' },
          { text: '<menu-bar>', why: 'Tag ini tidak ada di HTML standar.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Sebuah berita yang tetap bermakna jika dibaca terpisah dari halaman paling cocok dibungkus…',
        options: [
          { text: '<article>', correct: true, why: 'Benar. `<article>` untuk konten mandiri seperti berita atau posting blog.' },
          { text: '<aside>', why: '`<aside>` untuk konten pendukung, seperti sidebar.' },
          { text: '<footer>', why: '`<footer>` untuk informasi penutup, bukan isi utama.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Mengapa HTML semantik penting?',
        options: [
          { text: 'Membuat halaman otomatis berwarna.', why: 'Warna diatur oleh CSS.' },
          { text: 'Membantu pembaca layar, mesin pencari, dan developer lain memahami struktur halaman.', correct: true, why: 'Benar.' },
          { text: 'Membuat halaman lebih cepat dimuat dua kali lipat.', why: 'Tag semantik tidak secara langsung memengaruhi kecepatan.' },
        ],
      },
    ],
    skills: ['semantic-html', 'accessibility'],
  },
  {
    id: 'html-4',
    title: 'Form dan Label yang Aksesibel',
    minutes: 20,
    goal: 'Membuat form sederhana dengan label, tipe input yang tepat, dan validasi bawaan browser.',
    concepts: [
      'Form mengumpulkan data dari pengunjung. Setiap input harus punya `<label>` yang terhubung melalui atribut `for` dan `id` yang sama. Mengklik label akan memfokuskan input, dan pembaca layar membacakan label itu.',
      'Pilih `type` yang sesuai: `email`, `tel`, `number`, `date`. Di ponsel, keyboard yang muncul akan menyesuaikan.',
      'Atribut `required`, `minlength`, dan `maxlength` memberi validasi dasar di browser. Namun validasi di browser bisa dilewati — data tetap harus divalidasi lagi di server (akan dipelajari di modul Backend).',
      'Jangan pernah meminta data sensitif (password, NIK, nomor rekening) di form latihan atau website tanpa server yang aman.',
    ],
    example: {
      language: 'html',
      caption: 'Form kontak dengan label dan validasi bawaan.',
      code: `<form>
  <label for="nama">Nama lengkap</label>
  <input id="nama" name="nama" type="text" required minlength="3">

  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>

  <label for="pesan">Pesan</label>
  <textarea id="pesan" name="pesan" rows="4" maxlength="500"></textarea>

  <button type="submit">Kirim</button>
</form>`,
      previewHtml: `<!doctype html><html lang="id"><head><meta charset="UTF-8"><style>body{font-family:system-ui;padding:16px}label{display:block;margin-top:10px;font-weight:600}input,textarea{width:100%;max-width:360px;padding:6px;font:inherit}button{margin-top:12px;padding:6px 14px}</style></head><body><form onsubmit="event.preventDefault();document.getElementById('o').textContent='Form valid! (Contoh ini tidak mengirim data ke mana pun.)'"><label for="nama">Nama lengkap</label><input id="nama" name="nama" type="text" required minlength="3"><label for="email">Email</label><input id="email" name="email" type="email" required><label for="pesan">Pesan</label><textarea id="pesan" name="pesan" rows="4" maxlength="500"></textarea><button type="submit">Kirim</button><p id="o" style="color:#059669"></p></form></body></html>`,
    },
    steps: [
      'Coba kirim form contoh di atas dalam keadaan kosong, lalu dengan email tanpa tanda @.',
      'Klik teks label dan perhatikan input mana yang mendapat fokus.',
      'Navigasikan form hanya dengan tombol Tab dan Enter.',
    ],
    challenge:
      'Buat form pendaftaran ekstrakurikuler dengan nama, kelas (pakai `<select>`), email, dan pilihan ekstrakurikuler (pakai `<input type="radio">` dalam `<fieldset>` dengan `<legend>`).',
    hints: [
      'Radio button dalam satu grup harus memakai `name` yang sama.',
      '`<fieldset>` membungkus grup pilihan dan `<legend>` menjadi judul grup.',
      'Setiap radio button tetap memerlukan `<label>` sendiri.',
    ],
    commonErrors: [
      { error: 'Mengklik label tidak memfokuskan input.', fix: 'Nilai `for` pada label harus sama persis dengan `id` input.' },
      { error: 'Semua radio button bisa dipilih bersamaan.', fix: 'Berikan `name` yang sama pada semua radio dalam satu grup.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Bagaimana menghubungkan <label> dengan <input>?',
        options: [
          { text: 'Meletakkan label tepat di atas input.', why: 'Posisi visual saja tidak cukup untuk pembaca layar.' },
          { text: 'Menyamakan nilai for pada label dengan id pada input.', correct: true, why: 'Benar.' },
          { text: 'Memberi class yang sama.', why: 'Class dipakai untuk CSS, bukan untuk menghubungkan label.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Apakah validasi required di browser sudah cukup untuk keamanan data?',
        options: [
          { text: 'Ya, pengguna tidak bisa melewatinya.', why: 'Validasi browser bisa dimatikan lewat DevTools atau permintaan langsung ke server.' },
          { text: 'Tidak, server tetap harus memvalidasi ulang semua data.', correct: true, why: 'Benar. Validasi browser untuk kenyamanan, validasi server untuk keamanan.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Tipe input yang tepat untuk alamat email adalah…',
        options: [
          { text: 'type="text"', why: 'Bisa dipakai, tetapi tidak ada validasi format email dan keyboard ponsel tidak menyesuaikan.' },
          { text: 'type="email"', correct: true, why: 'Benar. Browser memeriksa format dan ponsel menampilkan keyboard dengan @.' },
          { text: 'type="mail"', why: 'Tipe ini tidak ada.' },
        ],
      },
    ],
    skills: ['html', 'accessibility'],
  },
]

const cssLessons: Lesson[] = [
  {
    id: 'css-1',
    title: 'Selektor, Properti, dan Menghubungkan CSS',
    minutes: 20,
    goal: 'Menghubungkan file CSS eksternal dan mengubah warna, font, serta jarak elemen.',
    concepts: [
      'CSS (Cascading Style Sheets) mengatur *tampilan*. HTML adalah kerangka rumah, CSS adalah cat, ubin, dan tata letaknya.',
      'Aturan CSS terdiri dari selektor dan deklarasi: `h1 { color: navy; }`. Selektor `h1` memilih elemen, `color` adalah properti, `navy` adalah nilai.',
      'Selektor umum: nama tag (`p`), class (`.kartu`), dan id (`#header`). Gunakan class untuk styling karena bisa dipakai berulang.',
      'Simpan CSS di file terpisah dan hubungkan lewat `<link rel="stylesheet" href="css/style.css">` di dalam `<head>`. Dengan begitu satu file CSS bisa dipakai banyak halaman.',
    ],
    example: {
      language: 'css',
      caption: 'Isi css/style.css — gaya dasar tipografi dan kartu.',
      code: `body {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  color: #1e293b;
  margin: 0;
}

h1 {
  color: #4f46e5;
}

.kartu {
  background: #f1f5f9;
  padding: 16px;
  border-radius: 12px;
}`,
      previewHtml: `<!doctype html><html lang="id"><head><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;line-height:1.6;color:#1e293b;margin:0;padding:16px}h1{color:#4f46e5}.kartu{background:#f1f5f9;padding:16px;border-radius:12px}</style></head><body><h1>Judul berwarna indigo</h1><div class="kartu">Ini elemen dengan class <code>kartu</code>.</div></body></html>`,
    },
    steps: [
      'Buat folder `css` dan file `css/style.css`.',
      'Tambahkan `<link rel="stylesheet" href="css/style.css">` di `<head>` halamanmu.',
      'Tulis aturan untuk `body` lalu muat ulang browser.',
      'Tambahkan class `kartu` ke satu elemen dan beri gaya.',
    ],
    challenge: 'Beri halaman "Hobi Saya" palet tiga warna yang konsisten: satu warna teks, satu warna aksen untuk heading dan link, dan satu warna latar kartu.',
    hints: [
      'Tentukan warna dulu, misalnya di catatan, sebelum menulis CSS.',
      'Link bisa diberi gaya dengan selektor `a`.',
      'Pastikan kontras teks dan latar cukup — teks abu-abu muda di latar putih sulit dibaca.',
    ],
    commonErrors: [
      { error: 'CSS tidak berpengaruh sama sekali.', fix: 'Periksa path di `<link href>`, dan buka DevTools (F12) → tab Network untuk melihat apakah file CSS gagal dimuat (404).' },
      { error: 'Gaya class tidak bekerja.', fix: 'Di CSS, class ditulis dengan titik (`.kartu`), di HTML tanpa titik (`class="kartu"`).' },
      { error: 'Seluruh aturan setelah baris tertentu tidak jalan.', fix: 'Cari kurung kurawal `}` atau titik koma `;` yang hilang.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Selektor mana yang memilih semua elemen dengan class="tombol"?',
        options: [
          { text: '#tombol', why: '`#` memilih berdasarkan id.' },
          { text: '.tombol', correct: true, why: 'Benar. Titik memilih berdasarkan class.' },
          { text: 'tombol', why: 'Tanpa awalan, ini mencari tag bernama <tombol>.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Di mana elemen <link rel="stylesheet"> sebaiknya diletakkan?',
        options: [
          { text: 'Di dalam <head>.', correct: true, why: 'Benar. Browser memuat gaya sebelum menampilkan isi.' },
          { text: 'Di akhir <body>.', why: 'Halaman sempat tampil tanpa gaya lalu berubah (berkedip).' },
          { text: 'Di file CSS itu sendiri.', why: 'Tag HTML tidak ditulis di dalam file CSS.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Apa yang salah pada aturan berikut?',
        code: 'p {\n  color: red\n  font-size: 18px;\n}',
        options: [
          { text: 'Tidak ada yang salah.', why: 'Perhatikan akhir baris pertama di dalam kurung.' },
          { text: 'Titik koma hilang setelah color: red.', correct: true, why: 'Benar. Tanpa `;`, browser membaca kedua baris sebagai satu deklarasi yang tidak valid.' },
          { text: 'font-size harus ditulis fontSize.', why: 'Itu penulisan di JavaScript. Di CSS memakai tanda hubung.' },
        ],
      },
    ],
    skills: ['css'],
    lab: 'debug-css-not-applied',
  },
  {
    id: 'css-2',
    title: 'Box Model',
    minutes: 20,
    goal: 'Memahami content, padding, border, dan margin serta mengapa box-sizing penting.',
    concepts: [
      'Setiap elemen adalah kotak berlapis: *content* (isi), *padding* (bantalan di dalam), *border* (garis tepi), dan *margin* (jarak ke elemen lain).',
      'Secara bawaan, `width` hanya mengukur content, sehingga padding dan border menambah lebar total. Dengan `box-sizing: border-box`, `width` mencakup padding dan border — jauh lebih mudah diprediksi.',
      'Gunakan DevTools (klik kanan → Inspect) untuk melihat diagram box model setiap elemen.',
    ],
    example: {
      language: 'css',
      caption: 'Reset box-sizing global dan kartu dengan padding serta margin.',
      code: `*, *::before, *::after {
  box-sizing: border-box;
}

.kartu {
  width: 300px;
  padding: 20px;
  border: 2px solid #6366f1;
  margin: 16px auto; /* auto kiri-kanan = tengah */
}`,
      previewHtml: `<!doctype html><html lang="id"><head><meta charset="UTF-8"><style>*,*::before,*::after{box-sizing:border-box}body{font-family:system-ui;padding:8px}.kartu{width:300px;padding:20px;border:2px solid #6366f1;margin:16px auto;background:#eef2ff}</style></head><body><div class="kartu">Lebar total tetap 300px walau ada padding dan border.</div></body></html>`,
    },
    steps: [
      'Tambahkan reset `box-sizing` di baris paling atas `style.css`.',
      'Buka DevTools dan periksa sebuah kartu. Arahkan kursor ke diagram box model.',
      'Ubah nilai padding dan margin langsung di DevTools untuk bereksperimen, lalu salin nilai terbaik ke file CSS.',
    ],
    challenge: 'Buat tiga kartu hobi dengan jarak antar-kartu yang sama, padding nyaman, dan sudut membulat. Kartu harus tetap di tengah halaman.',
    hints: ['`margin: 0 auto` menengahkan elemen yang punya lebar tertentu.', 'Gunakan `max-width` alih-alih `width` agar kartu menyusut di layar kecil.'],
    commonErrors: [
      { error: 'Elemen melebar keluar dari layar di ponsel.', fix: 'Gunakan `max-width: 100%` atau `max-width` dalam px, bukan `width` tetap, dan pastikan `box-sizing: border-box` aktif.' },
      { error: 'Margin atas dan bawah dua elemen tidak dijumlahkan.', fix: 'Ini disebut margin collapsing — margin vertikal yang bertemu memakai nilai terbesar, bukan jumlahnya.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Lapisan mana yang berada DI DALAM border?',
        options: [
          { text: 'margin', why: 'Margin berada di luar border.' },
          { text: 'padding', correct: true, why: 'Benar. Padding adalah jarak antara isi dan border.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Dengan box-sizing: border-box, width: 200px; padding: 20px; border: 5px. Berapa lebar total elemen?',
        options: [
          { text: '200px', correct: true, why: 'Benar. border-box memasukkan padding dan border ke dalam width.' },
          { text: '250px', why: 'Itu hasilnya jika box-sizing masih content-box (200 + 40 + 10).' },
          { text: '240px', why: 'Coba hitung lagi dengan aturan border-box.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Alat apa yang paling cepat untuk melihat ukuran margin elemen di browser?',
        options: [
          { text: 'DevTools (Inspect Element).', correct: true, why: 'Benar. Tab Elements/Computed menampilkan diagram box model.' },
          { text: 'Membaca ulang seluruh file CSS.', why: 'Bisa, tetapi lambat dan tidak memperhitungkan aturan yang saling menimpa.' },
        ],
      },
    ],
    skills: ['css'],
    lab: 'css-button',
  },
  {
    id: 'css-3',
    title: 'Flexbox dan Desain Responsif',
    minutes: 25,
    goal: 'Menyusun elemen dengan Flexbox dan menyesuaikan tampilan untuk layar kecil dengan media query.',
    concepts: [
      'Flexbox menyusun anak-anak elemen dalam satu baris atau kolom. Aktifkan dengan `display: flex` pada elemen induk. `gap` mengatur jarak antar-anak, `justify-content` mengatur posisi di sumbu utama, `align-items` di sumbu silang.',
      '`flex-wrap: wrap` membuat anak pindah ke baris baru jika ruang tidak cukup — dasar tata letak kartu yang responsif.',
      'Pendekatan *mobile-first*: tulis gaya untuk layar kecil terlebih dulu, lalu tambahkan `@media (min-width: 768px) { ... }` untuk layar lebih besar.',
      'Tanpa `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, ponsel akan menampilkan versi desktop yang diperkecil dan media query tidak bekerja sesuai harapan.',
    ],
    example: {
      language: 'css',
      caption: 'Kartu yang menumpuk di ponsel dan berjajar di layar lebar.',
      code: `.daftar-kartu {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 640px) {
  .daftar-kartu {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .daftar-kartu > * {
    flex: 1 1 200px;
  }
}`,
      previewHtml: `<!doctype html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;padding:12px;margin:0}.daftar-kartu{display:flex;flex-direction:column;gap:12px}.daftar-kartu>*{background:#ede9fe;border-radius:10px;padding:14px}@media (min-width:640px){.daftar-kartu{flex-direction:row;flex-wrap:wrap}.daftar-kartu>*{flex:1 1 200px}}</style></head><body><p style="margin-top:0;color:#64748b;font-size:13px">Ubah lebar jendela browser untuk melihat perubahan.</p><div class="daftar-kartu"><div>Kartu 1</div><div>Kartu 2</div><div>Kartu 3</div></div></body></html>`,
    },
    steps: [
      'Bungkus kartu-kartumu dengan satu elemen induk berclass `daftar-kartu`.',
      'Tambahkan aturan Flexbox mobile-first.',
      'Buka DevTools → ikon ponsel (Device Toolbar) untuk mencoba berbagai ukuran layar.',
    ],
    challenge: 'Buat menu navigasi yang tersusun vertikal di ponsel dan horizontal (logo di kiri, link di kanan) di layar ≥ 768px.',
    hints: [
      'Header bisa memakai `display: flex` dengan `justify-content: space-between`.',
      'Di ponsel, ubah `flex-direction` menjadi `column`.',
      'Media query ditulis setelah aturan dasar agar dapat menimpanya.',
    ],
    commonErrors: [
      { error: 'Media query tidak berpengaruh di ponsel.', fix: 'Pastikan meta viewport ada di `<head>`.' },
      { error: 'display: flex dipasang di anak, bukan induk.', fix: 'Flexbox diaktifkan di elemen pembungkus (induk).' },
      { error: 'Gambar meluber dari kartu.', fix: 'Tambahkan `img { max-width: 100%; height: auto; }`.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Properti mana yang mengatur jarak antar-anak dalam flex container?',
        options: [
          { text: 'gap', correct: true, why: 'Benar.' },
          { text: 'spacing', why: 'Properti ini tidak ada di CSS.' },
          { text: 'padding', why: 'Padding memberi jarak di dalam elemen, bukan antar-anak.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Dalam pendekatan mobile-first, media query biasanya memakai…',
        options: [
          { text: 'max-width', why: 'max-width cocok untuk pendekatan desktop-first.' },
          { text: 'min-width', correct: true, why: 'Benar. Gaya dasar untuk ponsel, lalu min-width menambahkan gaya untuk layar besar.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Apa akibat jika meta viewport tidak ditulis?',
        options: [
          { text: 'Tidak ada pengaruh.', why: 'Coba buka halaman tanpa meta viewport di ponsel — teks akan sangat kecil.' },
          { text: 'Ponsel menampilkan halaman seperti desktop yang diperkecil.', correct: true, why: 'Benar.' },
          { text: 'Halaman tidak bisa dibuka di ponsel.', why: 'Halaman tetap terbuka, hanya tampilannya tidak responsif.' },
        ],
      },
    ],
    skills: ['layout', 'responsive'],
    lab: 'flex-nav',
  },
]

const gitLessons: Lesson[] = [
  {
    id: 'git-1',
    title: 'Apa Itu Git dan GitHub?',
    minutes: 15,
    goal: 'Membedakan file lokal, repository Git, repository GitHub, dan website online.',
    concepts: [
      '*File lokal* adalah file di komputermu. Jika laptop rusak atau file tertimpa, versi lama hilang.',
      '*Git* adalah program di komputermu yang mencatat versi file. Setiap catatan disebut *commit* — seperti titik simpan (save point) di game yang bisa kamu kunjungi kembali.',
      '*Repository* (repo) adalah folder proyek yang dipantau Git. Repo lokal ada di komputermu; repo GitHub adalah salinannya di internet.',
      '*GitHub* adalah layanan online untuk menyimpan repo, berkolaborasi, dan menampilkan portofolio. Repo GitHub belum tentu menjadi website — untuk itu perlu *deployment* (misalnya GitHub Pages), yang dipelajari di modul Deployment.',
      'Alurnya: tulis kode → `git add` → `git commit` (tersimpan di repo lokal) → `git push` (dikirim ke GitHub) → layanan hosting membangun website online.',
    ],
    example: {
      language: 'bash',
      caption: 'Memeriksa apakah Git sudah terpasang. Jalankan di terminal / Git Bash di komputermu.',
      code: `git --version
# Contoh output (angka versi bisa berbeda):
# git version 2.47.0`,
    },
    steps: [
      'Unduh Git dari https://git-scm.com/downloads (Windows: pilih installer resmi, gunakan pilihan default).',
      'Buka terminal: di Windows gunakan "Git Bash", di macOS gunakan "Terminal".',
      'Jalankan `git --version`. Jika muncul nomor versi, Git siap.',
      'Buat akun di https://github.com jika belum punya. Gunakan email yang aktif dan aktifkan autentikasi dua faktor (2FA).',
    ],
    challenge: 'Tulis dengan kata-katamu sendiri (di catatan proyek) perbedaan antara Git, GitHub, dan website online, lalu gambar diagram alurnya.',
    hints: ['Git = alat pencatat versi (offline).', 'GitHub = tempat penyimpanan online untuk repo.', 'Website online = hasil deployment yang bisa dibuka pengunjung.'],
    commonErrors: [
      { error: "'git' is not recognized as an internal or external command", fix: 'Git belum terpasang atau terminal dibuka sebelum instalasi selesai. Tutup lalu buka ulang terminal, atau gunakan Git Bash.' },
      { error: 'Bingung antara GitHub dan Git.', fix: 'Git bisa dipakai tanpa GitHub. GitHub adalah salah satu tempat menyimpan repo Git secara online.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Setelah menjalankan git commit, di mana perubahanmu tersimpan?',
        options: [
          { text: 'Di GitHub.', why: 'Commit hanya tersimpan di repo lokal sampai kamu menjalankan `git push`.' },
          { text: 'Di repository lokal di komputermu.', correct: true, why: 'Benar.' },
          { text: 'Langsung online sebagai website.', why: 'Website online memerlukan deployment.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Analogi yang paling tepat untuk commit adalah…',
        options: [
          { text: 'Titik simpan (save point) yang bisa dikunjungi kembali.', correct: true, why: 'Benar.' },
          { text: 'Tombol Undo satu kali.', why: 'Commit menyimpan riwayat lengkap, bukan hanya satu langkah.' },
          { text: 'Mengunggah file ke Google Drive.', why: 'Itu lebih mirip `git push` ke layanan online.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Apakah repository di GitHub otomatis menjadi website yang bisa dibuka pengunjung?',
        options: [
          { text: 'Ya, selalu.', why: 'Repo hanya menyimpan kode. Website memerlukan hosting/deployment.' },
          { text: 'Tidak, perlu deployment ke layanan hosting seperti GitHub Pages.', correct: true, why: 'Benar.' },
        ],
      },
    ],
    skills: ['git', 'github'],
  },
  {
    id: 'git-2',
    title: 'Commit Pertamamu: init, status, add, commit',
    minutes: 25,
    goal: 'Membuat repository lokal dan menyimpan versi pertama proyek dengan commit.',
    concepts: [
      '`git config` mengatur identitas yang dicatat di setiap commit. Cukup dilakukan sekali per komputer.',
      '`git init` mengubah folder biasa menjadi repository (membuat folder tersembunyi `.git`). Jalankan di folder proyek, *bukan* di folder Documents atau Desktop secara keseluruhan.',
      '`git status` adalah perintah paling penting: ia memberi tahu file mana yang berubah, mana yang siap di-commit. Jalankan sesering mungkin.',
      '`git add` memasukkan perubahan ke *staging area* — seperti memasukkan barang ke kotak sebelum disegel. `git commit -m "pesan"` menyegel kotak itu dengan label.',
      'Pesan commit yang baik menjelaskan *apa* yang berubah dalam kalimat perintah singkat: "Add contact form", bukan "update" atau "asdf".',
    ],
    example: {
      language: 'bash',
      caption: 'Jalankan di terminal, dari DALAM folder proyekmu (misalnya latihan-html).',
      code: `# 1. Identitas (sekali saja per komputer)
git config --global user.name "Nama Kamu"
git config --global user.email "email-github-kamu@example.com"

# 2. Masuk ke folder proyek
cd ~/Documents/latihan-html

# 3. Jadikan repository
git init
# Output: Initialized empty Git repository in .../latihan-html/.git/

# 4. Lihat status
git status
# Output: Untracked files: index.html ...

# 5. Masukkan ke staging, lalu commit
git add .
git commit -m "Add first HTML page"
# Output: [main (root-commit) a1b2c3d] Add first HTML page

# 6. Lihat riwayat
git log --oneline`,
    },
    steps: [
      'Buka Git Bash / Terminal, lalu `cd` ke folder `latihan-html`. Gunakan `pwd` untuk memastikan lokasi.',
      'Jalankan perintah satu per satu, baca output setiap perintah sebelum lanjut.',
      'Ubah satu baris di `index.html`, lalu jalankan `git status` dan `git diff` untuk melihat perubahan.',
      'Commit perubahan itu dengan pesan yang jelas.',
    ],
    challenge: 'Buat tiga commit berbeda untuk tiga perubahan kecil, lalu tampilkan riwayatnya dengan `git log --oneline`. Salin outputnya ke catatan proyek sebagai bukti.',
    hints: [
      'Satu commit = satu perubahan yang bermakna.',
      'Jalankan `git status` sebelum dan sesudah `git add` untuk melihat bedanya.',
      'Jika pesan commit salah ketik pada commit terakhir yang belum di-push, gunakan `git commit --amend -m "pesan baru"`.',
    ],
    commonErrors: [
      { error: 'fatal: not a git repository', fix: 'Kamu berada di folder yang salah atau belum menjalankan `git init`. Cek dengan `pwd` dan `ls`.' },
      { error: 'Author identity unknown / Please tell me who you are', fix: 'Jalankan dua perintah `git config --global` di langkah 1.' },
      { error: 'nothing to commit, working tree clean', fix: 'Tidak ada perubahan baru. Simpan file di editor terlebih dulu.' },
      { error: 'Tidak sengaja menjalankan git init di folder Home/Documents.', fix: 'Hapus folder tersembunyi `.git` di lokasi itu (hati-hati, pastikan lokasinya benar), lalu jalankan `git init` di folder proyek.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Perintah apa yang menunjukkan file mana yang berubah dan belum di-commit?',
        options: [
          { text: 'git log', why: '`git log` menampilkan riwayat commit yang sudah ada.' },
          { text: 'git status', correct: true, why: 'Benar.' },
          { text: 'git init', why: '`git init` membuat repository baru.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Urutan yang benar untuk menyimpan perubahan adalah…',
        options: [
          { text: 'git commit → git add', why: 'Perubahan harus masuk staging area dulu.' },
          { text: 'git add → git commit', correct: true, why: 'Benar.' },
          { text: 'git push → git add → git commit', why: 'Push mengirim commit yang sudah ada; lakukan paling akhir.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Pesan commit mana yang paling baik?',
        options: [
          { text: '"update"', why: 'Tidak menjelaskan apa yang berubah.' },
          { text: '"Add contact form with email validation"', correct: true, why: 'Benar. Singkat, spesifik, dan menggunakan kalimat perintah.' },
          { text: '"perubahan banyak hari ini"', why: 'Terlalu umum; sebaiknya pecah menjadi beberapa commit.' },
        ],
      },
    ],
    skills: ['git'],
    gitCheckpoint: 'Repository lokal pertamamu siap. Menghubungkannya ke GitHub (`git remote` dan `git push`) dibahas di GitHub Learning Center (Phase 4) — langkah singkatnya juga ada di README proyek ini.',
  },
]

export const MODULES: Module[] = [
  { id: 'html', title: 'HTML Fundamentals', description: 'Struktur halaman, teks, gambar, link, tag semantik, dan form.', phase: 1, skills: ['html', 'semantic-html', 'accessibility'], lessons: htmlLessons },
  { id: 'css', title: 'CSS and Responsive Design', description: 'Selektor, box model, Flexbox, dan media query.', phase: 1, skills: ['css', 'layout', 'responsive'], lessons: cssLessons },
  { id: 'js', title: 'JavaScript Fundamentals', description: 'Variabel, tipe data, fungsi, kondisi, array, dan perulangan.', phase: 2, skills: ['javascript'], lessons: jsLessons },
  { id: 'dom', title: 'DOM Manipulation', description: 'Memilih elemen, event listener, dan mengubah halaman secara dinamis.', phase: 2, skills: ['dom'], lessons: domLessons },
  { id: 'git', title: 'Git and GitHub', description: 'Dari commit pertama sampai Pull Request, GitHub Actions, dan keamanan secrets.', phase: 1, skills: ['git', 'github'], lessons: [...gitLessons, ...githubLessons] },
  { id: 'react', title: 'React and Vite', description: 'Komponen, JSX, props, state, useEffect, dan build proyek Vite (dipraktikkan di komputer sendiri).', phase: 8, skills: ['react'], lessons: reactLessons },
  { id: 'api', title: 'API Integration', description: 'HTTP, JSON, status code, fetch, async/await, dan menangani loading & error.', phase: 7, skills: ['api'], lessons: apiLessons },
  { id: 'backend', title: 'Backend Fundamentals', description: 'Routing REST, serverless function, validasi di server, dan keamanan API.', phase: 7, skills: ['backend'], lessons: backendLessons },
  { id: 'database', title: 'Database and Authentication', description: 'SQL dengan SQLite di browser, relasi & JOIN, login yang aman, Supabase, dan Row Level Security.', phase: 7, skills: ['database', 'auth'], lessons: databaseLessons },
  { id: 'deploy', title: 'Deployment and Domains', description: 'Build, GitHub Pages, Netlify, Vercel, build log, DNS, HTTPS, monitoring, dan biaya.', phase: 6, skills: ['deployment'], lessons: deployLessons },
  { id: 'quality', title: 'Testing, Accessibility, and Security', description: 'Audit aksesibilitas, unit test, keamanan web dasar, dan performa.', phase: 8, skills: ['accessibility', 'testing', 'security', 'performance'], lessons: qualityLessons },
  { id: 'advanced', title: 'Advanced Full-Stack Development', description: 'Struktur proyek & alur kerja tim, portofolio & freelance, serta belajar mandiri.', phase: 8, skills: ['github', 'testing'], lessons: advancedLessons },
]

export const ALL_LESSONS: (Lesson & { moduleId: string })[] = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })))

export function findLesson(id: string) {
  return ALL_LESSONS.find((l) => l.id === id)
}

export function findModule(id: string) {
  return MODULES.find((m) => m.id === id)
}
