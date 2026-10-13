/**
 * Mentor lokal — pembantu berbasis templat & aturan (bukan AI):
 * pesan commit, README, dan kerangka unit test.
 */

/* ------------------------------ commit ------------------------------ */

export type ChangeStatus = 'add' | 'mod' | 'del'

export interface Change {
  path: string
  status: ChangeStatus
  added?: number
  removed?: number
}

export const COMMIT_TYPES: Record<string, string> = {
  feat: 'fitur baru',
  fix: 'perbaikan bug',
  style: 'tampilan/CSS (tanpa mengubah perilaku)',
  docs: 'dokumentasi (README, komentar)',
  refactor: 'merapikan kode tanpa mengubah perilaku',
  test: 'menambah/mengubah tes',
  chore: 'konfigurasi, aset, dan pekerjaan rutin',
}

/** Tebak jenis commit dari jenis file yang berubah. */
export function guessType(changes: Change[]): string {
  if (!changes.length) return 'chore'
  const all = (re: RegExp) => changes.every((c) => re.test(c.path))
  if (all(/\.(md|txt)$/i)) return 'docs'
  if (all(/\.(test|spec)\.[jt]sx?$/i)) return 'test'
  if (all(/\.css$/i)) return 'style'
  if (all(/(^|\/)(\.github\/|\.gitignore$|package(-lock)?\.json$|netlify\.toml$|api\/config\.json$)|\.(png|jpe?g|webp|svg|gif|ico)$/i)) return 'chore'
  return 'feat'
}

/** Scope = folder bersama, atau nama file jika hanya satu file. */
export function guessScope(changes: Change[]): string {
  if (changes.length === 1) return changes[0].path.split('/').pop()!.replace(/\.[^.]+$/, '').toLowerCase()
  const tops = new Set(changes.map((c) => (c.path.includes('/') ? c.path.split('/')[0] : '')))
  return tops.size === 1 && [...tops][0] ? [...tops][0] : ''
}

export function suggestCommit(changes: Change[], summary: string, type = guessType(changes)): string {
  const scope = guessScope(changes)
  let subject = summary.trim().replace(/\s+/g, ' ').replace(/[.。]+$/, '')
  if (!subject) subject = changes.length === 1 ? `ubah ${changes[0].path}` : `perbarui ${changes.length} file`
  subject = subject.charAt(0).toLowerCase() + subject.slice(1)
  const head = `${type}${scope ? `(${scope})` : ''}: ${subject}`
  const mark: Record<ChangeStatus, string> = { add: 'tambah', mod: 'ubah', del: 'hapus' }
  const body = changes.slice(0, 15).map((c) => `- ${mark[c.status]} ${c.path}${c.added || c.removed ? ` (+${c.added ?? 0}/-${c.removed ?? 0})` : ''}`)
  if (changes.length > 15) body.push(`- …dan ${changes.length - 15} file lain`)
  return body.length > 1 ? `${head}\n\n${body.join('\n')}` : head
}

/** Pemeriksa pesan commit: mengembalikan saran perbaikan (kosong = sudah baik). */
export function lintCommit(msg: string): string[] {
  const issues: string[] = []
  const [subject = '', blank, ...rest] = msg.split('\n')
  if (!subject.trim()) return ['Baris pertama (judul) kosong.']
  if (subject.length > 72) issues.push(`Judul ${subject.length} karakter — usahakan ≤ 72 agar tidak terpotong di GitHub.`)
  if (/[.。]$/.test(subject.trim())) issues.push('Hapus titik di akhir judul.')
  if (/^(update|updates|fix|perbaikan|ubah|edit|wip|commit|changes?|asdf|test)$/i.test(subject.replace(/^\w+(\([^)]*\))?:\s*/, '').trim())) issues.push('Judul terlalu umum. Jelaskan APA yang berubah, mis. "tambah validasi email di form kontak".')
  if (/^(added|adding|fixed|fixing|menambahkan|memperbaiki|ditambahkan|diperbaiki)\b/i.test(subject.replace(/^\w+(\([^)]*\))?:\s*/, ''))) issues.push('Gunakan bentuk perintah: "tambah …", "perbaiki …" (seolah memberi instruksi), bukan "menambahkan"/"added".')
  if (rest.length && blank !== undefined && blank.trim() !== '') issues.push('Pisahkan judul dan isi dengan satu baris kosong.')
  if (/(password|token|api[_-]?key|secret)\s*[:=]/i.test(msg)) issues.push('Pesan commit tampaknya berisi rahasia — jangan pernah menulis kunci/password di commit.')
  return issues
}

/* ------------------------------ README ------------------------------ */

