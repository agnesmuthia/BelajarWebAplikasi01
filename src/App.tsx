import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './lib/store'
import { ToastProvider } from './lib/toast'
import Dashboard from './pages/Dashboard'
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

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="learn" element={<LearningPath />} />
        <Route path="learn/:moduleId" element={<ModulePage />} />
        <Route path="learn/:moduleId/:lessonId" element={<LessonPage />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/library/:templateId" element={<TemplateDetail />} />
        <Route path="projects/:projectId" element={<ProjectWorkspace />} />
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
