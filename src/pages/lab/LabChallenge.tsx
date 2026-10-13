import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Eye, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CodeBlock } from '../../components/CodeBlock'
import { Modal } from '../../components/Modal'
import { RichText } from '../../components/RichText'
import { Badge } from '../../components/ui'
import { CHALLENGES, findChallenge, solutionFiles } from '../../data/challenges'
import { findLesson } from '../../data/curriculum'
import { skillById } from '../../data/skills'
import { HintList } from '../../lab/Hints'
import { LabWorkspace } from '../../lab/LabWorkspace'
import { saveDraft } from '../../lab/drafts'
import { LAB_FILE_NAMES, type LabFileKey } from '../../lab/runtime'
import { useStore } from '../../lib/store'
import NotFound from '../NotFound'

export default function LabChallenge() {
  const { challengeId = '' } = useParams()
  const c = findChallenge(challengeId)
  if (!c) return <NotFound />
  // key: reset seluruh workspace saat berpindah tantangan
  return <ChallengeView key={c.id} id={c.id} />
}

function ChallengeView({ id }: { id: string }) {
  const c = findChallenge(id)!
  const { state, recordChallenge } = useStore()
  const progress = state.challenges[c.id]
  const [shown, setShown] = useState(Math.min(progress?.hintsUsed ?? 0, c.hints.length))
  const [solutionOpen, setSolutionOpen] = useState(false)
  const [confirmSolution, setConfirmSolution] = useState(false)
  const [version, setVersion] = useState(0)
  const passed = Boolean(progress?.passedAt)
  const lesson = c.lesson ? findLesson(c.lesson) : undefined
  const idx = CHALLENGES.findIndex((x) => x.id === c.id)
  const next = CHALLENGES[idx + 1]
  const draftId = `challenge:${c.id}`

  const practiceLocked = state.settings.mode === 'practice' && (progress?.runs ?? 0) === 0 && !passed
  const solutionReady = passed || (shown >= c.hints.length && (progress?.runs ?? 0) > 0)
  const sol = solutionFiles(c)

  const openSolution = () => {
    recordChallenge(c.id, { solution: true })
    setConfirmSolution(false)
    setSolutionOpen(true)
  }

  const applySolution = () => {
    saveDraft(draftId, sol)
    setVersion((v) => v + 1) // remount workspace dengan draft baru
    setSolutionOpen(false)
  }

  const sidebar = (
    <div className="space-y-5">
      <div>
        <Link to="/lab" className="btn-ghost -ml-2 mb-2 px-2 py-1 text-xs"><ArrowLeft className="size-3.5" /> Coding Lab</Link>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <Badge tone={c.kind === 'debug' ? 'rose' : 'indigo'}>{c.kind === 'debug' ? 'Debugging' : 'Latihan'}</Badge>
          <Badge>{c.difficulty}</Badge>
          <Badge><Clock className="size-3" /> {c.minutes} mnt</Badge>
          {passed && <Badge tone="emerald"><CheckCircle2 className="size-3" /> {progress?.solutionViewed ? 'Lulus (dibantu solusi)' : 'Lulus'}</Badge>}
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{c.title}</h1>
      </div>

      <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
        {c.brief.map((b, i) => <p key={i}><RichText text={b} /></p>)}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Langkah</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {c.instructions.map((s, i) => <li key={i}><RichText text={s} /></li>)}
        </ol>
      </div>

      <div className="flex flex-wrap gap-1">
        {c.skills.map((s) => <Badge key={s}>{skillById[s].name}</Badge>)}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Petunjuk bertahap</h2>
        <HintList
          hints={c.hints}
          shown={shown}
          onShow={() => {
            setShown((n) => n + 1)
            if (shown >= (progress?.hintsUsed ?? 0)) recordChallenge(c.id, { hint: true })
          }}
          locked={practiceLocked}
          lockedText="Practice Mode: jalankan kodemu (Run) setidaknya sekali sebelum membuka petunjuk."
        />
      </div>

      <div className="border-t border-slate-200 pt-4 dark:border-white/10">
        <button className="btn-secondary w-full" disabled={!solutionReady} onClick={() => (passed ? openSolution() : setConfirmSolution(true))}>
          {solutionReady ? <Eye className="size-4" /> : <Lock className="size-4" />} Lihat solusi
        </button>
        {!solutionReady && <p className="muted mt-1.5 text-xs">Terbuka setelah kamu menjalankan kode dan membuka semua petunjuk.</p>}
      </div>

      {lesson && (
        <Link to={`/learn/${lesson.moduleId}/${lesson.id}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline dark:text-cyan-300">
          <BookOpen className="size-4" /> Materi: {lesson.title}
        </Link>
      )}
      {passed && next && (
        <Link to={`/lab/c/${next.id}`} className="btn-primary w-full">Tantangan berikutnya <ArrowRight className="size-4" /></Link>
      )}
    </div>
  )

  return (
    <>
      <LabWorkspace key={version} draftId={draftId} title={c.title} starter={c.starter} challenge={c} sidebar={sidebar} />

      <Modal open={confirmSolution} onClose={() => setConfirmSolution(false)} title="Lihat solusi sekarang?">
        <p className="muted text-sm">Tidak apa-apa melihat solusi untuk belajar. Namun tantangan yang diselesaikan setelah melihat solusi ditandai “dibantu solusi” dan tidak dihitung sebagai bukti di Skill Tracker.</p>
        <p className="mt-2 text-sm">Sudahkah kamu membandingkan tab <b>Cek</b> (diharapkan vs aktual) dengan kodemu?</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setConfirmSolution(false)}>Coba lagi dulu</button>
          <button className="btn-primary" onClick={openSolution}>Lihat solusi</button>
        </div>
      </Modal>

      <Modal open={solutionOpen} onClose={() => setSolutionOpen(false)} title={`Solusi: ${c.title}`}>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <h3 className="mb-1.5 text-sm font-semibold">Apa yang diubah dan mengapa</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {c.solutionNotes.map((n, i) => <li key={i}><RichText text={n} /></li>)}
            </ul>
          </div>
          {(['html', 'css', 'js'] as LabFileKey[])
            .filter((f) => sol[f] !== c.starter[f])
            .map((f) => <CodeBlock key={f} code={sol[f]} lang={f} title={LAB_FILE_NAMES[f]} maxHeight={260} />)}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setSolutionOpen(false)}>Tutup</button>
          <button className="btn-primary" onClick={applySolution}>Terapkan ke editor</button>
        </div>
      </Modal>
    </>
  )
}
