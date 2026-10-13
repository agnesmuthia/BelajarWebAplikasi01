import { describe, expect, it } from 'vitest'
import { computeStatus, createRemote, createState, currentRepo, run, teammatePush, tokenize, type SimState } from '../git/sim'

function exec(s: SimState, ...cmds: string[]) {
  let state = s
  const outputs: string[][] = []
  for (const c of cmds) {
    const r = run(state, c)
    state = r.state
    outputs.push(r.lines.map((l) => l.text))
  }
  return { state, outputs, last: outputs[outputs.length - 1].join('\n') }
}

const identity = ['git config --global user.name "Agnes"', 'git config --global user.email "agnes@example.com"']

describe('tokenizer', () => {
  it('handles quotes and redirects', () => {
    expect(tokenize('git commit -m "Add first page"')).toEqual(['git', 'commit', '-m', 'Add first page'])
    expect(tokenize('echo "<h1>Hai</h1>" >> index.html')).toEqual(['echo', '<h1>Hai</h1>', '>>', 'index.html'])
    expect(tokenize("echo 'a b'>x")).toEqual(['echo', 'a b', '>', 'x'])
  })
})

describe('git simulator', () => {
  it('runs the beginner flow: init → add → commit → log', () => {
    let r = exec(createState(), 'mkdir latihan-git', 'cd latihan-git', 'git status')
    expect(r.last).toContain('fatal: not a git repository')
    r = exec(r.state, 'git init', 'echo "<h1>Halo</h1>" > index.html', 'git status')
    expect(r.last).toContain('Untracked files:')
    expect(r.last).toContain('index.html')
    r = exec(r.state, 'git add .', 'git commit -m "Add first page"')
    expect(r.last).toContain('Author identity unknown')
    r = exec(r.state, ...identity, 'git commit -m "Add first page"')
    expect(r.last).toMatch(/^\[main \(root-commit\) [0-9a-f]{7}\] Add first page/)
    r = exec(r.state, 'git status', 'git log --oneline')
    expect(r.outputs[0].join('\n')).toContain('nothing to commit, working tree clean')
    expect(r.last).toMatch(/[0-9a-f]{7} \(HEAD -> main\) Add first page/)
  })

  it('refuses git init in home and reports missing pathspecs', () => {
    expect(exec(createState(), 'git init').last).toContain('jangan menjalankan git init di folder home')
    const r = exec(createState(), 'mkdir p', 'cd p', 'git init', 'git add tidak-ada.html')
    expect(r.last).toContain("pathspec 'tidak-ada.html' did not match")
  })

  it('shows diffs and respects .gitignore', () => {
    let r = exec(createState(), ...identity, 'mkdir p', 'cd p', 'git init', 'echo "a" > a.txt', 'git add .', 'git commit -m "Add a"')
    r = exec(r.state, 'echo "b" >> a.txt', 'git diff')
    expect(r.last).toContain('+b')
    r = exec(r.state, 'mkdir node_modules', 'touch node_modules/x.js', 'echo "node_modules/" > .gitignore', 'git status')
    expect(r.last).toContain('.gitignore')
    expect(r.last).not.toContain('node_modules')
    r = exec(r.state, 'git add .', 'git diff --staged')
    expect(r.last).toContain('+node_modules/')
  })

  it('branches, fast-forwards and creates merge commits', () => {
    let r = exec(createState(), ...identity, 'mkdir p', 'cd p', 'git init', 'echo "home" > index.html', 'git add .', 'git commit -m "Add home"')
    r = exec(r.state, 'git switch -c fitur', 'echo "kontak" > kontak.html', 'git add .', 'git commit -m "Add contact page"', 'git switch main', 'ls')
    expect(r.last).not.toContain('kontak.html') // file mengikuti branch
    r = exec(r.state, 'git merge fitur')
    expect(r.last).toContain('Fast-forward')
    r = exec(r.state, 'git switch -c a', 'echo "x" > a.txt', 'git add .', 'git commit -m "A"', 'git switch main', 'echo "y" > b.txt', 'git add .', 'git commit -m "B"', 'git merge a')
    expect(r.last).toContain("Merge made by the 'ort' strategy.")
    const repo = currentRepo(r.state)!
    expect(repo.commits[repo.branches.main!].parents).toHaveLength(2)
  })

  it('produces a conflict that must be resolved before committing', () => {
    let r = exec(createState(), ...identity, 'mkdir p', 'cd p', 'git init', 'echo "Judul" > index.html', 'git add .', 'git commit -m "Init"')
    r = exec(r.state, 'git switch -c biru', 'echo "Judul Biru" > index.html', 'git commit -am "Biru"', 'git switch main', 'echo "Judul Merah" > index.html', 'git commit -am "Merah"', 'git merge biru')
    expect(r.last).toContain('CONFLICT (content): Merge conflict in index.html')
    expect(r.state.files['/home/siswa/p/index.html']).toContain('<<<<<<< HEAD')
    r = exec(r.state, 'git add .', 'git commit -m "Merge"')
    expect(r.last).toContain('masih berisi penanda konflik')
    r = exec(r.state, 'echo "Judul Ungu" > index.html', 'git add index.html', 'git commit -m "Merge biru"')
    expect(r.last).toContain('Merge biru')
    expect(computeStatus(r.state, currentRepo(r.state)!).staged).toHaveLength(0)
  })

  it('protects uncommitted work when switching branches', () => {
    let r = exec(createState(), ...identity, 'mkdir p', 'cd p', 'git init', 'echo 1 > a', 'git add .', 'git commit -m "1"', 'git branch b', 'git switch b', 'echo 2 > a', 'git commit -am "2"', 'git switch main')
    r = exec(r.state, 'echo 3 > a', 'git switch b')
    expect(r.last).toContain('would be overwritten by checkout')
  })

  it('pushes, rejects non-fast-forward, pulls and clones', () => {
    let s = createRemote(createState(), 'agnes', 'web')
    let r = exec(s, ...identity, 'mkdir web', 'cd web', 'git init', 'echo a > index.html', 'git add .', 'git commit -m "Init"', 'git push')
    expect(r.last).toContain('has no upstream branch')
    r = exec(r.state, 'git push -u origin main')
    expect(r.last).toContain("'origin' does not appear")
    r = exec(r.state, 'git remote add origin https://github.com/agnes/salah.git', 'git push -u origin main')
    expect(r.last).toContain('Repository not found')
    r = exec(r.state, 'git remote set-url origin https://github.com/agnes/web.git', 'git push -u origin main')
    expect(r.last).toContain('[new branch]')
    expect(r.last).toContain("set up to track 'origin/main'")

    s = teammatePush(r.state, 'https://github.com/agnes/web.git', 'README.md', '# Web\n', 'Add README')
    r = exec(s, 'echo b >> index.html', 'git commit -am "Update home"', 'git push')
    expect(r.last).toContain('[rejected]')
    r = exec(r.state, 'git pull', 'git push')
    expect(r.outputs[0].join('\n')).toContain("Merge made by the 'ort' strategy.")
    expect(r.last).toContain('main -> main')

    r = exec(r.state, 'cd ~', 'git clone https://github.com/agnes/web.git salinan', 'cd salinan', 'ls', 'git log --oneline')
    expect(r.outputs[3].join(' ')).toContain('README.md')
    expect(r.last).toContain('origin/main')
  })

  it('supports && chains and reports unknown commands', () => {
    const r = exec(createState(), 'mkdir a && cd a && pwd')
    expect(r.last).toBe('/home/siswa/a')
    expect(exec(createState(), 'gti status').last).toContain('command not found')
    expect(exec(createState(), 'git stats').last).toContain("is not a git command")
  })
})

