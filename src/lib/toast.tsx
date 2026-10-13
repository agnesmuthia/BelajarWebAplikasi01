import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'info' | 'error'
interface Toast { id: number; kind: ToastKind; message: string }

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {})

const icons = { success: CheckCircle2, info: Info, error: TriangleAlert }
const colors = {
  success: 'text-emerald-500',
  info: 'text-cyan-500',
  error: 'text-rose-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t.slice(-3), { id, kind, message }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => {
          const Icon = icons[t.kind]
          return (
            <div key={t.id} role="status" className="card pointer-events-auto flex w-full max-w-sm items-start gap-3 p-3 shadow-lg animate-[toast_.2s_ease-out]">
              <Icon className={`mt-0.5 size-5 shrink-0 ${colors[t.kind]}`} aria-hidden />
              <p className="flex-1 text-sm">{t.message}</p>
              <button className="btn-ghost -m-1 p-1" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
