import { Fragment } from 'react'

/** Render teks sederhana: `kode` → <code>, *miring* → <em>. Tidak memakai innerHTML. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('`') && p.endsWith('`') && p.length > 1) return <code key={i}>{p.slice(1, -1)}</code>
        if (p.startsWith('*') && p.endsWith('*') && p.length > 1) return <em key={i} className="font-medium not-italic text-slate-900 dark:text-white">{p.slice(1, -1)}</em>
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}
