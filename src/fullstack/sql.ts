import type { Database, SqlJsStatic, SqlValue } from 'sql.js'

/**
 * SQL Lab: SQLite sungguhan (sql.js / WebAssembly) yang berjalan di memori browser.
 * Setiap pemeriksaan memakai database baru dari SEED_SQL, jadi latihan tidak saling memengaruhi
 * dan tidak ada data yang keluar dari komputer pengguna.
 */

/** Data contoh FIKTIF — nama dan nilai dibuat untuk latihan, bukan data siswa sungguhan. */
export const SEED_SQL = `PRAGMA foreign_keys = ON;

CREATE TABLE kelas (
  id INTEGER PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE,
  wali_kelas TEXT
);

CREATE TABLE siswa (
  id INTEGER PRIMARY KEY,
  nama TEXT NOT NULL,
  kelas_id INTEGER REFERENCES kelas(id),
  kota TEXT,
  tahun_masuk INTEGER
);

CREATE TABLE mapel (
  id INTEGER PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE
);

CREATE TABLE nilai (
  id INTEGER PRIMARY KEY,
  siswa_id INTEGER NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  mapel_id INTEGER NOT NULL REFERENCES mapel(id),
  skor INTEGER NOT NULL CHECK (skor BETWEEN 0 AND 100)
);

INSERT INTO kelas (id, nama, wali_kelas) VALUES
  (1, 'X-1', 'Guru A'), (2, 'X-2', 'Guru B'), (3, 'XI-1', 'Guru C');

INSERT INTO siswa (id, nama, kelas_id, kota, tahun_masuk) VALUES
  (1, 'Andi', 1, 'Takalar', 2025),
  (2, 'Budi', 1, 'Makassar', 2025),
  (3, 'Citra', 2, 'Takalar', 2025),
  (4, 'Dewi', 2, 'Gowa', 2025),
  (5, 'Eka', 3, 'Takalar', 2024),
  (6, 'Fajar', 3, 'Makassar', 2024),
  (7, 'Gita', 1, 'Gowa', 2025),
  (8, 'Hadi', 3, 'Takalar', 2024),
  (9, 'Indah', 2, 'Makassar', 2025),
  (10, 'Joko', NULL, 'Takalar', 2024);

INSERT INTO mapel (id, nama) VALUES (1, 'Matematika'), (2, 'Bahasa Indonesia'), (3, 'Informatika');

INSERT INTO nilai (id, siswa_id, mapel_id, skor) VALUES
  (1, 1, 1, 78), (2, 1, 3, 90), (3, 2, 1, 65), (4, 2, 2, 80),
  (5, 3, 1, 88), (6, 3, 3, 95), (7, 4, 2, 72), (8, 5, 1, 55),
  (9, 5, 3, 82), (10, 6, 2, 90), (11, 7, 1, 70), (12, 8, 3, 76),
  (13, 9, 2, 85), (14, 10, 1, 60), (15, 10, 3, 68);
`

export interface SqlResult {
  columns: string[]
  rows: SqlValue[][]
}

export interface RunOutcome {
  results: SqlResult[]
  error: string | null
  /** Jumlah baris yang diubah oleh pernyataan terakhir (INSERT/UPDATE/DELETE). */
  changes: number
}

export function freshDb(SQL: SqlJsStatic): Database {
  const db = new SQL.Database()
  db.exec(SEED_SQL)
  return db
}

export function runOn(db: Database, sql: string): RunOutcome {
  try {
    const res = db.exec(sql)
    return { results: res.map((r) => ({ columns: r.columns, rows: r.values })), error: null, changes: db.getRowsModified() }
  } catch (e) {
    return { results: [], error: e instanceof Error ? e.message : String(e), changes: 0 }
  }
}

/** Jalankan SQL pada database baru (data contoh). */
export function runSql(SQL: SqlJsStatic, sql: string): RunOutcome {
  const db = freshDb(SQL)
  try {
    return runOn(db, sql)
  } finally {
    db.close()
  }
}

/** Penjelasan error SQLite yang umum dalam bahasa Indonesia. */
export function explainSqlError(msg: string): string | null {
  const m = msg.toLowerCase()
  if (m.includes('no such table')) return 'Nama tabel tidak ditemukan. Periksa ejaan — tabel yang tersedia: kelas, siswa, mapel, nilai.'
  if (m.includes('no such column')) return 'Nama kolom tidak ditemukan. Periksa ejaan, atau jika memakai JOIN, tulis nama_tabel.kolom. Teks harus diapit tanda kutip tunggal: \'Takalar\' — tanpa kutip, SQL mengira itu nama kolom.'
  if (m.includes('syntax error') || m.includes('incomplete input')) return 'Ada kesalahan penulisan. Periksa koma antar kolom, tanda kutip tunggal untuk teks, urutan klausa (SELECT … FROM … WHERE … GROUP BY … ORDER BY …), dan titik koma.'
  if (m.includes('not null constraint')) return 'Kolom yang wajib (NOT NULL) tidak diisi.'
  if (m.includes('unique constraint')) return 'Nilai sudah ada di kolom yang harus unik (UNIQUE / PRIMARY KEY).'
  if (m.includes('foreign key constraint')) return 'Foreign key gagal: id yang dirujuk tidak ada di tabel induk, atau baris masih dirujuk tabel lain.'
  if (m.includes('check constraint')) return 'Nilai melanggar aturan CHECK, mis. skor harus 0–100.'
  if (m.includes('ambiguous column')) return 'Nama kolom ada di lebih dari satu tabel pada JOIN. Tulis lengkap, mis. siswa.nama atau kelas.nama.'
  if (m.includes('misuse of aggregate')) return 'Fungsi agregat (COUNT, AVG, SUM) tidak boleh di WHERE. Pakai HAVING setelah GROUP BY.'
  if (m.includes('already exists')) return 'Tabel dengan nama itu sudah ada.'
  return null
}

