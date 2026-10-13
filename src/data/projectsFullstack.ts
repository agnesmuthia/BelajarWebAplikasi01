import type { ProjectTemplate, RubricItem } from './projects'

/**
 * Proyek full-stack (Phase 7). Berjalan di preview DevStudio dengan Mock API (api/config.json).
 * Setelah di-deploy ke hosting statis, /api tidak ada — README menjelaskan cara pindah ke Supabase.
 */

const fsTesting = [
  { id: 't-states', title: 'Ubah simulasi di tab API menjadi “Server error” dan “Offline”: halaman menampilkan pesan yang jelas, tidak diam/blank.' },
  { id: 't-slow', title: 'Simulasi “Jaringan lambat”: ada indikator memuat, tombol tidak bisa diklik dua kali.' },
  { id: 't-validation', title: 'Kirim data kosong/salah: pesan validasi dari server tampil di dekat form.' },
  { id: 't-xss', title: 'Masukkan teks <b>tes</b>: ditampilkan sebagai teks biasa, bukan huruf tebal.' },
  { id: 't-keyboard', title: 'Semua form bisa diisi dan dikirim hanya dengan keyboard; setiap input punya <label>.' },
  { id: 't-console', title: 'Tidak ada error merah di Console selama dipakai.' },
]

const fsRubric: RubricItem[] = [
  { criterion: 'Fungsi CRUD / Auth', points: 30, description: 'Semua aksi bekerja dan memakai metode HTTP yang tepat.' },
  { criterion: 'Penanganan keadaan', points: 20, description: 'Loading, kosong, error, dan validasi ditampilkan dengan jelas.' },
  { criterion: 'Keamanan dasar', points: 20, description: 'textContent untuk data, tidak ada rahasia di frontend, aturan akses tepat di server/config.' },
  { criterion: 'Aksesibilitas & tampilan', points: 15, description: 'Label, fokus terlihat, responsif.' },
  { criterion: 'Dokumentasi & Git', points: 15, description: 'README menjelaskan endpoint, cara menjalankan, dan rencana pindah ke database online.' },
]

const head = (title: string) => `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="css/style.css">
</head>`

const baseStyle = `*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.5; color: #1e293b; background: #f8fafc; }
.container { width: min(760px, 100% - 32px); margin-inline: auto; padding-block: 24px; }
h1 { margin-top: 0; }
form { display: flex; flex-wrap: wrap; gap: 8px; align-items: end; margin-bottom: 16px; }
label { display: grid; gap: 4px; font-size: 14px; }
input, select { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font: inherit; }
button { padding: 8px 14px; border: 0; border-radius: 8px; background: #4f46e5; color: white; font: inherit; cursor: pointer; }
button:disabled { opacity: .6; cursor: wait; }
button.sekunder { background: #e2e8f0; color: #1e293b; }
button.bahaya { background: #e11d48; }
:focus-visible { outline: 3px solid #22d3ee; outline-offset: 2px; }
.status { color: #64748b; min-height: 1.5em; }
.error { color: #be123c; min-height: 1.5em; }
.kartu { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
ul.daftar { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
ul.daftar li { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
ul.daftar li .isi { flex: 1; min-width: 160px; }
`

/* ------------------------------ 1. CRUD ------------------------------ */

const crudConfig = `{
  "resources": {
    "barang": {
      "access": "public",
      "fields": {
        "nama": "string!",
        "jumlah": "number!",
        "kategori": "string"
      },
      "seed": [
        { "nama": "Contoh: Proyektor", "jumlah": 2, "kategori": "Elektronik" },
        { "nama": "Contoh: Kursi lipat", "jumlah": 30, "kategori": "Perabot" }
      ]
    }
  }
}
`

