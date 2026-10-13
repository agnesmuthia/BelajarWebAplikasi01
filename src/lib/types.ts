export type Theme = 'dark' | 'light'

export type LearningMode = 'guided' | 'practice' | 'build' | 'debug' | 'github' | 'deploy'

export type Difficulty = 'Pemula' | 'Menengah' | 'Mahir'

export type ProjectStatus = 'active' | 'review' | 'published'

export interface Settings {
  name: string
  theme: Theme
  mode: LearningMode
  /** Target harian: jumlah aktivitas belajar (pelajaran lulus / tugas selesai). */
  dailyGoal: number
  sidebarCollapsed: boolean
}

export interface LessonProgress {
  /** Jumlah percobaan kuis checkpoint. */
  attempts: number
  /** Waktu (ISO) ketika checkpoint lulus. */
  passedAt?: string
}

export interface ProjectEvent {
  at: string
  message: string
}

export interface UserProject {
  id: string
  templateId: string
  name: string
  createdAt: string
  updatedAt: string
  status: ProjectStatus
  favorite: boolean
  tasksDone: string[]
  testsDone: string[]
  notes: string
  repoUrl: string
  deployUrl: string
  history: ProjectEvent[]
}

export type ActivityKind = 'lesson' | 'task' | 'test' | 'project'

export interface Activity {
  at: string
  kind: ActivityKind
  label: string
}

export interface AppState {
  version: 1
  settings: Settings
  lessons: Record<string, LessonProgress>
  projects: UserProject[]
  activity: Activity[]
}
