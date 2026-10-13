import { describe, expect, it } from 'vitest'
import { ALL_LESSONS, MODULES } from '../data/curriculum'
import { PROJECT_TEMPLATES } from '../data/projects'
import { tokenize } from '../lib/highlight'
import { buildPreviewDocument } from '../lib/preview'
import { computeSkills, isLessonUnlocked, nextLesson, projectProgress, streak } from '../lib/progress'
import { createInitialState, isGitHubRepoUrl, loadState, safeHttpUrl, sanitizeState, saveState, STORAGE_KEY } from '../lib/storage'
import type { AppState, UserProject } from '../lib/types'

const project = (over: Partial<UserProject> = {}): UserProject => ({
  id: 'p1',
  templateId: 'school-profile',
  name: 'Sekolah',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'active',
  favorite: false,
  tasksDone: [],
  testsDone: [],
  notes: '',
  repoUrl: '',
  deployUrl: '',
  history: [],
  ...over,
})

describe('content integrity', () => {
  it('every quiz question has exactly one correct answer and an explanation per option', () => {
    for (const l of ALL_LESSONS) {
      expect(l.quiz.length).toBeGreaterThan(0)
      for (const q of l.quiz) {
        expect(q.options.filter((o) => o.correct)).toHaveLength(1)
        for (const o of q.options) expect(o.why.length).toBeGreaterThan(0)
      }
    }
  })

  it('lesson ids are unique', () => {
    const ids = ALL_LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('templates reference existing lessons and have unique task ids and an index.html', () => {
    const lessonIds = new Set(ALL_LESSONS.map((l) => l.id))
    expect(PROJECT_TEMPLATES).toHaveLength(3)
    for (const t of PROJECT_TEMPLATES) {
      for (const id of t.recommendedLessons) expect(lessonIds.has(id)).toBe(true)
      expect(new Set(t.tasks.map((x) => x.id)).size).toBe(t.tasks.length)
      expect(new Set(t.testing.map((x) => x.id)).size).toBe(t.testing.length)
      expect(t.files.some((f) => f.path === 'index.html')).toBe(true)
      expect(t.rubric.reduce((a, r) => a + r.points, 0)).toBe(100)
    }
  })
})

describe('storage', () => {
  it('falls back to defaults for garbage input', () => {
    expect(sanitizeState(null)).toEqual(createInitialState())
    expect(sanitizeState({ version: 99 })).toEqual(createInitialState())
    expect(sanitizeState('x')).toEqual(createInitialState())
  })

  it('cleans invalid fields instead of crashing', () => {
    const s = sanitizeState({
      version: 1,
      settings: { theme: 'neon', mode: 'hack', dailyGoal: 9999, name: 'A'.repeat(500) },
      projects: [{ id: 'x' }, project({ status: 'weird' as never })],
      lessons: { 'html-1': { attempts: -3, passedAt: 'not-a-date' } },
      activity: [{ at: 'bad', kind: 'lesson', label: 'x' }],
    })
    expect(s.settings.theme).toBe('dark')
    expect(s.settings.mode).toBe('guided')
    expect(s.settings.dailyGoal).toBe(20)
    expect(s.settings.name).toHaveLength(60)
    expect(s.projects).toHaveLength(1)
    expect(s.projects[0].status).toBe('active')
    expect(s.lessons['html-1']).toEqual({ attempts: 0 })
    expect(s.activity).toHaveLength(0)
  })

  it('round-trips through storage and survives corrupt JSON', () => {
    const mem = new Map<string, string>()
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
    } as unknown as Storage
    const state: AppState = { ...createInitialState(), projects: [project()] }
    expect(saveState(state, storage)).toBe(true)
    expect(loadState(storage).projects[0].name).toBe('Sekolah')
    mem.set(STORAGE_KEY, '{oops')
    expect(loadState(storage)).toEqual(createInitialState())
  })

  it('only accepts http(s) URLs', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('data:text/html,hi')).toBeNull()
    expect(safeHttpUrl('https://example.com')).toBe('https://example.com/')
    expect(isGitHubRepoUrl('https://github.com/user/repo')).toBe(true)
    expect(isGitHubRepoUrl('https://github.com/user')).toBe(false)
    expect(isGitHubRepoUrl('https://evil.com/user/repo')).toBe(false)
  })
})

