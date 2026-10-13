import {
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  FlaskConical,
  GitBranch,
  Plug,
  FolderKanban,
  LayoutDashboard,
  Map,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { MODE_INFO } from '../data/modes'
import { useStore } from '../lib/store'
import { cx } from './ui'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/learn', label: 'Learning Path', icon: BookOpen },
  { to: '/lab', label: 'Coding Lab', icon: FlaskConical },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/github', label: 'GitHub Center', icon: GitBranch },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/skills', label: 'Skill Tracker', icon: Sparkles },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/settings', label: 'Pengaturan', icon: Settings },
]

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-cyan-300 shadow-lg shadow-indigo-500/25">
        <Code2 className="size-5" aria-hidden />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="font-bold text-slate-900 dark:text-white">DevStudio</div>
          <div className="text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">Academy · Web Lab</div>
        </div>
      )}
    </div>
  )
}

function NavItems({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cx(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 dark:bg-indigo-500/15 dark:text-white dark:shadow-none dark:ring-1 dark:ring-indigo-400/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white',
              )
            }
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {collapsed ? <span className="sr-only">{label}</span> : label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function Layout() {
  const { state, updateSettings, persistOk } = useStore()
  const { theme, sidebarCollapsed: collapsed, mode } = state.settings
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()
  // Halaman editor Coding Lab memakai lebar & tinggi penuh layar.
  const inWorkspace = /^\/lab\/(c|play)\/|^\/projects\/[^/]+\/code$|^\/github\/m\//.test(location.pathname)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer])

  const ThemeIcon = theme === 'dark' ? Sun : Moon
  const modeInfo = MODE_INFO[mode]

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-white">
        Lewati ke konten utama
      </a>

      {/* Sidebar desktop */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200 bg-white/80 backdrop-blur transition-[width] duration-200 lg:flex dark:border-white/[0.06] dark:bg-ink-900/80',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        <div className={cx('flex h-16 items-center px-4', collapsed && 'justify-center px-0')}>
          <Brand collapsed={collapsed} />
        </div>
        <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3 py-2">
          <NavItems collapsed={collapsed} />
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-white/[0.06]">
          <button
            className={cx('btn-ghost w-full', collapsed ? 'px-0' : 'justify-start')}
            onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!collapsed && 'Ciutkan'}
          </button>
        </div>
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white p-4 shadow-xl dark:bg-ink-900">
            <div className="mb-4 flex items-center justify-between">
              <Brand collapsed={false} />
              <button className="btn-ghost p-2" onClick={() => setDrawer(false)} aria-label="Tutup menu">
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label="Navigasi utama">
              <NavItems collapsed={false} onNavigate={() => setDrawer(false)} />
            </nav>
          </div>
        </div>
      )}

      <div className={cx('transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-4 backdrop-blur sm:px-6 dark:border-white/[0.06] dark:bg-ink-950/80">
          <button className="btn-ghost p-2 lg:hidden" onClick={() => setDrawer(true)} aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Brand collapsed={false} />
          </div>
          <div className="flex-1" />
          <NavLink
            to="/settings"
            className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 sm:flex dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            title="Ubah mode belajar di Pengaturan"
          >
            <modeInfo.icon className="size-3.5 text-indigo-500 dark:text-cyan-300" aria-hidden />
            Mode: {modeInfo.label}
          </NavLink>
          <button
            className="btn-secondary p-2"
            onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          >
            <ThemeIcon className="size-4" />
          </button>
        </header>

        {!persistOk && (
          <div role="alert" className="flex items-center gap-2 border-b border-amber-300 bg-amber-50 px-6 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <TriangleAlert className="size-4 shrink-0" />
            Progres tidak dapat disimpan di browser ini (penyimpanan penuh atau diblokir). Ekspor backup di Pengaturan agar tidak hilang.
          </div>
        )}

        <main
          id="main"
          className={cx(
            'mx-auto w-full',
            inWorkspace ? 'px-3 py-3 sm:px-4 lg:flex lg:h-[calc(100dvh-4rem)] lg:flex-col' : 'max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8',
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
