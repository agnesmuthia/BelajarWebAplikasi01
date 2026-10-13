import type { Lesson } from './curriculum'

/** Phase 7 — API, Backend, Database & Autentikasi. Latihan memakai Mock API dan SQL Lab DevStudio. */

export const apiLessons: Lesson[] = [
  {
    id: 'api-1',
    title: 'HTTP, JSON, dan Status Code',
    minutes: 20,
    goal: 'Memahami percakapan request–response antara browser (frontend) dan server (backend).',
    concepts: [
      '*Frontend* adalah yang berjalan di browser pengunjung. *Backend* adalah program di server yang menyimpan data dan menjalankan aturan. Keduanya “berbicara” lewat *HTTP*.',
      'Setiap *request* punya *metode* dan *alamat*: `GET /api/todos` (ambil daftar), `POST /api/todos` (tambah), `PATCH /api/todos/3` (ubah sebagian), `DELETE /api/todos/3` (hapus). Pola ini disebut *REST*.',
      'Data dikirim dalam format *JSON* — teks yang mirip objek JavaScript: `{"title": "Belajar", "done": false}`. Di JavaScript: `JSON.stringify(obj)` mengubah objek → teks, `JSON.parse(teks)` sebaliknya.',
      'Server membalas dengan *status code*: 2xx berhasil (200 OK, 201 Created), 4xx kesalahan dari pihak klien (400 data tidak valid, 401 belum login, 403 tidak berhak, 404 tidak ada), 5xx masalah di server (500).',
      '*Header* membawa informasi tambahan, mis. `Content-Type: application/json` (jenis body) dan `Authorization: Bearer <token>` (siapa yang meminta).',
    ],
    example: {
      language: 'text',
      caption: 'Satu putaran request–response (seperti yang terlihat di tab API proyek DevStudio).',
      code: `REQUEST
POST /api/todos
Content-Type: application/json
Authorization: Bearer 3f9a…

{"title": "Belajar fetch", "done": false}

RESPONSE
201 Created
{"id": 4, "title": "Belajar fetch", "done": false, "owner_id": "u_1a2b", "created_at": "…"}`,
    },
    steps: [
      'Buka Full-Stack Lab → tab Mock API → Kirim request.',
      'Kirim GET /api/todos dan baca status serta body-nya.',
      'Kirim POST /api/todos tanpa login. Perhatikan status 401 dan pesan server.',
      'Klik “daftar”, kirim, lalu ulangi POST. Token terisi otomatis — sekarang statusnya 201.',
    ],
    challenge: 'Dengan pengirim request, buat kondisi yang menghasilkan masing-masing status: 200, 201, 400, 401, dan 404. Catat request apa yang memicu tiap status.',
    hints: ['400: kirim POST dengan body yang tidak memenuhi aturan (mis. title kosong).', '404: minta id yang tidak ada, mis. GET /api/todos/999.'],
    commonErrors: [
      { error: 'Mengira 404 berarti server mati.', fix: '404 artinya server hidup dan menjawab, tetapi alamat/data yang diminta tidak ada. Server mati biasanya membuat fetch gagal (TypeError) atau status 5xx.' },
      { error: 'Mengirim objek JavaScript langsung sebagai body.', fix: 'Body harus teks: body: JSON.stringify(data), ditambah header Content-Type: application/json.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Metode HTTP untuk MENAMBAH data baru biasanya…', options: [{ text: 'GET', why: 'GET hanya membaca.' }, { text: 'POST', correct: true, why: 'Benar — server membalas 201 Created.' }, { text: 'DELETE', why: 'DELETE menghapus.' }] },
      { id: 'q2', prompt: 'Pengguna sudah login, tetapi mencoba menghapus data milik orang lain. Status yang tepat…', options: [{ text: '401 Unauthorized', why: '401 berarti belum login/token tidak valid.' }, { text: '403 Forbidden (atau 404 jika keberadaannya disembunyikan)', correct: true, why: 'Benar — identitas diketahui, tetapi tidak berhak.' }, { text: '200 OK', why: 'Server tidak boleh mengizinkannya.' }] },
      { id: 'q3', prompt: 'JSON.stringify({ a: 1 }) menghasilkan…', options: [{ text: 'Teks \'{"a":1}\'', correct: true, why: 'Benar — siap dikirim sebagai body.' }, { text: 'Objek { a: 1 }', why: 'Itu kebalikannya (JSON.parse).' }] },
    ],
    skills: ['api'],
    practice: { to: '/fullstack?tab=api', label: 'Buka pengirim request Mock API' },
  },
  {
    id: 'api-2',
    title: 'fetch, async/await, dan Status Loading/Error',
    minutes: 30,
    goal: 'Mengambil dan mengirim data dari JavaScript dengan fetch, lengkap dengan loading, data kosong, dan error.',
    concepts: [
      '`fetch(url)` mengirim request dan mengembalikan *Promise* — janji bahwa hasilnya akan datang nanti. `await` menunggu janji itu selesai tanpa membekukan halaman; hanya bisa dipakai di dalam fungsi `async`.',
      'PENTING: fetch hanya *gagal* (melempar error) jika jaringan putus. Status 400/404/500 tetap dianggap “berhasil” oleh fetch — kamu wajib memeriksa `res.ok` (true untuk 200–299).',
      'Tampilan yang baik punya empat keadaan: *loading* (sedang memuat), *kosong* (berhasil tapi tidak ada data), *data*, dan *error* (dengan pesan ramah dan tombol coba lagi).',
      'Data dari server tetap harus ditampilkan dengan `textContent`, bukan `innerHTML`, agar teks berisi `<script>` tidak dijalankan (XSS).',
    ],
    example: {
      language: 'js',
      caption: 'Pola dasar: try/catch + res.ok + empat keadaan tampilan.',
      code: `async function muatTugas() {
  status.textContent = 'Memuat…'
  try {
    const res = await fetch('/api/todos')
    if (!res.ok) throw new Error('Server menjawab ' + res.status)
    const data = await res.json()
    status.textContent = data.length ? '' : 'Belum ada tugas.'
    daftar.replaceChildren(...data.map((t) => {
      const li = document.createElement('li')
      li.textContent = t.title
      return li
    }))
  } catch (err) {
    status.textContent = 'Gagal memuat. Periksa koneksi lalu coba lagi.'
    console.error(err)
  }
}`,
    },
    steps: [
      'Kerjakan tantangan Coding Lab “Daftar dari API” — preview-nya terhubung ke Mock API.',
      'Di panel API tantangan, ubah simulasi menjadi “Server error (500)” lalu Run ulang. Pastikan halamanmu menampilkan pesan error, bukan diam saja.',
      'Ubah ke “Jaringan lambat”: apakah teks loading terlihat?',
    ],
    challenge: 'Lanjutkan ke tantangan “Form kirim ke API”: kirim data dengan POST, tampilkan pesan validasi dari server, dan perbarui daftar tanpa memuat ulang halaman.',
    hints: ['Ingat urutannya: await fetch → cek res.ok → await res.json().', 'Untuk POST: fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).'],
    commonErrors: [
      { error: 'Lupa await: data berisi Promise { <pending> }.', fix: 'Tulis await di depan fetch(...) dan res.json(), di dalam fungsi async.' },
      { error: 'Halaman diam saja saat server error.', fix: 'Periksa if (!res.ok) dan tampilkan pesan. fetch tidak melempar error untuk status 4xx/5xx.' },
      { error: 'SyntaxError: Unexpected token < in JSON.', fix: 'Server mengirim HTML (mis. halaman 404), bukan JSON. Periksa alamat request dan res.status.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Server membalas 500. Apa yang terjadi pada `await fetch(url)`?', options: [{ text: 'Melempar error otomatis.', why: 'Tidak — fetch hanya melempar error jika jaringan gagal.' }, { text: 'Berhasil mengembalikan Response dengan res.ok === false.', correct: true, why: 'Benar — periksa res.ok sendiri.' }] },
      { id: 'q2', prompt: '`await` hanya boleh dipakai…', options: [{ text: 'Di dalam fungsi async (atau module).', correct: true, why: 'Benar.' }, { text: 'Di mana saja.', why: 'Di script biasa, await di luar fungsi async adalah SyntaxError.' }] },
      { id: 'q3', prompt: 'Cara aman menampilkan judul dari server…', options: [{ text: 'li.innerHTML = t.title', why: 'Berbahaya jika judul berisi HTML/script.' }, { text: 'li.textContent = t.title', correct: true, why: 'Benar — ditampilkan sebagai teks biasa.' }] },
    ],
    skills: ['api', 'javascript'],
    lab: 'api-fetch-list',
  },
]

