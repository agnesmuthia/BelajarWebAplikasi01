import { ArrowLeft, FileCode2, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PLAYGROUND_TEMPLATES, baseCss, page } from '../../data/challenges'
import { findLesson } from '../../data/curriculum'
import { LabWorkspace } from '../../lab/LabWorkspace'
import type { LabFiles } from '../../lab/runtime'
import { cx } from '../../components/ui'
import NotFound from '../NotFound'

/** Template playground, atau contoh kode dari pelajaran (id: lesson-<lessonId>). */
function resolve(id: string): { title: string; description: string; files: LabFiles } | null {
  const tpl = PLAYGROUND_TEMPLATES.find((t) => t.id === id)
  if (tpl) return tpl
  if (id.startsWith('lesson-')) {
    const l = findLesson(id.slice(7))
    if (!l) return null
    const ex = l.example
    if (ex.language === 'js') return { title: `Contoh: ${l.title}`, description: ex.caption, files: { html: page(l.title, '  <h1>Buka tab Console untuk melihat hasil</h1>'), css: baseCss, js: ex.code + '\n' } }
    if (ex.language === 'html') return { title: `Contoh: ${l.title}`, description: ex.caption, files: { html: page(l.title, ex.code.split('\n').map((x) => '  ' + x).join('\n')), css: baseCss, js: '' } }
  }
  return null
}

export default function LabPlayground() {
  const { templateId = 'kosong' } = useParams()
  const r = resolve(templateId)
  if (!r) return <NotFound />

  const sidebar = (
    <div className="space-y-5">
      <div>
        <Link to="/lab" className="btn-ghost -ml-2 mb-2 px-2 py-1 text-xs"><ArrowLeft className="size-3.5" /> Coding Lab</Link>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{r.title}</h1>
        <p className="muted mt-1 text-sm">{r.description}</p>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Template lain</h2>
        <ul className="space-y-1">
          {PLAYGROUND_TEMPLATES.map((t) => (
            <li key={t.id}>
              <Link to={`/lab/play/${t.id}`} className={cx('flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm', t.id === templateId ? 'bg-indigo-500/10 font-medium text-indigo-700 dark:text-cyan-300' : 'hover:bg-slate-100 dark:hover:bg-white/5')}>
                <FileCode2 className="size-4" /> {t.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
        <p className="mb-1.5 flex items-center gap-1.5 font-semibold"><ShieldCheck className="size-4 text-emerald-500" /> Tentang preview</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>Kode berjalan di iframe terisolasi: tidak bisa membaca data DevStudio atau mengirim data ke internet (fetch diblokir).</li>
          <li>Gambar & font dari alamat https boleh dipakai. File lokal seperti assets/foto.jpg belum didukung.</li>
          <li>alert/prompt ditampilkan di Console. Loop yang berjalan &gt; 1 detik dihentikan.</li>
          <li>Hanya HTML, CSS, dan JavaScript biasa — npm, React, dan import modul belum didukung di sini.</li>
        </ul>
      </div>
    </div>
  )

  return <LabWorkspace key={templateId} draftId={`playground:${templateId}`} title={r.title} starter={r.files} sidebar={sidebar} />
}
