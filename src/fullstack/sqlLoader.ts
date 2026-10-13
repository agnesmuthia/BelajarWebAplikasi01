import type { SqlJsStatic } from 'sql.js'

let loading: Promise<SqlJsStatic> | null = null

/** Memuat SQLite WebAssembly (±650 KB) hanya saat SQL Lab dibuka. */
export function loadSqlJs(): Promise<SqlJsStatic> {
  if (!loading) {
    loading = Promise.all([import('sql.js'), import('sql.js/dist/sql-wasm-browser.wasm?url')])
      .then(([mod, wasm]) => mod.default({ locateFile: () => wasm.default }))
      .catch((e) => {
        loading = null
        throw e
      })
  }
  return loading
}