export const backendLessons: Lesson[] = [
  {
    id: 'backend-1',
    title: 'Server, Routing, dan Serverless Function',
    minutes: 25,
    goal: 'Memahami apa yang dikerjakan backend dan kapan cukup memakai serverless function.',
    concepts: [
      'Backend menerima request, menjalankan *aturan bisnis* (validasi, izin, perhitungan), membaca/menulis *database*, lalu mengirim response. Kode backend tidak terlihat oleh pengunjung — di sinilah rahasia (API key, password database) disimpan.',
      '*Routing* memetakan metode + alamat ke kode: `GET /api/produk` → fungsi daftarProduk. Di Mock API DevStudio, routing dibuat otomatis dari `api/config.json`.',
      '*Serverless function* (Netlify Functions, Vercel Functions, Supabase Edge Functions) adalah backend kecil per file: kamu menulis satu fungsi, platform yang menjalankan server-nya. Cocok untuk menyembunyikan API key, mis. memanggil layanan AI.',
      'Rahasia disimpan sebagai *environment variable* di dashboard hosting (mis. `AI_API_KEY`), dibaca di fungsi lewat `process.env.AI_API_KEY`, dan TIDAK pernah ditulis di kode frontend atau di-commit.',
      'Biaya: paket gratis serverless punya batas jumlah pemanggilan dan durasi. Layanan seperti API AI dibayar per pemakaian — tambahkan batas (rate limit) dan anggaran agar tagihan tidak melonjak.',
    ],
    example: {
      language: 'js',
      caption: 'Contoh serverless function (format Netlify/Vercel modern) yang menyembunyikan API key. Nama layanan & URL hanya contoh.',
      code: `// netlify/functions/ringkas.js  (atau api/ringkas.js di Vercel)
export default async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const { teks } = await request.json()
  if (typeof teks !== 'string' || teks.length > 2000) {
    return Response.json({ error: 'teks wajib, maks 2000 karakter' }, { status: 400 })
  }
  // Kunci hanya ada di server (environment variable), tidak pernah dikirim ke browser.
  const res = await fetch('https://api.contoh-ai.com/v1/ringkas', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.AI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ teks }),
  })
  if (!res.ok) return Response.json({ error: 'Layanan sedang bermasalah' }, { status: 502 })
  return Response.json(await res.json())
}`,
    },
    steps: [
      'Buka api/config.json di proyek full-stack (atau buat proyek “Aplikasi CRUD”) dan baca bagian resources.',
      'Tambahkan resource baru, mis. "kategori" dengan field nama "string!". Simpan, lalu kirim GET /api/kategori dari tab API.',
      'Baca contoh serverless function di atas dan tandai: bagian mana yang validasi, rahasia, dan penanganan error?',
    ],
    challenge: 'Rancang endpoint untuk fitur “Buku Tamu”: tulis tabel metode + alamat + siapa yang boleh + status sukses/gagal. Lalu wujudkan dengan resource di api/config.json.',
    hints: ['Minimal: GET /api/tamu (semua orang), POST /api/tamu (semua orang atau login?), DELETE /api/tamu/:id (admin).', 'Akses "admin-write" atau "read-public" di config mungkin cocok.'],
    commonErrors: [
      { error: 'Menaruh API key di file .js frontend “karena repo-nya privat”.', fix: 'Kode frontend selalu terkirim ke browser — siapa pun bisa melihatnya lewat DevTools. Pindahkan ke serverless function + environment variable.' },
      { error: 'Environment variable tidak terbaca setelah ditambahkan di dashboard.', fix: 'Deploy ulang — nilai env var dibaca saat build/deploy berikutnya.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Tempat yang aman untuk API key layanan AI berbayar adalah…', options: [{ text: 'Konstanta di script.js', why: 'Terlihat oleh semua pengunjung.' }, { text: 'Environment variable di serverless function/backend', correct: true, why: 'Benar.' }, { text: 'localStorage', why: 'Tetap di browser pengguna.' }] },
      { id: 'q2', prompt: 'Keuntungan utama serverless function untuk pemula…', options: [{ text: 'Tidak perlu mengelola server sendiri; cukup tulis fungsinya.', correct: true, why: 'Benar — tetap ada batas & biaya.' }, { text: 'Selalu gratis tanpa batas.', why: 'Ada batas paket gratis dan biaya pemakaian.' }] },
    ],
    skills: ['backend'],
    practice: { to: '/fullstack?tab=api', label: 'Buka Mock API di Full-Stack Lab' },
  },
  {
    id: 'backend-2',
    title: 'Validasi di Server dan Keamanan API',
    minutes: 25,
    goal: 'Memahami mengapa server tidak boleh percaya pada data dari klien, dan aturan dasar keamanan API.',
    concepts: [
      '*Jangan percaya klien.* Validasi di form (required, maxlength) hanya untuk kenyamanan. Siapa pun bisa mengirim request langsung dengan DevTools atau Postman — server harus memeriksa ulang setiap field.',
      'Server yang menentukan data sensitif: pemilik baris (`owner_id`), peran (`role`), harga. Jika diambil dari body request, pengguna bisa memalsukannya.',
      '*Autentikasi* = siapa kamu (login → token). *Otorisasi* = apa yang boleh kamu lakukan (pemilik, admin). 401 untuk yang pertama gagal, 403 untuk yang kedua.',
      'Daftar periksa API: validasi input, batasi ukuran, pesan error yang tidak membocorkan detail internal, *rate limit* untuk login, HTTPS, CORS hanya untuk domain sendiri, dan log tanpa password/token.',
    ],
    example: {
      language: 'json',
      caption: 'api/config.json — aturan kolom (string!/number/boolean) divalidasi di server Mock API.',
      code: `{
  "resources": {
    "produk": {
      "access": "admin-write",
      "fields": { "nama": "string!", "harga": "number!", "tersedia": "boolean" },
      "seed": [{ "nama": "Contoh Produk", "harga": 15000, "tersedia": true }]
    }
  },
  "admins": ["emailkamu@contoh.id"]
}`,
    },
    steps: [
      'Di tab Kirim request, coba POST /api/todos dengan body {"title": 123}. Baca pesan validasinya.',
      'Coba kirim {"title": "x", "owner_id": "orang_lain"} — lihat bahwa owner_id diabaikan dan diisi server.',
      'Login sebagai pengguna kedua, lalu coba PATCH data milik pengguna pertama. Status apa yang muncul dan mengapa?',
    ],
    challenge: 'Kerjakan tantangan Coding Lab “Form kirim ke API”: tampilkan pesan error dari server (400) kepada pengguna dengan sopan.',
    hints: ['Body error dari Mock API berbentuk { "error": "pesan" }.', 'Baca res.json() juga ketika !res.ok untuk mendapatkan pesannya.'],
    commonErrors: [
      { error: 'Form sudah required, jadi server tidak perlu validasi.', fix: 'Request bisa dikirim tanpa form. Validasi di server wajib; validasi di form adalah bonus kenyamanan.' },
      { error: 'Pesan login: “Email tidak terdaftar”.', fix: 'Gunakan pesan umum “Email atau password salah” agar penyerang tidak bisa mengetahui email mana yang terdaftar.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Siapa yang seharusnya mengisi owner_id saat membuat data?', options: [{ text: 'Server, dari token login.', correct: true, why: 'Benar — klien bisa berbohong.' }, { text: 'Frontend, dari localStorage.', why: 'Bisa dipalsukan.' }] },
      { id: 'q2', prompt: 'Validasi di form HTML…', options: [{ text: 'Cukup untuk keamanan.', why: 'Mudah dilewati.' }, { text: 'Membantu pengguna, tetapi server tetap wajib memvalidasi.', correct: true, why: 'Benar.' }] },
    ],
    skills: ['backend', 'api'],
    lab: 'api-form-post',
  },
]

