import { AlertTriangle, CheckCircle2, FilePlus2, Info, Replace, SkipForward } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { Badge, cx } from '../components/ui'
import { planImport, stripCommonRoot, type ImportSource, type PlanRow } from './importer'
import { MAX_FILE_BYTES, formatBytes } from './paths'

interface Props {
  open: boolean
  sources: ImportSource[]
  origin: string
  existing: Map<string, number>
  existingBytes: number
  folders: string[]
  defaultDest: string
  /** Sinkronisasi folder lokal: nama & struktur harus dipertahankan persis. */
  keepNames?: boolean
  busy: boolean
  onCancel: () => void
  onConfirm: (rows: PlanRow[]) => void
}

/** Pratinjau impor: pengguna melihat ke mana setiap file disimpan dan file mana yang akan ditimpa. */
export function ImportDialog({ open, sources, origin, existing, existingBytes, folders, defaultDest, keepNames = false, busy, onCancel, onConfirm }: Props) {
  const [dest, setDest] = useState(defaultDest)
  const [tidy, setTidy] = useState(!keepNames)
  const [strip, setStrip] = useState(!keepNames)
  const [keep, setKeep] = useState<Set<string>>(new Set())

  const stripped = useMemo(() => stripCommonRoot(sources), [sources])
  const hasRoot = stripped !== sources
  const rows = useMemo(
    () => planImport(strip && hasRoot ? stripped : sources, { destFolder: dest, existing, existingBytes, tidyNames: tidy, keepExisting: keep }),
    [sources, stripped, strip, hasRoot, dest, existing, existingBytes, tidy, keep],
  )
  const counts = { new: rows.filter((r) => r.status === 'new').length, overwrite: rows.filter((r) => r.status === 'overwrite').length, skip: rows.filter((r) => r.status === 'skip').length }
  const rootName = hasRoot ? sources[0].relPath.split('/')[0] : ''

  const toggleKeep = (target: string) =>
    setKeep((k) => {
      const n = new Set(k)
      if (n.has(target)) n.delete(target)
      else n.add(target)
      return n
    })

  return (
    <Modal open={open} onClose={onCancel} title="Impor file ke proyek">
      <div className="space-y-4">
        <p className="muted flex items-start gap-2 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {origin}. File disalin ke penyimpanan browser (IndexedDB) — file asli di komputermu tidak diubah. Maks. {MAX_FILE_BYTES / 1024 / 1024} MB per file.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="imp-dest" className="mb-1 block text-xs font-medium">Folder tujuan</label>
            <select id="imp-dest" className="input" value={dest} onChange={(e) => setDest(e.target.value)}>
              <option value="">(folder utama proyek)</option>
              {folders.map((f) => <option key={f} value={f}>{f}/</option>)}
            </select>
          </div>
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo-600" checked={tidy} onChange={(e) => setTidy(e.target.checked)} /> Rapikan nama (huruf kecil, tanpa spasi)</label>
            {hasRoot && <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo-600" checked={strip} onChange={(e) => setStrip(e.target.checked)} /> Ambil isi folder “{rootName}” saja</label>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone="emerald"><FilePlus2 className="size-3" /> {counts.new} baru</Badge>
          <Badge tone="amber"><Replace className="size-3" /> {counts.overwrite} menimpa</Badge>
          <Badge><SkipForward className="size-3" /> {counts.skip} dilewati</Badge>
        </div>

        {counts.overwrite > 0 && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {counts.overwrite} file sudah ada dan akan DITIMPA. Hapus centang “timpa” untuk mempertahankan versi lama. Checkpoint otomatis dibuat sebelum impor, jadi versi lama tetap bisa dipulihkan.
          </p>
        )}

        {rows.some((r) => r.renamed && r.status !== 'skip') && (
          <p className="flex items-start gap-2 rounded-lg bg-cyan-50 p-2.5 text-xs text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-200">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Beberapa nama file dirapikan (lihat “dari:”). Jika HTML/CSS-mu masih memakai nama lama, perbarui src/href-nya — tab Pemeriksaan akan menunjukkan rujukan yang rusak. Hapus centang “Rapikan nama” untuk mempertahankan nama asli.
          </p>
        )}

        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-ink-850 dark:text-slate-400">
              <tr><th className="px-2 py-1.5">Disimpan sebagai</th><th className="px-2 py-1.5">Ukuran</th><th className="px-2 py-1.5">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {rows.map((r, i) => (
                <tr key={i} className={cx(r.status === 'skip' && 'opacity-60')}>
                  <td className="px-2 py-1.5 font-mono [overflow-wrap:anywhere]">
                    {r.target}
                    {r.renamed && <div className="muted font-sans">dari: {r.source.relPath}</div>}
                    {r.note && <div className={cx('font-sans', r.status === 'skip' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-300')}>{r.note}</div>}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatBytes(r.source.size)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {r.status === 'new' && <span className="text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="inline size-3.5" /> baru</span>}
                    {r.status === 'overwrite' && (
                      <label className="flex items-center gap-1 text-amber-700 dark:text-amber-300"><input type="checkbox" className="accent-amber-600" checked onChange={() => toggleKeep(r.target)} /> timpa</label>
                    )}
                    {r.status === 'skip' && r.note === 'Dipertahankan (tidak ditimpa)' ? (
                      <label className="flex items-center gap-1"><input type="checkbox" className="accent-amber-600" checked={false} onChange={() => toggleKeep(r.target)} /> timpa</label>
                    ) : r.status === 'skip' ? 'lewati' : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel}>Batal</button>
          <button className="btn-primary" disabled={busy || counts.new + counts.overwrite === 0} onClick={() => onConfirm(rows.filter((r) => r.status !== 'skip'))}>
            {busy ? 'Mengimpor…' : `Impor ${counts.new + counts.overwrite} file`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
