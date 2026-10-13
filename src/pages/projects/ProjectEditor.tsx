import {
  ArrowLeft,
  Download,
  Eye,
  FilePlus2,
  FolderInput,
  FolderPlus,
  GitCommitHorizontal,
  Info,
  ListChecks,
  Loader2,
  Pencil,
  Play,
  Terminal,
  Trash2,
  TriangleAlert,
  Upload,
  Wand2,
  XCircle,
  X,
  FileArchive,
  HardDrive,
  Server,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { cx } from '../../components/ui'
import { findTemplate } from '../../data/projects'
import { CodeEditor, type CodeEditorHandle, type EditorLang } from '../../lab/CodeEditor'
import { explainError, type ErrorHint } from '../../lab/errorHints'
import { canFormat, formatCode } from '../../lab/format'
import { buildDocument, LAB_SANDBOX, resolveRef, type DocLocation } from '../../lab/runtime'
import { buildZipEntries, downloadBlob, slugify } from '../../lib/download'
import { useStore } from '../../lib/store'
import { useToast } from '../../lib/toast'
import { AssetViewer } from '../../workspace/AssetViewer'
import { auditProject } from '../../workspace/audit'
import { AuditPanel } from '../../workspace/AuditPanel'
import { CheckpointPanel } from '../../workspace/CheckpointPanel'
import { createSnapshot, deletePaths, getBlob, movePath, writeFiles, writeText, type StoredFile } from '../../workspace/db'
import { FileTree, type TreeSelection } from '../../workspace/FileTree'
import { ImportDialog } from '../../workspace/ImportDialog'
import { LocalFolderPanel } from '../../workspace/LocalFolderPanel'
import { fromDataTransfer, fromFiles, fromZip, isZip, readForStore, type ImportSource, type PlanRow } from '../../workspace/importer'
import { basename, dirname, formatBytes, isTextKind, kindOf, normalizePath, type FileKind } from '../../workspace/paths'
import { assetDataUrls, useProjectFiles } from '../../workspace/useProjectFiles'
import { ApiPanel } from '../../fullstack/ApiPanel'
import { CONFIG_PATH } from '../../fullstack/mockApi'
import { useMockApi } from '../../fullstack/useMockApi'
import NotFound from '../NotFound'

type Level = 'log' | 'info' | 'warn' | 'error' | 'system'
interface Entry {
  id: number
  level: Level
  text: string
  loc?: DocLocation | null
  hint?: ErrorHint | null
}
type RightTab = 'preview' | 'console' | 'api' | 'audit' | 'checkpoint' | 'local'
type Pane = 'files' | 'code' | 'output'

const LANG: Partial<Record<FileKind, EditorLang>> = { html: 'html', css: 'css', js: 'js', json: 'json', md: 'md', text: 'text' }

const NEW_FILE_CONTENT: Record<string, (name: string) => string> = {
  html: (name) => `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <h1>${name}</h1>

  <p><a href="index.html">Kembali ke beranda</a></p>
</body>
</html>
`,
  css: () => '/* Gaya tambahan */\n',
  js: () => '// Kode JavaScript\n',
  md: (name) => `# ${name}\n`,
  json: () => '{\n}\n',
}

const newToken = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()).slice(2))

type PromptState = { kind: 'newFile' | 'newFolder' | 'rename'; folder: string; value: string; target?: TreeSelection } | null

export default function ProjectEditor() {
  const { projectId = '' } = useParams()
  const { state } = useStore()
  const project = state.projects.find((p) => p.id === projectId)
  if (!project || !findTemplate(project.templateId)) return <NotFound />
  return <Editor key={project.id} projectId={project.id} />
}

