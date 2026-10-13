/**
 * Menilai output perintah versi yang DITEMPEL pengguna dari terminalnya sendiri.
 * DevStudio tidak bisa (dan tidak boleh) menjalankan perintah di komputer pengguna.
 */
export type EnvTool = 'git' | 'node' | 'npm' | 'code'

export interface EnvSpec {
  tool: EnvTool
  label: string
  command: string
  /** Versi minimum [mayor, minor]; null = versi apa pun cukup. */
  min: [number, number] | null
  why: string
  install: string
}

export const ENV_SPECS: EnvSpec[] = [
  { tool: 'git', label: 'Git', command: 'git --version', min: [2, 30], why: 'Mencatat versi & berkomunikasi dengan GitHub.', install: 'Unduh dari git-scm.com (Windows: pilihan default sudah tepat; ikut memasang Git Bash).' },
  { tool: 'node', label: 'Node.js', command: 'node -v', min: [20, 19], why: 'Menjalankan development server Vite & alat build (Vite membutuhkan Node 20.19+ atau 22.12+).', install: 'Unduh versi LTS dari nodejs.org, lalu buka ulang terminal.' },
  { tool: 'npm', label: 'npm', command: 'npm -v', min: [10, 0], why: 'Memasang paket (ikut terpasang bersama Node.js).', install: 'Terpasang otomatis bersama Node.js. Jika versinya lama, perbarui Node.js.' },
  { tool: 'code', label: 'VS Code (perintah code)', command: 'code --version', min: null, why: 'Membuka folder dari terminal dengan “code .”.', install: 'Pasang VS Code dari code.visualstudio.com. macOS: Command Palette → “Shell Command: Install ‘code’ command in PATH”.' },
]

export type EnvStatus = 'ok' | 'old' | 'missing' | 'unknown'

export interface EnvResult {
  status: EnvStatus
  version?: string
  message: string
}

const MISSING = /not recognized|command not found|not found|tidak dikenali|no such file|cannot find/i

export function parseEnvOutput(tool: EnvTool, raw: string): EnvResult {
  const text = raw.trim()
  const spec = ENV_SPECS.find((s) => s.tool === tool)!
  if (!text) return { status: 'unknown', message: 'Tempel output perintah di atas.' }
  if (MISSING.test(text)) return { status: 'missing', message: `${spec.label} belum terpasang atau terminal perlu dibuka ulang. ${spec.install}` }
  const re = tool === 'git' ? /git version (\d+)\.(\d+)(?:\.(\d+))?/i : tool === 'node' ? /^v?(\d+)\.(\d+)\.(\d+)/m : /^(\d+)\.(\d+)\.(\d+)/m
  const m = re.exec(text)
  if (!m) return { status: 'unknown', message: `Output tidak dikenali. Pastikan kamu menjalankan persis: ${spec.command}` }
  const version = [m[1], m[2], m[3]].filter(Boolean).join('.')
  if (spec.min) {
    const [maj, min] = [Number(m[1]), Number(m[2])]
    if (maj < spec.min[0] || (maj === spec.min[0] && min < spec.min[1])) {
      return { status: 'old', version, message: `Versi ${version} terlalu lama (minimal ${spec.min.join('.')}). ${spec.install}` }
    }
  }
  return { status: 'ok', version, message: `${spec.label} ${version} siap dipakai.` }
}
