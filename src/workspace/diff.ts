/** Diff baris sederhana (LCS) untuk membandingkan checkpoint — mirip `git diff`. */
export type DiffLine = { type: 'same' | 'add' | 'del'; text: string; a?: number; b?: number }

const MAX_LINES = 3000

export function diffLines(before: string, after: string): DiffLine[] | null {
  const a = before.split('\n')
  const b = after.split('\n')
  if (a.length > MAX_LINES || b.length > MAX_LINES) return null

  // Pangkas awalan & akhiran yang sama agar tabel LCS kecil.
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  const n = endA - start
  const m = endB - start
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[start + i] === b[start + j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])

  const out: DiffLine[] = []
  for (let k = 0; k < start; k++) out.push({ type: 'same', text: a[k], a: k + 1, b: k + 1 })
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && a[start + i] === b[start + j]) {
      out.push({ type: 'same', text: a[start + i], a: start + i + 1, b: start + j + 1 })
      i++
      j++
    } else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) {
      out.push({ type: 'add', text: b[start + j], b: start + j + 1 })
      j++
    } else {
      out.push({ type: 'del', text: a[start + i], a: start + i + 1 })
      i++
    }
  }
  for (let k = endA; k < a.length; k++) out.push({ type: 'same', text: a[k], a: k + 1, b: k - endA + endB + 1 })
  return out
}

/** Ringkas: hanya baris berubah plus `context` baris di sekitarnya. */
export function hunks(lines: DiffLine[], context = 2): (DiffLine | { type: 'gap'; count: number })[] {
  const keep = new Array(lines.length).fill(false)
  lines.forEach((l, i) => {
    if (l.type !== 'same') for (let k = Math.max(0, i - context); k <= Math.min(lines.length - 1, i + context); k++) keep[k] = true
  })
  const out: (DiffLine | { type: 'gap'; count: number })[] = []
  let gap = 0
  lines.forEach((l, i) => {
    if (keep[i]) {
      if (gap) out.push({ type: 'gap', count: gap })
      gap = 0
      out.push(l)
    } else gap++
  })
  if (gap) out.push({ type: 'gap', count: gap })
  return out
}

export function diffStats(lines: DiffLine[]) {
  return { added: lines.filter((l) => l.type === 'add').length, removed: lines.filter((l) => l.type === 'del').length }
}