function Editor({ projectId }: { projectId: string }) {
  const { state, updateProject, updateSettings } = useStore()
  const project = state.projects.find((p) => p.id === projectId)!
  const tpl = findTemplate(project.templateId)!
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const { files, error } = useProjectFiles(projectId, project.templateId)
  const autoRun = state.settings.labAutoRun

  const [buffers, setBuffers] = useState<Record<string, string>>({})
  const [tabs, setTabs] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [selection, setSelection] = useState<TreeSelection | null>(null)
  const [pane, setPane] = useState<Pane>('code')
  const [right, setRight] = useState<RightTab>('preview')
  const [page, setPage] = useState<string | null>(null)
  const [doc, setDoc] = useState('')
  const [runKey, setRunKey] = useState(0)
  const [running, setRunning] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [prompt, setPrompt] = useState<PromptState>(null)
  const [toDelete, setToDelete] = useState<TreeSelection | null>(null)
  const [importing, setImporting] = useState<{ sources: ImportSource[]; origin: string; key: number; dest?: string; keepNames?: boolean } | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [formatting, setFormatting] = useState(false)

  const editor = useRef<CodeEditorHandle>(null)
  const iframe = useRef<HTMLIFrameElement>(null)
  const token = useRef('')
  const mapLine = useRef<(l: number) => DocLocation | null>(() => null)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const buffersRef = useRef(buffers)
  buffersRef.current = buffers
  const entryId = useRef(0)
  const pendingLine = useRef<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const zipInput = useRef<HTMLInputElement>(null)

  const byPath = useMemo(() => new Map((files ?? []).map((f) => [f.path, f])), [files])
  const paths = useMemo(() => (files ?? []).map((f) => f.path), [files])
  const htmlPages = useMemo(() => paths.filter((p) => /\.html?$/i.test(p)), [paths])
  const folders = useMemo(() => [...new Set(paths.flatMap((p) => p.split('/').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join('/'))))].sort(), [paths])
  const texts = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of files ?? []) if (f.text !== undefined) m.set(f.path, buffers[f.path] ?? f.text)
    return m
  }, [files, buffers])
  const apiConfigText = texts.get(CONFIG_PATH) ?? null
  const api = useMockApi({ scope: `project:${projectId}`, configText: apiConfigText, iframe, token })
  const dirty = useMemo(() => new Set(Object.entries(buffers).filter(([p, t]) => byPath.get(p)?.text !== t).map(([p]) => p)), [buffers, byPath])
  const currentSnapshot = useMemo(() => (files ?? []).map((f) => ({ path: f.path, text: f.text !== undefined ? (buffers[f.path] ?? f.text) : undefined, blobHash: f.blobHash, mime: f.mime, size: f.size })), [files, buffers])
  const totalBytes = useMemo(() => (files ?? []).reduce((a, f) => a + f.size, 0), [files])

  // Buka index.html saat pertama dimuat.
  useEffect(() => {
    if (!files || active) return
    const first = files.find((f) => f.path === 'index.html') ?? files.find((f) => f.text !== undefined)
    if (first) {
      setTabs([first.path])
      setActive(first.path)
      setSelection({ path: first.path, folder: false })
    }
    if (!page && files.some((f) => /\.html?$/i.test(f.path))) setPage(files.find((f) => f.path === 'index.html')?.path ?? files.find((f) => /\.html?$/i.test(f.path))!.path)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  // Datang dari "Impor dari komputer": tampilkan panel impor (pemilih file butuh klik pengguna).
  const showImportBanner = params.get('import') === '1'
  const hideImportBanner = () => setParams({}, { replace: true })

  /* ------------------------------ simpan ------------------------------ */

  const saveNow = useCallback(async (path: string) => {
    const t = timers.current.get(path)
    if (t) clearTimeout(t)
    timers.current.delete(path)
    const text = buffersRef.current[path]
    if (text !== undefined) await writeText(projectId, path, text)
  }, [projectId])

  const flush = useCallback(async () => {
    await Promise.all([...timers.current.keys()].map((p) => saveNow(p)))
  }, [saveNow])

  useEffect(() => () => void flush(), [flush])

  const onEdit = useCallback(
    (value: string) => {
      if (!active) return
      setBuffers((b) => (b[active] === value ? b : { ...b, [active]: value }))
      const prev = timers.current.get(active)
      if (prev) clearTimeout(prev)
      const path = active
      timers.current.set(path, setTimeout(() => void saveNow(path), 600))
    },
    [active, saveNow],
  )

  /* ------------------------------ preview ----------------------------- */

  const push = useCallback((e: Omit<Entry, 'id'>) => setEntries((prev) => (prev.length >= 300 ? prev : [...prev, { ...e, id: ++entryId.current }])), [])

  const run = useCallback(
    async (entry = page) => {
      if (!entry || !files) return
      setRunning(true)
      const { map, skipped } = await assetDataUrls(files)
      token.current = newToken()
      const r = buildDocument({ entry, texts, assets: map, token: token.current, api: texts.has(CONFIG_PATH) })
      mapLine.current = r.mapLine
      const sys: Entry[] = r.missing.map((m) => ({ id: ++entryId.current, level: 'warn', text: `${m.from} merujuk “${m.ref}”, tetapi file itu tidak ada di proyek. Periksa ejaan & folder (path relatif).` }))
      if (skipped.length) sys.push({ id: ++entryId.current, level: 'system', text: `${skipped.length} aset besar tidak dimuat di preview (batas 25 MB): ${skipped.slice(0, 3).join(', ')}` })
      setEntries(sys)
      setDoc(r.html)
      setRunKey((k) => k + 1)
    },
    [page, files, texts],
  )

  // Auto-run saat isi berubah.
  useEffect(() => {
    if (!autoRun && doc) return
    const t = setTimeout(() => void run(), doc ? 800 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texts, page, files])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as Record<string, unknown> | null
      if (!d || d.source !== 'devstudio-lab' || d.token !== token.current || e.source !== iframe.current?.contentWindow) return
      if (d.type === 'console') push({ level: (['log', 'info', 'warn', 'error'].includes(d.level as string) ? d.level : 'log') as Level, text: String(d.text ?? '') })
      else if (d.type === 'clear') setEntries([])
      else if (d.type === 'resource') push({ level: 'warn', text: String(d.text) })
      else if (d.type === 'ready') setRunning(false)
      else if (d.type === 'error') {
        const text = String(d.text ?? 'Error').replace(/^Uncaught /, '')
        const raw = d.loc as { file?: unknown; line?: unknown } | null
        const loc = raw && typeof raw.file === 'string' && typeof raw.line === 'number' ? { file: raw.file, line: raw.line } : typeof d.line === 'number' && d.line > 0 ? mapLine.current(d.line) : null
        push({ level: 'error', text, loc, hint: explainError(text) })
      } else if (d.type === 'navigate' && page) {
        const target = resolveRef(dirname(page), String(d.href))
        if (target && /\.html?$/i.test(target) && byPath.has(target)) {
          setPage(target)
          void run(target)
        } else push({ level: 'warn', text: `404 — halaman “${String(d.href)}” tidak ditemukan di proyek (dicari: ${target ?? '?'}).` })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [push, page, byPath, run])

  /* ------------------------------ editor ------------------------------ */

  const open = (path: string) => {
    setTabs((t) => (t.includes(path) ? t : [...t, path]))
    setActive(path)
    setSelection({ path, folder: false })
    setPane('code')
  }

  const closeTab = (path: string) => {
    void saveNow(path)
    setTabs((t) => {
      const next = t.filter((x) => x !== path)
      if (active === path) setActive(next[next.length - 1] ?? null)
      return next
    })
  }

  useEffect(() => {
    if (pendingLine.current !== null) {
      const l = pendingLine.current
      pendingLine.current = null
      requestAnimationFrame(() => editor.current?.goToLine(l))
    }
  }, [active])

  const goTo = (loc: DocLocation) => {
    if (!byPath.has(loc.file)) return
    if (active === loc.file) editor.current?.goToLine(loc.line)
    else {
      pendingLine.current = loc.line
      open(loc.file)
    }
    setPane('code')
  }

  const activeFile = active ? byPath.get(active) : undefined
  const activeKind = active ? kindOf(active) : null
  const activeLang = activeKind ? LANG[activeKind] : undefined

  const doFormat = async () => {
    if (!active || !activeLang || !canFormat(activeLang)) return
    setFormatting(true)
    try {
      onEdit(await formatCode(texts.get(active) ?? '', activeLang))
    } catch (e) {
      toast(`Format gagal — ada kesalahan penulisan: ${e instanceof Error ? e.message.split('\n')[0] : e}`, 'error')
    } finally {
      setFormatting(false)
    }
  }

  /* ------------------------- operasi file/folder ------------------------ */

  const currentFolder = selection ? (selection.folder ? selection.path : dirname(selection.path)) : ''

  const submitPrompt = async (e: FormEvent) => {
    e.preventDefault()
    if (!prompt) return
    const value = prompt.value.trim()
    try {
      if (prompt.kind === 'rename' && prompt.target) {
        const to = normalizePath(value)
        if (!to) throw new Error('Path tidak valid.')
        if (to === prompt.target.path) return setPrompt(null)
        if (!prompt.target.folder && kindOf(to) !== kindOf(prompt.target.path)) throw new Error('Ekstensi file harus tetap sama.')
        await flush()
        await movePath(projectId, prompt.target.path, to)
        const remap = (p: string) => (p === prompt.target!.path || p.startsWith(prompt.target!.path + '/') ? to + p.slice(prompt.target!.path.length) : p)
        setTabs((t) => t.map(remap))
        setActive((a) => (a ? remap(a) : a))
        setBuffers((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [remap(k), v])))
        setPage((p) => (p ? remap(p) : p))
        setSelection({ path: to, folder: prompt.target.folder })
        updateProject(projectId, {}, `Diubah nama: ${prompt.target.path} → ${to}`)
      } else {
        const path = normalizePath(prompt.folder ? `${prompt.folder}/${value}` : value)
        if (!path) throw new Error('Nama tidak valid. Gunakan huruf, angka, “-”, dan “.” — tanpa “..” atau karakter khusus.')
        if (prompt.kind === 'newFolder') {
          if (folders.includes(path)) throw new Error('Folder sudah ada.')
          await writeText(projectId, `${path}/.gitkeep`, '')
          setSelection({ path, folder: true })
        } else {
          const kind = kindOf(path)
          if (!isTextKind(kind)) throw new Error('File baru harus berupa file teks (.html, .css, .js, .json, .md, .txt). Gambar ditambahkan lewat Impor.')
          if (byPath.has(path)) throw new Error('File dengan nama itu sudah ada.')
          await writeText(projectId, path, NEW_FILE_CONTENT[kind!]?.(basename(path).replace(/\.\w+$/, '')) ?? '')
          open(path)
          updateProject(projectId, {}, `File baru: ${path}`)
        }
      }
      setPrompt(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error')
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    const targets = toDelete.folder ? paths.filter((p) => p.startsWith(toDelete.path + '/')) : [toDelete.path]
    await flush()
    await createSnapshot(projectId, `Otomatis: sebelum menghapus ${toDelete.path}`, true)
    await deletePaths(projectId, targets)
    setTabs((t) => t.filter((x) => !targets.includes(x)))
    if (active && targets.includes(active)) setActive(null)
    setBuffers((b) => Object.fromEntries(Object.entries(b).filter(([k]) => !targets.includes(k))))
    if (page && targets.includes(page)) setPage(null)
    setSelection(null)
    setToDelete(null)
    updateProject(projectId, {}, `Dihapus: ${toDelete.path}${toDelete.folder ? '/' : ''}`)
    toast(`${targets.length} file dihapus. Bisa dipulihkan dari checkpoint otomatis.`, 'info')
  }

  /* ------------------------------- impor ------------------------------- */

  const startImport = async (sources: ImportSource[], origin: string, dest?: string, keepNames = false) => {
    try {
      if (sources.length === 1 && isZip(sources[0].relPath)) {
        sources = await fromZip(await sources[0].read())
        origin = `${origin} (ZIP diekstrak)`
      }
      if (!sources.length) return toast('Tidak ada file untuk diimpor.', 'info')
      setImporting({ sources, origin, key: Date.now(), dest, keepNames })
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error')
    }
  }

  const confirmImport = async (rows: PlanRow[]) => {
    setImportBusy(true)
    try {
      await flush()
      if (rows.some((r) => r.status === 'overwrite')) await createSnapshot(projectId, 'Otomatis: sebelum impor (menimpa file)', true)
      const items = await Promise.all(rows.map(readForStore))
      await writeFiles(projectId, items)
      setBuffers((b) => Object.fromEntries(Object.entries(b).filter(([k]) => !rows.some((r) => r.target === k))))
      updateProject(projectId, {}, `Impor ${rows.length} file`)
      toast(`${rows.length} file diimpor.`)
      setImporting(null)
      if (showImportBanner) hideImportBanner()
      const first = rows.find((r) => r.kind === 'image') ?? rows[0]
      if (first) open(first.target)
    } catch (e) {
      toast(`Impor gagal: ${e instanceof Error ? e.message : e}. Ruang penyimpanan browser mungkin penuh.`, 'error')
    } finally {
      setImportBusy(false)
    }
  }

  const onDrop = async (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!e.dataTransfer?.types.includes('Files')) return
    await startImport(await fromDataTransfer(e.dataTransfer), 'Dari drag & drop')
  }

  /* ------------------------------ unduh ------------------------------- */

  const downloadZip = async () => {
    await flush()
    const entries = await Promise.all(
      (files ?? []).map(async (f: StoredFile) => ({
        path: f.path,
        data: f.text !== undefined ? (buffers[f.path] ?? f.text) : new Uint8Array(await ((await getBlob(f.blobHash!)) ?? new Blob()).arrayBuffer()),
      })),
    )
    const slug = slugify(project.name)
    downloadBlob(new Blob([buildZipEntries(slug, entries) as BlobPart], { type: 'application/zip' }), `${slug}.zip`)
  }

  /* ------------------------------- render ------------------------------ */

  if (error) return <p className="card m-4 p-6 text-sm text-rose-600">Tidak bisa membuka penyimpanan proyek: {error}</p>
  if (!files) return <p className="muted p-6 text-sm"><Loader2 className="mr-2 inline size-4 animate-spin" />Memuat file proyek…</p>

  const errorCount = entries.filter((e) => e.level === 'error').length
  const audit = right === 'audit' ? auditProject(texts, new Set(paths)) : []
  const testTitles = Object.fromEntries(tpl.testing.map((t) => [t.id, t.title]))

  return (
    <div
      className="relative flex h-full min-h-0 flex-col gap-3"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setDragging(true)
        }
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={onDrop}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-500/10 backdrop-blur-sm">
          <p className="card px-6 py-4 text-center font-medium"><Upload className="mx-auto mb-2 size-6 text-indigo-500" />Lepaskan file, folder, atau ZIP untuk diimpor</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <Link to={`/projects/${projectId}`} className="btn-ghost px-2 py-1.5" aria-label="Kembali ke ringkasan proyek"><ArrowLeft className="size-4" /></Link>
        <h1 className="min-w-0 flex-1 truncate font-semibold text-slate-900 dark:text-white">{project.name}</h1>
        <span className="muted hidden text-xs sm:inline" aria-live="polite">{dirty.size ? `${dirty.size} file belum tersimpan…` : 'Semua perubahan tersimpan'}</span>
        <button className="btn-secondary px-3 py-1.5" onClick={() => void downloadZip()}><Download className="size-4" /> ZIP</button>
      </div>

      {showImportBanner && (
        <div className="card flex flex-col gap-3 border-indigo-300 p-4 sm:flex-row sm:items-center dark:border-indigo-500/40">
          <Upload className="size-6 shrink-0 text-indigo-500" />
          <div className="flex-1 text-sm">
            <p className="font-medium">Impor proyek dari komputermu</p>
            <p className="muted">Pilih folder proyek atau file ZIP, atau seret ke halaman ini. Kamu akan melihat pratinjau sebelum file disimpan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => folderInput.current?.click()}><FolderInput className="size-4" /> Pilih folder</button>
            <button className="btn-secondary" onClick={() => zipInput.current?.click()}><FileArchive className="size-4" /> Pilih ZIP</button>
            <button className="btn-ghost p-2" onClick={hideImportBanner} aria-label="Tutup"><X className="size-4" /></button>
          </div>
        </div>
      )}

      <div role="tablist" aria-label="Panel editor proyek" className="grid grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 lg:hidden dark:border-white/10 dark:bg-white/5">
        {(['files', 'code', 'output'] as Pane[]).map((p) => (
          <button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={cx('rounded-lg py-1.5 text-sm font-medium', pane === p ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300')}>
            {p === 'files' ? 'File' : p === 'code' ? 'Kode' : 'Hasil'}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]">
        {/* File tree */}
        <aside className={cx('card min-h-[50dvh] flex-col overflow-hidden lg:flex lg:min-h-0', pane === 'files' ? 'flex' : 'hidden')} aria-label="File proyek">
          <div className="flex items-center border-b border-slate-200 p-1.5 dark:border-white/10">
            <button className="btn-ghost p-1" title="File baru" aria-label="File baru" onClick={() => setPrompt({ kind: 'newFile', folder: currentFolder, value: '' })}><FilePlus2 className="size-4" /></button>
            <button className="btn-ghost p-1" title="Folder baru" aria-label="Folder baru" onClick={() => setPrompt({ kind: 'newFolder', folder: currentFolder, value: '' })}><FolderPlus className="size-4" /></button>
            <button className="btn-ghost p-1" title="Impor file" aria-label="Impor file" onClick={() => fileInput.current?.click()}><Upload className="size-4" /></button>
            <button className="btn-ghost p-1" title="Impor folder" aria-label="Impor folder" onClick={() => folderInput.current?.click()}><FolderInput className="size-4" /></button>
            <button className="btn-ghost p-1" title="Impor ZIP" aria-label="Impor ZIP" onClick={() => zipInput.current?.click()}><FileArchive className="size-4" /></button>
            <span className="flex-1" />
            <button className="btn-ghost p-1" title="Ubah nama" aria-label="Ubah nama" disabled={!selection} onClick={() => selection && setPrompt({ kind: 'rename', folder: '', value: selection.path, target: selection })}><Pencil className="size-4" /></button>
            <button className="btn-ghost p-1 text-rose-600 dark:text-rose-400" title="Hapus" aria-label="Hapus" disabled={!selection} onClick={() => selection && setToDelete(selection)}><Trash2 className="size-4" /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-1.5">
            <FileTree paths={paths} selected={selection} dirty={dirty} onSelect={(s) => (s.folder ? setSelection(s) : open(s.path))} />
          </div>
          <p className="muted border-t border-slate-200 p-2 text-[11px] dark:border-white/10">
            {paths.length} file · {formatBytes(totalBytes)} dari 50 MB · seret file ke sini untuk impor
          </p>
          <input ref={fileInput} type="file" multiple className="hidden" aria-label="Pilih file untuk diimpor" tabIndex={-1} onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) void startImport(fromFiles(f), 'Dari “Pilih file”') }} />
          <input ref={folderInput} type="file" className="hidden" aria-label="Pilih folder untuk diimpor" tabIndex={-1} {...({ webkitdirectory: '', directory: '' } as Record<string, string>)} onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) void startImport(fromFiles(f), 'Dari “Pilih folder”') }} />
          <input ref={zipInput} type="file" accept=".zip,application/zip" className="hidden" aria-label="Pilih file ZIP untuk diimpor" tabIndex={-1} onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) void startImport(fromFiles(f), 'Dari file ZIP') }} />
        </aside>

        {/* Editor */}
        <section className={cx('card min-h-[60dvh] flex-col overflow-hidden lg:flex lg:min-h-0', pane === 'code' ? 'flex' : 'hidden')} aria-label="Editor">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-2 pt-2 dark:border-white/10" role="tablist" aria-label="File terbuka">
            {tabs.map((t) => (
              <div key={t} className={cx('-mb-px flex shrink-0 items-center rounded-t-lg border border-b-0', active === t ? 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-ink-950' : 'border-transparent')}>
                <button role="tab" aria-selected={active === t} onClick={() => open(t)} title={t} className={cx('py-1.5 pr-1 pl-3 font-mono text-xs', active === t ? 'text-indigo-700 dark:text-cyan-300' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white')}>
                  {basename(t)}{dirty.has(t) && ' •'}
                </button>
                <button className="mr-1 rounded p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10" onClick={() => closeTab(t)} aria-label={`Tutup ${t}`}><X className="size-3" /></button>
              </div>
            ))}
          </div>
          <div className="code-surface relative min-h-0 flex-1">
            {!activeFile ? (
              <p className="muted p-4 text-sm">Pilih file di panel kiri.</p>
            ) : activeLang ? (
              <CodeEditor ref={editor} file={activeFile.path} lang={activeLang} value={texts.get(activeFile.path) ?? ''} onChange={onEdit} onRun={() => void run()} onFormat={() => void doFormat()} label={`Editor ${activeFile.path}`} />
            ) : (
              <AssetViewer file={activeFile} allPaths={paths} />
            )}
          </div>
          {activeFile && activeLang && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200 p-2 dark:border-white/10">
              <button className="btn-primary px-3 py-1.5" onClick={() => { void run(); setPane('output') }}><Play className="size-4" /> Run</button>
              {canFormat(activeLang) && (
                <button className="btn-secondary px-3 py-1.5" onClick={() => void doFormat()} disabled={formatting}>{formatting ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} Format</button>
              )}
              <span className="muted truncate font-mono text-[11px]">{activeFile.path}</span>
              <label className="muted ml-auto flex cursor-pointer items-center gap-1.5 text-xs">
                <input type="checkbox" className="accent-indigo-600" checked={autoRun} onChange={(e) => updateSettings({ labAutoRun: e.target.checked })} /> Auto-run
              </label>
            </div>
          )}
        </section>

        {/* Output */}
        <section className={cx('card min-h-[60dvh] flex-col overflow-hidden lg:flex lg:min-h-0', pane === 'output' ? 'flex' : 'hidden')} aria-label="Hasil">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-2 pt-2 dark:border-white/10" role="tablist" aria-label="Panel hasil">
            {([
              ['preview', 'Preview', Eye],
              ['console', 'Console', Terminal],
              ['api', 'API', Server],
              ['audit', 'Pemeriksaan', ListChecks],
              ['checkpoint', 'Checkpoint', GitCommitHorizontal],
              ['local', 'Folder lokal', HardDrive],
            ] as [RightTab, string, typeof Eye][]).map(([id, label, Icon]) => (
              <button key={id} role="tab" aria-selected={right === id} onClick={() => setRight(id)} className={cx('-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-1.5 text-xs font-medium', right === id ? 'border-indigo-500 text-indigo-700 dark:text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white')}>
                <Icon className="size-3.5" /> {label}
                {id === 'console' && entries.length > 0 && <span className={cx('rounded-full px-1.5 text-[10px]', errorCount ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-white/10')}>{errorCount || entries.length}</span>}
              </button>
            ))}
            {running && <Loader2 className="ml-auto size-3.5 shrink-0 animate-spin text-slate-400" aria-label="Menjalankan" />}
          </div>

          {right === 'preview' && htmlPages.length > 0 && (
            <div className="flex items-center gap-2 border-b border-slate-200 px-2 py-1.5 dark:border-white/10">
              <label htmlFor="page" className="muted text-xs">Halaman</label>
              <select id="page" className="input w-auto py-1 font-mono text-xs" value={page ?? ''} onChange={(e) => setPage(e.target.value)}>
                {htmlPages.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          <div className="relative min-h-0 flex-1">
            {htmlPages.length === 0 ? (
              <p className="muted p-4 text-sm">Belum ada halaman HTML. Buat <code className="font-mono">index.html</code> untuk melihat preview.</p>
            ) : (
              <iframe key={runKey} ref={iframe} title={`Preview ${project.name}`} sandbox={LAB_SANDBOX} srcDoc={doc} className={cx('absolute inset-0 h-full w-full bg-white', right !== 'preview' && 'invisible')} />
            )}

            {right === 'console' && (
              <div className="code-surface absolute inset-0 overflow-y-auto font-mono text-[12.5px]" role="log" aria-label="Output console">
                {entries.length === 0 ? (
                  <p className="muted p-4 font-sans text-sm">Console kosong untuk halaman {page}.</p>
                ) : (
                  <ul>
                    {entries.map((e) => (
                      <li key={e.id} className={cx('border-b px-3 py-1.5 whitespace-pre-wrap [overflow-wrap:anywhere]', e.level === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200' : e.level === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200' : e.level === 'system' ? 'border-cyan-200 bg-cyan-50 font-sans text-cyan-900 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200' : 'border-slate-200 dark:border-white/5')}>
                        <div className="flex items-start gap-2">
                          {e.level === 'error' ? <XCircle className="mt-0.5 size-3.5 shrink-0" /> : e.level === 'warn' ? <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> : e.level === 'system' ? <Info className="mt-0.5 size-3.5 shrink-0" /> : <span className="mt-0.5 text-slate-400">›</span>}
                          <span className="flex-1">{e.text}</span>
                          {e.loc && byPath.has(e.loc.file) && <button className="shrink-0 font-sans text-[11px] underline" onClick={() => goTo(e.loc!)}>{e.loc.file}:{e.loc.line}</button>}
                        </div>
                        {e.hint && <div className="mt-1.5 ml-5 rounded-md bg-white/70 p-2 font-sans text-[12.5px] text-slate-700 dark:bg-black/20 dark:text-slate-200"><b>{e.hint.title}.</b> {e.hint.hint}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {right === 'api' && (
              <div className="absolute inset-0 overflow-hidden bg-white dark:bg-ink-900">
                <ApiPanel api={api} />
              </div>
            )}

            {right === 'audit' && (
              <div className="absolute inset-0 overflow-y-auto bg-white dark:bg-ink-900">
                <AuditPanel items={audit} testTitles={testTitles} consoleErrors={errorCount} />
              </div>
            )}

            {right === 'local' && (
              <div className="absolute inset-0 overflow-y-auto bg-white dark:bg-ink-900">
                <LocalFolderPanel
                  projectId={projectId}
                  files={files}
                  textOf={(p) => buffers[p]}
                  flush={flush}
                  onPull={(sources, origin) => void startImport(sources, origin, '', true)}
                  onPushed={(n, folder) => updateProject(projectId, {}, `Disimpan ke folder lokal “${folder}”: ${n} file`)}
                />
              </div>
            )}

            {right === 'checkpoint' && (
              <div className="absolute inset-0 overflow-y-auto bg-white dark:bg-ink-900">
                <CheckpointPanel
                  projectId={projectId}
                  current={currentSnapshot}
                  flush={flush}
                  onCheckpoint={(m) => { updateProject(projectId, {}, `Checkpoint: ${m}`); toast('Checkpoint disimpan.') }}
                  onRestored={(m) => { setBuffers({}); updateProject(projectId, {}, `Dipulihkan ke checkpoint “${m}”`); toast('Checkpoint dipulihkan.') }}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      <Modal open={prompt !== null} onClose={() => setPrompt(null)} title={prompt?.kind === 'newFile' ? 'File baru' : prompt?.kind === 'newFolder' ? 'Folder baru' : 'Ubah nama / pindahkan'}>
        {prompt && (
          <form onSubmit={(e) => void submitPrompt(e)} className="space-y-3">
            <div>
              <label htmlFor="prompt-name" className="mb-1.5 block text-sm font-medium">
                {prompt.kind === 'rename' ? 'Path baru' : 'Nama'} {prompt.kind !== 'rename' && <span className="muted font-normal">di {prompt.folder ? `${prompt.folder}/` : 'folder utama'}</span>}
              </label>
              <input id="prompt-name" className="input font-mono" autoFocus value={prompt.value} onChange={(e) => setPrompt({ ...prompt, value: e.target.value })} placeholder={prompt.kind === 'newFile' ? 'kontak.html' : prompt.kind === 'newFolder' ? 'images' : ''} />
              <p className="muted mt-1.5 text-xs">
                {prompt.kind === 'newFolder'
                  ? 'Folder kosong disimpan dengan file .gitkeep — konvensi Git, karena Git tidak menyimpan folder kosong.'
                  : prompt.kind === 'rename'
                    ? 'Ubah bagian folder untuk memindahkan, mis. “gambar/logo.png” → “assets/logo.png”. Ingat perbarui src/href yang merujuk file ini!'
                    : 'Gunakan huruf kecil tanpa spasi. Boleh menyertakan folder, mis. “pages/kontak.html”.'}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setPrompt(null)}>Batal</button>
              <button className="btn-primary" disabled={!prompt.value.trim()}>Simpan</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title={`Hapus ${toDelete?.folder ? 'folder' : 'file'}?`}>
        <p className="muted text-sm">
          <span className="font-mono">{toDelete?.path}</span>
          {toDelete?.folder && ` beserta ${paths.filter((p) => p.startsWith(toDelete.path + '/')).length} file di dalamnya`} akan dihapus dari proyek. Checkpoint otomatis dibuat lebih dulu, jadi masih bisa dipulihkan.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setToDelete(null)}>Batal</button>
          <button className="btn bg-rose-600 text-white hover:bg-rose-500" onClick={() => void confirmDelete()}>Hapus</button>
        </div>
      </Modal>

      {importing && (
        <ImportDialog
          key={importing.key}
          open
          sources={importing.sources}
          origin={importing.origin}
          existing={new Map((files ?? []).map((f) => [f.path, f.size]))}
          existingBytes={totalBytes}
          folders={folders}
          keepNames={importing.keepNames}
          defaultDest={importing.dest ?? (importing.sources.every((s) => kindOf(s.relPath) === 'image') && folders.includes('assets') ? 'assets' : currentFolder)}
          busy={importBusy}
          onCancel={() => setImporting(null)}
          onConfirm={(rows) => void confirmImport(rows)}
        />
      )}
    </div>
  )
}
