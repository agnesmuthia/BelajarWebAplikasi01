/**
 * Sinkronisasi cadangan progres ke Supabase milik pengguna sendiri — memakai REST API resmi
 * (Auth: /auth/v1, Data API/PostgREST: /rest/v1) dengan fetch biasa, tanpa SDK.
 *
 * Keamanan:
 * - Hanya publishable key (sb_publishable_…) atau legacy anon key yang diterima. Kunci itu memang
 *   dirancang untuk frontend; yang melindungi data adalah Row Level Security di tabel.
 * - Secret key (sb_secret_…) dan service_role DITOLAK karena melewati RLS.
 * - Token sesi hanya disimpan di sessionStorage (hilang saat tab ditutup); password tidak disimpan.
 */

export const TABLE = 'devstudio_backups'

export const SETUP_SQL = `-- Jalankan sekali di Supabase: SQL Editor → New query → Run
create table if not exists public.${TABLE} (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  note text check (char_length(note) <= 200),
  data jsonb not null check (pg_column_size(data) < 2000000)
);

-- 1) Nyalakan Row Level Security: tanpa policy, tidak ada baris yang bisa diakses.
alter table public.${TABLE} enable row level security;

-- 2) Policy: setiap pengguna hanya bisa membaca, menambah, dan menghapus cadangannya sendiri.
create policy "baca cadangan sendiri" on public.${TABLE}
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "tambah cadangan sendiri" on public.${TABLE}
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "hapus cadangan sendiri" on public.${TABLE}
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 3) Izinkan Data API mengakses tabel untuk pengguna yang login saja (bukan anon).
grant select, insert, delete on table public.${TABLE} to authenticated;
`

export interface SupabaseConfig {
  url: string
  key: string
}

export interface Session {
  accessToken: string
  expiresAt: number
  email: string
  userId: string
}

export interface BackupRow {
  id: number
  created_at: string
  note: string | null
}

function b64urlJson(part: string): Record<string, unknown> | null {
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Memeriksa URL & key. Mengembalikan pesan error, atau null jika aman dipakai di browser. */
export function validateConfig(c: SupabaseConfig): string | null {
  let u: URL
  try {
    u = new URL(c.url.trim())
  } catch {
    return 'Project URL tidak valid. Contoh: https://abcdefgh.supabase.co'
  }
  if (u.protocol !== 'https:') return 'Project URL harus diawali https://'
  if (u.pathname !== '/' && u.pathname !== '') return 'Gunakan alamat dasar proyek saja (tanpa /rest/v1 atau path lain).'
  const key = c.key.trim()
  if (!key) return 'Isi publishable key.'
  if (key.startsWith('sb_secret_')) return 'Ini SECRET key — jangan pernah dipakai di browser atau dibagikan. Ia melewati Row Level Security. Gunakan publishable key (sb_publishable_…). Jika secret key sempat ditempel di tempat publik, rotasi (buat ulang) di dashboard Supabase.'
  if (key.startsWith('sb_publishable_')) return null
  const parts = key.split('.')
  if (parts.length === 3) {
    const payload = b64urlJson(parts[1])
    if (!payload) return 'Key tidak dikenali.'
    if (payload.role === 'service_role') return 'Ini kunci service_role — setara akses admin dan melewati RLS. Jangan dipakai di frontend. Gunakan publishable key atau anon key.'
    if (payload.role === 'anon') return null
    return 'Key JWT ini bukan anon key.'
  }
  return 'Key tidak dikenali. Salin publishable key dari Supabase: Connect atau Project Settings → API Keys.'
}

export const baseUrl = (c: SupabaseConfig) => c.url.trim().replace(/\/+$/, '')

type Fetch = typeof fetch

async function call(f: Fetch, c: SupabaseConfig, path: string, init: RequestInit & { token?: string } = {}) {
  const headers: Record<string, string> = { apikey: c.key.trim(), 'Content-Type': 'application/json', ...(init.headers as Record<string, string> | undefined) }
  if (init.token) headers.Authorization = `Bearer ${init.token}`
  let res: Response
  try {
    res = await f(baseUrl(c) + path, { ...init, headers })
  } catch {
    throw new Error('Tidak bisa menghubungi Supabase. Periksa koneksi internet dan Project URL (proyek gratis yang lama tidak dipakai bisa ter-pause — aktifkan lagi di dashboard).')
  }
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) throw new Error(explainError(res.status, body))
  return body
}

