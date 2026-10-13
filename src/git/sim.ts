/**
 * Simulator Git untuk belajar — BUKAN Git sungguhan.
 *
 * Meniru perilaku inti Git (working tree, staging area, commit, branch, merge,
 * remote) di dalam browser, lengkap dengan pesan yang mirip Git asli dan
 * penjelasan berbahasa Indonesia. Semua fungsi murni: run(state, perintah)
 * mengembalikan state baru tanpa mengubah state lama.
 */
import { diffLines } from '../workspace/diff'

export const HOME = '/home/siswa'

export interface Commit {
  id: string
  message: string
  author: string
  email: string
  time: number
  parents: string[]
  tree: Record<string, string>
}

export interface Repo {
  root: string
  head: string
  branches: Record<string, string | null>
  commits: Record<string, Commit>
  index: Record<string, string>
  remotes: Record<string, string>
  upstream: Record<string, string>
  /** Cabang remote yang terakhir di-fetch, mis. "origin/main". */
  tracking: Record<string, string | null>
  merging?: { branch: string; theirs: string; conflicts: string[] }
}

export interface RemoteRepo {
  url: string
  owner: string
  name: string
  defaultBranch: string
  branches: Record<string, string | null>
  commits: Record<string, Commit>
}

export interface SimState {
  cwd: string
  files: Record<string, string>
  dirs: string[]
  config: { name?: string; email?: string }
  repos: Record<string, Repo>
  remotes: Record<string, RemoteRepo>
  clock: number
  history: string[]
}

export type LineKind = 'out' | 'err' | 'hint' | 'ok' | 'add' | 'del' | 'muted' | 'cmd'
export interface Line {
  text: string
  kind: LineKind
}

export interface RunResult {
  state: SimState
  lines: Line[]
  /** Penjelasan berbahasa Indonesia tentang perintah & output-nya. */
  explain?: string
  clear?: boolean
}

export function createState(partial: Partial<SimState> = {}): SimState {
  return { cwd: HOME, files: {}, dirs: [HOME], config: {}, repos: {}, remotes: {}, clock: 1, history: [], ...partial }
}

/* ------------------------------------------------------------------ */
/*  Utilitas                                                          */
/* ------------------------------------------------------------------ */

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const out = (text: string): Line => ({ text, kind: 'out' })
const err = (text: string): Line => ({ text, kind: 'err' })
const hint = (text: string): Line => ({ text, kind: 'hint' })
const ok = (text: string): Line => ({ text, kind: 'ok' })
const muted = (text: string): Line => ({ text, kind: 'muted' })

/** Hash 40 karakter heksadesimal yang deterministik (Git asli memakai SHA-1/SHA-256). */
export function fakeHash(input: string): string {
  let h = ''
  let seed = 2166136261
  for (let round = 0; round < 5; round++) {
    let x = seed ^ round
    for (let i = 0; i < input.length; i++) {
      x ^= input.charCodeAt(i)
      x = Math.imul(x, 16777619) >>> 0
    }
    seed = x
    h += x.toString(16).padStart(8, '0')
  }
  return h
}

const short = (id: string | null | undefined) => (id ? id.slice(0, 7) : '')

export function tokenize(line: string): string[] {
  const tokens: string[] = []
  let cur = ''
  let quote: string | null = null
  let has = false
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null
      else cur += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
      has = true
    } else if (/\s/.test(ch)) {
      if (cur || has) tokens.push(cur)
      cur = ''
      has = false
    } else if (ch === '>' ) {
      if (cur || has) tokens.push(cur)
      cur = ''
      has = false
      if (tokens[tokens.length - 1] === '>') tokens[tokens.length - 1] = '>>'
      else tokens.push('>')
    } else {
      cur += ch
    }
  }
  if (cur || has) tokens.push(cur)
  return tokens
}

export function resolvePath(cwd: string, p: string): string {
  if (!p || p === '~') return HOME
  const base = p.startsWith('/') ? [] : p.startsWith('~/') ? HOME.split('/').filter(Boolean) : cwd.split('/').filter(Boolean)
  const rest = p.startsWith('~/') ? p.slice(2) : p
  for (const seg of rest.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') base.pop()
    else base.push(seg)
  }
  return '/' + base.join('/')
}

const displayPath = (p: string) => (p === HOME ? '~' : p.startsWith(HOME + '/') ? '~' + p.slice(HOME.length) : p)
export { displayPath }

function findRepo(s: SimState, dir = s.cwd): Repo | null {
  let best: Repo | null = null
  for (const r of Object.values(s.repos)) if ((dir === r.root || dir.startsWith(r.root + '/')) && (!best || r.root.length > best.root.length)) best = r
  return best
}

/** File kerja repo (path relatif terhadap root), tanpa folder .git. */
function workTree(s: SimState, repo: Repo): Record<string, string> {
  const t: Record<string, string> = {}
  for (const [abs, content] of Object.entries(s.files)) if (abs.startsWith(repo.root + '/')) t[abs.slice(repo.root.length + 1)] = content
  return t
}

function headTree(repo: Repo): Record<string, string> {
  const id = repo.branches[repo.head]
  return id ? repo.commits[id].tree : {}
}

