/**
 * “Explain This Code” versi lokal: glosarium buatan tangan, BUKAN AI.
 * Mencocokkan tag HTML, atribut, properti CSS, kata kunci & API JavaScript
 * yang muncul di potongan kode, lalu menjelaskannya dalam bahasa sederhana.
 */
export interface GlossaryEntry {
  term: string
  kind: 'HTML' | 'Atribut' | 'CSS' | 'JavaScript' | 'DOM'
  text: string
}

const html = (term: string, text: string): [string, GlossaryEntry] => [`html:${term}`, { term: `<${term}>`, kind: 'HTML', text }]
const attr = (term: string, text: string): [string, GlossaryEntry] => [`attr:${term}`, { term, kind: 'Atribut', text }]
const css = (term: string, text: string): [string, GlossaryEntry] => [`css:${term}`, { term, kind: 'CSS', text }]
const js = (term: string, text: string, kind: GlossaryEntry['kind'] = 'JavaScript'): [string, GlossaryEntry] => [`js:${term}`, { term, kind, text }]

const ENTRIES = new Map<string, GlossaryEntry>([
  html('html', 'Elemen akar yang membungkus seluruh dokumen.'),
  html('head', 'Informasi tentang halaman (judul tab, charset, link CSS). Tidak tampil sebagai konten.'),
  html('body', 'Wadah semua konten yang terlihat pengunjung.'),
  html('title', 'Teks yang tampil di tab browser dan hasil pencarian.'),
  html('meta', 'Metadata halaman, mis. charset atau pengaturan viewport untuk ponsel.'),
  html('link', 'Menghubungkan file lain, paling sering file CSS: <link rel="stylesheet" href="style.css">.'),
  html('script', 'Memuat atau menulis JavaScript. Diletakkan di akhir <body> agar elemen HTML sudah ada saat kode berjalan.'),
  html('style', 'CSS yang ditulis langsung di dalam HTML.'),
  html('h1', 'Judul utama halaman. Gunakan satu per halaman.'),
  html('h2', 'Judul bagian (sub-judul dari h1).'),
  html('h3', 'Judul sub-bagian.'),
  html('p', 'Paragraf teks.'),
  html('a', 'Link. Tujuannya ditulis di atribut href.'),
  html('img', 'Gambar. Wajib punya src (lokasi file) dan alt (deskripsi untuk pembaca layar).'),
  html('ul', 'Daftar tanpa nomor (bullet). Isinya elemen <li>.'),
  html('ol', 'Daftar bernomor. Isinya elemen <li>.'),
  html('li', 'Satu butir dalam daftar <ul> atau <ol>.'),
  html('div', 'Wadah umum tanpa makna. Gunakan tag semantik jika ada yang cocok.'),
  html('span', 'Wadah umum untuk potongan teks di dalam baris.'),
  html('header', 'Bagian kepala halaman atau bagian: logo, judul, navigasi.'),
  html('nav', 'Kumpulan link navigasi utama.'),
  html('main', 'Isi utama halaman. Hanya satu per halaman.'),
  html('section', 'Bagian bertema yang biasanya punya heading sendiri.'),
  html('article', 'Konten mandiri seperti berita atau posting blog.'),
  html('footer', 'Bagian penutup: kontak, hak cipta, link tambahan.'),
  html('button', 'Tombol yang bisa diklik dan diakses keyboard. Gunakan untuk aksi, bukan untuk pindah halaman.'),
  html('form', 'Formulir untuk mengumpulkan input pengguna.'),
  html('input', 'Kolom isian. Jenisnya diatur dengan atribut type (text, email, number, …).'),
  html('label', 'Teks keterangan input. Hubungkan dengan for="id-input".'),
  html('textarea', 'Kolom isian teks beberapa baris.'),
  html('select', 'Daftar pilihan (dropdown). Isinya elemen <option>.'),
  html('strong', 'Teks yang penting (biasanya tebal).'),
  html('em', 'Teks yang ditekankan (biasanya miring).'),
  attr('href', 'Alamat tujuan link atau file yang dihubungkan.'),
  attr('src', 'Lokasi file gambar, video, atau script.'),
  attr('alt', 'Deskripsi gambar untuk pembaca layar dan saat gambar gagal dimuat.'),
  attr('class', 'Nama kelompok untuk styling/JavaScript. Satu elemen boleh punya beberapa class. Di CSS dipilih dengan titik: .nama'),
  attr('id', 'Nama unik satu elemen. Di CSS/JS dipilih dengan pagar: #nama'),
  attr('type', 'Jenis input atau tombol, mis. type="email" atau type="submit".'),
  attr('placeholder', 'Teks contoh di dalam input kosong. Bukan pengganti <label>.'),
  attr('required', 'Input wajib diisi sebelum form bisa dikirim.'),
  attr('lang', 'Bahasa konten, membantu pembaca layar dan mesin pencari.'),
  css('color', 'Warna teks.'),
  css('background', 'Latar belakang (warna, gambar, atau gradien).'),
  css('background-color', 'Warna latar belakang elemen.'),
  css('font-size', 'Ukuran huruf. rem relatif terhadap ukuran dasar halaman.'),
  css('font-family', 'Jenis huruf. Tulis beberapa sebagai cadangan, diakhiri sans-serif/serif.'),
  css('font-weight', 'Ketebalan huruf, mis. 400 (normal) atau 700 (tebal).'),
  css('margin', 'Jarak di LUAR border elemen ke elemen lain.'),
  css('padding', 'Jarak di DALAM elemen, antara isi dan border.'),
  css('border', 'Garis tepi: ketebalan, gaya, warna. Mis. 2px solid #333.'),
  css('border-radius', 'Membulatkan sudut elemen.'),
  css('width', 'Lebar elemen.'),
  css('max-width', 'Lebar maksimal; elemen boleh lebih kecil di layar sempit.'),
  css('height', 'Tinggi elemen.'),
  css('display', 'Cara elemen ditampilkan: block, inline, flex, grid, none.'),
  css('flex', 'Mengatur seberapa besar anak flex boleh tumbuh/menyusut.'),
  css('flex-direction', 'Arah susunan anak flex: row (baris) atau column (kolom).'),
  css('flex-wrap', 'Mengizinkan anak flex pindah ke baris baru jika tidak muat.'),
  css('justify-content', 'Posisi anak flex/grid pada sumbu utama (mis. center, space-between).'),
  css('align-items', 'Posisi anak flex/grid pada sumbu silang (mis. center).'),
  css('gap', 'Jarak antar-anak dalam flex atau grid.'),
  css('grid-template-columns', 'Jumlah dan ukuran kolom grid, mis. repeat(3, 1fr).'),
  css('text-align', 'Perataan teks: left, center, right.'),
  css('box-shadow', 'Bayangan di sekitar elemen.'),
  css('cursor', 'Bentuk kursor mouse saat berada di atas elemen.'),
  css('transition', 'Animasi halus saat nilai properti berubah (mis. saat hover).'),
  css('box-sizing', 'border-box membuat width sudah termasuk padding dan border.'),
  css('position', 'Cara menempatkan elemen: static, relative, absolute, fixed, sticky.'),
  css(':hover', 'Gaya saat kursor berada di atas elemen.'),
  css('@media', 'Media query: aturan yang hanya berlaku pada ukuran layar tertentu.'),
  js('const', 'Membuat variabel yang nilainya tidak akan diganti.'),
  js('let', 'Membuat variabel yang nilainya boleh diubah.'),
  js('var', 'Cara lama membuat variabel. Gunakan let atau const.'),
  js('function', 'Membuat fungsi: kumpulan perintah yang bisa dipanggil berulang.'),
  js('return', 'Mengembalikan hasil dari fungsi dan menghentikan fungsi.'),
  js('if', 'Menjalankan kode hanya jika kondisinya true.'),
  js('else', 'Dijalankan jika kondisi if bernilai false.'),
  js('for', 'Mengulang kode beberapa kali. for (let i = 0; i < 5; i++) mengulang 5 kali.'),
  js('while', 'Mengulang selama kondisinya true. Pastikan kondisinya bisa berhenti!'),
  js('true', 'Nilai boolean benar.'),
  js('false', 'Nilai boolean salah.'),
  js('null', 'Nilai “kosong” yang disengaja. querySelector mengembalikan null jika elemen tidak ditemukan.'),
  js('undefined', 'Nilai variabel yang belum diisi.'),
  js('===', 'Membandingkan nilai DAN tipe. 5 === "5" hasilnya false.'),
  js('=>', 'Arrow function: cara singkat menulis fungsi.'),
  js('console.log', 'Mencetak nilai ke Console — alat utama untuk memeriksa isi variabel.'),
  js('document', 'Objek yang mewakili seluruh halaman HTML (DOM).', 'DOM'),
  js('querySelector', 'Mencari elemen PERTAMA yang cocok dengan selector CSS. Mengembalikan null jika tidak ada.', 'DOM'),
  js('querySelectorAll', 'Mencari SEMUA elemen yang cocok, hasilnya NodeList yang bisa di-loop.', 'DOM'),
  js('getElementById', 'Mencari elemen berdasarkan id (tanpa tanda #).', 'DOM'),
  js('addEventListener', 'Menjalankan fungsi saat event terjadi, mis. "click" atau "submit".', 'DOM'),
  js('textContent', 'Teks di dalam elemen. Aman untuk menampilkan teks dari pengguna.', 'DOM'),
  js('innerHTML', 'Isi HTML elemen. Jangan masukkan teks dari pengguna ke sini (risiko XSS) — gunakan textContent.', 'DOM'),
  js('classList', 'Daftar class elemen: add, remove, toggle, contains.', 'DOM'),
  js('createElement', 'Membuat elemen HTML baru (belum tampil sampai ditambahkan).', 'DOM'),
  js('appendChild', 'Menambahkan elemen sebagai anak terakhir.', 'DOM'),
  js('append', 'Menambahkan elemen atau teks di akhir elemen.', 'DOM'),
  js('remove', 'Menghapus elemen dari halaman.', 'DOM'),
  js('preventDefault', 'Mencegah aksi bawaan browser, mis. form yang memuat ulang halaman.', 'DOM'),
  js('value', 'Isi input/textarea/select saat ini (selalu berupa teks).', 'DOM'),
  js('style', 'Mengubah CSS satu elemen dari JavaScript, mis. el.style.color = "red".', 'DOM'),
  js('setAttribute', 'Mengisi atribut elemen, mis. setAttribute("aria-expanded", "true").', 'DOM'),
  js('length', 'Jumlah item dalam array/NodeList atau jumlah karakter string.'),
  js('push', 'Menambahkan item ke akhir array.'),
  js('forEach', 'Menjalankan fungsi untuk setiap item array/NodeList.'),
  js('map', 'Membuat array baru dari hasil mengubah setiap item.'),
  js('filter', 'Membuat array baru berisi item yang lolos kondisi.'),
  js('Number', 'Mengubah teks menjadi angka. Number("5") → 5.'),
  js('parseInt', 'Mengubah teks menjadi bilangan bulat.'),
  js('toUpperCase', 'Mengubah teks menjadi huruf besar.'),
  js('trim', 'Menghapus spasi di awal dan akhir teks.'),
  js('localStorage', 'Penyimpanan kecil di browser yang tetap ada setelah reload. (Di preview Lab, datanya sementara.)'),
  js('setTimeout', 'Menjalankan fungsi sekali setelah jeda (milidetik).'),
  js('setInterval', 'Menjalankan fungsi berulang setiap jeda (milidetik).'),
  js('Math.random', 'Angka acak antara 0 dan 1.'),
  js('Math.round', 'Membulatkan angka ke bilangan bulat terdekat.'),
  js('JSON.stringify', 'Mengubah objek/array menjadi teks JSON.'),
])