const crudJs = `// Satu tempat untuk alamat API. Saat pindah ke backend sungguhan, cukup ubah baris ini.
const API = '/api/barang'

const form = document.querySelector('#form-barang')
const daftar = document.querySelector('#daftar')
const statusEl = document.querySelector('#status')
const errorEl = document.querySelector('#error')
const cari = document.querySelector('#cari')

/** Panggil API dan kembalikan JSON. Melempar Error berisi pesan dari server jika gagal. */
async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.error) || 'Server menjawab ' + res.status)
  return data
}

function tampilkan(items) {
  daftar.replaceChildren()
  statusEl.textContent = items.length ? items.length + ' barang' : 'Belum ada barang.'
  for (const b of items) {
    const li = document.createElement('li')
    const isi = document.createElement('span')
    isi.className = 'isi'
    isi.textContent = b.nama + ' — ' + b.jumlah + ' unit' + (b.kategori ? ' (' + b.kategori + ')' : '')
    li.append(isi)

    // TODO (tugas "Ubah jumlah"): tambahkan tombol "Ubah" yang meminta jumlah baru
    // lalu mengirim PATCH ke API + '/' + b.id dengan body { jumlah: angka }.

    // TODO (tugas "Hapus"): tambahkan tombol "Hapus" (class "bahaya") yang meminta konfirmasi,
    // lalu mengirim DELETE ke API + '/' + b.id dan memuat ulang daftar.

    daftar.append(li)
  }
}

async function muat() {
  statusEl.textContent = 'Memuat…'
  errorEl.textContent = ''
  try {
    const q = cari.value.trim()
    tampilkan(await api(q ? API + '?q=' + encodeURIComponent(q) : API))
  } catch (err) {
    statusEl.textContent = ''
    errorEl.textContent = 'Gagal memuat: ' + err.message
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const tombol = form.querySelector('button')
  tombol.disabled = true
  errorEl.textContent = ''
  try {
    await api(API, {
      method: 'POST',
      body: JSON.stringify({
        nama: form.nama.value,
        jumlah: Number(form.jumlah.value),
        kategori: form.kategori.value,
      }),
    })
    form.reset()
    await muat()
  } catch (err) {
    errorEl.textContent = err.message
  } finally {
    tombol.disabled = false
  }
})

cari.addEventListener('input', () => muat())

muat()
`

