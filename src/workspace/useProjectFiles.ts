import { useCallback, useEffect, useRef, useState } from 'react'
import { findTemplate } from '../data/projects'
import { getBlob, listFiles, seedProject, subscribe, type StoredFile } from './db'

/**
 * Memuat file proyek dari IndexedDB dan berlangganan perubahan.
 * Proyek lama (dibuat sebelum Phase 3) otomatis diisi dari starter template saat pertama dibuka.
 */
export function useProjectFiles(projectId: string, templateId: string) {
  const [files, setFiles] = useState<StoredFile[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setFiles(await listFiles(projectId))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [projectId])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const tpl = findTemplate(templateId)
        if (tpl) await seedProject(projectId, tpl.files)
        if (alive) await reload()
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    const unsub = subscribe(projectId, () => void reload())
    return () => {
      alive = false
      unsub()
    }
  }, [projectId, templateId, reload])

  return { files, error, reload }
}

const dataUrlCache = new Map<string, string>()

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/** Data URL untuk aset biner (dipakai di preview terisolasi, yang tidak bisa memuat blob: milik aplikasi). */
export async function assetDataUrls(files: StoredFile[], budgetBytes = 25 * 1024 * 1024): Promise<{ map: Map<string, string>; skipped: string[] }> {
  const map = new Map<string, string>()
  const skipped: string[] = []
  let used = 0
  for (const f of files) {
    if (!f.blobHash) continue
    if (used + f.size > budgetBytes) {
      skipped.push(f.path)
      continue
    }
    let url = dataUrlCache.get(f.blobHash)
    if (!url) {
      const blob = await getBlob(f.blobHash)
      if (!blob) continue
      url = await blobToDataUrl(new Blob([blob], { type: f.mime }))
      dataUrlCache.set(f.blobHash, url)
    }
    used += f.size
    map.set(f.path, url)
  }
  return { map, skipped }
}

/** Object URL untuk menampilkan aset di aplikasi; otomatis dicabut saat tidak dipakai. */
export function useObjectUrl(hash: string | undefined, mime: string) {
  const [url, setUrl] = useState<string | null>(null)
  const current = useRef<string | null>(null)
  useEffect(() => {
    let alive = true
    setUrl(null)
    if (hash)
      void getBlob(hash).then((b) => {
        if (!alive || !b) return
        current.current = URL.createObjectURL(new Blob([b], { type: mime }))
        setUrl(current.current)
      })
    return () => {
      alive = false
      if (current.current) URL.revokeObjectURL(current.current)
      current.current = null
    }
  }, [hash, mime])
  return url
}
