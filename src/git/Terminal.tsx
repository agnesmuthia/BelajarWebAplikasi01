import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../components/ui'
import { completions, currentRepo, displayPath, type Line, type SimState } from './sim'

const KIND: Record<Line['kind'], string> = {
  out: 'text-slate-200',
  err: 'text-rose-300',
  hint: 'text-amber-200/90',
  ok: 'text-emerald-300',
  add: 'text-emerald-300',
  del: 'text-rose-300',
  muted: 'text-slate-500',
  cmd: 'text-white',
}

export function promptFor(s: SimState) {
  const repo = currentRepo(s)
  return `siswa@devstudio:${displayPath(s.cwd)}${repo ? ` (${repo.merging ? `${repo.head}|MERGING` : repo.head})` : ''}$`
}

/** Terminal simulasi. Selalu gelap, seperti terminal sungguhan. */
export function Terminal({ state, transcript, onCommand }: { state: SimState; transcript: Line[]; onCommand: (cmd: string) => void }) {
  const [input, setInput] = useState('')
  const [histIdx, setHistIdx] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [transcript])

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const h = state.history
    if (e.key === 'Enter') {
      onCommand(input)
      setInput('')
      setHistIdx(null)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!h.length) return
      const i = histIdx === null ? h.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(i)
      setInput(h[i])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx === null) return
      const i = histIdx + 1
      if (i >= h.length) {
        setHistIdx(null)
        setInput('')
      } else {
        setHistIdx(i)
        setInput(h[i])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const parts = input.split(' ')
      const last = parts.pop() ?? ''
      const opts = completions(state, last)
      if (opts.length === 1) setInput([...parts, opts[0]].join(' '))
      else if (opts.length > 1) {
        let common = opts[0]
        for (const o of opts) while (!o.startsWith(common)) common = common.slice(0, -1)
        setInput([...parts, common].join(' '))
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      onCommand('clear')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b0d12] font-mono text-[13px] leading-6" onClick={() => inputRef.current?.focus()}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" role="log" aria-label="Output terminal" aria-live="polite">
        {transcript.length === 0 && <p className="text-slate-500">Ketik perintah lalu tekan Enter. Ketik help untuk daftar perintah.</p>}
        {transcript.map((l, i) => (
          <div key={i} className={cx('break-words whitespace-pre-wrap', KIND[l.kind])}>{l.text || ' '}</div>
        ))}
        <div ref={endRef} />
      </div>
      <label className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5">
        <span className="shrink-0 text-emerald-400">{promptFor(state)}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          className="min-w-0 flex-1 bg-transparent text-white caret-cyan-300 outline-none"
          aria-label="Ketik perintah terminal"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
        />
      </label>
    </div>
  )
}
