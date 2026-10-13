import type { Challenge } from './challenges'
import { baseCss, page } from './challengeKit'

/** Tantangan Coding Lab yang memakai Mock API (Phase 7). Preview-nya melayani fetch('/api/...'). */

const bukuConfig = JSON.stringify(
  {
    resources: {
      buku: {
        access: 'read-public',
        fields: { judul: 'string!', penulis: 'string!' },
        seed: [
          { judul: 'Belajar HTML dari Nol', penulis: 'Penulis A' },
          { judul: 'CSS untuk Pemula', penulis: 'Penulis B' },
          { judul: 'JavaScript Asyik', penulis: 'Penulis C' },
          { judul: '<i>Catatan</i> Kecil', penulis: 'Penulis D' },
        ],
      },
    },
  },
  null,
  2,
)

const listCss = baseCss + `
#status { color: #64748b; }
#daftar li { padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
`

export const apiFetchList: Challenge = {
  id: 'api-fetch-list',
  kind: 'practice',
  title: 'Daftar dari API',
  summary: 'Ambil data buku dari Mock API dengan fetch + async/await, lalu tangani loading dan error.',
  difficulty: 'Menengah',
  minutes: 20,
  skills: ['api', 'javascript', 'dom'],
  lesson: 'api-2',
  api: bukuConfig,
  brief: [
    'Preview tantangan ini terhubung ke *Mock API* DevStudio: `fetch(\'/api/buku\')` mengembalikan daftar buku dalam JSON. Lihat isi data & setiap request di tab *API*.',
    'Salah satu judul sengaja berisi tag HTML. Tampilkan sebagai teks biasa (pakai `textContent`), jangan sampai menjadi huruf miring.',
  ],
  instructions: [
    'Di `muatBuku`, ambil data dengan `const res = await fetch(\'/api/buku\')`.',
    'Jika `!res.ok`, lempar error atau tampilkan pesan gagal di `#status`.',
    'Ubah respons menjadi array dengan `await res.json()`.',
    'Untuk setiap buku, buat `<li>` berisi `judul — penulis` dan masukkan ke `#daftar`.',
    'Setelah berhasil, kosongkan teks `#status`. Saat gagal, tampilkan pesan yang ramah.',
  ],
  starter: {
    html: page('Daftar Buku', `  <h1>Daftar Buku</h1>
  <p id="status"></p>
  <ul id="daftar"></ul>`),
    css: listCss,
    js: `const daftar = document.querySelector('#daftar')
const status = document.querySelector('#status')

async function muatBuku() {
  status.textContent = 'Memuat…'
  // TODO 1: ambil data dari '/api/buku' dengan fetch (jangan lupa await)
  // TODO 2: jika !res.ok, tampilkan pesan gagal di #status
  // TODO 3: ubah respons menjadi data dengan await res.json()
  // TODO 4: untuk setiap buku, buat <li> berisi "judul — penulis" (pakai textContent)
}

muatBuku()
`,
  },
  solution: {
    html: '',
    css: '',
    js: `const daftar = document.querySelector('#daftar')
const status = document.querySelector('#status')

async function muatBuku() {
  status.textContent = 'Memuat…'
  try {
    const res = await fetch('/api/buku')
    if (!res.ok) throw new Error('Server menjawab ' + res.status)
    const data = await res.json()
    daftar.replaceChildren()
    for (const buku of data) {
      const li = document.createElement('li')
      li.textContent = buku.judul + ' — ' + buku.penulis
      daftar.append(li)
    }
    status.textContent = data.length ? '' : 'Belum ada buku.'
  } catch (err) {
    status.textContent = 'Gagal memuat data. Coba lagi nanti.'
    console.error(err)
  }
}

muatBuku()
`,
  },
  hints: [
    'Kerangka: try { const res = await fetch(...); ... } catch (err) { status.textContent = "Gagal ..." }',
    'if (!res.ok) throw new Error("Status " + res.status) — fetch TIDAK otomatis gagal untuk status 500.',
    'Buat elemen: const li = document.createElement("li"); li.textContent = buku.judul + " — " + buku.penulis; daftar.append(li)',
  ],
  checks: [
    { id: 'items', label: 'Empat buku tampil sebagai <li>', expected: '4 <li> di #daftar', test: async (h) => { await h.wait(700); const li = h.$$('#daftar li'); return { pass: li.length === 4, actual: `${li.length} <li>` } } },
    { id: 'format', label: 'Isi berformat “judul — penulis”', expected: 'mis. “CSS untuk Pemula — Penulis B”', test: (h) => { const t = h.$$('#daftar li').map((x) => h.text(x)); return { pass: t.includes('CSS untuk Pemula — Penulis B'), actual: t.length ? `“${t[1] ?? t[0]}”` : 'daftar kosong' } } },
    { id: 'safe', label: 'Judul berisi HTML ditampilkan sebagai teks', expected: 'tidak ada <i> di dalam daftar', test: (h) => { const li = h.$$('#daftar li'); const bad = li.some((x) => x.querySelector('i')); const t = li.map((x) => h.text(x)).find((x) => (x ?? '').includes('Catatan')); return { pass: li.length > 0 && !bad && !!t && t.includes('<i>'), actual: bad ? 'tag <i> dijalankan sebagai HTML (pakai textContent)' : t ? `“${t}”` : 'buku itu belum tampil' } } },
    { id: 'status', label: 'Teks “Memuat…” hilang setelah data tampil', expected: '#status kosong', test: (h) => { const t = h.text(h.$('#status')) ?? ''; return { pass: t === '', actual: t ? `“${t}”` : 'kosong' } } },
    {
      id: 'error',
      label: 'Saat server error (500), halaman menampilkan pesan gagal',
      expected: '#status berisi pesan selain “Memuat…”',
      test: async (h) => {
        const w = window as unknown as { muatBuku?: () => Promise<void>; fetch: typeof fetch }
        if (typeof w.muatBuku !== 'function') return { pass: false, actual: 'fungsi muatBuku tidak ditemukan' }
        const orig = w.fetch
        w.fetch = () => Promise.resolve(new Response('{"error":"rusak"}', { status: 500 }))
        try {
          await w.muatBuku()
        } catch (e) {
          w.fetch = orig
          return { pass: false, actual: 'muatBuku melempar error yang tidak ditangkap: ' + (e instanceof Error ? e.message : String(e)) }
        }
        w.fetch = orig
        await h.wait(20)
        const t = h.text(h.$('#status')) ?? ''
        return { pass: t.length > 0 && !/^memuat/i.test(t), actual: t ? `#status: “${t}”` : '#status kosong — pengguna tidak tahu ada masalah' }
      },
    },
  ],
  solutionNotes: [
    'try/catch menangkap kegagalan jaringan DAN error yang dilempar sendiri saat !res.ok.',
    'textContent menampilkan judul apa adanya, sehingga tag HTML dari server tidak dijalankan (mencegah XSS).',
    'replaceChildren() mengosongkan daftar sebelum diisi ulang, jadi memuat ulang tidak menggandakan item.',
  ],
}