export function explainCode(code: string, lang: 'html' | 'css' | 'js'): { found: GlossaryEntry[]; unknown: string[] } {
  const keys: string[] = []
  const unknown: string[] = []
  const add = (k: string, raw: string) => {
    if (ENTRIES.has(k)) keys.push(k)
    else if (raw && !unknown.includes(raw)) unknown.push(raw)
  }

  if (lang === 'html') {
    for (const m of code.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) add(`html:${m[1].toLowerCase()}`, `<${m[1].toLowerCase()}>`)
    for (const m of code.matchAll(/\s([a-zA-Z-]+)(?=\s*=|\s|>)/g)) if (ENTRIES.has(`attr:${m[1]}`)) keys.push(`attr:${m[1]}`)
    for (const m of code.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) keys.push(...explainCode(m[1], 'js').found.map((e) => `js:${e.term}`))
  } else if (lang === 'css') {
    for (const m of code.matchAll(/([a-z-]+)\s*:(?!:)/g)) {
      if (/^(hover|focus|active|root)$/.test(m[1])) continue
      add(`css:${m[1]}`, m[1])
    }
    if (/:hover/.test(code)) keys.push('css::hover')
    if (/@media/.test(code)) keys.push('css:@media')
  } else {
    if (/console\.log/.test(code)) keys.push('js:console.log')
    if (/Math\.random/.test(code)) keys.push('js:Math.random')
    if (/Math\.round/.test(code)) keys.push('js:Math.round')
    if (/JSON\.stringify/.test(code)) keys.push('js:JSON.stringify')
    if (/===/.test(code)) keys.push('js:===')
    if (/=>/.test(code)) keys.push('js:=>')
    const stripped = code.replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""').replace(/\/\/.*$/gm, '')
    for (const m of stripped.matchAll(/\b[A-Za-z_$][\w$]*\b/g)) if (ENTRIES.has(`js:${m[0]}`)) keys.push(`js:${m[0]}`)
  }

  const seen = new Set<string>()
  const found: GlossaryEntry[] = []
  for (const k of keys) {
    if (seen.has(k)) continue
    seen.add(k)
    found.push(ENTRIES.get(k)!)
  }
  return { found, unknown: unknown.slice(0, 6) }
}
