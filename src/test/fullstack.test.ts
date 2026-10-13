import { describe, expect, it, vi } from 'vitest'
import { CHALLENGES } from '../data/challenges'
import { ALL_LESSONS, MODULES } from '../data/curriculum'
import { FULLSTACK_TEMPLATES, findTemplate } from '../data/projects'
import { checkDeploy } from '../deploy/deployCheck'
import { handleRequest, initDb, parseConfig, type ApiConfig, type Crypto, type MockDb } from '../fullstack/mockApi'
import * as sb from '../fullstack/supabase'
import { buildDocument } from '../lab/runtime'
import { createInitialState } from '../lib/storage'
import { computeSkills, missingRequirements } from '../lib/progress'

let n = 0
const fakeCrypto: Crypto = { hash: async (p, s) => `h(${p}|${s})`, randomId: () => `r${(++n).toString().padStart(8, '0')}` }

const CFG = parseConfig(JSON.stringify({
  resources: {
    todos: { access: 'owner', fields: { title: 'string!', done: 'boolean' } },
    produk: { access: 'admin-write', fields: { nama: 'string!', harga: 'number!' }, seed: [{ nama: 'A', harga: 1 }] },
    pesan: { access: 'public', fields: { isi: 'string!' } },
    komentar: { access: 'read-public', fields: { isi: 'string!' } },
  },
  admins: ['admin@contoh.id'],
})).config as ApiConfig

async function req(db: MockDb, method: string, url: string, body?: unknown, token?: string) {
  const r = await handleRequest(CFG, db, { method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, body: body === undefined ? null : JSON.stringify(body) }, fakeCrypto, '2026-10-13T00:00:00Z')
  return r
}

async function register(db: MockDb, email: string) {
  const r = await req(db, 'POST', '/api/auth/register', { email, password: 'rahasia123', name: email })
  return { db: r.db, token: (r.res.body as { token: string }).token, status: r.res.status }
}

