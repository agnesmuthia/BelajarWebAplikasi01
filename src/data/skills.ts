export type SkillId =
  | 'html'
  | 'semantic-html'
  | 'css'
  | 'responsive'
  | 'layout'
  | 'accessibility'
  | 'javascript'
  | 'dom'
  | 'git'
  | 'github'
  | 'deployment'

export interface Skill {
  id: SkillId
  name: string
  description: string
}

export const SKILLS: Skill[] = [
  { id: 'html', name: 'HTML Dasar', description: 'Struktur dokumen, teks, link, dan gambar.' },
  { id: 'semantic-html', name: 'HTML Semantik', description: 'Menggunakan tag yang menjelaskan makna konten.' },
  { id: 'css', name: 'CSS Dasar', description: 'Selektor, properti, warna, tipografi, dan box model.' },
  { id: 'layout', name: 'Layout (Flexbox/Grid)', description: 'Menyusun elemen dalam baris, kolom, dan grid.' },
  { id: 'responsive', name: 'Desain Responsif', description: 'Tampilan yang nyaman di ponsel, tablet, dan desktop.' },
  { id: 'accessibility', name: 'Aksesibilitas', description: 'Website yang dapat dipakai semua orang, termasuk pengguna keyboard dan pembaca layar.' },
  { id: 'javascript', name: 'JavaScript Dasar', description: 'Variabel, fungsi, kondisi, dan perulangan.' },
  { id: 'dom', name: 'Manipulasi DOM', description: 'Mengubah halaman dengan JavaScript sebagai respons terhadap aksi pengguna.' },
  { id: 'git', name: 'Git', description: 'Mencatat versi kode dengan commit.' },
  { id: 'github', name: 'GitHub', description: 'Menyimpan dan membagikan repository secara online.' },
  { id: 'deployment', name: 'Deployment', description: 'Menerbitkan website agar bisa diakses di internet.' },
]

export const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, Skill>