/* ------------------------------ pemeriksa ------------------------------ */

export interface SqlChallenge {
  id: string
  title: string
  kind: 'query' | 'change'
  brief: string
  instructions: string[]
  starter: string
  solution: string
  /** Untuk kind 'change': query yang dijalankan SETELAH SQL pengguna untuk membandingkan isi tabel. */
  verify?: string
  /** Urutan baris harus sama (soal yang meminta ORDER BY). */
  ordered?: boolean
  hints: string[]
  lesson: string
}

export interface CheckOutcome {
  pass: boolean
  messages: string[]
  actual: RunOutcome
  expected: SqlResult[]
}

const norm = (v: SqlValue) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v instanceof Uint8Array ? `[blob ${v.length}]` : v)
const rowKey = (r: SqlValue[]) => JSON.stringify(r.map(norm))

function compareSets(actual: SqlResult[], expected: SqlResult[], ordered: boolean, what: string): string[] {
  const msgs: string[] = []
  if (actual.length < expected.length) return [`${what}: tidak ada hasil tabel. Pastikan pernyataan terakhir adalah SELECT.`]
  // Bandingkan hasil terakhir (SQL pengguna boleh berisi beberapa pernyataan).
  const a = actual.slice(-expected.length)
  expected.forEach((e, i) => {
    const x = a[i]
    if (x.columns.length !== e.columns.length) {
      msgs.push(`${what}: ${x.columns.length} kolom (${x.columns.join(', ')}), diharapkan ${e.columns.length} kolom (${e.columns.join(', ')}).`)
      return
    }
    if (x.rows.length !== e.rows.length) {
      msgs.push(`${what}: ${x.rows.length} baris, diharapkan ${e.rows.length} baris.`)
      return
    }
    const ak = x.rows.map(rowKey)
    const ek = e.rows.map(rowKey)
    if (ordered) {
      const sameSet = [...ak].sort().join('|') === [...ek].sort().join('|')
      const idx = ak.findIndex((k, j) => k !== ek[j])
      if (idx === -1) return
      msgs.push(sameSet ? `${what}: isinya benar, tetapi urutannya berbeda. Periksa ORDER BY (ASC = naik, DESC = turun).` : `${what}: baris ke-${idx + 1} adalah ${ak[idx]}, diharapkan ${ek[idx]}.`)
    } else {
      const as = [...ak].sort()
      const es = [...ek].sort()
      const idx = as.findIndex((k, j) => k !== es[j])
      if (idx !== -1) {
        const missing = ek.find((k) => !ak.includes(k))
        msgs.push(`${what}: isi baris berbeda${missing ? ` — mis. baris ${missing} tidak ada di hasilmu` : ''}.`)
      }
    }
  })
  return msgs
}

export function checkSql(SQL: SqlJsStatic, ch: SqlChallenge, userSql: string): CheckOutcome {
  if (!userSql.trim()) return { pass: false, messages: ['Tulis SQL dulu.'], actual: { results: [], error: null, changes: 0 }, expected: [] }
  if (ch.kind === 'query') {
    const expected = runSql(SQL, ch.solution).results
    const actual = runSql(SQL, userSql)
    if (actual.error) return { pass: false, messages: [`Error: ${actual.error}`], actual, expected }
    const messages = compareSets(actual.results, expected, !!ch.ordered, 'Hasil')
    return { pass: messages.length === 0, messages, actual, expected }
  }
  const verify = ch.verify ?? ''
  const exDb = freshDb(SQL)
  const acDb = freshDb(SQL)
  try {
    runOn(exDb, ch.solution)
    const expected = runOn(exDb, verify).results
    const actual = runOn(acDb, userSql)
    if (actual.error) return { pass: false, messages: [`Error: ${actual.error}`], actual, expected }
    const after = runOn(acDb, verify)
    const messages = after.error ? [`Tabel tidak bisa diperiksa: ${after.error}`] : compareSets(after.results, expected, true, 'Isi tabel setelah SQL-mu')
    return { pass: messages.length === 0, messages, actual: { ...actual, results: after.results.length ? after.results : actual.results }, expected }
  } finally {
    exDb.close()
    acDb.close()
  }
}
