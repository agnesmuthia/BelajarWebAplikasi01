import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Lightbulb, MonitorSmartphone, Play, RotateCcw, Trophy } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { RichText } from '../../components/RichText'
import { Badge, cx } from '../../components/ui'
import { MISSIONS, advance, findMission, type Mission } from '../../data/gitMissions'
import { Inspector, type InspectorTab } from '../../git/Inspector'
import { createState, run, writeFile, HOME, type Line, type SimState } from '../../git/sim'
import { clearSession, loadSession, saveSession } from '../../git/simStorage'
import { promptFor, Terminal } from '../../git/Terminal'
import { useStore } from '../../lib/store'
import { useToast } from '../../lib/toast'
import NotFound from '../NotFound'

/** Mode bebas (tanpa langkah) untuk bereksperimen. */
const SANDBOX: Mission = {
  id: 'sandbox',
  level: 1,
  title: 'Terminal Bebas',
  summary: 'Bereksperimen dengan perintah apa pun.',
  minutes: 0,
  intro: ['Tidak ada langkah wajib. Coba perintah apa pun; kalau berantakan, klik Reset.', 'Ide: buat repository, dua branch, lalu sengaja buat konflik.'],
  setup: () => {
    let s = createState()
    for (const c of ['mkdir Documents', 'git config --global user.name "Siswa DevStudio"', 'git config --global user.email "siswa@example.com"']) s = run(s, c).state
    return { ...s, history: [] }
  },
  steps: [],
  outro: '',
  realWorld: '',
}

const welcome = (m: Mission): Line[] => [
  { text: `DevStudio Git Simulator — ${m.title}`, kind: 'ok' },
  { text: 'Ini simulasi untuk belajar; perintah tidak dijalankan di komputermu.', kind: 'muted' },
  { text: '', kind: 'out' },
]

type Pane = 'mission' | 'terminal' | 'inspect'

export default function MissionPage() {
  const { missionId = '' } = useParams()
  const m = missionId === 'sandbox' ? SANDBOX : findMission(missionId)
  if (!m) return <NotFound />
  return <MissionView key={m.id} m={m} />
}

