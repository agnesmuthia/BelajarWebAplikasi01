import { ChevronDown, ChevronRight, FileCode2, FileImage, FileText, FileType2, Film, Folder, FolderOpen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cx } from '../components/ui'
import { kindOf, type FileKind } from './paths'

interface Node {
  name: string
  path: string
  folder: boolean
  children: Node[]
}

function buildTree(paths: string[]): Node[] {
  const root: Node = { name: '', path: '', folder: true, children: [] }
  for (const p of paths) {
    const parts = p.split('/')
    let cur = root
    parts.forEach((name, i) => {
      const path = parts.slice(0, i + 1).join('/')
      const folder = i < parts.length - 1
      let next = cur.children.find((c) => c.name === name && c.folder === folder)
      if (!next) {
        next = { name, path, folder, children: [] }
        cur.children.push(next)
      }
      cur = next
    })
  }
  const sort = (n: Node) => {
    n.children.sort((a, b) => (a.folder === b.folder ? a.name.localeCompare(b.name) : a.folder ? -1 : 1))
    n.children.forEach(sort)
  }
  sort(root)
  return root.children
}

const ICON: Partial<Record<FileKind, typeof FileText>> = {
  html: FileCode2,
  css: FileCode2,
  js: FileCode2,
  json: FileCode2,
  image: FileImage,
  font: FileType2,
  media: Film,
}

export interface TreeSelection {
  path: string
  folder: boolean
}

export function FileTree({
  paths,
  selected,
  dirty,
  onSelect,
}: {
  paths: string[]
  selected: TreeSelection | null
  dirty: Set<string>
  onSelect: (s: TreeSelection) => void
}) {
  const tree = useMemo(() => buildTree(paths), [paths])
  const [closed, setClosed] = useState<Set<string>>(new Set())

  const toggle = (p: string) =>
    setClosed((c) => {
      const n = new Set(c)
      if (n.has(p)) n.delete(p)
      else n.add(p)
      return n
    })

  const render = (nodes: Node[], depth: number) => (
    <ul role={depth === 0 ? 'tree' : 'group'} aria-label={depth === 0 ? 'File proyek' : undefined}>
      {nodes.map((n) => {
        const isSel = selected?.path === n.path && selected.folder === n.folder
        const open = n.folder && !closed.has(n.path)
        const Icon = n.folder ? (open ? FolderOpen : Folder) : (ICON[kindOf(n.path) ?? 'other'] ?? FileText)
        return (
          <li key={(n.folder ? 'd:' : 'f:') + n.path} role="treeitem" aria-expanded={n.folder ? open : undefined} aria-selected={isSel}>
            <button
              onClick={() => {
                onSelect({ path: n.path, folder: n.folder })
                if (n.folder) toggle(n.path)
              }}
              className={cx(
                'flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[13px] whitespace-nowrap',
                isSel ? 'bg-indigo-500/15 font-medium text-indigo-700 dark:text-cyan-300' : 'hover:bg-slate-100 dark:hover:bg-white/5',
              )}
              style={{ paddingLeft: 6 + depth * 14 }}
              title={n.path}
            >
              {n.folder ? open ? <ChevronDown className="size-3.5 shrink-0 text-slate-400" /> : <ChevronRight className="size-3.5 shrink-0 text-slate-400" /> : <span className="w-3.5 shrink-0" />}
              <Icon className={cx('size-4 shrink-0', n.folder ? 'text-amber-500' : 'text-slate-400')} aria-hidden />
              <span className="truncate font-mono">{n.name}</span>
              {!n.folder && dirty.has(n.path) && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-amber-500" aria-label="belum tersimpan" />}
            </button>
            {n.folder && open && render(n.children, depth + 1)}
          </li>
        )
      })}
    </ul>
  )

  if (!paths.length) return <p className="muted p-3 text-sm">Belum ada file. Buat file baru atau impor dari komputer.</p>
  return render(tree, 0)
}