function ignoredMatcher(work: Record<string, string>) {
  const rules = (work['.gitignore'] ?? '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  return (path: string) =>
    rules.some((r) => {
      if (r.endsWith('/')) return path.startsWith(r) || path.includes('/' + r)
      if (r.startsWith('*.')) return path.endsWith(r.slice(1))
      return path === r || path.endsWith('/' + r) || path.startsWith(r + '/')
    })
}

interface Status {
  staged: { path: string; type: 'new file' | 'modified' | 'deleted' }[]
  unstaged: { path: string; type: 'modified' | 'deleted' }[]
  untracked: string[]
}

export function computeStatus(s: SimState, repo: Repo): Status {
  const head = headTree(repo)
  const work = workTree(s, repo)
  const ignored = ignoredMatcher(work)
  const staged: Status['staged'] = []
  const unstaged: Status['unstaged'] = []
  const untracked: string[] = []
  for (const p of new Set([...Object.keys(head), ...Object.keys(repo.index)])) {
    if (!(p in head)) staged.push({ path: p, type: 'new file' })
    else if (!(p in repo.index)) staged.push({ path: p, type: 'deleted' })
    else if (head[p] !== repo.index[p]) staged.push({ path: p, type: 'modified' })
  }
  for (const p of Object.keys(repo.index)) {
    if (!(p in work)) unstaged.push({ path: p, type: 'deleted' })
    else if (work[p] !== repo.index[p]) unstaged.push({ path: p, type: 'modified' })
  }
  for (const p of Object.keys(work)) if (!(p in repo.index) && !ignored(p)) untracked.push(p)
  const sort = <T extends { path: string }>(a: T[]) => a.sort((x, y) => x.path.localeCompare(y.path))
  return { staged: sort(staged), unstaged: sort(unstaged), untracked: untracked.sort() }
}

function isAncestor(commits: Record<string, Commit>, anc: string, of: string): boolean {
  const stack = [of]
  const seen = new Set<string>()
  while (stack.length) {
    const id = stack.pop()!
    if (id === anc) return true
    if (seen.has(id) || !commits[id]) continue
    seen.add(id)
    stack.push(...commits[id].parents)
  }
  return false
}

function mergeBase(commits: Record<string, Commit>, a: string, b: string): string | null {
  const ancA = new Set<string>()
  const st = [a]
  while (st.length) {
    const id = st.pop()!
    if (ancA.has(id) || !commits[id]) continue
    ancA.add(id)
    st.push(...commits[id].parents)
  }
  const queue = [b]
  const seen = new Set<string>()
  while (queue.length) {
    const id = queue.shift()!
    if (ancA.has(id)) return id
    if (seen.has(id) || !commits[id]) continue
    seen.add(id)
    queue.push(...commits[id].parents)
  }
  return null
}

/** Ganti seluruh file kerja yang dilacak dari tree lama menjadi tree baru (untracked dibiarkan). */
function checkoutTree(s: SimState, repo: Repo, from: Record<string, string>, to: Record<string, string>) {
  for (const p of Object.keys(from)) if (!(p in to)) delete s.files[`${repo.root}/${p}`]
  for (const [p, c] of Object.entries(to)) {
    s.files[`${repo.root}/${p}`] = c
    ensureDirs(s, `${repo.root}/${p}`)
  }
  repo.index = { ...to }
}

function ensureDirs(s: SimState, filePath: string) {
  const parts = filePath.split('/').filter(Boolean)
  for (let i = 1; i < parts.length; i++) {
    const d = '/' + parts.slice(0, i).join('/')
    if (!s.dirs.includes(d)) s.dirs.push(d)
  }
}

function newCommit(s: SimState, repo: Repo, message: string, parents: string[], tree: Record<string, string>): Commit {
  const time = s.clock++
  const id = fakeHash(`${message}|${parents.join(',')}|${JSON.stringify(tree)}|${time}|${s.config.name}`)
  const c: Commit = { id, message, author: s.config.name ?? '?', email: s.config.email ?? '?', time, parents, tree: { ...tree } }
  repo.commits[id] = c
  return c
}

function hasMarkers(text: string) {
  return /^<<<<<<< /m.test(text) && /^>>>>>>> /m.test(text)
}

const MAX_DIFF_LINES = 60

function diffOutput(path: string, a: string | undefined, b: string | undefined): Line[] {
  const lines: Line[] = [{ text: `diff --git a/${path} b/${path}`, kind: 'muted' }]
  if (a === undefined) lines.push(muted('new file'))
  if (b === undefined) lines.push(muted('deleted file'))
  const d = diffLines(a ?? '', b ?? '') ?? []
  let n = 0
  for (const l of d) {
    if (l.type === 'same') continue
    if (n++ > MAX_DIFF_LINES) {
      lines.push(muted('…'))
      break
    }
    lines.push({ text: (l.type === 'add' ? '+' : '-') + l.text, kind: l.type === 'add' ? 'add' : 'del' })
  }
  return lines
}

function parseRemoteUrl(url: string): { owner: string; name: string } | null {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url)
  return m ? { owner: m[1], name: m[2] } : null
}

const normUrl = (url: string) => {
  const p = parseRemoteUrl(url)
  return p ? `https://github.com/${p.owner}/${p.name}.git` : url
}

/* ------------------------------------------------------------------ */
/*  Penjelasan perintah                                                */
/* ------------------------------------------------------------------ */

const EXPLAIN: Record<string, string> = {
  pwd: 'pwd (print working directory) menampilkan folder tempatmu berada sekarang. Selalu cek ini sebelum menjalankan git init!',
  ls: 'ls menampilkan isi folder. Folder ditandai dengan / di akhir. Tambahkan -a untuk melihat file tersembunyi seperti .git dan .gitignore.',
  cd: 'cd (change directory) berpindah folder. “cd ..” naik satu tingkat, “cd ~” kembali ke folder home.',
  mkdir: 'mkdir membuat folder baru.',
  touch: 'touch membuat file kosong (atau memperbarui waktu file yang sudah ada).',
  echo: 'echo "teks" > file menulis teks ke file (menimpa isinya). Gunakan >> untuk menambahkan di akhir file.',
  cat: 'cat menampilkan isi file.',
  rm: 'rm menghapus file. Di terminal sungguhan, file yang dihapus dengan rm TIDAK masuk Recycle Bin — hati-hati.',
  version: 'git --version memastikan Git sudah terpasang. Jika muncul nomor versi, Git siap dipakai.',
  config: 'git config --global menyimpan identitasmu untuk SEMUA repository di komputer ini. Nama & email ini tercatat di setiap commit.',
  init: 'git init membuat folder tersembunyi .git yang berisi seluruh riwayat. Folder ini sekarang adalah repository. Jalankan sekali per proyek, di dalam folder proyek.',
  status: 'git status adalah perintah terpenting: menunjukkan branch aktif, file yang siap di-commit (staged, hijau), yang berubah tapi belum di-add (merah), dan file baru yang belum dilacak (untracked).',
  add: 'git add memindahkan perubahan ke staging area — “kotak” berisi perubahan yang akan disegel di commit berikutnya. git add . berarti semua perubahan di folder ini.',
  commit: 'git commit menyimpan isi staging area sebagai titik simpan permanen dengan pesan. Angka/huruf acak itu adalah ID commit (hash).',
  log: 'git log menampilkan riwayat commit, dari yang terbaru. --oneline meringkas tiap commit menjadi satu baris. HEAD menunjukkan posisimu sekarang.',
  diff: 'git diff menampilkan baris yang berubah tapi belum di-add (+ ditambah, - dihapus). git diff --staged menampilkan yang sudah di-add tapi belum di-commit.',
  restore: 'git restore <file> membuang perubahan yang belum di-add. git restore --staged <file> mengeluarkan file dari staging area tanpa membuang perubahannya.',
  branch: 'Branch adalah jalur kerja terpisah. Kamu bisa mencoba fitur baru di branch tanpa mengganggu main. Tanda * menunjukkan branch aktif.',
  switch: 'git switch berpindah branch; -c membuat branch baru sekaligus pindah ke sana. File di folder ikut berubah sesuai isi branch tujuan.',
  checkout: 'git checkout adalah perintah lama untuk berpindah branch (-b untuk membuat). Versi baru yang lebih jelas: git switch.',
  merge: 'git merge menggabungkan riwayat branch lain ke branch aktif. Fast-forward berarti Git cukup memajukan penunjuk branch; merge commit dibuat jika kedua branch sama-sama punya commit baru.',
  remote: 'Remote adalah alamat repository di internet (mis. GitHub). Namanya biasanya “origin”.',
  push: 'git push mengirim commit dari komputermu ke remote (GitHub). -u origin main mengingat pasangan branch ini, jadi lain kali cukup “git push”.',
  pull: 'git pull = git fetch (ambil commit baru dari remote) + git merge (gabungkan ke branch-mu). Lakukan sebelum mulai bekerja, terutama jika berkolaborasi.',
  fetch: 'git fetch mengambil commit baru dari remote tanpa mengubah file-mu. Hasilnya bisa dilihat dengan git log origin/main.',
  clone: 'git clone mengunduh seluruh repository (file + riwayat) dan otomatis mengatur remote “origin”.',
}

