import { sha256 } from './hash'
import type { DirLike } from './localFolder'
import { mimeOf } from './paths'

/**
 * Penyimpanan file proyek di IndexedDB (database bawaan browser).
 * localStorage hanya muat ±5 MB teks; IndexedDB bisa menyimpan gambar dan file besar.
 *
 * Struktur — sengaja mirip cara kerja Git:
 *  - files     : file terkini per proyek ([projectId, path] → isi teks atau hash blob)
 *  - blobs     : isi file biner, disimpan SEKALI per hash SHA-256 (seperti objek Git)
 *  - snapshots : checkpoint (seperti commit) berisi daftar file pada satu waktu
 */

export interface StoredFile {
  projectId: string
  path: string
  text?: string
  blobHash?: string
  mime: string
  size: number
  updatedAt: string
}

export type SnapshotFile = Pick<StoredFile, 'path' | 'text' | 'blobHash' | 'mime' | 'size'>

export interface Snapshot {
  id: number
  projectId: string
  createdAt: string
  message: string
  auto: boolean
  files: SnapshotFile[]
}

interface BlobRecord {
  hash: string
  blob: Blob
  size: number
}

const DB_NAME = 'devstudio-workspace'
const MAX_SNAPSHOTS = 30

let dbPromise: Promise<IDBDatabase> | null = null

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('Browser ini tidak mendukung IndexedDB.'))
    // v1: files, blobs, snapshots · v2: handles (folder lokal yang dihubungkan, Phase 5)
    const r = indexedDB.open(DB_NAME, 2)
    r.onupgradeneeded = () => {
      const db = r.result
      const has = (n: string) => db.objectStoreNames.contains(n)
      if (!has('files')) db.createObjectStore('files', { keyPath: ['projectId', 'path'] }).createIndex('projectId', 'projectId')
      if (!has('blobs')) db.createObjectStore('blobs', { keyPath: 'hash' })
      if (!has('snapshots')) db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true }).createIndex('projectId', 'projectId')
      if (!has('handles')) db.createObjectStore('handles', { keyPath: 'projectId' })
    }
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => {
      dbPromise = null
      reject(r.error ?? new Error('Gagal membuka IndexedDB.'))
    }
  })
  return dbPromise
}

/** Hanya untuk test: tutup & lupakan koneksi. */
export async function _resetDbForTests() {
  if (dbPromise) (await dbPromise).close()
  dbPromise = null
}

const req = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })

/** Jalankan fn dalam satu transaksi; selesai ketika transaksi commit (semua atau tidak sama sekali). */
async function tx<T>(stores: string[], mode: IDBTransactionMode, fn: (t: IDBTransaction) => T | Promise<T>): Promise<T> {
  const db = await openDb()
  const t = db.transaction(stores, mode)
  const done = new Promise<void>((resolve, reject) => {
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error ?? new Error('Transaksi dibatalkan (penyimpanan mungkin penuh).'))
  })
  const result = await fn(t)
  await done
  return result
}

/* ---------------------------- pemberitahuan ---------------------------- */

type Listener = () => void
const listeners = new Map<string, Set<Listener>>()

export function subscribe(projectId: string, fn: Listener) {
  if (!listeners.has(projectId)) listeners.set(projectId, new Set())
  listeners.get(projectId)!.add(fn)
  return () => {
    listeners.get(projectId)?.delete(fn)
  }
}

function emit(projectId: string) {
  listeners.get(projectId)?.forEach((fn) => fn())
}

/* ------------------------------- files -------------------------------- */

export async function listFiles(projectId: string): Promise<StoredFile[]> {
  const files = await tx(['files'], 'readonly', (t) => req(t.objectStore('files').index('projectId').getAll(projectId)))
  return (files as StoredFile[]).sort((a, b) => a.path.localeCompare(b.path))
}

export async function getBlob(hash: string): Promise<Blob | undefined> {
  const r = (await tx(['blobs'], 'readonly', (t) => req(t.objectStore('blobs').get(hash)))) as BlobRecord | undefined
  return r?.blob
}

export interface WriteItem {
  path: string
  text?: string
  blob?: Blob
}