export interface ReadmeInput {
  name: string
  description: string
  technologies: string[]
  features: string[]
  files: string[]
  repoUrl?: string
  deployUrl?: string
  hasApi?: boolean
  notes?: string
}

export function buildReadme(i: ReadmeInput): string {
  const lines = [`# ${i.name}`, '', i.description.trim() || '_Tulis satu–dua kalimat: apa proyek ini dan untuk siapa._', '']
  if (i.deployUrl) lines.push(`**Website:** ${i.deployUrl}`, '')
  lines.push('## Fitur', '', ...(i.features.length ? i.features.map((f) => `- ${f}`) : ['- _Daftar fitur utama_']), '')
  lines.push('## Teknologi', '', ...i.technologies.map((t) => `- ${t}`), '')
  lines.push('## Menjalankan di komputer', '')
  if (i.files.includes('package.json')) lines.push('```bash', 'npm install', 'npm run dev', '```', '')
  else lines.push('Buka `index.html` dengan ekstensi Live Server di VS Code, atau jalankan `npx serve .` di folder proyek.', '')
  if (i.hasApi) lines.push('> Proyek ini memakai Mock API DevStudio (`api/config.json`) yang hanya berjalan di DevStudio. Lihat bagian “Backend” untuk versi online.', '', '## Backend', '', '_Jelaskan endpoint dan layanan backend/database yang dipakai di versi online (mis. Supabase), tanpa menulis kunci rahasia._', '')
  const tree = i.files.filter((f) => !/^(\.|node_modules)/.test(f)).sort().slice(0, 25)
  if (tree.length) lines.push('## Struktur file', '', '```', ...tree, '```', '')
  lines.push('## Sumber aset & lisensi', '', '- _Sebutkan sumber setiap foto, ikon, dan font beserta lisensinya._', '')
  if (i.notes?.trim()) lines.push('## Catatan pembelajaran', '', i.notes.trim(), '')
  if (i.repoUrl) lines.push('## Repository', '', i.repoUrl, '')
  lines.push('---', '_README ini dibuat dari templat Mentor lokal DevStudio — lengkapi bagian yang bertanda miring._', '')
  return lines.join('\n')
}

/* ---------------------------- unit test ---------------------------- */

export interface FnInfo {
  name: string
  params: string[]
  isAsync: boolean
}

export function findFunctions(code: string): FnInfo[] {
  const out: FnInfo[] = []
  const seen = new Set<string>()
  const add = (name: string, params: string, isAsync: boolean) => {
    if (seen.has(name)) return
    seen.add(name)
    out.push({ name, params: params.split(',').map((p) => p.trim().replace(/=.*$/, '').trim()).filter(Boolean), isAsync })
  }
  for (const m of code.matchAll(/(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g)) add(m[2], m[3], !!m[1])
  for (const m of code.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(async\s*)?\(([^)]*)\)\s*=>/g)) add(m[1], m[3], !!m[2])
  for (const m of code.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(async\s+)?([A-Za-z_$][\w$]*)\s*=>/g)) add(m[1], m[3], !!m[2])
  return out
}

/** Kerangka tes Vitest: kasus normal, batas, dan input tidak valid — nilai harapannya diisi sendiri. */
export function buildTestSkeleton(code: string, file = 'script.js'): string {
  const fns = findFunctions(code)
  if (!fns.length) return '// Tidak ditemukan fungsi bernama. Tes paling mudah ditulis untuk fungsi yang menerima input dan mengembalikan nilai.\n'
  const mod = './' + file.replace(/^.*\//, '').replace(/\.(m?js|ts)$/, '')
  const lines = [`import { describe, it, expect } from 'vitest'`, `import { ${fns.map((f) => f.name).join(', ')} } from '${mod}'`, '', `// Jalankan: npx vitest   (di proyek npm; pastikan fungsi di-export dari ${file})`, '']
  for (const f of fns) {
    const args = f.params.map((p) => `/* ${p} */`).join(', ')
    const call = `${f.isAsync ? 'await ' : ''}${f.name}(${args})`
    const it = (title: string) => `  it('${title}', ${f.isAsync ? 'async ' : ''}() => {`
    lines.push(`describe('${f.name}', () => {`)
    lines.push(it('kasus normal'), `    // TODO: isi argumen dan hasil yang diharapkan`, `    expect(${call}).toBe(/* hasil */)`, '  })', '')
    if (f.params.length) lines.push(it('nilai batas (0, string kosong, array kosong)'), `    expect(${call}).toBe(/* hasil */)`, '  })', '')
    if (f.params.length) lines.push(it('input tidak valid'), `    // Haruskah melempar error? expect(() => ${f.name}(…)).toThrow()`, '  })')
    lines.push('})', '')
  }
  return lines.join('\n')
}