export const databaseLessons: Lesson[] = [
  {
    id: 'db-1',
    title: 'Database Relasional & SELECT',
    minutes: 30,
    goal: 'Membaca data dari tabel dengan SELECT, WHERE, ORDER BY, dan GROUP BY.',
    concepts: [
      'Database relasional menyimpan data dalam *tabel* (seperti sheet). Setiap *baris* adalah satu data, setiap *kolom* punya tipe. *Primary key* (`id`) adalah nomor unik setiap baris.',
      '*SQL* adalah bahasa untuk berbicara dengan database. Pola membaca: `SELECT kolom FROM tabel WHERE syarat ORDER BY kolom;` — urutan klausa itu wajib.',
      'Teks memakai kutip tunggal (`\'Takalar\'`), angka tanpa kutip. `AND`/`OR` menggabungkan syarat. `NULL` berarti “kosong/tidak diketahui” — periksa dengan `IS NULL`, bukan `= NULL`.',
      '*Agregat* merangkum banyak baris: `COUNT(*)`, `AVG()`, `SUM()`, `MIN()`, `MAX()`. `GROUP BY` membuat satu baris hasil per kelompok.',
      'SQL Lab memakai *SQLite* asli di browser. Supabase memakai *PostgreSQL* — dasar SQL-nya sama; ada sedikit perbedaan fitur lanjutan.',
    ],
    example: {
      language: 'sql',
      caption: 'Tiga query dasar pada data contoh SQL Lab (fiktif).',
      code: `SELECT nama, kota FROM siswa ORDER BY nama;

SELECT nama FROM siswa
WHERE kota = 'Takalar' AND tahun_masuk = 2025;

SELECT kota, COUNT(*) AS jumlah
FROM siswa
GROUP BY kota;`,
    },
    steps: ['Buka SQL Lab dan baca struktur tabel di panel kanan.', 'Kerjakan tantangan 1–4 (SELECT, ORDER BY, WHERE, GROUP BY).', 'Di mode bebas, coba query sendiri: siswa yang kotanya bukan Takalar.'],
    challenge: 'Selesaikan tantangan SQL 1–4 tanpa membuka solusi.',
    hints: ['Mulai dari SELECT * FROM siswa; lalu persempit kolom dan barisnya sedikit demi sedikit.', 'Jika error “no such column: Takalar”, kamu lupa tanda kutip tunggal.'],
    commonErrors: [
      { error: 'no such column: Takalar', fix: "Teks wajib dalam kutip tunggal: WHERE kota = 'Takalar'." },
      { error: 'Menulis WHERE setelah ORDER BY.', fix: 'Urutan: SELECT … FROM … WHERE … GROUP BY … ORDER BY …' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Query untuk mengambil siswa yang kotanya kosong…', options: [{ text: 'WHERE kota = NULL', why: 'Perbandingan dengan NULL selalu tidak benar.' }, { text: 'WHERE kota IS NULL', correct: true, why: 'Benar.' }] },
      { id: 'q2', prompt: 'COUNT(*) bersama GROUP BY kota menghasilkan…', options: [{ text: 'Satu baris per kota beserta jumlahnya.', correct: true, why: 'Benar.' }, { text: 'Jumlah semua siswa saja.', why: 'Itu tanpa GROUP BY.' }] },
    ],
    skills: ['database'],
    practice: { to: '/fullstack?tab=sql', label: 'Kerjakan di SQL Lab' },
  },
  {
    id: 'db-2',
    title: 'INSERT, UPDATE, DELETE, JOIN, dan Relasi',
    minutes: 35,
    goal: 'Mengubah data dengan aman dan menggabungkan tabel yang saling berelasi.',
    concepts: [
      '*CRUD* dalam SQL: `INSERT INTO` (create), `SELECT` (read), `UPDATE … SET … WHERE` (update), `DELETE FROM … WHERE` (delete).',
      'UPDATE/DELETE tanpa WHERE mengenai SEMUA baris. Kebiasaan aman: jalankan `SELECT * … WHERE syarat` dulu, periksa hasilnya, baru ganti menjadi UPDATE/DELETE.',
      '*Foreign key* menghubungkan tabel: `nilai.siswa_id` merujuk `siswa.id`. Database menolak nilai yang merujuk siswa yang tidak ada. `ON DELETE CASCADE` ikut menghapus nilai saat siswa dihapus.',
      '`JOIN` menggabungkan baris dari dua tabel berdasarkan kolom yang cocok: `FROM siswa JOIN kelas ON kelas.id = siswa.kelas_id`.',
      '*Constraint* menjaga kualitas data: `NOT NULL` (wajib), `UNIQUE` (tidak kembar), `CHECK (skor BETWEEN 0 AND 100)`.',
    ],
    example: {
      language: 'sql',
      caption: 'Mengubah data dengan aman, lalu menggabungkan tabel.',
      code: `-- 1. Lihat dulu baris yang akan diubah
SELECT * FROM siswa WHERE id = 4;
-- 2. Baru ubah
UPDATE siswa SET kota = 'Makassar' WHERE id = 4;

SELECT siswa.nama AS siswa, kelas.nama AS kelas
FROM siswa
JOIN kelas ON kelas.id = siswa.kelas_id
ORDER BY siswa.nama;`,
    },
    steps: ['Kerjakan tantangan SQL 5–10.', 'Di mode bebas, coba hapus kelas yang masih dipakai siswa. Baca error foreign key-nya.', 'Coba INSERT nilai dengan skor 150 dan baca error CHECK-nya.'],
    challenge: 'Selesaikan tantangan SQL 5–10, lalu tulis di catatan: kapan kamu memakai JOIN, dan mengapa UPDATE tanpa WHERE berbahaya.',
    hints: ['INSERT: urutan nilai di VALUES = urutan kolom.', 'JOIN: tulis nama tabel di depan kolom yang namanya sama (siswa.nama, kelas.nama).'],
    commonErrors: [
      { error: 'ambiguous column name: nama', fix: 'Kedua tabel punya kolom nama. Tulis siswa.nama atau kelas.nama.' },
      { error: 'FOREIGN KEY constraint failed', fix: 'Id yang dirujuk tidak ada, atau baris masih dipakai tabel lain.' },
    ],
    quiz: [
      { id: 'q1', prompt: '`DELETE FROM nilai;` (tanpa WHERE) akan…', options: [{ text: 'Menghapus SEMUA baris tabel nilai.', correct: true, why: 'Benar — selalu periksa WHERE.' }, { text: 'Menolak berjalan.', why: 'SQL menjalankannya tanpa bertanya.' }] },
      { id: 'q2', prompt: 'Kolom yang menghubungkan nilai ke siswa disebut…', options: [{ text: 'Foreign key', correct: true, why: 'Benar.' }, { text: 'Index', why: 'Index mempercepat pencarian, bukan relasi.' }] },
    ],
    skills: ['database'],
    practice: { to: '/fullstack?tab=sql', label: 'Lanjutkan di SQL Lab' },
  },
  {
    id: 'db-3',
    title: 'Autentikasi: Password, Token, dan Sesi',
    minutes: 25,
    goal: 'Memahami cara login yang aman: hash password, token sesi, dan tempat menyimpannya.',
    concepts: [
      'Server TIDAK menyimpan password asli. Ia menyimpan *hash* — hasil fungsi satu arah yang lambat (bcrypt, Argon2, PBKDF2) — ditambah *salt* acak agar dua password sama menghasilkan hash berbeda. Saat login, password di-hash ulang lalu dibandingkan.',
      'Setelah login, server memberi *token*. Klien mengirim token di setiap request: `Authorization: Bearer <token>`. Token bisa berupa id acak yang dicatat server (sesi) atau *JWT* yang ditandatangani server (dipakai Supabase).',
      'JWT bukan enkripsi — isinya bisa dibaca siapa pun (base64). Keamanannya dari tanda tangan, jadi jangan menaruh data rahasia di dalamnya.',
      'Penyimpanan token di browser selalu ada risiko: jika situs terkena XSS, token bisa dicuri. Itulah mengapa menampilkan data dengan textContent dan tidak memuat script sembarangan sangat penting.',
      'Untuk aplikasi nyata, *jangan membuat sistem login sendiri*. Pakai layanan terpercaya (Supabase Auth, Firebase Auth, Auth.js) yang sudah menangani hash, verifikasi email, reset password, dan rate limit.',
    ],
    example: {
      language: 'js',
      caption: 'Alur login di frontend memakai Mock API DevStudio (proyek “Aplikasi login dan profil”).',
      code: `const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const data = await res.json()
if (!res.ok) return tampilkanError(data.error)
token = data.token   // disimpan di variabel (hilang saat halaman ditutup)

const me = await fetch('/api/auth/me', {
  headers: { Authorization: 'Bearer ' + token },
})`,
    },
    steps: ['Buat proyek “Aplikasi login dan profil pengguna” (terbuka setelah pelajaran ini lulus).', 'Daftar akun latihan di preview, lalu buka tab API → Data. Perhatikan bahwa yang tersimpan hanya hash.', 'Logout, lalu coba GET /api/auth/me dengan token lama — server menolak (401).'],
    challenge: 'Jelaskan dengan kata-katamu sendiri di catatan proyek: apa beda autentikasi dan otorisasi, dan mengapa password harus di-hash.',
    hints: ['Autentikasi = membuktikan siapa kamu. Otorisasi = memeriksa izinmu.', 'Hash tidak bisa dibalik; jika database bocor, password asli tidak langsung terbaca.'],
    commonErrors: [
      { error: 'Menyimpan password di localStorage agar “login otomatis”.', fix: 'Jangan pernah menyimpan password. Simpan token sesi yang bisa kedaluwarsa dan dicabut.' },
      { error: 'Mengira JWT terenkripsi.', fix: 'Isi JWT bisa dibaca siapa pun. Jangan menaruh rahasia di dalamnya.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Yang disimpan server untuk memeriksa password adalah…', options: [{ text: 'Password asli', why: 'Berbahaya jika database bocor.' }, { text: 'Hash password + salt', correct: true, why: 'Benar.' }] },
      { id: 'q2', prompt: 'Token dikirim ke server biasanya lewat…', options: [{ text: 'Header Authorization: Bearer <token>', correct: true, why: 'Benar.' }, { text: 'Judul halaman', why: 'Tidak.' }] },
    ],
    skills: ['auth'],
    practice: { to: '/fullstack?tab=api', label: 'Coba register & login di Mock API' },
  },
  {
    id: 'db-4',
    title: 'Supabase, Row Level Security, dan Backup',
    minutes: 35,
    goal: 'Menghubungkan aplikasi ke database online dengan aman memakai Supabase dan RLS.',
    concepts: [
      '*Supabase* menyediakan PostgreSQL, Auth, Storage, dan Data API (REST otomatis dari tabel). Frontend bisa langsung membaca/menulis tabel — karena itu aturan akses WAJIB ditulis di database dengan *Row Level Security (RLS)*.',
      'Dua jenis kunci: *publishable key* (`sb_publishable_…`, dulu “anon key”) boleh di frontend karena dibatasi RLS. *Secret key* (`sb_secret_…`, dulu “service_role”) melewati RLS — hanya untuk server, jangan pernah di frontend atau repository.',
      'RLS bekerja per baris: `alter table … enable row level security;` lalu buat *policy*, mis. `using ((select auth.uid()) = user_id)` agar pengguna hanya melihat barisnya sendiri. Tanpa policy, tidak ada baris yang bisa diakses.',
      'Sejak 2026, tabel baru tidak otomatis bisa diakses Data API. Tambahkan `grant select, insert, … on table … to authenticated;` — beri izin ke peran yang memang butuh, dan biarkan RLS menyaring barisnya.',
      'Paket gratis punya batas (ukuran database, proyek di-pause jika lama tidak aktif) — cek halaman harga resmi. *Backup*: paket gratis tidak menjamin backup otomatis yang bisa kamu unduh, jadi ekspor data secara berkala dan simpan perubahan skema sebagai file SQL (*migration*) di repository.',
    ],
    example: {
      language: 'sql',
      caption: 'Tabel catatan pribadi dengan RLS di Supabase (PostgreSQL).',
      code: `create table public.catatan (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  isi text not null check (char_length(isi) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.catatan enable row level security;

create policy "baca milik sendiri" on public.catatan
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "tambah milik sendiri" on public.catatan
  for insert to authenticated with check ((select auth.uid()) = user_id);

grant select, insert on table public.catatan to authenticated;`,
    },
    steps: [
      'Baca panduan Sinkronisasi Cloud di Full-Stack Lab. Langkah membuat proyek Supabase butuh login akunmu — lakukan sendiri.',
      'Jalankan SQL penyiapan di SQL Editor Supabase, lalu hubungkan DevStudio dengan Project URL + publishable key.',
      'Buat dua akun pengguna. Login sebagai akun pertama, buat cadangan; login sebagai akun kedua dan pastikan cadangan akun pertama TIDAK terlihat. Itulah RLS bekerja.',
    ],
    challenge: 'Tuliskan policy RLS untuk tabel “komentar”: semua orang (termasuk tamu) boleh membaca, pengguna login boleh menambah komentar atas namanya sendiri, dan hanya pemilik yang boleh menghapus.',
    hints: ['Membaca untuk semua: for select to anon, authenticated using (true).', 'Menambah: for insert to authenticated with check ((select auth.uid()) = user_id).'],
    commonErrors: [
      { error: 'Query mengembalikan [] padahal data ada di Table Editor.', fix: 'RLS aktif tetapi belum ada policy SELECT yang cocok (Table Editor memakai akses admin, jadi tetap melihat data).' },
      { error: 'Error “permission denied for table …” atau tabel tidak ditemukan (PGRST205).', fix: 'Tambahkan GRANT untuk peran authenticated (dan anon bila perlu), lalu coba lagi.' },
      { error: 'Menaruh secret/service_role key di frontend agar “tidak ada error RLS”.', fix: 'Itu membuka seluruh database untuk semua orang. Perbaiki policy, jangan matikan pengaman. Rotasi kunci yang bocor.' },
    ],
    quiz: [
      { id: 'q1', prompt: 'Kunci Supabase yang boleh ada di kode frontend…', options: [{ text: 'Publishable key (atau anon key lama)', correct: true, why: 'Benar — aksesnya dibatasi RLS.' }, { text: 'Secret key / service_role', why: 'Melewati RLS — hanya untuk server.' }] },
      { id: 'q2', prompt: 'RLS aktif tanpa policy apa pun. Hasil SELECT dari frontend…', options: [{ text: 'Semua baris', why: 'Tidak — RLS menolak secara bawaan.' }, { text: 'Kosong / ditolak', correct: true, why: 'Benar — buat policy yang tepat.' }] },
      { id: 'q3', prompt: 'Cara menjaga riwayat perubahan struktur database…', options: [{ text: 'Simpan file migration SQL di repository Git.', correct: true, why: 'Benar — bisa diulang di proyek baru.' }, { text: 'Mengingat-ingat perubahan di dashboard.', why: 'Mudah hilang dan tidak bisa diulang.' }] },
    ],
    skills: ['database', 'auth'],
    practice: { to: '/fullstack?tab=cloud', label: 'Buka panduan Supabase & Sinkronisasi Cloud' },
  },
]
