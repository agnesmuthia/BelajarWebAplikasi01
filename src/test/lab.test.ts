import { describe, expect, it } from 'vitest'
import { CHALLENGES, PLAYGROUND_TEMPLATES, solutionFiles } from '../data/challenges'
import { ALL_LESSONS } from '../data/curriculum'
import { sanitizeDrafts } from '../lab/drafts'
import { explainError } from '../lab/errorHints'
import { explainCode } from '../lab/glossary'
import { protectLoops } from '../lab/loopProtect'
import { buildLabDocument } from '../lab/runtime'
import { computeSkills } from '../lib/progress'
import { createInitialState } from '../lib/storage'

describe('loop protection', () => {
  it('guards braced loops without changing line count', () => {
    const src = 'for (let i = 0; i < 3; i++) {\n  x++\n}\nwhile (a) {\n}\ndo {\n} while (b)\n'
    const out = protectLoops(src)
    expect(out.match(/__dsLoop\(/g)).toHaveLength(3)
    expect(out.split('\n').length).toBe(src.split('\n').length)
    expect(out).toContain('__dsLoop(0,"js",1)')
    expect(out).toContain('__dsLoop(1,"js",4)')
  })

  it('ignores loop keywords inside strings, comments, regex and properties', () => {
    const src = 'const s = "for (;;) {"; // while (x) {\n/* do { */ const r = /for (a) {/; obj.for(1); x.while = 2;'
    expect(protectLoops(src)).toBe(src)
  })

  it('handles for...of and nested parens', () => {
    expect(protectLoops('for (const x of f(a, (b))) { }')).toContain('{__dsLoop(0,"js",1);')
  })

  it('leaves unbraced loops untouched (documented limitation)', () => {
    expect(protectLoops('while (x) x--;')).toBe('while (x) x--;')
  })
})

describe('lab document', () => {
  const files = {
    html: '<!doctype html>\n<html>\n<head>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n<p>a</p>\n<script src="script.js"></script>\n<p>b</p>\n</body>\n</html>',
    css: 'p {\n  color: red;\n}',
    js: 'console.log(1)\nconsole.log(2)',
  }

  it('inlines files, injects CSP and runtime, and maps lines back', () => {
    const b = buildLabDocument(files, { token: 't' })
    expect(b.linksCss && b.linksJs).toBe(true)
    expect(b.html).toContain('Content-Security-Policy')
    expect(b.html).toContain("default-src 'none'")
    const lines = b.html.split('\n')
    const find = (needle: string) => lines.findIndex((l) => l.includes(needle)) + 1
    expect(b.mapLine(find('color: red'))).toEqual({ file: 'css', line: 2 })
    expect(b.mapLine(find('console.log(2)'))).toEqual({ file: 'js', line: 2 })
    expect(b.mapLine(find('<p>b</p>'))).toEqual({ file: 'html', line: 9 })
    expect(b.mapLine(find('<p>a</p>'))).toEqual({ file: 'html', line: 7 })
  })

  it('reports missing links to style.css / script.js', () => {
    const b = buildLabDocument({ ...files, html: '<p>tanpa link</p>' })
    expect(b.linksCss).toBe(false)
    expect(b.linksJs).toBe(false)
    expect(b.html).not.toContain('color: red')
  })

  it('escapes </script> inside user JS', () => {
    const b = buildLabDocument({ ...files, js: 'const s = "</script><b>x</b>"' })
    expect(b.html).toContain('<\\/script><b>x</b>')
  })

  it('keeps html line numbers when there is no <head>', () => {
    const b = buildLabDocument({ html: '<!doctype html>\n<p>1</p>\n<p>2</p>', css: '', js: '' })
    const lines = b.html.split('\n')
    expect(b.mapLine(lines.findIndex((l) => l.includes('<p>2</p>')) + 1)).toEqual({ file: 'html', line: 3 })
    expect(b.html.startsWith('<!doctype html><meta')).toBe(true)
  })
})

describe('error hints & glossary', () => {
  it('explains common beginner errors', () => {
    expect(explainError("TypeError: Cannot read properties of null (reading 'addEventListener')")?.hint).toContain('querySelector')
    expect(explainError('ReferenceError: hitung is not defined')?.title).toContain('hitung')
    expect(explainError('TypeError: Assignment to constant variable.')?.hint).toContain('let')
    expect(explainError('Something weird')).toBeNull()
  })

  it('finds terms in html, css and js', () => {
    expect(explainCode('<img src="a.png" alt="x">', 'html').found.map((e) => e.term)).toEqual(expect.arrayContaining(['<img>', 'src', 'alt']))
    expect(explainCode('.a { display: flex; gap: 8px; }', 'css').found.map((e) => e.term)).toEqual(expect.arrayContaining(['display', 'gap']))
    const js = explainCode("const b = document.querySelector('#x'); // innerHTML", 'js').found.map((e) => e.term)
    expect(js).toEqual(expect.arrayContaining(['const', 'document', 'querySelector']))
    expect(js).not.toContain('innerHTML') // komentar diabaikan
  })
})

describe('challenge content', () => {
  it('has unique ids, valid lessons, and real changes in solutions', () => {
    const lessonIds = new Set(ALL_LESSONS.map((l) => l.id))
    expect(new Set(CHALLENGES.map((c) => c.id)).size).toBe(CHALLENGES.length)
    for (const c of CHALLENGES) {
      if (c.lesson) expect(lessonIds.has(c.lesson)).toBe(true)
      expect(c.checks.length).toBeGreaterThan(0)
      expect(c.hints.length).toBeGreaterThan(0)
      const sol = solutionFiles(c)
      expect(sol.html !== c.starter.html || sol.css !== c.starter.css || sol.js !== c.starter.js).toBe(true)
      expect(sol.html).toContain('style.css')
      for (const ch of c.checks) expect(() => new Function(`return (${String(ch.test)})`)).not.toThrow()
    }
    for (const l of ALL_LESSONS) if (l.lab) expect(CHALLENGES.some((c) => c.id === l.lab)).toBe(true)
    expect(PLAYGROUND_TEMPLATES.length).toBeGreaterThan(0)
  })
})

describe('drafts & skills', () => {
  it('sanitizes drafts', () => {
    const d = sanitizeDrafts({ a: { html: 1, css: 'x'.repeat(200_000), js: 'ok', updatedAt: 'bad' }, b: 'nope' })
    expect(Object.keys(d)).toEqual(['a'])
    expect(d.a.html).toBe('')
    expect(d.a.css.length).toBe(100_000)
  })

  it('counts lab challenges as practice evidence only without the solution', () => {
    const s = createInitialState()
    const now = new Date().toISOString()
    s.challenges['dom-counter'] = { runs: 2, hintsUsed: 0, solutionViewed: true, passedAt: now }
    expect(computeSkills(s).find((x) => x.skill.id === 'dom')?.level).toBe('none')
    s.challenges['dom-counter'].solutionViewed = false
    expect(computeSkills(s).find((x) => x.skill.id === 'dom')?.level).toBe('practiced')
    // tanpa tugas proyek, skill tidak bisa "dikuasai"
    s.lessons['dom-1'] = { attempts: 1, passedAt: now }
    s.challenges['dom-todo'] = { runs: 1, hintsUsed: 0, solutionViewed: false, passedAt: now }
    s.challenges['debug-js-button'] = { runs: 1, hintsUsed: 0, solutionViewed: false, passedAt: now }
    expect(computeSkills(s).find((x) => x.skill.id === 'dom')?.level).toBe('practiced')
  })
})
