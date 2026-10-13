import type { CheckDef, LabFiles } from '../lab/runtime'
import type { Difficulty } from '../lib/types'
import type { SkillId } from './skills'
import { apiFetchList, apiFormPost } from './challengesApi'

export interface Challenge {
  id: string
  kind: 'practice' | 'debug'
  title: string
  summary: string
  difficulty: Difficulty
  minutes: number
  skills: SkillId[]
  /** Pelajaran yang sebaiknya dipelajari dulu. */
  lesson?: string
  /** Paragraf brief. `kode` → <code>. */
  brief: string[]
  instructions: string[]
  starter: LabFiles
  solution: LabFiles
  hints: string[]
  checks: CheckDef[]
  /** Penjelasan perubahan pada solusi — ditampilkan bersama solusi. */
  solutionNotes: string[]
  /** Isi api/config.json untuk Mock API; jika ada, preview melayani fetch('/api/...'). */
  api?: string
}

export { baseCss, page } from './challengeKit'
import { baseCss, page } from './challengeKit'

/* ------------------------------------------------------------------ */
/*  PRACTICE                                                          */
/* ------------------------------------------------------------------ */

const htmlCard: Challenge = {
  id: 'html-profile-card',
  kind: 'practice',
  title: 'Kartu Profil HTML',
  summary: 'Susun kartu profil dengan heading, paragraf, gambar ber-alt, dan link.',
  difficulty: 'Pemula',
  minutes: 10,
  skills: ['html', 'accessibility'],
  lesson: 'html-2',
  brief: [
    'Kamu akan membuat kartu profil sederhana hanya dengan HTML. CSS sudah disiapkan, jadi fokus pada *struktur*.',
    'Untuk gambar, kamu boleh memakai alamat `https://picsum.photos/200` — Lab mengizinkan gambar dari https.',
  ],
  instructions: [
    'Di dalam `<article class="kartu">`, tambahkan satu `<h1>` berisi namamu.',
    'Tambahkan `<p>` berisi satu kalimat tentang dirimu (minimal 10 karakter).',
    'Tambahkan `<img>` dengan `src` dan `alt` yang mendeskripsikan gambar.',
    'Tambahkan `<a>` yang menuju alamat https mana pun, misalnya profil GitHub-mu.',
  ],
  starter: {
    html: page('Kartu Profil', `  <article class="kartu">
    <!-- Tulis kodemu di sini -->

  </article>`),
    css: baseCss + `
.kartu {
  max-width: 320px;
  margin: 0 auto;
  padding: 24px;
  border-radius: 16px;
  background: #eef2ff;
  text-align: center;
}

.kartu img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}
`,
    js: `// Tantangan ini tidak membutuhkan JavaScript.\n`,
  },
  solution: {
    html: page('Kartu Profil', `  <article class="kartu">
    <img src="https://picsum.photos/200" alt="Foto profil Agnes tersenyum di depan papan tulis">
    <h1>Agnes</h1>
    <p>Guru yang sedang belajar membangun website untuk sekolah.</p>
    <a href="https://github.com/">Lihat profil GitHub saya</a>
  </article>`),
    css: '',
    js: `// Tantangan ini tidak membutuhkan JavaScript.\n`,
  },
  hints: [
    'Semua elemen ditulis DI ANTARA `<article class="kartu">` dan `</article>`.',
    'Gambar ditulis seperti ini: `<img src="..." alt="...">` — tanpa tag penutup.',
    'Link ditulis `<a href="https://...">teks link</a>`. Teks link wajib ada agar bisa diklik.',
  ],
  checks: [
    { id: 'h1', label: 'Ada tepat satu <h1> yang berisi teks', expected: '1 heading <h1> tidak kosong', test: (h) => { const all = h.$$('h1'); return { pass: all.length === 1 && (h.text(all[0]) ?? '').length > 0, actual: `${all.length} <h1>${all[0] ? ` berisi “${h.text(all[0])}”` : ''}` } } },
    { id: 'p', label: 'Paragraf berisi minimal 10 karakter', expected: '<p> dengan ≥ 10 karakter', test: (h) => { const t = h.text(h.$('.kartu p')) ?? ''; return { pass: t.length >= 10, actual: t ? `${t.length} karakter` : 'tidak ada <p> di dalam kartu' } } },
    { id: 'img', label: 'Gambar punya src dan alt yang deskriptif', expected: 'alt minimal 5 karakter', test: (h) => { const img = h.$('.kartu img'); if (!img) return { pass: false, actual: 'tidak ada <img>' }; const alt = img.getAttribute('alt') ?? ''; return { pass: !!img.getAttribute('src') && alt.trim().length >= 5, actual: `src=${img.getAttribute('src') ? 'ada' : 'kosong'}, alt="${alt}"` } } },
    { id: 'a', label: 'Link menuju alamat https dan punya teks', expected: 'href diawali https://', test: (h) => { const a = h.$('.kartu a'); if (!a) return { pass: false, actual: 'tidak ada <a>' }; const href = a.getAttribute('href') ?? ''; return { pass: href.startsWith('https://') && (h.text(a) ?? '').length > 0, actual: `href="${href}", teks="${h.text(a)}"` } } },
  ],
  solutionNotes: [
    'Gambar diletakkan di atas agar kartu terlihat seperti kartu profil pada umumnya.',
    'alt menjelaskan ISI gambar, bukan sekadar “foto”.',
    'Teks link menjelaskan tujuannya (“Lihat profil GitHub saya”), bukan “klik di sini”.',
  ],
}

