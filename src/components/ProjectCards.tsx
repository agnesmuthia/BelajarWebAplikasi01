import { Clock, Lock, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { findLesson } from '../data/curriculum'
import { findTemplate, type ProjectTemplate } from '../data/projects'
import { relativeTime } from '../lib/date'
import { projectProgress } from '../lib/progress'
import type { ProjectStatus, UserProject } from '../lib/types'
import { Badge, ProgressBar, cx } from './ui'

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Aktif',
  review: 'Menunggu review',
  published: 'Dipublikasikan',
}
export const STATUS_TONE = { active: 'indigo', review: 'amber', published: 'emerald' } as const

export const ACCENT: Record<ProjectTemplate['accent'], string> = {
  indigo: 'from-indigo-500 to-blue-600',
  cyan: 'from-cyan-500 to-teal-600',
  violet: 'from-violet-500 to-fuchsia-600',
}

export function UserProjectCard({ project }: { project: UserProject }) {
  const tpl = findTemplate(project.templateId)
  const p = projectProgress(project, tpl)
  return (
    <Link to={`/projects/${project.id}`} className="card card-hover flex h-full flex-col overflow-hidden">
      <div className={cx('h-1.5 bg-gradient-to-r', tpl ? ACCENT[tpl.accent] : 'from-slate-400 to-slate-500')} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">{project.name}</h3>
          {project.favorite && <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" aria-label="Favorit" />}
        </div>
        <p className="muted mt-0.5 text-xs">{tpl?.title ?? 'Template tidak dikenal'}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Badge>
          {tpl && <Badge>{tpl.difficulty}</Badge>}
        </div>
        <div className="mt-auto pt-4">
          <div className="mb-1.5 flex justify-between text-xs"><span className="muted">{p.tasks}/{p.totalTasks} tugas · {p.tests}/{p.totalTests} tes</span><span className="font-medium">{p.percent}%</span></div>
          <ProgressBar value={p.percent} label={`Progres ${project.name}`} />
          <p className="muted mt-3 flex items-center gap-1 text-xs"><Clock className="size-3" /> Diperbarui {relativeTime(project.updatedAt)}</p>
        </div>
      </div>
    </Link>
  )
}

export function TemplateCard({ template, lockedBy = [] }: { template: ProjectTemplate; lockedBy?: string[] }) {
  return (
    <Link to={`/projects/library/${template.id}`} className="card card-hover group flex h-full flex-col overflow-hidden">
      <div className={cx('relative h-24 bg-gradient-to-br p-4 text-white', ACCENT[template.accent])}>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#fff4,transparent_60%)]" />
        <span className="relative text-xs font-semibold tracking-wider uppercase opacity-90">{template.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-cyan-300">{template.title}</h3>
        <p className="muted mt-1 text-sm">{template.tagline}</p>
        {lockedBy.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300"><Lock className="size-3.5" /> Terbuka setelah checkpoint “{lockedBy.map((id) => findLesson(id)?.title ?? id).join('”, “')}” lulus</p>}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          <Badge tone="emerald">{template.difficulty}</Badge>
          <Badge><Clock className="size-3" /> ±{template.estimatedHours} jam</Badge>
          {template.technologies.map((t) => <Badge key={t} tone="slate">{t}</Badge>)}
        </div>
      </div>
    </Link>
  )
}
