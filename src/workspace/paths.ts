/**
 * Utilitas path untuk file proyek. Semua path memakai "/" dan relatif terhadap
 * folder utama proyek, mis. "index.html", "css/style.css", "assets/logo.png".
 */

export type FileKind = 'html' | 'css' | 'js' | 'json' | 'md' | 'text' | 'image' | 'font' | 'media' | 'other'

const KIND_BY_EXT: Record<string, FileKind> = {
  html: 'html', htm: 'html',
  css: 'css',
  js: 'js', mjs: 'js',
  json: 'json',
  md: 'md',
  txt: 'text', csv: 'text', xml: 'text', yml: 'text', yaml: 'text', toml: 'text', svgz: 'other',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', avif: 'image', svg: 'image', ico: 'image',
  woff: 'font', woff2: 'font', ttf: 'font', otf: 'font',
  mp3: 'media', ogg: 'media', wav: 'media', mp4: 'media', webm: 'media',
  pdf: 'other',
}

export const MIME_BY_EXT: Record<string, string> = {
  html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript',
  json: 'application/json', md: 'text/markdown', txt: 'text/plain', yml: 'text/yaml', yaml: 'text/yaml', toml: 'text/plain', csv: 'text/csv', xml: 'application/xml',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
  svg: 'image/svg+xml', ico: 'image/x-icon',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', mp4: 'video/mp4', webm: 'video/webm',
  pdf: 'application/pdf',
}

export const TEXT_KINDS: FileKind[] = ['html', 'css', 'js', 'json', 'md', 'text']

export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const MAX_PROJECT_BYTES = 50 * 1024 * 1024
export const MAX_FILES = 400

export function extOf(path: string): string {
  const name = basename(path)
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(i + 1).toLowerCase() : ''
}

/** File teks tanpa ekstensi yang umum di proyek. */
const TEXT_NAMES = new Set(['.gitignore', '.gitkeep', '.nvmrc', '.env.example', '.editorconfig', '.prettierrc', '.nojekyll', 'LICENSE', 'CNAME'])

export function kindOf(path: string): FileKind | null {
  if (TEXT_NAMES.has(basename(path))) return 'text'
  return KIND_BY_EXT[extOf(path)] ?? null
}

export const isTextKind = (k: FileKind | null) => k !== null && TEXT_KINDS.includes(k)

export function mimeOf(path: string): string {
  return MIME_BY_EXT[extOf(path)] ?? 'application/octet-stream'
}

export function basename(path: string): string {
  return path.split('/').pop() ?? path
}

export function dirname(path: string): string {
  const i = path.lastIndexOf('/')
  return i === -1 ? '' : path.slice(0, i)
}

/**
 * Normalisasi path proyek: hilangkan "./", gabungkan "/" ganda, tolak path absolut
 * atau yang keluar dari folder proyek ("..") — mencegah path traversal.
 */
export function normalizePath(input: string): string | null {
  const raw = input.replace(/\\/g, '/').trim()
  if (!raw || raw.startsWith('/') || /^[a-z]+:/i.test(raw)) return null
  const parts: string[] = []
  for (const seg of raw.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') return null
    if (/[<>:"|?*\u0000-\u001f]/.test(seg) || seg.length > 100) return null
    parts.push(seg)
  }
  if (parts.length === 0 || parts.length > 12) return null
  return parts.join('/')
}

/** Resolusi path relatif seperti yang dilakukan browser, dari dalam folder `fromDir`. */
export function resolvePath(fromDir: string, ref: string): string | null {
  const clean = ref.split(/[?#]/)[0].trim()
  if (!clean || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(clean)) return null // URL eksternal / data: / anchor
  const stack = clean.startsWith('/') ? [] : fromDir ? fromDir.split('/') : []
  for (const seg of clean.replace(/^\/+/, '').split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') {
      if (!stack.length) return null
      stack.pop()
    } else stack.push(decodeURIComponentSafe(seg))
  }
  return stack.join('/') || null
}

function decodeURIComponentSafe(s: string) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** Path relatif dari file `from` menuju `to` — untuk mengajarkan cara menulis src/href. */
export function relativePath(from: string, to: string): string {
  const a = dirname(from) ? dirname(from).split('/') : []
  const b = to.split('/')
  let i = 0
  while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++
  return [...Array(a.length - i).fill('..'), ...b.slice(i)].join('/')
}

/** Saran nama file yang ramah web: huruf kecil, tanpa spasi. */
export function friendlyName(name: string): string {
  const i = name.lastIndexOf('.')
  const base = i > 0 ? name.slice(0, i) : name
  const ext = i > 0 ? name.slice(i + 1).toLowerCase() : ''
  const slug =
    base
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file'
  return ext ? `${slug}.${ext}` : slug
}

export function isFriendlyName(name: string) {
  return friendlyName(name) === name
}

/** File/folder dot yang berguna dan aman untuk proyek web. */
const ALLOWED_DOT = new Set(['.github', '.gitignore', '.gitkeep', '.nvmrc', '.env.example', '.editorconfig', '.prettierrc', '.nojekyll'])

/**
 * File/folder yang sebaiknya tidak diimpor/disinkronkan: riwayat Git (.git), dependensi
 * (node_modules), file sistem, dan file .env yang biasanya berisi rahasia.
 */
export function isIgnoredSegment(seg: string): boolean {
  if (seg === 'node_modules' || seg === '__MACOSX' || seg === 'Thumbs.db' || seg === 'desktop.ini') return true
  return seg.startsWith('.') && !ALLOWED_DOT.has(seg)
}

export function isIgnoredPath(path: string): boolean {
  return path.split('/').some(isIgnoredSegment)
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