export const crudTemplate: ProjectTemplate = {
  id: 'fs-crud',
  category: 'Full-Stack',
  title: 'Aplikasi CRUD Inventaris',
  tagline: 'Create, Read, Update, Delete dengan fetch dan Mock API.',
  description:
    'Aplikasi inventaris sederhana: menambah, menampilkan, mencari, mengubah, dan menghapus barang. Frontend berbicara dengan backend lewat REST API (Mock API DevStudio), lengkap dengan loading, error, dan validasi.',
  difficulty: 'Menengah',
  estimatedHours: 8,
  technologies: ['HTML', 'CSS', 'JavaScript', 'REST API'],
  recommendedLessons: ['api-1', 'api-2', 'backend-2'],
  requires: ['api-2'],
  objectives: ['Memetakan aksi pengguna ke metode HTTP.', 'Menangani loading, kosong, dan error.', 'Memisahkan alamat API agar mudah dipindah ke backend sungguhan.'],
  requirements: [
    'Daftar barang dimuat dari GET /api/barang dan bisa dicari (?q=).',
    'Form menambah barang (POST) dan menampilkan pesan validasi dari server.',
    'Setiap barang bisa diubah jumlahnya (PATCH) dan dihapus (DELETE) dengan konfirmasi.',
    'README menjelaskan endpoint dan rencana pindah ke database online.',
  ],
  tasks: [
    { id: 'read', title: 'Pahami alur baca data', detail: 'Baca js/app.js: fungsi api(), muat(), dan tampilkan(). Buka tab API di editor dan lihat request GET saat preview dimuat.', skills: ['api'] },
    { id: 'update', title: 'Ubah jumlah (PATCH)', detail: 'Tambahkan tombol "Ubah" yang memakai prompt/inputan, lalu PATCH /api/barang/:id dengan { jumlah }.', skills: ['api', 'dom'] },
    { id: 'delete', title: 'Hapus barang (DELETE)', detail: 'Tambahkan tombol "Hapus" dengan confirm(), lalu DELETE /api/barang/:id dan muat ulang.', skills: ['api', 'dom'] },
    { id: 'states', title: 'Uji keadaan error & lambat', detail: 'Pakai simulasi di tab API. Pastikan tombol dinonaktifkan saat mengirim dan pesan error jelas.', skills: ['api'] },
    { id: 'field', title: 'Tambah kolom baru', detail: 'Tambahkan field "lokasi": "string" di api/config.json, lalu input dan tampilannya di frontend.', skills: ['backend'] },
    { id: 'readme', title: 'Dokumentasikan endpoint', detail: 'Tulis tabel metode + alamat + fungsi di README, dan rencana pindah ke Supabase.', skills: ['backend'] },
  ],
  testing: fsTesting,
  rubric: fsRubric,
  notice: 'Mock API hanya berjalan di preview DevStudio dan datanya tersimpan di browser ini. Setelah dipublikasikan ke GitHub Pages/Netlify, alamat /api tidak ada — lihat README untuk pindah ke backend sungguhan.',
  accent: 'violet',
  files: [
    {
      path: 'index.html',
      content: `${head('Inventaris')}
<body>
  <main class="container">
    <h1>Inventaris</h1>
    <form id="form-barang" class="kartu">
      <label>Nama barang <input name="nama" autocomplete="off"></label>
      <label>Jumlah <input name="jumlah" type="number" min="0" value="1"></label>
      <label>Kategori <input name="kategori" autocomplete="off"></label>
      <button>Tambah</button>
    </form>
    <label>Cari <input id="cari" type="search" placeholder="nama atau kategori"></label>
    <p id="status" class="status" aria-live="polite"></p>
    <p id="error" class="error" role="alert"></p>
    <ul id="daftar" class="daftar"></ul>
  </main>
  <script src="js/app.js"></script>
</body>
</html>
`,
    },
    { path: 'css/style.css', content: baseStyle },
    { path: 'js/app.js', content: crudJs },
    { path: 'api/config.json', content: crudConfig },
    {
      path: 'README.md',
      content: `# Aplikasi CRUD Inventaris

## Menjalankan
Buka proyek di DevStudio → editor → Preview. Tab **API** menampilkan setiap request, isi data, dan simulasi jaringan.

## Endpoint (Mock API DevStudio, dari \`api/config.json\`)
| Metode | Alamat | Fungsi |
|---|---|---|
| GET | /api/barang?q=kata | Daftar & cari barang |
| POST | /api/barang | Tambah barang |
| PATCH | /api/barang/:id | Ubah sebagian kolom |
| DELETE | /api/barang/:id | Hapus barang |

Kolom: \`nama\` (wajib), \`jumlah\` (angka, wajib), \`kategori\`.

## Penting: setelah deploy
Mock API hanya ada di DevStudio. Di GitHub Pages/Netlify, \`fetch('/api/barang')\` akan 404.
Rencana pindah:
1. Buat tabel \`barang\` di Supabase (kolom sama + \`user_id\`), aktifkan Row Level Security dan buat policy.
2. Ganti fungsi \`api()\` agar memanggil Data API Supabase (\`https://<proyek>.supabase.co/rest/v1/barang\`) dengan publishable key — **bukan** secret key.
3. Uji ulang semua item di checklist testing.

## Catatan pembelajaran
- …
`,
    },
  ],
}

/* ---------------------------- 2. Login & Profil ---------------------------- */

const authConfig = `{
  "resources": {
    "catatan": {
      "access": "owner",
      "fields": { "isi": "string!" }
    }
  },
  "admins": []
}
`

