/**
 * Loop protection: menyisipkan `__dsLoop(id);` di awal badan setiap loop
 * (for / while / do) yang memakai kurung kurawal. Jika satu loop berjalan
 * lebih dari ±1 detik dalam satu eksekusi, guard melempar error yang jelas —
 * sehingga infinite loop tidak membekukan browser.
 *
 * Guard menyertakan file & nomor baris loop agar error menunjuk ke loop yang benar.
 * Transformasi TIDAK menambah baris baru, jadi nomor baris error tetap sama
 * dengan kode yang ditulis pengguna.
 *
 * Batasan: loop tanpa kurung kurawal (`while (x) i++;`) tidak dilindungi.
 */

const REGEX_PREFIX = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^', ''])
const REGEX_KEYWORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw'])

const isIdStart = (c: string | undefined) => !!c && /[A-Za-z_$]/.test(c)
const isIdChar = (c: string | undefined) => !!c && /[\w$]/.test(c)

function skipString(code: string, i: number): number {
  const q = code[i]
  let j = i + 1
  while (j < code.length) {
    const c = code[j]
    if (c === '\\') {
      j += 2
      continue
    }
    if (c === q) return j + 1
    if (q !== '`' && c === '\n') return j // string tidak ditutup — berhenti di akhir baris
    j++
  }
  return j
}

function skipRegex(code: string, i: number): number {
  let j = i + 1
  let inClass = false
  while (j < code.length) {
    const c = code[j]
    if (c === '\\') {
      j += 2
      continue
    }
    if (c === '\n') return j
    if (inClass) {
      if (c === ']') inClass = false
    } else if (c === '[') inClass = true
    else if (c === '/') {
      j++
      while (isIdChar(code[j])) j++
      return j
    }
    j++
  }
  return j
}

/** Lewati spasi dan komentar mulai dari i; kembalikan indeks karakter bermakna berikutnya. */
function skipTrivia(code: string, i: number): number {
  let j = i
  while (j < code.length) {
    if (/\s/.test(code[j])) j++
    else if (code[j] === '/' && code[j + 1] === '/') {
      while (j < code.length && code[j] !== '\n') j++
    } else if (code[j] === '/' && code[j + 1] === '*') {
      const end = code.indexOf('*/', j + 2)
      j = end === -1 ? code.length : end + 2
    } else break
  }
  return j
}

/** Cari kurung tutup yang cocok untuk `(` di posisi i. */
function matchParen(code: string, i: number): number {
  let depth = 0
  let j = i
  while (j < code.length) {
    const c = code[j]
    if (c === '"' || c === "'" || c === '`') {
      j = skipString(code, j)
      continue
    }
    if (c === '/' && (code[j + 1] === '/' || code[j + 1] === '*')) {
      j = skipTrivia(code, j)
      continue
    }
    if (c === '(') depth++
    else if (c === ')') {
      depth--
      if (depth === 0) return j
    }
    j++
  }
  return -1
}

export function protectLoops(code: string, opts: { file?: string; lineOffset?: number; guard?: string } = {}): string {
  const guard = opts.guard ?? '__dsLoop'
  const file = JSON.stringify(opts.file ?? 'js')
  const offset = opts.lineOffset ?? 0
  const lineAt = (pos: number) => offset + code.slice(0, pos).split('\n').length
  let out = ''
  let i = 0
  let id = 0
  let prevSig = '' // karakter bermakna terakhir
  let prevWord = ''
  const n = code.length

  while (i < n) {
    const c = code[i]

    if (c === '/' && (code[i + 1] === '/' || code[i + 1] === '*')) {
      const j = skipTrivia(code, i)
      out += code.slice(i, j)
      i = j
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      const j = skipString(code, i)
      out += code.slice(i, j)
      i = j
      prevSig = c
      prevWord = ''
      continue
    }
    if (c === '/' && (REGEX_PREFIX.has(prevSig) || REGEX_KEYWORDS.has(prevWord))) {
      const j = skipRegex(code, i)
      out += code.slice(i, j)
      i = j
      prevSig = '/'
      prevWord = ''
      continue
    }
    if (isIdStart(c) && !isIdChar(code[i - 1])) {
      const start = i
      let j = i
      while (isIdChar(code[j])) j++
      const word = code.slice(i, j)
      const isMember = prevSig === '.'
      out += word
      i = j
      prevSig = word[word.length - 1]
      prevWord = word

      if (isMember) continue
      if (word === 'for' || word === 'while') {
        let k = skipTrivia(code, i)
        if (word === 'for' && code.startsWith('await', k)) k = skipTrivia(code, k + 5)
        if (code[k] !== '(') continue
        const close = matchParen(code, k)
        if (close === -1) continue
        const b = skipTrivia(code, close + 1)
        if (code[b] === '{') {
          out += code.slice(i, b + 1) + `${guard}(${id++},${file},${lineAt(start)});`
          i = b + 1
          prevSig = '{'
          prevWord = ''
        }
      } else if (word === 'do') {
        const b = skipTrivia(code, i)
        if (code[b] === '{') {
          out += code.slice(i, b + 1) + `${guard}(${id++},${file},${lineAt(start)});`
          i = b + 1
          prevSig = '{'
          prevWord = ''
        }
      }
      continue
    }

    out += c
    if (!/\s/.test(c)) {
      prevSig = c
      prevWord = ''
    }
    i++
  }
  return out
}