export function explainError(status: number, body: unknown): string {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const raw = String(b.msg ?? b.message ?? b.error_description ?? b.error ?? (typeof body === 'string' ? body : '')).slice(0, 300)
  const code = String(b.code ?? b.error_code ?? '')
  if (code === 'PGRST205' || /could not find the table|relation .* does not exist/i.test(raw)) return `Tabel ${TABLE} belum ada atau belum diberi GRANT. Jalankan SQL penyiapan di SQL Editor Supabase. (${raw})`
  if (code === '42501' || /permission denied|row-level security/i.test(raw)) return `Ditolak oleh izin/RLS: ${raw}. Pastikan policy dan baris GRANT dari SQL penyiapan sudah dijalankan.`
  if (/email not confirmed/i.test(raw)) return 'Email belum dikonfirmasi. Buka email dari Supabase dan klik tautan konfirmasinya, lalu login lagi.'
  if (/invalid login credentials/i.test(raw)) return 'Email atau password salah.'
  if (status === 401) return `Tidak diizinkan (401): ${raw || 'periksa publishable key, atau login ulang'}.`
  if (status === 429) return 'Terlalu banyak percobaan (429). Tunggu beberapa menit.'
  return `${status}: ${raw || 'permintaan gagal'}`
}

function toSession(body: unknown): Session {
  const b = body as { access_token?: string; expires_in?: number; user?: { id?: string; email?: string } }
  if (!b?.access_token || !b.user?.id) throw new Error('Respons login tidak berisi sesi.')
  return { accessToken: b.access_token, expiresAt: Date.now() + (b.expires_in ?? 3600) * 1000, email: b.user.email ?? '', userId: b.user.id }
}

export async function signUp(f: Fetch, c: SupabaseConfig, email: string, password: string): Promise<Session | 'confirm-email'> {
  const body = await call(f, c, '/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) })
  const b = body as { access_token?: string }
  return b?.access_token ? toSession(body) : 'confirm-email'
}

export async function signIn(f: Fetch, c: SupabaseConfig, email: string, password: string): Promise<Session> {
  return toSession(await call(f, c, '/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }))
}

export async function signOut(f: Fetch, c: SupabaseConfig, s: Session) {
  await call(f, c, '/auth/v1/logout', { method: 'POST', token: s.accessToken }).catch(() => undefined)
}

export async function listBackups(f: Fetch, c: SupabaseConfig, s: Session): Promise<BackupRow[]> {
  const body = await call(f, c, `/rest/v1/${TABLE}?select=id,created_at,note&order=created_at.desc&limit=20`, { token: s.accessToken })
  return Array.isArray(body) ? (body as BackupRow[]) : []
}

export async function uploadBackup(f: Fetch, c: SupabaseConfig, s: Session, data: unknown, note: string): Promise<BackupRow> {
  const body = await call(f, c, `/rest/v1/${TABLE}?select=id,created_at,note`, { method: 'POST', token: s.accessToken, headers: { Prefer: 'return=representation' }, body: JSON.stringify({ data, note: note.slice(0, 200) || null }) })
  const row = Array.isArray(body) ? (body[0] as BackupRow | undefined) : undefined
  if (!row) throw new Error('Cadangan terkirim, tetapi Supabase tidak mengembalikan barisnya. Periksa policy SELECT.')
  return row
}

export async function fetchBackup(f: Fetch, c: SupabaseConfig, s: Session, id: number): Promise<unknown> {
  const body = await call(f, c, `/rest/v1/${TABLE}?select=data&id=eq.${encodeURIComponent(String(id))}`, { token: s.accessToken })
  const row = Array.isArray(body) ? (body[0] as { data?: unknown } | undefined) : undefined
  if (!row) throw new Error('Cadangan tidak ditemukan (mungkin milik akun lain atau sudah dihapus).')
  return row.data
}

export async function deleteBackup(f: Fetch, c: SupabaseConfig, s: Session, id: number) {
  await call(f, c, `/rest/v1/${TABLE}?id=eq.${encodeURIComponent(String(id))}`, { method: 'DELETE', token: s.accessToken })
}

/* ---------------------------- penyimpanan lokal ---------------------------- */

const CFG_KEY = 'devstudio-supabase-config'
const SES_KEY = 'devstudio-supabase-session'

export function loadConfig(): SupabaseConfig | null {
  try {
    const c = JSON.parse(localStorage.getItem(CFG_KEY) ?? 'null') as SupabaseConfig | null
    return c && typeof c.url === 'string' && typeof c.key === 'string' && !validateConfig(c) ? c : null
  } catch {
    return null
  }
}

export function saveConfig(c: SupabaseConfig | null) {
  try {
    if (c) localStorage.setItem(CFG_KEY, JSON.stringify({ url: c.url.trim(), key: c.key.trim() }))
    else localStorage.removeItem(CFG_KEY)
  } catch {
    /* abaikan */
  }
}

export function loadSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(SES_KEY) ?? 'null') as Session | null
    return s && typeof s.accessToken === 'string' && s.expiresAt > Date.now() + 30_000 ? s : null
  } catch {
    return null
  }
}

export function saveSession(s: Session | null) {
  try {
    if (s) sessionStorage.setItem(SES_KEY, JSON.stringify(s))
    else sessionStorage.removeItem(SES_KEY)
  } catch {
    /* abaikan */
  }
}
