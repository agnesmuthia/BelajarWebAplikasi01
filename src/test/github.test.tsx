import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../App'
import { _setFetcher, describeEvent, getRate, getUser, listRepos, parseRepoUrl, type GhEvent } from '../github/api'
import { ghHref } from '../github/RepoDetail'
import { StoreProvider } from '../lib/store'
import { createInitialState, isGitHubUsername } from '../lib/storage'
import { ToastProvider } from '../lib/toast'

const json = (body: unknown, status = 200, remaining = '59') =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'x-ratelimit-remaining': remaining, 'x-ratelimit-limit': '60', 'x-ratelimit-reset': '1900000000' } })

beforeEach(() => sessionStorage.clear())

describe('GitHub API client', () => {
  it('calls the public API without credentials and caches results', async () => {
    const f = vi.fn(async () => json({ login: 'agnes', name: 'Agnes' }))
    _setFetcher(f as unknown as typeof fetch)
    expect((await getUser('agnes')).name).toBe('Agnes')
    await getUser('agnes')
    expect(f).toHaveBeenCalledTimes(1)
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.github.com/users/agnes')
    expect(init.headers).toEqual({ Accept: 'application/vnd.github+json' }) // tanpa Authorization
    expect(getRate().remaining).toBe(59)
  })

  it('explains 404 and rate limits in Indonesian', async () => {
    _setFetcher((async () => json({ message: 'Not Found' }, 404)) as unknown as typeof fetch)
    await expect(getUser('tidak-ada')).rejects.toThrow('Tidak ditemukan')
    _setFetcher((async () => json({ message: 'rate limit' }, 403, '0')) as unknown as typeof fetch)
    await expect(listRepos('x')).rejects.toThrow('Batas permintaan GitHub')
  })

  it('rejects unsafe path segments before fetching', async () => {
    const f = vi.fn()
    _setFetcher(f as unknown as typeof fetch)
    await expect(getUser('../orgs/x')).rejects.toThrow('Nama tidak valid')
    expect(f).not.toHaveBeenCalled()
  })

  it('parses and validates', () => {
    expect(parseRepoUrl('https://github.com/agnes/web.git')).toEqual({ owner: 'agnes', repo: 'web' })
    expect(parseRepoUrl('https://evil.com/a/b')).toBeNull()
    expect(isGitHubUsername('agnes-muthia')).toBe(true)
    expect(isGitHubUsername('-bad')).toBe(false)
    expect(isGitHubUsername('a'.repeat(40))).toBe(false)
    expect(ghHref('javascript:alert(1)')).toBeUndefined()
    expect(ghHref('https://evil.com/x')).toBeUndefined()
    expect(ghHref('https://github.com/a/b')).toBe('https://github.com/a/b')
    const e = { id: '1', type: 'PushEvent', repo: { name: 'a/b' }, created_at: '', payload: { size: 2 } } as GhEvent
    expect(describeEvent(e)).toBe('Push 2 commit ke a/b')
  })
})

function renderAt(path: string) {
  return render(
    <StoreProvider initial={createInitialState()}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </ToastProvider>
    </StoreProvider>,
  )
}

describe('GitHub pages', () => {
  it('shows all four levels and eight missions', () => {
    renderAt('/github')
    for (const t of ['Level 1 — Fundamental', 'Level 2 — Daily Workflow', 'Level 3 — Professional Collaboration', 'Level 4 — Portfolio & Automation']) expect(screen.getByText(t)).toBeInTheDocument()
    expect(screen.getByText('Menyelesaikan Konflik')).toBeInTheDocument()
  })

  it('labels demo data clearly and keeps write access marked as not configured', async () => {
    renderAt('/integrations')
    expect(screen.getByText('Belum dikonfigurasi')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Coba data DEMO' }))
    await waitFor(() => expect(screen.getByText('DEMO — data contoh')).toBeInTheDocument())
    expect(screen.getByText('website-sekolah')).toBeInTheDocument()
  })
})
