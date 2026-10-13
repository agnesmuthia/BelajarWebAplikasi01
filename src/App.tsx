import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './lib/store'
import { ToastProvider } from './lib/toast'
import Dashboard from './pages/Dashboard'
import GitHubCenter from './pages/github/GitHubCenter'
import Integrations from './pages/Integrations'
import LabHome from './pages/lab/LabHome'
import LearningPath from './pages/LearningPath'
import LessonPage from './pages/LessonPage'
import ModulePage from './pages/ModulePage'
import NotFound from './pages/NotFound'
import ProjectWorkspace from './pages/ProjectWorkspace'
import Projects from './pages/Projects'
import Roadmap from './pages/Roadmap'
import Settings from './pages/Settings'
import Skills from './pages/Skills'
import TemplateDetail from './pages/TemplateDetail'

// Editor (CodeMirror) cukup besar — dimuat hanya saat halaman editor dibuka.
const LabChallenge = lazy(() => import('./pages/lab/LabChallenge'))
const LabPlayground = lazy(() => import('./pages/lab/LabPlayground'))
const ProjectEditor = lazy(() => import('./pages/projects/ProjectEditor'))
const MissionPage = lazy(() => import('./pages/github/MissionPage'))

const loading = <p className="muted p-6 text-sm">Memuat editor…</p>

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="learn" element={<LearningPath />} />
        <Route path="learn/:moduleId" element={<ModulePage />} />
        <Route path="learn/:moduleId/:lessonId" element={<LessonPage />} />
        <Route path="lab" element={<LabHome />} />
        <Route path="lab/c/:challengeId" element={<Suspense fallback={loading}><LabChallenge /></Suspense>} />
        <Route path="lab/play/:templateId" element={<Suspense fallback={loading}><LabPlayground /></Suspense>} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/library/:templateId" element={<TemplateDetail />} />
        <Route path="projects/:projectId" element={<ProjectWorkspace />} />
        <Route path="projects/:projectId/code" element={<Suspense fallback={loading}><ProjectEditor /></Suspense>} />
        <Route path="github" element={<GitHubCenter />} />
        <Route path="github/m/:missionId" element={<Suspense fallback={loading}><MissionPage /></Suspense>} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="skills" element={<Skills />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

// HashRouter (alamat seperti /#/projects) dipilih agar aplikasi langsung berjalan
// di hosting statis seperti GitHub Pages tanpa konfigurasi rewrite server.
export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
