import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './lib/store'
import { ToastProvider } from './lib/toast'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'

// Setiap halaman dimuat saat dibuka (code splitting) agar Dashboard tampil lebih cepat.
const GitHubCenter = lazy(() => import('./pages/github/GitHubCenter'))
const DeployHub = lazy(() => import('./pages/DeployHub'))
const FullStackHub = lazy(() => import('./pages/FullStackHub'))
const Mentor = lazy(() => import('./pages/Mentor'))
const Integrations = lazy(() => import('./pages/Integrations'))
const LocalWorkflow = lazy(() => import('./pages/LocalWorkflow'))
const LabHome = lazy(() => import('./pages/lab/LabHome'))
const LearningPath = lazy(() => import('./pages/LearningPath'))
const LessonPage = lazy(() => import('./pages/LessonPage'))
const ModulePage = lazy(() => import('./pages/ModulePage'))
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace'))
const Projects = lazy(() => import('./pages/Projects'))
const Roadmap = lazy(() => import('./pages/Roadmap'))
const Settings = lazy(() => import('./pages/Settings'))
const Skills = lazy(() => import('./pages/Skills'))
const TemplateDetail = lazy(() => import('./pages/TemplateDetail'))
const LabChallenge = lazy(() => import('./pages/lab/LabChallenge'))
const LabPlayground = lazy(() => import('./pages/lab/LabPlayground'))
const ProjectEditor = lazy(() => import('./pages/projects/ProjectEditor'))
const MissionPage = lazy(() => import('./pages/github/MissionPage'))

const loading = <p className="muted p-6 text-sm" role="status">Memuat halaman…</p>

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="learn" element={<Suspense fallback={loading}><LearningPath /></Suspense>} />
        <Route path="learn/:moduleId" element={<Suspense fallback={loading}><ModulePage /></Suspense>} />
        <Route path="learn/:moduleId/:lessonId" element={<Suspense fallback={loading}><LessonPage /></Suspense>} />
        <Route path="lab" element={<Suspense fallback={loading}><LabHome /></Suspense>} />
        <Route path="lab/c/:challengeId" element={<Suspense fallback={loading}><LabChallenge /></Suspense>} />
        <Route path="lab/play/:templateId" element={<Suspense fallback={loading}><LabPlayground /></Suspense>} />
        <Route path="projects" element={<Suspense fallback={loading}><Projects /></Suspense>} />
        <Route path="projects/library/:templateId" element={<Suspense fallback={loading}><TemplateDetail /></Suspense>} />
        <Route path="projects/:projectId" element={<Suspense fallback={loading}><ProjectWorkspace /></Suspense>} />
        <Route path="projects/:projectId/code" element={<Suspense fallback={loading}><ProjectEditor /></Suspense>} />
        <Route path="github" element={<Suspense fallback={loading}><GitHubCenter /></Suspense>} />
        <Route path="github/m/:missionId" element={<Suspense fallback={loading}><MissionPage /></Suspense>} />
        <Route path="integrations" element={<Suspense fallback={loading}><Integrations /></Suspense>} />
        <Route path="local" element={<Suspense fallback={loading}><LocalWorkflow /></Suspense>} />
        <Route path="deploy" element={<Suspense fallback={loading}><DeployHub /></Suspense>} />
        <Route path="fullstack" element={<Suspense fallback={loading}><FullStackHub /></Suspense>} />
        <Route path="mentor" element={<Suspense fallback={loading}><Mentor /></Suspense>} />
        <Route path="skills" element={<Suspense fallback={loading}><Skills /></Suspense>} />
        <Route path="roadmap" element={<Suspense fallback={loading}><Roadmap /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={loading}><Settings /></Suspense>} />
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
