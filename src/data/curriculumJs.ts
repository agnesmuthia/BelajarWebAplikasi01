import type { Lesson } from './curriculum'

export const jsLessons: Lesson[] = [
  {
    id: 'js-1',
    title: 'Variabel, Tipe Data, dan Console',
    minutes: 20,
    goal: 'Menyimpan nilai dalam variabel, mengenali tipe data dasar, dan memeriksanya dengan console.log.',
    concepts: [
      'JavaScript membuat halaman *bereaksi*: menghitung, mengambil keputusan, dan mengubah halaman saat pengguna berinteraksi. HTML = struktur, CSS = tampilan, JavaScript = perilaku.',
      'Variabel adalah kotak berlabel untuk menyimpan nilai. Gunakan `const` jika nilainya tidak akan diganti, dan `let` jika akan berubah. Hindari `var` (cara lama).',
      'Tipe data dasar: *string* (teks, di dalam tanda kutip: `"Takalar"`), *number* (`17`, `3.5`), *boolean* (`true`/`false`), serta `null` dan `undefined` untuk “tidak ada nilai”.',
      '`console.log(nilai)` mencetak nilai ke Console. Ini alat debugging terpenting: kapan pun ragu isi sebuah variabel, cetak saja.',
      'Hati-hati: `"5" + 2` menghasilkan `"52"` (teks digabung), sedangkan `5 + 2` menghasilkan `7`. Nilai dari input form selalu berupa teks — ubah dengan `Number()`.',
    ],
    example: {
      language: 'js',
      caption: 'Variabel dan tipe data. Klik “Coba di Lab” untuk menjalankannya dan melihat Console.',
      code: `const namaSekolah = 'SMA Negeri 3';
let jumlahSiswa = 30;
const aktif = true;

console.log(namaSekolah);          // SMA Negeri 3
console.log(typeof jumlahSiswa);   // number

jumlahSiswa = jumlahSiswa + 2;     // let boleh diubah
console.log(jumlahSiswa);          // 32

console.log('5' + 2);              // "52" — teks digabung
console.log(Number('5') + 2);      // 7`,
    },
    steps: [
      'Klik “Coba di Lab” untuk membuka contoh di Coding Lab.',
      'Buka tab Console dan cocokkan output dengan komentar di kode.',
      'Coba ubah `namaSekolah` dengan nilai baru (tanpa membuat ulang). Baca pesan error yang muncul dan penjelasannya.',
      'Ganti `const` menjadi `let` pada baris itu, lalu jalankan lagi.',
    ],
    challenge: 'Buat variabel untuk nama, umur, dan status “sedang belajar” (boolean). Cetak kalimat “Nama saya …, umur … tahun.” dengan menggabungkan string memakai tanda +.',
    hints: ['Penggabungan: `"Nama saya " + nama + ", umur " + umur + " tahun."`', 'Atau gunakan template literal dengan backtick: `` `Nama saya ${nama}` ``.', 'Gunakan `typeof` untuk memeriksa tipe setiap variabel.'],
    commonErrors: [
      { error: 'TypeError: Assignment to constant variable', fix: 'Kamu mengubah variabel `const`. Gunakan `let` jika nilainya memang berubah.' },
      { error: 'ReferenceError: nama is not defined', fix: 'Variabel belum dibuat atau ejaannya berbeda. JavaScript membedakan huruf besar/kecil: `Nama` ≠ `nama`.' },
      { error: 'Hasil penjumlahan menjadi teks panjang ("102030").', fix: 'Salah satu nilai berupa string. Ubah dengan `Number(nilai)` sebelum dijumlahkan.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Kapan sebaiknya memakai let dibanding const?',
        options: [
          { text: 'Selalu gunakan let agar aman.', why: 'Justru const lebih aman karena mencegah perubahan tidak sengaja.' },
          { text: 'Jika nilai variabel akan diganti nanti.', correct: true, why: 'Benar. Default-kan const, gunakan let hanya jika nilainya berubah.' },
          { text: 'let untuk angka, const untuk teks.', why: 'Pilihan let/const tidak bergantung pada tipe data.' },
        ],
      },
      {
        id: 'q2',
        prompt: "Apa hasil console.log('3' + 4)?",
        options: [
          { text: '7', why: "Karena '3' adalah string, tanda + menggabungkan teks." },
          { text: '"34"', correct: true, why: 'Benar. String + number → teks digabung.' },
          { text: 'Error', why: 'JavaScript tidak error di sini; ia mengubah 4 menjadi teks.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Alat paling cepat untuk melihat isi variabel saat kode berjalan adalah…',
        options: [
          { text: 'console.log(variabel)', correct: true, why: 'Benar.' },
          { text: 'Menebak dari membaca kode.', why: 'Menebak sering salah. Cetak nilainya.' },
          { text: 'alert() di setiap baris.', why: 'alert bisa dipakai, tetapi menghentikan halaman dan merepotkan. console.log lebih praktis.' },
        ],
      },
    ],
    skills: ['javascript'],
  },
  {
    id: 'js-2',
    title: 'Fungsi dan Kondisi',
    minutes: 25,
    goal: 'Membuat fungsi yang menerima input dan mengembalikan hasil, serta mengambil keputusan dengan if/else.',
    concepts: [
      'Fungsi adalah resep: kumpulan langkah dengan nama yang bisa dipakai berulang. *Parameter* adalah bahan (input), `return` adalah hasil masakan (output).',
      '`return` mengembalikan nilai kepada pemanggil dan menghentikan fungsi. `console.log` hanya menampilkan — fungsi tanpa `return` menghasilkan `undefined`.',
      '`if (kondisi) { ... } else { ... }` menjalankan blok yang berbeda tergantung kondisi. Operator perbandingan: `===` (sama), `!==` (tidak sama), `>`, `<`, `>=`, `<=`.',
      'Gunakan `===`, bukan `==`. `==` mengubah tipe secara diam-diam sehingga `0 == ""` bernilai true — sumber bug yang membingungkan.',
      'Gabungkan kondisi dengan `&&` (dan) serta `||` (atau).',
    ],
    example: {
      language: 'js',
      caption: 'Fungsi dengan parameter, return, dan if/else.',
      code: `function predikat(nilai) {
  if (nilai >= 85) {
    return 'A';
  } else if (nilai >= 70) {
    return 'B';
  } else {
    return 'C';
  }
}

console.log(predikat(92)); // A
console.log(predikat(75)); // B
console.log(predikat(40)); // C

function lulus(nilai, kehadiran) {
  return nilai >= 70 && kehadiran >= 80;
}

console.log(lulus(80, 90)); // true
console.log(lulus(80, 50)); // false`,
    },
    steps: [
      'Jalankan contoh di Lab dan cocokkan output Console.',
      'Tambahkan pemanggilan `predikat(85)` dan `predikat(70)` — apakah batasnya sudah benar?',
      'Hapus kata `return` di salah satu cabang, jalankan, dan lihat bahwa hasilnya menjadi `undefined`.',
    ],
    challenge: 'Kerjakan tantangan Coding Lab “Fungsi Penjumlahan”, lalu buat fungsi `ganjilGenap(n)` yang mengembalikan teks "ganjil" atau "genap".',
    hints: ['Sisa bagi memakai operator `%`: `7 % 2` hasilnya 1.', 'Bilangan genap jika `n % 2 === 0`.', 'Kerangka: `function ganjilGenap(n) { if (...) { return "genap"; } return "ganjil"; }`'],
    commonErrors: [
      { error: 'Fungsi menghasilkan undefined.', fix: 'Pastikan ada `return` di setiap cabang. console.log di dalam fungsi tidak sama dengan return.' },
      { error: 'if selalu dijalankan walau kondisinya salah.', fix: 'Periksa apakah kamu menulis `=` (mengisi) alih-alih `===` (membandingkan).' },
      { error: 'Unexpected token / missing ) after argument list', fix: 'Periksa pasangan kurung `( )` dan kurung kurawal `{ }`. Tombol Format membantu melihat struktur.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Apa yang dihasilkan fungsi berikut jika dipanggil kali2(4)?',
        code: 'function kali2(x) {\n  console.log(x * 2);\n}',
        options: [
          { text: '8', why: 'Fungsi MENCETAK 8, tetapi tidak mengembalikannya.' },
          { text: 'undefined', correct: true, why: 'Benar. Tanpa return, hasil pemanggilan fungsi adalah undefined (walau 8 tercetak di Console).' },
          { text: 'Error', why: 'Kode valid, tidak ada error.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Operator mana yang membandingkan nilai DAN tipe?',
        options: [
          { text: '=', why: '= adalah operator pengisian (assignment).' },
          { text: '==', why: '== membandingkan setelah mengubah tipe secara otomatis.' },
          { text: '===', correct: true, why: 'Benar.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Kondisi untuk “nilai minimal 70 DAN kehadiran minimal 80” adalah…',
        options: [
          { text: 'nilai >= 70 || kehadiran >= 80', why: '|| berarti ATAU — cukup salah satu benar.' },
          { text: 'nilai >= 70 && kehadiran >= 80', correct: true, why: 'Benar.' },
          { text: 'nilai > 70 && kehadiran > 80', why: '> tidak termasuk 70 dan 80 itu sendiri.' },
        ],
      },
    ],
    skills: ['javascript'],
    lab: 'js-function-sum',
  },
  {
    id: 'js-3',
    title: 'Array dan Perulangan',
    minutes: 25,
    goal: 'Menyimpan banyak nilai dalam array dan memprosesnya dengan for dan for...of.',
    concepts: [
      'Array adalah daftar berurutan: `const kelas = ["X-1", "X-2", "X-3"]`. Indeks dimulai dari *0*, jadi item terakhir ada di `kelas.length - 1`.',
      'Loop `for (let i = 0; i < arr.length; i++)` mengulang untuk setiap indeks. Perhatikan `<`, bukan `<=` — kesalahan ini disebut *off-by-one*.',
      '`for (const item of arr)` lebih ringkas jika kamu tidak butuh indeks.',
      'Method berguna: `push` (tambah di akhir), `includes` (cek ada/tidak), `forEach`, `filter`, dan `map`.',
      'Loop yang kondisinya tidak pernah false disebut *infinite loop*. Coding Lab menghentikannya otomatis setelah ±1 detik, tetapi browser biasa akan macet.',
    ],
    example: {
      language: 'js',
      caption: 'Menjumlahkan dan menyaring array.',
      code: `const nilai = [80, 65, 90, 72];
let total = 0;

for (let i = 0; i < nilai.length; i++) {
  total += nilai[i];
}
console.log('Rata-rata:', total / nilai.length); // 76.75

for (const n of nilai) {
  if (n < 70) console.log('Perlu remedial:', n);
}

const lulus = nilai.filter((n) => n >= 70);
console.log(lulus); // [80, 90, 72]`,
    },
    steps: ['Jalankan contoh di Lab.', 'Tambahkan `console.log(i, nilai[i])` di dalam loop pertama untuk melihat setiap putaran.', 'Ganti `<` menjadi `<=` dan amati hasilnya menjadi NaN. Kembalikan seperti semula.'],
    challenge: 'Kerjakan tantangan debugging “Total Belanja yang Salah”, lalu tulis kode yang mencari nilai tertinggi dari array nilai tanpa memakai Math.max.',
    hints: ['Mulai dengan `let tertinggi = nilai[0];`', 'Di dalam loop: jika `nilai[i] > tertinggi`, ganti `tertinggi`.', 'Cetak `tertinggi` setelah loop selesai, bukan di dalamnya.'],
    commonErrors: [
      { error: 'Hasil NaN atau undefined di akhir loop.', fix: 'Kemungkinan memakai `<=` sehingga indeks melebihi batas. Gunakan `i < arr.length`.' },
      { error: 'Loop berjalan lebih dari 1 detik dan dihentikan', fix: 'Kondisi loop tidak pernah false. Pastikan penghitung (`i++`) berubah ke arah yang benar.' },
      { error: 'Total hanya berisi item terakhir.', fix: 'Gunakan `total += x`, bukan `total = x`.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'const buah = ["apel", "jeruk", "mangga"]; Apa isi buah[2]?',
        options: [
          { text: '"jeruk"', why: 'Indeks dimulai dari 0: apel=0, jeruk=1.' },
          { text: '"mangga"', correct: true, why: 'Benar.' },
          { text: 'undefined', why: 'Indeks 2 ada karena array punya 3 item.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Berapa kali loop for (let i = 0; i < 5; i++) dijalankan?',
        options: [
          { text: '4', why: 'i bernilai 0,1,2,3,4.' },
          { text: '5', correct: true, why: 'Benar: i = 0 sampai 4.' },
          { text: '6', why: 'Kondisi i < 5 berhenti saat i = 5.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Method array untuk membuat array baru berisi item yang memenuhi syarat adalah…',
        options: [
          { text: 'push', why: 'push menambah item ke array yang sama.' },
          { text: 'filter', correct: true, why: 'Benar.' },
          { text: 'length', why: 'length adalah jumlah item, bukan method.' },
        ],
      },
    ],
    skills: ['javascript'],
    lab: 'debug-loop-total',
  },
]

export const domLessons: Lesson[] = [
  {
    id: 'dom-1',
    title: 'Memilih dan Mengubah Elemen',
    minutes: 20,
    goal: 'Mengambil elemen dengan querySelector dan mengubah teks, class, serta atributnya.',
    concepts: [
      'DOM (Document Object Model) adalah “peta” halaman HTML yang bisa dibaca dan diubah oleh JavaScript. Setiap tag menjadi objek.',
      '`document.querySelector("selector")` mengambil elemen pertama yang cocok — selectornya sama seperti di CSS: `#id`, `.class`, `tag`. Jika tidak ditemukan, hasilnya `null`.',
      'Ubah teks dengan `el.textContent = "..."`. Ubah tampilan dengan menambah/menghapus class: `el.classList.add("aktif")`, `remove`, `toggle` — lebih rapi daripada mengubah `el.style` satu per satu.',
      'Letakkan `<script>` di akhir `<body>` agar semua elemen sudah ada saat kode berjalan.',
      'Gunakan `textContent`, bukan `innerHTML`, untuk menampilkan teks dari pengguna. `innerHTML` akan menjalankan HTML di dalamnya (celah keamanan XSS).',
    ],
    example: {
      language: 'html',
      caption: 'HTML + JavaScript di satu file. Klik “Coba di Lab” untuk menjalankan.',
      code: `<h1 id="judul">Judul lama</h1>
<p class="info">Paragraf</p>

<script>
  const judul = document.querySelector('#judul');
  judul.textContent = 'Judul baru dari JavaScript';

  const info = document.querySelector('.info');
  info.classList.add('penting');
  info.style.color = 'crimson';

  console.log(document.querySelector('#tidak-ada')); // null
</script>`,
    },
    steps: ['Jalankan contoh di Lab.', 'Ubah selector `#judul` menjadi `#judull` lalu baca pesan error dan penjelasannya.', 'Gunakan `console.log(judul)` untuk melihat elemen yang ditemukan.'],
    challenge: 'Kerjakan tantangan debugging “Tombol yang Tidak Bereaksi”.',
    hints: ['Mulai dari error pertama di Console — klik untuk melompat ke barisnya.', 'Bandingkan selector di JavaScript dengan id di HTML huruf per huruf.', 'Properti teks ditulis `textContent` (C besar).'],
    commonErrors: [
      { error: "Cannot read properties of null (reading 'textContent')", fix: 'querySelector tidak menemukan elemen. Periksa selector (# untuk id, . untuk class) atau pastikan script berada setelah elemen tersebut.' },
      { error: 'Teks tidak berubah dan tidak ada error.', fix: 'Kemungkinan salah ejaan properti, mis. `textcontent`. JavaScript tidak memberi error untuk properti yang salah tulis.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Apa hasil document.querySelector("#menu") jika tidak ada elemen ber-id menu?',
        options: [
          { text: 'Error langsung', why: 'querySelector tidak error; error terjadi saat kamu memakai hasilnya.' },
          { text: 'null', correct: true, why: 'Benar.' },
          { text: 'Elemen kosong baru', why: 'querySelector hanya mencari, tidak membuat elemen.' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Cara paling rapi untuk mengubah tampilan elemen dari JavaScript adalah…',
        options: [
          { text: 'Menambah/menghapus class dengan classList.', correct: true, why: 'Benar. Gaya tetap di CSS, JavaScript hanya mengganti class.' },
          { text: 'Mengubah el.style untuk setiap properti.', why: 'Bisa, tetapi mencampur gaya ke dalam JavaScript dan sulit dirawat.' },
          { text: 'Mengganti seluruh innerHTML halaman.', why: 'Lambat, menghapus event listener, dan berisiko keamanan.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Untuk menampilkan nama yang diketik pengguna, gunakan…',
        options: [
          { text: 'innerHTML', why: 'innerHTML menjalankan HTML dari pengguna — berisiko XSS.' },
          { text: 'textContent', correct: true, why: 'Benar. Teks ditampilkan apa adanya.' },
        ],
      },
    ],
    skills: ['dom'],
    lab: 'debug-js-button',
  },
  {
    id: 'dom-2',
    title: 'Event: Merespons Aksi Pengguna',
    minutes: 25,
    goal: 'Menjalankan kode saat tombol diklik atau form dikirim dengan addEventListener.',
    concepts: [
      'Event adalah kejadian: klik, ketikan, form dikirim, halaman selesai dimuat. `el.addEventListener("click", fungsi)` mendaftarkan fungsi yang dijalankan setiap kali event terjadi.',
      'Nama event TANPA awalan “on”: `"click"`, `"submit"`, `"input"`, `"keydown"`.',
      'Fungsi listener menerima objek *event*. Untuk form, panggil `event.preventDefault()` agar halaman tidak dimuat ulang.',
      'Gunakan `<button>` untuk aksi — bisa diakses keyboard (Enter/Spasi) secara otomatis. `<div>` yang diberi click tidak bisa difokus dengan Tab.',
      'Pola umum aplikasi: simpan data di variabel (state) → saat event terjadi, ubah state → tampilkan ulang ke halaman.',
    ],
    example: {
      language: 'html',
      caption: 'Event click dan submit.',
      code: `<button id="sapa">Sapa</button>
<p id="hasil"></p>

<form id="form-nama">
  <label for="nama">Nama</label>
  <input id="nama">
  <button>Kirim</button>
</form>

<script>
  document.querySelector('#sapa').addEventListener('click', function () {
    document.querySelector('#hasil').textContent = 'Halo!';
  });

  document.querySelector('#form-nama').addEventListener('submit', function (event) {
    event.preventDefault();
    const nama = document.querySelector('#nama').value.trim();
    console.log('Nama dikirim:', nama);
  });
</script>`,
    },
    steps: ['Jalankan contoh di Lab, klik tombol, lalu kirim form.', 'Hapus `event.preventDefault()` dan kirim form lagi — perhatikan apa yang terjadi.', 'Coba navigasikan contoh hanya dengan Tab, Enter, dan Spasi.'],
    challenge: 'Kerjakan tantangan “Tombol Penghitung”, lalu “Daftar Tugas Sederhana”.',
    hints: ['Simpan hitungan di variabel `let` di LUAR fungsi listener agar nilainya tidak hilang.', 'Setelah mengubah variabel, perbarui `textContent` elemen.', 'Untuk form: `event.preventDefault()` di baris pertama listener.'],
    commonErrors: [
      { error: 'Listener tidak pernah berjalan.', fix: 'Periksa nama event: `"click"`, bukan `"onclick"` atau `"Click"`.' },
      { error: 'Halaman berkedip/muat ulang saat form dikirim.', fix: 'Panggil `event.preventDefault()` di listener submit.' },
      { error: 'Angka selalu kembali ke 1.', fix: 'Variabel penghitung dibuat di DALAM fungsi, sehingga direset setiap klik. Pindahkan ke luar.' },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Penulisan mana yang benar?',
        options: [
          { text: "tombol.addEventListener('onclick', fn)", why: 'Tanpa awalan “on”.' },
          { text: "tombol.addEventListener('click', fn)", correct: true, why: 'Benar.' },
          { text: "tombol.addEventListener('click', fn())", why: 'fn() langsung MENJALANKAN fungsi dan mengirim hasilnya. Kirim fungsinya: fn (tanpa kurung).' },
        ],
      },
      {
        id: 'q2',
        prompt: 'Mengapa event.preventDefault() dipanggil di listener submit?',
        options: [
          { text: 'Agar data terkirim lebih cepat.', why: 'preventDefault tidak mempercepat pengiriman.' },
          { text: 'Agar browser tidak memuat ulang halaman sehingga JavaScript bisa memproses data.', correct: true, why: 'Benar.' },
        ],
      },
      {
        id: 'q3',
        prompt: 'Elemen yang paling tepat untuk sesuatu yang diklik untuk menjalankan aksi adalah…',
        options: [
          { text: '<div onclick="...">', why: 'div tidak bisa difokus keyboard dan tidak dikenali pembaca layar sebagai tombol.' },
          { text: '<button>', correct: true, why: 'Benar. Aksesibel secara bawaan.' },
          { text: '<span>', why: 'Sama seperti div: tidak aksesibel tanpa kerja tambahan.' },
        ],
      },
    ],
    skills: ['dom', 'accessibility'],
    lab: 'dom-counter',
  },
]