describe('Mock API', () => {
  it('parseConfig melaporkan kesalahan dengan jelas', () => {
    expect(parseConfig('{').errors[0]).toMatch(/bukan JSON/)
    expect(parseConfig('{"resources":{"Todo":{}}}').errors[0]).toMatch(/tidak valid/)
    expect(parseConfig('{"resources":{"x":{"fields":{"a":"text"}}}}').errors[0]).toMatch(/string/)
    expect(parseConfig('{"resources":{"x":{"fields":{"id":"number"}}}}').errors[0]).toMatch(/otomatis/)
    expect(CFG.resources.todos.fields.title).toEqual({ type: 'string', required: true })
  })

  it('auth: register, login, me, logout — password hanya disimpan sebagai hash', async () => {
    let db = initDb(CFG)
    const a = await register(db, 'Ani@Contoh.id')
    expect(a.status).toBe(201)
    db = a.db
    expect(db.users[0].email).toBe('ani@contoh.id')
    expect(JSON.stringify(db.users)).not.toContain('"rahasia123"')
    expect((await req(db, 'POST', '/api/auth/register', { email: 'ani@contoh.id', password: 'rahasia123' })).res.status).toBe(409)
    expect((await req(db, 'POST', '/api/auth/register', { email: 'x', password: '123' })).res.status).toBe(400)
    const bad = await req(db, 'POST', '/api/auth/login', { email: 'ani@contoh.id', password: 'salah12345' })
    expect(bad.res.status).toBe(401)
    const unknown = await req(db, 'POST', '/api/auth/login', { email: 'tidak@ada.id', password: 'salah12345' })
    expect((unknown.res.body as { error: string }).error).toBe((bad.res.body as { error: string }).error)
    const me = await req(db, 'GET', '/api/auth/me', undefined, a.token)
    expect(me.res.status).toBe(200)
    expect(me.res.body).not.toHaveProperty('hash')
    const out = await req(db, 'POST', '/api/auth/logout', undefined, a.token)
    expect((await req(out.db, 'GET', '/api/auth/me', undefined, a.token)).res.status).toBe(401)
  })

  it('owner: setiap pengguna hanya melihat & mengubah barisnya sendiri', async () => {
    let db = initDb(CFG)
    expect((await req(db, 'GET', '/api/todos')).res.status).toBe(401)
    const a = await register(db, 'a@contoh.id'); db = a.db
    const b = await register(db, 'b@contoh.id'); db = b.db
    const created = await req(db, 'POST', '/api/todos', { title: 'punya A', owner_id: 'palsu' }, a.token); db = created.db
    expect(created.res.status).toBe(201)
    const row = created.res.body as { id: number; owner_id: string }
    expect(row.owner_id).toBe(db.users[0].id)
    expect((await req(db, 'GET', '/api/todos', undefined, b.token)).res.body).toEqual([])
    expect((await req(db, 'GET', `/api/todos/${row.id}`, undefined, b.token)).res.status).toBe(404)
    expect((await req(db, 'DELETE', `/api/todos/${row.id}`, undefined, b.token)).res.status).toBe(404)
    expect((await req(db, 'PATCH', `/api/todos/${row.id}`, { done: true }, a.token)).res.status).toBe(200)
  })

  it('admin-write & read-public', async () => {
    let db = initDb(CFG)
    expect((await req(db, 'GET', '/api/produk')).res.body).toHaveLength(1)
    const u = await register(db, 'user@contoh.id'); db = u.db
    expect((await req(db, 'POST', '/api/produk', { nama: 'B', harga: 2 }, u.token)).res.status).toBe(403)
    const adm = await register(db, 'admin@contoh.id'); db = adm.db
    expect(db.users[1].role).toBe('admin')
    expect((await req(db, 'POST', '/api/produk', { nama: 'B', harga: 2 }, adm.token)).res.status).toBe(201)
    expect((await req(db, 'POST', '/api/komentar', { isi: 'halo' })).res.status).toBe(401)
    const k = await req(db, 'POST', '/api/komentar', { isi: 'halo' }, u.token); db = k.db
    expect((await req(db, 'GET', '/api/komentar')).res.body).toHaveLength(1)
    expect((await req(db, 'DELETE', '/api/komentar/1', undefined, adm.token)).res.status).toBe(200)
  })

  it('validasi, query, dan rute tidak dikenal', async () => {
    let db = initDb(CFG)
    expect((await req(db, 'POST', '/api/produk', { nama: 'x', harga: '5' })).res.status).toBe(401)
    const v = await req(db, 'POST', '/api/pesan', { isi: '   ' })
    expect(v.res.status).toBe(400)
    expect((v.res.body as { error: string }).error).toMatch(/wajib/)
    expect((await req(db, 'POST', '/api/pesan', { isi: 'a', lain: 1 })).res.status).toBe(400)
    for (const isi of ['apel', 'Mangga', 'jeruk']) db = (await req(db, 'POST', '/api/pesan', { isi })).db
    expect(((await req(db, 'GET', '/api/pesan?q=MANG')).res.body as unknown[]).length).toBe(1)
    expect(((await req(db, 'GET', '/api/pesan?sort=-isi&limit=1')).res.body as { isi: string }[])[0].isi).toBe('jeruk')
    expect((await req(db, 'GET', '/api/tidakada')).res.status).toBe(404)
    expect((await req(db, 'GET', '/data')).res.status).toBe(404)
    expect((await req(db, 'POST', '/api/pesan', undefined)).res.status).toBe(400)
    const raw = await handleRequest(CFG, db, { method: 'POST', url: 'api/pesan', headers: {}, body: '{rusak' }, fakeCrypto)
    expect(raw.res.status).toBe(400)
  })

  it('runtime: shim fetch ikut dibuat dan skripnya valid', () => {
    const r = buildDocument({ entry: 'index.html', texts: new Map([['index.html', '<html><head></head><body></body></html>']]), token: 't', api: true })
    expect(r.html).toContain('var API=true')
    const scripts = [...r.html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
    for (const s of scripts) expect(() => new Function(s)).not.toThrow()
  })

  it('tantangan & template full-stack punya config yang valid', () => {
    const configs = [...CHALLENGES.filter((c) => c.api).map((c) => c.api!), ...FULLSTACK_TEMPLATES.map((t) => t.files.find((f) => f.path === 'api/config.json')!.content)]
    expect(configs.length).toBe(4)
    for (const c of configs) expect(parseConfig(c).errors).toEqual([])
  })
})

describe('kurikulum & progres Phase 7', () => {
  it('modul api/backend/database berisi pelajaran', () => {
    for (const id of ['api', 'backend', 'database']) expect(MODULES.find((m) => m.id === id)!.lessons.length).toBeGreaterThan(0)
    expect(ALL_LESSONS.length).toBe(34)
    const ids = new Set(ALL_LESSONS.map((l) => l.id))
    expect(ids.size).toBe(ALL_LESSONS.length)
    for (const t of FULLSTACK_TEMPLATES) for (const r of [...t.requires!, ...t.recommendedLessons]) expect(ids.has(r)).toBe(true)
    for (const l of ALL_LESSONS) if (l.lab) expect(CHALLENGES.some((c) => c.id === l.lab)).toBe(true)
  })

  it('proyek full-stack terkunci sampai checkpoint lulus', () => {
    const s = createInitialState()
    const crud = findTemplate('fs-crud')!
    expect(missingRequirements(s, crud)).toEqual(['api-2'])
    s.lessons['api-2'] = { attempts: 1, passedAt: '2026-10-13T00:00:00Z' }
    expect(missingRequirements(s, crud)).toEqual([])
  })

  it('tantangan SQL dihitung sebagai bukti skill database', () => {
    const s = createInitialState()
    s.challenges['sql-join'] = { runs: 1, hintsUsed: 0, solutionViewed: false, passedAt: '2026-10-13T00:00:00Z' }
    expect(computeSkills(s).find((e) => e.skill.id === 'database')!.level).toBe('practiced')
  })

  it('Siap deploy? memperingatkan ketergantungan pada Mock API', () => {
    const tpl = findTemplate('fs-crud')!
    const res = checkDeploy(tpl.files.map((f) => ({ path: f.path, text: f.content, size: f.content.length })))
    const item = res.find((r) => r.id === 'mockapi')!
    expect(item.status).toBe('warn')
    expect(res.find((r) => r.id === 'secrets')!.status).toBe('pass')
  })
})

const jwt = (payload: object) => `x.${btoa(JSON.stringify(payload)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.sig`

describe('Supabase', () => {
  const cfg = { url: 'https://abc.supabase.co', key: 'sb_publishable_abc' }

  it('menolak secret key & service_role, menerima publishable/anon', () => {
    expect(sb.validateConfig(cfg)).toBeNull()
    expect(sb.validateConfig({ ...cfg, key: 'sb_secret_xyz' })).toMatch(/SECRET/)
    expect(sb.validateConfig({ ...cfg, key: jwt({ role: 'service_role' }) })).toMatch(/service_role/)
    expect(sb.validateConfig({ ...cfg, key: jwt({ role: 'anon' }) })).toBeNull()
    expect(sb.validateConfig({ ...cfg, url: 'http://abc.supabase.co' })).toMatch(/https/)
    expect(sb.validateConfig({ ...cfg, url: 'https://abc.supabase.co/rest/v1' })).toMatch(/dasar/)
  })

  it('SQL penyiapan mengaktifkan RLS, policy milik sendiri, dan GRANT ke authenticated saja', () => {
    expect(sb.SETUP_SQL).toMatch(/enable row level security/)
    expect(sb.SETUP_SQL).toMatch(/auth\.uid\(\)\) = user_id/)
    expect(sb.SETUP_SQL).toMatch(/to authenticated;/)
    expect(sb.SETUP_SQL).not.toMatch(/to anon/)
  })

  it('alur login → unggah → daftar memakai header yang benar', async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const f = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      if (url.includes('/auth/v1/token')) return new Response(JSON.stringify({ access_token: 'AT', expires_in: 3600, user: { id: 'u1', email: 'a@b.c' } }), { status: 200 })
      if (init.method === 'POST') return new Response(JSON.stringify([{ id: 1, created_at: 'now', note: 'n' }]), { status: 201 })
      return new Response(JSON.stringify([{ id: 1, created_at: 'now', note: 'n' }]), { status: 200 })
    }) as unknown as typeof fetch
    const s = await sb.signIn(f, cfg, 'a@b.c', 'password1')
    expect(s.accessToken).toBe('AT')
    await sb.uploadBackup(f, cfg, s, { version: 1 }, 'catatan')
    const list = await sb.listBackups(f, cfg, s)
    expect(list).toHaveLength(1)
    const up = calls[1]
    expect(up.url).toBe('https://abc.supabase.co/rest/v1/devstudio_backups?select=id,created_at,note')
    expect((up.init.headers as Record<string, string>).apikey).toBe('sb_publishable_abc')
    expect((up.init.headers as Record<string, string>).Authorization).toBe('Bearer AT')
    expect(JSON.parse(String(up.init.body))).not.toHaveProperty('user_id')
  })

  it('menerjemahkan error umum', () => {
    expect(sb.explainError(404, { code: 'PGRST205', message: 'Could not find the table' })).toMatch(/SQL penyiapan/)
    expect(sb.explainError(400, { error_code: 'email_not_confirmed', msg: 'Email not confirmed' })).toMatch(/konfirmasi/)
    expect(sb.explainError(400, { msg: 'Invalid login credentials' })).toBe('Email atau password salah.')
  })
})
