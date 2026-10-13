import { resolveRef } from '../lab/runtime'

/**
 * Pemeriksaan “Siap deploy?” — mencari masalah yang biasanya baru muncul setelah
 * website online: huruf besar/kecil nama file, path absolut, rahasia yang bocor,
 * konten http campuran, dan file terlalu besar.
 */
export interface DeployCheckItem {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  details: string[]
  why: string
}

export interface DeployFile {
  path: string
  text?: string
  size: number
}

const SECRET_PATTERNS: [RegExp, string][] = [
  [/ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}/, 'token GitHub'],
  [/\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}/, 'API key (format sk-…)'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/service_role/i, 'Supabase service role key'],
  [/\b(password|passwd|secret)\s*[:=]\s*["'][^"']{6,}["']/i, 'password/secret tertulis di kode'],
]

const dirOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')

function refsOf(path: string, text: string): { ref: string; tag: string }[] {
  const out: { ref: string; tag: string }[] = []
  if (/\.html?$/i.test(path)) {
    for (const m of text.matchAll(/<(\w+)\b[^>]*?\s(src|href|poster)\s*=\s*["']([^"']+)["']/gi)) out.push({ ref: m[3], tag: m[1].toLowerCase() })
  }
  if (/\.(css|html?)$/i.test(path)) for (const m of text.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)) out.push({ ref: m[2], tag: 'css' })
  return out
}

export function checkDeploy(files: DeployFile[]): DeployCheckItem[] {
  const paths = new Set(files.map((f) => f.path))
  const lower = new Map(files.map((f) => [f.path.toLowerCase(), f.path]))
  const res = { index: [] as string[], absolute: [] as string[], caseRefs: [] as string[], missing: [] as string[], names: [] as string[], secrets: [] as string[], mixed: [] as string[], big: [] as string[], placeholder: [] as string[], mockApi: [] as string[] }

  if (paths.has('api/config.json')) res.mockApi.push('api/config.json — konfigurasi Mock API (hanya berlaku di DevStudio)')
  if (!paths.has('index.html')) res.index.push('Tidak ada index.html di folder utama proyek.')

  for (const f of files) {
    const name = f.path.split('/').pop() ?? f.path
    // README/LICENSE dsb. memang ditulis huruf besar menurut konvensi.
    const conventional = /^(README|LICENSE|CHANGELOG|CONTRIBUTING|CNAME)(\.|$)/.test(name)
    if (/\s/.test(f.path) || (/[A-Z]/.test(name) && !conventional)) res.names.push(f.path)
    if (/^\.env(\.|$)/.test(name) && name !== '.env.example') res.secrets.push(`${f.path} — file .env tidak boleh ikut dipublikasikan`)
    if (/\.(png|jpe?g|gif|webp|avif)$/i.test(f.path) && f.size > 1024 * 1024) res.big.push(`${f.path} (${(f.size / 1024 / 1024).toFixed(1)} MB)`)
    if (f.text === undefined) continue
    for (const [re, label] of SECRET_PATTERNS) if (re.test(f.text)) res.secrets.push(`${f.path} — kemungkinan ${label}`)
    if (/\.(js|mjs|html?)$/i.test(f.path) && /[`'"](\.?\/)?api\/[a-z]/i.test(f.text)) res.mockApi.push(`${f.path} memanggil /api/… (Mock API DevStudio)`)
    if (/\[(GANTI|Nama Sekolah|Nama Kamu)\]/.test(f.text) && /\.html?$/i.test(f.path)) res.placeholder.push(f.path)
    for (const { ref, tag } of refsOf(f.path, f.text)) {
      if (/^http:\/\//i.test(ref) && tag !== 'a') res.mixed.push(`${f.path} → ${ref}`)
      if (/^\/(?!\/)/.test(ref)) res.absolute.push(`${f.path} → ${ref}`)
      const target = resolveRef(dirOf(f.path), ref)
      if (!target || paths.has(target)) continue
      const ci = lower.get(target.toLowerCase())
      if (ci) res.caseRefs.push(`${f.path} → “${ref}” tetapi file bernama “${ci}”`)
      else if (!/^\//.test(ref)) res.missing.push(`${f.path} → ${ref}`)
    }
  }

  const item = (id: string, label: string, details: string[], level: 'fail' | 'warn', why: string): DeployCheckItem => ({ id, label, status: details.length ? level : 'pass', details: [...new Set(details)], why })
  return [
    item('index', 'index.html ada di folder utama', res.index, 'fail', 'Server membuka index.html secara otomatis saat pengunjung membuka alamat situs. Tanpa file ini, pengunjung melihat 404.'),
    item('secrets', 'Tidak ada password, token, atau file .env', res.secrets, 'fail', 'Semua file website bisa dibaca siapa pun. Rahasia yang terlanjur online harus dicabut (revoke) dan diganti.'),
    item('case', 'Huruf besar/kecil nama file sesuai rujukan', res.caseRefs, 'fail', 'Windows & macOS tidak membedakan Logo.png dan logo.png, tetapi server hosting (Linux) membedakannya — gambar tampil di komputermu namun hilang setelah online.'),
    item('missing', 'Semua file yang dirujuk tersedia', res.missing, 'fail', 'Rujukan ke file yang tidak ada menghasilkan gambar/CSS/halaman yang hilang (404).'),
    item('absolute', 'Tidak ada path absolut yang diawali “/”', res.absolute, 'warn', 'Di GitHub Pages proyek tinggal di subfolder (username.github.io/nama-repo/), jadi “/css/style.css” menunjuk ke tempat yang salah. Gunakan path relatif: “css/style.css”.'),
    item('mixed', 'Tidak ada sumber http:// (tanpa s)', res.mixed, 'warn', 'Situs HTTPS memblokir gambar/script dari alamat http:// (mixed content). Ganti dengan https://.'),
    item('names', 'Nama file huruf kecil tanpa spasi', res.names, 'warn', 'Spasi menjadi %20 di URL dan huruf besar mudah salah ketik. Konvensi web: huruf kecil dengan tanda hubung.'),
    item('big', 'Gambar di bawah 1 MB', res.big, 'warn', 'Gambar besar memperlambat website di ponsel dan menghabiskan kuota bandwidth hosting gratis.'),
    item('mockapi', 'Tidak bergantung pada Mock API DevStudio', res.mockApi, 'warn', 'Mock API hanya berjalan di preview DevStudio. Setelah online, alamat /api/… menghasilkan 404 — ganti dengan backend sungguhan (mis. Supabase) atau tandai bagian ini sebagai demo.'),
    item('placeholder', 'Tidak ada placeholder [GANTI] yang tersisa', res.placeholder, 'warn', 'Placeholder yang tampil online membuat website terlihat belum selesai.'),
  ]
}
