/**
 * Folder lokal via File System Access API (Chrome/Edge desktop).
 *
 * Prinsip keamanan:
 *  - Browser hanya memberi akses ke folder yang DIPILIH pengguna lewat dialog sistem.
 *  - Izin baca/tulis diminta ulang setiap sesi, dan hanya setelah pengguna menekan tombol.
 *  - DevStudio tidak pernah menghapus file di folder lokal; hanya membuat/menimpa file
 *    yang daftarnya sudah dikonfirmasi pengguna.
 */
import { sha256 } from './hash'
import type { ImportSource } from './importer'
import { MAX_FILE_BYTES, isIgnoredSegment, isTextKind, kindOf, mimeOf, normalizePath } from './paths'

/* Antarmuka minimal (juga dipakai implementasi palsu di test). */
export interface FileLike {
  kind: 'file'
  name: string
  getFile(): Promise<File>
  createWritable(): Promise<{ write(data: Blob | string): Promise<void>; close(): Promise<void> }>
}
export interface DirLike {
  kind: 'directory'
  name: string
  values(): AsyncIterable<DirLike | FileLike>
  getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<DirLike>
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FileLike>
  queryPermission?(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
  requestPermission?(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>
}

type PickerWindow = Window & { showDirectoryPicker?: (opts?: { mode?: 'read' | 'readwrite'; id?: string }) => Promise<DirLike> }

export function isFolderAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as PickerWindow).showDirectoryPicker === 'function'
}

/** Buka dialog pilih folder. Mengembalikan null jika pengguna membatalkan. */
export async function pickFolder(): Promise<DirLike | null> {
  const w = window as PickerWindow
  if (!w.showDirectoryPicker) throw new Error('Browser ini belum mendukung akses folder. Gunakan Chrome atau Edge versi desktop.')
  try {
    return await w.showDirectoryPicker({ mode: 'readwrite', id: 'devstudio-project' })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return null
    throw e
  }
}

export async function permissionState(dir: DirLike): Promise<PermissionState> {
  return dir.queryPermission ? dir.queryPermission({ mode: 'readwrite' }) : 'granted'
}

/** Minta izin (harus dipanggil dari klik pengguna). */
export async function ensurePermission(dir: DirLike): Promise<boolean> {
  if (!dir.queryPermission || !dir.requestPermission) return true
  if ((await dir.queryPermission({ mode: 'readwrite' })) === 'granted') return true
  return (await dir.requestPermission({ mode: 'readwrite' })) === 'granted'
}

const skipName = isIgnoredSegment

export interface ScanResult {
  sources: ImportSource[]
  /** Folder/file yang sengaja dilewati (mis. node_modules, .git). */
  skipped: string[]
  truncated: boolean
}

/** Baca struktur folder secara rekursif. Isi file baru dibaca saat dibutuhkan. */
export async function scanFolder(dir: DirLike, maxFiles = 2000): Promise<ScanResult> {
  const sources: ImportSource[] = []
  const skipped: string[] = []
  let truncated = false
  const walk = async (d: DirLike, prefix: string, depth: number) => {
    if (depth > 12) return
    for await (const entry of d.values()) {
      if (sources.length >= maxFiles) {
        truncated = true
        return
      }
      const path = prefix + entry.name
      if (skipName(entry.name)) {
        skipped.push(entry.kind === 'directory' ? path + '/' : path)
        continue
      }
      if (entry.kind === 'directory') await walk(entry, path + '/', depth + 1)
      else {
        const file = await entry.getFile()
        sources.push({ relPath: path, size: file.size, read: async () => (await entry.getFile()) as Blob })
      }
    }
  }
  await walk(dir, '', 0)
  return { sources: sources.sort((a, b) => a.relPath.localeCompare(b.relPath)), skipped, truncated }
}

/** Tulis file ke folder lokal (membuat subfolder bila perlu). Tidak pernah menghapus. */
export async function writeToFolder(dir: DirLike, items: { path: string; data: Blob | string }[], onProgress?: (done: number) => void): Promise<number> {
  let done = 0
  for (const it of items) {
    const path = normalizePath(it.path)
    if (!path) throw new Error(`Path tidak valid: ${it.path}`)
    const parts = path.split('/')
    let cur = dir
    for (const p of parts.slice(0, -1)) cur = await cur.getDirectoryHandle(p, { create: true })
    const fh = await cur.getFileHandle(parts[parts.length - 1], { create: true })
    const w = await fh.createWritable()
    await w.write(it.data)
    await w.close()
    done++
    onProgress?.(done)
  }
  return done
}

export type SyncStatus = 'same' | 'different' | 'onlyProject' | 'onlyFolder' | 'tooBig'

export interface SyncRow {
  path: string
  status: SyncStatus
  projectSize?: number
  folderSize?: number
}

export interface ProjectFileInfo {
  path: string
  text?: string
  blobHash?: string
  size: number
}

/** Bandingkan isi proyek dengan isi folder (teks dibandingkan langsung, biner lewat SHA-256). */
export async function compareWithFolder(project: ProjectFileInfo[], folder: ImportSource[]): Promise<SyncRow[]> {
  const fmap = new Map(folder.map((s) => [s.relPath, s]))
  const rows: SyncRow[] = []
  for (const f of project) {
    const src = fmap.get(f.path)
    if (!src) {
      rows.push({ path: f.path, status: 'onlyProject', projectSize: f.size })
      continue
    }
    fmap.delete(f.path)
    if (src.size > MAX_FILE_BYTES) {
      rows.push({ path: f.path, status: 'tooBig', projectSize: f.size, folderSize: src.size })
      continue
    }
    const blob = await src.read()
    let same: boolean
    if (f.text !== undefined) same = isTextKind(kindOf(f.path)) && (await blob.text()) === f.text
    else same = Boolean(f.blobHash) && (await sha256(new Uint8Array(await blob.arrayBuffer()))) === f.blobHash
    rows.push({ path: f.path, status: same ? 'same' : 'different', projectSize: f.size, folderSize: src.size })
  }
  for (const [path, src] of fmap) if (kindOf(path)) rows.push({ path, status: 'onlyFolder', folderSize: src.size })
  return rows.sort((a, b) => a.path.localeCompare(b.path))
}

export { mimeOf }
