import initSqlJs, { type SqlJsStatic } from 'sql.js'
import { createRequire } from 'node:module'
import { beforeAll, describe, expect, it } from 'vitest'
import { SQL_CHALLENGES } from '../data/sqlChallenges'
import { checkSql, explainSqlError, runSql } from '../fullstack/sql'

let SQL: SqlJsStatic
beforeAll(async () => {
  const require = createRequire(import.meta.url)
  const wasm = require.resolve('sql.js/dist/sql-wasm.wasm')
  SQL = await initSqlJs({ locateFile: () => wasm })
})

describe('SQL Lab', () => {
  it('data contoh termuat', () => {
    const r = runSql(SQL, 'SELECT COUNT(*) FROM siswa; SELECT COUNT(*) FROM nilai;')
    expect(r.error).toBeNull()
    expect(r.results.map((x) => x.rows[0][0])).toEqual([10, 15])
  })

  it.each(SQL_CHALLENGES.map((c) => [c.id, c] as const))('solusi %s lulus pemeriksa', (_id, c) => {
    const r = checkSql(SQL, c, c.solution)
    expect(r.messages).toEqual([])
    expect(r.pass).toBe(true)
  })

  it.each(SQL_CHALLENGES.map((c) => [c.id, c] as const))('starter %s tidak lulus', (_id, c) => {
    expect(checkSql(SQL, c, c.starter).pass).toBe(false)
  })

  it('urutan salah diberi pesan ORDER BY', () => {
    const c = SQL_CHALLENGES.find((x) => x.id === 'sql-order')!
    const r = checkSql(SQL, c, 'SELECT nama, kota FROM siswa ORDER BY nama DESC;')
    expect(r.pass).toBe(false)
    expect(r.messages[0]).toMatch(/urutannya berbeda/)
  })

  it('UPDATE tanpa WHERE terdeteksi', () => {
    const c = SQL_CHALLENGES.find((x) => x.id === 'sql-update')!
    expect(checkSql(SQL, c, "UPDATE siswa SET kota = 'Makassar';").pass).toBe(false)
  })

  it('variasi penulisan yang benar diterima', () => {
    const c = SQL_CHALLENGES.find((x) => x.id === 'sql-where')!
    expect(checkSql(SQL, c, "select nama from siswa where tahun_masuk=2025 and kota='Takalar'").pass).toBe(true)
    const cr = SQL_CHALLENGES.find((x) => x.id === 'sql-create')!
    expect(checkSql(SQL, cr, 'create table ekskul (id integer primary key, nama text unique not null, pembina text)').pass).toBe(true)
  })

  it('menjelaskan error umum', () => {
    const r = runSql(SQL, 'SELECT * FROM murid')
    expect(explainSqlError(r.error!)).toMatch(/tabel/)
    expect(explainSqlError(runSql(SQL, "SELECT nama FROM siswa WHERE kota = Takalar").error!)).toMatch(/kutip/)
  })
})
