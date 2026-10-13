import { checkDeploy } from '../deploy/deployCheck'
import { auditProject } from '../workspace/audit'

/**
 * Mentor lokal — review kode BERBASIS ATURAN (bukan AI). Setiap temuan menjelaskan
 * mengapa penting dan cara memperbaikinya. Aturan sengaja sederhana dan bisa salah:
 * hasilnya saran untuk dipertimbangkan, bukan vonis.
 */

export type Category = 'aksesibilitas' | 'keamanan' | 'kualitas' | 'performa'
export type Level = 'penting' | 'saran'

export interface Finding {
  id: string
  category: Category
  level: Level
  file: string
  line?: number
  message: string
  why: string
  fix: string
}

export interface ReviewFile {
  path: string
  text: string
  size?: number
}

interface LineRule {
  id: string
  re: RegExp
  category: Category
  level: Level
  message: string
  why: string
  fix: string
  /** Lewati baris jika cocok (mis. komentar). */
  skip?: RegExp
}

const COMMENT = /^\s*(\/\/|\*|\/\*)/

const JS_RULES: LineRule[] = [
  { id: 'innerhtml', re: /\.innerHTML\s*\+?=(?!=)(?!\s*['"`][^'"`$]*['"`]\s*;?\s*$)/, category: 'keamanan', level: 'penting', message: 'innerHTML diisi dengan nilai dinamis.', why: 'Jika nilainya berasal dari pengguna atau server, teks berisi <script>/<img onerror> bisa dijalankan (XSS).', fix: 'Gunakan textContent, atau buat elemen dengan document.createElement lalu isi textContent-nya.', skip: COMMENT },
  { id: 'eval', re: /\beval\s*\(|new\s+Function\s*\(/, category: 'keamanan', level: 'penting', message: 'eval()/new Function() menjalankan teks sebagai kode.', why: 'Teks dari luar bisa menjadi kode berbahaya, dan kode sulit di-debug.', fix: 'Gunakan JSON.parse untuk data, atau objek/fungsi biasa untuk logika.', skip: COMMENT },
  { id: 'timeout-string', re: /set(?:Timeout|Interval)\s*\(\s*['"`]/, category: 'keamanan', level: 'penting', message: 'setTimeout/setInterval dengan teks kode.', why: 'Teks dijalankan seperti eval.', fix: 'Berikan fungsi: setTimeout(() => { … }, 1000).', skip: COMMENT },
  { id: 'storage-secret', re: /(local|session)Storage\.setItem\(\s*['"`][^'"`]*(password|passwd|sandi|secret|api[_-]?key)/i, category: 'keamanan', level: 'penting', message: 'Menyimpan password/kunci rahasia di localStorage.', why: 'Semua script di halaman (termasuk yang disisipkan penyerang) bisa membacanya.', fix: 'Jangan simpan password. Simpan token sesi seperlunya, dan rahasia hanya di server.' },
  { id: 'document-write', re: /document\.write(ln)?\s*\(/, category: 'kualitas', level: 'saran', message: 'document.write() dipakai.', why: 'Bisa menghapus seluruh halaman jika dipanggil setelah halaman dimuat, dan memperlambat loading.', fix: 'Tambahkan elemen dengan createElement/append atau ubah textContent.', skip: COMMENT },
  { id: 'var', re: /(^|[;{(\s])var\s+[A-Za-z_$]/, category: 'kualitas', level: 'saran', message: 'Memakai var.', why: 'var tidak mengikuti blok { } dan mudah menimbulkan bug yang membingungkan.', fix: 'Gunakan const untuk nilai yang tidak diganti, let jika perlu diganti.', skip: COMMENT },
  { id: 'loose-eq', re: /[^=!<>]==(?!=)|!=(?!=)/, category: 'kualitas', level: 'saran', message: 'Perbandingan longgar (== atau !=).', why: '== mengubah tipe diam-diam: 0 == "" bernilai true.', fix: 'Gunakan === dan !==.', skip: COMMENT },
  { id: 'alert', re: /\balert\s*\(/, category: 'kualitas', level: 'saran', message: 'alert() dipakai untuk memberi tahu pengguna.', why: 'alert menghentikan halaman, tidak bisa diberi gaya, dan mengganggu pembaca layar.', fix: 'Tampilkan pesan di elemen halaman (mis. <p role="status">).', skip: COMMENT },
]

const CSS_RULES: LineRule[] = [
  { id: 'outline-none', re: /outline\s*:\s*(none|0)\b/, category: 'aksesibilitas', level: 'penting', message: 'outline dihapus.', why: 'Pengguna keyboard tidak bisa melihat elemen mana yang sedang fokus.', fix: 'Jangan hapus outline, atau ganti dengan gaya :focus-visible yang jelas (mis. outline: 3px solid #22d3ee).' },
  { id: 'tiny-font', re: /font-size\s*:\s*(\d+(\.\d+)?)px/, category: 'aksesibilitas', level: 'saran', message: 'Ukuran huruf memakai px.', why: 'Pengguna yang memperbesar ukuran huruf di browser tidak ikut terbantu.', fix: 'Gunakan rem (1rem = ukuran bawaan pengguna, biasanya 16px).' },
]

function lineRules(f: ReviewFile, rules: LineRule[], out: Finding[], seen: Set<string>) {
  f.text.split('\n').forEach((line, i) => {
    for (const r of rules) {
      if (r.skip?.test(line) || !r.re.test(line)) continue
      if (r.id === 'tiny-font') {
        const px = Number(/font-size\s*:\s*(\d+(?:\.\d+)?)px/.exec(line)?.[1])
        if (!(px < 14)) continue
      }
      const key = `${f.path}:${r.id}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ id: r.id, category: r.category, level: r.level, file: f.path, line: i + 1, message: r.message, why: r.why, fix: r.fix })
    }
  })
}

function jsFileRules(f: ReviewFile, out: Finding[]) {
  const t = f.text
  const logs = (t.match(/console\.log\s*\(/g) ?? []).length
  if (logs > 3) out.push({ id: 'console-log', category: 'kualitas', level: 'saran', file: f.path, message: `${logs} console.log tertinggal.`, why: 'Membuat Console penuh dan bisa membocorkan data saat online.', fix: 'Hapus log debug sebelum deploy, atau gunakan console.error hanya untuk kesalahan.' })
  if (/\bfetch\s*\(/.test(t) && !/\.ok\b|\.status\b/.test(t)) out.push({ id: 'fetch-ok', category: 'kualitas', level: 'penting', file: f.path, message: 'fetch() tanpa memeriksa res.ok.', why: 'fetch tidak gagal untuk status 404/500 — halaman bisa menampilkan data rusak atau diam saja.', fix: 'Setelah await fetch(...), tulis: if (!res.ok) throw new Error("Status " + res.status).' })
  if (/\bfetch\s*\(/.test(t) && !/\btry\s*\{|\.catch\s*\(/.test(t)) out.push({ id: 'fetch-catch', category: 'kualitas', level: 'penting', file: f.path, message: 'fetch() tanpa penanganan error.', why: 'Saat offline, fetch melempar error dan pengguna tidak mendapat pesan apa pun.', fix: 'Bungkus dengan try { … } catch (err) { tampilkan pesan ramah }.' })
  if (/addEventListener\(\s*['"]submit['"]/.test(t) && !/preventDefault\s*\(/.test(t)) out.push({ id: 'submit-default', category: 'kualitas', level: 'saran', file: f.path, message: 'Event submit tanpa preventDefault().', why: 'Browser akan memuat ulang halaman saat form dikirim.', fix: 'Panggil event.preventDefault() di awal handler submit.' })
  const deep = t.split('\n').findIndex((l) => /^( {10,}|\t{5,})\S/.test(l) && !COMMENT.test(l))
  if (deep !== -1) out.push({ id: 'nesting', category: 'kualitas', level: 'saran', file: f.path, line: deep + 1, message: 'Kode bersarang sangat dalam (≥ 5 tingkat).', why: 'Sulit dibaca dan diuji.', fix: 'Pecah menjadi fungsi kecil bernama jelas, atau gunakan "return lebih awal" (early return).' })
  const longFn = longestFunction(t)
  if (longFn && longFn.lines > 40) out.push({ id: 'long-function', category: 'kualitas', level: 'saran', file: f.path, line: longFn.line, message: `Fungsi ${longFn.name} panjangnya ${longFn.lines} baris.`, why: 'Fungsi panjang biasanya mengerjakan terlalu banyak hal sekaligus.', fix: 'Pisahkan bagian-bagiannya (mis. ambil data, olah data, tampilkan) menjadi fungsi sendiri.' })
}

function longestFunction(t: string): { name: string; line: number; lines: number } | null {
  const lines = t.split('\n')
  let best: { name: string; line: number; lines: number } | null = null
  lines.forEach((l, i) => {
    const m = /function\s+([A-Za-z_$][\w$]*)\s*\(|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{/.exec(l)
    if (!m) return
    let depth = 0
    let started = false
    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === '{') {
          depth++
          started = true
        } else if (ch === '}') depth--
      }
      if (started && depth <= 0) {
        const len = j - i + 1
        if (!best || len > best.lines) best = { name: m[1] ?? m[2], line: i + 1, lines: len }
        return
      }
    }
  })
  return best
}

function cssFileRules(f: ReviewFile, out: Finding[]) {
  const imp = (f.text.match(/!important/g) ?? []).length
  if (imp > 2) out.push({ id: 'important', category: 'kualitas', level: 'saran', file: f.path, message: `${imp}× !important.`, why: 'Menandakan selektor saling bertarung; sulit diubah di kemudian hari.', fix: 'Perbaiki urutan/spesifisitas selektor, gunakan class yang lebih tepat.' })
  if (/:hover/.test(f.text) && !/:focus/.test(f.text)) out.push({ id: 'hover-only', category: 'aksesibilitas', level: 'saran', file: f.path, message: 'Ada gaya :hover tanpa :focus/:focus-visible.', why: 'Pengguna keyboard tidak mendapat umpan balik yang sama dengan pengguna mouse.', fix: 'Tambahkan selektor yang sama untuk :focus-visible.' })
  if (/(width|max-width)\s*:\s*\d{3,}px/.test(f.text) && !/@media/.test(f.text)) out.push({ id: 'no-media', category: 'aksesibilitas', level: 'saran', file: f.path, message: 'Lebar tetap besar tanpa @media query.', why: 'Tampilan bisa terpotong atau menggulung ke samping di ponsel.', fix: 'Gunakan max-width + width: 100%, atau tambahkan @media (max-width: 600px) { … }.' })
}

function htmlFileRules(f: ReviewFile, out: Finding[], seen: Set<string>) {
  f.text.split('\n').forEach((l, i) => {
    if (/target\s*=\s*["']_blank["']/.test(l) && !/rel\s*=\s*["'][^"']*noopener/.test(l) && !seen.has(`${f.path}:blank`)) {
      seen.add(`${f.path}:blank`)
      out.push({ id: 'blank-rel', category: 'keamanan', level: 'saran', file: f.path, line: i + 1, message: 'Link target="_blank" tanpa rel="noopener noreferrer".', why: 'Browser modern sudah melindungi, tetapi browser lama memberi halaman tujuan akses ke halamanmu (tabnabbing).', fix: 'Tambahkan rel="noopener noreferrer".' })
    }
    if (/<img\b(?![^>]*\bloading=)/i.test(l) && !seen.has(`${f.path}:lazy`)) {
      seen.add(`${f.path}:lazy`)
      out.push({ id: 'img-lazy', category: 'performa', level: 'saran', file: f.path, line: i + 1, message: 'Gambar tanpa loading="lazy".', why: 'Semua gambar diunduh sekaligus, termasuk yang belum terlihat.', fix: 'Tambahkan loading="lazy" untuk gambar di bawah layar pertama (jangan untuk gambar utama/hero).' })
    }
    if (/<img\b(?![^>]*\bwidth=)/i.test(l) && !seen.has(`${f.path}:dim`)) {
      seen.add(`${f.path}:dim`)
      out.push({ id: 'img-size', category: 'performa', level: 'saran', file: f.path, line: i + 1, message: 'Gambar tanpa atribut width/height.', why: 'Tata letak “melompat” saat gambar selesai dimuat (Cumulative Layout Shift).', fix: 'Tulis ukuran asli, mis. width="800" height="600", lalu atur tampilan dengan CSS.' })
    }
  })
}

const AUDIT_CATEGORY: Record<string, Category> = { missing: 'kualitas', placeholder: 'kualitas' }

export function reviewCode(files: ReviewFile[]): Finding[] {
  const out: Finding[] = []
  const seen = new Set<string>()
  for (const f of files) {
    if (/\.(m?js|ts)$/i.test(f.path)) {
      lineRules(f, JS_RULES, out, seen)
      jsFileRules(f, out)
    } else if (/\.css$/i.test(f.path)) {
      lineRules(f, CSS_RULES, out, seen)
      cssFileRules(f, out)
    } else if (/\.html?$/i.test(f.path)) htmlFileRules(f, out, seen)
  }

  // Aturan halaman (aksesibilitas & struktur) dari pemeriksa proyek.
  const texts = new Map(files.map((f) => [f.path, f.text]))
  const all = new Set(files.map((f) => f.path))
  if ([...texts.keys()].some((p) => /\.html?$/i.test(p))) {
    for (const a of auditProject(texts, all)) {
      if (a.status === 'pass') continue
      out.push({ id: `audit-${a.id}`, category: AUDIT_CATEGORY[a.id] ?? 'aksesibilitas', level: a.status === 'fail' ? 'penting' : 'saran', file: a.details[0]?.split(':')[0] ?? '', message: `Belum terpenuhi: ${a.label}`, why: `Ditemukan: ${a.details.slice(0, 3).join(' · ')}`, fix: 'Buka tab Pemeriksaan di editor proyek untuk detail per halaman.' })
    }
  }
  // Rahasia & sumber http:// dari pemeriksa deploy.
  for (const d of checkDeploy(files.map((f) => ({ path: f.path, text: f.text, size: f.size ?? f.text.length })))) {
    if (d.status === 'pass' || !['secrets', 'mixed'].includes(d.id)) continue
    out.push({ id: `deploy-${d.id}`, category: 'keamanan', level: d.status === 'fail' ? 'penting' : 'saran', file: d.details[0]?.split(' ')[0] ?? '', message: `Belum terpenuhi: ${d.label}`, why: d.why, fix: d.details.slice(0, 3).join(' · ') })
  }
  const rank = (f: Finding) => (f.level === 'penting' ? 0 : 1)
  return out.sort((a, b) => rank(a) - rank(b) || a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0))
}
