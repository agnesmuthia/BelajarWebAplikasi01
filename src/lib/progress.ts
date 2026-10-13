import { CHALLENGES } from '../data/challenges'
import { SQL_CHALLENGES } from '../data/sqlChallenges'
import { ALL_LESSONS, MODULES, type Module } from '../data/curriculum'
import { MISSIONS } from '../data/gitMissions'
import { findTemplate, type ProjectTemplate } from '../data/projects'
import { SKILLS, type Skill, type SkillId } from '../data/skills'
import { dayKey, lastNDays } from './date'
import type { AppState, UserProject } from './types'

export const isLessonPassed = (state: AppState, lessonId: string) => Boolean(state.lessons[lessonId]?.passedAt)

/** Pelajaran dalam satu modul terbuka berurutan: pelajaran ke-n terbuka jika ke-(n-1) lulus. */
export function isLessonUnlocked(state: AppState, module: Module, lessonId: string): boolean {
  const idx = module.lessons.findIndex((l) => l.id === lessonId)
  if (idx <= 0) return idx === 0
  return isLessonPassed(state, module.lessons[idx - 1].id)
}

export function moduleProgress(state: AppState, module: Module) {
  const total = module.lessons.length
  const passed = module.lessons.filter((l) => isLessonPassed(state, l.id)).length
  return { total, passed, percent: total ? Math.round((passed / total) * 100) : 0 }
}

export function overallLessonProgress(state: AppState) {
  const total = ALL_LESSONS.length
  const passed = ALL_LESSONS.filter((l) => isLessonPassed(state, l.id)).length
  return { total, passed, percent: total ? Math.round((passed / total) * 100) : 0 }
}

/** Pelajaran berikutnya yang belum lulus, mengikuti urutan modul. */
export function nextLesson(state: AppState) {
  for (const m of MODULES) {
    for (const l of m.lessons) {
      if (!isLessonPassed(state, l.id)) return { module: m, lesson: l }
    }
  }
  return null
}

/** Checkpoint wajib yang belum lulus untuk sebuah template (kosong = terbuka). */
export function missingRequirements(state: AppState, template: ProjectTemplate) {
  return (template.requires ?? []).filter((id) => !isLessonPassed(state, id))
}

export function projectProgress(project: UserProject, template: ProjectTemplate | undefined) {
  if (!template) return { tasks: 0, totalTasks: 0, tests: 0, totalTests: 0, percent: 0 }
  const tasks = template.tasks.filter((t) => project.tasksDone.includes(t.id)).length
  const tests = template.testing.filter((t) => project.testsDone.includes(t.id)).length
  const totalTasks = template.tasks.length
  const totalTests = template.testing.length
  const denom = totalTasks + totalTests
  return { tasks, totalTasks, tests, totalTests, percent: denom ? Math.round(((tasks + tests) / denom) * 100) : 0 }
}

export type SkillLevel = 'none' | 'learning' | 'practiced' | 'mastered'

export interface SkillEvidence {
  skill: Skill
  level: SkillLevel
  lessons: string[]
  tasks: { project: string; task: string }[]
  /** Tantangan Coding Lab yang lulus TANPA membuka solusi lebih dulu. */
  challenges: string[]
}

export const SKILL_LEVEL_LABEL: Record<SkillLevel, string> = {
  none: 'Belum mulai',
  learning: 'Mempelajari',
  practiced: 'Dipraktikkan',
  mastered: 'Dikuasai',
}

/**
 * Keterampilan dinilai dari BUKTI, bukan jumlah materi yang dibaca:
 * - learning   : lulus checkpoint pelajaran terkait
 * - practiced  : ≥ 1 tugas proyek ATAU ≥ 1 tantangan Coding Lab (tanpa solusi) terkait
 * - mastered   : lulus checkpoint, ≥ 1 tugas proyek, DAN total ≥ 3 bukti praktik
 *                (tugas proyek + tantangan). Tanpa proyek nyata, skill tidak bisa “dikuasai”.
 */
export function computeSkills(state: AppState): SkillEvidence[] {
  const byId = new Map<SkillId, SkillEvidence>(
    SKILLS.map((s) => [s.id, { skill: s, level: 'none' as SkillLevel, lessons: [], tasks: [], challenges: [] }]),
  )

  for (const l of ALL_LESSONS) {
    if (!isLessonPassed(state, l.id)) continue
    for (const sid of l.skills) byId.get(sid)?.lessons.push(l.title)
  }

  for (const p of state.projects) {
    const tpl = findTemplate(p.templateId)
    if (!tpl) continue
    for (const t of tpl.tasks) {
      if (!p.tasksDone.includes(t.id)) continue
      for (const sid of t.skills) byId.get(sid)?.tasks.push({ project: p.name, task: t.title })
    }
  }

  for (const c of CHALLENGES) {
    const p = state.challenges[c.id]
    if (!p?.passedAt || p.solutionViewed) continue
    for (const sid of c.skills) byId.get(sid)?.challenges.push(c.title)
  }

  // Tantangan SQL Lab = bukti praktik database.
  for (const c of SQL_CHALLENGES) {
    const p = state.challenges[c.id]
    if (p?.passedAt && !p.solutionViewed) byId.get('database')?.challenges.push(`SQL: ${c.title}`)
  }

  // Proyek yang sudah online (URL deployment tersimpan) = bukti praktik deployment.
  for (const p of state.projects) if (/^https:\/\//.test(p.deployUrl)) byId.get('deployment')?.tasks.push({ project: p.name, task: 'Website online' })

  // Misi simulator Git = bukti praktik untuk skill Git.
  for (const m of MISSIONS) if (state.missions[m.id]) byId.get('git')?.challenges.push(`Misi: ${m.title}`)

  for (const e of byId.values()) {
    const practice = e.tasks.length + e.challenges.length
    if (e.lessons.length > 0 && e.tasks.length > 0 && practice >= 3) e.level = 'mastered'
    else if (practice > 0) e.level = 'practiced'
    else if (e.lessons.length > 0) e.level = 'learning'
  }
  return [...byId.values()]
}

export function isProjectComplete(project: UserProject) {
  const tpl = findTemplate(project.templateId)
  return projectProgress(project, tpl).percent === 100
}

export function todayCount(state: AppState, now = new Date()) {
  const today = dayKey(now)
  return state.activity.filter((a) => dayKey(a.at) === today).length
}

export function weeklyActivity(state: AppState, now = new Date()) {
  const counts = new Map<string, number>()
  for (const a of state.activity) {
    const k = dayKey(a.at)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return lastNDays(7, now).map((d) => ({
    key: dayKey(d),
    label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
    count: counts.get(dayKey(d)) ?? 0,
  }))
}

/** Jumlah hari berturut-turut (sampai hari ini atau kemarin) yang memiliki aktivitas. */
export function streak(state: AppState, now = new Date()) {
  const days = new Set(state.activity.map((a) => dayKey(a.at)))
  const d = new Date(now)
  d.setHours(12, 0, 0, 0)
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(dayKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function nextChallenge(state: AppState) {
  return CHALLENGES.find((c) => !state.challenges[c.id]?.passedAt) ?? null
}

export function nextMission(state: AppState) {
  return MISSIONS.find((m) => !state.missions[m.id]) ?? null
}