/** Tulis banyak file sekaligus dalam satu transaksi. */
export async function writeFiles(projectId: string, items: WriteItem[]): Promise<void> {
  if (!items.length) return
  const now = new Date().toISOString()
  // Hash dihitung SEBELUM transaksi dibuka (transaksi IndexedDB tidak boleh menunggu promise lain).
  const prepared = await Promise.all(
    items.map(async (it) => {
      if (it.blob) {
        const hash = await sha256(new Uint8Array(await it.blob.arrayBuffer()))
        return { it, hash }
      }
      return { it, hash: undefined }
    }),
  )
  await tx(['files', 'blobs'], 'readwrite', (t) => {
    const files = t.objectStore('files')
    const blobs = t.objectStore('blobs')
    for (const { it, hash } of prepared) {
      const record: StoredFile = { projectId, path: it.path, mime: it.blob?.type || mimeOf(it.path), size: 0, updatedAt: now }
      if (hash && it.blob) {
        blobs.put({ hash, blob: it.blob, size: it.blob.size } satisfies BlobRecord)
        record.blobHash = hash
        record.size = it.blob.size
      } else {
        record.text = it.text ?? ''
        record.size = new Blob([record.text]).size
      }
      files.put(record)
    }
  })
  emit(projectId)
}

export const writeText = (projectId: string, path: string, text: string) => writeFiles(projectId, [{ path, text }])

export async function deletePaths(projectId: string, paths: string[]): Promise<void> {
  await tx(['files'], 'readwrite', (t) => {
    for (const p of paths) t.objectStore('files').delete([projectId, p])
  })
  emit(projectId)
}

/** Ganti nama file, atau folder beserta seluruh isinya. */
export async function movePath(projectId: string, from: string, to: string): Promise<number> {
  const all = await listFiles(projectId)
  const moving = all.filter((f) => f.path === from || f.path.startsWith(from + '/'))
  const target = (p: string) => to + p.slice(from.length)
  const existing = new Set(all.map((f) => f.path))
  for (const f of moving) if (existing.has(target(f.path)) && !moving.some((m) => m.path === target(f.path))) throw new Error(`“${target(f.path)}” sudah ada.`)
  await tx(['files'], 'readwrite', (t) => {
    const s = t.objectStore('files')
    for (const f of moving) s.delete([projectId, f.path])
    for (const f of moving) s.put({ ...f, path: target(f.path), updatedAt: new Date().toISOString() })
  })
  emit(projectId)
  return moving.length
}

/** Isi proyek dengan starter files jika belum punya file. Mengembalikan true jika baru diisi. */
export async function seedProject(projectId: string, files: { path: string; content: string }[]): Promise<boolean> {
  const existing = await listFiles(projectId)
  if (existing.length) return false
  await writeFiles(projectId, files.map((f) => ({ path: f.path, text: f.content })))
  await createSnapshot(projectId, 'Versi awal dari template', true)
  return true
}

/* ----------------------------- snapshots ------------------------------ */

const toSnapFile = ({ path, text, blobHash, mime, size }: StoredFile): SnapshotFile => ({ path, text, blobHash, mime, size })

export async function listSnapshots(projectId: string): Promise<Snapshot[]> {
  const all = (await tx(['snapshots'], 'readonly', (t) => req(t.objectStore('snapshots').index('projectId').getAll(projectId)))) as Snapshot[]
  return all.sort((a, b) => b.id - a.id)
}

export async function createSnapshot(projectId: string, message: string, auto = false): Promise<Snapshot> {
  const files = (await listFiles(projectId)).map(toSnapFile)
  const snap = { projectId, createdAt: new Date().toISOString(), message: message.trim().slice(0, 120) || 'Checkpoint', auto, files }
  const id = (await tx(['snapshots'], 'readwrite', (t) => req(t.objectStore('snapshots').add(snap)))) as number
  // Simpan maksimal MAX_SNAPSHOTS; yang dihapus duluan adalah checkpoint otomatis tertua.
  const list = await listSnapshots(projectId)
  if (list.length > MAX_SNAPSHOTS) {
    const excess = list.length - MAX_SNAPSHOTS
    const victims = [...list.filter((s) => s.auto).reverse(), ...list.filter((s) => !s.auto).reverse()].slice(0, excess)
    await tx(['snapshots'], 'readwrite', (t) => victims.forEach((v) => t.objectStore('snapshots').delete(v.id)))
    await gcBlobs()
  }
  emit(projectId)
  return { ...snap, id }
}

