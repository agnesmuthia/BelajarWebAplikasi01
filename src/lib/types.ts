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
  /** Coding Lab: jalankan ulang preview otomatis saat kode berubah. */
  labAutoRun: boolean
  /** Username GitHub publik (opsional) untuk halaman Integrations. */
  githubUsername: string
}

export interface LessonProgress {
  /** Jumlah percobaan kuis checkpoint. */
  attempts: number
  /** Waktu (ISO) ketika checkpoint lulus. */
  passedAt?: string
}

export interface ChallengeProgress {
  /** Berapa kali kode dijalankan. */
  runs: number
  /** Jumlah petunjuk yang dibuka. */
  hintsUsed: number
  /** true jika solusi dibuka SEBELUM lulus. */
  solutionViewed: boolean
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

export type ActivityKind = 'lesson' | 'task' | 'test' | 'project' | 'challenge' | 'mission'

export interface Activity {
  at: string
  kind: ActivityKind
  label: string
}

export interface AppState {
  version: 1
  settings: Settings
  lessons: Record<string, LessonProgress>
  challenges: Record<string, ChallengeProgress>
  /** Misi simulator Git yang selesai. */
  missions: Record<string, { completedAt: string }>
  /** Local Workflow: langkah yang ditandai selesai (waktu ISO) & versi alat yang sudah dicek. */
  local: { steps: Record<string, string>; env: Record<string, string> }
  projects: UserProject[]
  activity: Activity[]
}
