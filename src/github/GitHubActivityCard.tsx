import { GitBranch, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, SectionTitle } from '../components/ui'
import { relativeTime } from '../lib/date'
import { useStore } from '../lib/store'
import { describeEvent, listEvents, type GhEvent } from './api'

/** Aktivitas publik GitHub (data asli, tanpa login) — atau ajakan menghubungkan username. */
export function GitHubActivityCard() {
  const { state } = useStore()
  const username = state.settings.githubUsername
  const [events, setEvents] = useState<GhEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return
    let alive = true
    setEvents(null)
    setError(null)
    listEvents(username)
      .then((e) => alive && setEvents(e))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [username])

  return (
    <section className="card p-5">
      <SectionTitle action={username ? <Badge tone="emerald">@{username}</Badge> : <Link to="/integrations" className="text-xs font-medium text-indigo-600 hover:underline dark:text-cyan-300">Hubungkan</Link>}>Aktivitas GitHub</SectionTitle>
      {!username ? (
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-white/5"><GitBranch className="size-5 text-slate-500" /></div>
          <p className="muted text-sm">
            Masukkan username GitHub di <Link to="/integrations" className="font-medium text-indigo-600 hover:underline dark:text-cyan-300">Integrations</Link> untuk melihat aktivitas publikmu di sini (tanpa login).
          </p>
        </div>
      ) : error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      ) : !events ? (
        <Loader2 className="size-4 animate-spin text-slate-400" />
      ) : events.length === 0 ? (
        <p className="muted text-sm">Belum ada aktivitas publik dalam 90 hari terakhir. Push commit pertamamu!</p>
      ) : (
        <ul className="space-y-2.5">
          {events.slice(0, 5).map((e) => (
            <li key={e.id} className="flex items-start gap-2 text-sm">
              <GitBranch className="mt-0.5 size-4 shrink-0 text-indigo-500" />
              <div className="min-w-0">
                <div className="[overflow-wrap:anywhere]">{describeEvent(e)}</div>
                <div className="muted text-xs">{relativeTime(e.created_at)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