const authJs = `// Token sesi disimpan di variabel: hilang saat halaman dimuat ulang (aman & sederhana).
// Preview DevStudio terisolasi, jadi localStorage/sessionStorage tidak tersedia di sini.
let token = null

const authBox = document.querySelector('#auth')
const appBox = document.querySelector('#app')
const authForm = document.querySelector('#form-auth')
const authError = document.querySelector('#auth-error')
const sapaan = document.querySelector('#sapaan')
const catatanForm = document.querySelector('#form-catatan')
const daftar = document.querySelector('#daftar')
const appError = document.querySelector('#app-error')

async function api(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch(url, { ...options, headers })
  const data = await res.json().catch(() => null)
  if (res.status === 401 && token) keluarLokal()
  if (!res.ok) throw new Error((data && data.error) || 'Server menjawab ' + res.status)
  return data
}

function keluarLokal() {
  token = null
  appBox.hidden = true
  authBox.hidden = false
}

async function masuk(mode) {
  authError.textContent = ''
  try {
    const data = await api('/api/auth/' + mode, {
      method: 'POST',
      body: JSON.stringify({ email: authForm.email.value, password: authForm.password.value, name: authForm.nama.value }),
    })
    token = data.token
    authForm.reset()
    await bukaAplikasi()
  } catch (err) {
    authError.textContent = err.message
  }
}

async function bukaAplikasi() {
  const me = await api('/api/auth/me')
  sapaan.textContent = 'Halo, ' + me.name + '!'
  authBox.hidden = true
  appBox.hidden = false
  await muatCatatan()
}

async function muatCatatan() {
  appError.textContent = ''
  try {
    const items = await api('/api/catatan?sort=-id')
    daftar.replaceChildren()
    for (const c of items) {
      const li = document.createElement('li')
      const isi = document.createElement('span')
      isi.className = 'isi'
      isi.textContent = c.isi
      li.append(isi)
      // TODO (tugas "Hapus catatan"): tombol Hapus → DELETE /api/catatan/:id → muatCatatan()
      daftar.append(li)
    }
    if (!items.length) daftar.innerHTML = '<li>Belum ada catatan.</li>'
  } catch (err) {
    appError.textContent = err.message
  }
}

authForm.addEventListener('submit', (e) => {
  e.preventDefault()
  masuk(e.submitter && e.submitter.value === 'register' ? 'register' : 'login')
})

catatanForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  try {
    await api('/api/catatan', { method: 'POST', body: JSON.stringify({ isi: catatanForm.isi.value }) })
    catatanForm.reset()
    await muatCatatan()
  } catch (err) {
    appError.textContent = err.message
  }
})

document.querySelector('#keluar').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
  keluarLokal()
})

// TODO (tugas "Edit profil"): form ubah nama → PATCH /api/auth/me dengan { name } → perbarui sapaan.
`

