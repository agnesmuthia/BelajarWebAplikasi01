import { unzipSync } from 'fflate'
import {
  MAX_FILE_BYTES,
  MAX_FILES,
  MAX_PROJECT_BYTES,
  basename,
  friendlyName,
  isFriendlyName,
  isIgnoredPath,
  isTextKind,
  kindOf,
  mimeOf,
  normalizePath,
  type FileKind,
} from './paths'

/**
 * Impor file dari komputer pengguna. Semua akses file SELALU dimulai oleh tindakan
 * pengguna (klik tombol pilih, drag & drop). Browser tidak memberi akses bebas ke hard drive.
 */

export interface ImportSource {
  /** Path relatif dari sumber (termasuk subfolder jika memilih folder). */
  relPath: string
  size: number
  read: () => Promise<Blob>
}

export function fromFiles(files: Iterable<File>): ImportSource[] {
  return Array.from(files, (f) => ({
    relPath: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
    size: f.size,
    read: async () => f,
  }))
}

/** Telusuri item drag & drop, termasuk folder (memakai webkitGetAsEntry). */
export async function fromDataTransfer(dt: DataTransfer): Promise<ImportSource[]> {
  const entries = Array.from(dt.items)
    .map((i) => (i.kind === 'file' ? i.webkitGetAsEntry?.() : null))
    .filter((e): e is FileSystemEntry => Boolean(e))
  if (!entries.length) return fromFiles(Array.from(dt.files))

  const out: ImportSource[] = []
  const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
    if (out.length > MAX_FILES * 2) return
    if (entry.isFile) {
      const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej))
      out.push({ relPath: prefix + entry.name, size: file.size, read: async () => file })
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      // readEntries mengembalikan sebagian isi folder per panggilan — ulangi sampai kosong.
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej))
        if (!batch.length) break
        for (const e of batch) await walk(e, prefix + entry.name + '/')
      }
    }
  }
  for (const e of entries) await walk(e, '')
  return out
}

export function isZip(name: string) {
  return /\.zip$/i.test(name)
}

/** Ekstrak ZIP di browser. Batas ukuran mencegah “zip bomb”. */
export async function fromZip(file: Blob): Promise<ImportSource[]> {
  if (file.size > 30 * 1024 * 1024) throw new Error('File ZIP terlalu besar (maksimal 30 MB).')
  let total = 0
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter: (f) => {
      total += f.originalSize
      if (total > MAX_PROJECT_BYTES * 2) throw new Error('Isi ZIP terlalu besar setelah diekstrak.')
      return !f.name.endsWith('/')
    },
  })
  return Object.entries(entries).map(([name, data]) => ({
    relPath: name,
    size: data.length,
    read: async () => new Blob([data as BlobPart], { type: mimeOf(name) }),
  }))
}

/** Jika semua file berada dalam satu folder teratas yang sama, buang folder itu. */
export function stripCommonRoot(sources: ImportSource[]): ImportSource[] {
  const firsts = new Set(sources.map((s) => (s.relPath.includes('/') ? s.relPath.split('/')[0] : '')))
  if (firsts.size !== 1 || firsts.has('')) return sources
  return sources.map((s) => ({ ...s, relPath: s.relPath.split('/').slice(1).join('/') }))
}

export type PlanStatus = 'new' | 'overwrite' | 'skip'

export interface PlanRow {
  source: ImportSource
  target: string
  kind: FileKind | null
  status: PlanStatus
  /** Alasan dilewati (status skip) atau saran (mis. nama file). */
  note?: string
  /** true jika nama aslinya kurang ramah web dan sudah dirapikan. */
  renamed?: boolean
}

export interface PlanOptions {
  destFolder: string
  existing: Map<string, number>
  existingBytes: number
  /** Rapikan nama: huruf kecil, tanpa spasi. */
  tidyNames: boolean
  /** Path yang dipilih pengguna untuk TIDAK ditimpa. */
  keepExisting: Set<string>
}

export function planImport(sources: ImportSource[], opts: PlanOptions): PlanRow[] {
  const rows: PlanRow[] = []
  const seen = new Set<string>()
  let bytes = opts.existingBytes

  for (const source of sources.slice(0, MAX_FILES * 2)) {
    const parts = source.relPath.replace(/\\/g, '/').split('/').filter(Boolean)
    const renamedParts = opts.tidyNames ? parts.map(friendlyName) : parts
    const rel = renamedParts.join('/')
    const target = normalizePath(opts.destFolder ? `${opts.destFolder}/${rel}` : rel)
    const kind = kindOf(source.relPath)
    const base: Omit<PlanRow, 'status'> = { source, target: target ?? source.relPath, kind, renamed: opts.tidyNames && rel !== parts.join('/') }

    const skip = (note: string) => rows.push({ ...base, status: 'skip', note })
    if (isIgnoredPath(source.relPath)) { skip('File/folder sistem atau tersembunyi'); continue }
    if (!target) { skip('Nama/path tidak valid'); continue }
    if (!kind) { skip('Jenis file tidak didukung'); continue }
    if (source.size > MAX_FILE_BYTES) { skip(`Lebih dari ${MAX_FILE_BYTES / 1024 / 1024} MB — kompres dulu`); continue }
    if (seen.has(target)) { skip('Nama sama dengan file lain dalam impor ini'); continue }
    if (rows.filter((r) => r.status !== 'skip').length >= MAX_FILES) { skip(`Maksimal ${MAX_FILES} file per impor`); continue }

    const exists = opts.existing.has(target)
    if (exists && opts.keepExisting.has(target)) { skip('Dipertahankan (tidak ditimpa)'); continue }
    const added = source.size - (exists ? opts.existing.get(target)! : 0)
    if (bytes + added > MAX_PROJECT_BYTES) { skip('Proyek akan melebihi 50 MB'); continue }

    bytes += added
    seen.add(target)
    const note = !opts.tidyNames && !parts.every(isFriendlyName) ? 'Saran: gunakan nama huruf kecil tanpa spasi' : undefined
    rows.push({ ...base, status: exists ? 'overwrite' : 'new', note })
  }
  return rows
}

/** Baca isi file untuk disimpan: teks didekode UTF-8, selain itu disimpan sebagai blob. */
export async function readForStore(row: PlanRow): Promise<{ path: string; text?: string; blob?: Blob }> {
  const blob = await row.source.read()
  if (isTextKind(row.kind)) return { path: row.target, text: await blob.text() }
  return { path: row.target, blob: blob.type ? blob : new Blob([blob], { type: mimeOf(row.target) }) }
}

export const describeTarget = (p: string) => `${basename(p)} → ${p}`
