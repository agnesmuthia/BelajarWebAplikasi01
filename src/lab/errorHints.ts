/**
 * Mengubah pesan error JavaScript (bahasa Inggris dari browser) menjadi petunjuk
 * spesifik untuk pemula. Berdasarkan pesan error AKTUAL, bukan teori umum.
 */
export interface ErrorHint {
  title: string
  hint: string
}

const RULES: { re: RegExp; make: (m: RegExpMatchArray) => ErrorHint }[] = [
  {
    re: /Cannot read propert(?:y|ies) of (null|undefined)(?: \(reading '([^']+)'\))?/i,
    make: (m) => ({
      title: `Nilai ${m[1]} dipakai seolah-olah objek`,
      hint: m[1] === 'null'
        ? `Biasanya querySelector/getElementById tidak menemukan elemen, jadi hasilnya null${m[2] ? ` lalu kamu mengakses .${m[2]}` : ''}. Periksa ejaan selector (# untuk id, . untuk class) dan pastikan elemen itu ada di index.html.`
        : `Variabel atau properti belum punya nilai${m[2] ? ` saat mengakses .${m[2]}` : ''}. Periksa ejaan nama dan apakah nilainya sudah diisi sebelum baris ini.`,
    }),
  },
  {
    re: /Cannot set propert(?:y|ies) of (null|undefined)(?: \(setting '([^']+)'\))?/i,
    make: (m) => ({
      title: `Mengisi properti pada ${m[1]}`,
      hint: `Elemen yang ingin diubah${m[2] ? ` (.${m[2]})` : ''} tidak ditemukan. Cek selector di querySelector/getElementById dan id/class di HTML.`,
    }),
  },
  {
    re: /^(?:Uncaught )?ReferenceError: (\S+) is not defined/i,
    make: (m) => ({
      title: `“${m[1]}” belum dibuat`,
      hint: `JavaScript tidak mengenal nama ${m[1]}. Periksa ejaan dan huruf besar/kecil (JavaScript membedakan nilai dan Nilai), atau buat dulu dengan let/const/function sebelum dipakai.`,
    }),
  },
  {
    re: /(\S+) is not a function/i,
    make: (m) => ({
      title: `${m[1]} bukan fungsi`,
      hint: `Kamu memanggil ${m[1]}(...) tetapi isinya bukan fungsi. Periksa ejaan nama method (mis. addEventListener, querySelector, toUpperCase) dan huruf besar/kecilnya.`,
    }),
  },
  {
    re: /Assignment to constant variable/i,
    make: () => ({ title: 'Mengubah nilai const', hint: 'Variabel yang dibuat dengan const tidak bisa diberi nilai baru. Gunakan let jika nilainya memang akan berubah.' }),
  },
  {
    re: /Unexpected end of input/i,
    make: () => ({ title: 'Kode berakhir terlalu cepat', hint: 'Ada kurung kurawal }, kurung ), atau kurung siku ] yang belum ditutup. Gunakan tombol Format — indentasi yang aneh menunjukkan lokasinya.' }),
  },
  {
    re: /Unexpected token '?([^'\s]*)'?|Unexpected identifier|missing \) after/i,
    make: (m) => ({
      title: 'Kesalahan penulisan (syntax error)',
      hint: `JavaScript bingung membaca kode${m[1] ? ` di sekitar “${m[1]}”` : ''}. Periksa tanda kutip, koma, titik koma, dan pasangan kurung pada baris ini dan baris sebelumnya.`,
    }),
  },
  {
    re: /Invalid or unexpected token/i,
    make: () => ({ title: 'Karakter tidak valid', hint: 'Sering terjadi karena tanda kutip tidak ditutup atau tanda kutip “miring” hasil salin dari dokumen. Ketik ulang tanda kutipnya.' }),
  },
  {
    re: /has already been declared/i,
    make: () => ({ title: 'Nama dipakai dua kali', hint: 'Variabel dengan nama yang sama sudah dibuat dengan let/const. Ganti nama, atau hapus let/const pada baris kedua jika ingin mengubah nilainya.' }),
  },
  {
    re: /Loop berjalan lebih dari 1 detik/i,
    make: () => ({ title: 'Infinite loop dihentikan', hint: 'Kondisi loop tidak pernah menjadi false. Pastikan variabel penghitung berubah di setiap putaran (mis. i++) dan kondisinya bisa berhenti.' }),
  },
  {
    re: /Maximum call stack size exceeded/i,
    make: () => ({ title: 'Fungsi memanggil dirinya tanpa henti', hint: 'Ada rekursi tanpa kondisi berhenti, atau dua fungsi saling memanggil. Periksa fungsi yang memanggil dirinya sendiri.' }),
  },
  {
    re: /is not iterable/i,
    make: () => ({ title: 'Bukan daftar', hint: 'for...of atau spread (...) hanya bisa dipakai pada array, string, NodeList, dsb. Periksa apakah nilainya benar-benar array.' }),
  },
]

export function explainError(message: string): ErrorHint | null {
  for (const r of RULES) {
    const m = message.match(r.re)
    if (m) return r.make(m)
  }
  return null
}
