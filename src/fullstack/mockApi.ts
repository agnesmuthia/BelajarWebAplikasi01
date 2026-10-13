/**
 * Mock API DevStudio — server REST tiruan yang berjalan di halaman DevStudio (bukan di internet).
 *
 * Kode di preview memanggil `fetch('/api/...')`; runtime iframe meneruskan request lewat
 * postMessage, lalu fungsi `handleRequest` di sini memprosesnya seperti backend sungguhan:
 * routing, validasi, autentikasi (hash password + token sesi), dan aturan akses per baris
 * yang meniru Row Level Security. Semua pure function → mudah diuji.
 */

export type Access = 'public' | 'read-public' | 'owner' | 'admin-write'
export type FieldType = 'string' | 'number' | 'boolean'

export interface FieldRule {
  type: FieldType
  required: boolean
}

export interface ResourceConfig {
  access: Access
  fields: Record<string, FieldRule>
  seed: Record<string, unknown>[]
}

export interface ApiConfig {
  resources: Record<string, ResourceConfig>
  /** Email yang otomatis mendapat peran admin saat mendaftar. */
  admins: string[]
}

export const CONFIG_PATH = 'api/config.json'

export const ACCESS_INFO: Record<Access, { label: string; rule: string }> = {
  public: { label: 'Publik penuh', rule: 'Siapa pun boleh membaca, menambah, mengubah, dan menghapus. Hanya untuk latihan — jangan dipakai untuk data sungguhan.' },
  'read-public': { label: 'Baca publik, tulis milik sendiri', rule: 'Siapa pun boleh membaca. Menambah butuh login; mengubah/menghapus hanya pemilik baris atau admin.' },
  owner: { label: 'Hanya pemilik', rule: 'Semua aksi butuh login, dan pengguna hanya melihat serta mengubah baris miliknya sendiri (seperti RLS auth.uid() = user_id).' },
  'admin-write': { label: 'Baca publik, tulis admin', rule: 'Siapa pun boleh membaca; hanya pengguna berperan admin yang boleh menulis.' },
}

const NAME_RE = /^[a-z][a-z0-9-]{0,30}$/
const RESERVED = new Set(['auth'])
const RESERVED_FIELDS = new Set(['id', 'owner_id', 'created_at', 'updated_at'])
const MAX_STRING = 2000
export const MAX_ROWS = 500

/** Membaca api/config.json. Kesalahan dilaporkan dalam bahasa yang mudah dipahami. */
export function parseConfig(text: string): { config: ApiConfig | null; errors: string[] } {
  const errors: string[] = []
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { config: null, errors: [`${CONFIG_PATH} bukan JSON yang valid: ${e instanceof Error ? e.message : e}`] }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { config: null, errors: [`${CONFIG_PATH} harus berupa objek { "resources": { ... } }.`] }
  const obj = raw as Record<string, unknown>
  const res = obj.resources
  if (!res || typeof res !== 'object' || Array.isArray(res)) return { config: null, errors: ['Bagian "resources" wajib ada, mis. { "resources": { "todos": { ... } } }.'] }

  const resources: Record<string, ResourceConfig> = {}
  for (const [name, def] of Object.entries(res as Record<string, unknown>)) {
    if (!NAME_RE.test(name) || RESERVED.has(name)) {
      errors.push(`Nama resource "${name}" tidak valid — pakai huruf kecil/angka/tanda minus, dan bukan "auth".`)
      continue
    }
    if (!def || typeof def !== 'object') {
      errors.push(`Resource "${name}" harus berupa objek.`)
      continue
    }
    const d = def as Record<string, unknown>
    const access = (d.access ?? 'public') as Access
    if (!(access in ACCESS_INFO)) {
      errors.push(`"${name}.access" harus salah satu dari: ${Object.keys(ACCESS_INFO).join(', ')}.`)
      continue
    }
    const fields: Record<string, FieldRule> = {}
    for (const [f, spec] of Object.entries((d.fields ?? {}) as Record<string, unknown>)) {
      const m = typeof spec === 'string' ? /^(string|number|boolean)(!?)$/.exec(spec) : null
      if (!m) errors.push(`"${name}.fields.${f}" harus "string", "number", atau "boolean" (tambahkan ! untuk wajib, mis. "string!").`)
      else if (RESERVED_FIELDS.has(f)) errors.push(`Kolom "${f}" di "${name}" diisi otomatis oleh server — hapus dari fields.`)
      else fields[f] = { type: m[1] as FieldType, required: m[2] === '!' }
    }
    const seed = Array.isArray(d.seed) ? (d.seed.filter((s) => s && typeof s === 'object' && !Array.isArray(s)) as Record<string, unknown>[]) : []
    resources[name] = { access, fields, seed: seed.slice(0, MAX_ROWS) }
  }
  const admins = Array.isArray(obj.admins) ? obj.admins.filter((a): a is string => typeof a === 'string').map((a) => a.toLowerCase()) : []
  return { config: errors.length && !Object.keys(resources).length ? null : { resources, admins }, errors }
}

