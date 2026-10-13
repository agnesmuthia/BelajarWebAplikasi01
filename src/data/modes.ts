import { Bug, Compass, Dumbbell, GitBranch, Hammer, Rocket, type LucideIcon } from 'lucide-react'
import type { LearningMode } from '../lib/types'

export interface ModeInfo {
  label: string
  description: string
  icon: LucideIcon
  /** Fase ketika mode ini benar-benar berfungsi. */
  phase: number
  /** Efek nyata mode ini pada aplikasi saat ini. */
  effect: string
}

export const MODE_INFO: Record<LearningMode, ModeInfo> = {
  guided: {
    label: 'Guided Learning',
    description: 'Panduan langkah demi langkah.',
    icon: Compass,
    phase: 1,
    effect: 'Petunjuk (hint) di setiap pelajaran bisa dibuka kapan saja, satu per satu.',
  },
  practice: {
    label: 'Practice Mode',
    description: 'Mengerjakan tantangan secara mandiri.',
    icon: Dumbbell,
    phase: 1,
    effect: 'Petunjuk dikunci sampai kamu mencoba kuis checkpoint minimal satu kali.',
  },
  build: { label: 'Build Mode', description: 'Membangun proyek nyata di Coding Lab.', icon: Hammer, phase: 2, effect: 'Membutuhkan Coding Lab (Phase 2).' },
  debug: { label: 'Debug Mode', description: 'Mencari dan memperbaiki bug.', icon: Bug, phase: 2, effect: 'Membutuhkan tantangan debugging (Phase 2).' },
  github: { label: 'GitHub Mode', description: 'Berlatih workflow Git dan GitHub.', icon: GitBranch, phase: 4, effect: 'Membutuhkan simulasi terminal Git (Phase 4).' },
  deploy: { label: 'Deployment Mode', description: 'Menerbitkan proyek ke internet.', icon: Rocket, phase: 6, effect: 'Membutuhkan Deployment Academy (Phase 6).' },
}

export const CURRENT_PHASE = 1
