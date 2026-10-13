import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { parseEnvOutput } from '../lib/envCheck'
import { createInitialState, sanitizeState } from '../lib/storage'
import { _resetDbForTests, getFolderHandle, removeFolderHandle, saveFolderHandle } from '../workspace/db'
import { compareWithFolder, scanFolder, writeToFolder, type DirLike, type FileLike } from '../workspace/localFolder'
import { sha256 } from '../workspace/hash'

/** Folder palsu di memori dengan API yang sama seperti FileSystemDirectoryHandle. */
function fakeDir(name: string, tree: Record<string, string | Uint8Array> = {}): DirLike & { dump: () => Record<string, string> } {
  const files = new Map<string, string | Uint8Array>(Object.entries(tree))
  const make = (prefix: string, dname: string): DirLike & { dump: () => Record<string, string> } => ({
    kind: 'directory',
    name: dname,
    async *values() {
      const seen = new Set<string>()
      for (const p of [...files.keys()].sort()) {
        if (!p.startsWith(prefix)) continue
        const rest = p.slice(prefix.length)
        const [head, ...tail] = rest.split('/')
        if (tail.length) {
          if (!seen.has(head)) {
            seen.add(head)
            yield make(prefix + head + '/', head)
          }
        } else yield fileHandle(prefix + head, head)
      }
    },
    async getDirectoryHandle(n: string) {
      return make(prefix + n + '/', n)
    },
    async getFileHandle(n: string) {
      return fileHandle(prefix + n, n)
    },
    dump: () => Object.fromEntries([...files].map(([k, v]) => [k, typeof v === 'string' ? v : `<${v.length} bytes>`])),
  })
  const fileHandle = (path: string, n: string): FileLike => ({
    kind: 'file',
    name: n,
    async getFile() {
      const v = files.get(path) ?? ''
      return new File([v as BlobPart], n)
    },
    async createWritable() {
      return {
        async write(d: Blob | string) {
          files.set(path, typeof d === 'string' ? d : new Uint8Array(await d.arrayBuffer()))
        },
        async close() {},
      }
    },
  })
  return make('', name)
}

describe('local folder', () => {
  it('scans recursively and skips node_modules / hidden folders', async () => {
    const dir = fakeDir('web', { 'index.html': '<h1>a</h1>', 'css/style.css': 'body{}', 'node_modules/x/index.js': 'x', '.git/HEAD': 'ref', 'assets/logo.png': new Uint8Array([1, 2, 3]) })
    const r = await scanFolder(dir)
    expect(r.sources.map((s) => s.relPath)).toEqual(['assets/logo.png', 'css/style.css', 'index.html'])
    expect(r.skipped.sort()).toEqual(['.git/', 'node_modules/'])
    expect(r.truncated).toBe(false)
  })

  it('compares text directly and binaries by SHA-256', async () => {
    const png = new Uint8Array([1, 2, 3])
    const dir = fakeDir('web', { 'index.html': '<h1>lama</h1>', 'about.html': 'x', 'logo.png': png, 'notes.unknown': 'x' })
    const hash = await sha256(png)
    const rows = await compareWithFolder(
      [
        { path: 'index.html', text: '<h1>baru</h1>', size: 13 },
        { path: 'logo.png', blobHash: hash, size: 3 },
        { path: 'kontak.html', text: 'k', size: 1 },
      ],
      (await scanFolder(dir)).sources,
    )
    expect(Object.fromEntries(rows.map((r) => [r.path, r.status]))).toEqual({ 'about.html': 'onlyFolder', 'index.html': 'different', 'kontak.html': 'onlyProject', 'logo.png': 'same' })
  })

  it('writes nested files and refuses unsafe paths', async () => {
    const dir = fakeDir('web')
    expect(await writeToFolder(dir, [{ path: 'index.html', data: 'a' }, { path: 'css/style.css', data: 'b' }])).toBe(2)
    expect(dir.dump()).toEqual({ 'index.html': 'a', 'css/style.css': 'b' })
    await expect(writeToFolder(dir, [{ path: '../luar.txt', data: 'x' }])).rejects.toThrow('Path tidak valid')
  })

  it('stores the folder link per project in IndexedDB', async () => {
    await _resetDbForTests()
    const plain = { kind: 'directory', name: 'website-sekolah' } as unknown as DirLike
    await saveFolderHandle('p1', plain)
    expect((await getFolderHandle('p1'))?.name).toBe('website-sekolah')
    await removeFolderHandle('p1')
    expect(await getFolderHandle('p1')).toBeUndefined()
  })
})

describe('environment check', () => {
  it('parses real-world outputs', () => {
    expect(parseEnvOutput('git', 'git version 2.47.1.windows.1')).toMatchObject({ status: 'ok', version: '2.47.1' })
    expect(parseEnvOutput('node', 'v22.12.0')).toMatchObject({ status: 'ok', version: '22.12.0' })
    expect(parseEnvOutput('node', 'v18.19.0').status).toBe('old')
    expect(parseEnvOutput('node', 'v20.11.1').status).toBe('old') // Vite butuh 20.19+
    expect(parseEnvOutput('npm', '10.9.2').status).toBe('ok')
    expect(parseEnvOutput('code', '1.96.2\nfabdb6a30b49f79a7aba0f2ad9df9b399473380f\nx64').status).toBe('ok')
    expect(parseEnvOutput('git', "'git' is not recognized as an internal or external command").status).toBe('missing')
    expect(parseEnvOutput('node', 'bash: node: command not found').status).toBe('missing')
    expect(parseEnvOutput('npm', 'halo').status).toBe('unknown')
  })

  it('sanitizes local workflow progress', () => {
    const s = sanitizeState({ ...createInitialState(), local: { steps: { env: new Date().toISOString(), bad: 'x' }, env: { node: '22.12.0', git: '<script>' } } })
    expect(Object.keys(s.local.steps)).toEqual(['env'])
    expect(s.local.env).toEqual({ node: '22.12.0' })
  })
})