export async function restoreSnapshot(projectId: string, id: number): Promise<void> {
  const snap = (await tx(['snapshots'], 'readonly', (t) => req(t.objectStore('snapshots').get(id)))) as Snapshot | undefined
  if (!snap || snap.projectId !== projectId) throw new Error('Checkpoint tidak ditemukan.')
  await createSnapshot(projectId, `Otomatis: sebelum memulihkan “${snap.message}”`, true)
  const now = new Date().toISOString()
  const current = await listFiles(projectId)
  await tx(['files'], 'readwrite', (t) => {
    const s = t.objectStore('files')
    for (const f of current) s.delete([projectId, f.path])
    for (const f of snap.files) s.put({ ...f, projectId, updatedAt: now } satisfies StoredFile)
  })
  emit(projectId)
}

/* ------------------------------ lain-lain ------------------------------ */

/** Hapus blob yang tidak lagi dirujuk file atau checkpoint mana pun. */
export async function gcBlobs(): Promise<number> {
  return tx(['files', 'snapshots', 'blobs'], 'readwrite', async (t) => {
    const used = new Set<string>()
    const files = (await req(t.objectStore('files').getAll())) as StoredFile[]
    files.forEach((f) => f.blobHash && used.add(f.blobHash))
    const snaps = (await req(t.objectStore('snapshots').getAll())) as Snapshot[]
    snaps.forEach((s) => s.files.forEach((f) => f.blobHash && used.add(f.blobHash)))
    const keys = (await req(t.objectStore('blobs').getAllKeys())) as string[]
    let removed = 0
    for (const k of keys)
      if (!used.has(k)) {
        t.objectStore('blobs').delete(k)
        removed++
      }
    return removed
  })
}

export async function deleteProjectData(projectId: string): Promise<void> {
  const files = await listFiles(projectId)
  const snaps = await listSnapshots(projectId)
  await tx(['files', 'snapshots', 'handles'], 'readwrite', (t) => {
    files.forEach((f) => t.objectStore('files').delete([projectId, f.path]))
    snaps.forEach((s) => t.objectStore('snapshots').delete(s.id))
    t.objectStore('handles').delete(projectId)
  })
  await gcBlobs()
  emit(projectId)
}

export async function storageInfo(): Promise<{ usage?: number; quota?: number; persisted?: boolean }> {
  try {
    const est = await navigator.storage?.estimate?.()
    const persisted = await navigator.storage?.persisted?.()
    return { usage: est?.usage, quota: est?.quota, persisted }
  } catch {
    return {}
  }
}

/** Minta browser agar tidak menghapus data proyek saat ruang penyimpanan menipis. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}

/** Hapus semua file, blob, checkpoint, dan tautan folder lokal (dipakai oleh “Reset semua data”). */
export async function clearAllProjectData(): Promise<void> {
  await tx(['files', 'blobs', 'snapshots', 'handles'], 'readwrite', (t) => {
    t.objectStore('files').clear()
    t.objectStore('blobs').clear()
    t.objectStore('snapshots').clear()
    t.objectStore('handles').clear()
  })
  listeners.forEach((set) => set.forEach((fn) => fn()))
}

/* ------------------------- folder lokal (Phase 5) ------------------------- */

export interface StoredHandle {
  projectId: string
  /** FileSystemDirectoryHandle — bisa disimpan di IndexedDB, tetapi izinnya harus diminta ulang tiap sesi. */
  handle: DirLike
  name: string
  linkedAt: string
}

export async function saveFolderHandle(projectId: string, handle: DirLike): Promise<void> {
  await tx(['handles'], 'readwrite', (t) => {
    t.objectStore('handles').put({ projectId, handle, name: handle.name, linkedAt: new Date().toISOString() } satisfies StoredHandle)
  })
}

export async function getFolderHandle(projectId: string): Promise<StoredHandle | undefined> {
  return (await tx(['handles'], 'readonly', (t) => req(t.objectStore('handles').get(projectId)))) as StoredHandle | undefined
}

export async function removeFolderHandle(projectId: string): Promise<void> {
  await tx(['handles'], 'readwrite', (t) => {
    t.objectStore('handles').delete(projectId)
  })
}