/* ------------------------------------------------------------------ */

export interface Row {
  id: number
  owner_id: string | null
  created_at: string
  [key: string]: unknown
}

export interface MockUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  salt: string
  hash: string
  created_at: string
}

export interface MockDb {
  rows: Record<string, Row[]>
  nextId: Record<string, number>
  users: MockUser[]
  sessions: { token: string; userId: string; createdAt: string }[]
}

export function initDb(config: ApiConfig, now = new Date().toISOString()): MockDb {
  const rows: Record<string, Row[]> = {}
  const nextId: Record<string, number> = {}
  for (const [name, r] of Object.entries(config.resources)) {
    rows[name] = r.seed.map((s, i) => ({ ...pick(s, r.fields), id: i + 1, owner_id: null, created_at: now }))
    nextId[name] = rows[name].length + 1
  }
  return { rows, nextId, users: [], sessions: [] }
}

/** Menyesuaikan DB tersimpan dengan config terbaru (resource baru ditambahkan, yang dihapus dibuang). */
export function reconcileDb(db: MockDb, config: ApiConfig): MockDb {
  const fresh = initDb(config)
  const rows: Record<string, Row[]> = {}
  const nextId: Record<string, number> = {}
  for (const name of Object.keys(config.resources)) {
    rows[name] = db.rows[name] ?? fresh.rows[name]
    nextId[name] = db.nextId[name] ?? fresh.nextId[name]
  }
  return { ...db, rows, nextId }
}

function pick(src: Record<string, unknown>, fields: Record<string, FieldRule>) {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(fields)) if (k in src) out[k] = src[k]
  return out
}

/* ------------------------------------------------------------------ */

export interface ApiRequest {
  method: string
  url: string
  headers: Record<string, string>
  body: string | null
}

export interface ApiResponse {
  status: number
  body: unknown
}

export interface Crypto {
  hash: (password: string, salt: string) => Promise<string>
  randomId: () => string
}

export interface HandleResult {
  db: MockDb
  res: ApiResponse
  /** Penjelasan keputusan server untuk inspektur request. */
  note: string
}

/** Implementasi kripto memakai Web Crypto (PBKDF2-SHA-256). */
export const webCrypto: Crypto = {
  async hash(password, salt) {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 20000 }, key, 256)
    return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
  },
  randomId() {
    const a = new Uint8Array(16)
    crypto.getRandomValues(a)
    return [...a].map((b) => b.toString(16).padStart(2, '0')).join('')
  },
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ok = (db: MockDb, status: number, body: unknown, note: string): HandleResult => ({ db, res: { status, body }, note })
const fail = (db: MockDb, status: number, error: string, note = error): HandleResult => ({ db, res: { status, body: { error } }, note })

export const publicUser = (u: MockUser) => ({ id: u.id, email: u.email, name: u.name, role: u.role, created_at: u.created_at })

function parsePath(url: string): { parts: string[]; query: URLSearchParams } | null {
  let u = url.trim()
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) {
    try {
      u = new URL(u).pathname + new URL(u).search
    } catch {
      return null
    }
  }
  if (u.startsWith('./')) u = u.slice(1)
  if (!u.startsWith('/')) u = '/' + u
  const [path, search = ''] = u.split('?')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] !== 'api') return null
  return { parts: parts.slice(1).map((p) => decodeURIComponent(p)), query: new URLSearchParams(search) }
}

