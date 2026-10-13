import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '../App'
import { findLesson } from '../data/curriculum'
import { StoreProvider } from '../lib/store'
import { createInitialState } from '../lib/storage'
import { ToastProvider } from '../lib/toast'

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

beforeEach(() => localStorage.clear())

describe('app', () => {
  it('renders the dashboard with real (empty) data', () => {
    renderAt('/')
    expect(screen.getByText('Selamat datang di DevStudio')).toBeInTheDocument()
    expect(screen.getByText('0 dari 20 checkpoint lulus')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Continue Learning/ })).toHaveAttribute('href', '/learn/html/html-1')
  })

  it('passes a checkpoint only when every answer is correct', () => {
    renderAt('/learn/html/html-1')
    const lesson = findLesson('html-1')!
    const quiz = screen.getByRole('region', { name: 'Checkpoint' })
    const submit = within(quiz).getByRole('button', { name: 'Periksa jawaban' })

    // Jawab salah semua dulu
    lesson.quiz.forEach((q) => {
      const wrong = q.options.find((o) => !o.correct)!
      fireEvent.click(within(quiz).getByLabelText(wrong.text))
    })
    fireEvent.click(submit)
    expect(within(quiz).getByText(/Skor 0\/3/)).toBeInTheDocument()

    lesson.quiz.forEach((q) => {
      const right = q.options.find((o) => o.correct)!
      fireEvent.click(within(quiz).getByLabelText(right.text))
    })
    fireEvent.click(submit)
    expect(within(quiz).getByText(/Skor 3\/3 — Lulus!/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Teks, Link, dan Gambar/ })).toBeInTheDocument()
  })

  it('keeps later lessons locked', () => {
    renderAt('/learn/html/html-3')
    expect(screen.getByText('Pelajaran masih terkunci')).toBeInTheDocument()
  })

  it('shows the project library with three starter projects', () => {
    renderAt('/projects?tab=library')
    expect(screen.getByText('Website Profil Sekolah')).toBeInTheDocument()
    expect(screen.getByText('Website Wisata Takalar')).toBeInTheDocument()
    expect(screen.getByText('Portfolio Developer')).toBeInTheDocument()
  })
})

describe('coding lab', () => {
  it('lists all challenges and playground templates', () => {
    renderAt('/lab')
    expect(screen.getByText('0 dari 10 tantangan selesai')).toBeInTheDocument()
    expect(screen.getByText('Tombol yang Tidak Bereaksi')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Debugging' }))
    expect(screen.queryByText('Kartu Profil HTML')).not.toBeInTheDocument()
    expect(screen.getByText('Halaman kosong')).toBeInTheDocument()
  })
})
