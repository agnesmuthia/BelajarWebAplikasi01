import type { LabFiles } from './runtime'

/**
 * Draft Coding Lab disimpan terpisah dari progres utama (kunci sendiri),
 * agar kode yang panjang tidak memperlambat penyimpanan progres.
 */
export const DRAFTS_KEY = 'devstudio:lab-drafts:v1'
const MAX_FILE = 100_000
const MAX_DRAFTS = 100

export interface Draft extends LabFiles {
  updatedAt: string
}

export type Drafts = Record<string, Draft>

export function sanitizeDrafts(raw: unknown): Drafts {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const out: Drafts = {}
  for (const [id, v] of Object.entries(raw).slice(0, MAX_DRAFTS)) {
    if (typeof v !== 'object' || v === null) continue
    const d = v as Record<string, unknown>
    const str = (x: unknown) => (typeof x === 'string' ? x.slice(0, MAX_FILE) : '')
    out[id.slice(0, 100)] = {
      html: str(d.html),
      css: str(d.css),
      js: str(d.js),
      updatedAt: typeof d.updatedAt === 'string' && !Number.isNaN(Date.parse(d.updatedAt)) ? d.updatedAt : new Date().toISOString(),
    }
  }
  return out
}

export function loadDrafts(): Drafts {
  try {
    return sanitizeDrafts(JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? '{}'))
  } catch {
    return {}
  }
}

export function loadDraft(id: string): Draft | undefined {
  return loadDrafts()[id]
}

export function saveDraft(id: string, files: LabFiles): boolean {
  try {
    const all = loadDrafts()
    all[id] = { html: files.html.slice(0, MAX_FILE), css: files.css.slice(0, MAX_FILE), js: files.js.slice(0, MAX_FILE), updatedAt: new Date().toISOString() }
    // Simpan maksimal MAX_DRAFTS draft terbaru.
    const entries = Object.entries(all).sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt)).slice(0, MAX_DRAFTS)
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(Object.fromEntries(entries)))
    return true
  } catch {
    return false
  }
}

export function deleteDraft(id: string) {
  try {
    const all = loadDrafts()
    delete all[id]
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(all))
  } catch {
    /* abaikan */
  }
}

export function replaceDrafts(drafts: Drafts) {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(sanitizeDrafts(drafts)))
  } catch {
    /* abaikan */
  }
}

export function clearDrafts() {
  try {
    localStorage.removeItem(DRAFTS_KEY)
  } catch {
    /* abaikan */
  }
}