const pesanConfig = JSON.stringify(
  {
    resources: {
      pesan: {
        access: 'public',
        fields: { nama: 'string!', isi: 'string!' },
        seed: [{ nama: 'Admin', isi: 'Selamat datang di buku tamu!' }],
      },
    },
  },
  null,
  2,
)

export const apiFormPost: Challenge = {
  id: 'api-form-post',
  kind: 'practice',
  title: 'Form kirim ke API',
  summary: 'Kirim isi form dengan POST + JSON, tampilkan pesan validasi dari server, lalu perbarui daftar.',
  difficulty: 'Menengah',
  minutes: 25,
  skills: ['api', 'backend', 'dom'],
  lesson: 'backend-2',
  api: pesanConfig,
  brief: [
    'Buku tamu ini sudah bisa *membaca* pesan dari `/api/pesan`. Tugasmu: *mengirim* pesan baru dengan metode POST.',
    'Server memvalidasi data: nama dan isi wajib diisi. Jika ditolak (status 400), server mengirim `{ "error": "…" }` — tampilkan pesan itu di `#error`.',
  ],
  instructions: [
    'Di handler submit, kirim `fetch(\'/api/pesan\', { method: \'POST\', headers: { \'Content-Type\': \'application/json\' }, body: JSON.stringify({ nama, isi }) })`.',
    'Jika `!res.ok`, ambil `(await res.json()).error` dan tampilkan di `#error`, lalu hentikan (return).',
    'Jika berhasil, kosongkan kedua input dan panggil `muatPesan()` agar pesan baru tampil.',
  ],
  starter: {
    html: page('Buku Tamu', `  <h1>Buku Tamu</h1>
  <form id="form-pesan">
    <label>Nama <input id="nama" autocomplete="name"></label>
    <label>Pesan <input id="isi"></label>
    <button>Kirim</button>
  </form>
  <p id="error" role="alert"></p>
  <ul id="daftar"></ul>`),
    css: listCss + `
form { display: grid; gap: 8px; max-width: 360px; }
input { display: block; width: 100%; padding: 6px; }
#error { color: #be123c; }
`,
    js: `const form = document.querySelector('#form-pesan')
const namaEl = document.querySelector('#nama')
const isiEl = document.querySelector('#isi')
const errorEl = document.querySelector('#error')
const daftar = document.querySelector('#daftar')

async function muatPesan() {
  const res = await fetch('/api/pesan')
  const data = await res.json()
  daftar.replaceChildren(...data.map((p) => {
    const li = document.createElement('li')
    li.textContent = p.nama + ': ' + p.isi
    return li
  }))
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.textContent = ''
  // TODO 1: kirim POST ke '/api/pesan' dengan body JSON { nama, isi } dan header Content-Type
  // TODO 2: jika !res.ok, tampilkan (await res.json()).error di errorEl, lalu return
  // TODO 3: jika berhasil, kosongkan input dan panggil muatPesan()
})

muatPesan()
`,
  },
  solution: {
    html: '',
    css: '',
    js: `const form = document.querySelector('#form-pesan')
const namaEl = document.querySelector('#nama')
const isiEl = document.querySelector('#isi')
const errorEl = document.querySelector('#error')
const daftar = document.querySelector('#daftar')

async function muatPesan() {
  const res = await fetch('/api/pesan')
  const data = await res.json()
  daftar.replaceChildren(...data.map((p) => {
    const li = document.createElement('li')
    li.textContent = p.nama + ': ' + p.isi
    return li
  }))
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.textContent = ''
  try {
    const res = await fetch('/api/pesan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: namaEl.value, isi: isiEl.value }),
    })
    if (!res.ok) {
      const data = await res.json()
      errorEl.textContent = data.error
      return
    }
    namaEl.value = ''
    isiEl.value = ''
    await muatPesan()
  } catch (err) {
    errorEl.textContent = 'Tidak bisa terhubung ke server. Coba lagi.'
  }
})

muatPesan()
`,
  },
  hints: [
    'Ambil nilai input dengan namaEl.value dan isiEl.value.',
    'Bentuk body: JSON.stringify({ nama: namaEl.value, isi: isiEl.value })',
    'Pesan error ada di body respons: const data = await res.json(); errorEl.textContent = data.error',
  ],
  checks: [
    { id: 'initial', label: 'Pesan awal tampil', expected: '1 <li>', test: async (h) => { await h.wait(700); const n = h.$$('#daftar li').length; return { pass: n === 1, actual: `${n} <li>` } } },
    { id: 'post', label: 'Mengirim “Ani: Halo semua” menambah pesan', expected: '2 <li>, terakhir “Ani: Halo semua”', test: async (h) => { h.type(h.$('#nama'), 'Ani'); h.type(h.$('#isi'), 'Halo semua'); h.submit(h.$('#form-pesan')); await h.wait(900); const li = h.$$('#daftar li'); const last = li[li.length - 1]; return { pass: li.length === 2 && h.text(last ?? null) === 'Ani: Halo semua', actual: `${li.length} <li>${last ? `, terakhir “${h.text(last)}”` : ''}` } } },
    { id: 'clear', label: 'Input dikosongkan setelah berhasil', expected: 'kedua input kosong', test: (h) => { const a = (h.$('#nama') as HTMLInputElement | null)?.value; const b = (h.$('#isi') as HTMLInputElement | null)?.value; return { pass: a === '' && b === '', actual: `nama=${JSON.stringify(a)}, isi=${JSON.stringify(b)}` } } },
    { id: 'error', label: 'Pesan validasi server tampil di #error', expected: '#error berisi “wajib”, daftar tetap 2', test: async (h) => { h.type(h.$('#nama'), 'Budi'); h.type(h.$('#isi'), '   '); h.submit(h.$('#form-pesan')); await h.wait(900); const t = h.text(h.$('#error')) ?? ''; const n = h.$$('#daftar li').length; return { pass: /wajib/i.test(t) && n === 2, actual: `#error: “${t}”, ${n} <li>` } } },
    { id: 'noerr', label: 'Tidak ada error JavaScript', expected: '0 error', test: (h) => { const e = h.errors(); return { pass: e.length === 0, actual: e.length ? e[0] : '0 error' } } },
  ],
  solutionNotes: [
    'Header Content-Type memberi tahu server bahwa body berisi JSON.',
    'Status 400 tidak membuat fetch gagal — kode memeriksa res.ok lalu membaca pesan error dari body.',
    'Validasi “wajib diisi” dilakukan di server; walaupun form diakali, data kosong tetap ditolak.',
  ],
}
