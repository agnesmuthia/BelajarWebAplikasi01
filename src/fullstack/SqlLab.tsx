import { CheckCircle2, Circle, Database as DbIcon, Eye, Lightbulb, Loader2, Play, RotateCcw, ShieldCheck, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Database, SqlJsStatic } from 'sql.js'
import { Badge, cx } from '../components/ui'
import { SQL_CHALLENGES } from '../data/sqlChallenges'
import { CodeEditor } from '../lab/CodeEditor'
import { useStore } from '../lib/store'
import { checkSql, explainSqlError, freshDb, runOn, type CheckOutcome, type RunOutcome, type SqlResult } from './sql'
import { loadSqlJs } from './sqlLoader'

const FREE = 'free'
const draftKey = (id: string) => `devstudio-sql-draft:${id}`
const readDraft = (id: string) => {
  try {
    return localStorage.getItem(draftKey(id))
  } catch {
    return null
  }
}
const writeDraft = (id: string, v: string) => {
  try {
    localStorage.setItem(draftKey(id), v)
  } catch {
    /* penyimpanan penuh — abaikan */
  }
}

const FREE_STARTER = `-- Mode bebas: database tetap ada selama halaman terbuka.
-- Coba: lihat semua tabel
SELECT name FROM sqlite_master WHERE type = 'table';
`