function validate(body: Record<string, unknown>, fields: Record<string, FieldRule>, partial: boolean): { data: Record<string, unknown>; errors: string[] } {
  const errors: string[] = []
  const data: Record<string, unknown> = {}
  for (const k of Object.keys(body)) {
    if (RESERVED_FIELDS.has(k)) continue
    if (!(k in fields)) errors.push(`Kolom "${k}" tidak dikenal.`)
  }
  for (const [k, rule] of Object.entries(fields)) {
    const v = body[k]
    if (v === undefined || v === null || (rule.type === 'string' && typeof v === 'string' && v.trim() === '')) {
      if (rule.required && !partial) errors.push(`"${k}" wajib diisi.`)
      else if (v === null && !rule.required) data[k] = null
      continue
    }
    if (typeof v !== rule.type || (rule.type === 'number' && !Number.isFinite(v))) errors.push(`"${k}" harus bertipe ${rule.type}, bukan ${Array.isArray(v) ? 'array' : typeof v}.`)
    else if (rule.type === 'string' && (v as string).length > MAX_STRING) errors.push(`"${k}" terlalu panjang (maks ${MAX_STRING} karakter).`)
    else data[k] = rule.type === 'string' ? (v as string).trim() : v
  }
  return { data, errors }
}

/** Memproses satu request. Tidak mengubah `db` asli — selalu mengembalikan objek baru. */
export async function handleRequest(config: ApiConfig, db0: MockDb, req: ApiRequest, cx: Crypto = webCrypto, now = new Date().toISOString()): Promise<HandleResult> {
  const db: MockDb = { ...db0, rows: { ...db0.rows }, nextId: { ...db0.nextId }, users: [...db0.users], sessions: [...db0.sessions] }
  const method = req.method.toUpperCase()
  const route = parsePath(req.url)
  if (!route) return fail(db, 404, `Rute ${req.url} tidak ada. Mock API hanya melayani alamat yang diawali /api/.`)
  const { parts, query } = route

  let body: Record<string, unknown> = {}
  if (req.body && method !== 'GET' && method !== 'DELETE') {
    try {
      const parsed = JSON.parse(req.body)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fail(db, 400, 'Body harus berupa objek JSON.')
      body = parsed as Record<string, unknown>
    } catch {
      return fail(db, 400, 'Body bukan JSON yang valid. Gunakan JSON.stringify(data) dan header Content-Type: application/json.')
    }
  }

  const auth = req.headers['authorization'] ?? ''
  const token = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim()
  const session = token ? db.sessions.find((s) => s.token === token) : undefined
  const user = session ? db.users.find((u) => u.id === session.userId) : undefined
  const who = user ? `${user.email} (${user.role})` : 'tamu (tanpa token)'

  /* ------------------------------ auth ------------------------------ */
  if (parts[0] === 'auth') {
    const action = parts[1]
    if (action === 'register' && method === 'POST') {
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      const name = String(body.name ?? '').trim()
      const errs: string[] = []
      if (!EMAIL_RE.test(email)) errs.push('Email tidak valid.')
      if (password.length < 8) errs.push('Password minimal 8 karakter.')
      if (name.length > 100) errs.push('Nama terlalu panjang.')
      if (errs.length) return fail(db, 400, errs.join(' '), 'Validasi pendaftaran gagal — server menolak sebelum menyimpan apa pun.')
      if (db.users.some((u) => u.email === email)) return fail(db, 409, 'Email sudah terdaftar.')
      const salt = cx.randomId()
      const newUser: MockUser = { id: `u${db.users.length + 1}_${cx.randomId().slice(0, 6)}`, email, name: name || email.split('@')[0], role: config.admins.includes(email) ? 'admin' : 'user', salt, hash: await cx.hash(password, salt), created_at: now }
      const t = cx.randomId()
      db.users.push(newUser)
      db.sessions.push({ token: t, userId: newUser.id, createdAt: now })
      return ok(db, 201, { user: publicUser(newUser), token: t }, 'Pengguna dibuat. Password TIDAK disimpan — hanya hash PBKDF2 + salt acak. Token sesi dikirim ke klien.')
    }
    if (action === 'login' && method === 'POST') {
      const email = String(body.email ?? '').trim().toLowerCase()
      const u = db.users.find((x) => x.email === email)
      const h = u ? await cx.hash(String(body.password ?? ''), u.salt) : ''
      if (!u || h !== u.hash) return fail(db, 401, 'Email atau password salah.', 'Pesan sengaja sama untuk email tidak terdaftar dan password salah, agar penyerang tidak bisa menebak email mana yang terdaftar.')
      const t = cx.randomId()
      db.sessions.push({ token: t, userId: u.id, createdAt: now })
      return ok(db, 200, { user: publicUser(u), token: t }, 'Login berhasil: hash password cocok, token sesi baru dibuat.')
    }
    if (action === 'me' && (method === 'GET' || method === 'PATCH')) {
      if (!user) return fail(db, 401, 'Belum login atau token tidak valid.', 'Header Authorization: Bearer <token> tidak ada atau token tidak dikenal.')
      if (method === 'GET') return ok(db, 200, publicUser(user), `Token valid untuk ${user.email}.`)
      const name = body.name
      if (typeof name !== 'string' || !name.trim() || name.length > 100) return fail(db, 400, '"name" wajib berupa teks 1–100 karakter.')
      const updated = { ...user, name: name.trim() }
      db.users = db.users.map((u) => (u.id === user.id ? updated : u))
      return ok(db, 200, publicUser(updated), 'Profil diperbarui. Kolom role tidak bisa diubah lewat endpoint ini.')
    }
    if (action === 'logout' && method === 'POST') {
      db.sessions = db.sessions.filter((s) => s.token !== token)
      return ok(db, 200, { ok: true }, 'Token sesi dihapus dari server — token lama tidak berlaku lagi.')
    }
    return fail(db, 404, `Rute auth tidak dikenal: ${method} /api/auth/${action ?? ''}. Yang tersedia: POST register, POST login, GET/PATCH me, POST logout.`)
  }

  /* ---------------------------- resources --------------------------- */
  const name = parts[0]
  const res = name ? config.resources[name] : undefined
  if (!name) return ok(db, 200, { resources: Object.keys(config.resources), auth: ['/api/auth/register', '/api/auth/login', '/api/auth/me', '/api/auth/logout'] }, 'Daftar endpoint.')
  if (!res) return fail(db, 404, `Resource "${name}" tidak ada di ${CONFIG_PATH}.`)
  if (parts.length > 2) return fail(db, 404, `Rute ${req.url} tidak dikenal.`)
  const id = parts[1] !== undefined ? Number(parts[1]) : null
  if (parts[1] !== undefined && !Number.isInteger(id)) return fail(db, 400, `ID "${parts[1]}" harus berupa angka.`)
  const rows = db.rows[name] ?? []
  const access = res.access
  const policy = `Policy ${name}: ${ACCESS_INFO[access].label}`
  const isAdmin = user?.role === 'admin'
  const canSee = (r: Row) => access !== 'owner' || (!!user && r.owner_id === user.id)
  const canModify = (r: Row) => access === 'public' || (access === 'admin-write' ? isAdmin : !!user && (r.owner_id === user.id || isAdmin))

  if (method === 'GET') {
    if (access === 'owner' && !user) return fail(db, 401, 'Login dulu untuk melihat data ini.', `${policy} — tamu tidak boleh membaca.`)
    if (id !== null) {
      const r = rows.find((x) => x.id === id)
      if (!r || !canSee(r)) return fail(db, 404, `${name} #${id} tidak ditemukan.`, r ? `${policy} — baris ada, tetapi bukan milik ${who}, jadi disembunyikan (seperti RLS: tidak ada bedanya dengan “tidak ada”).` : `Tidak ada baris dengan id ${id}.`)
      return ok(db, 200, r, `${policy} — baris #${id} boleh dibaca oleh ${who}.`)
    }
    let list = rows.filter(canSee)
    const hidden = rows.length - list.length
    const q = query.get('q')?.toLowerCase()
    if (q) list = list.filter((r) => Object.entries(res.fields).some(([k, f]) => f.type === 'string' && String(r[k] ?? '').toLowerCase().includes(q)))
    for (const [k, v] of query) {
      if (!(k in res.fields)) continue
      const f = res.fields[k]
      const want = f.type === 'number' ? Number(v) : f.type === 'boolean' ? v === 'true' : v
      list = list.filter((r) => r[k] === want)
    }
    const sort = query.get('sort')
    if (sort) {
      const desc = sort.startsWith('-')
      const key = desc ? sort.slice(1) : sort
      list = [...list].sort((a, b) => {
        const x = a[key] as string | number
        const y = b[key] as string | number
        const c = x === y ? 0 : x === undefined ? 1 : y === undefined ? -1 : x < y ? -1 : 1
        return desc ? -c : c
      })
    }
    const limit = Number(query.get('limit'))
    if (Number.isInteger(limit) && limit > 0) list = list.slice(0, limit)
    return ok(db, 200, list, `${policy} — ${list.length} baris dikirim ke ${who}${hidden ? `; ${hidden} baris milik orang lain disaring server` : ''}.`)
  }

  if (method === 'POST') {
    if (id !== null) return fail(db, 405, 'POST dikirim ke /api/' + name + ' (tanpa id).')
    if (access !== 'public' && !user) return fail(db, 401, 'Login dulu untuk menambah data.', `${policy} — tamu tidak boleh menulis.`)
    if (access === 'admin-write' && !isAdmin) return fail(db, 403, 'Hanya admin yang boleh menambah data ini.', `${policy} — ${who} sudah login (401 tidak berlaku), tetapi tidak berhak (403).`)
    if (rows.length >= MAX_ROWS) return fail(db, 507, `Batas latihan ${MAX_ROWS} baris per resource tercapai. Reset data di panel API.`)
    const { data, errors } = validate(body, res.fields, false)
    if (errors.length) return fail(db, 400, errors.join(' '), 'Validasi di server gagal. Validasi di frontend saja tidak cukup — request bisa dikirim tanpa melewati form.')
    const row: Row = { ...data, id: db.nextId[name] ?? rows.length + 1, owner_id: user?.id ?? null, created_at: now }
    db.rows[name] = [...rows, row]
    db.nextId[name] = row.id + 1
    return ok(db, 201, row, `${policy} — baris #${row.id} dibuat${user ? `, owner_id diisi server dengan ${user.id} (bukan dari body request)` : ''}.`)
  }

  if (method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
    if (id === null) return fail(db, 405, `${method} butuh id, mis. /api/${name}/1.`)
    if (access !== 'public' && !user) return fail(db, 401, 'Login dulu.', `${policy} — tamu tidak boleh mengubah data.`)
    const r = rows.find((x) => x.id === id)
    if (!r || !canSee(r)) return fail(db, 404, `${name} #${id} tidak ditemukan.`, r ? `${policy} — baris bukan milik ${who}, disembunyikan.` : `Tidak ada baris dengan id ${id}.`)
    if (!canModify(r)) return fail(db, 403, 'Kamu tidak berhak mengubah data ini.', `${policy} — ${who} boleh membaca baris #${id}, tetapi bukan pemilik/admin.`)
    if (method === 'DELETE') {
      db.rows[name] = rows.filter((x) => x.id !== id)
      return ok(db, 200, { deleted: id }, `${policy} — baris #${id} dihapus oleh ${who}.`)
    }
    const { data, errors } = validate(body, res.fields, method === 'PATCH')
    if (errors.length) return fail(db, 400, errors.join(' '))
    const updated: Row = method === 'PUT' ? { ...data, id: r.id, owner_id: r.owner_id, created_at: r.created_at, updated_at: now } : { ...r, ...data, updated_at: now }
    db.rows[name] = rows.map((x) => (x.id === id ? updated : x))
    return ok(db, 200, updated, `${policy} — baris #${id} diperbarui oleh ${who}.`)
  }

  return fail(db, 405, `Metode ${method} tidak didukung. Gunakan GET, POST, PATCH, PUT, atau DELETE.`)
}

export const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  500: 'Internal Server Error',
  507: 'Insufficient Storage',
}
