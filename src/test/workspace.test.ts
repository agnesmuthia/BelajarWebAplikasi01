import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { auditProject } from '../workspace/audit'
import { compareFiles } from '../workspace/CheckpointPanel'
import { _resetDbForTests, createSnapshot, deletePaths, gcBlobs, getBlob, listFiles, listSnapshots, movePath, restoreSnapshot, seedProject, writeFiles } from '../workspace/db'
import { diffLines, diffStats } from '../workspace/diff'
import { planImport, stripCommonRoot, type ImportSource } from '../workspace/importer'
import { friendlyName, normalizePath, relativePath, resolvePath } from '../workspace/paths'
import { buildDocument } from '../lab/runtime'

const src = (relPath: string, size = 10): ImportSource => ({ relPath, size, read: async () => new Blob(['x']) })

describe('paths', () => {
  it('normalizes and rejects traversal', () => {
    expect(normalizePath('./css//style.css')).toBe('css/style.css')
    expect(normalizePath('../etc/passwd')).toBeNull()
    expect(normalizePath('/abs/file.html')).toBeNull()
    expect(normalizePath('C:/x.html')).toBeNull()
    expect(normalizePath('a/<b>.html')).toBeNull()
  })

  it('computes relative paths like a browser', () => {
    expect(relativePath('index.html', 'assets/logo.png')).toBe('assets/logo.png')
    expect(relativePath('css/style.css', 'assets/logo.png')).toBe('../assets/logo.png')
    expect(relativePath('pages/a/b.html', 'pages/c.html')).toBe('../c.html')
    expect(resolvePath('css', '../assets/x.png')).toBe('assets/x.png')
    expect(resolvePath('', 'https://x.com/a.png')).toBeNull()
    expect(resolvePath('', '../x')).toBeNull()
  })

  it('suggests web friendly names', () => {
    expect(friendlyName('Logo Sekolah.PNG')).toBe('logo-sekolah.png')
    expect(friendlyName('Café Ünik.jpg')).toBe('cafe-unik.jpg')
  })
})

describe('import planning', () => {
  it('tidies names, flags overwrites, skips unsafe or unsupported files', () => {
    const rows = planImport(
      [src('Proyek/index.html'), src('Proyek/Foto Saya.JPG'), src('Proyek/.git/config'), src('Proyek/virus.exe'), src('Proyek/big.png', 9e6), src('Proyek/node_modules/x.js')],
      { destFolder: '', existing: new Map([['index.html', 5]]), existingBytes: 5, tidyNames: true, keepExisting: new Set() },
    )
    const by = Object.fromEntries(rows.map((r) => [r.source.relPath, r]))
    expect(by['Proyek/index.html'].status).toBe('new') // belum di-strip → Proyek/index.html
    expect(by['Proyek/Foto Saya.JPG'].target).toBe('proyek/foto-saya.jpg')
    expect(by['Proyek/.git/config'].status).toBe('skip')
    expect(by['Proyek/virus.exe'].status).toBe('skip')
    expect(by['Proyek/big.png'].status).toBe('skip')
    expect(by['Proyek/node_modules/x.js'].status).toBe('skip')

    const stripped = planImport(stripCommonRoot([src('Proyek/index.html'), src('Proyek/css/a.css')]), {
      destFolder: '', existing: new Map([['index.html', 5]]), existingBytes: 5, tidyNames: false, keepExisting: new Set(),
    })
    expect(stripped.map((r) => [r.target, r.status])).toEqual([['index.html', 'overwrite'], ['css/a.css', 'new']])

    const kept = planImport([src('index.html')], { destFolder: '', existing: new Map([['index.html', 5]]), existingBytes: 5, tidyNames: false, keepExisting: new Set(['index.html']) })
    expect(kept[0].status).toBe('skip')
  })
})

describe('diff', () => {
  it('finds added and removed lines', () => {
    const d = diffLines('a\nb\nc', 'a\nB\nc\nd')!
    expect(diffStats(d)).toEqual({ added: 2, removed: 1 })
    expect(d.filter((l) => l.type === 'same').map((l) => l.text)).toEqual(['a', 'c'])
  })

  it('compares file lists like git status', () => {
    const before = [{ path: 'a.html', text: '1', mime: '', size: 1 }, { path: 'b.css', text: 'x', mime: '', size: 1 }]
    const after = [{ path: 'a.html', text: '2', mime: '', size: 1 }, { path: 'c.js', text: '', mime: '', size: 0 }]
    expect(compareFiles(before, after).map((c) => `${c.type}:${c.path}`)).toEqual(['modified:a.html', 'deleted:b.css', 'added:c.js'])
  })
})