/* ------------------------------------------------------------------ */
/*  Perintah shell                                                     */
/* ------------------------------------------------------------------ */

function shell(s: SimState, args: string[]): RunResult | null {
  const [cmd, ...rest] = args
  const done = (lines: Line[], key = cmd): RunResult => ({ state: s, lines, explain: EXPLAIN[key] })

  switch (cmd) {
    case 'pwd':
      return done([out(s.cwd)])
    case 'ls': {
      const all = rest.includes('-a')
      const target = resolvePath(s.cwd, rest.find((a) => !a.startsWith('-')) ?? '.')
      if (!s.dirs.includes(target)) return done([err(`ls: tidak dapat mengakses '${rest[0]}': No such file or directory`)])
      const names = new Set<string>()
      for (const d of s.dirs) if (d.startsWith(target + '/') && !d.slice(target.length + 1).includes('/')) names.add(d.slice(target.length + 1) + '/')
      for (const f of Object.keys(s.files)) if (f.startsWith(target + '/') && !f.slice(target.length + 1).includes('/')) names.add(f.slice(target.length + 1))
      if (s.repos[target]) names.add('.git/')
      const list = [...names].filter((n) => all || !n.startsWith('.')).sort()
      return done(list.length ? [out(list.join('   '))] : [muted('(folder kosong)')])
    }
    case 'cd': {
      const target = resolvePath(s.cwd, rest[0] ?? '~')
      if (!s.dirs.includes(target)) return done([err(`cd: ${rest[0]}: No such file or directory`), hint('Gunakan ls untuk melihat folder yang ada.')])
      s.cwd = target
      return done([])
    }
    case 'mkdir': {
      const names = rest.filter((a) => !a.startsWith('-'))
      if (!names.length) return done([err('mkdir: missing operand'), hint('Contoh: mkdir latihan-git')])
      const lines: Line[] = []
      for (const n of names) {
        const p = resolvePath(s.cwd, n)
        if (s.dirs.includes(p)) lines.push(err(`mkdir: cannot create directory '${n}': File exists`))
        else if (!s.dirs.includes(p.slice(0, p.lastIndexOf('/')) || '/') && !rest.includes('-p')) lines.push(err(`mkdir: cannot create directory '${n}': No such file or directory`))
        else {
          ensureDirs(s, p + '/x')
        }
      }
      return done(lines)
    }
    case 'touch': {
      if (!rest.length) return done([err('touch: missing file operand')])
      for (const n of rest) {
        const p = resolvePath(s.cwd, n)
        if (!s.dirs.includes(p.slice(0, p.lastIndexOf('/')))) return done([err(`touch: cannot touch '${n}': No such file or directory`)])
        if (!(p in s.files)) s.files[p] = ''
      }
      return done([])
    }
    case 'echo': {
      const redir = rest.findIndex((t) => t === '>' || t === '>>')
      if (redir === -1) return done([out(rest.join(' '))])
      const text = rest.slice(0, redir).join(' ')
      const file = rest[redir + 1]
      if (!file) return done([err('bash: syntax error near unexpected token `newline\'')])
      const p = resolvePath(s.cwd, file)
      if (!s.dirs.includes(p.slice(0, p.lastIndexOf('/')))) return done([err(`bash: ${file}: No such file or directory`)])
      if (s.dirs.includes(p)) return done([err(`bash: ${file}: Is a directory`)])
      const prev = s.files[p] ?? ''
      s.files[p] = rest[redir] === '>>' ? prev + (prev && !prev.endsWith('\n') ? '\n' : '') + text + '\n' : text + '\n'
      return done([])
    }
    case 'cat': {
      if (!rest.length) return done([err('cat: missing file operand')])
      const p = resolvePath(s.cwd, rest[0])
      if (!(p in s.files)) return done([err(`cat: ${rest[0]}: No such file or directory`)])
      return done(s.files[p].replace(/\n$/, '').split('\n').map(out))
    }
    case 'rm': {
      const recursive = rest.some((a) => /^-[a-z]*r/.test(a))
      const names = rest.filter((a) => !a.startsWith('-'))
      if (!names.length) return done([err('rm: missing operand')])
      for (const n of names) {
        const p = resolvePath(s.cwd, n)
        if (p in s.files) delete s.files[p]
        else if (s.dirs.includes(p)) {
          if (!recursive) return done([err(`rm: cannot remove '${n}': Is a directory`), hint('Gunakan rm -r untuk menghapus folder.')])
          if (p === HOME || s.cwd.startsWith(p)) return done([err('rm: menolak menghapus folder yang sedang dipakai (DevStudio).')])
          s.dirs = s.dirs.filter((d) => d !== p && !d.startsWith(p + '/'))
          for (const f of Object.keys(s.files)) if (f.startsWith(p + '/')) delete s.files[f]
          for (const r of Object.keys(s.repos)) if (r === p || r.startsWith(p + '/')) delete s.repos[r]
        } else return done([err(`rm: cannot remove '${n}': No such file or directory`)])
      }
      return done([])
    }
    case 'nano':
    case 'vim':
    case 'vi':
    case 'code':
      return done([muted(`${cmd}: editor tidak tersedia di terminal simulasi.`), hint('Gunakan panel File di samping untuk mengedit, atau echo "teks" > file.')])
    case 'help':
      return done(
        [
          'Perintah shell : pwd, ls [-a], cd, mkdir, touch, echo "teks" > file, cat, rm, clear, history',
          'Perintah git   : --version, config, init, status, add, restore, commit, log, diff,',
          '                 branch, switch, checkout, merge, remote, push, pull, fetch, clone',
          'Tips           : ↑/↓ untuk riwayat perintah, Tab untuk melengkapi nama file.',
        ].map(out),
        'help',
      )
    case 'history':
      return done(s.history.map((h, i) => out(`${String(i + 1).padStart(4)}  ${h}`)))
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/*  Perintah git                                                       */
/* ------------------------------------------------------------------ */

function git(s: SimState, args: string[]): RunResult {
  const [sub, ...rest] = args
  const done = (lines: Line[], key = sub): RunResult => ({ state: s, lines, explain: EXPLAIN[key] })
  const notRepo = () => done([err('fatal: not a git repository (or any of the parent directories): .git'), hint(`Kamu berada di ${displayPath(s.cwd)}. Masuk ke folder proyek (cd) atau jalankan git init terlebih dulu.`)])

  if (!sub || sub === 'help' || sub === '--help') return done([out('usage: git <command> [<args>]'), hint('Ketik help untuk daftar perintah yang tersedia di simulator.')], 'help')
  if (sub === '--version' || sub === 'version') return done([out('git version 2.47.0 (simulasi DevStudio)')], 'version')

  if (sub === 'config') {
    const list = rest.includes('--list') || rest.includes('-l')
    if (list) return done([out(`user.name=${s.config.name ?? ''}`), out(`user.email=${s.config.email ?? ''}`)], 'config')
    const keys = rest.filter((a) => !a.startsWith('--'))
    const [key, value] = keys
    if (key !== 'user.name' && key !== 'user.email') return done([err(`error: key does not contain a section: ${key ?? ''}`), hint('Contoh: git config --global user.name "Nama Kamu"')], 'config')
    if (value === undefined) return done([out((key === 'user.name' ? s.config.name : s.config.email) ?? '')], 'config')
    if (key === 'user.email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return done([err('Email tidak valid (DevStudio).'), hint('Gunakan email yang sama dengan akun GitHub-mu.')], 'config')
    if (key === 'user.name') s.config.name = value
    else s.config.email = value
    return done([], 'config')
  }

  if (sub === 'init') {
    if (s.cwd === HOME) {
      // Git asli mengizinkan ini, tetapi hampir selalu kesalahan pemula.
      return done([err('DevStudio: jangan menjalankan git init di folder home!'), hint('Buat dan masuk ke folder proyek dulu: mkdir proyek && cd proyek. (Git asli akan mengizinkannya — dan seluruh isi home ikut terlacak.)')], 'init')
    }
    if (s.repos[s.cwd]) return done([out(`Reinitialized existing Git repository in ${s.cwd}/.git/`)], 'init')
    s.repos[s.cwd] = { root: s.cwd, head: 'main', branches: { main: null }, commits: {}, index: {}, remotes: {}, upstream: {}, tracking: {} }
    return done([out(`Initialized empty Git repository in ${s.cwd}/.git/`)], 'init')
  }

  if (sub === 'clone') {
    const url = rest.find((a) => !a.startsWith('-'))
    if (!url) return done([err('fatal: You must specify a repository to clone.')], 'clone')
    const remote = s.remotes[normUrl(url)]
    const parsed = parseRemoteUrl(url)
    const dirName = rest.filter((a) => !a.startsWith('-'))[1] ?? parsed?.name ?? 'repo'
    const target = resolvePath(s.cwd, dirName)
    if (s.dirs.includes(target)) return done([err(`fatal: destination path '${dirName}' already exists and is not an empty directory.`)], 'clone')
    if (!remote) return done([out(`Cloning into '${dirName}'...`), err('remote: Repository not found.'), err(`fatal: repository '${url}' not found`), hint('Periksa alamat (huruf besar/kecil), atau pastikan repository sudah dibuat di GitHub.')], 'clone')
    ensureDirs(s, target + '/x')
    const head = remote.branches[remote.defaultBranch]
    const repo: Repo = {
      root: target,
      head: remote.defaultBranch,
      branches: { [remote.defaultBranch]: head },
      commits: clone(remote.commits),
      index: {},
      remotes: { origin: remote.url },
      upstream: { [remote.defaultBranch]: `origin/${remote.defaultBranch}` },
      tracking: Object.fromEntries(Object.entries(remote.branches).map(([b, id]) => [`origin/${b}`, id])),
    }
    s.repos[target] = repo
    if (head) checkoutTree(s, repo, {}, repo.commits[head].tree)
    const n = Object.keys(remote.commits).length
    return done([out(`Cloning into '${dirName}'...`), out(`remote: Enumerating objects: ${n * 3}, done.`), out(`Receiving objects: 100% (${n * 3}/${n * 3}), done.`)], 'clone')
  }

  const KNOWN = ['status', 'add', 'restore', 'commit', 'log', 'diff', 'branch', 'switch', 'checkout', 'merge', 'remote', 'push', 'pull', 'fetch']
  if (!KNOWN.includes(sub)) return done([err(`git: '${sub}' is not a git command. See 'git --help'.`)], 'help')
  const repo = findRepo(s)
  if (!repo) return notRepo()

  switch (sub) {
    case 'status': {
      const st = computeStatus(s, repo)
      const lines: Line[] = [out(`On branch ${repo.head}`)]
      const up = repo.upstream[repo.head]
      if (up && repo.tracking[up] !== undefined) {
        const local = repo.branches[repo.head]
        const remote = repo.tracking[up]
        if (local === remote) lines.push(out(`Your branch is up to date with '${up}'.`))
        else if (remote && local && isAncestor(repo.commits, remote, local)) lines.push(out(`Your branch is ahead of '${up}'.`), hint('  (use "git push" to publish your local commits)'))
        else if (remote && local && isAncestor(repo.commits, local, remote)) lines.push(out(`Your branch is behind '${up}'.`), hint('  (use "git pull" to update your local branch)'))
      }
      if (repo.merging) lines.push(out('You have unmerged paths.'), hint('  (fix conflicts and run "git commit")'))
      if (!repo.branches[repo.head]) lines.push(out(''), out('No commits yet'))
      if (st.staged.length) {
        lines.push(out(''), out('Changes to be committed:'), hint('  (use "git restore --staged <file>..." to unstage)'))
        st.staged.forEach((c) => lines.push(ok(`        ${(c.type + ':').padEnd(12)}${c.path}`)))
      }
      if (st.unstaged.length) {
        lines.push(out(''), out('Changes not staged for commit:'), hint('  (use "git add <file>..." to update what will be committed)'))
        st.unstaged.forEach((c) => lines.push(err(`        ${(c.type + ':').padEnd(12)}${c.path}`)))
      }
      if (st.untracked.length) {
        lines.push(out(''), out('Untracked files:'), hint('  (use "git add <file>..." to include in what will be committed)'))
        st.untracked.forEach((p) => lines.push(err(`        ${p}`)))
      }
      if (!st.staged.length && !st.unstaged.length && !st.untracked.length) {
        lines.push(out(''), out(repo.branches[repo.head] ? 'nothing to commit, working tree clean' : 'nothing to commit (create/copy files and use "git add" to track)'))
      } else if (!st.staged.length) lines.push(out(''), out('no changes added to commit (use "git add" and/or "git commit -a")'))
      let explain = EXPLAIN.status
      if (st.untracked.length) explain += ` Saat ini ada ${st.untracked.length} file untracked — Git belum melacaknya sampai kamu menjalankan git add.`
      if (st.staged.length) explain += ` ${st.staged.length} perubahan sudah di staging area dan akan masuk commit berikutnya.`
      return { state: s, lines, explain }
    }

    case 'add': {
      const specs = rest.filter((a) => !a.startsWith('-') || a === '-A')
      if (!specs.length) return done([out('Nothing specified, nothing added.'), hint('Maybe you wanted to say \'git add .\'?')])
      const work = workTree(s, repo)
      const ignored = ignoredMatcher(work)
      const relCwd = s.cwd === repo.root ? '' : s.cwd.slice(repo.root.length + 1)
      let matched = 0
      const lines: Line[] = []
      for (const spec of specs) {
        const all = spec === '.' || spec === '-A' || spec === '--all'
        const abs = all ? s.cwd : resolvePath(s.cwd, spec)
        const rel = abs === repo.root ? '' : abs.slice(repo.root.length + 1)
        const prefix = all ? relCwd : rel
        const inScope = (p: string) => !prefix || p === prefix || p.startsWith(prefix + '/')
        let hit = false
        for (const [p, c] of Object.entries(work)) {
          if (!inScope(p)) continue
          if (ignored(p) && !(p in repo.index)) {
            if (!all && p === rel) lines.push(err('The following paths are ignored by one of your .gitignore files:'), err(p))
            continue
          }
          repo.index[p] = c
          hit = true
          matched++
        }
        for (const p of Object.keys(repo.index)) if (inScope(p) && !(p in work)) {
          delete repo.index[p]
          hit = true
          matched++
        }
        if (!hit && !all && !lines.length) lines.push(err(`fatal: pathspec '${spec}' did not match any files`))
      }
      return { state: s, lines, explain: EXPLAIN.add + (matched ? ' Jalankan git status untuk melihat hasilnya (file sekarang berwarna hijau).' : '') }
    }

    case 'restore': {
      const staged = rest.includes('--staged') || rest.includes('-S')
      const files = rest.filter((a) => !a.startsWith('-'))
      if (!files.length) return done([err('fatal: you must specify path(s) to restore')])
      const head = headTree(repo)
      for (const f of files) {
        const rel = resolvePath(s.cwd, f).slice(repo.root.length + 1)
        if (staged) {
          if (rel in head) repo.index[rel] = head[rel]
          else delete repo.index[rel]
        } else {
          if (!(rel in repo.index)) return done([err(`error: pathspec '${f}' did not match any file(s) known to git`)])
          s.files[`${repo.root}/${rel}`] = repo.index[rel]
        }
      }
      return done([])
    }

    case 'commit': {
      if (!s.config.name || !s.config.email)
        return done([err('Author identity unknown'), out(''), out('*** Please tell me who you are.'), out(''), out('Run'), out(''), out('  git config --global user.email "you@example.com"'), out('  git config --global user.name "Your Name"')], 'commit')
      const all = rest.includes('-a') || rest.includes('-am')
      const msgIdx = rest.findIndex((a) => a === '-m' || a === '-am')
      const message = msgIdx >= 0 ? rest[msgIdx + 1] : undefined
      if (all) {
        const work = workTree(s, repo)
        for (const p of Object.keys(repo.index)) {
          if (p in work) repo.index[p] = work[p]
          else delete repo.index[p]
        }
      }
      if (message === undefined || (!message.trim() && !repo.merging)) {
        if (msgIdx >= 0) return done([err('Aborting commit due to empty commit message.')], 'commit')
        return done([err('DevStudio: editor pesan commit tidak tersedia di simulasi.'), hint('Tulis pesan langsung: git commit -m "Pesan singkat tentang perubahan"')], 'commit')
      }
      const conflicted = Object.entries(repo.index).filter(([, c]) => hasMarkers(c)).map(([p]) => p)
      if (conflicted.length)
        return done([err(`DevStudio: ${conflicted.join(', ')} masih berisi penanda konflik (<<<<<<< ======= >>>>>>>).`), hint('Edit file, hapus penanda & pilih isi yang benar, lalu git add lagi. (Git asli akan TETAP mengizinkan commit ini — hati-hati!)')], 'commit')
      const head = headTree(repo)
      const parentId = repo.branches[repo.head]
      if (!repo.merging && JSON.stringify(head) === JSON.stringify(repo.index)) {
        const st = computeStatus(s, repo)
        return done([out(`On branch ${repo.head}`), out(st.unstaged.length || st.untracked.length ? 'no changes added to commit (use "git add" and/or "git commit -a")' : 'nothing to commit, working tree clean'), ...(st.unstaged.length || st.untracked.length ? [hint('Perubahan harus di-add dulu sebelum commit.')] : [])], 'commit')
      }
      const parents = [parentId, repo.merging?.theirs].filter((x): x is string => Boolean(x))
      const msg = message.trim() || `Merge branch '${repo.merging?.branch}'`
      const c = newCommit(s, repo, msg, parents, repo.index)
      repo.branches[repo.head] = c.id
      const changed = new Set([...Object.keys(head), ...Object.keys(repo.index)].filter((p) => head[p] !== repo.index[p])).size
      repo.merging = undefined
      const lines = [out(`[${repo.head}${parentId ? '' : ' (root-commit)'} ${short(c.id)}] ${msg}`), out(` ${changed} file${changed === 1 ? '' : 's'} changed`)]
      let explain = EXPLAIN.commit
      if (/^(update|fix|edit|perubahan|ubah|asdf|test|wip)$/i.test(msg.trim())) explain += ` Pesan “${msg}” kurang jelas — lebih baik jelaskan APA yang berubah, mis. "Add contact section".`
      return { state: s, lines, explain }
    }

    case 'log': {
      const oneline = rest.includes('--oneline')
      const ref = rest.find((a) => !a.startsWith('-'))
      const start = ref ? (repo.branches[ref] ?? repo.tracking[ref] ?? null) : repo.branches[repo.head]
      if (ref && start === undefined) return done([err(`fatal: ambiguous argument '${ref}': unknown revision`)])
      if (!start) return done([err(`fatal: your current branch '${repo.head}' does not have any commits yet`), hint('Buat commit pertama dulu: git add . lalu git commit -m "pesan"')])
      const lines: Line[] = []
      const seen = new Set<string>()
      const queue = [start]
      const ordered: Commit[] = []
      while (queue.length) {
        const id = queue.shift()!
        if (seen.has(id) || !repo.commits[id]) continue
        seen.add(id)
        ordered.push(repo.commits[id])
        queue.push(...repo.commits[id].parents)
      }
      ordered.sort((a, b) => b.time - a.time)
      const labels = (id: string) => {
        const l: string[] = []
        if (id === repo.branches[repo.head]) l.push(`HEAD -> ${repo.head}`)
        for (const [b, cid] of Object.entries(repo.branches)) if (cid === id && b !== repo.head) l.push(b)
        for (const [b, cid] of Object.entries(repo.tracking)) if (cid === id) l.push(b)
        return l.length ? ` (${l.join(', ')})` : ''
      }
      for (const c of ordered.slice(0, 30)) {
        if (oneline) lines.push({ text: `${short(c.id)}${labels(c.id)} ${c.message}`, kind: 'out' })
        else {
          lines.push({ text: `commit ${c.id}${labels(c.id)}`, kind: 'hint' })
          if (c.parents.length > 1) lines.push(out(`Merge: ${c.parents.map(short).join(' ')}`))
          lines.push(out(`Author: ${c.author} <${c.email}>`), out(`Date:   (waktu ke-${c.time})`), out(''), out(`    ${c.message}`), out(''))
        }
      }
      return done(lines)
    }

    case 'diff': {
      const staged = rest.includes('--staged') || rest.includes('--cached')
      const lines: Line[] = []
      if (staged) {
        const head = headTree(repo)
        for (const p of [...new Set([...Object.keys(head), ...Object.keys(repo.index)])].sort()) if (head[p] !== repo.index[p]) lines.push(...diffOutput(p, head[p], repo.index[p]))
      } else {
        const work = workTree(s, repo)
        for (const p of Object.keys(repo.index).sort()) if (work[p] !== repo.index[p]) lines.push(...diffOutput(p, repo.index[p], work[p]))
      }
      if (!lines.length) return done([muted(staged ? '(tidak ada perubahan di staging area)' : '(tidak ada perubahan yang belum di-add)')])
      return done(lines)
    }

    case 'branch': {
      const del = rest.find((a) => a === '-d' || a === '-D')
      const names = rest.filter((a) => !a.startsWith('-'))
      if (rest.includes('-a') || (!names.length && !del)) {
        const lines = Object.keys(repo.branches).sort().map((b) => (b === repo.head ? ok(`* ${b}`) : out(`  ${b}`)))
        if (rest.includes('-a')) Object.keys(repo.tracking).forEach((t) => lines.push(err(`  remotes/${t}`)))
        return done(lines)
      }
      const name = names[0]
      if (del) {
        if (!(name in repo.branches)) return done([err(`error: branch '${name}' not found.`)])
        if (name === repo.head) return done([err(`error: Cannot delete branch '${name}' checked out at '${repo.root}'`)])
        const tip = repo.branches[name]
        const cur = repo.branches[repo.head]
        if (del === '-d' && tip && cur && !isAncestor(repo.commits, tip, cur)) return done([err(`error: The branch '${name}' is not fully merged.`), hint(`If you are sure you want to delete it, run 'git branch -D ${name}'.`)])
        delete repo.branches[name]
        return done([out(`Deleted branch ${name} (was ${short(tip)}).`)])
      }
      if (!/^[\w./-]+$/.test(name) || name.includes('..')) return done([err(`fatal: '${name}' is not a valid branch name`), hint('Gunakan huruf kecil dan tanda hubung, mis. fitur-kontak')])
      if (name in repo.branches) return done([err(`fatal: a branch named '${name}' already exists`)])
      if (!repo.branches[repo.head]) return done([err(`fatal: not a valid object name: '${repo.head}'`), hint('Branch baru butuh minimal satu commit. Buat commit pertama dulu.')])
      repo.branches[name] = repo.branches[repo.head]
      return done([], 'branch')
    }

    case 'switch':
    case 'checkout': {
      const create = rest.includes('-c') || rest.includes('-b')
      const name = rest.filter((a) => !a.startsWith('-'))[0]
      if (!name) return done([err(`fatal: missing branch or commit argument`)], sub)
      if (repo.merging) return done([err('error: you need to resolve your current index first')], sub)
      if (create) {
        if (name in repo.branches) return done([err(`fatal: a branch named '${name}' already exists`)], sub)
        if (!/^[\w./-]+$/.test(name)) return done([err(`fatal: '${name}' is not a valid branch name`)], sub)
        repo.branches[name] = repo.branches[repo.head]
        repo.head = name
        return done([out(`Switched to a new branch '${name}'`)], sub)
      }
      if (!(name in repo.branches)) {
        const remoteTip = repo.tracking[`origin/${name}`]
        if (remoteTip) {
          const from = headTree(repo)
          repo.branches[name] = remoteTip
          repo.upstream[name] = `origin/${name}`
          repo.head = name
          checkoutTree(s, repo, from, repo.commits[remoteTip].tree)
          return done([out(`branch '${name}' set up to track 'origin/${name}'.`), out(`Switched to a new branch '${name}'`)], sub)
        }
        return done([err(`fatal: invalid reference: ${name}`), hint(`Belum ada branch '${name}'. Buat dengan: git switch -c ${name}`)], sub)
      }
      if (name === repo.head) return done([out(`Already on '${name}'`)], sub)
      const st = computeStatus(s, repo)
      const target = repo.branches[name] ? repo.commits[repo.branches[name]!].tree : {}
      const from = headTree(repo)
      const blocking = [...st.staged.map((c) => c.path), ...st.unstaged.map((c) => c.path)].filter((p) => from[p] !== target[p])
      if (blocking.length)
        return done([err('error: Your local changes to the following files would be overwritten by checkout:'), ...blocking.map((p) => err(`\t${p}`)), err('Please commit your changes or stash them before you switch branches.'), out('Aborting')], sub)
      repo.head = name
      checkoutTree(s, repo, from, target)
      // Perubahan yang tidak bentrok ikut terbawa (seperti Git asli).
      for (const c of st.unstaged) if (c.type === 'modified') s.files[`${repo.root}/${c.path}`] = workTree(s, repo)[c.path] ?? s.files[`${repo.root}/${c.path}`]
      return done([out(`Switched to branch '${name}'`)], sub)
    }

    case 'merge': {
      if (rest.includes('--abort')) {
        if (!repo.merging) return done([err('fatal: There is no merge to abort (MERGE_HEAD missing).')])
        const head = headTree(repo)
        checkoutTree(s, repo, workTree(s, repo), head)
        repo.merging = undefined
        return done([out('Merge dibatalkan; file dikembalikan ke kondisi sebelum merge.')])
      }
      const name = rest.find((a) => !a.startsWith('-'))
      if (!name) return done([err('fatal: No remote for the current branch.')])
      const theirs = repo.branches[name] ?? repo.tracking[name]
      if (theirs === undefined) return done([err(`merge: ${name} - not something we can merge`)])
      return mergeInto(s, repo, name, theirs)
    }

    case 'remote': {
      const [action, name, url] = rest
      if (!action || action === '-v') {
        const lines: Line[] = []
        for (const [n, u] of Object.entries(repo.remotes)) lines.push(out(`${n}\t${u} (fetch)`), out(`${n}\t${u} (push)`))
        return done(lines.length ? lines : [muted('(belum ada remote)')])
      }
      if (action === 'add') {
        if (!name || !url) return done([err('usage: git remote add <name> <url>')])
        if (repo.remotes[name]) return done([err(`error: remote ${name} already exists.`), hint('Ganti alamat dengan: git remote set-url origin <url>')])
        if (!parseRemoteUrl(url)) return done([err('DevStudio: alamat harus seperti https://github.com/username/nama-repo.git')])
        repo.remotes[name] = normUrl(url)
        return done([])
      }
      if (action === 'set-url') {
        if (!repo.remotes[name]) return done([err(`error: No such remote '${name}'`)])
        repo.remotes[name] = normUrl(url)
        return done([])
      }
      if (action === 'remove' || action === 'rm') {
        if (!repo.remotes[name]) return done([err(`error: No such remote: '${name}'`)])
        delete repo.remotes[name]
        return done([])
      }
      return done([err(`error: Unknown subcommand: ${action}`)])
    }

    case 'push': {
      const setUp = rest.includes('-u') || rest.includes('--set-upstream')
      const pos = rest.filter((a) => !a.startsWith('-'))
      let remoteName = pos[0]
      let branch = pos[1]
      if (!remoteName) {
        const up = repo.upstream[repo.head]
        if (!up) return done([err(`fatal: The current branch ${repo.head} has no upstream branch.`), err('To push the current branch and set the remote as upstream, use'), out(''), out(`    git push --set-upstream origin ${repo.head}`), out('')])
        ;[remoteName, branch] = up.split('/')
      }
      branch ??= repo.head
      const url = repo.remotes[remoteName]
      if (!url) return done([err(`fatal: '${remoteName}' does not appear to be a git repository`), err('fatal: Could not read from remote repository.'), hint('Tambahkan remote dulu: git remote add origin https://github.com/username/repo.git')])
      const remote = s.remotes[url]
      if (!remote) return done([err('remote: Repository not found.'), err(`fatal: repository '${url}' not found`), hint('Repository harus dibuat dulu di GitHub (tombol “New repository”), dan alamatnya harus sama persis.')])
      const local = repo.branches[branch]
      if (local === undefined) return done([err(`error: src refspec ${branch} does not match any`)])
      if (!local) return done([err(`error: src refspec ${branch} does not match any`), hint('Branch ini belum punya commit. Commit dulu sebelum push.')])
      const remoteTip = remote.branches[branch]
      if (remoteTip && !isAncestor(repo.commits, remoteTip, local)) {
        return done([out(`To ${url}`), err(` ! [rejected]        ${branch} -> ${branch} (fetch first)`), err(`error: failed to push some refs to '${url}'`), hint('hint: Updates were rejected because the remote contains work that you do not'), hint('hint: have locally. Integrate the remote changes (e.g. \'git pull ...\') before pushing again.')], 'push')
      }
      for (const [id, c] of Object.entries(repo.commits)) if (isAncestor(repo.commits, id, local)) remote.commits[id] = clone(c)
      remote.branches[branch] = local
      repo.tracking[`${remoteName}/${branch}`] = local
      if (setUp) repo.upstream[branch] = `${remoteName}/${branch}`
      const lines = [out(`To ${url}`), ok(remoteTip === local ? 'Everything up-to-date' : `   ${remoteTip ? short(remoteTip) + '..' : ' * [new branch]      '}${remoteTip ? short(local) + '  ' : ''}${branch} -> ${branch}`)]
      if (setUp) lines.push(out(`branch '${branch}' set up to track '${remoteName}/${branch}'.`))
      return { state: s, lines, explain: EXPLAIN.push + ' Di komputer sungguhan, push pertama meminta login GitHub (lewat browser/Git Credential Manager) — bukan password akun.' }
    }

    case 'fetch':
    case 'pull': {
      const pos = rest.filter((a) => !a.startsWith('-'))
      let remoteName = pos[0]
      let branch = pos[1]
      if (!remoteName) {
        const up = repo.upstream[repo.head]
        if (!up) {
          if (sub === 'fetch' && repo.remotes.origin) remoteName = 'origin'
          else return done([err('There is no tracking information for the current branch.'), hint(`Gunakan: git pull origin ${repo.head}`)])
        } else [remoteName, branch] = up.split('/')
      }
      const url = repo.remotes[remoteName]
      const remote = url ? s.remotes[url] : undefined
      if (!url || !remote) return done([err(`fatal: '${remoteName}' does not appear to be a git repository`)])
      for (const [id, c] of Object.entries(remote.commits)) if (!repo.commits[id]) repo.commits[id] = clone(c)
      for (const [b, id] of Object.entries(remote.branches)) repo.tracking[`${remoteName}/${b}`] = id
      if (sub === 'fetch') return done([out(`From ${url}`), ...Object.keys(remote.branches).map((b) => out(`   ${b} -> ${remoteName}/${b}`))], 'fetch')
      branch ??= repo.head
      const theirs = remote.branches[branch]
      if (!theirs) return done([err(`fatal: couldn't find remote ref ${branch}`)], 'pull')
      const r = mergeInto(s, repo, `${remoteName}/${branch}`, theirs)
      return { ...r, lines: [out(`From ${url}`), out(` * branch            ${branch}     -> FETCH_HEAD`), ...r.lines], explain: EXPLAIN.pull }
    }

    default:
      return done([err(`git: '${sub}' is not a git command. See 'git --help'.`)], 'help')
  }
}

function mergeInto(s: SimState, repo: Repo, name: string, theirs: string | null): RunResult {
  const done = (lines: Line[], extra = ''): RunResult => ({ state: s, lines, explain: EXPLAIN.merge + extra })
  const ours = repo.branches[repo.head]
  if (!theirs) return done([out('Already up to date.')])
  const st = computeStatus(s, repo)
  if (st.staged.length || st.unstaged.length) return done([err('error: Your local changes would be overwritten by merge.'), hint('Commit dulu perubahanmu, lalu merge.')])
  if (!ours) {
    repo.branches[repo.head] = theirs
    checkoutTree(s, repo, {}, repo.commits[theirs].tree)
    return done([out(`Fast-forward`)])
  }
  if (ours === theirs || isAncestor(repo.commits, theirs, ours)) return done([out('Already up to date.')])
  const from = headTree(repo)
  if (isAncestor(repo.commits, ours, theirs)) {
    repo.branches[repo.head] = theirs
    checkoutTree(s, repo, from, repo.commits[theirs].tree)
    return done([out(`Updating ${short(ours)}..${short(theirs)}`), out('Fast-forward')], ' Ini fast-forward: branch-mu cukup “dimajukan” ke commit terbaru.')
  }
  const baseId = mergeBase(repo.commits, ours, theirs)
  const base = baseId ? repo.commits[baseId].tree : {}
  const o = repo.commits[ours].tree
  const t = repo.commits[theirs].tree
  const result: Record<string, string> = {}
  const conflicts: string[] = []
  for (const p of new Set([...Object.keys(base), ...Object.keys(o), ...Object.keys(t)])) {
    const b = base[p]
    const x = o[p]
    const y = t[p]
    if (x === y) {
      if (x !== undefined) result[p] = x
    } else if (x === b) {
      if (y !== undefined) result[p] = y
    } else if (y === b) {
      if (x !== undefined) result[p] = x
    } else {
      conflicts.push(p)
      result[p] = `<<<<<<< HEAD\n${x ?? ''}${x && !x.endsWith('\n') ? '\n' : ''}=======\n${y ?? ''}${y && !y.endsWith('\n') ? '\n' : ''}>>>>>>> ${name}\n`
    }
  }
  checkoutTree(s, repo, from, result)
  if (conflicts.length) {
    // File konflik belum di-add: index tetap memakai versi kita.
    for (const p of conflicts) repo.index[p] = o[p] ?? ''
    repo.merging = { branch: name, theirs, conflicts }
    return done(
      [...conflicts.map((p) => err(`CONFLICT (content): Merge conflict in ${p}`)), err('Automatic merge failed; fix conflicts and then commit the result.')],
      ' KONFLIK terjadi karena baris yang sama diubah berbeda di kedua branch. Buka file-nya: bagian antara <<<<<<< HEAD dan ======= adalah versimu, antara ======= dan >>>>>>> adalah versi branch lain. Pilih/gabungkan isinya, hapus ketiga penanda, lalu git add dan git commit.',
    )
  }
  const msg = `Merge branch '${name}' into ${repo.head}`
  const c = newCommit(s, repo, msg, [ours, theirs], result)
  repo.branches[repo.head] = c.id
  return done([out(`Merge made by the 'ort' strategy.`), out(` ${Object.keys(result).length} files in tree`)], ' Kedua branch punya commit baru, jadi Git membuat merge commit dengan dua induk.')
}

/* ------------------------------------------------------------------ */
/*  API publik                                                         */
/* ------------------------------------------------------------------ */

export function run(prev: SimState, input: string): RunResult {
  const line = input.trim()
  const s = clone(prev)
  if (!line) return { state: s, lines: [] }
  s.history = [...s.history, line].slice(-200)
  if (line === 'clear') return { state: s, lines: [], clear: true }

  // Dukungan sederhana untuk "a && b".
  if (line.includes('&&')) {
    let cur = s
    const lines: Line[] = []
    let explain: string | undefined
    for (const part of line.split('&&')) {
      const r = run({ ...cur, history: cur.history.slice(0, -1) }, part)
      cur = { ...r.state, history: s.history }
      lines.push(...r.lines)
      explain = r.explain ?? explain
      if (r.lines.some((l) => l.kind === 'err')) break
    }
    return { state: cur, lines, explain }
  }

  const args = tokenize(line)
  if (args[0] === 'git') return git(s, args.slice(1))
  const sh = shell(s, args)
  if (sh) return sh
  return { state: s, lines: [err(`${args[0]}: command not found`), hint('Ketik help untuk melihat perintah yang tersedia.')] }
}

/** Untuk panel file & misi: file kerja di repo aktif (atau di folder saat ini). */
export function currentRepo(s: SimState) {
  return findRepo(s)
}

export function filesUnder(s: SimState, dir: string): string[] {
  return Object.keys(s.files).filter((f) => f.startsWith(dir + '/')).sort()
}

/** Edit file langsung (dipakai panel File). */
export function writeFile(prev: SimState, absPath: string, content: string): SimState {
  const s = clone(prev)
  s.files[absPath] = content
  ensureDirs(s, absPath)
  return s
}

/** Simulasi: buat repository kosong di "GitHub". */
export function createRemote(prev: SimState, owner: string, name: string): SimState {
  const s = clone(prev)
  const url = `https://github.com/${owner}/${name}.git`
  if (!s.remotes[url]) s.remotes[url] = { url, owner, name, defaultBranch: 'main', branches: {}, commits: {} }
  return s
}

/** Simulasi: rekan tim mengubah sebuah file lalu push ke remote. */
export function teammatePush(prev: SimState, url: string, path: string, content: string, message: string): SimState {
  const s = clone(prev)
  const remote = s.remotes[url]
  if (!remote) return s
  const tip = remote.branches[remote.defaultBranch]
  const tree = { ...(tip ? remote.commits[tip].tree : {}), [path]: content }
  const time = s.clock++
  const id = fakeHash(`teammate|${message}|${tip}|${time}`)
  remote.commits[id] = { id, message, author: 'Rekan Tim', email: 'rekan@example.com', time, parents: tip ? [tip] : [], tree }
  remote.branches[remote.defaultBranch] = id
  return s
}

export function lastCommit(repo: Repo): Commit | null {
  const id = repo.branches[repo.head]
  return id ? repo.commits[id] : null
}

export function commitCount(repo: Repo, branch = repo.head): number {
  const tip = repo.branches[branch]
  if (!tip) return 0
  let n = 0
  for (const id of Object.keys(repo.commits)) if (isAncestor(repo.commits, id, tip)) n++
  return n
}

/** Untuk Tab-completion. */
export function completions(s: SimState, partial: string): string[] {
  const dir = partial.includes('/') ? resolvePath(s.cwd, partial.slice(0, partial.lastIndexOf('/')) || '/') : s.cwd
  const prefix = partial.includes('/') ? partial.slice(0, partial.lastIndexOf('/') + 1) : ''
  const base = partial.slice(prefix.length)
  const names = new Set<string>()
  for (const d of s.dirs) if (d.startsWith(dir + '/') && !d.slice(dir.length + 1).includes('/')) names.add(d.slice(dir.length + 1) + '/')
  for (const f of Object.keys(s.files)) if (f.startsWith(dir + '/') && !f.slice(dir.length + 1).includes('/')) names.add(f.slice(dir.length + 1))
  return [...names].filter((n) => n.startsWith(base)).map((n) => prefix + n).sort()
}