import { MISSIONS, advance } from '../data/gitMissions'
import { HOME, writeFile } from '../git/sim'

type Step = string | { action: number } | { edit: [string, string] }
const SOLUTIONS: Record<string, Step[]> = {
  'terminal-basics': ['pwd', 'ls', 'mkdir latihan-git', 'cd latihan-git', 'cd ..', 'pwd'],
  'first-repo': ['git --version', 'git config --global user.name "A"', 'git config --global user.email "a@b.co"', 'cd latihan-git', 'git init', 'git status'],
  'first-commit': ['echo "<h1>Web</h1>" > index.html', 'git status', 'git add index.html', 'git status', 'git commit -m "Add homepage"', 'git log --oneline'],
  'daily-workflow': ['echo "<p>Hai</p>" >> index.html', 'git diff', 'git add index.html', 'git commit -m "Add text"', 'echo "# Web" > README.md', 'echo "node_modules/" > .gitignore', 'echo ".env" >> .gitignore', 'echo "KEY=x" > .env', 'git status', 'git add .', 'git commit -m "Add README and gitignore"'],
  branching: ['git branch', 'git switch -c fitur-kontak', 'echo "<h1>Kontak</h1>" > kontak.html', 'git add .', 'git commit -m "Add contact"', 'git switch main', 'ls', 'git merge fitur-kontak', 'git branch -d fitur-kontak'],
  'merge-conflict': ['git merge tema-biru', 'cat style.css', { edit: ['website-sekolah/style.css', 'h1 { color: blue; }\n'] }, 'git add style.css', 'git commit -m "Merge tema-biru"'],
  'remote-push-pull': [{ action: 0 }, 'git remote add origin https://github.com/kamu/website-sekolah.git', 'git push -u origin main', { action: 1 }, 'echo "<p>Info</p>" >> index.html', 'git commit -am "Add news"', 'git push', 'git pull', 'git push'],
  'clone-contribute': ['git clone https://github.com/devstudio-demo/website-sekolah.git', 'cd website-sekolah', 'git log --oneline', 'git switch -c perbaikan-typo', { edit: ['website-sekolah/berita.html', '<h1>Berita</h1>\n<p>Pendaftaran siswa baru dibuka.</p>\n'] }, 'git commit -am "Fix typo"'],
}

describe('missions', () => {
  for (const m of MISSIONS) {
    it(`mission “${m.title}” can be completed`, () => {
      let s = m.setup()
      let reached = advance(m, s, 0)
      expect(reached).toBe(0) // tidak ada langkah yang otomatis selesai
      for (const step of SOLUTIONS[m.id]) {
        if (typeof step === 'string') s = run(s, step).state
        else if ('action' in step) s = m.actions![step.action].run(s)
        else s = { ...writeFile(s, `${HOME}/${step.edit[0]}`, step.edit[1]), history: [...s.history, `[edit] ${step.edit[0].split('/').pop()}`] }
        reached = advance(m, s, reached)
      }
      expect(reached).toBe(m.steps.length)
    })
  }
})
