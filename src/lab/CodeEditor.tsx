import { indentWithTab } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { SQLite, sql } from '@codemirror/lang-sql'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState, Prec, type Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { basicSetup } from 'codemirror'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

/** Warna sintaks memakai class yang sama dengan CodeBlock (tok-*), jadi otomatis ikut tema terang/gelap. */
const highlight = HighlightStyle.define([
  { tag: [t.comment, t.lineComment, t.blockComment], class: 'tok-comment' },
  { tag: [t.tagName, t.angleBracket, t.className], class: 'tok-tag' },
  { tag: [t.attributeName, t.propertyName], class: 'tok-attr' },
  { tag: [t.string, t.special(t.string), t.attributeValue, t.regexp], class: 'tok-string' },
  { tag: [t.number, t.bool, t.null, t.color, t.unit], class: 'tok-number' },
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.modifier, t.operatorKeyword, t.moduleKeyword], class: 'tok-keyword' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], class: 'tok-fn' },
  { tag: [t.documentMeta, t.processingInstruction, t.atom], class: 'tok-meta' },
])

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '13.5px', backgroundColor: 'transparent' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
  '.cm-content': { padding: '10px 0' },
  '&.cm-focused': { outline: 'none' },
})

export type EditorLang = 'html' | 'css' | 'js' | 'json' | 'md' | 'sql' | 'text'

const langExt: Record<EditorLang, () => Extension> = {
  html: () => html({ autoCloseTags: true }),
  css: () => css(),
  js: () => javascript(),
  json: () => json(),
  md: () => markdown(),
  sql: () => sql({ dialect: SQLite }),
  text: () => [],
}

export interface CodeEditorHandle {
  /** Teks yang diseleksi, atau baris tempat kursor berada. */
  selectionOrLine: () => string
  goToLine: (line: number) => void
  focus: () => void
}

interface Props {
  /** Identitas dokumen (nama file/path). State & undo disimpan per docId. */
  file: string
  lang: EditorLang
  value: string
  onChange: (value: string) => void
  onRun: () => void
  onFormat: () => void
  label: string
}

/**
 * Editor CodeMirror 6. Satu EditorView dipakai bergantian untuk tiga file;
 * state setiap file (termasuk riwayat undo) disimpan terpisah.
 */
export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor({ file, lang, value, onChange, onRun, onFormat, label }, ref) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const states = useRef(new Map<string, EditorState>())
  const currentFile = useRef(file)
  const cb = useRef({ onChange, onRun, onFormat })
  cb.current = { onChange, onRun, onFormat }

  const makeState = (l: EditorLang, doc: string) =>
    EditorState.create({
      doc,
      extensions: [
        Prec.highest(
          keymap.of([
            { key: 'Mod-Enter', run: () => (cb.current.onRun(), true) },
            { key: 'Mod-s', run: () => (cb.current.onRun(), true), preventDefault: true },
            { key: 'Shift-Alt-f', run: () => (cb.current.onFormat(), true) },
          ]),
        ),
        basicSetup,
        keymap.of([indentWithTab]),
        langExt[l](),
        syntaxHighlighting(highlight),
        theme,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ 'aria-label': label }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) cb.current.onChange(u.state.doc.toString())
        }),
      ],
    })

  // Buat view sekali.
  useEffect(() => {
    const v = new EditorView({ state: makeState(lang, value), parent: host.current! })
    view.current = v
    return () => v.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ganti file: simpan state lama, pulihkan/buat state file baru.
  useEffect(() => {
    const v = view.current
    if (!v || currentFile.current === file) return
    states.current.set(currentFile.current, v.state)
    currentFile.current = file
    const saved = states.current.get(file)
    v.setState(saved && saved.doc.toString() === value ? saved : makeState(lang, value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  // Nilai berubah dari luar (Reset, Format, Solusi): ganti isi tanpa membuang riwayat undo.
  useEffect(() => {
    const v = view.current
    if (!v || currentFile.current !== file) return
    const cur = v.state.doc.toString()
    if (cur !== value) v.dispatch({ changes: { from: 0, to: cur.length, insert: value } })
  }, [value, file])

  useImperativeHandle(ref, () => ({
    selectionOrLine: () => {
      const v = view.current
      if (!v) return ''
      const sel = v.state.selection.main
      if (!sel.empty) return v.state.sliceDoc(sel.from, sel.to)
      return v.state.doc.lineAt(sel.head).text
    },
    goToLine: (line: number) => {
      const v = view.current
      if (!v) return
      const l = v.state.doc.line(Math.min(Math.max(1, line), v.state.doc.lines))
      v.dispatch({ selection: { anchor: l.from, head: l.to }, scrollIntoView: true })
      v.focus()
    },
    focus: () => view.current?.focus(),
  }))

  return <div ref={host} className="lab-editor h-full min-h-0 overflow-hidden" />
})