function MissionView({ m }: { m: Mission }) {
  const { state: app, completeMission } = useStore()
  const toast = useToast()
  const [session, setSession] = useState(() => loadSession(m.id) ?? { state: m.setup(), reached: 0, transcript: welcome(m) })
  const [explain, setExplain] = useState<string | undefined>()
  const [tab, setTab] = useState<InspectorTab>('explain')
  const [pane, setPane] = useState<Pane>('terminal')
  const [showHint, setShowHint] = useState(app.settings.mode === 'github')
  const [confirmReset, setConfirmReset] = useState(false)
  const done = m.steps.length > 0 && session.reached >= m.steps.length
  const completed = Boolean(app.missions[m.id])
  const idx = MISSIONS.findIndex((x) => x.id === m.id)
  const next = idx >= 0 ? MISSIONS[idx + 1] : undefined

  useEffect(() => saveSession(m.id, session), [m.id, session])

  useEffect(() => {
    if (done && !completed && m.id !== 'sandbox') {
      completeMission(m.id)
      toast(`Misi “${m.title}” selesai! 🎉`)
    }
  }, [done, completed, m, completeMission, toast])

  const apply = useCallback(
    (state: SimState, lines: Line[], clear = false) => {
      setSession((prev) => {
        const reached = advance(m, state, prev.reached)
        if (reached > prev.reached) setShowHint(app.settings.mode === 'github')
        return { state, reached, transcript: clear ? [] : [...prev.transcript, ...lines].slice(-400) }
      })
    },
    [m, app.settings.mode],
  )

  const onCommand = (cmd: string) => {
    const echo: Line = { text: `${promptFor(session.state)} ${cmd}`, kind: 'cmd' }
    const r = run(session.state, cmd)
    if (r.explain) setExplain(r.explain)
    apply(r.state, [echo, ...r.lines], r.clear)
  }

  const onEdit = (path: string, content: string) => {
    const s = writeFile(session.state, path, content)
    const name = path.split('/').pop()
    apply({ ...s, history: [...s.history, `[edit] ${name}`] }, [{ text: `— File ${path.replace(HOME, '~')} disimpan lewat panel File.`, kind: 'muted' }])
    setExplain('File diubah di working directory. Git belum mencatat perubahan ini sampai kamu menjalankan git add dan git commit — cek dengan git status.')
    toast(`${name} disimpan.`, 'info')
  }

  const reset = () => {
    clearSession(m.id)
    setSession({ state: m.setup(), reached: 0, transcript: welcome(m) })
    setExplain(undefined)
    setConfirmReset(false)
  }

  const current = m.steps[session.reached]

  const sidebar = (
    <div className="space-y-4">
      <div>
        <Link to="/github" className="btn-ghost -ml-2 mb-1 px-2 py-1 text-xs"><ArrowLeft className="size-3.5" /> GitHub Learning Center</Link>
        <div className="mb-1 flex flex-wrap gap-1.5">
          {m.id !== 'sandbox' && <Badge tone="indigo">Level {m.level}</Badge>}
          {completed && <Badge tone="emerald"><CheckCircle2 className="size-3" /> Selesai</Badge>}
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{m.title}</h1>
      </div>
      <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">{m.intro.map((p, i) => <p key={i}><RichText text={p} /></p>)}</div>

      {m.steps.length > 0 && (
        <ol className="space-y-2">
          {m.steps.map((st, i) => {
            const isDone = i < session.reached
            const isCur = i === session.reached
            return (
              <li key={i} className={cx('rounded-xl border p-2.5 text-sm', isCur ? 'border-indigo-400 bg-indigo-500/5 dark:border-indigo-400/50' : 'border-transparent', !isCur && !isDone && 'opacity-60')}>
                <div className="flex items-start gap-2">
                  {isDone ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" /> : <Circle className={cx('mt-0.5 size-4 shrink-0', isCur ? 'text-indigo-500' : 'text-slate-400')} />}
                  <span className={cx(isDone && 'text-slate-500 dark:text-slate-400')}><RichText text={st.text} /></span>
                </div>
                {isCur && (
                  <div className="mt-2 pl-6">
                    {showHint ? (
                      <code className="block rounded-md bg-slate-900 px-2 py-1.5 font-mono text-xs whitespace-pre-wrap text-emerald-300">{st.hint}</code>
                    ) : (
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setShowHint(true)}><Lightbulb className="size-3.5" /> Tampilkan petunjuk</button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {m.actions && (
        <div className="space-y-2">
          {m.actions.map((a) => (
            <div key={a.label} className="rounded-xl border border-cyan-300 p-2.5 dark:border-cyan-500/30">
              <button className="btn-secondary w-full text-xs" disabled={session.reached <= a.afterStep} onClick={() => apply(a.run(session.state), [{ text: `— Simulasi: ${a.label}`, kind: 'muted' }])}>
                <Play className="size-3.5" /> {a.label}
              </button>
              <p className="muted mt-1.5 text-xs">{a.description}</p>
            </div>
          ))}
        </div>
      )}

      {done && (
        <div className="space-y-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300"><Trophy className="size-4" /> Misi selesai</p>
          <p>{m.outro}</p>
          <p className="flex items-start gap-2 text-xs"><MonitorSmartphone className="mt-0.5 size-3.5 shrink-0" /> <span><b>Di komputer sungguhan:</b> {m.realWorld}</span></p>
          {next && <Link to={`/github/m/${next.id}`} className="btn-primary w-full">Misi berikutnya <ArrowRight className="size-4" /></Link>}
        </div>
      )}

      <button className="btn-ghost w-full text-xs" onClick={() => setConfirmReset(true)}><RotateCcw className="size-3.5" /> Mulai ulang dari awal</button>
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div role="tablist" aria-label="Panel misi" className="grid grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 lg:hidden dark:border-white/10 dark:bg-white/5">
        {(['mission', 'terminal', 'inspect'] as Pane[]).map((p) => (
          <button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={cx('rounded-lg py-1.5 text-sm font-medium', pane === p ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300')}>
            {p === 'mission' ? 'Misi' : p === 'terminal' ? 'Terminal' : 'Inspeksi'}
          </button>
        ))}
      </div>
      {current && (
        <p className="card px-3 py-2 text-sm lg:hidden"><b>Langkah {session.reached + 1}:</b> <RichText text={current.text} /></p>
      )}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(280px,340px)]">
        <aside className={cx('card min-h-0 overflow-y-auto p-4 lg:block', pane === 'mission' ? 'block' : 'hidden')} aria-label="Langkah misi">{sidebar}</aside>
        <section className={cx('min-h-[60dvh] overflow-hidden rounded-2xl border border-slate-200 lg:block lg:min-h-0 dark:border-white/10', pane === 'terminal' ? 'block' : 'hidden')} aria-label="Terminal">
          <Terminal state={session.state} transcript={session.transcript} onCommand={onCommand} />
        </section>
        <aside className={cx('card min-h-[60dvh] overflow-hidden lg:block lg:min-h-0', pane === 'inspect' ? 'block' : 'hidden')} aria-label="Inspeksi">
          <Inspector s={session.state} tab={tab} setTab={setTab} explain={explain} onEdit={onEdit} />
        </aside>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Mulai ulang misi?">
        <p className="muted text-sm">Terminal, file, dan repository simulasi dikembalikan ke kondisi awal misi. Status “selesai” yang sudah kamu raih tetap tersimpan.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirmReset(false)}>Batal</button>
          <button className="btn-primary" onClick={reset}>Mulai ulang</button>
        </div>
      </Modal>
    </div>
  )
}
