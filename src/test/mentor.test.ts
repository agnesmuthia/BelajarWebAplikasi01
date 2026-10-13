import { describe, expect, it } from 'vitest'
import { CHALLENGES } from '../data/challenges'
import { ALL_LESSONS, MODULES } from '../data/curriculum'
import { findTemplate } from '../data/projects'
import { buildReadme, buildTestSkeleton, findFunctions, guessType, lintCommit, suggestCommit } from '../mentor/helpers'
import { reviewCode } from '../mentor/review'

const ids = (fs: { id: string }[]) => fs.map((f) => f.id)

describe('Mentor lokal — review kode', () => {
  it('menemukan masalah keamanan & kualitas JavaScript', () => {
    const js = `var nama = input.value\nif (nama == '') alert('kosong')\nel.innerHTML = '<b>' + nama + '</b>'\nsetTimeout("jalan()", 100)\nfetch('/api/x').then(r => r.json())\nlocalStorage.setItem('password', p)`
    const f = ids(reviewCode([{ path: 'app.js', text: js }]))
    for (const id of ['var', 'loose-eq', 'alert', 'innerhtml', 'timeout-string', 'fetch-ok', 'fetch-catch', 'storage-secret']) expect(f).toContain(id)
  })

  it('tidak menandai pola yang aman', () => {
    const js = `const nama = input.value\nif (nama === '') status.textContent = 'kosong'\ndaftar.innerHTML = ''\nasync function muat() {\n  try {\n    const res = await fetch('/api/x')\n    if (!res.ok) throw new Error('x')\n  } catch (e) {}\n}`
    expect(reviewCode([{ path: 'app.js', text: js }])).toEqual([])
  })

  it('CSS: outline dihapus & hover tanpa focus', () => {
    const f = ids(reviewCode([{ path: 'style.css', text: 'a:hover { color: red }\nbutton { outline: none; font-size: 12px }' }]))
    expect(f).toEqual(expect.arrayContaining(['outline-none', 'hover-only', 'tiny-font']))
  })

  it('HTML: aksesibilitas, performa, dan rahasia', () => {
    const html = '<!doctype html><html><head><title>x</title></head><body><img src="a.jpg"><a href="https://x.id" target="_blank">x</a><script>const key = "ghp_abcdefghijklmnopqrstuvwxyz0123456789"</script></body></html>'
    const f = reviewCode([{ path: 'index.html', text: html }])
    expect(ids(f)).toEqual(expect.arrayContaining(['blank-rel', 'img-lazy', 'img-size', 'audit-lang', 'audit-alt', 'deploy-secrets']))
    expect(f[0].level).toBe('penting')
  })

  it('template proyek bawaan tidak punya temuan "penting" di JavaScript', () => {
    for (const id of ['school-profile', 'takalar-tourism', 'dev-portfolio', 'fs-crud', 'fs-auth']) {
      const t = findTemplate(id)!
      const js = t.files.filter((f) => f.path.endsWith('.js')).map((f) => ({ path: f.path, text: f.content }))
      expect(reviewCode(js).filter((x) => x.level === 'penting').map((x) => `${id}: ${x.id}`)).toEqual([])
    }
  })
})

describe('Mentor lokal — commit, README, tes', () => {
  it('menebak jenis & membuat pesan Conventional Commit', () => {
    expect(guessType([{ path: 'README.md', status: 'mod' }])).toBe('docs')
    expect(guessType([{ path: 'css/style.css', status: 'mod' }])).toBe('style')
    expect(guessType([{ path: '.github/workflows/ci.yml', status: 'add' }])).toBe('chore')
    expect(guessType([{ path: 'js/app.js', status: 'mod' }])).toBe('feat')
    const msg = suggestCommit([{ path: 'js/app.js', status: 'mod', added: 3, removed: 1 }, { path: 'js/api.js', status: 'add', added: 10 }], 'Tambah validasi email.')
    expect(msg.split('\n')[0]).toBe('feat(js): tambah validasi email')
    expect(msg).toContain('- ubah js/app.js (+3/-1)')
    expect(lintCommit(msg.split('\n')[0])).toEqual([])
  })

  it('memeriksa pesan commit yang buruk', () => {
    expect(lintCommit('update')[0]).toMatch(/terlalu umum/)
    expect(lintCommit('fix: menambahkan tombol.').join(' ')).toMatch(/titik.*perintah|perintah.*titik/s)
    expect(lintCommit('feat: tambah koneksi api_key=abc').join(' ')).toMatch(/rahasia/)
    expect(lintCommit('x'.repeat(80))[0]).toMatch(/72/)
  })

  it('README berisi bagian penting tanpa rahasia', () => {
    const md = buildReadme({ name: 'Inventaris', description: 'Aplikasi stok.', technologies: ['HTML'], features: ['Tambah barang'], files: ['index.html', 'api/config.json', '.gitignore'], hasApi: true, deployUrl: 'https://contoh.netlify.app' })
    expect(md).toMatch(/^# Inventaris/)
    for (const h of ['## Fitur', '## Teknologi', '## Menjalankan di komputer', '## Backend', '## Struktur file', '## Sumber aset']) expect(md).toContain(h)
    expect(md).not.toContain('.gitignore')
  })

  it('kerangka tes mengenali fungsi & async', () => {
    const code = 'export function diskon(harga, persen = 0) {}\nconst muat = async (url) => {}\nconst dua = x => x * 2'
    expect(findFunctions(code)).toEqual([
      { name: 'diskon', params: ['harga', 'persen'], isAsync: false },
      { name: 'muat', params: ['url'], isAsync: true },
      { name: 'dua', params: ['x'], isAsync: false },
    ])
    const t = buildTestSkeleton(code, 'js/harga.js')
    expect(t).toContain("import { diskon, muat, dua } from './harga'")
    expect(t).toContain('await muat(')
  })
})

describe('integritas kurikulum', () => {
  const ROUTES = [/^\/local$/, /^\/deploy$/, /^\/mentor(\?tab=\w+)?$/, /^\/fullstack(\?tab=\w+)?$/, /^\/lab\/c\/[\w-]+$/, /^\/projects\/library\/[\w-]+$/, /^\/learn\/[\w-]+\/[\w-]+$/]
  it('semua modul berisi pelajaran dan tautan latihan valid', () => {
    for (const m of MODULES) expect(m.lessons.length, m.id).toBeGreaterThan(0)
    for (const l of ALL_LESSONS) {
      if (!l.practice) continue
      const to = l.practice.to
      expect(ROUTES.some((r) => r.test(to)), `${l.id} → ${to}`).toBe(true)
      const c = /^\/lab\/c\/(.+)$/.exec(to)?.[1]
      if (c) expect(CHALLENGES.some((x) => x.id === c)).toBe(true)
      const t = /^\/projects\/library\/(.+)$/.exec(to)?.[1]
      if (t) expect(findTemplate(t)).toBeTruthy()
      const lp = /^\/learn\/([\w-]+)\/([\w-]+)$/.exec(to)
      if (lp) expect(MODULES.find((m) => m.id === lp[1])?.lessons.some((x) => x.id === lp[2])).toBe(true)
    }
  })
  it('setiap pelajaran punya kuis dengan tepat satu jawaban benar per soal', () => {
    for (const l of ALL_LESSONS) for (const q of l.quiz) expect(q.options.filter((o) => o.correct).length, `${l.id}/${q.id}`).toBe(1)
  })
})
