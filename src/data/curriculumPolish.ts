import type { Lesson } from './curriculum'

/**
 * Phase 8 — React & Vite, Testing/Aksesibilitas/Keamanan/Performa, dan Advanced.
 * Catatan jujur: editor DevStudio menjalankan HTML/CSS/JS biasa. React dengan npm & Vite
 * dipraktikkan di komputer sendiri (lihat Local Workflow), bukan di preview DevStudio.
 */

export const reactLessons: Lesson[] = [
  {
    id: 'react-1',
    title: 'Mengapa React? Proyek Vite Pertama',
    minutes: 30,
    goal: 'Membuat proyek React + Vite di komputer dan memahami komponen serta JSX.',
    concepts: [
      'Saat halaman makin interaktif, mengubah DOM satu per satu (`querySelector`, `textContent`) jadi rumit. *React* membalik caranya: kamu menulis *bagaimana tampilan seharusnya* untuk data tertentu, React yang memperbarui DOM.',
      'Aplikasi React tersusun dari *komponen*: fungsi yang mengembalikan tampilan. Nama komponen diawali huruf besar: `function KartuProfil() { … }`.',
      '*JSX* adalah sintaks mirip HTML di dalam JavaScript. Bedanya: `class` → `className`, setiap tag harus ditutup (`<img />`), dan nilai JavaScript ditulis di dalam `{ }`.',
      '*Vite* adalah alat pengembangan: menjalankan dev server yang cepat dan membuat hasil build. React + Vite butuh Node.js dan npm — jadi dikerjakan di komputermu, bukan di editor DevStudio.',
      'Kapan TIDAK perlu React: website profil sekolah/portofolio sederhana cukup HTML/CSS/JS. React berguna untuk aplikasi dengan banyak keadaan (state): dashboard, form kompleks, aplikasi CRUD.',
    ],
    example: {
      language: 'bash',
      caption: 'Jalankan di terminal, di folder tempat kamu menyimpan proyek (bukan di dalam proyek lain).',
      code: `npm create vite@latest kartu-react -- --template react
cd kartu-react
npm install
npm run dev      # buka alamat http://localhost:5173 yang tampil`,
    },
    steps: [
      'Pastikan Node.js sudah terpasang (cek di halaman Local Workflow).',
      'Jalankan perintah di atas, lalu buka folder kartu-react di VS Code.',
      'Buka src/App.jsx. Ganti isinya dengan komponen sederhana yang menampilkan namamu, simpan, dan lihat browser berubah otomatis.',
      'Buat file src/KartuProfil.jsx berisi komponen, lalu pakai di App: <KartuProfil />.',
    ],
    challenge: 'Buat komponen KartuProfil yang menampilkan nama, kelas, dan satu kalimat tentang dirimu. Pakai komponen itu dua kali di App dengan isi yang sama (props dibahas di pelajaran berikutnya).',
    hints: ['Komponen: export default function KartuProfil() { return (<article>…</article>) }', 'Impor di App.jsx: import KartuProfil from "./KartuProfil"'],
    commonErrors: [
      { error: '“npm” tidak dikenali', fix: 'Node.js belum terpasang atau terminal belum dibuka ulang setelah instalasi.' },
      { error: 'Adjacent JSX elements must be wrapped in an enclosing tag', fix: 'Komponen hanya boleh mengembalikan SATU elemen induk. Bungkus dengan <div> atau fragment <>…</>.' },
      { error: 'Komponen tidak tampil / dianggap tag HTML', fix: 'Nama komponen harus diawali huruf besar: <KartuProfil />, bukan <kartuProfil />.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Di JSX, atribut class HTML ditulis sebagai…', options: [{ text: 'className', correct: true, why: 'Benar — class adalah kata kunci JavaScript.' }, { text: 'class', why: 'Akan memunculkan peringatan di React.' }] },
      { id: 'q2', prompt: 'Website profil sekolah 3 halaman tanpa interaksi rumit sebaiknya…', options: [{ text: 'Cukup HTML/CSS/JS — React tidak wajib.', correct: true, why: 'Benar — pilih alat sesuai kebutuhan.' }, { text: 'Wajib memakai React.', why: 'Menambah kerumitan tanpa manfaat.' }] },
      { id: 'q3', prompt: 'Mengapa proyek React+Vite tidak dijalankan di editor DevStudio?', options: [{ text: 'Butuh Node.js, npm, dan proses build yang berjalan di komputer.', correct: true, why: 'Benar — DevStudio tidak berpura-pura bisa menjalankannya.' }, { text: 'Karena React berbayar.', why: 'React gratis dan open source.' }] },
    ],
    skills: ['react'],
    practice: { to: '/local', label: 'Siapkan komputer di Local Workflow' },
  },
  {
    id: 'react-2',
    title: 'Props, State, dan Event',
    minutes: 35,
    goal: 'Mengirim data ke komponen (props) dan menyimpan data yang berubah (state).',
    concepts: [
      '*Props* adalah input komponen, seperti atribut HTML: `<KartuProfil nama="Ani" kelas="X-1" />`. Komponen menerimanya sebagai objek: `function KartuProfil({ nama, kelas })`. Props hanya dibaca, tidak diubah.',
      '*State* adalah data milik komponen yang bisa berubah: `const [jumlah, setJumlah] = useState(0)`. Memanggil `setJumlah(…)` membuat React menggambar ulang komponen dengan nilai baru.',
      'Event ditulis camelCase dan menerima fungsi: `onClick={() => setJumlah(jumlah + 1)}`. Jangan menulis `onClick={setJumlah(1)}` — itu langsung dijalankan saat render.',
      'Menampilkan daftar: `daftar.map((item) => <li key={item.id}>{item.nama}</li>)`. `key` membantu React mengenali item yang berubah — gunakan id unik, bukan indeks jika daftar bisa diurutkan ulang.',
      'React otomatis aman terhadap XSS untuk teks di `{ }` (seperti textContent). Hindari `dangerouslySetInnerHTML` kecuali benar-benar paham risikonya.',
    ],
    example: {
      language: 'js',
      caption: 'src/Penghitung.jsx — state + event + props.',
      code: `import { useState } from 'react'

export default function Penghitung({ label, awal = 0 }) {
  const [jumlah, setJumlah] = useState(awal)
  return (
    <div>
      <p>{label}: {jumlah}</p>
      <button onClick={() => setJumlah(jumlah + 1)}>Tambah</button>
      <button onClick={() => setJumlah(awal)}>Reset</button>
    </div>
  )
}`,
    },
    steps: [
      'Bandingkan dengan tantangan Coding Lab “Tombol Penghitung” (versi DOM). Apa yang tidak perlu kamu tulis lagi di React?',
      'Pakai <Penghitung label="Pengunjung" /> dua kali — perhatikan masing-masing punya state sendiri.',
      'Buat daftar tugas: state berupa array, form untuk menambah, tombol hapus per item.',
    ],
    challenge: 'Buat ulang “Daftar Tugas” dari Coding Lab dengan React: tambah, hapus, dan tandai selesai. Gunakan key yang unik.',
    hints: ['Menambah ke array state: setTugas([...tugas, { id: Date.now(), teks, selesai: false }])', 'Menghapus: setTugas(tugas.filter((t) => t.id !== id))'],
    commonErrors: [
      { error: 'Tampilan tidak berubah setelah array diubah dengan push()', fix: 'Jangan mengubah state langsung. Buat array baru: setTugas([...tugas, baru]).' },
      { error: 'Too many re-renders', fix: 'Kamu memanggil setState saat render, mis. onClick={setJumlah(1)}. Bungkus dengan fungsi: onClick={() => setJumlah(1)}.' },
      { error: 'Warning: Each child in a list should have a unique "key" prop', fix: 'Tambahkan key={item.id} pada elemen terluar di dalam map().' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Data yang dikirim dari komponen induk ke anak disebut…', options: [{ text: 'props', correct: true, why: 'Benar.' }, { text: 'state', why: 'State adalah data milik komponen itu sendiri.' }] },
      { id: 'q2', prompt: 'Cara benar menambah item ke state array…', options: [{ text: 'tugas.push(baru)', why: 'Mengubah langsung — React tidak tahu ada perubahan.' }, { text: 'setTugas([...tugas, baru])', correct: true, why: 'Benar — array baru.' }] },
    ],
    skills: ['react', 'javascript'],
    practice: { to: '/lab/c/dom-todo', label: 'Bandingkan dengan versi DOM di Coding Lab' },
  },
  {
    id: 'react-3',
    title: 'useEffect, Mengambil Data, dan Build',
    minutes: 35,
    goal: 'Mengambil data dari API di React dan menerbitkan proyek Vite.',
    concepts: [
      '`useEffect(() => { … }, [])` menjalankan kode setelah komponen tampil — tempat yang tepat untuk mengambil data. Array kosong `[]` berarti “sekali saja saat pertama tampil”.',
      'Pola data: tiga state — `data`, `loading`, `error` — sama seperti pelajaran API, hanya saja tampilan diatur dengan kondisi: `if (loading) return <p>Memuat…</p>`.',
      'Rahasia tidak boleh ada di frontend React. Variabel `VITE_…` di file `.env` IKUT masuk ke hasil build dan bisa dibaca siapa pun — hanya untuk nilai publik (mis. URL API, publishable key Supabase).',
      'Untuk GitHub Pages di subfolder, atur `base: "./"` (atau `/nama-repo/`) di vite.config.js, lalu `npm run build` → folder `dist`. Workflow GitHub Actions dari halaman Deploy bisa dipakai.',
    ],
    example: {
      language: 'js',
      caption: 'Mengambil data saat komponen tampil, dengan loading & error.',
      code: `import { useEffect, useState } from 'react'

export default function DaftarRepo({ username }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(\`https://api.github.com/users/\${username}/repos\`)
      .then((res) => { if (!res.ok) throw new Error('Status ' + res.status); return res.json() })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <p>Memuat…</p>
  if (error) return <p role="alert">Gagal: {error}</p>
  return <ul>{data.map((r) => <li key={r.id}>{r.name}</li>)}</ul>
}`,
    },
    steps: ['Tambahkan komponen DaftarRepo ke proyek kartu-react dengan username GitHub-mu.', 'Matikan internet lalu muat ulang: apakah pesan error tampil?', 'Jalankan npm run build lalu npm run preview untuk mencoba hasil build.'],
    challenge: 'Terbitkan proyek React-mu ke GitHub Pages atau Netlify, lalu simpan URL-nya di proyek DevStudio sebagai bukti.',
    hints: ['Atur base di vite.config.js sebelum build untuk GitHub Pages.', 'Gunakan workflow deploy-pages.yml dari tab Repo & Deploy proyek.'],
    commonErrors: [
      { error: 'Halaman putih setelah deploy, Console: 404 untuk /assets/index-….js', fix: 'base Vite belum diatur untuk subfolder GitHub Pages. Set base: "./" lalu build ulang.' },
      { error: 'useEffect berjalan terus-menerus', fix: 'Array dependensi hilang atau berisi nilai yang selalu baru. Tambahkan [] atau dependensi yang tepat.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Variabel VITE_API_KEY di file .env…', options: [{ text: 'Aman karena .env tidak di-commit.', why: 'Nilainya tetap dimasukkan ke JavaScript hasil build dan terlihat publik.' }, { text: 'Ikut terlihat di hasil build — jangan untuk rahasia.', correct: true, why: 'Benar.' }] },
      { id: 'q2', prompt: 'useEffect(fn, []) menjalankan fn…', options: [{ text: 'Sekali setelah komponen pertama kali tampil.', correct: true, why: 'Benar (di mode development bisa terlihat dua kali karena StrictMode).' }, { text: 'Setiap detik.', why: 'Tidak.' }] },
    ],
    skills: ['react', 'api'],
    practice: { to: '/deploy', label: 'Buka Deployment Academy' },
  },
]

export const qualityLessons: Lesson[] = [
  {
    id: 'quality-1',
    title: 'Audit Aksesibilitas',
    minutes: 30,
    goal: 'Menguji website dengan keyboard, pembaca layar, dan alat audit otomatis.',
    concepts: [
      'Aksesibilitas berarti website bisa dipakai semua orang: pengguna keyboard, pembaca layar, penglihatan rendah, buta warna, koneksi lambat. Standarnya *WCAG 2.2* level AA.',
      'Alat otomatis (Lighthouse di DevTools, axe DevTools, tab Pemeriksaan DevStudio) hanya menemukan sekitar sepertiga masalah. Sisanya harus diuji manual.',
      'Uji keyboard: tekan Tab dari awal halaman. Semua link/tombol harus bisa dicapai, urutannya logis, fokusnya *terlihat*, dan tidak ada yang “terjebak”.',
      'Kontras teks minimal 4.5:1 (teks kecil) dan 3:1 (teks besar). Jangan menyampaikan informasi hanya dengan warna — tambahkan ikon atau teks.',
      'Pembaca layar: Windows punya Narrator (Ctrl+Win+Enter) dan NVDA (gratis); macOS/iPhone punya VoiceOver; Android punya TalkBack. Dengarkan: apakah gambar, tombol, dan form dijelaskan dengan benar?',
    ],
    example: {
      language: 'html',
      caption: 'Pola aksesibel yang paling sering terlewat.',
      code: `<a class="skip-link" href="#konten">Lewati ke konten utama</a>

<label for="email">Email</label>
<input id="email" type="email" autocomplete="email">

<button aria-label="Tutup menu">✕</button>

<img src="kegiatan.jpg" alt="Siswa menanam pohon di halaman sekolah">
<img src="garis-hias.svg" alt="">  <!-- dekoratif: alt kosong -->`,
    },
    steps: ['Buka proyekmu, jalankan tab Pemeriksaan, dan perbaiki semua temuan merah.', 'Jalankan Lighthouse (DevTools → Lighthouse → Accessibility) pada versi online.', 'Navigasikan seluruh halaman hanya dengan keyboard; catat masalahnya.', 'Gunakan Mentor lokal → Review kode untuk saran tambahan.'],
    challenge: 'Capai skor Lighthouse Accessibility ≥ 95 pada satu proyek online, DAN lulus uji keyboard manual. Catat hasilnya di catatan proyek.',
    hints: ['Fokus tidak terlihat? Cari outline: none di CSS.', 'Input tanpa label adalah temuan paling umum.'],
    commonErrors: [
      { error: 'Skor Lighthouse 100 tetapi menu tidak bisa dibuka dengan keyboard.', fix: 'Skor otomatis bukan jaminan. Gunakan <button> untuk aksi (bukan <div onclick>) dan uji manual.' },
      { error: 'alt="gambar" atau alt="foto1.jpg"', fix: 'Jelaskan isi/maksud gambar. Untuk gambar dekoratif, alt="".' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Kontras minimal teks normal menurut WCAG AA…', options: [{ text: '4.5:1', correct: true, why: 'Benar.' }, { text: '2:1', why: 'Terlalu rendah.' }] },
      { id: 'q2', prompt: 'Elemen yang tepat untuk tombol yang membuka menu…', options: [{ text: '<button>', correct: true, why: 'Benar — otomatis bisa difokus dan ditekan dengan Enter/Spasi.' }, { text: '<div onclick>', why: 'Tidak bisa dicapai keyboard tanpa kerja tambahan.' }] },
    ],
    skills: ['accessibility'],
    practice: { to: '/mentor', label: 'Review proyek dengan Mentor lokal' },
  },
  {
    id: 'quality-2',
    title: 'Testing: Manual dan Otomatis',
    minutes: 30,
    goal: 'Menyusun checklist pengujian dan menulis unit test pertama dengan Vitest.',
    concepts: [
      '*Testing manual* memakai checklist (seperti di setiap proyek DevStudio): diuji di ponsel, keyboard, data kosong, data salah, koneksi lambat.',
      '*Unit test* adalah kode yang memeriksa kode lain secara otomatis: “jika fungsi diskon(10000, 10) dipanggil, hasilnya harus 9000”. Dijalankan setiap kali kode berubah, sehingga bug lama tidak kembali.',
      'Mulai dari *fungsi murni*: menerima input, mengembalikan output, tanpa menyentuh DOM. Uji tiga jenis kasus: normal, nilai batas (0, kosong), dan input tidak valid.',
      'Di proyek npm/Vite: `npm install -D vitest`, buat file `*.test.js`, jalankan `npx vitest`. DevStudio sendiri memakai Vitest — lihat folder src/test di repository-nya.',
      'CI (GitHub Actions) bisa menjalankan tes di setiap push, sehingga Pull Request yang merusak sesuatu langsung ketahuan.',
    ],
    example: {
      language: 'js',
      caption: 'harga.test.js — jalankan dengan npx vitest.',
      code: `import { describe, it, expect } from 'vitest'
import { diskon } from './harga.js'

describe('diskon', () => {
  it('menghitung potongan persen', () => {
    expect(diskon(10000, 10)).toBe(9000)
  })
  it('0% tidak mengubah harga', () => {
    expect(diskon(5000, 0)).toBe(5000)
  })
  it('menolak persen di luar 0–100', () => {
    expect(() => diskon(5000, 150)).toThrow()
  })
})`,
    },
    steps: ['Buka Mentor lokal → Kerangka tes, tempel fungsimu, dan salin kerangkanya.', 'Di proyek npm, pasang Vitest dan jalankan tes. Lihat satu tes gagal, perbaiki fungsinya, jalankan lagi.', 'Tambahkan langkah npm test ke workflow CI.'],
    challenge: 'Tulis minimal 3 tes untuk satu fungsi di proyekmu (normal, batas, tidak valid). Commit dengan pesan “test: …”.',
    hints: ['Fungsi yang mudah dites: format rupiah, hitung nilai rata-rata, validasi email.', 'Pisahkan logika dari kode DOM agar bisa diimpor ke file tes.'],
    commonErrors: [
      { error: 'SyntaxError: Cannot use import statement outside a module', fix: 'Tambahkan "type": "module" di package.json atau gunakan proyek Vite.' },
      { error: 'Tes lulus padahal fungsi salah', fix: 'Pastikan ada expect(...) di setiap tes; tes tanpa expect selalu lulus.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Fungsi yang paling mudah diberi unit test…', options: [{ text: 'Fungsi murni: input → output, tanpa DOM.', correct: true, why: 'Benar.' }, { text: 'Fungsi yang mengubah banyak elemen halaman sekaligus.', why: 'Bisa dites, tetapi lebih sulit.' }] },
      { id: 'q2', prompt: 'Manfaat menjalankan tes di CI…', options: [{ text: 'Perubahan yang merusak ketahuan sebelum digabung.', correct: true, why: 'Benar.' }, { text: 'Website menjadi lebih cepat.', why: 'Tidak berhubungan.' }] },
    ],
    skills: ['testing', 'javascript'],
    practice: { to: '/mentor?tab=test', label: 'Buat kerangka tes di Mentor lokal' },
  },
  {
    id: 'quality-3',
    title: 'Keamanan Web Dasar',
    minutes: 30,
    goal: 'Mengenali dan mencegah risiko keamanan yang paling umum pada website pemula.',
    concepts: [
      '*XSS* (Cross-Site Scripting): teks dari pengguna dijalankan sebagai kode. Cegah dengan `textContent` (atau React `{ }`), jangan `innerHTML` untuk data dinamis.',
      '*Rahasia bocor*: API key, password, token di kode frontend atau commit. Semua file website bisa dibaca publik. Rahasia hanya di server; jika bocor, *rotasi* (buat ulang) kuncinya.',
      '*Dependensi*: paket npm bisa punya celah. Jalankan `npm audit`, perbarui secara berkala, dan pilih paket yang aktif dirawat.',
      '*HTTPS* wajib (GitHub Pages/Netlify/Vercel menyediakannya gratis). *Content-Security-Policy* membatasi dari mana script/gambar/koneksi boleh dimuat — DevStudio memakainya; lihat SECURITY.md di repository.',
      'Server/database: validasi semua input, aturan akses per baris (RLS), pesan error yang tidak membocorkan detail, dan batasi percobaan login.',
    ],
    example: {
      language: 'html',
      caption: 'Contoh Content-Security-Policy sederhana untuk website statis.',
      code: `<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; img-src 'self' https: data:; object-src 'none'; base-uri 'none'">`,
    },
    steps: ['Jalankan Mentor lokal → Review kode pada proyekmu; perbaiki semua temuan “keamanan”.', 'Jalankan pemeriksaan “Siap deploy?” untuk mencari rahasia & file .env.', 'Di proyek npm, jalankan npm audit dan baca hasilnya.'],
    challenge: 'Temukan dan perbaiki satu potensi XSS di kodemu (atau di tantangan Daftar Tugas), lalu jelaskan di catatan proyek mengapa perbaikannya aman.',
    hints: ['Cari innerHTML yang diisi dengan variabel.', 'Uji dengan memasukkan <img src=x onerror=alert(1)> ke form.'],
    commonErrors: [
      { error: 'Menghapus commit berisi API key lalu menganggap aman.', fix: 'Kunci tetap ada di riwayat/salinan orang lain. Rotasi kunci di layanan terkait.' },
      { error: 'npm audit fix --force merusak proyek', fix: 'Opsi --force bisa menaikkan versi besar. Baca dulu, perbarui satu per satu, lalu jalankan tes.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Cara aman menampilkan komentar pengguna…', options: [{ text: 'el.textContent = komentar', correct: true, why: 'Benar.' }, { text: 'el.innerHTML = komentar', why: 'Membuka celah XSS.' }] },
      { id: 'q2', prompt: 'API key ter-push ke GitHub publik. Langkah pertama…', options: [{ text: 'Rotasi/cabut kunci di layanannya.', correct: true, why: 'Benar — anggap sudah bocor.' }, { text: 'Hapus file lalu push lagi.', why: 'Kunci masih ada di riwayat.' }] },
    ],
    skills: ['security'],
    practice: { to: '/mentor', label: 'Review keamanan dengan Mentor lokal' },
  },
  {
    id: 'quality-4',
    title: 'Performa Website',
    minutes: 25,
    goal: 'Mengukur dan mempercepat website, terutama di ponsel dan koneksi lambat.',
    concepts: [
      'Google mengukur pengalaman dengan *Core Web Vitals*: LCP (konten utama tampil, target ≤ 2,5 detik), INP (respons saat diklik, ≤ 200 ms), dan CLS (tata letak tidak melompat, ≤ 0,1).',
      'Penyebab paling umum website lambat: gambar terlalu besar. Kompres (Squoosh), gunakan format WebP/AVIF, ukuran sesuai tampilan, dan `loading="lazy"` untuk gambar di bawah layar.',
      'Tulis `width` dan `height` pada `<img>` agar browser menyiapkan ruang — mencegah CLS.',
      'JavaScript besar memperlambat ponsel. Muat kode saat dibutuhkan (*code splitting*). DevStudio sendiri memecah halaman: editor, SQLite, dan Prettier hanya dimuat saat dipakai.',
      'Ukur sebelum dan sesudah: DevTools → Lighthouse (mode Mobile) atau PageSpeed Insights untuk versi online.',
    ],
    example: {
      language: 'html',
      caption: 'Gambar yang ramah performa.',
      code: `<!-- Gambar utama: jangan lazy, beri prioritas -->
<img src="hero-1200.webp" width="1200" height="600" alt="Gedung sekolah" fetchpriority="high">

<!-- Galeri di bawah: lazy -->
<img src="kegiatan-600.webp" width="600" height="400" alt="Lomba 17 Agustus" loading="lazy">`,
    },
    steps: ['Jalankan Lighthouse (Mobile) pada proyek online dan catat skor Performance + LCP.', 'Kompres gambar terbesar, tambahkan width/height dan loading="lazy".', 'Ukur lagi dan bandingkan.'],
    challenge: 'Turunkan total ukuran gambar proyekmu minimal 50% tanpa kualitas terlihat turun. Catat ukuran sebelum/sesudah.',
    hints: ['Pemeriksaan “Siap deploy?” menandai gambar > 1 MB.', 'Foto untuk lebar layar 1200px tidak perlu berukuran 4000px.'],
    commonErrors: [
      { error: 'Semua gambar diberi loading="lazy", termasuk hero', fix: 'Gambar di layar pertama jangan lazy — justru membuat LCP lebih lambat.' },
      { error: 'Skor Lighthouse berubah-ubah', fix: 'Normal. Jalankan beberapa kali di jendela Incognito tanpa ekstensi, dan bandingkan rata-ratanya.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Metrik yang mengukur tata letak “melompat”…', options: [{ text: 'CLS', correct: true, why: 'Benar.' }, { text: 'LCP', why: 'LCP mengukur kapan konten utama tampil.' }] },
      { id: 'q2', prompt: 'Cara paling efektif mempercepat website penuh foto…', options: [{ text: 'Kompres & ubah ukuran gambar.', correct: true, why: 'Benar.' }, { text: 'Menambah lebih banyak JavaScript.', why: 'Justru memperlambat.' }] },
    ],
    skills: ['performance'],
    practice: { to: '/deploy', label: 'Cek proyek di Deploy hub' },
  },
]

export const advancedLessons: Lesson[] = [
  {
    id: 'adv-1',
    title: 'Struktur Proyek, Lingkungan, dan Alur Kerja Tim',
    minutes: 30,
    goal: 'Menyusun proyek agar mudah dirawat dan dikerjakan bersama.',
    concepts: [
      'Pisahkan tanggung jawab: tampilan (komponen/HTML), logika (fungsi murni), data/API (satu modul untuk semua fetch), dan konfigurasi. Satu file = satu tujuan yang jelas.',
      'Tiga lingkungan umum: *development* (komputermu), *preview/staging* (uji sebelum rilis, mis. preview deploy per Pull Request), dan *production* (yang dipakai pengguna). Masing-masing punya env var sendiri.',
      'Alur kerja tim: branch per fitur → Pull Request → CI (tes + build) → code review → merge → deploy otomatis. Lindungi branch main agar tidak bisa di-push langsung.',
      'Dokumentasi minimum: README (cara menjalankan), .env.example (nama variabel tanpa nilai), dan catatan keputusan penting (mengapa memilih Supabase, dll.).',
    ],
    example: {
      language: 'text',
      caption: 'Struktur proyek Vite yang rapi.',
      code: `src/
  components/   KartuProduk.jsx, Navbar.jsx
  pages/        Beranda.jsx, Produk.jsx
  lib/          api.js (semua fetch), format.js (fungsi murni + tes)
  test/         format.test.js
.env.example    VITE_API_URL=
README.md`,
    },
    steps: ['Gambar struktur folder proyekmu sekarang. Adakah file yang mengerjakan terlalu banyak hal?', 'Pindahkan semua fetch ke satu file (api.js).', 'Aktifkan branch protection untuk main di GitHub (butuh izinmu di Settings → Branches).'],
    challenge: 'Refactor satu proyek: pisahkan logika ke fungsi murni, tambahkan .env.example dan bagian “Arsitektur” di README.',
    hints: ['Mentor lokal menandai fungsi yang terlalu panjang dan kode bersarang terlalu dalam.', 'Refactor kecil-kecil dan commit setiap langkah.'],
    commonErrors: [
      { error: 'Refactor besar sekaligus lalu semuanya rusak.', fix: 'Ubah sedikit, uji, commit. Ulangi.' },
      { error: 'Nilai production dipakai saat development (data asli ikut terubah).', fix: 'Gunakan proyek/database terpisah untuk development dan production.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'File yang berisi NAMA variabel lingkungan tanpa nilai rahasia…', options: [{ text: '.env.example', correct: true, why: 'Benar — boleh di-commit.' }, { text: '.env', why: '.env berisi nilai dan tidak di-commit.' }] },
      { id: 'q2', prompt: 'Tujuan preview deployment per Pull Request…', options: [{ text: 'Menguji perubahan sebelum masuk production.', correct: true, why: 'Benar.' }, { text: 'Mengganti production secara langsung.', why: 'Preview terpisah dari production.' }] },
    ],
    skills: ['github', 'testing'],
    practice: { to: '/mentor', label: 'Review struktur kode dengan Mentor lokal' },
  },
  {
    id: 'adv-2',
    title: 'Portofolio dan Pekerjaan Freelance',
    minutes: 30,
    goal: 'Menyajikan proyek sebagai portofolio dan memulai pekerjaan freelance secara profesional.',
    concepts: [
      'Portofolio yang meyakinkan berisi 3–5 proyek *nyata* yang online, masing-masing dengan studi kasus singkat: masalah, solusi, peranmu, teknologi, dan hasil. Jangan mencantumkan klien atau angka yang tidak benar.',
      'Sebelum mengerjakan proyek klien, sepakati *ruang lingkup* tertulis: halaman & fitur, jumlah revisi, siapa menyediakan konten/foto, tenggat, harga, dan cara pembayaran (mis. uang muka).',
      'Biaya berkelanjutan harus jelas sejak awal: domain (tahunan), hosting/database (gratis dengan batas atau bulanan), dan jasa perawatan. Akun domain & hosting sebaiknya atas nama klien.',
      'Hak cipta & lisensi: gunakan aset berlisensi, dan untuk identitas resmi (sekolah, instansi) gunakan aset asli dari pemiliknya dengan izin.',
      'Serah terima: repository, akses akun (via undangan, bukan berbagi password), README, dan panduan singkat untuk mengubah konten.',
    ],
    example: {
      language: 'md',
      caption: 'Kerangka studi kasus untuk README/portofolio.',
      code: `## Website Profil Sekolah (proyek latihan)
**Masalah:** informasi kegiatan sekolah tersebar di grup chat.
**Solusi:** website 3 halaman dengan berita kegiatan, responsif & aksesibel.
**Peranku:** desain, HTML/CSS/JS, deploy ke GitHub Pages.
**Hasil:** Lighthouse Accessibility 98, tampil baik di ponsel.
**Tautan:** website · repository`,
    },
    steps: ['Pilih 3 proyek DevStudio terbaikmu yang sudah online.', 'Tulis studi kasus singkat untuk masing-masing (Mentor lokal → README membantu kerangkanya).', 'Perbarui proyek Portfolio Developer dengan tautan ke studi kasus.'],
    challenge: 'Susun dokumen ruang lingkup (1 halaman) untuk proyek website fiktif UMKM: fitur, revisi, tenggat, biaya domain/hosting, dan serah terima. Tandai jelas sebagai contoh.',
    hints: ['Tulis apa yang TIDAK termasuk (mis. pembuatan konten, foto produk).', 'Sebut biaya berkala terpisah dari biaya pembuatan.'],
    commonErrors: [
      { error: 'Menyimpan domain klien di akun pribadi pengembang.', fix: 'Daftarkan atas nama/akun klien agar mereka tidak kehilangan akses jika kerja sama berakhir.' },
      { error: 'Revisi tanpa batas karena tidak disepakati.', fix: 'Tulis jumlah revisi dan biaya revisi tambahan di kesepakatan.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Isi portofolio yang baik…', options: [{ text: 'Proyek nyata yang online dengan penjelasan peran dan hasil yang jujur.', correct: true, why: 'Benar.' }, { text: 'Daftar klien terkenal walau belum pernah bekerja sama.', why: 'Tidak jujur dan merusak reputasi.' }] },
      { id: 'q2', prompt: 'Memberi klien akses ke hosting sebaiknya…', options: [{ text: 'Melalui undangan anggota tim/akun klien sendiri.', correct: true, why: 'Benar.' }, { text: 'Mengirim password akun pribadimu.', why: 'Tidak aman.' }] },
    ],
    skills: ['deployment', 'github'],
    practice: { to: '/projects/library/dev-portfolio', label: 'Buka proyek Portfolio Developer' },
  },
  {
    id: 'adv-3',
    title: 'Belajar Mandiri, Debugging, dan Alat AI',
    minutes: 25,
    goal: 'Membangun kebiasaan belajar dan memecahkan masalah tanpa selalu bergantung pada tutorial.',
    concepts: [
      '*Debugging sistematis*: baca pesan error lengkap → temukan file & baris → buat dugaan → uji dengan console.log/breakpoint → ubah SATU hal → uji lagi. Catat apa yang sudah dicoba.',
      '*Membaca dokumentasi*: MDN untuk HTML/CSS/JS, dokumentasi resmi untuk library (React, Vite, Supabase). Mulai dari contoh kode, lalu baca bagian parameter & peringatan.',
      '*Alat AI* (Claude Code, dll.) mempercepat pekerjaan jika kamu paham kodenya: minta penjelasan dan petunjuk, baca setiap diff, jalankan tes, dan jangan menempel rahasia. Kode yang tidak kamu pahami adalah utang.',
      'Saat bertanya (forum, guru, AI): sertakan tujuan, kode minimal, pesan error lengkap, dan apa yang sudah dicoba.',
      'Langkah berikutnya setelah DevStudio: TypeScript, satu framework secara mendalam (React/Next.js atau lainnya), database lebih lanjut, dan berkontribusi ke proyek open source.',
    ],
    example: {
      language: 'text',
      caption: 'Templat pertanyaan yang baik.',
      code: `Tujuan: menampilkan daftar produk dari /api/produk.
Yang terjadi: daftar kosong, Console: "TypeError: data.map is not a function" (app.js:14).
Kode minimal: (tempel 10–20 baris terkait)
Sudah dicoba: console.log(data) → isinya { error: "Login dulu" }.
Pertanyaan: bagaimana menangani respons error sebelum memanggil map?`,
    },
    steps: ['Ambil satu bug lama dari catatanmu dan tulis ulang langkah debugging-nya dengan templat di atas.', 'Gunakan Mentor lokal → Jelaskan error untuk pesan error terakhirmu.', 'Pilih satu topik lanjutan dan buat rencana belajar 4 minggu.'],
    challenge: 'Tulis “jurnal debugging” untuk satu masalah nyata di proyekmu: gejala, dugaan, percobaan, penyebab, dan perbaikan. Simpan di catatan proyek.',
    hints: ['Gejala ≠ penyebab: “data.map is not a function” sering berarti data bukan array.', 'Ubah satu hal setiap kali agar tahu perubahan mana yang berpengaruh.'],
    commonErrors: [
      { error: 'Menyalin solusi dari internet/AI tanpa memahami, lalu bug baru muncul.', fix: 'Minta penjelasan baris demi baris, dan tulis ulang dengan kata-katamu sendiri.' },
      { error: 'Mengubah banyak hal sekaligus saat debugging.', fix: 'Satu perubahan, satu uji. Gunakan Git/checkpoint agar mudah kembali.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Langkah pertama debugging yang baik…', options: [{ text: 'Membaca pesan error lengkap beserta file & baris.', correct: true, why: 'Benar.' }, { text: 'Menulis ulang seluruh kode.', why: 'Membuang informasi berharga.' }] },
      { id: 'q2', prompt: 'Memakai alat AI secara bertanggung jawab berarti…', options: [{ text: 'Membaca & memahami setiap perubahan, menjalankan tes, tidak menempel rahasia.', correct: true, why: 'Benar.' }, { text: 'Menerima semua saran tanpa membaca.', why: 'Berisiko dan menghambat belajar.' }] },
    ],
    skills: ['javascript'],
    practice: { to: '/mentor?tab=error', label: 'Coba Jelaskan error di Mentor lokal' },
  },
]
