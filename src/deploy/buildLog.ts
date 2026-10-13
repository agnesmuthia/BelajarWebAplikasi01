/**
 * Penganalisis build/deploy log: mencocokkan pesan error umum dari GitHub Actions,
 * Netlify, dan Vercel dengan penjelasan & perbaikan untuk pemula.
 */
export interface LogFinding {
  id: string
  title: string
  cause: string
  fix: string
  line?: string
}

const RULES: { id: string; re: RegExp; title: string; cause: string; fix: string }[] = [
  { id: 'lockfile', re: /npm ci.*(package-lock|lockfile)|can only install packages when your package\.json and package-lock\.json/i, title: 'package-lock.json tidak ada atau tidak sinkron', cause: 'npm ci membutuhkan package-lock.json yang cocok dengan package.json.', fix: 'Jalankan npm install di komputermu, lalu commit & push file package-lock.json.' },
  { id: 'node-version', re: /requires Node\.js version|Unsupported engine|engine "node" is incompatible|SyntaxError: Unexpected token '\?\?='/i, title: 'Versi Node.js di server terlalu lama', cause: 'Platform hosting memakai versi Node yang berbeda dari komputermu.', fix: 'Atur versi Node di pengaturan platform (mis. 22), atau tambahkan file .nvmrc berisi 22. Di GitHub Actions: node-version: 22.' },
  { id: 'cmd-not-found', re: /(vite|react-scripts|next|tsc): (command )?not found|sh: 1: \w+: not found/i, title: 'Perintah build tidak ditemukan', cause: 'Dependensi belum terpasang, atau paket hanya ada di komputermu (dipasang global).', fix: 'Pastikan paket tercantum di package.json (npm install -D vite) dan perintah install (npm ci) berjalan sebelum build.' },
  { id: 'module-not-found', re: /Cannot find module|Module not found|Could not resolve ["']|Failed to resolve import/i, title: 'File atau modul tidak ditemukan', cause: 'Biasanya beda huruf besar/kecil (Header.jsx vs header.jsx) atau file belum di-commit. Linux membedakan huruf besar/kecil.', fix: 'Samakan ejaan import dengan nama file persis, cek git status untuk file yang belum di-commit, lalu push ulang.' },
  { id: 'ts-error', re: /error TS\d{4}/i, title: 'Error TypeScript', cause: 'tsc menemukan kesalahan tipe sehingga build dihentikan.', fix: 'Jalankan npm run build di komputermu, perbaiki baris yang disebut di log (nama file:baris), lalu push.' },
  { id: 'missing-script', re: /Missing script: "?build"?/i, title: 'Script build tidak ada', cause: 'package.json tidak punya script "build".', fix: 'Tambahkan "build": "vite build" di bagian scripts, atau kosongkan build command jika situsmu HTML statis biasa.' },
  { id: 'publish-dir', re: /Deploy directory ['"]?\S+['"]? does not exist|No Output Directory named|publish directory .* does not exist|tar: .*dist: Cannot open/i, title: 'Folder hasil build salah', cause: 'Publish/output directory di pengaturan tidak sama dengan folder hasil build.', fix: 'Untuk Vite isi output directory: dist. Untuk HTML statis tanpa build: folder utama (. atau kosong).' },
  { id: 'env', re: /is not defined.*(VITE_|process\.env)|Missing (required )?environment variable|undefined.*VITE_/i, title: 'Environment variable belum diatur', cause: 'Variabel yang ada di file .env komputermu tidak ikut ke server (dan memang tidak boleh di-commit).', fix: 'Tambahkan variabel di Settings → Environment Variables pada platform hosting, lalu deploy ulang. Ingat: variabel VITE_ ikut ke browser — jangan isi dengan rahasia.' },
  { id: 'oom', re: /JavaScript heap out of memory|ENOMEM|Killed/i, title: 'Kehabisan memori saat build', cause: 'Proyek terlalu besar untuk mesin build, atau ada gambar sangat besar yang diproses.', fix: 'Kompres aset besar; jika tetap gagal, atur NODE_OPTIONS=--max-old-space-size=4096 di environment variable build.' },
  { id: 'pages-permission', re: /Permission to .* denied to github-actions|Resource not accessible by integration|Ensure GITHUB_TOKEN has permission/i, title: 'Izin GitHub Actions kurang', cause: 'Workflow tidak punya izin pages: write / id-token: write, atau Pages belum diaktifkan dengan sumber “GitHub Actions”.', fix: 'Di workflow tambahkan permissions: pages: write dan id-token: write; di Settings → Pages pilih Source: GitHub Actions.' },
  { id: 'pages-not-enabled', re: /Get Pages site failed|Failed to create deployment.*404|Not Found.*pages/i, title: 'GitHub Pages belum diaktifkan', cause: 'Repository belum mengaktifkan Pages.', fix: 'Settings → Pages → Build and deployment → Source: GitHub Actions (atau Deploy from a branch), lalu jalankan ulang workflow.' },
  { id: 'eresolve', re: /ERESOLVE|unable to resolve dependency tree/i, title: 'Konflik versi dependensi', cause: 'Dua paket membutuhkan versi paket lain yang berbeda.', fix: 'Jalankan npm install di komputer, baca konfliknya, sesuaikan versi di package.json; hindari --force kecuali paham akibatnya.' },
  { id: '404-page', re: /\b404\b.*(There isn't a GitHub Pages site here|Page not found|NOT_FOUND)/i, title: 'Halaman 404 setelah deploy', cause: 'index.html tidak berada di root folder yang dipublikasikan, atau URL salah (huruf besar/kecil nama repo).', fix: 'Pastikan index.html ada di root branch/folder yang dipilih, tunggu 1–2 menit, dan periksa alamat https://username.github.io/nama-repo/.' },
]

export function analyzeLog(log: string): LogFinding[] {
  const lines = log.split('\n')
  const out: LogFinding[] = []
  for (const r of RULES) {
    const line = lines.find((l) => r.re.test(l)) ?? (r.re.test(log) ? undefined : null)
    if (line === null) continue
    out.push({ id: r.id, title: r.title, cause: r.cause, fix: r.fix, line: line?.trim().slice(0, 300) })
  }
  return out
}

/** Baris error pertama — membaca log dimulai dari sini. */
export function firstErrorLine(log: string): string | null {
  const l = log.split('\n').find((x) => /\b(error|failed|fatal)\b|ERR!/i.test(x) && !/^\s*#/.test(x))
  return l ? l.trim().slice(0, 300) : null
}
