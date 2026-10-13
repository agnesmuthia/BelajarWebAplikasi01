import { render, screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../App'
import { StoreProvider } from '../lib/store'
import { createInitialState } from '../lib/storage'
import { ToastProvider } from '../lib/toast'

/**
 * Audit aksesibilitas otomatis (axe-core) untuk halaman utama. jsdom tidak menghitung warna,
 * jadi kontras diperiksa terpisah di browser sungguhan (lihat SECURITY.md/README → Audit).
 */
const ROUTES = ['/', '/learn', '/learn/html', '/learn/html/html-1', '/lab', '/projects', '/projects?tab=library', '/projects/library/fs-crud', '/github', '/integrations', '/local', '/deploy', '/fullstack', '/fullstack?tab=checklist', '/fullstack?tab=cloud', '/mentor', '/mentor?tab=commit', '/mentor?tab=test', '/learn/quality/quality-1', '/skills', '/roadmap', '/settings', '/tidak-ada']

describe('aksesibilitas (axe-core)', () => {
  it.each(ROUTES)('%s tanpa pelanggaran', async (path) => {
    const { container } = render(
      <StoreProvider initial={createInitialState()}>
        <ToastProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </ToastProvider>
      </StoreProvider>,
    )
    await waitFor(() => expect(screen.queryByText('Memuat halaman…')).toBeNull())
    const res = await axe.run(container, {
      iframes: false,
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
    const found = res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)
    expect(found).toEqual([])
  })
})
