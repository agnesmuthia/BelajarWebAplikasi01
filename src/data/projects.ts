import type { Difficulty } from '../lib/types'
import type { SkillId } from './skills'

export interface ProjectFile {
  path: string
  content: string
}

export interface ProjectTask {
  id: string
  title: string
  detail: string
  skills: SkillId[]
}

export interface RubricItem {
  criterion: string
  points: number
  description: string
}

export interface ProjectTemplate {
  id: string
  category: string
  title: string
  tagline: string
  description: string
  difficulty: Difficulty
  estimatedHours: number
  technologies: string[]
  /** Pelajaran yang disarankan selesai sebelum mengerjakan proyek. */
  recommendedLessons: string[]
  objectives: string[]
  requirements: string[]
  tasks: ProjectTask[]
  testing: { id: string; title: string }[]
  rubric: RubricItem[]
  /** Peringatan khusus, mis. tentang data resmi. */
  notice?: string
  accent: 'indigo' | 'cyan' | 'violet'
  files: ProjectFile[]
}

const sharedTesting = [
  { id: 't-validator', title: 'HTML lolos validasi di https://validator.w3.org/#validate_by_input tanpa error.' },
  { id: 't-mobile', title: 'Tampilan diuji di DevTools mode ponsel (lebar 375px) — tidak ada scroll horizontal.' },
  { id: 't-keyboard', title: 'Semua link dan tombol bisa dicapai dengan tombol Tab dan terlihat fokusnya.' },
  { id: 't-alt', title: 'Semua gambar punya atribut alt yang sesuai.' },
  { id: 't-links', title: 'Semua link diklik satu per satu dan tidak ada yang rusak.' },
  { id: 't-console', title: 'DevTools → Console tidak menampilkan error merah.' },
]

const sharedRubric: RubricItem[] = [
  { criterion: 'Struktur HTML', points: 25, description: 'Memakai tag semantik, satu <h1>, heading berurutan, dan valid.' },
  { criterion: 'Tampilan & Responsif', points: 25, description: 'Rapi di ponsel dan desktop, konsisten dalam warna dan jarak.' },
  { criterion: 'Aksesibilitas', points: 20, description: 'Alt text, label, kontras cukup, dan navigasi keyboard.' },
  { criterion: 'Konten', points: 15, description: 'Konten akurat, bersumber jelas, dan tidak ada placeholder tersisa.' },
  { criterion: 'Git & Dokumentasi', points: 15, description: 'Commit bertahap dengan pesan jelas dan README menjelaskan proyek.' },
]

/* -------------------------------------------------------------------------- */
/*  1. Website Profil Sekolah                                                 */
/* -------------------------------------------------------------------------- */

const schoolHtml = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="[GANTI] Deskripsi singkat sekolah untuk mesin pencari.">
  <title>[Nama Sekolah] — Profil Sekolah</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <a class="skip-link" href="#konten">Lewati ke konten utama</a>

  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="#">
        <!-- TODO: Simpan logo resmi sekolah di assets/ lalu ganti src di bawah -->
        <img src="assets/logo-sekolah.png" alt="Logo [Nama Sekolah]" width="44" height="44">
        <span>[Nama Sekolah]</span>
      </a>
      <button class="menu-toggle" aria-expanded="false" aria-controls="menu-utama">Menu</button>
      <nav id="menu-utama" aria-label="Menu utama">
        <a href="#profil">Profil</a>
        <a href="#visi-misi">Visi &amp; Misi</a>
        <a href="#program">Program</a>
        <a href="#berita">Berita</a>
        <a href="#kontak">Kontak</a>
      </nav>
    </div>
  </header>

  <main id="konten">
    <section class="hero">
      <div class="container">
        <h1>[Nama Sekolah]</h1>
        <p class="lead">[GANTI] Satu kalimat yang menggambarkan sekolah — gunakan informasi resmi.</p>
        <a class="button" href="#profil">Kenali Kami</a>
      </div>
    </section>

    <section id="profil" class="container section">
      <h2>Profil Sekolah</h2>
      <p>[GANTI] Sejarah singkat dan gambaran umum sekolah. Ambil dari dokumen resmi sekolah.</p>
      <!-- TODO: Tambahkan tabel/daftar data sekolah (NPSN, akreditasi, alamat) HANYA dari sumber resmi. -->
    </section>

    <section id="visi-misi" class="container section">
      <h2>Visi &amp; Misi</h2>
      <h3>Visi</h3>
      <p>[GANTI] Visi resmi sekolah.</p>
      <h3>Misi</h3>
      <ul>
        <li>[GANTI] Misi 1</li>
        <li>[GANTI] Misi 2</li>
      </ul>
    </section>

    <section id="program" class="container section">
      <h2>Program Unggulan</h2>
      <div class="cards">
        <article class="card">
          <h3>[Program 1]</h3>
          <p>[GANTI] Deskripsi program.</p>
        </article>
        <article class="card">
          <h3>[Program 2]</h3>
          <p>[GANTI] Deskripsi program.</p>
        </article>
        <article class="card">
          <h3>[Program 3]</h3>
          <p>[GANTI] Deskripsi program.</p>
        </article>
      </div>
    </section>

    <section id="berita" class="container section">
      <h2>Berita Terbaru</h2>
      <!-- TODO: Tambahkan minimal 3 <article> berita dengan <time datetime="YYYY-MM-DD"> -->
    </section>
  </main>

  <footer id="kontak" class="site-footer">
    <div class="container">
      <h2>Kontak</h2>
      <address>
        [GANTI] Alamat resmi sekolah<br>
        Email: <a href="mailto:[email-resmi]">[email-resmi]</a>
      </address>
      <p><small>&copy; <span id="tahun"></span> [Nama Sekolah]. Dibuat sebagai proyek belajar.</small></p>
    </div>
  </footer>

  <script src="js/main.js"></script>