export function ResultTable({ r }: { r: SqlResult }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
      <table className="w-full font-mono text-xs">
        <thead className="bg-slate-100 dark:bg-white/5"><tr>{r.columns.map((c, i) => <th key={i} className="px-2 py-1 text-left font-semibold">{c}</th>)}</tr></thead>
        <tbody>
          {r.rows.slice(0, 200).map((row, i) => (
            <tr key={i} className="border-t border-slate-200 dark:border-white/5">
              {row.map((v, j) => <td key={j} className={cx('px-2 py-1', v === null && 'text-slate-400 italic')}>{v === null ? 'NULL' : v instanceof Uint8Array ? `[blob]` : String(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted border-t border-slate-200 px-2 py-1 text-[11px] dark:border-white/10">{r.rows.length} baris{r.rows.length > 200 ? ' (200 pertama ditampilkan)' : ''}</p>
    </div>
  )
}

/** SQL Lab: SQLite sungguhan di browser dengan 10 tantangan terperiksa otomatis. */
export function SqlLab() {
  const { state, recordChallenge } = useStore()
  const [SQL, setSQL] = useState<SqlJsStatic | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [current, setCurrent] = useState<string>(SQL_CHALLENGES.find((c) => !state.challenges[c.id]?.passedAt)?.id ?? SQL_CHALLENGES[0].id)
  const ch = SQL_CHALLENGES.find((c) => c.id === current)
  const [code, setCode] = useState(() => readDraft(current) ?? ch?.starter ?? FREE_STARTER)
  const [out, setOut] = useState<RunOutcome | null>(null)
  const [check, setCheck] = useState<CheckOutcome | null>(null)
  const [hints, setHints] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const freeDb = useRef<Database | null>(null)
  const [schema, setSchema] = useState<{ table: string; cols: string[] }[]>([])

  useEffect(() => {
    loadSqlJs().then(setSQL, (e) => setLoadError(e instanceof Error ? e.message : String(e)))
    return () => freeDb.current?.close()
  }, [])

  const refreshSchema = useCallback((db: Database) => {
    const t = runOn(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    const tables = (t.results[0]?.rows ?? []).map((r) => String(r[0]))
    setSchema(tables.map((name) => ({ table: name, cols: (runOn(db, `SELECT name || ' ' || type || CASE WHEN pk THEN ' PK' ELSE '' END || CASE WHEN "notnull" THEN ' NOT NULL' ELSE '' END FROM pragma_table_info('${name.replace(/'/g, "''")}')`).results[0]?.rows ?? []).map((r) => String(r[0])) })))
  }, [])

  useEffect(() => {
    if (!SQL) return
    const db = freshDb(SQL)
    refreshSchema(db)
    db.close()
  }, [SQL, refreshSchema])

  const select = (id: string) => {
    setCurrent(id)
    const c = SQL_CHALLENGES.find((x) => x.id === id)
    setCode(readDraft(id) ?? c?.starter ?? FREE_STARTER)
    setOut(null)
    setCheck(null)
    setHints(0)
    setShowSolution(false)
  }

  const onChange = (v: string) => {
    setCode(v)
    writeDraft(current, v)
  }

  const run = () => {
    if (!SQL) return
    if (current === FREE) {
      if (!freeDb.current) freeDb.current = freshDb(SQL)
      const r = runOn(freeDb.current, code)
      setOut(r)
      refreshSchema(freeDb.current)
      return
    }
    // Tantangan: selalu database baru agar hasil bisa dibandingkan.
    const db = freshDb(SQL)
    try {
      setOut(runOn(db, code))
    } finally {
      db.close()
    }
    if (ch) recordChallenge(ch.id, { run: true })
  }

  const doCheck = () => {
    if (!SQL || !ch) return
    const r = checkSql(SQL, ch, code)
    setCheck(r)
    setOut(r.actual)
    recordChallenge(ch.id, { run: true, passed: r.pass })
  }

  const resetFree = () => {
    freeDb.current?.close()
    freeDb.current = null
    setOut(null)
    if (SQL) {
      const db = freshDb(SQL)
      refreshSchema(db)
      db.close()
    }
  }

  const passed = useMemo(() => SQL_CHALLENGES.filter((c) => state.challenges[c.id]?.passedAt).length, [state.challenges])
  const err = out?.error ?? null

  return (
    <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="card h-fit p-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Tantangan · {passed}/{SQL_CHALLENGES.length}</p>
        <ol className="space-y-0.5">
          {SQL_CHALLENGES.map((c, i) => {
            const p = state.challenges[c.id]
            return (
              <li key={c.id}>
                <button onClick={() => select(c.id)} className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm', current === c.id ? 'bg-indigo-500/10 text-indigo-700 dark:text-cyan-300' : 'hover:bg-slate-100 dark:hover:bg-white/5')} aria-current={current === c.id}>
                  {p?.passedAt ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-label="Lulus" /> : <Circle className="size-4 shrink-0 text-slate-400" />}
                  <span className="truncate">{i + 1}. {c.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
        <button onClick={() => select(FREE)} className={cx('mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-2 py-1.5 text-left text-sm dark:border-white/15', current === FREE && 'bg-indigo-500/10')}>
          <DbIcon className="size-4" /> Mode bebas
        </button>
        <p className="muted mt-3 text-[11px]">SQLite asli (WebAssembly) di browsermu. Data contoh fiktif; tidak ada yang dikirim ke server.</p>
      </aside>

      <div className="min-w-0 space-y-4">
        <section className="card p-4">
          {ch ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{ch.title}</h2>
                <Badge tone={ch.kind === 'query' ? 'cyan' : 'violet'}>{ch.kind === 'query' ? 'Membaca data' : 'Mengubah data'}</Badge>
                {state.challenges[ch.id]?.passedAt && <Badge tone="emerald">Lulus</Badge>}
              </div>
              <p className="mt-1.5 text-sm">{ch.brief}</p>
              <ul className="muted mt-2 list-disc space-y-0.5 pl-5 text-sm">{ch.instructions.map((x) => <li key={x}>{x}</li>)}</ul>
            </>
          ) : (
            <>
              <h2 className="font-semibold">Mode bebas</h2>
              <p className="muted mt-1 text-sm">Database bertahan selama halaman terbuka — perubahan (INSERT/UPDATE/DELETE/CREATE) terlihat di query berikutnya. Tekan Reset untuk kembali ke data contoh.</p>
            </>
          )}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
          <section className="card flex flex-col self-start overflow-hidden">
            <div className="code-surface h-56">
              {SQL || loadError ? <CodeEditor file={`sql:${current}`} lang="sql" value={code} onChange={onChange} onRun={ch ? doCheck : run} onFormat={() => undefined} label="Editor SQL" /> : <p className="muted p-4 text-sm"><Loader2 className="mr-2 inline size-4 animate-spin" />Memuat SQLite…</p>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200 p-2 dark:border-white/10">
              <button className="btn-secondary px-3 py-1.5" onClick={run} disabled={!SQL}><Play className="size-4" /> Jalankan</button>
              {ch && <button className="btn-primary px-3 py-1.5" onClick={doCheck} disabled={!SQL}><ShieldCheck className="size-4" /> Periksa</button>}
              {ch ? (
                <>
                  <button className="btn-ghost px-2 py-1.5 text-xs" onClick={() => { setCode(ch.starter); writeDraft(ch.id, ch.starter) }}><RotateCcw className="size-3.5" /> Kode awal</button>
                  {hints < ch.hints.length && <button className="btn-ghost px-2 py-1.5 text-xs" onClick={() => { setHints((h) => h + 1); recordChallenge(ch.id, { hint: true }) }}><Lightbulb className="size-3.5" /> Petunjuk {hints + 1}</button>}
                  <button className="btn-ghost px-2 py-1.5 text-xs" onClick={() => { if (showSolution || state.challenges[ch.id]?.passedAt || confirm('Lihat solusi? Jika dibuka sebelum lulus, tantangan ini tidak dihitung sebagai bukti skill.')) { setShowSolution(true); if (!state.challenges[ch.id]?.passedAt) recordChallenge(ch.id, { solution: true }) } }}><Eye className="size-3.5" /> Solusi</button>
                </>
              ) : (
                <button className="btn-ghost px-2 py-1.5 text-xs" onClick={resetFree}><RotateCcw className="size-3.5" /> Reset database</button>
              )}
              <span className="muted ml-auto text-[11px]">Ctrl/⌘ + Enter = {ch ? 'periksa' : 'jalankan'}</span>
            </div>
          </section>

          <aside className="card p-3 text-xs">
            <p className="mb-2 font-semibold">Struktur tabel</p>
            {schema.length === 0 ? <p className="muted">Memuat…</p> : (
              <ul className="space-y-2 font-mono">
                {schema.map((t) => (
                  <li key={t.table}><b>{t.table}</b><ul className="muted pl-3">{t.cols.map((c) => <li key={c}>{c}</li>)}</ul></li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        {loadError && <p className="card p-3 text-sm text-rose-600">SQLite gagal dimuat: {loadError}. Coba muat ulang halaman.</p>}

        {ch && hints > 0 && (
          <ul className="space-y-1.5">
            {ch.hints.slice(0, hints).map((h, i) => <li key={h} className="card flex gap-2 p-3 text-sm"><Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" /> <span><b>Petunjuk {i + 1}:</b> <code className="font-mono">{h}</code></span></li>)}
          </ul>
        )}
        {ch && showSolution && <pre className="card code-surface overflow-auto p-3 font-mono text-xs">{ch.solution}</pre>}

        {check && (
          <div className={cx('card p-3 text-sm', check.pass ? 'border-emerald-300 dark:border-emerald-500/40' : 'border-rose-300 dark:border-rose-500/40')} role="status">
            <p className="flex items-center gap-2 font-semibold">{check.pass ? <><CheckCircle2 className="size-4 text-emerald-500" /> Benar! Hasilmu sama dengan yang diharapkan.</> : <><XCircle className="size-4 text-rose-500" /> Belum tepat</>}</p>
            {check.messages.map((m) => <p key={m} className="mt-1">{m}</p>)}
            {!check.pass && check.expected.length > 0 && !check.actual.error && (
              <details className="mt-2"><summary className="cursor-pointer text-xs">Lihat bentuk hasil yang diharapkan</summary><div className="mt-2 space-y-2">{check.expected.map((r, i) => <ResultTable key={i} r={{ columns: r.columns, rows: r.rows.slice(0, 5) }} />)}<p className="muted text-[11px]">Hanya 5 baris pertama — tujuannya memahami bentuknya, bukan menyalin.</p></div></details>
            )}
          </div>
        )}

        {out && (
          <section className="space-y-2">
            {err ? (
              <div className="card border-rose-300 p-3 text-sm dark:border-rose-500/40">
                <p className="font-mono text-rose-700 dark:text-rose-300">{err}</p>
                {explainSqlError(err) && <p className="mt-1">{explainSqlError(err)}</p>}
              </div>
            ) : out.results.length === 0 ? (
              <p className="card p-3 text-sm">Berhasil. {out.changes ? `${out.changes} baris berubah.` : 'Tidak ada tabel hasil (pernyataan terakhir bukan SELECT).'}</p>
            ) : (
              out.results.map((r, i) => <ResultTable key={i} r={r} />)
            )}
          </section>
        )}
      </div>
    </div>
  )
}
