import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

/** Dialog modal berbasis elemen <dialog> bawaan: fokus terkunci & Esc menutup secara otomatis. */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close?.()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-white/10 dark:bg-ink-900 dark:text-slate-200"
    >
      {open && (
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <button className="btn-ghost -m-1 p-1.5" onClick={onClose} aria-label="Tutup">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
