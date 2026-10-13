import { buildZipEntries, downloadBlob, slugify } from '../lib/download'
import { getBlob, listFiles } from './db'

/** Unduh seluruh file proyek (teks + gambar) dari IndexedDB sebagai ZIP. */
export async function downloadProjectFromDb(projectId: string, name: string) {
  const files = await listFiles(projectId)
  const entries = await Promise.all(
    files.map(async (f) => ({
      path: f.path,
      data: f.text !== undefined ? f.text : new Uint8Array(await ((await getBlob(f.blobHash!)) ?? new Blob()).arrayBuffer()),
    })),
  )
  const slug = slugify(name)
  downloadBlob(new Blob([buildZipEntries(slug, entries) as BlobPart], { type: 'application/zip' }), `${slug}.zip`)
}
