import { Download, Lock, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Modal } from '../components/Modal'
import { Badge, PageHeader, cx } from '../components/ui'
import { CURRENT_PHASE, MODE_INFO } from '../data/modes'
import { clearAllSessions } from '../git/simStorage'
import { clearAllProjectData } from '../workspace/db'
import { clearDrafts, loadDrafts, replaceDrafts, sanitizeDrafts } from '../lab/drafts'
import { downloadBlob } from '../lib/download'
import { sanitizeState } from '../lib/storage'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { LearningMode } from '../lib/types'

const MAX_IMPORT_BYTES = 2 * 1024 * 1024

export default function Settings() {
  const { state, updateSettings, replaceState, resetAll } = useStore()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const { settings } = state

  const exportData = () => {
    // Backup = progres + draft Coding Lab.
    const blob = new Blob([JSON.stringify({ ...state, labDrafts: loadDrafts() }, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `devstudio-backup-${new Date().toISOString().slice(0, 10)}.json`)
    toast('Backup diunduh.')
  }

  const importData = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) return toast('File terlalu besar (maksimal 2 MB).', 'error')
    try {
      const raw = JSON.parse(await file.text())
      if (raw?.version !== 1) return toast('File ini bukan backup DevStudio yang valid.', 'error')
      const clean = sanitizeState(raw)
      replaceState(clean)
      const drafts = sanitizeDrafts(raw.labDrafts)
      replaceDrafts(drafts)
      toast(`Backup dipulihkan: ${clean.projects.length} proyek, ${Object.keys(clean.lessons).length} pelajaran, ${Object.keys(drafts).length} draft kode.`)
    } catch {
      toast('Gagal membaca file. Pastikan file berformat JSON.', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Pengaturan" description="Profil, tampilan, mode belajar, dan data." />

      <section className="card space-y-5 p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">Profil & tampilan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nama" className="mb-1.5 block text-sm font-medium">Nama panggilan</label>
            <input id="nama" className="input" value={settings.name} maxLength={60} onChange={(e) => updateSettings({ name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="target" className="mb-1.5 block text-sm font-medium">Target aktivitas per hari</label>
            <input id="target" type="number" min={1} max={20} className="input" value={settings.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Math.min(20, Math.max(1, Number(e.target.value) || 1)) })} />
          </div>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Tema</legend>
          <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-white/10">
            {(['dark', 'light'] as const).map((t) => (
              <label key={t} className={cx('cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan-400', settings.theme === t ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300')}>
                <input type="radio" name="tema" className="sr-only" checked={settings.theme === t} onChange={() => updateSettings({ theme: t })} />
                {t === 'dark' ? 'Gelap' : 'Terang'}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">Mode belajar</h2>
        <p className="muted mb-4 text-sm">Mode memengaruhi cara petunjuk ditampilkan. Mode lain aktif setelah fiturnya tersedia.</p>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Pilih mode belajar</legend>
          {(Object.entries(MODE_INFO) as [LearningMode, (typeof MODE_INFO)[LearningMode]][]).map(([id, m]) => {
            const available = m.phase <= CURRENT_PHASE
            const selected = settings.mode === id
            return (
              <label
                key={id}
                className={cx(
                  'flex gap-3 rounded-xl border p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan-400',
                  available ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                  selected ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200 dark:border-white/10',
                )}
              >
                <input type="radio" name="mode" className="sr-only" disabled={!available} checked={selected} onChange={() => updateSettings({ mode: id })} />
                <m.icon className={cx('mt-0.5 size-5 shrink-0', selected ? 'text-indigo-500 dark:text-cyan-300' : 'text-slate-400')} aria-hidden />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                    {m.label} {!available && <Badge tone="amber"><Lock className="size-3" /> Phase {m.phase}</Badge>}
                  </span>
                  <span className="muted mt-0.5 block text-xs">{m.description} {m.effect}</span>
                </span>
              </label>
            )
          })}
        </fieldset>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">Data & backup</h2>
        <p className="muted mb-4 text-sm">
          Semua progres disimpan di <b>localStorage browser ini</b>, tidak dikirim ke server mana pun. Data akan hilang jika kamu menghapus data browser atau berganti perangkat — unduh backup secara berkala. File proyek (termasuk gambar) disimpan di IndexedDB dan dicadangkan lewat tombol ZIP di setiap proyek.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportData}><Download className="size-4" /> Export backup (JSON)</button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importData} />
          <button className="btn-ghost text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10" onClick={() => setConfirmReset(true)}><RotateCcw className="size-4" /> Reset semua data</button>
        </div>
        <p className="muted mt-3 text-xs">{state.projects.length} proyek · {Object.values(state.lessons).filter((l) => l.passedAt).length} checkpoint lulus · {Object.values(state.challenges).filter((c) => c.passedAt).length} tantangan Lab · {state.activity.length} aktivitas tercatat</p>
      </section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset semua data?">
        <p className="muted text-sm">Semua progres, proyek beserta file & checkpoint-nya, catatan, draft Coding Lab, dan pengaturan di browser ini akan dihapus. Unduh backup dulu jika ingin menyimpannya.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirmReset(false)}>Batal</button>
          <button className="btn bg-rose-600 text-white hover:bg-rose-500" onClick={() => { resetAll(); clearDrafts(); clearAllSessions(); void clearAllProjectData().catch(() => {}); setConfirmReset(false); toast('Semua data direset.', 'info') }}>Reset</button>
        </div>
      </Modal>
    </div>
  )
}
