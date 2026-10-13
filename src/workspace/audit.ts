import { resolveRef } from '../lab/runtime'

/**
 * Pemeriksaan otomatis (statis) untuk proyek: membaca HTML dengan DOMParser —
 * yang TIDAK menjalankan script — lalu memeriksa praktik dasar aksesibilitas,
 * struktur, dan referensi file yang rusak.
 */
export interface AuditItem {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  details: string[]
  /** Item checklist testing proyek yang setara (jika ada). */
  testId?: string
}

const dirOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')

export function auditProject(texts: Map<string, string>, allPaths: Set<string>): AuditItem[] {
  const pages = [...texts.keys()].filter((p) => /\.html?$/i.test(p)).sort()
  const res: Record<string, string[]> = { lang: [], title: [], viewport: [], h1: [], alt: [], labels: [], placeholder: [], missing: [], headings: [], emptyLinks: [] }

  for (const page of pages) {
    const doc = new DOMParser().parseFromString(texts.get(page) ?? '', 'text/html')
    const dir = dirOf(page)
    if (!doc.documentElement.getAttribute('lang')) res.lang.push(page)
    if (!doc.querySelector('title')?.textContent?.trim()) res.title.push(page)
    if (!doc.querySelector('meta[name="viewport"]')) res.viewport.push(page)
    const h1 = doc.querySelectorAll('h1').length
    if (h1 !== 1) res.h1.push(`${page}: ${h1} <h1>`)
    doc.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('alt')) res.alt.push(`${page}: <img src="${img.getAttribute('src') ?? ''}">`)
    })
    doc.querySelectorAll('input, select, textarea').forEach((el) => {
      const type = el.getAttribute('type')
      if (type && /^(hidden|submit|button|reset|image)$/i.test(type)) return
      const id = el.getAttribute('id')
      const labelled = (id && doc.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
      if (!labelled) res.labels.push(`${page}: <${el.tagName.toLowerCase()}${id ? ` id="${id}"` : ''}>`)
    })
    doc.querySelectorAll('a').forEach((a) => {
      if (!a.textContent?.trim() && !a.getAttribute('aria-label') && !a.querySelector('img[alt]:not([alt=""])')) res.emptyLinks.push(`${page}: <a href="${a.getAttribute('href') ?? ''}">`)
    })
    let prev = 0
    doc.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
      const lvl = Number(h.tagName[1])
      if (prev && lvl > prev + 1) res.headings.push(`${page}: <${h.tagName.toLowerCase()}> setelah <h${prev}>`)
      prev = lvl
    })
    const text = doc.body?.textContent ?? ''
    const ph = text.match(/\[(GANTI|Nama[^\]]*|Inisial|Program \d|Nama Destinasi \d)\]/g)
    if (ph) res.placeholder.push(`${page}: ${ph.length} placeholder (mis. ${ph[0]})`)

    const refs: string[] = []
    doc.querySelectorAll('[src]').forEach((e) => refs.push(e.getAttribute('src')!))
    doc.querySelectorAll('link[href], a[href]').forEach((e) => refs.push(e.getAttribute('href')!))
    doc.querySelectorAll('[poster]').forEach((e) => refs.push(e.getAttribute('poster')!))
    for (const r of refs) {
      const p = resolveRef(dir, r)
      if (p && !allPaths.has(p)) res.missing.push(`${page} → ${r}`)
    }
  }

  for (const [path, css] of texts) {
    if (!/\.css$/i.test(path)) continue
    for (const m of css.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)) {
      const p = resolveRef(dirOf(path), m[2])
      if (p && !allPaths.has(p)) res.missing.push(`${path} → ${m[2]}`)
    }
  }

  const item = (id: string, label: string, details: string[], level: 'fail' | 'warn', testId?: string): AuditItem => ({ id, label, status: details.length ? level : 'pass', details: [...new Set(details)], testId })

  if (!pages.length) return [{ id: 'pages', label: 'Proyek punya minimal satu halaman HTML', status: 'fail', details: ['Belum ada file .html'] }]

  return [
    item('missing', 'Semua file lokal yang dirujuk tersedia (src, href, url())', res.missing, 'fail', 't-links'),
    item('alt', 'Semua gambar punya atribut alt', res.alt, 'fail', 't-alt'),
    item('lang', '<html> punya atribut lang', res.lang, 'warn'),
    item('title', 'Setiap halaman punya <title>', res.title, 'warn'),
    item('viewport', 'Meta viewport tersedia (tampilan ponsel)', res.viewport, 'fail'),
    item('h1', 'Tepat satu <h1> per halaman', res.h1, 'warn'),
    item('headings', 'Tingkat heading tidak melompat', res.headings, 'warn'),
    item('labels', 'Setiap input punya label', res.labels, 'fail'),
    item('emptyLinks', 'Setiap link punya teks', res.emptyLinks, 'warn'),
    item('placeholder', 'Tidak ada placeholder [GANTI] yang tersisa', res.placeholder, 'warn'),
  ]
}