</body>
</html>
`

const schoolCss = `/* =========================================================
   Website Profil Sekolah — style.css
   Ubah variabel warna di bawah agar sesuai identitas sekolah.
   ========================================================= */
:root {
  --warna-utama: #1e3a8a;
  --warna-aksen: #f59e0b;
  --warna-teks: #1f2937;
  --warna-latar: #f8fafc;
  --radius: 12px;
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: var(--warna-teks);
  background: var(--warna-latar);
}

img { max-width: 100%; height: auto; }

.container { width: min(1100px, 100% - 32px); margin-inline: auto; }
.section { padding-block: 48px; }

.skip-link { position: absolute; left: -999px; }
.skip-link:focus { left: 16px; top: 16px; background: #fff; padding: 8px 12px; z-index: 10; }

.site-header { background: var(--warna-utama); color: #fff; }
.header-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-block: 12px; }
.brand { display: flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; font-weight: 700; }
.site-header nav { display: none; width: 100%; flex-direction: column; gap: 8px; }
.site-header nav.open { display: flex; }
.site-header nav a { color: #fff; text-decoration: none; padding: 6px 0; }
.menu-toggle { background: transparent; color: #fff; border: 1px solid #fff6; border-radius: 8px; padding: 6px 12px; font: inherit; }

.hero { background: linear-gradient(135deg, var(--warna-utama), #312e81); color: #fff; padding-block: 72px; }
.hero h1 { font-size: clamp(2rem, 5vw, 3rem); margin: 0 0 12px; }
.lead { font-size: 1.15rem; max-width: 60ch; }
.button { display: inline-block; margin-top: 16px; background: var(--warna-aksen); color: #111; padding: 10px 18px; border-radius: 999px; text-decoration: none; font-weight: 600; }

.cards { display: grid; gap: 16px; }
.card { background: #fff; border-radius: var(--radius); padding: 20px; box-shadow: 0 1px 3px #0001; }

.site-footer { background: #0f172a; color: #cbd5e1; padding-block: 32px; }
.site-footer a { color: #fff; }

/* TODO: Tablet & desktop */
@media (min-width: 768px) {
  .menu-toggle { display: none; }
  .site-header nav { display: flex; flex-direction: row; width: auto; gap: 20px; }
  .cards { grid-template-columns: repeat(3, 1fr); }
}
`

const schoolJs = `// =========================================================
// main.js — interaksi sederhana
// =========================================================

// 1. Tahun otomatis di footer
document.getElementById('tahun').textContent = new Date().getFullYear();

// 2. Tombol menu untuk layar kecil
const tombolMenu = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu-utama');

tombolMenu.addEventListener('click', function () {
  const terbuka = menu.classList.toggle('open');
  tombolMenu.setAttribute('aria-expanded', String(terbuka));
});

// TODO (tantangan): tutup menu otomatis setelah salah satu link diklik.
`

/* -------------------------------------------------------------------------- */
/*  2. Website Wisata Takalar                                                 */
/* -------------------------------------------------------------------------- */

const tourismHtml = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Panduan wisata Kabupaten Takalar, Sulawesi Selatan.">
  <title>Jelajah Takalar — Panduan Wisata</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="hero">
    <nav class="container nav" aria-label="Menu utama">
      <a class="logo" href="#">Jelajah Takalar</a>
      <div class="nav-links">
        <a href="#destinasi">Destinasi</a>
        <a href="#kuliner">Kuliner</a>
        <a href="#tips">Tips</a>
      </div>
    </nav>
    <div class="container hero-text">
      <h1>Jelajah Takalar</h1>
      <p>[GANTI] Kalimat pembuka tentang keindahan Takalar dengan kata-katamu sendiri.</p>
    </div>
  </header>

  <main>
    <section id="destinasi" class="container section">
      <h2>Destinasi Pilihan</h2>
      <p class="muted">Isi hanya dengan informasi yang sudah kamu verifikasi (sumber resmi, kunjungan langsung, atau wawancara). Tulis sumber di README.</p>

      <div class="filter" role="group" aria-label="Filter kategori">
        <button class="chip active" data-filter="semua">Semua</button>
        <button class="chip" data-filter="pantai">Pantai</button>
        <button class="chip" data-filter="pulau">Pulau</button>
        <button class="chip" data-filter="budaya">Budaya</button>
      </div>

      <div class="grid" id="daftar-destinasi">
        <article class="place" data-kategori="pantai">
          <img src="assets/destinasi-1.jpg" alt="[GANTI] Deskripsi foto destinasi 1">
          <div class="place-body">
            <span class="tag">Pantai</span>
            <h3>[Nama Destinasi 1]</h3>
            <p>[GANTI] Deskripsi singkat, akses, dan waktu terbaik berkunjung.</p>
          </div>
        </article>
        <article class="place" data-kategori="pulau">
          <img src="assets/destinasi-2.jpg" alt="[GANTI] Deskripsi foto destinasi 2">
          <div class="place-body">
            <span class="tag">Pulau</span>
            <h3>[Nama Destinasi 2]</h3>
            <p>[GANTI] Deskripsi singkat.</p>
          </div>
        </article>
        <article class="place" data-kategori="budaya">
          <img src="assets/destinasi-3.jpg" alt="[GANTI] Deskripsi foto destinasi 3">
          <div class="place-body">
            <span class="tag">Budaya</span>
            <h3>[Nama Destinasi 3]</h3>
            <p>[GANTI] Deskripsi singkat.</p>
          </div>
        </article>
      </div>
    </section>

    <section id="kuliner" class="container section">
      <h2>Kuliner Khas</h2>
      <!-- TODO: Daftar kuliner khas dengan foto milikmu sendiri atau foto berlisensi bebas. -->
    </section>

    <section id="tips" class="container section">
      <h2>Tips Berkunjung</h2>
      <ul>
        <li>[GANTI] Tips transportasi</li>
        <li>[GANTI] Tips waktu terbaik</li>
        <li>Jaga kebersihan dan hormati adat setempat.</li>
      </ul>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>Dibuat oleh [Nama Kamu] sebagai proyek belajar. Foto: [sebutkan sumber/lisensi].</p>
    </div>
  </footer>

  <script src="js/main.js"></script>
</body>
</html>
`

const tourismCss = `/* Jelajah Takalar — style.css */
:root {
  --laut: #0e7490;
  --pasir: #fef3c7;
  --gelap: #0f172a;
  --teks: #1e293b;
}

*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; color: var(--teks); line-height: 1.6; }
img { max-width: 100%; display: block; }

.container { width: min(1100px, 100% - 32px); margin-inline: auto; }
.section { padding-block: 56px; }
.muted { color: #64748b; font-size: 0.95rem; }

.hero {
  min-height: 70vh;
  color: #fff;
  /* TODO: ganti dengan foto milikmu: url("../assets/hero.jpg") */
  background: linear-gradient(160deg, #0e7490cc, #0f172acc), var(--laut);
  background-size: cover;
  display: flex;
  flex-direction: column;
}
.nav { display: flex; justify-content: space-between; align-items: center; padding-block: 16px; flex-wrap: wrap; gap: 8px; }
.nav a { color: #fff; text-decoration: none; }
.nav-links { display: flex; gap: 16px; }
.logo { font-weight: 800; letter-spacing: 0.02em; }
.hero-text { margin-block: auto; padding-block: 48px; }
.hero h1 { font-size: clamp(2.2rem, 7vw, 4rem); margin: 0; }

.filter { display: flex; flex-wrap: wrap; gap: 8px; margin-block: 16px 24px; }
.chip { border: 1px solid var(--laut); background: #fff; color: var(--laut); padding: 6px 14px; border-radius: 999px; font: inherit; cursor: pointer; }
.chip.active { background: var(--laut); color: #fff; }

.grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.place { border-radius: 16px; overflow: hidden; background: #fff; box-shadow: 0 4px 16px #0f172a14; }
.place img { aspect-ratio: 4 / 3; object-fit: cover; background: var(--pasir); }
.place-body { padding: 16px; }
.tag { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--laut); font-weight: 700; }
.place[hidden] { display: none; }

.footer { background: var(--gelap); color: #cbd5e1; padding-block: 24px; }
`

const tourismJs = `// Jelajah Takalar — filter destinasi berdasarkan kategori

const tombolFilter = document.querySelectorAll('[data-filter]');
const kartu = document.querySelectorAll('#daftar-destinasi .place');

tombolFilter.forEach(function (tombol) {
  tombol.addEventListener('click', function () {
    const pilihan = tombol.dataset.filter;

    tombolFilter.forEach(function (t) { t.classList.remove('active'); });
    tombol.classList.add('active');

    kartu.forEach(function (k) {
      const cocok = pilihan === 'semua' || k.dataset.kategori === pilihan;
      k.hidden = !cocok;
    });
  });
});

// TODO (tantangan): tampilkan pesan "Belum ada destinasi" jika tidak ada kartu yang cocok.
`

/* -------------------------------------------------------------------------- */
/*  3. Portfolio Developer                                                    */
/* -------------------------------------------------------------------------- */

const portfolioHtml = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Portofolio [Nama Kamu] — web developer pemula.">
  <title>[Nama Kamu] — Web Developer</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="container top">
    <a class="logo" href="#">[Inisial]</a>
    <nav aria-label="Menu utama">
      <a href="#tentang">Tentang</a>
      <a href="#proyek">Proyek</a>
      <a href="#kontak">Kontak</a>
      <button id="tema" class="theme-btn" aria-pressed="false">Mode gelap</button>
    </nav>
  </header>

  <main>
    <section class="container intro">
      <p class="eyebrow">Halo, saya</p>
      <h1>[Nama Kamu]</h1>
      <p class="lead">[GANTI] Satu kalimat: siapa kamu dan apa yang sedang kamu bangun.</p>
    </section>

    <section id="tentang" class="container section">
      <h2>Tentang Saya</h2>
      <p>[GANTI] Cerita singkat perjalanan belajarmu.</p>
      <h3>Keterampilan</h3>
      <!-- Tulis hanya keterampilan yang sudah kamu buktikan lewat proyek. -->
      <ul class="skills">
        <li>HTML</li>
        <li>CSS</li>
      </ul>
    </section>

    <section id="proyek" class="container section">
      <h2>Proyek</h2>
      <div class="projects">
        <article class="project">
          <h3>[Nama Proyek 1]</h3>
          <p>[GANTI] Masalah yang diselesaikan dan apa yang kamu pelajari.</p>
          <p class="links">
            <a href="#">Lihat website</a>
            <a href="#">Kode di GitHub</a>
          </p>
        </article>
        <!-- TODO: tambahkan proyek lain setelah selesai dikerjakan -->
      </div>
    </section>

    <section id="kontak" class="container section">
      <h2>Kontak</h2>
      <p>Hubungi saya melalui <a href="mailto:[email-kamu]">[email-kamu]</a>
         atau <a href="https://github.com/[username]">GitHub</a>.</p>
    </section>
  </main>

  <footer class="container footer">
    <small>&copy; <span id="tahun"></span> [Nama Kamu]</small>
  </footer>

  <script src="js/main.js"></script>
</body>
</html>
`

const portfolioCss = `/* Portfolio — style.css */
:root {
  --bg: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --accent: #6366f1;
  --card: #f3f4f6;
}

/* Variabel diganti saat <html> punya class "dark" */
.dark {
  --bg: #0b0d12;
  --text: #e5e7eb;
  --muted: #9ca3af;
  --accent: #22d3ee;
  --card: #161a23;
}

*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; line-height: 1.7; transition: background 0.2s, color 0.2s; }
a { color: var(--accent); }
.container { width: min(880px, 100% - 32px); margin-inline: auto; }
.section { padding-block: 48px; }

.top { display: flex; justify-content: space-between; align-items: center; padding-block: 20px; flex-wrap: wrap; gap: 12px; }
.top nav { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.logo { font-weight: 800; text-decoration: none; color: var(--text); }
.theme-btn { font: inherit; border: 1px solid var(--muted); background: transparent; color: var(--text); border-radius: 999px; padding: 4px 12px; cursor: pointer; }

.intro { padding-block: 72px 24px; }
.eyebrow { color: var(--accent); font-weight: 600; margin: 0; }
.intro h1 { font-size: clamp(2.4rem, 8vw, 4.5rem); margin: 0; line-height: 1.1; }
.lead { color: var(--muted); font-size: 1.2rem; max-width: 55ch; }

.skills { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; }
.skills li { background: var(--card); padding: 4px 12px; border-radius: 999px; font-size: 0.9rem; }

.projects { display: grid; gap: 16px; }
.project { background: var(--card); padding: 20px; border-radius: 16px; }
.links { display: flex; gap: 16px; }

.footer { padding-block: 32px; color: var(--muted); }
`

const portfolioJs = `// Portfolio — tombol mode gelap yang diingat browser

document.getElementById('tahun').textContent = new Date().getFullYear();

const tombol = document.getElementById('tema');
const root = document.documentElement;

function terapkan(gelap) {
  root.classList.toggle('dark', gelap);
  tombol.setAttribute('aria-pressed', String(gelap));
  tombol.textContent = gelap ? 'Mode terang' : 'Mode gelap';
}

terapkan(localStorage.getItem('tema') === 'gelap');

tombol.addEventListener('click', function () {
  const gelap = !root.classList.contains('dark');
  terapkan(gelap);
  localStorage.setItem('tema', gelap ? 'gelap' : 'terang');
});
`

const readme = (title: string, extra: string) => `# ${title}

Proyek belajar dari **DevStudio Academy**.

## Cara menjalankan

1. Ekstrak file ZIP ini ke folder, misalnya \`Documents/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\`.
2. Buka folder di VS Code.
3. Klik dua kali \`index.html\`, atau gunakan ekstensi *Live Server* di VS Code (klik kanan \`index.html\` → *Open with Live Server*).

## Struktur folder

\`\`\`
index.html      ← halaman utama
css/style.css   ← tampilan
js/main.js      ← interaksi
assets/         ← gambar, logo, font milikmu
\`\`\`

## Simpan ke Git

\`\`\`bash
git init
git add .
git commit -m "Add starter files"
\`\`\`

${extra}

## Sumber konten

<!-- Tulis sumber setiap informasi dan foto yang kamu pakai. -->
`

const assetsNote = `Simpan gambar, logo, dan font proyek di folder ini.

- Gunakan nama file huruf kecil tanpa spasi: logo-sekolah.png, bukan "Logo Sekolah.PNG".
- Kompres foto sebelum dipakai (misalnya dengan https://squoosh.app) agar website cepat.
- Pakai hanya foto milikmu sendiri, foto yang sudah diizinkan, atau berlisensi bebas.
`

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'school-profile',
    category: 'Education',
    title: 'Website Profil Sekolah',
    tagline: 'Halaman profil sekolah yang modern, responsif, dan aksesibel.',
    description:
      'Bangun website satu halaman untuk memperkenalkan sekolah: profil, visi-misi, program unggulan, berita, dan kontak. Cocok sebagai dasar untuk website SMA Negeri 3 Takalar setelah kamu mendapatkan data dan aset resmi dari sekolah.',
    difficulty: 'Pemula',
    estimatedHours: 6,
    technologies: ['HTML', 'CSS', 'JavaScript'],
    recommendedLessons: ['html-1', 'html-2', 'html-3', 'css-1'],
    objectives: [
      'Menyusun halaman dengan tag semantik dan heading yang berurutan.',
      'Membuat header dengan menu yang dapat dibuka-tutup di ponsel.',
      'Mengatur warna identitas dengan CSS custom properties.',
      'Membuat kartu program yang responsif dengan CSS Grid.',
    ],
    requirements: [
      'Header berisi logo, nama sekolah, dan menu navigasi.',
      'Bagian Profil, Visi & Misi, Program, Berita, dan Kontak.',
      'Menu hamburger berfungsi di layar < 768px dan dapat diakses keyboard.',
      'Minimal 3 berita dengan tanggal memakai elemen <time>.',
      'Semua data resmi (nama, alamat, visi-misi, NPSN) diambil dari sumber resmi sekolah.',
    ],
    tasks: [
      { id: 'collect', title: 'Kumpulkan data & aset resmi', detail: 'Minta logo, foto, visi-misi, dan alamat resmi dari pihak sekolah. Catat sumbernya di README.', skills: [] },
      { id: 'structure', title: 'Lengkapi struktur semantik', detail: 'Pastikan header, nav, main, section, dan footer sudah tepat dan heading berurutan.', skills: ['semantic-html'] },
      { id: 'content', title: 'Ganti semua placeholder [GANTI]', detail: 'Gunakan Ctrl+F untuk mencari "[GANTI]" dan "[Nama Sekolah]" hingga tidak ada yang tersisa.', skills: ['html'] },
      { id: 'logo', title: 'Pasang logo dan foto', detail: 'Simpan di assets/, pakai nama file huruf kecil, dan tulis alt yang deskriptif.', skills: ['html', 'accessibility'] },
      { id: 'colors', title: 'Sesuaikan warna identitas', detail: 'Ubah --warna-utama dan --warna-aksen. Periksa kontras di https://webaim.org/resources/contrastchecker/.', skills: ['css', 'accessibility'] },
      { id: 'news', title: 'Buat bagian berita', detail: 'Tambahkan minimal 3 <article> dengan <h3>, <time datetime="...">, dan ringkasan.', skills: ['semantic-html'] },
      { id: 'responsive', title: 'Rapikan tampilan responsif', detail: 'Uji di 375px, 768px, dan 1280px. Kartu program 1 kolom di ponsel, 3 kolom di desktop.', skills: ['responsive', 'layout'] },
      { id: 'menu', title: 'Selesaikan tantangan menu', detail: 'Di js/main.js, tutup menu otomatis setelah link diklik.', skills: ['dom', 'javascript'] },
    ],
    testing: sharedTesting,
    rubric: sharedRubric,
    notice:
      'Jangan mengarang informasi resmi sekolah (alamat, akreditasi, NPSN, nama pejabat, visi-misi). Biarkan placeholder sampai kamu mendapatkan data resmi, dan minta izin sebelum mempublikasikan logo atau foto sekolah.',
    accent: 'indigo',
    files: [
      { path: 'index.html', content: schoolHtml },
      { path: 'css/style.css', content: schoolCss },
      { path: 'js/main.js', content: schoolJs },
      { path: 'assets/baca-saya.txt', content: assetsNote },
      { path: 'README.md', content: readme('Website Profil Sekolah', '> Catatan: gunakan hanya data resmi sekolah dan minta izin sebelum mempublikasikan logo atau foto.') },
    ],
  },
  {
    id: 'takalar-tourism',
    category: 'Tourism & Culture',
    title: 'Website Wisata Takalar',
    tagline: 'Panduan destinasi dengan galeri kartu dan filter kategori.',
    description:
      'Buat panduan wisata Kabupaten Takalar: hero yang menarik, galeri destinasi dengan filter kategori, kuliner khas, dan tips berkunjung. Kamu akan belajar CSS Grid, gambar responsif, dan interaksi filter dengan JavaScript.',
    difficulty: 'Pemula',
    estimatedHours: 8,
    technologies: ['HTML', 'CSS Grid', 'JavaScript'],
    recommendedLessons: ['html-2', 'html-3', 'css-1', 'css-3'],
    objectives: [
      'Membuat hero section layar penuh dengan teks yang tetap terbaca.',
      'Menyusun galeri kartu responsif dengan CSS Grid auto-fill.',
      'Membuat filter kategori dengan atribut data-* dan JavaScript.',
      'Memakai foto dengan lisensi yang jelas dan alt text yang deskriptif.',
    ],
    requirements: [
      'Hero dengan judul, kalimat pembuka, dan navigasi.',
      'Minimal 6 destinasi terverifikasi, masing-masing dengan foto, kategori, dan deskripsi.',
      'Filter kategori yang berfungsi dan menandai tombol aktif.',
      'Bagian kuliner khas dan tips berkunjung.',
      'Sumber setiap informasi dan lisensi setiap foto dicatat di README.',
    ],
    tasks: [
      { id: 'research', title: 'Riset & verifikasi destinasi', detail: 'Kumpulkan minimal 6 destinasi dari sumber resmi (dinas pariwisata, kunjungan langsung). Catat sumbernya.', skills: [] },
      { id: 'photos', title: 'Siapkan foto berlisensi', detail: 'Gunakan foto milikmu atau berlisensi bebas. Kompres dan simpan di assets/.', skills: ['html'] },
      { id: 'cards', title: 'Lengkapi kartu destinasi', detail: 'Tambahkan kartu sampai 6, masing-masing dengan data-kategori yang benar dan alt deskriptif.', skills: ['html', 'accessibility'] },
      { id: 'hero', title: 'Pasang foto hero', detail: 'Ganti latar hero dengan foto, dan pertahankan overlay gelap agar teks tetap kontras.', skills: ['css'] },
      { id: 'grid', title: 'Uji galeri responsif', detail: 'Pastikan grid menjadi 1 kolom di ponsel dan 3 kolom di desktop tanpa media query tambahan.', skills: ['layout', 'responsive'] },
      { id: 'filter', title: 'Selesaikan tantangan filter', detail: 'Tampilkan pesan "Belum ada destinasi" jika tidak ada kartu yang cocok.', skills: ['dom', 'javascript'] },
      { id: 'culinary', title: 'Buat bagian kuliner', detail: 'Tambahkan daftar kuliner khas dengan struktur kartu yang konsisten.', skills: ['semantic-html'] },
    ],
    testing: [
      ...sharedTesting,
      { id: 't-filter', title: 'Setiap tombol filter diklik dan hanya kartu yang sesuai yang tampil.' },
      { id: 't-license', title: 'Setiap foto punya sumber/lisensi yang tercatat di README.' },
    ],
    rubric: sharedRubric,
    notice:
      'Starter ini sengaja tidak berisi nama, harga, atau jam buka destinasi. Verifikasi setiap informasi sebelum menuliskannya, dan cantumkan sumbernya.',
    accent: 'cyan',
    files: [
      { path: 'index.html', content: tourismHtml },
      { path: 'css/style.css', content: tourismCss },
      { path: 'js/main.js', content: tourismJs },
      { path: 'assets/baca-saya.txt', content: assetsNote },
      { path: 'README.md', content: readme('Website Wisata Takalar', '> Catatan: tulis sumber setiap informasi destinasi dan lisensi setiap foto di bagian bawah README.') },
    ],
  },
  {
    id: 'dev-portfolio',
    category: 'Business & Freelance',
    title: 'Portfolio Developer',
    tagline: 'Portofolio pribadi dengan mode gelap untuk dipakai melamar dan freelance.',
    description:
      'Bangun portofolio pribadi yang bersih dan cepat: perkenalan, keterampilan, proyek, dan kontak, lengkap dengan tombol mode gelap yang diingat browser. Portofolio ini akan terus kamu perbarui setiap kali menyelesaikan proyek baru.',
    difficulty: 'Pemula',
    estimatedHours: 6,
    technologies: ['HTML', 'CSS Variables', 'JavaScript', 'localStorage'],
    recommendedLessons: ['html-1', 'html-3', 'css-1', 'css-2'],
    objectives: [
      'Menulis konten perkenalan yang jelas dan profesional.',
      'Mengatur tema terang/gelap dengan CSS custom properties.',
      'Menyimpan preferensi pengguna dengan localStorage.',
      'Menampilkan proyek beserta link demo dan kode sumber.',
    ],
    requirements: [
      'Bagian perkenalan, tentang, keterampilan, proyek, dan kontak.',
      'Tombol mode gelap yang berfungsi, diingat setelah reload, dan memakai aria-pressed.',
      'Keterampilan yang ditulis hanya yang sudah dibuktikan lewat proyek.',
      'Minimal satu proyek dengan link demo dan link repository.',
    ],
    tasks: [
      { id: 'intro', title: 'Tulis perkenalan', detail: 'Ganti nama, inisial, dan kalimat pembuka. Maksimal dua kalimat yang spesifik.', skills: ['html'] },
      { id: 'about', title: 'Ceritakan perjalanan belajar', detail: 'Tulis 1–2 paragraf tentang apa yang sedang kamu pelajari dan tujuanmu.', skills: ['html'] },
      { id: 'skills', title: 'Daftar keterampilan jujur', detail: 'Cocokkan dengan Skill Tracker di DevStudio — tulis hanya yang berstatus Dipraktikkan atau Dikuasai.', skills: ['semantic-html'] },
      { id: 'theme', title: 'Sesuaikan palet tema', detail: 'Ubah variabel warna untuk mode terang dan gelap. Periksa kontras keduanya.', skills: ['css', 'accessibility'] },
      { id: 'projects', title: 'Tambahkan kartu proyek', detail: 'Tambahkan proyek sekolah atau wisata setelah selesai, lengkap dengan link.', skills: ['html', 'layout'] },
      { id: 'responsive', title: 'Uji tampilan responsif', detail: 'Pastikan header dan kartu rapi di ponsel 375px.', skills: ['responsive'] },
      { id: 'theme-js', title: 'Pahami kode mode gelap', detail: 'Tulis komentar di setiap baris js/main.js dengan kata-katamu sendiri.', skills: ['javascript', 'dom'] },
    ],
    testing: [
      ...sharedTesting,
      { id: 't-theme', title: 'Mode gelap tetap aktif setelah halaman dimuat ulang.' },
    ],
    rubric: sharedRubric,
    accent: 'violet',
    files: [
      { path: 'index.html', content: portfolioHtml },
      { path: 'css/style.css', content: portfolioCss },
      { path: 'js/main.js', content: portfolioJs },
      { path: 'assets/baca-saya.txt', content: assetsNote },
      { path: 'README.md', content: readme('Portfolio Developer', '> Tips: perbarui portofolio setiap kali menyelesaikan proyek baru.') },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Proyek bebas — kosong, atau diisi dengan impor folder/ZIP dari komputer   */
/* -------------------------------------------------------------------------- */

export const FREE_TEMPLATE: ProjectTemplate = {
  id: 'free-project',
  category: 'Bebas',
  title: 'Proyek Bebas',
  tagline: 'Mulai dari halaman kosong atau impor folder proyekmu sendiri.',
  description:
    'Proyek tanpa brief khusus: cocok untuk ide sendiri atau untuk memindahkan proyek yang sudah ada di komputer (folder atau ZIP) ke DevStudio.',
  difficulty: 'Pemula',
  estimatedHours: 4,
  technologies: ['HTML', 'CSS', 'JavaScript'],
  recommendedLessons: ['html-1', 'css-1'],
  objectives: ['Merencanakan struktur halaman sendiri.', 'Mengelola file dan aset proyek.', 'Menguji dan mendokumentasikan proyek.'],
  requirements: ['Minimal satu halaman index.html yang valid.', 'Tampilan rapi di ponsel dan desktop.', 'README menjelaskan tujuan proyek dan sumber aset.'],
  tasks: [
    { id: 'plan', title: 'Tulis tujuan proyek di README', detail: 'Siapa penggunanya dan masalah apa yang diselesaikan?', skills: [] },
    { id: 'structure', title: 'Susun struktur halaman semantik', detail: 'header, nav, main, section, footer.', skills: ['semantic-html'] },
    { id: 'style', title: 'Buat tampilan yang konsisten', detail: 'Tentukan palet warna dan tipografi di CSS.', skills: ['css'] },
    { id: 'responsive', title: 'Pastikan responsif', detail: 'Uji di 375px dan 1280px.', skills: ['responsive', 'layout'] },
    { id: 'a11y', title: 'Periksa aksesibilitas', detail: 'Jalankan tab Pemeriksaan di editor dan perbaiki temuan.', skills: ['accessibility'] },
  ],
  testing: sharedTesting,
  rubric: sharedRubric,
  accent: 'indigo',
  files: [
    { path: 'index.html', content: blankPage() },
    { path: 'css/style.css', content: `*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui, sans-serif; line-height: 1.6; }\n.container { width: min(960px, 100% - 32px); margin-inline: auto; padding-block: 32px; }\n` },
    { path: 'js/main.js', content: '// JavaScript proyek\n' },
    { path: 'README.md', content: '# Proyek Bebas\n\nTujuan proyek: …\n\n## Sumber aset\n\n- …\n' },
  ],
}

function blankPage() {
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proyek Baru</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main class="container">
    <h1>Proyek Baru</h1>
    <p>Mulai menulis di sini.</p>
  </main>
  <script src="js/main.js"></script>
</body>
</html>
`
}

export function findTemplate(id: string) {
  if (id === FREE_TEMPLATE.id) return FREE_TEMPLATE
  return PROJECT_TEMPLATES.find((t) => t.id === id)
}

/** Katalog proyek lanjutan — terbuka bertahap pada fase berikutnya. */
export const PROJECT_CATALOG: { category: string; items: string[] }[] = [
  {
    category: 'Education',
    items: [
      'Website sekolah modern dengan halaman berita',
      'Website perpustakaan digital',
      'Aplikasi kuis interaktif siswa',
      'Aplikasi latihan soal CPNS: TWK, TIU, dan TKP',
      'Dashboard nilai dan progres siswa',
      'Learning Management System sederhana',
      'Website pengaduan sekolah yang aman',
      'Aplikasi Pojok Numerasi',
      'Generator worksheet dan materi pembelajaran',
    ],
  },
  {
    category: 'Tourism & Culture',
    items: [
      'Digital guide destinasi wisata',
      'Katalog budaya dan tradisi lokal',
      'Direktori UMKM dan kuliner',
      'Website acara dan festival lokal',
      'Interactive map destinasi wisata',
      'Itinerary planner',
      'Website promosi desa wisata',
    ],
  },
  {
    category: 'Business & Freelance',
    items: [
      'Website jasa pembuatan website',
      'Landing page produk digital',
      'Katalog produk UMKM',
      'Dashboard inventaris',
      'Booking dan appointment application',
      'Website event registration',
      'Blog dengan kategori dan pencarian',
      'Website CV digital',
      'Dashboard analitik bisnis',
    ],
  },
  {
    category: 'Creative Web Apps',
    items: [
      'Prompt library',
      'Color palette generator',
      'Markdown editor',
      'Image gallery',
      'QR code generator',
      'Invoice generator',
      'Habit tracker',
      'Personal productivity dashboard',
      'Interactive data visualization',
      'AI-assisted content planning interface',
    ],
  },
  {
    category: 'Full-Stack',
    items: [
      'Aplikasi login dan profil pengguna',
      'CRUD application dengan database',
      'Dashboard admin',
      'Aplikasi manajemen proyek',
      'Sistem komentar dan notifikasi',
      'Aplikasi pencarian menggunakan API',
      'Aplikasi dengan role-based access control',
      'Aplikasi laporan dengan autentikasi dan penyimpanan aman',
    ],
  },
]