describe('progress', () => {
  const html = MODULES.find((m) => m.id === 'html')!

  it('unlocks lessons sequentially', () => {
    const s = createInitialState()
    expect(isLessonUnlocked(s, html, 'html-1')).toBe(true)
    expect(isLessonUnlocked(s, html, 'html-2')).toBe(false)
    s.lessons['html-1'] = { attempts: 1, passedAt: new Date().toISOString() }
    expect(isLessonUnlocked(s, html, 'html-2')).toBe(true)
    expect(nextLesson(s)?.lesson.id).toBe('html-2')
  })

  it('rates skills by evidence, not reading', () => {
    const s = createInitialState()
    s.lessons['css-1'] = { attempts: 1, passedAt: new Date().toISOString() }
    expect(computeSkills(s).find((x) => x.skill.id === 'css')?.level).toBe('learning')

    s.projects = [project({ tasksDone: ['colors'] })]
    expect(computeSkills(s).find((x) => x.skill.id === 'css')?.level).toBe('practiced')

    s.projects.push(project({ id: 'p2', templateId: 'takalar-tourism', tasksDone: ['hero'] }))
    s.projects.push(project({ id: 'p3', templateId: 'dev-portfolio', tasksDone: ['theme'] }))
    expect(computeSkills(s).find((x) => x.skill.id === 'css')?.level).toBe('mastered')
  })

  it('computes project progress over tasks and tests', () => {
    const tpl = PROJECT_TEMPLATES[0]
    const p = project({ tasksDone: tpl.tasks.map((t) => t.id), testsDone: tpl.testing.map((t) => t.id) })
    expect(projectProgress(p, tpl).percent).toBe(100)
    expect(projectProgress(project(), tpl).percent).toBe(0)
  })

  it('counts a streak that may end yesterday', () => {
    const now = new Date('2026-10-13T10:00:00')
    const day = (d: number) => new Date(2026, 9, d, 9).toISOString()
    const s = { ...createInitialState(), activity: [11, 12].map((d) => ({ at: day(d), kind: 'lesson' as 'lesson' | 'task', label: '' })) }
    expect(streak(s, now)).toBe(2)
    s.activity.push({ at: day(13), kind: 'task', label: '' })
    expect(streak(s, now)).toBe(3)
    expect(streak({ ...s, activity: [{ at: day(10), kind: 'task', label: '' }] }, now)).toBe(0)
  })
})

describe('preview & highlight', () => {
  it('inlines local CSS/JS, adds CSP, and escapes closing script tags', () => {
    const doc = buildPreviewDocument([
      { path: 'index.html', content: '<html><head><link rel="stylesheet" href="css/a.css"></head><body><script src="js/a.js"></script></body></html>' },
      { path: 'css/a.css', content: 'body{color:red}' },
      { path: 'js/a.js', content: 'console.log("</script>")' },
    ])
    expect(doc).toContain('Content-Security-Policy')
    expect(doc).toContain('body{color:red}')
    expect(doc).toContain('<\\/script>")')
    expect(doc).not.toContain('href="css/a.css"')
  })

  it('tokenizer never loses characters', () => {
    for (const t of PROJECT_TEMPLATES) {
      for (const f of t.files) {
        const lang = f.path.endsWith('.html') ? 'html' : f.path.endsWith('.css') ? 'css' : f.path.endsWith('.js') ? 'js' : 'md'
        expect(tokenize(f.content, lang).map((x) => x.text).join('')).toBe(f.content)
      }
    }
  })
})