const cssButton: Challenge = {
  id: 'css-button',
  kind: 'practice',
  title: 'Tombol yang Menarik',
  summary: 'Beri gaya tombol dengan warna, padding, sudut membulat, dan efek hover.',
  difficulty: 'Pemula',
  minutes: 10,
  skills: ['css'],
  lesson: 'css-2',
  brief: ['HTML tombol sudah ada. Tugasmu hanya menulis CSS di `style.css` untuk class `.tombol`.'],
  instructions: [
    'Beri `.tombol` warna latar (`background`) dan warna teks yang kontras.',
    'Beri `padding` minimal 10px agar tombol nyaman diklik.',
    'Hilangkan garis tepi bawaan dengan `border: none`.',
    'Bulatkan sudut dengan `border-radius`.',
    'Tambahkan aturan `.tombol:hover` yang mengubah warna latar.',
  ],
  starter: {
    html: page('Tombol', `  <button class="tombol">Daftar Sekarang</button>`),
    css: baseCss + `
.tombol {
  font: inherit;
  /* Tulis gayamu di sini */
}
`,
    js: '',
  },
  solution: {
    html: '',
    css: baseCss + `
.tombol {
  font: inherit;
  background: #4f46e5;
  color: #ffffff;
  padding: 12px 24px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s;
}

.tombol:hover {
  background: #4338ca;
}
`,
    js: '',
  },
  hints: [
    'Properti ditulis di DALAM kurung kurawal `.tombol { ... }`, masing-masing diakhiri titik koma.',
    'Contoh: `background: #4f46e5;` dan `color: white;`.',
    'Aturan hover ditulis terpisah: `.tombol:hover { background: #4338ca; }`.',
  ],
  checks: [
    { id: 'bg', label: 'Tombol punya warna latar', expected: 'background-color bukan bawaan', test: (h) => { const bg = h.css(h.$('.tombol'), 'background-color'); return { pass: !!bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(239, 239, 239)' && bg !== 'rgb(240, 240, 240)', actual: bg } } },
    { id: 'pad', label: 'Padding minimal 10px', expected: 'padding-top & padding-left ≥ 10px', test: (h) => { const el = h.$('.tombol'); const t = parseFloat(h.css(el, 'padding-top')); const l = parseFloat(h.css(el, 'padding-left')); return { pass: t >= 10 && l >= 10, actual: `atas ${t}px, kiri ${l}px` } } },
    { id: 'border', label: 'Tanpa garis tepi bawaan', expected: 'border-style: none', test: (h) => { const s = h.css(h.$('.tombol'), 'border-top-style'); return { pass: s === 'none', actual: s } } },
    { id: 'radius', label: 'Sudut membulat', expected: 'border-radius > 0', test: (h) => { const r = h.css(h.$('.tombol'), 'border-top-left-radius'); return { pass: parseFloat(r) > 0, actual: r } } },
    {
      id: 'hover',
      label: 'Ada aturan :hover untuk .tombol',
      expected: 'selector .tombol:hover di CSS',
      test: () => {
        for (const sheet of Array.from(document.styleSheets)) {
          for (const rule of Array.from(sheet.cssRules)) if (rule instanceof CSSStyleRule && /\.tombol:hover/.test(rule.selectorText)) return { pass: true, actual: rule.selectorText }
        }
        return { pass: false, actual: 'tidak ditemukan' }
      },
    },
  ],
  solutionNotes: [
    'border-radius: 999px membuat tombol berbentuk kapsul berapa pun tingginya.',
    'cursor: pointer memberi tanda bahwa elemen bisa diklik; transition membuat perubahan warna halus.',
    'Warna hover sedikit lebih gelap agar tetap kontras dengan teks putih.',
  ],
}

const flexNav: Challenge = {
  id: 'flex-nav',
  kind: 'practice',
  title: 'Navigasi dengan Flexbox',
  summary: 'Susun logo di kiri dan menu di kanan menggunakan Flexbox.',
  difficulty: 'Pemula',
  minutes: 15,
  skills: ['layout', 'css'],
  lesson: 'css-3',
  brief: ['Header berisi logo dan tiga link. Saat ini semuanya bertumpuk. Gunakan Flexbox untuk merapikannya.'],
  instructions: [
    'Jadikan `.header` sebuah flex container.',
    'Letakkan logo di paling kiri dan menu di paling kanan dengan `justify-content`.',
    'Ratakan secara vertikal dengan `align-items: center`.',
    'Jadikan `.menu` flex container juga, dengan `gap` minimal 12px antar-link.',
  ],
  starter: {
    html: page('Navigasi', `  <header class="header">
    <a class="logo" href="#">Jelajah Takalar</a>
    <nav class="menu" aria-label="Menu utama">
      <a href="#">Destinasi</a>
      <a href="#">Kuliner</a>
      <a href="#">Kontak</a>
    </nav>
  </header>`),
    css: baseCss + `
.header {
  background: #0e7490;
  padding: 12px 20px;
  border-radius: 12px;
}

.header a {
  color: white;
  text-decoration: none;
}

.logo {
  font-weight: 800;
}

/* Tulis aturan Flexbox di sini */
`,
    js: '',
  },
  solution: {
    html: '',
    css: baseCss + `
.header {
  background: #0e7490;
  padding: 12px 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header a {
  color: white;
  text-decoration: none;
}

.logo {
  font-weight: 800;
}

.menu {
  display: flex;
  gap: 16px;
}
`,
    js: '',
  },
  hints: [
    '`display: flex;` diletakkan pada elemen INDUK — di sini `.header`.',
    '`justify-content: space-between;` mendorong anak pertama ke kiri dan anak terakhir ke kanan.',
    'Untuk jarak antar-link, tulis aturan baru `.menu { display: flex; gap: 16px; }`.',
  ],
  checks: [
    { id: 'flex', label: '.header memakai display: flex', expected: 'flex', test: (h) => { const v = h.css(h.$('.header'), 'display'); return { pass: v === 'flex', actual: v } } },
    { id: 'jc', label: 'Logo kiri, menu kanan', expected: 'justify-content: space-between', test: (h) => { const v = h.css(h.$('.header'), 'justify-content'); return { pass: v === 'space-between', actual: v } } },
    { id: 'ai', label: 'Rata tengah vertikal', expected: 'align-items: center', test: (h) => { const v = h.css(h.$('.header'), 'align-items'); return { pass: v === 'center', actual: v } } },
    { id: 'gap', label: 'Menu flex dengan jarak ≥ 12px', expected: '.menu flex, gap ≥ 12px', test: (h) => { const m = h.$('.menu'); const d = h.css(m, 'display'); const g = parseFloat(h.css(m, 'column-gap')) || 0; return { pass: d === 'flex' && g >= 12, actual: `display ${d}, gap ${g}px` } } },
  ],
  solutionNotes: [
    'Flexbox diaktifkan dua kali: pada .header (logo vs menu) dan pada .menu (antar-link).',
    'gap lebih rapi daripada memberi margin pada setiap link.',
  ],
}

const jsSum: Challenge = {
  id: 'js-function-sum',
  kind: 'practice',
  title: 'Fungsi Penjumlahan',
  summary: 'Tulis fungsi pertamamu dan cetak hasilnya ke Console.',
  difficulty: 'Pemula',
  minutes: 10,
  skills: ['javascript'],
  lesson: 'js-2',
  brief: ['Kamu akan menulis fungsi yang menerima dua angka dan mengembalikan jumlahnya, lalu melihat hasilnya di panel Console.'],
  instructions: [
    'Di `script.js`, buat fungsi dengan *function declaration*: `function jumlah(a, b) { ... }`.',
    'Fungsi harus `return` hasil a + b.',
    'Panggil fungsinya dan cetak hasil `jumlah(5, 10)` dengan `console.log`.',
    'Buka tab Console di panel hasil untuk melihat output.',
  ],
  starter: {
    html: page('Fungsi', `  <h1>Buka tab Console untuk melihat hasil</h1>`),
    css: baseCss,
    js: `// 1. Buat fungsi jumlah(a, b) di bawah ini


// 2. Cetak hasil jumlah(5, 10)
`,
  },
  solution: {
    html: '',
    css: '',
    js: `// Fungsi menerima dua angka dan mengembalikan jumlahnya
function jumlah(a, b) {
  return a + b;
}

console.log(jumlah(5, 10)); // 15
`,
  },
  hints: [
    'Kerangka fungsi: `function jumlah(a, b) { }`. Isi kurung kurawalnya dengan satu baris `return`.',
    '`return a + b;` mengembalikan hasilnya kepada pemanggil fungsi.',
    'Untuk mencetak: `console.log(jumlah(5, 10));`',
  ],
  checks: [
    { id: 'fn', label: 'Fungsi jumlah ada', expected: 'typeof jumlah === "function"', test: () => { const w = window as unknown as Record<string, unknown>; return { pass: typeof w.jumlah === 'function', actual: typeof w.jumlah } } },
    { id: 'ret', label: 'jumlah(2, 3) mengembalikan 5', expected: '5', test: () => { const f = (window as unknown as Record<string, unknown>).jumlah; if (typeof f !== 'function') return { pass: false, actual: 'fungsi belum ada' }; const r = f(2, 3); return { pass: r === 5, actual: String(r) } } },
    { id: 'neg', label: 'jumlah(-4, 10) mengembalikan 6', expected: '6', test: () => { const f = (window as unknown as Record<string, unknown>).jumlah; if (typeof f !== 'function') return { pass: false, actual: 'fungsi belum ada' }; const r = f(-4, 10); return { pass: r === 6, actual: String(r) } } },
    { id: 'log', label: 'Console menampilkan 15', expected: '15', test: (h) => { const l = h.logs(); return { pass: l.some((x) => x.trim() === '15'), actual: l.length ? l.slice(-3).join(' | ') : 'Console kosong' } } },
  ],
  solutionNotes: [
    'Function declaration (`function jumlah`) bisa dipanggil dari mana saja di file, bahkan sebelum baris definisinya.',
    'return mengembalikan nilai; console.log hanya MENAMPILKAN nilai. Fungsi yang hanya console.log tanpa return akan menghasilkan undefined.',
  ],
}

const jsCounter: Challenge = {
  id: 'dom-counter',
  kind: 'practice',
  title: 'Tombol Penghitung',
  summary: 'Ubah angka di halaman saat tombol diklik dengan addEventListener.',
  difficulty: 'Pemula',
  minutes: 15,
  skills: ['dom', 'javascript'],
  lesson: 'dom-2',
  brief: ['Halaman punya angka dan dua tombol. Buat tombol “Tambah” menaikkan angka dan “Reset” mengembalikannya ke 0.'],
  instructions: [
    'Ambil elemen `#angka`, `#tambah`, dan `#reset` dengan `document.querySelector`.',
    'Buat variabel `let hitungan = 0;`.',
    'Saat `#tambah` diklik, naikkan `hitungan` lalu tampilkan di `#angka` dengan `textContent`.',
    'Saat `#reset` diklik, kembalikan ke 0 dan tampilkan.',
  ],
  starter: {
    html: page('Penghitung', `  <main class="penghitung">
    <p id="angka">0</p>
    <div class="tombol-grup">
      <button id="tambah">Tambah</button>
      <button id="reset">Reset</button>
    </div>
  </main>`),
    css: baseCss + `
.penghitung {
  text-align: center;
}

#angka {
  font-size: 4rem;
  font-weight: 800;
  margin: 0;
}

.tombol-grup button {
  font: inherit;
  padding: 8px 16px;
  margin: 4px;
  border-radius: 8px;
  border: 1px solid #94a3b8;
  cursor: pointer;
}
`,
    js: `// 1. Ambil elemen-elemen
const angka = document.querySelector('#angka');

// 2. Simpan nilai hitungan


// 3. Tambahkan event listener untuk tombol
`,
  },
  solution: {
    html: '',
    css: '',
    js: `// 1. Ambil elemen-elemen
const angka = document.querySelector('#angka');
const tombolTambah = document.querySelector('#tambah');
const tombolReset = document.querySelector('#reset');

// 2. Simpan nilai hitungan
let hitungan = 0;

function tampilkan() {
  angka.textContent = hitungan;
}

// 3. Event listener
tombolTambah.addEventListener('click', function () {
  hitungan = hitungan + 1;
  tampilkan();
});

tombolReset.addEventListener('click', function () {
  hitungan = 0;
  tampilkan();
});
`,
  },
  hints: [
    'Ambil tombol dengan cara yang sama seperti `angka`: `const tombolTambah = document.querySelector("#tambah");`',
    'Pola event: `tombolTambah.addEventListener("click", function () { ... });`',
    'Di dalam fungsi: `hitungan = hitungan + 1;` lalu `angka.textContent = hitungan;`',
  ],
  checks: [
    { id: 'start', label: 'Angka awal 0', expected: '0', test: (h) => { const t = h.text(h.$('#angka')); return { pass: t === '0', actual: String(t) } } },
    { id: 'plus', label: 'Klik Tambah 3× → 3', expected: '3', test: async (h) => { const b = h.$('#tambah'); h.click(b); h.click(b); h.click(b); await h.wait(20); const t = h.text(h.$('#angka')); return { pass: t === '3', actual: String(t) } } },
    { id: 'reset', label: 'Klik Reset → 0', expected: '0', test: async (h) => { h.click(h.$('#reset')); await h.wait(20); const t = h.text(h.$('#angka')); return { pass: t === '0', actual: String(t) } } },
    { id: 'again', label: 'Setelah reset, Tambah 1× → 1', expected: '1', test: async (h) => { h.click(h.$('#tambah')); await h.wait(20); const t = h.text(h.$('#angka')); return { pass: t === '1', actual: String(t) } } },
    { id: 'noerr', label: 'Tidak ada error JavaScript', expected: '0 error', test: (h) => { const e = h.errors(); return { pass: e.length === 0, actual: e.length ? e[0] : '0 error' } } },
  ],
  solutionNotes: [
    'hitungan memakai let karena nilainya berubah; elemen memakai const karena referensinya tetap.',
    'Fungsi tampilkan() dipakai dua kali — hindari menulis kode yang sama berulang (prinsip DRY).',
  ],
}

const domTodo: Challenge = {
  id: 'dom-todo',
  kind: 'practice',
  title: 'Daftar Tugas Sederhana',
  summary: 'Tambahkan item ke daftar dari form, dan abaikan input kosong.',
  difficulty: 'Menengah',
  minutes: 25,
  skills: ['dom', 'javascript', 'accessibility'],
  lesson: 'dom-2',
  brief: ['Buat form yang menambahkan tugas ke `<ul id="daftar">`. Ini pola dasar hampir semua aplikasi web: input → proses → tampilkan.'],
  instructions: [
    'Tangkap event `submit` pada `#form-tugas` dan panggil `event.preventDefault()`.',
    'Ambil nilai `#input-tugas`, buang spasi di awal/akhir dengan `.trim()`.',
    'Jika kosong, jangan tambahkan apa pun.',
    'Jika tidak kosong, buat `<li>` baru dengan `document.createElement`, isi dengan `textContent`, dan tambahkan ke `#daftar`.',
    'Kosongkan input setelah menambahkan.',
  ],
  starter: {
    html: page('Daftar Tugas', `  <main class="kotak">
    <h1>Tugas Hari Ini</h1>
    <form id="form-tugas">
      <label for="input-tugas">Tugas baru</label>
      <input id="input-tugas" type="text" autocomplete="off">
      <button type="submit">Tambah</button>
    </form>
    <ul id="daftar"></ul>
  </main>`),
    css: baseCss + `
.kotak {
  max-width: 420px;
  margin: 0 auto;
}

form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

label {
  width: 100%;
  font-weight: 600;
}

input {
  flex: 1;
  font: inherit;
  padding: 8px;
}

button {
  font: inherit;
  padding: 8px 14px;
}
`,
    js: `const form = document.querySelector('#form-tugas');
const input = document.querySelector('#input-tugas');
const daftar = document.querySelector('#daftar');

// Tulis kodemu di sini
`,
  },
  solution: {
    html: '',
    css: '',
    js: `const form = document.querySelector('#form-tugas');
const input = document.querySelector('#input-tugas');
const daftar = document.querySelector('#daftar');

form.addEventListener('submit', function (event) {
  event.preventDefault(); // cegah halaman dimuat ulang

  const teks = input.value.trim();
  if (teks === '') return; // abaikan input kosong

  const item = document.createElement('li');
  item.textContent = teks; // textContent aman dari HTML berbahaya
  daftar.appendChild(item);

  input.value = '';
  input.focus();
});
`,
  },
  hints: [
    'Mulai dengan `form.addEventListener("submit", function (event) { event.preventDefault(); });` lalu cek bahwa halaman tidak berkedip saat submit.',
    '`const teks = input.value.trim(); if (teks === "") return;` menghentikan fungsi jika input kosong.',
    'Buat item: `const item = document.createElement("li"); item.textContent = teks; daftar.appendChild(item);`',
  ],
  checks: [
    { id: 'add', label: 'Menambah “Belajar CSS” ke daftar', expected: '1 <li> berisi “Belajar CSS”', test: async (h) => { h.type(h.$('#input-tugas'), 'Belajar CSS'); h.submit(h.$('#form-tugas')); await h.wait(30); const li = h.$$('#daftar li'); return { pass: li.length === 1 && h.text(li[0]) === 'Belajar CSS', actual: `${li.length} item${li[0] ? `: “${h.text(li[0])}”` : ''}` } } },
    { id: 'clear', label: 'Input dikosongkan setelah menambah', expected: 'value kosong', test: (h) => { const v = (h.$('#input-tugas') as HTMLInputElement | null)?.value; return { pass: v === '', actual: JSON.stringify(v) } } },
    { id: 'empty', label: 'Input kosong/spasi diabaikan', expected: 'tetap 1 item', test: async (h) => { h.type(h.$('#input-tugas'), '   '); h.submit(h.$('#form-tugas')); await h.wait(30); const n = h.$$('#daftar li').length; return { pass: n === 1, actual: `${n} item` } } },
    { id: 'safe', label: 'Teks HTML ditampilkan sebagai teks (aman)', expected: 'tidak ada <b> baru', test: async (h) => { h.type(h.$('#input-tugas'), '<b>tebal</b>'); h.submit(h.$('#form-tugas')); await h.wait(30); const last = h.$$('#daftar li').pop(); return { pass: !!last && !last.querySelector('b') && h.text(last) === '<b>tebal</b>', actual: last ? `isi: ${last.innerHTML}` : 'tidak ada item' } } },
  ],
  solutionNotes: [
    'preventDefault() mencegah perilaku bawaan form (memuat ulang halaman).',
    'trim() membuat input berisi spasi saja dianggap kosong.',
    'textContent menampilkan teks apa adanya. innerHTML akan menjalankan HTML dari pengguna — sumber celah keamanan XSS.',
  ],
}

/* ------------------------------------------------------------------ */
/*  DEBUG                                                             */
/* ------------------------------------------------------------------ */

const debugImage: Challenge = {
  id: 'debug-broken-html',
  kind: 'debug',
  title: 'Gambar dan Link Rusak',
  summary: 'Temukan atribut yang salah ketik sehingga gambar dan link tidak berfungsi.',
  difficulty: 'Pemula',
  minutes: 10,
  skills: ['html', 'accessibility'],
  lesson: 'html-2',
  brief: ['Halaman promosi ini dibuat terburu-buru. Gambar tidak muncul, link tidak bisa diklik, dan pembaca layar tidak tahu isi gambar. Ada 3 bug.'],
  instructions: ['Jalankan kode dan amati hasilnya.', 'Bandingkan setiap atribut dengan yang kamu pelajari di pelajaran HTML.', 'Perbaiki sampai semua pemeriksaan hijau.'],
  starter: {
    html: page('Promo', `  <section class="promo">
    <h1>Festival Kuliner</h1>
    <img scr="https://picsum.photos/400/200">
    <p>Daftar sekarang sebelum kuota habis!</p>
    <a herf="https://example.com/daftar">Daftar di sini</a>
  </section>`),
    css: baseCss + `
.promo {
  max-width: 420px;
}

.promo img {
  width: 100%;
  border-radius: 12px;
  background: #e2e8f0;
  min-height: 40px;
}
`,
    js: '',
  },
  solution: {
    html: page('Promo', `  <section class="promo">
    <h1>Festival Kuliner</h1>
    <img src="https://picsum.photos/400/200" alt="Aneka hidangan di meja festival kuliner">
    <p>Daftar sekarang sebelum kuota habis!</p>
    <a href="https://example.com/daftar">Daftar di sini</a>
  </section>`),
    css: '',
    js: '',
  },
  hints: ['Browser mengabaikan atribut yang tidak dikenalnya tanpa pesan error — baca ejaannya huruf demi huruf.', 'Atribut lokasi gambar adalah `src` (source).', 'Atribut tujuan link adalah `href`, dan gambar wajib punya `alt`.'],
  checks: [
    { id: 'src', label: 'Gambar punya atribut src', expected: 'src terisi', test: (h) => { const img = h.$('img'); return { pass: !!img?.getAttribute('src'), actual: img ? Array.from(img.attributes).map((a) => a.name).join(', ') || 'tanpa atribut' : 'tidak ada <img>' } } },
    { id: 'alt', label: 'Gambar punya alt deskriptif', expected: 'alt ≥ 5 karakter', test: (h) => { const alt = h.$('img')?.getAttribute('alt'); return { pass: (alt ?? '').trim().length >= 5, actual: alt === null || alt === undefined ? 'alt tidak ada' : `"${alt}"` } } },
    { id: 'href', label: 'Link punya href', expected: 'href terisi', test: (h) => { const a = h.$('a'); return { pass: !!a?.getAttribute('href'), actual: a ? Array.from(a.attributes).map((x) => x.name).join(', ') || 'tanpa atribut' : 'tidak ada <a>' } } },
  ],
  solutionNotes: ['scr → src', 'herf → href', 'Menambahkan alt yang menjelaskan isi gambar.', 'Pelajaran: HTML tidak menampilkan error untuk salah ketik atribut. Selalu periksa dengan DevTools atau validator.'],
}

const debugCss: Challenge = {
  id: 'debug-css-not-applied',
  kind: 'debug',
  title: 'CSS yang Tidak Berlaku',
  summary: 'Judul seharusnya berwarna indigo dan kartu berlatar abu-abu, tapi tidak terjadi.',
  difficulty: 'Pemula',
  minutes: 15,
  skills: ['css'],
  lesson: 'css-1',
  brief: ['Desainer ingin judul berwarna indigo (#4f46e5) dan kartu berlatar #f1f5f9 dengan padding 16px. Ada 3 bug yang membuat sebagian gaya tidak berlaku.'],
  instructions: ['Periksa apakah nama class di HTML dan CSS sama persis.', 'Periksa tanda baca di setiap deklarasi CSS.', 'Gunakan tab Cek untuk melihat nilai aktual vs yang diharapkan.'],
  starter: {
    html: page('Kartu', `  <div class="kartu">
    <h1 class="Judul">Pengumuman</h1>
    <p>Ujian dimulai pukul 07.30.</p>
  </div>`),
    css: baseCss + `
.judul {
  color: #4f46e5;
}

.kartu {
  background: #f1f5f9
  padding: 16px;
  border-radius: 12px;
}

kartu p {
  margin: 0;
}
`,
    js: '',
  },
  solution: {
    html: page('Kartu', `  <div class="kartu">
    <h1 class="judul">Pengumuman</h1>
    <p>Ujian dimulai pukul 07.30.</p>
  </div>`),
    css: baseCss + `
.judul {
  color: #4f46e5;
}

.kartu {
  background: #f1f5f9;
  padding: 16px;
  border-radius: 12px;
}

.kartu p {
  margin: 0;
}
`,
    js: '',
  },
  hints: ['Nama class peka huruf besar/kecil: `Judul` dan `judul` berbeda.', 'Jika satu deklarasi lupa titik koma, deklarasi BERIKUTNYA ikut rusak. Lihat baris background.', 'Selektor class harus diawali titik. Apa yang kurang di `kartu p`?'],
  checks: [
    { id: 'color', label: 'Judul berwarna indigo', expected: 'rgb(79, 70, 229)', test: (h) => { const c = h.css(h.$('h1'), 'color'); return { pass: c === 'rgb(79, 70, 229)', actual: c } } },
    { id: 'bg', label: 'Kartu berlatar #f1f5f9', expected: 'rgb(241, 245, 249)', test: (h) => { const c = h.css(h.$('.kartu'), 'background-color'); return { pass: c === 'rgb(241, 245, 249)', actual: c } } },
    { id: 'pad', label: 'Kartu ber-padding 16px', expected: '16px', test: (h) => { const c = h.css(h.$('.kartu'), 'padding-top'); return { pass: c === '16px', actual: c } } },
    { id: 'p', label: 'Paragraf di kartu tanpa margin', expected: '0px', test: (h) => { const c = h.css(h.$('.kartu p'), 'margin-top'); return { pass: c === '0px', actual: c } } },
  ],
  solutionNotes: ['class="Judul" → class="judul" (huruf kecil, sama dengan CSS).', 'Menambahkan ; setelah background: #f1f5f9 — tanpa itu, padding juga diabaikan.', 'kartu p → .kartu p (selektor class butuh titik).'],
}

const debugJs: Challenge = {
  id: 'debug-js-button',
  kind: 'debug',
  title: 'Tombol yang Tidak Bereaksi',
  summary: 'Klik tombol seharusnya menampilkan sapaan. Baca pesan error di Console.',
  difficulty: 'Pemula',
  minutes: 15,
  skills: ['dom', 'javascript'],
  lesson: 'dom-1',
  brief: ['Saat tombol “Sapa” diklik, paragraf `#pesan` seharusnya berisi “Halo, selamat belajar!”. Ada 3 bug. Mulailah dari pesan error di Console — DevStudio menjelaskan arti error-nya.'],
  instructions: ['Jalankan kode lalu buka tab Console.', 'Klik error untuk melompat ke baris yang bermasalah.', 'Perbaiki satu bug, jalankan ulang, lalu baca error berikutnya.'],
  starter: {
    html: page('Sapa', `  <button id="tombol-sapa">Sapa</button>
  <p id="pesan"></p>`),
    css: baseCss + `
button {
  font: inherit;
  padding: 8px 16px;
}
`,
    js: `const tombol = document.querySelector('#tombol-sap');
const pesan = document.querySelector('#pesan');

tombol.addEventListener('onclick', function () {
  pesan.textcontent = 'Halo, selamat belajar!';
});
`,
  },
  solution: {
    html: '',
    css: '',
    js: `const tombol = document.querySelector('#tombol-sapa');
const pesan = document.querySelector('#pesan');

tombol.addEventListener('click', function () {
  pesan.textContent = 'Halo, selamat belajar!';
});
`,
  },
  hints: ['Error “Cannot read properties of null” berarti querySelector tidak menemukan elemen. Bandingkan selectornya dengan id di HTML.', 'Nama event untuk addEventListener tidak memakai awalan “on”.', 'JavaScript peka huruf besar/kecil: properti teks elemen ditulis `textContent` (C besar).'],
  checks: [
    { id: 'noerr', label: 'Tidak ada error saat halaman dimuat', expected: '0 error', test: (h) => { const e = h.errors(); return { pass: e.length === 0, actual: e.length ? e[0] : '0 error' } } },
    { id: 'click', label: 'Klik tombol menampilkan sapaan', expected: '“Halo, selamat belajar!”', test: async (h) => { h.click(h.$('#tombol-sapa')); await h.wait(30); const t = h.text(h.$('#pesan')); return { pass: t === 'Halo, selamat belajar!', actual: t ? `“${t}”` : 'kosong' } } },
  ],
  solutionNotes: ["'#tombol-sap' → '#tombol-sapa' (sesuai id di HTML).", "'onclick' → 'click'. Awalan “on” hanya dipakai pada atribut HTML (onclick=\"...\") atau properti (el.onclick).", 'textcontent → textContent. Menulis properti yang salah tidak memunculkan error — JavaScript diam-diam membuat properti baru yang tidak berguna.'],
}

const debugLoop: Challenge = {
  id: 'debug-loop-total',
  kind: 'debug',
  title: 'Total Belanja yang Salah',
  summary: 'Total belanja seharusnya Rp75.000 tetapi programnya error. Perbaiki loop-nya.',
  difficulty: 'Menengah',
  minutes: 20,
  skills: ['javascript', 'dom'],
  lesson: 'js-3',
  brief: ['Program menjumlahkan harga dalam array, mencetak total ke Console, dan menampilkannya di `#total`. Hasilnya error. Ada 2 bug di loop.', 'Gunakan `console.log` di dalam loop untuk melihat nilai `i` dan `harga[i]` di setiap putaran — teknik debugging paling dasar.'],
  instructions: ['Tambahkan `console.log(i, harga[i])` di dalam loop dan jalankan.', 'Perhatikan putaran terakhir: berapa nilai harga[i]?', 'Perhatikan juga operator yang dipakai untuk menambah total.'],
  starter: {
    html: page('Belanja', `  <h1>Keranjang Belanja</h1>
  <p>Total: <strong id="total">-</strong></p>`),
    css: baseCss,
    js: `const harga = [15000, 25000, 35000];
let total = 0;

for (let i = 0; i <= harga.length; i++) {
  total = harga[i];
}

console.log(total);
document.querySelector('#total').textContent = 'Rp' + total.toLocaleString('id-ID');
`,
  },
  solution: {
    html: '',
    css: '',
    js: `const harga = [15000, 25000, 35000];
let total = 0;

// Indeks array dimulai dari 0, jadi indeks terakhir adalah harga.length - 1
for (let i = 0; i < harga.length; i++) {
  total += harga[i]; // tambahkan, jangan timpa
}

console.log(total); // 75000
document.querySelector('#total').textContent = 'Rp' + total.toLocaleString('id-ID');
`,
  },
  hints: ['Array dengan 3 item punya indeks 0, 1, 2. Dengan `<=`, loop juga mencoba indeks 3 — hasilnya undefined.', 'Ganti `<=` menjadi `<`.', '`total = harga[i]` MENIMPA total. Gunakan `total += harga[i]` untuk menambahkan.'],
  checks: [
    { id: 'log', label: 'Console mencetak 75000', expected: '75000', test: (h) => { const l = h.logs(); return { pass: l.some((x) => x.trim() === '75000'), actual: l.length ? l[l.length - 1] : 'Console kosong' } } },
    { id: 'dom', label: '#total menampilkan Rp75.000', expected: 'Rp75.000', test: (h) => { const t = h.text(h.$('#total')); return { pass: t === 'Rp75.000', actual: String(t) } } },
  ],
  solutionNotes: ['i <= harga.length → i < harga.length. Putaran ke-4 membaca harga[3] yang undefined (dan angka + undefined menghasilkan NaN).', 'total = harga[i] → total += harga[i]. Operator = mengganti nilai; += menambahkan ke nilai lama.'],
}

export const CHALLENGES: Challenge[] = [htmlCard, cssButton, flexNav, jsSum, jsCounter, domTodo, debugImage, debugCss, debugJs, debugLoop, apiFetchList, apiFormPost]

export function findChallenge(id: string) {
  return CHALLENGES.find((c) => c.id === id)
}

/** File solusi lengkap: field kosong pada solution berarti “sama dengan starter”. */
export function solutionFiles(c: Challenge): LabFiles {
  return {
    html: c.solution.html || c.starter.html,
    css: c.solution.css || c.starter.css,
    js: c.solution.js || c.starter.js,
  }
}

/* ------------------------------------------------------------------ */
/*  Template Playground bebas                                          */
/* ------------------------------------------------------------------ */

export interface PlaygroundTemplate {
  id: string
  title: string
  description: string
  files: LabFiles
}

export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  {
    id: 'kosong',
    title: 'Halaman kosong',
    description: 'Kerangka HTML, CSS, dan JS yang sudah terhubung.',
    files: { html: page('Playground', '  <h1>Halo!</h1>'), css: baseCss, js: "console.log('Halo dari script.js');\n" },
  },
  {
    id: 'landing',
    title: 'Landing page mini',
    description: 'Hero, tiga kartu fitur dengan CSS Grid, dan tombol ajakan.',
    files: {
      html: page('Landing', `  <header class="hero">
    <h1>Belajar Web Bersama</h1>
    <p>Dari HTML pertama sampai website online.</p>
    <a class="cta" href="#fitur">Mulai</a>
  </header>
  <main id="fitur" class="fitur">
    <article><h2>Belajar</h2><p>Materi singkat dan jelas.</p></article>
    <article><h2>Praktik</h2><p>Tantangan dengan pemeriksa otomatis.</p></article>
    <article><h2>Bangun</h2><p>Proyek nyata untuk portofolio.</p></article>
  </main>`),
      css: `* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; color: #0f172a; }
.hero { padding: 64px 24px; text-align: center; color: white; background: linear-gradient(135deg, #4f46e5, #7c3aed); }
.hero h1 { font-size: clamp(2rem, 6vw, 3rem); margin: 0; }
.cta { display: inline-block; margin-top: 16px; padding: 10px 20px; border-radius: 999px; background: #22d3ee; color: #0f172a; font-weight: 700; text-decoration: none; }
.fitur { display: grid; gap: 16px; padding: 24px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.fitur article { padding: 16px; border-radius: 12px; background: #f1f5f9; }
`,
      js: '',
    },
  },
  {
    id: 'interaktif',
    title: 'Mode gelap interaktif',
    description: 'Tombol yang mengganti tema dengan classList.toggle.',
    files: {
      html: page('Tema', `  <button id="tema" aria-pressed="false">Mode gelap</button>
  <h1>Halo!</h1>
  <p>Klik tombol untuk mengganti tema.</p>`),
      css: `body { font-family: system-ui, sans-serif; padding: 24px; transition: background .2s, color .2s; }
body.gelap { background: #0b0d12; color: #e2e8f0; }
button { font: inherit; padding: 8px 14px; border-radius: 8px; }
`,
      js: `const tombol = document.querySelector('#tema');

tombol.addEventListener('click', function () {
  const gelap = document.body.classList.toggle('gelap');
  tombol.setAttribute('aria-pressed', String(gelap));
  tombol.textContent = gelap ? 'Mode terang' : 'Mode gelap';
  console.log('Mode gelap:', gelap);
});
`,
    },
  },
]