describe('IndexedDB workspace', () => {
  beforeEach(async () => {
    await _resetDbForTests()
    indexedDB.deleteDatabase('devstudio-workspace')
  })

  it('seeds once, stores binary by hash, snapshots and restores', async () => {
    expect(await seedProject('p1', [{ path: 'index.html', content: '<h1>v1</h1>' }])).toBe(true)
    expect(await seedProject('p1', [{ path: 'index.html', content: 'lain' }])).toBe(false)
    expect((await listSnapshots('p1'))[0].message).toBe('Versi awal dari template')

    const img = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
    await writeFiles('p1', [{ path: 'assets/a.png', blob: img }, { path: 'assets/b.png', blob: img }, { path: 'index.html', text: '<h1>v2</h1>' }])
    const files = await listFiles('p1')
    const a = files.find((f) => f.path === 'assets/a.png')!
    expect(a.blobHash).toHaveLength(64)
    expect(a.blobHash).toBe(files.find((f) => f.path === 'assets/b.png')!.blobHash) // isi sama → satu blob
    // (Isi Blob tidak bisa diperiksa di jsdom + fake-indexeddb; sudah diuji di Chromium.)
    expect(await getBlob(a.blobHash!)).toBeDefined()

    const snap = await createSnapshot('p1', 'Tambah gambar')
    await movePath('p1', 'assets', 'img')
    expect((await listFiles('p1')).map((f) => f.path)).toEqual(['img/a.png', 'img/b.png', 'index.html'])
    await deletePaths('p1', ['img/a.png', 'img/b.png'])

    await restoreSnapshot('p1', snap.id)
    expect((await listFiles('p1')).map((f) => f.path)).toEqual(['assets/a.png', 'assets/b.png', 'index.html'])
    const snaps = await listSnapshots('p1')
    expect(snaps[0].auto).toBe(true) // checkpoint otomatis sebelum memulihkan
    expect(await gcBlobs()).toBe(0) // blob masih dipakai
  })

  it('refuses to move onto an existing file', async () => {
    await writeFiles('p2', [{ path: 'a.html', text: '' }, { path: 'b.html', text: '' }])
    await expect(movePath('p2', 'a.html', 'b.html')).rejects.toThrow('sudah ada')
  })
})

describe('multi-file build & audit', () => {
  const texts = new Map([
    ['index.html', '<!doctype html>\n<html lang="id">\n<head>\n<title>x</title>\n<meta name="viewport" content="x">\n<link rel="stylesheet" href="css/style.css">\n</head>\n<body>\n<h1>A</h1>\n<img src="assets/logo.png" alt="Logo">\n<img src="assets/hilang.png">\n<script src="js/app.js"></script>\n</body>\n</html>'],
    ['css/style.css', 'body {\n  background: url("../assets/logo.png");\n}'],
    ['js/app.js', 'console.log(1)\nthrow new Error("x")'],
  ])
  const assets = new Map([['assets/logo.png', 'data:image/png;base64,AAA']])

  it('inlines nested css/js, rewrites asset urls, reports missing files, maps lines', () => {
    const r = buildDocument({ entry: 'index.html', texts, assets })
    expect(r.linkedCss).toEqual(['css/style.css'])
    expect(r.linkedJs).toEqual(['js/app.js'])
    expect(r.html).toContain('src="data:image/png;base64,AAA"')
    expect(r.html).toContain('url("data:image/png;base64,AAA")')
    expect(r.missing).toEqual([{ from: 'index.html', ref: 'assets/hilang.png' }])
    const lines = r.html.split('\n')
    expect(r.mapLine(lines.findIndex((l) => l.includes('throw new Error')) + 1)).toEqual({ file: 'js/app.js', line: 2 })
    expect(r.mapLine(lines.findIndex((l) => l.includes('<h1>A</h1>')) + 1)).toEqual({ file: 'index.html', line: 9 })
  })

  it('audits accessibility and broken references', () => {
    const all = new Set([...texts.keys(), ...assets.keys()])
    const res = Object.fromEntries(auditProject(texts, all).map((i) => [i.id, i]))
    expect(res.alt.status).toBe('fail')
    expect(res.missing.details).toEqual(['index.html → assets/hilang.png'])
    expect(res.lang.status).toBe('pass')
    expect(res.h1.status).toBe('pass')
  })
})
