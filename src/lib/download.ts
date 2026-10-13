import { strToU8, zipSync } from 'fflate'
import type { ProjectFile } from '../data/projects'

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'proyek'
  )
}

export function buildZip(folder: string, files: ProjectFile[]): Uint8Array {
  const entries: Record<string, Uint8Array> = {}
  for (const f of files) entries[`${folder}/${f.path}`] = strToU8(f.content)
  return zipSync(entries, { level: 6 })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadProjectZip(name: string, files: ProjectFile[]) {
  const slug = slugify(name)
  const zip = buildZip(slug, files)
  downloadBlob(new Blob([zip as BlobPart], { type: 'application/zip' }), `${slug}.zip`)
}

/** ZIP dari campuran file teks dan biner. */
export function buildZipEntries(folder: string, entries: { path: string; data: Uint8Array | string }[]): Uint8Array {
  const out: Record<string, Uint8Array> = {}
  for (const e of entries) out[`${folder}/${e.path}`] = typeof e.data === 'string' ? strToU8(e.data) : e.data
  return zipSync(out, { level: 6 })
}