export const authTemplate: ProjectTemplate = {
  id: 'fs-auth',
  category: 'Full-Stack',
  title: 'Aplikasi Login & Catatan Pribadi',
  tagline: 'Daftar, login, profil, dan data yang hanya bisa dilihat pemiliknya.',
  description:
    'Aplikasi dengan autentikasi: pengguna mendaftar, login, mengubah nama profil, dan menulis catatan pribadi. Server (Mock API) menyimpan hash password, memberi token, dan menerapkan aturan “hanya pemilik” — konsep yang sama dengan Row Level Security di Supabase.',
  difficulty: 'Mahir',
  estimatedHours: 10,
  technologies: ['HTML', 'CSS', 'JavaScript', 'REST API', 'Auth'],
  recommendedLessons: ['api-2', 'backend-2', 'db-3', 'db-4'],
  requires: ['db-3'],
  objectives: ['Memahami alur register → login → token → request terautentikasi.', 'Membedakan 401 dan 403/404.', 'Menerapkan data per pengguna (owner-only).'],
  requirements: [
    'Pengguna bisa daftar, login, dan logout; pesan error dari server tampil.',
    'Setelah login, nama pengguna tampil dan bisa diubah (PATCH /api/auth/me).',
    'Catatan hanya terlihat oleh pemiliknya; bisa ditambah dan dihapus.',
    'Tidak ada password atau token yang disimpan di kode/README.',
  ],
  tasks: [
    { id: 'flow', title: 'Pahami alur login', detail: 'Daftar dua akun di preview. Buka tab API → Data: lihat hash password, sesi, dan owner_id catatan.', skills: ['auth'] },
    { id: 'profile', title: 'Edit profil', detail: 'Buat form ubah nama → PATCH /api/auth/me dengan { name } → perbarui sapaan.', skills: ['auth', 'api'] },
    { id: 'delete', title: 'Hapus catatan', detail: 'Tombol Hapus per catatan → DELETE /api/catatan/:id → muat ulang.', skills: ['api', 'dom'] },
    { id: 'isolation', title: 'Uji isolasi data', detail: 'Login sebagai akun A dan B bergantian. Pastikan catatan A tidak pernah muncul di B. Coba GET /api/catatan/1 dengan token B di tab API.', skills: ['auth', 'database'] },
    { id: 'empty-safe', title: 'Perbaiki tampilan kosong', detail: 'Ganti innerHTML pada “Belum ada catatan.” dengan createElement + textContent agar konsisten aman.', skills: ['dom'] },
    { id: 'plan', title: 'Rencanakan versi Supabase', detail: 'Tulis di README: tabel catatan, policy RLS (select/insert/delete milik sendiri), dan GRANT ke authenticated.', skills: ['database', 'auth'] },
  ],
  testing: fsTesting,
  rubric: fsRubric,
  notice: 'Akun di preview adalah akun latihan yang tersimpan di browser ini saja. Jangan memakai password yang kamu gunakan di layanan lain.',
  accent: 'indigo',
  files: [
    {
      path: 'index.html',
      content: `${head('Catatan Pribadi')}
<body>
  <main class="container">
    <h1>Catatan Pribadi</h1>

    <section id="auth" class="kartu" aria-labelledby="judul-auth">
      <h2 id="judul-auth">Masuk atau daftar</h2>
      <form id="form-auth">
        <label>Email <input name="email" type="email" autocomplete="username"></label>
        <label>Password <input name="password" type="password" autocomplete="current-password"></label>
        <label>Nama (untuk daftar) <input name="nama" autocomplete="name"></label>
        <button value="login">Masuk</button>
        <button value="register" class="sekunder">Daftar</button>
      </form>
      <p id="auth-error" class="error" role="alert"></p>
    </section>

    <section id="app" hidden aria-labelledby="sapaan">
      <p><strong id="sapaan"></strong> <button id="keluar" class="sekunder">Keluar</button></p>
      <form id="form-catatan" class="kartu">
        <label>Catatan baru <input name="isi" autocomplete="off"></label>
        <button>Simpan</button>
      </form>
      <p id="app-error" class="error" role="alert"></p>
      <ul id="daftar" class="daftar"></ul>
    </section>
  </main>
  <script src="js/app.js"></script>
</body>
</html>
`,
    },
    { path: 'css/style.css', content: baseStyle + '[hidden] { display: none !important; }\n' },
    { path: 'js/app.js', content: authJs },
    { path: 'api/config.json', content: authConfig },
    {
      path: 'README.md',
      content: `# Aplikasi Login & Catatan Pribadi

## Endpoint
| Metode | Alamat | Keterangan |
|---|---|---|
| POST | /api/auth/register | { email, password (≥ 8), name } → { user, token } |
| POST | /api/auth/login | { email, password } → { user, token } |
| GET / PATCH | /api/auth/me | Data diri / ubah nama (butuh token) |
| POST | /api/auth/logout | Mencabut token |
| GET, POST | /api/catatan | Hanya catatan milik pengguna yang login |
| DELETE | /api/catatan/:id | Hanya pemilik |

Token dikirim lewat header \`Authorization: Bearer <token>\`.

## Aturan akses
\`"access": "owner"\` di api/config.json = setiap pengguna hanya melihat dan mengubah barisnya sendiri.
Di Supabase, aturan yang sama ditulis sebagai Row Level Security:

\`\`\`sql
alter table public.catatan enable row level security;
create policy "baca milik sendiri" on public.catatan for select to authenticated using ((select auth.uid()) = user_id);
create policy "tambah milik sendiri" on public.catatan for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "hapus milik sendiri" on public.catatan for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, delete on table public.catatan to authenticated;
\`\`\`

## Keamanan
- Password tidak pernah disimpan — server menyimpan hash.
- Jangan menulis password atau token di kode, README, atau commit.
- Untuk aplikasi nyata gunakan layanan auth terpercaya (mis. Supabase Auth), bukan sistem buatan sendiri.

## Catatan pembelajaran
- …
`,
    },
  ],
}

export const FULLSTACK_TEMPLATES: ProjectTemplate[] = [crudTemplate, authTemplate]
